/**
 * Profile-aware relevance engine.
 *
 * Each UserProfile represents a different reader archetype. The same email
 * can carry very different relevance depending on who is reading it — a billing
 * API update is highly relevant to a developer but irrelevant to a creator.
 *
 * Scoring:
 *   - Each profile has per-signal-group weights (0–1.0)
 *   - Raw profile score = weighted sum of matched signal counts, capped at 100
 *   - fitBoost (+10) is applied when ≥3 signal groups fire for a profile
 *   - finalPriorityByProfile = clamp(intrinsicScore + profileRelevance, 0, 100)
 */

import type {
  UserProfile,
  DetectedSignalGroups,
  ProfileRelevanceResult,
} from '../types';

// ─── Profile weight table ──────────────────────────────────────────────────────
//
// Each profile specifies how much it cares about each signal group.
// Weights are multipliers (0.0–1.0) applied to the match count, then scaled
// to a 0–100 contribution per group.

interface ProfileWeights {
  technical:   number;
  creator:     number;
  marketing:   number;
  finance:     number;
  business:    number;
  operations:  number;
}

const PROFILE_WEIGHTS: Record<UserProfile, ProfileWeights> = {
  developer: {
    technical:  1.0,
    creator:    0.1,
    marketing:  0.15,
    finance:    0.2,
    business:   0.25,
    operations: 0.9,
  },
  creator: {
    technical:  0.2,
    creator:    1.0,
    marketing:  0.5,
    finance:    0.15,
    business:   0.2,
    operations: 0.1,
  },
  marketer: {
    technical:  0.25,
    creator:    0.5,
    marketing:  1.0,
    finance:    0.3,
    business:   0.4,
    operations: 0.1,
  },
  founder: {
    technical:  0.5,
    creator:    0.3,
    marketing:  0.7,
    finance:    0.7,
    business:   1.0,
    operations: 0.4,
  },
  operator: {
    technical:  0.6,
    creator:    0.1,
    marketing:  0.2,
    finance:    0.5,
    business:   0.6,
    operations: 1.0,
  },
  finance: {
    technical:  0.2,
    creator:    0.1,
    marketing:  0.3,
    finance:    1.0,
    business:   0.6,
    operations: 0.3,
  },
  general: {
    technical:  0.3,
    creator:    0.3,
    marketing:  0.3,
    finance:    0.3,
    business:   0.3,
    operations: 0.3,
  },
};

// ─── Per-group max contribution (sum ≤ 100 per profile) ───────────────────────
//
// Each group contributes up to `GROUP_MAX` points before the profile weight
// is applied. This prevents a single noisy group from dominating.

const GROUP_MAX = 25;

function groupContribution(matches: string[], weight: number): number {
  if (matches.length === 0 || weight === 0) return 0;
  // Diminishing returns: first match = full, each additional = 40% of prior bonus
  const base = GROUP_MAX;
  const bonus = Math.min(matches.length - 1, 3) * Math.round(base * 0.12);
  return Math.round(Math.min(GROUP_MAX, base + bonus) * weight);
}

// ─── Profile explainability ────────────────────────────────────────────────────

const PROFILE_LABELS: Record<UserProfile, string> = {
  developer: 'Developer / Engineer',
  creator:   'Content Creator',
  marketer:  'Marketer',
  founder:   'Founder / CEO',
  operator:  'Operator / DevOps',
  finance:   'Finance / Accounting',
  general:   'General Audience',
};

function buildExplanation(
  profile:      UserProfile,
  groups:       DetectedSignalGroups,
  score:        number,
): string {
  const fired: string[] = [];

  if (groups.technicalSignals.length > 0)  fired.push(`technical signals (${groups.technicalSignals.slice(0, 2).join(', ')})`);
  if (groups.creatorSignals.length > 0)    fired.push(`creator signals (${groups.creatorSignals.slice(0, 2).join(', ')})`);
  if (groups.marketingSignals.length > 0)  fired.push(`marketing signals (${groups.marketingSignals.slice(0, 2).join(', ')})`);
  if (groups.financeSignals.length > 0)    fired.push(`finance signals (${groups.financeSignals.slice(0, 2).join(', ')})`);
  if (groups.businessSignals.length > 0)   fired.push(`business signals (${groups.businessSignals.slice(0, 2).join(', ')})`);
  if (groups.operationsSignals.length > 0) fired.push(`ops signals (${groups.operationsSignals.slice(0, 2).join(', ')})`);

  const label = PROFILE_LABELS[profile];

  if (score === 0 || fired.length === 0) {
    return `No domain signals found — this email carries low relevance for a ${label}.`;
  }

  return `Best match for ${label} (score ${score}): driven by ${fired.slice(0, 3).join('; ')}.`;
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function computeProfileRelevance(
  groups:        DetectedSignalGroups,
  intrinsicScore: number,
): ProfileRelevanceResult {
  const profiles: UserProfile[] = ['developer', 'creator', 'marketer', 'founder', 'operator', 'finance', 'general'];

  const profileRelevance = {} as Record<UserProfile, number>;
  const finalPriorityByProfile = {} as Record<UserProfile, number>;

  for (const profile of profiles) {
    const w = PROFILE_WEIGHTS[profile];

    let score =
      groupContribution(groups.technicalSignals,  w.technical)  +
      groupContribution(groups.creatorSignals,     w.creator)    +
      groupContribution(groups.marketingSignals,   w.marketing)  +
      groupContribution(groups.financeSignals,     w.finance)    +
      groupContribution(groups.businessSignals,    w.business)   +
      groupContribution(groups.operationsSignals,  w.operations);

    // fitBoost: strong multi-domain alignment
    const activatedGroups = [
      groups.technicalSignals,
      groups.creatorSignals,
      groups.marketingSignals,
      groups.financeSignals,
      groups.businessSignals,
      groups.operationsSignals,
    ].filter(g => g.length > 0).length;

    if (activatedGroups >= 3) score = Math.min(100, score + 10);

    score = Math.min(100, score);
    profileRelevance[profile] = score;
    finalPriorityByProfile[profile] = Math.min(100, intrinsicScore + score);
  }

  // Best match = highest profileRelevance (ties broken by profile order above)
  const bestProfileMatch = profiles.reduce((best, p) =>
    profileRelevance[p] > profileRelevance[best] ? p : best,
  );

  const bestScore = profileRelevance[bestProfileMatch];
  const bestMatchExplanation = buildExplanation(bestProfileMatch, groups, bestScore);

  return {
    bestProfileMatch,
    bestMatchExplanation,
    profileRelevance,
    finalPriorityByProfile,
    detectedSignalGroups: groups,
  };
}
