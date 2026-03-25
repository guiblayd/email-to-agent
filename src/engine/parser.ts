import type { ParsedData, NormalizedDate, NormalizedTime, Language, DateStatus, InputFidelity, CtaElement } from '../types';
import { detectLanguage }      from './language';
import { enRules, ptRules }    from './rules';
import type { Rules }          from './rules';
import { parseHtmlForCtas }    from './htmlParser';
import { inferSuspectedCtas }  from './ctaInference';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** If the given month+day has already passed this year, assume next year. */
function resolveYear(month: number, day: number, today: Date): number {
  const thisYear = today.getFullYear();
  const candidate = new Date(thisYear, month - 1, day);
  return candidate < today ? thisYear + 1 : thisYear;
}

// ─── Time normalizer ──────────────────────────────────────────────────────────

/** Converts any recognised time string to "HH:mm" (24-hour). */
export function normalizeTime(raw: string): string {
  const s = raw.trim();

  // 19h30 | 7h30
  const hMin = s.match(/^(\d{1,2})h(\d{2})$/i);
  if (hMin) return `${pad(+hMin[1])}:${pad(+hMin[2])}`;

  // 19h | 7h
  const hOnly = s.match(/^(\d{1,2})h$/i);
  if (hOnly) return `${pad(+hOnly[1])}:00`;

  // 7:30pm | 07:30 PM
  const colonAmPm = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (colonAmPm) {
    let hr = +colonAmPm[1];
    const min = +colonAmPm[2];
    const pm = colonAmPm[3].toLowerCase() === 'pm';
    if (pm && hr < 12) hr += 12;
    if (!pm && hr === 12) hr = 0;
    return `${pad(hr)}:${pad(min)}`;
  }

  // 7pm | 7 pm
  const amPm = s.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (amPm) {
    let hr = +amPm[1];
    const pm = amPm[2].toLowerCase() === 'pm';
    if (pm && hr < 12) hr += 12;
    if (!pm && hr === 12) hr = 0;
    return `${pad(hr)}:00`;
  }

  // HH:mm  (24-hour, no suffix)
  const colon = s.match(/^(\d{1,2}):(\d{2})$/);
  if (colon) return `${pad(+colon[1])}:${pad(+colon[2])}`;

  return s; // unchanged fallback
}

// ─── Date normalizer ──────────────────────────────────────────────────────────

/** DD/MM/YYYY or MM/DD/YYYY → ISO. Defaults to DD/MM when ambiguous. */
function normalizeNumericDate(raw: string): string | null {
  const m = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (!m) return null;
  const a = +m[1], b = +m[2];
  let yr = +m[3];
  if (yr < 100) yr += 2000;
  if (a > 12) return toISO(yr, b, a); // definitely DD/MM
  if (b > 12) return toISO(yr, a, b); // definitely MM/DD
  return toISO(yr, b, a);             // ambiguous → assume DD/MM
}

/** Scan `text` for "Month DD" or "DD Month" patterns using the given month map. */
function extractMonthNameDates(text: string, rules: Rules, today: Date): NormalizedDate[] {
  const results: NormalizedDate[] = [];
  const lower = text.toLowerCase();

  for (const [name, monthNum] of Object.entries(rules.monthNames)) {
    const idx = lower.indexOf(name);
    if (idx === -1) continue;

    // Grab a generous context window around the month name
    const start = Math.max(0, idx - 15);
    const end = Math.min(text.length, idx + name.length + 15);
    const ctx = text.slice(start, end);
    const ctxLower = ctx.toLowerCase();

    // "March 24" | "March 24, 2026" | "março 24" | "24 março" | "24 de março"
    const p1 = new RegExp(
      `\\b${name}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\b`, 'i',
    );
    const p2 = new RegExp(
      `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:de\\s+)?${name}(?:,?\\s*(\\d{4}))?\\b`, 'i',
    );

    const m1 = ctxLower.match(p1);
    if (m1) {
      const day = +m1[1];
      const hasExplicitYear = !!m1[2];
      const yr = hasExplicitYear ? +m1[2] : resolveYear(monthNum, day, today);
      const status: DateStatus = hasExplicitYear ? 'exact' : 'inferred';
      if (day >= 1 && day <= 31) {
        results.push({ raw: ctx.trim(), iso: toISO(yr, monthNum, day), isRelative: false, status });
        break; // one match per month name
      }
    }

    const m2 = ctxLower.match(p2);
    if (m2) {
      const day = +m2[1];
      const hasExplicitYear = !!m2[2];
      const yr = hasExplicitYear ? +m2[2] : resolveYear(monthNum, day, today);
      const status: DateStatus = hasExplicitYear ? 'exact' : 'inferred';
      if (day >= 1 && day <= 31) {
        results.push({ raw: ctx.trim(), iso: toISO(yr, monthNum, day), isRelative: false, status });
        break;
      }
    }
  }

  return results;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseEmail(text: string, today: Date = new Date(), htmlSource?: string): ParsedData {
  const lines = text.split('\n');
  const lower = text.toLowerCase();

  // ── Header extraction ────────────────────────────────────────────────────
  let subject: string | undefined;
  let sender: string | undefined;
  let bodyStart = 0;

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i].trim();
    if (/^subject:/i.test(line)) {
      subject = line.replace(/^subject:\s*/i, '').trim();
      bodyStart = i + 1;
    } else if (/^from:/i.test(line)) {
      sender = line.replace(/^from:\s*/i, '').trim();
      bodyStart = i + 1;
    } else if (/^to:/i.test(line)) {
      bodyStart = i + 1;
    }
  }

  const body = lines.slice(bodyStart).join('\n').trim() || text;

  // ── Language detection ───────────────────────────────────────────────────
  const language: Language = detectLanguage(text);
  const rules: Rules = language === 'pt' ? ptRules : enRules;
  // Use both month name sets for date detection (emails sometimes mix)
  const allMonthRules: Rules[] = [enRules, ptRules];

  // ── Date extraction ──────────────────────────────────────────────────────
  const normalizedDates: NormalizedDate[] = [];
  const usedRaws = new Set<string>();

  // 1. ISO dates (YYYY-MM-DD) → always 'exact'
  for (const raw of text.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? []) {
    if (!usedRaws.has(raw)) {
      usedRaws.add(raw);
      normalizedDates.push({ raw, iso: raw, isRelative: false, status: 'exact' });
    }
  }

  // 2. Numeric dates (DD/MM/YYYY etc.) → 'exact'
  const numRe = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g;
  let nm: RegExpExecArray | null;
  while ((nm = numRe.exec(text))) {
    const raw = nm[0];
    if (usedRaws.has(raw)) continue;
    const iso = normalizeNumericDate(raw);
    if (iso) {
      usedRaws.add(raw);
      normalizedDates.push({ raw, iso, isRelative: false, status: 'exact' });
    }
  }

  // 3. Month-name dates ('exact' if year present, 'inferred' if year was resolved)
  for (const r of allMonthRules) {
    for (const nd of extractMonthNameDates(text, r, today)) {
      if (!usedRaws.has(nd.raw)) {
        usedRaws.add(nd.raw);
        normalizedDates.push(nd);
      }
    }
  }

  // 4. Relative dates → 'relative'
  const relativeCandidates: Array<{ terms: string[]; offset: number }> = [
    { terms: rules.relativeDayAfterTomorrow, offset: 2 },
    { terms: rules.relativeNextWeek,         offset: 7 },
    { terms: rules.relativeTomorrow,         offset: 1 },
    { terms: rules.relativeToday,            offset: 0 },
  ];

  for (const { terms, offset } of relativeCandidates) {
    for (const term of terms) {
      if (lower.includes(term) && !usedRaws.has(term)) {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        usedRaws.add(term);
        normalizedDates.push({
          raw:        term,
          iso:        d.toISOString().split('T')[0],
          isRelative: true,
          status:     'relative',
        });
        break; // one relative match per category
      }
    }
  }

  // ── Time extraction ──────────────────────────────────────────────────────
  const normalizedTimes: NormalizedTime[] = [];
  const usedTimeRaws = new Set<string>();

  // Patterns ordered most-specific → least-specific to avoid partial matches
  const timePatterns = [
    /\b\d{1,2}:\d{2}\s*(?:am|pm)\b/gi,   // 7:30pm
    /\b\d{1,2}h\d{2}\b/gi,               // 19h30
    /\b\d{1,2}:\d{2}\b/g,                // 19:30
    /\b\d{1,2}h\b/gi,                    // 19h
    /\b\d{1,2}\s*(?:am|pm)\b/gi,         // 7pm / 7 pm
  ];

  for (const pattern of timePatterns) {
    for (const raw of text.match(pattern) ?? []) {
      const key = raw.trim().toLowerCase();
      if (!usedTimeRaws.has(key)) {
        usedTimeRaws.add(key);
        normalizedTimes.push({ raw: raw.trim(), value: normalizeTime(raw.trim()) });
      }
    }
  }

  // ── Timezone ─────────────────────────────────────────────────────────────
  const tzMatch = text.match(
    /\b(UTC|GMT|EST|CST|PST|MST|EDT|CDT|PDT|BRT|CET|IST|JST|AEST|BST|SGT|HST|AKST)\b|GMT[+-]\d{1,2}(?::\d{2})?|UTC[+-]\d{1,2}(?::\d{2})?/,
  );
  const timezone = tzMatch?.[0];

  // ── Input fidelity & HTML parsing ────────────────────────────────────────
  const hasHtmlAnchors = !!htmlSource && /<a[\s>]/i.test(htmlSource);
  const inputFidelity: InputFidelity = hasHtmlAnchors
    ? 'html_detected'
    : /https?:\/\//.test(text)
      ? 'partial_structure'
      : 'plain_text_only';

  let ctaElements: CtaElement[] = [];
  let suspectedCtas: CtaElement[] = [];
  let htmlLinkCount = 0;

  if (hasHtmlAnchors) {
    const htmlResult = parseHtmlForCtas(htmlSource!);
    ctaElements   = htmlResult.ctaElements;
    htmlLinkCount = htmlResult.linkCount;
  } else {
    suspectedCtas = inferSuspectedCtas(text);
  }

  // ── CTA detection ─────────────────────────────────────────────────────────
  let textCTAFound = false;
  let ctaText: string | undefined;

  for (const cta of rules.ctaWords) {
    if (lower.includes(cta)) {
      textCTAFound = true;
      ctaText = cta;
      break;
    }
  }

  const hasLinks = /https?:\/\/\S+/.test(text);
  const hasCTA = textCTAFound || hasLinks || ctaElements.length > 0 || suspectedCtas.length > 0;
  const hasLinkOnlyCTA = !textCTAFound && (hasLinks || ctaElements.some(c => c.kind === 'link'));
  if (!textCTAFound && (hasLinks || ctaElements.length > 0)) ctaText = 'link';

  // ── Urgency & ambiguity ───────────────────────────────────────────────────
  const urgencyKeywords: string[] = [];
  for (const kw of [...rules.urgencyHigh, ...rules.urgencyMedium]) {
    if (lower.includes(kw)) urgencyKeywords.push(kw);
  }

  const ambiguousTerms: string[] = [];
  for (const term of rules.ambiguousTerms) {
    if (lower.includes(term)) ambiguousTerms.push(term);
  }

  // ── Links ─────────────────────────────────────────────────────────────────
  const linksFound = hasHtmlAnchors
    ? htmlLinkCount
    : (text.match(/https?:\/\/[^\s\])"'>]+/g) ?? []).length;

  // ── Structural features ───────────────────────────────────────────────────
  const hasGreeting  = rules.greetingPattern.test(body);
  const hasSignature = rules.signaturePattern.test(text);
  const isFormatted  = (
    text.includes('\n\n') ||
    /[•\-\*]\s/.test(text) ||
    /:\s*\n/.test(text)
  );
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  // ── Signal group detection (for profile-aware relevance) ──────────────────
  const matchGroup = (terms: string[]) => terms.filter(t => lower.includes(t));

  const signalGroups = {
    technicalSignals: matchGroup([
      'api', 'sdk', 'webhook', 'endpoint', 'integration', 'library', 'framework',
      'repository', 'cli', 'terminal', 'script', 'deploy', 'deployment', 'pipeline',
      'backend', 'frontend', 'fullstack', 'microservice', 'devops', 'ci/cd',
      'docker', 'kubernetes', 'terraform', 'container', 'cluster',
      'commit', 'pull request', 'branch', 'merge', 'release', 'changelog',
      'oauth', 'jwt', 'token', 'authentication', 'authorization',
      'database', 'query', 'schema', 'migration', 'payload',
      'integração', 'autenticação', 'implantação', 'repositório',
    ]),
    creatorSignals: matchGroup([
      'video', 'tutorial', 'youtube', 'podcast', 'episode', 'series',
      'content creator', 'channel', 'subscriber', 'upload', 'stream', 'live stream',
      'thumbnail', 'clip', 'reel', 'short', 'vlog', 'blog post',
      'newsletter', 'article', 'write-up', 'edition', 'digest',
      'criador', 'episódio', 'inscrever', 'publicação',
    ]),
    marketingSignals: matchGroup([
      'campaign', 'conversion', 'funnel', 'analytics', 'seo', 'roi', 'ctr',
      'open rate', 'click rate', 'audience', 'lead', 'drip', 'nurture',
      'ab test', 'a/b test', 'landing page', 'cta', 'call to action',
      'email marketing', 'automation', 'segmentation', 'engagement',
      'campanha', 'conversão', 'análise', 'audiência', 'captação',
    ]),
    financeSignals: matchGroup([
      'invoice', 'revenue', 'budget', 'expense', 'accounting', 'profit', 'loss',
      'tax', 'audit', 'fiscal', 'billing', 'payment', 'refund', 'subscription',
      'mrr', 'arr', 'churn', 'ltv', 'cash flow', 'balance', 'due date',
      'receita', 'fatura', 'orçamento', 'despesa', 'contabilidade',
    ]),
    businessSignals: matchGroup([
      'startup', 'founder', 'investor', 'funding', 'pitch', 'deck', 'venture',
      'product market fit', 'traction', 'growth', 'scale', 'b2b', 'saas',
      'customer', 'client', 'deal', 'partnership', 'contract', 'proposal',
      'estratégia', 'crescimento', 'cliente', 'parceria', 'proposta',
    ]),
    operationsSignals: matchGroup([
      'incident', 'outage', 'downtime', 'alert', 'monitoring', 'on-call',
      'sla', 'uptime', 'status page', 'runbook', 'escalation', 'pagerduty',
      'deploy failed', 'rollback', 'hotfix', 'maintenance', 'scheduled maintenance',
      'service disruption', 'degraded', 'resolved', 'postmortem',
      'incidente', 'manutenção', 'interrupção',
    ]),
  };

  return {
    rawText:         text,
    subject,
    sender,
    body,
    language,
    normalizedDates,
    normalizedTimes,
    timezone,
    hasCTA,
    hasLinkOnlyCTA,
    ctaText,
    ambiguousTerms,
    urgencyKeywords,
    wordCount,
    hasSubject:  !!subject,
    hasSender:   !!sender,
    hasGreeting,
    hasSignature,
    isFormatted,
    linksFound,
    signalGroups,
    inputFidelity,
    ctaElements,
    suspectedCtas,
  };
}
