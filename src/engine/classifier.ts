import type {
  ParsedData,
  EmailType,
  EmailSubtype,
  ClassificationResult,
  WeightedKeyword,
} from '../types';
import { enRules, ptRules } from './rules';
import type { Rules } from './rules';
import { detectIntent } from './intent';

type TypeKey = keyof Rules['typeKeywords'];
type WeightedScores = Partial<Record<TypeKey, number>>;

// ─── Weighted keyword scoring ─────────────────────────────────────────────────

function computeTypeScores(text: string, rules: Rules): WeightedScores {
  const lower = text.toLowerCase();
  const scores: WeightedScores = {};

  for (const [type, keywords] of Object.entries(rules.typeKeywords) as [TypeKey, WeightedKeyword[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.word)) score += kw.weight;
    }
    if (score > 0) scores[type] = score;
  }

  return scores;
}

// ─── Confidence calculation ───────────────────────────────────────────────────

/**
 * confidence = 1 − (score2nd / score1st), clamped to [0.05, 0.99].
 * If no 2nd-place type exists: 0.99.  If score1st === 0: 0.
 */
function computeConfidence(scores: WeightedScores, primary: TypeKey): number {
  const first = scores[primary] ?? 0;
  if (first === 0) return 0;

  const second = Object.entries(scores)
    .filter(([t]) => t !== primary)
    .map(([, s]) => s as number)
    .sort((a, b) => b - a)[0] ?? 0;

  if (second === 0) return 0.99;
  return Math.max(0.05, Math.min(0.99, 1 - second / first));
}

function getAlternatives(
  scores: WeightedScores,
  primary: TypeKey,
): Array<{ type: EmailType; score: number }> {
  return Object.entries(scores)
    .filter(([t]) => t !== primary)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([t, s]) => ({ type: t as EmailType, score: s as number }));
}

// ─── Subtype detection ────────────────────────────────────────────────────────

function detectSubtype(
  text:        string,
  rules:       Rules,
  primaryType: EmailType,
): EmailSubtype | undefined {
  const lower  = text.toLowerCase();
  const prefix = primaryType + '/';

  const candidates: Array<{ subtype: EmailSubtype; score: number }> = [];

  for (const [subtype, keywords] of Object.entries(rules.subtypeKeywords)) {
    if (!subtype.startsWith(prefix)) continue;
    let score = 0;
    for (const kw of keywords as WeightedKeyword[]) {
      if (lower.includes(kw.word)) score += kw.weight;
    }
    if (score > 0) candidates.push({ subtype: subtype as EmailSubtype, score });
  }

  if (candidates.length === 0) return undefined;
  return candidates.sort((a, b) => b.score - a.score)[0].subtype;
}

// ─── Disambiguation helpers ───────────────────────────────────────────────────

function pickPrimary(scores: WeightedScores): TypeKey {
  let maxScore = 0;
  let best: TypeKey = 'informational';
  for (const [type, score] of Object.entries(scores) as [TypeKey, number][]) {
    if (score > maxScore) { maxScore = score; best = type; }
  }
  return best;
}

/**
 * EVENT wins when: event score ≥ course score AND date+time are both present.
 * COURSE wins when: enrollment keywords found, OR course keywords present without a specific time.
 */
function disambiguateEventCourse(
  data:   ParsedData,
  rules:  Rules,
  scores: WeightedScores,
): EmailType {
  const eventScore  = scores.event  ?? 0;
  const courseScore = scores.course ?? 0;
  const lower = data.rawText.toLowerCase();

  const hasEnrollment  = rules.enrollmentWords.some(w => lower.includes(w));
  const hasSpecificTime = data.normalizedTimes.length > 0;
  const hasDate         = data.normalizedDates.length > 0;

  if (hasEnrollment) return 'course';
  if (courseScore > 0 && !hasSpecificTime) return 'course';

  if (eventScore > 0 && hasDate && hasSpecificTime) return 'event';
  if (eventScore > 0 && hasDate && eventScore > courseScore) return 'event';

  return eventScore >= courseScore ? 'event' : 'course';
}

function disambiguateContentNewsletter(scores: WeightedScores): EmailType {
  const c = scores.content    ?? 0;
  const n = scores.newsletter ?? 0;
  return c >= n ? 'content' : 'newsletter';
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function classifyEmail(data: ParsedData): ClassificationResult {
  const rules  = data.language === 'pt' ? ptRules : enRules;
  const scores = computeTypeScores(data.rawText, rules);

  if (Object.keys(scores).length === 0) {
    return { type: 'unknown', confidence: 0, alternatives: [], intent: 'unknown' };
  }

  const hasEvent      = (scores.event      ?? 0) > 0;
  const hasCourse     = (scores.course     ?? 0) > 0;
  const hasContent    = (scores.content    ?? 0) > 0;
  const hasNewsletter = (scores.newsletter ?? 0) > 0;

  let primaryType: EmailType;

  if (hasEvent || hasCourse) {
    primaryType = disambiguateEventCourse(data, rules, scores);
  } else if (hasContent || hasNewsletter) {
    primaryType = disambiguateContentNewsletter(scores);
  } else {
    primaryType = pickPrimary(scores) as EmailType;
  }

  const primaryKey   = primaryType as TypeKey;
  const confidence   = computeConfidence(scores, primaryKey);
  const alternatives = getAlternatives(scores, primaryKey);
  const subtype      = detectSubtype(data.rawText, rules, primaryType);
  const intent       = detectIntent(data, primaryType);

  return { type: primaryType, subtype, confidence, alternatives, intent };
}
