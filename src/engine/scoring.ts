import type {
  ParsedData,
  ClassificationResult,
  Priority,
  Urgency,
  ScoreBreakdown,
  ReasoningEntry,
} from '../types';
import type { DecisionContext } from './decision';

export interface ScoreResult {
  agentReadinessScore: number;
  safeActionScore:     number;
  scoreBreakdown:      ScoreBreakdown;
  reasoning:           ReasoningEntry[];
  issues:              string[];
  priority:            Priority;
  urgency:             Urgency;
}

export function calculateScores(
  data:       ParsedData,
  classified: ClassificationResult,
  context:    DecisionContext,
): ScoreResult {
  const { type: emailType, confidence } = classified;
  const reasoning: ReasoningEntry[] = [];
  const issueSet  = new Set<string>();

  // ── 1. classificationClarity (0–30) ─────────────────────────────────────────
  const classificationClarity = Math.round(confidence * 30);
  const pct = Math.round(confidence * 100);

  reasoning.push({
    category: 'Classification',
    rule:     `"${emailType}" detected at ${pct}% confidence`,
    effect:   classificationClarity >= 20 ? 'positive' : classificationClarity >= 10 ? 'neutral' : 'negative',
    delta:    classificationClarity,
  });

  if (emailType === 'unknown') issueSet.add('Email intent could not be determined');
  if (confidence < 0.5)        issueSet.add(`Low classification confidence (${pct}%) — multiple types match`);

  // ── 2. timeClarity (0–25) — fully context-driven ────────────────────────────
  //
  // Penalties and bonuses depend entirely on what the DecisionContext requires.
  // No hardcoded per-type conditions exist here.
  //
  const hasDate     = data.normalizedDates.length > 0;
  const hasTime     = data.normalizedTimes.length > 0;
  const hasTz       = !!data.timezone;
  const hasExact    = data.normalizedDates.some(d => d.status === 'exact');
  const hasRelative = data.normalizedDates.some(d => d.status === 'relative');

  let timeClarity: number;
  let timeRule:    string;

  if (context.requiresTime) {
    // Both date and time must be present for reliable scheduling
    if (hasExact && hasTime && hasTz) {
      timeClarity = 25; timeRule = 'Exact date + time + timezone — fully schedulable';
    } else if (hasExact && hasTime) {
      timeClarity = 18; timeRule = 'Date and time present — no timezone';
      issueSet.add('No timezone — cross-region scheduling is ambiguous');
    } else if (hasDate) {
      timeClarity = 10; timeRule = 'Date found but time is required and missing';
      issueSet.add('Time not specified — required for this email type');
    } else if (hasRelative) {
      timeClarity = 5; timeRule = 'Relative date only — time required but absent';
      issueSet.add('Date is relative and time is missing — cannot schedule reliably');
    } else {
      timeClarity = 0; timeRule = 'Date and time required — neither found';
      issueSet.add('No date or time — required for this email type');
    }
  } else if (context.requiresDate) {
    // Date must be present; time is optional but adds value
    if (hasExact && hasTime && hasTz) {
      timeClarity = 25; timeRule = 'Exact date + time + timezone';
    } else if (hasDate && hasTime) {
      timeClarity = 22; timeRule = 'Date + time present (time is a bonus)';
    } else if (hasExact) {
      timeClarity = 18; timeRule = 'Exact date present';
    } else if (hasRelative) {
      timeClarity = 8; timeRule = 'Relative date only';
      issueSet.add('Date is relative — confirm timezone and year');
    } else {
      timeClarity = 0; timeRule = 'Date required — not found';
      issueSet.add('No date found — required for this email type');
    }
  } else {
    // Neither date nor time is required — no penalty for absence
    if (hasDate && hasTime) {
      timeClarity = 22; timeRule = 'Date and time provided (informational)';
    } else if (hasDate) {
      timeClarity = 18; timeRule = 'Date provided (informational)';
    } else {
      timeClarity = 18; timeRule = 'No date required for this type and availability';
    }
  }

  reasoning.push({
    category: 'Time Clarity',
    rule:     timeRule,
    effect:   timeClarity >= 18 ? 'positive' : timeClarity >= 8 ? 'neutral' : 'negative',
    delta:    timeClarity,
  });

  // ── 3. actionClarity (0–25) ─────────────────────────────────────────────────
  let actionBase: number;
  let actionRule: string;

  if (data.hasCTA && !data.hasLinkOnlyCTA) {
    actionBase = 25; actionRule = 'Explicit text CTA detected';
  } else if (data.hasCTA && data.hasLinkOnlyCTA) {
    actionBase = 15; actionRule = 'CTA is link-only — no action text';
    issueSet.add('CTA is link-only — action text improves agent reliability');
  } else if (data.linksFound > 0) {
    actionBase = 8; actionRule = 'Links present but no CTA';
    issueSet.add('No call-to-action detected');
  } else {
    actionBase = 0; actionRule = 'No CTA and no links';
    issueSet.add('No call-to-action detected');
  }

  const ambiguityPenalty = Math.min(data.ambiguousTerms.length * 3, 8);
  const actionClarity    = Math.max(0, actionBase - ambiguityPenalty);

  reasoning.push({
    category: 'Action Clarity',
    rule:     actionRule,
    effect:   actionBase >= 20 ? 'positive' : actionBase >= 10 ? 'neutral' : 'negative',
    delta:    actionBase,
  });

  if (ambiguityPenalty > 0) {
    const sample = data.ambiguousTerms.slice(0, 2).map(t => `"${t}"`).join(', ');
    issueSet.add(`Vague language detected: ${sample}`);
    reasoning.push({
      category: 'Action Clarity',
      rule:     `Ambiguous terms penalise −${ambiguityPenalty} (${sample})`,
      effect:   'negative',
      delta:    -ambiguityPenalty,
    });
  }

  if (!data.isFormatted && data.wordCount > 50) {
    issueSet.add('Unstructured prose — no lists or clear sections');
  }

  // ── 4. linkSafety (0–10) — context-driven ───────────────────────────────────
  //
  // Whether links are acceptable depends on DecisionContext, not on type name.
  //
  let linkSafety: number;
  let linkRule:   string;

  if (data.linksFound === 0) {
    linkSafety = 10; linkRule = 'No external links — fully self-contained';
  } else if (context.linkDependencyAcceptable) {
    // Links are expected / acceptable for this type+availability
    linkSafety = data.hasLinkOnlyCTA ? 8 : 9;
    linkRule   = 'Links present — acceptable for this email type';
  } else {
    // Links exist but dependency is NOT acceptable for this type+availability
    if (data.hasLinkOnlyCTA) {
      linkSafety = 2; linkRule = 'Action requires a link — not acceptable for this type';
      issueSet.add('Critical information may be behind a link');
    } else {
      linkSafety = 6; linkRule = 'Links alongside inline content — partially self-contained';
    }
  }

  reasoning.push({
    category: 'Link Safety',
    rule:     linkRule,
    effect:   linkSafety >= 7 ? 'positive' : linkSafety >= 5 ? 'neutral' : 'negative',
    delta:    linkSafety,
  });

  // ── 5. completeness (0–10) ─────────────────────────────────────────────────
  let completeness = 10;
  const missing: string[] = [];

  if (!data.hasSubject)   { completeness -= 2; missing.push('subject');   issueSet.add('No subject line'); }
  if (!data.hasSender)    { completeness -= 2; missing.push('sender');    issueSet.add('Sender not identified'); }
  if (!data.hasGreeting)  { completeness -= 2; missing.push('greeting'); }
  if (!data.hasSignature) { completeness -= 2; missing.push('signature'); }
  completeness = Math.max(2, completeness);

  reasoning.push({
    category: 'Completeness',
    rule:     missing.length === 0
      ? 'All structural elements present'
      : `Missing: ${missing.join(', ')}`,
    effect:   completeness >= 8 ? 'positive' : completeness >= 5 ? 'neutral' : 'negative',
    delta:    completeness,
  });

  if (data.wordCount < 15) {
    issueSet.add('Too sparse — critical information likely missing');
    reasoning.push({
      category: 'Completeness',
      rule:     `Very short (${data.wordCount} words)`,
      effect:   'negative',
      delta:    0,
    });
  }

  // ── Derived scores ─────────────────────────────────────────────────────────
  const agentReadinessScore = Math.max(0, Math.min(100, Math.round(
    (classificationClarity + timeClarity + actionClarity + completeness) / 90 * 100,
  )));
  const safeActionScore = Math.max(0, Math.min(100, Math.round(
    (actionClarity + linkSafety + completeness) / 45 * 100,
  )));

  const scoreBreakdown: ScoreBreakdown = {
    classificationClarity,
    timeClarity,
    actionClarity,
    linkSafety,
    completeness,
  };

  // ── Priority ───────────────────────────────────────────────────────────────
  // Priority is type-level metadata, not a validation rule — intentionally type-driven.
  let priority: Priority;
  if (emailType === 'alert') {
    priority = data.urgencyKeywords.length > 0 ? 'critical' : 'high';
  } else if (emailType === 'billing') {
    priority = 'high';
  } else if (data.urgencyKeywords.length >= 2) {
    priority = 'high';
  } else if (agentReadinessScore >= 70) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  // ── Urgency — context-driven ───────────────────────────────────────────────
  // Uses context.availability instead of hardcoded emailType for time-sensitivity.
  let urgency: Urgency;
  if (data.urgencyKeywords.length >= 3)                    urgency = 'critical';
  else if (data.urgencyKeywords.length >= 1)               urgency = 'high';
  else if (emailType === 'alert' || emailType === 'billing') urgency = 'high';
  else if (context.availability === 'scheduled' && hasDate) urgency = 'medium';
  else                                                       urgency = 'low';

  return {
    agentReadinessScore,
    safeActionScore,
    scoreBreakdown,
    reasoning,
    issues: [...issueSet],
    priority,
    urgency,
  };
}
