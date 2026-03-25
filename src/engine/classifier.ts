/**
 * Evidence-based email classifier.
 *
 * Pipeline (7 steps):
 *   1. collectEvidence   — scan text for all observable signals
 *   2. computeRawScores  — sum evidence weights per type
 *   3. checkEligibility  — apply structural minimum requirements
 *   4. detectContradictions — identify conflicting evidence patterns
 *   5. computeAdjustedScores — apply eligibility multipliers + contradiction penalties
 *   6. resolveType       — select best type by adjusted score
 *   7. resolveSubtype    — infer subtype within the winning type
 *
 * This module replaces keyword-bag classification with structured evidence inference.
 * Isolated vocabulary (e.g. "billing", "payment") cannot alone determine type.
 * Intent, structural evidence, and co-occurrence patterns take precedence.
 */

import type {
  ParsedData,
  EmailType,
  EmailSubtype,
  ClassificationResult,
  WeightedKeyword,
  EmailIntent,
} from '../types';
import { enRules, ptRules } from './rules';
import type { Rules }       from './rules';
import { detectIntent }     from './intent';
import { collectEvidence, getStrongestEvidence } from './evidence';
import { computeRawScores }                      from './weights';
import { checkEligibility }                      from './eligibility';
import {
  detectContradictions,
  contradictionPenaltyFor,
} from './contradiction';

// ─── All known email types ─────────────────────────────────────────────────────

const ALL_TYPES: EmailType[] = [
  'billing', 'event', 'course', 'content', 'alert',
  'promotion', 'newsletter', 'transaction',
  'account', 'support', 'community', 'job', 'legal',
];

// ─── Step 5: Adjusted score computation ───────────────────────────────────────

function computeAdjustedScores(
  rawScores:      Partial<Record<EmailType, number>>,
  evidence:       ReturnType<typeof collectEvidence>,
  data:           ParsedData,
  contradictions: ReturnType<typeof detectContradictions>,
): {
  adjusted:    Partial<Record<EmailType, number>>;
  eligibility: Partial<Record<EmailType, boolean>>;
  failedChecks:Partial<Record<EmailType, string[]>>;
} {
  const adjusted:    Partial<Record<EmailType, number>>   = {};
  const eligibility: Partial<Record<EmailType, boolean>>  = {};
  const failedChecks:Partial<Record<EmailType, string[]>> = {};

  for (const type of ALL_TYPES) {
    const raw = rawScores[type] ?? 0;
    if (raw <= 0) continue;

    const elig = checkEligibility(type, evidence, data);
    eligibility[type]  = elig.passed;
    failedChecks[type] = elig.failedChecks;

    const penalty = contradictionPenaltyFor(type, contradictions);
    const score   = Math.max(0, Math.round(raw * elig.scoreMultiplier) - penalty);

    if (score > 0) adjusted[type] = score;
  }

  return { adjusted, eligibility, failedChecks };
}

// ─── Step 6: Type resolution ───────────────────────────────────────────────────

function resolveType(adjusted: Partial<Record<EmailType, number>>): EmailType {
  let best: EmailType = 'unknown';
  let max  = 0;

  for (const [type, score] of Object.entries(adjusted) as [EmailType, number][]) {
    if (score > max) { max = score; best = type; }
  }

  return best;
}

// ─── Confidence formula ────────────────────────────────────────────────────────

/**
 * Confidence = 1 − (second / first), clamped [0.05, 0.97].
 * Penalised further by: eligibility failures, contradiction count, narrow margin.
 */
function computeConfidence(
  adjusted:       Partial<Record<EmailType, number>>,
  winner:         EmailType,
  eligibilityMap: Partial<Record<EmailType, boolean>>,
  contradictions: ReturnType<typeof detectContradictions>,
): number {
  const first = adjusted[winner] ?? 0;
  if (first === 0) return 0;

  const second = Object.entries(adjusted)
    .filter(([t]) => t !== winner)
    .map(([, s]) => s as number)
    .sort((a, b) => b - a)[0] ?? 0;

  const baseConfidence = second === 0 ? 0.97 : 1 - second / first;

  // Penalty: winner failed its own eligibility
  const eligPenalty = eligibilityMap[winner] === false ? 0.20 : 0;

  // Penalty: contradictions targeting the winner
  const contCount   = contradictions.filter(c => c.targets.includes(winner)).length;
  const contPenalty = contCount * 0.08;

  // Penalty: narrow score margin (< 15% gap between first and second)
  const marginRatio  = first > 0 ? (first - second) / first : 1;
  const marginPenalty = marginRatio < 0.15 ? 0.12 : marginRatio < 0.30 ? 0.05 : 0;

  return Math.max(0.05, Math.min(0.97, baseConfidence - eligPenalty - contPenalty - marginPenalty));
}

// ─── Step 7: Subtype resolution ────────────────────────────────────────────────

function resolveSubtype(
  text:        string,
  rules:       Rules,
  primaryType: EmailType,
): EmailSubtype | undefined {
  const lower  = text.toLowerCase();
  const prefix = primaryType + '/';
  type ScoredSubtype = { subtype: EmailSubtype; score: number };
  const candidates: ScoredSubtype[] = [];

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

// ─── Alternatives list ─────────────────────────────────────────────────────────

function getAlternatives(
  adjusted: Partial<Record<EmailType, number>>,
  winner:   EmailType,
): Array<{ type: EmailType; score: number }> {
  return Object.entries(adjusted)
    .filter(([t]) => t !== winner)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([t, s]) => ({ type: t as EmailType, score: s as number }));
}

// ─── Decision reason builder ──────────────────────────────────────────────────

function buildDecisionReason(
  winner:         EmailType,
  rawScores:      Partial<Record<EmailType, number>>,
  adjusted:       Partial<Record<EmailType, number>>,
  eligibilityMap: Partial<Record<EmailType, boolean>>,
  failedChecks:   Partial<Record<EmailType, string[]>>,
  contradictions: ReturnType<typeof detectContradictions>,
): string[] {
  const reasons: string[] = [];
  const winScore = adjusted[winner] ?? 0;

  reasons.push(`"${winner}" selected with adjusted score ${winScore}`);

  // Collect all types that had a raw score but were not the winner
  const allScored = new Set<EmailType>([
    ...Object.keys(adjusted) as EmailType[],
    ...Object.keys(rawScores) as EmailType[],
  ]);
  allScored.delete(winner);

  const sortedRejected = [...allScored]
    .map(t => ({ type: t, raw: rawScores[t] ?? 0, adj: adjusted[t] ?? 0 }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 3);

  for (const { type, raw, adj } of sortedRejected) {
    const elig   = eligibilityMap[type];
    const checks = failedChecks[type] ?? [];
    if (elig === false && checks.length > 0) {
      reasons.push(
        `"${type}" had raw score ${raw} but failed eligibility: ${checks.join(', ')}`,
      );
    } else if (adj < raw) {
      reasons.push(
        `"${type}" raw score ${raw} reduced to ${adj} after contradiction penalties`,
      );
    } else if (adj > 0) {
      reasons.push(`"${type}" scored ${adj} — lower than winner`);
    }
  }

  // Surface contradictions
  for (const c of contradictions) {
    reasons.push(c.message);
  }

  return reasons;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function classifyEmail(data: ParsedData): ClassificationResult {
  const rules = data.language === 'pt' ? ptRules : enRules;

  // Step 1: Collect evidence
  const evidence = collectEvidence(data.rawText, data);

  // Step 2: Compute raw scores
  const rawScores = computeRawScores(evidence);

  // Early exit: no signal at all
  if (Object.keys(rawScores).length === 0) {
    return {
      type: 'unknown', subtype: undefined, confidence: 0,
      alternatives: [], intent: 'read', classificationNotes: [],
      rawScores: {}, adjustedScores: {}, eligibility: {},
      contradictions: [], strongestEvidence: [], decisionReason: ['No recognisable signals detected'],
    };
  }

  // Step 3 + 4: Eligibility and contradictions
  const contradictions = detectContradictions(evidence, data);

  // Step 5: Adjusted scores
  const { adjusted, eligibility, failedChecks } = computeAdjustedScores(
    rawScores, evidence, data, contradictions,
  );

  // Fallback: if adjusted is empty (all types failed eligibility) use raw
  const scores = Object.keys(adjusted).length > 0 ? adjusted : rawScores;

  // Step 6: Resolve type
  const type = resolveType(scores);

  // Step 7: Subtype
  const subtype = type !== 'unknown'
    ? resolveSubtype(data.rawText, rules, type)
    : undefined;

  // Confidence
  const confidence = computeConfidence(scores, type, eligibility, contradictions);

  // Alternatives
  const alternatives = getAlternatives(scores, type);

  // Intent
  const intent: EmailIntent = detectIntent(data, type, subtype);

  // Explainability
  const strongestEvidence = getStrongestEvidence(evidence);
  const decisionReason    = buildDecisionReason(type, rawScores, scores, eligibility, failedChecks, contradictions);

  // classificationNotes — backward compat: expose contradiction messages as notes
  // when a strong override occurred (eligibility failure for a high-raw-score type)
  const classificationNotes: string[] = contradictions
    .filter(c => c.penalty >= 25)
    .map(c => c.message);

  return {
    type,
    subtype,
    confidence,
    alternatives,
    intent,
    classificationNotes,
    rawScores,
    adjustedScores: scores,
    eligibility,
    contradictions: contradictions.map(c => c.label),
    strongestEvidence,
    decisionReason,
  };
}
