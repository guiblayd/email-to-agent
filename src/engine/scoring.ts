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
  failureModes:        string[];
  priority:            Priority;
  urgency:             Urgency;
  /** Numeric score for the intrinsic content priority (0–100). */
  intrinsicScore:      number;
  /** Numeric score for contextual domain/platform relevance (0–55). */
  relevanceScore:      number;
  /** Final combined priority score: intrinsicScore + relevanceScore, clamped to 0–100. */
  priorityScore:       number;
}

// ─── Intrinsic priority scoring ────────────────────────────────────────────────
//
// Converts email type, urgency, availability, and agent-readiness into a
// numeric intrinsic score (0–100) before relevance is applied.
//
// Base scores are intentionally conservative so that relevance can meaningfully
// elevate content, promotions, and informational emails.

const INTRINSIC_BASE: Partial<Record<string, number>> = {
  // High-stakes / time-critical
  alert:       62,
  account:     58,  // password resets and security notices are urgent
  billing:     55,
  legal:       50,  // compliance and contract notices need attention
  // Action-required
  job:         46,  // interviews and offers drive direct action
  transaction: 42,
  support:     38,  // tickets require a reply
  event:       40,
  // Engagement / learning
  course:      28,
  promotion:   26,
  community:   22,
  content:     22,
  newsletter:  14,
  unknown:     10,
};

function computeIntrinsicScore(
  emailType:          string,
  urgencyCount:       number,
  agentReadiness:     number,
  isScheduled:        boolean,
): number {
  const base = INTRINSIC_BASE[emailType] ?? 20;

  const urgencyBonus    = urgencyCount >= 3 ? 20 : urgencyCount >= 1 ? 10 : 0;
  const scheduledBonus  = isScheduled ? 6 : 0;
  const readinessBonus  = agentReadiness >= 70 ? 8 : agentReadiness >= 50 ? 4 : 0;

  return Math.min(100, base + urgencyBonus + scheduledBonus + readinessBonus);
}

function priorityFromScore(score: number): Priority {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ─── Agent failure mode generation ────────────────────────────────────────────
//
// Simulates what a cautious, conservative agent would do (or fail to do) when
// processing this email. Derived entirely from scoring signals — no hardcoded
// per-type exceptions.

function buildFailureModes(
  data:       ParsedData,
  classified: ClassificationResult,
  context:    DecisionContext,
): string[] {
  const modes: string[] = [];
  const hasDate = data.normalizedDates.length > 0;
  const hasTime = data.normalizedTimes.length > 0;

  // Link dependency — cautious agents will not click unverified links when
  // link-following is not acceptable for this type/availability combination.
  if (data.linksFound > 0 && !context.linkDependencyAcceptable && data.hasLinkOnlyCTA) {
    modes.push('Will refuse to follow the external link — action requires human approval');
  }

  // Scheduling — agent cannot commit to a time-based action without the required fields.
  if (context.requiresTime && !hasTime) {
    modes.push('Cannot schedule — will defer or skip the time-triggered action');
  } else if (context.requiresDate && !hasDate) {
    modes.push('Cannot determine deadline — will skip the date-dependent response');
  }

  // Action path — no CTA and no links means the agent has nowhere to go.
  if (!data.hasCTA && data.linksFound === 0) {
    modes.push('No action path found — will file the email without processing');
  }

  // Classification certainty — if intent is unknown or confidence is very low,
  // a cautious agent will not process automatically.
  if (classified.type === 'unknown') {
    modes.push('Intent is unknown — will escalate to human review queue');
  } else if (classified.confidence < 0.45) {
    modes.push(
      `Low classification confidence (${Math.round(classified.confidence * 100)}%) — may misroute as "${classified.type}"`,
    );
  }

  // Sender trust — unverified senders reduce the agent's willingness to act.
  if (!data.hasSender) {
    modes.push('Sender is unverifiable — reduced trust applied, action may be quarantined');
  }

  // Temporal ambiguity — vague timing language prevents committing to a schedule.
  if (data.ambiguousTerms.length >= 2) {
    modes.push('Vague timing language detected — will not commit to a scheduled action');
  }

  return modes.slice(0, 5);
}

// ─── Main scoring function ────────────────────────────────────────────────────

export function calculateScores(
  data:          ParsedData,
  classified:    ClassificationResult,
  context:       DecisionContext,
  relevanceScore = 0,
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

  if (emailType === 'unknown') {
    issueSet.add('Agent cannot determine intent — will route to human review queue');
  }
  if (confidence < 0.5) {
    issueSet.add(`Agent confidence is low (${pct}%) — misclassification risk is elevated`);
  }

  // ── 2. timeClarity (0–25) — fully context-driven ────────────────────────────
  const hasDate     = data.normalizedDates.length > 0;
  const hasTime     = data.normalizedTimes.length > 0;
  const hasTz       = !!data.timezone;
  const hasExact    = data.normalizedDates.some(d => d.status === 'exact');
  const hasRelative = data.normalizedDates.some(d => d.status === 'relative');

  let timeClarity: number;
  let timeRule:    string;

  if (context.requiresTime) {
    if (hasExact && hasTime && hasTz) {
      timeClarity = 25; timeRule = 'Exact date + time + timezone — fully schedulable';
    } else if (hasExact && hasTime) {
      timeClarity = 18; timeRule = 'Date and time present — timezone missing';
      issueSet.add('Timezone missing — agent may schedule at the wrong time across regions');
    } else if (hasDate) {
      timeClarity = 10; timeRule = 'Date present — time required but not found';
      issueSet.add('Agent cannot schedule precisely — time is required but not found');
    } else if (hasRelative) {
      timeClarity = 5; timeRule = 'Relative date only — time required but absent';
      issueSet.add('Agent cannot commit to a schedule — date is relative and time is absent');
    } else {
      timeClarity = 0; timeRule = 'No date or time — both required for this type';
      issueSet.add('Agent cannot trigger a time-based action — no date or time was found');
    }
  } else if (context.requiresDate) {
    if (hasExact && hasTime && hasTz) {
      timeClarity = 25; timeRule = 'Exact date + time + timezone';
    } else if (hasDate && hasTime) {
      timeClarity = 22; timeRule = 'Date + time present (time is a bonus)';
    } else if (hasExact) {
      timeClarity = 18; timeRule = 'Exact date present';
    } else if (hasRelative) {
      timeClarity = 8; timeRule = 'Relative date only — exact date unavailable';
      issueSet.add('Relative date detected — agent cannot resolve the exact year or timezone');
    } else {
      timeClarity = 0; timeRule = 'Date required — not found';
      issueSet.add('Agent cannot determine deadline — no date was found');
    }
  } else {
    // Neither date nor time required — no penalty for absence
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
    actionBase = 15; actionRule = 'CTA is link-only — no action text present';
    issueSet.add('Action requires opening a link — a cautious agent may not proceed without explicit instruction');
  } else if (data.linksFound > 0) {
    actionBase = 8; actionRule = 'Links present but no explicit CTA';
    issueSet.add('No action path detected — agent has no clear next step to execute');
  } else {
    actionBase = 0; actionRule = 'No CTA and no links';
    issueSet.add('No action path detected — agent has no clear next step to execute');
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
    issueSet.add(`Vague timing language reduces agent confidence — terms like ${sample} cannot be resolved to a specific action`);
    reasoning.push({
      category: 'Action Clarity',
      rule:     `Ambiguous terms penalise −${ambiguityPenalty} (${sample})`,
      effect:   'negative',
      delta:    -ambiguityPenalty,
    });
  }

  if (!data.isFormatted && data.wordCount > 50) {
    issueSet.add('Unstructured prose detected — agent parsing accuracy may be reduced');
  }

  // ── 4. linkSafety (0–10) — context-driven ───────────────────────────────────
  let linkSafety: number;
  let linkRule:   string;

  if (data.linksFound === 0) {
    linkSafety = 10; linkRule = 'No external links — fully self-contained';
  } else if (context.linkDependencyAcceptable) {
    linkSafety = data.hasLinkOnlyCTA ? 8 : 9;
    linkRule   = 'Links present — acceptable for this type and availability';
  } else {
    if (data.hasLinkOnlyCTA) {
      linkSafety = 2; linkRule = 'Action requires a link — not acceptable for this type';
      issueSet.add('Cautious agents will refuse to act — critical information is hidden behind an external link');
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

  if (!data.hasSubject) {
    completeness -= 2; missing.push('subject');
    issueSet.add('No subject line — agents cannot pre-classify or prioritize this email');
  }
  if (!data.hasSender) {
    completeness -= 2; missing.push('sender');
    issueSet.add('Sender is unverifiable — agent trust scoring is reduced');
  }
  if (!data.hasGreeting)  { completeness -= 2; missing.push('greeting'); }
  if (!data.hasSignature) { completeness -= 2; missing.push('signature'); }
  completeness = Math.max(2, completeness);

  reasoning.push({
    category: 'Completeness',
    rule:     missing.length === 0
      ? 'All structural elements present'
      : `Missing structural elements: ${missing.join(', ')}`,
    effect:   completeness >= 8 ? 'positive' : completeness >= 5 ? 'neutral' : 'negative',
    delta:    completeness,
  });

  if (data.wordCount < 15) {
    issueSet.add('Email is too sparse to process — critical information is likely missing');
    reasoning.push({
      category: 'Completeness',
      rule:     `Very short email (${data.wordCount} words)`,
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

  // ── Priority (numeric + label) ─────────────────────────────────────────────
  const intrinsicScore = computeIntrinsicScore(
    emailType,
    data.urgencyKeywords.length,
    agentReadinessScore,
    context.availability === 'scheduled',
  );
  const priorityScore = Math.min(100, intrinsicScore + relevanceScore);
  const priority      = priorityFromScore(priorityScore);

  // ── Urgency — context-driven ───────────────────────────────────────────────
  let urgency: Urgency;
  if (data.urgencyKeywords.length >= 3)                                          urgency = 'critical';
  else if (data.urgencyKeywords.length >= 1)                                     urgency = 'high';
  else if (emailType === 'alert' || emailType === 'billing' || emailType === 'account') urgency = 'high';
  else if (emailType === 'legal')                                                urgency = 'high';
  else if (context.availability === 'scheduled' && hasDate)                     urgency = 'medium';
  else                                                                            urgency = 'low';

  // ── Failure modes ──────────────────────────────────────────────────────────
  const failureModes = buildFailureModes(data, classified, context);

  return {
    agentReadinessScore,
    safeActionScore,
    scoreBreakdown,
    reasoning,
    issues: [...issueSet],
    failureModes,
    priority,
    urgency,
    intrinsicScore,
    relevanceScore,
    priorityScore,
  };
}
