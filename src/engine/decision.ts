import type { ParsedData, EmailType, Availability, ClassificationResult } from '../types';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TypeRequirements {
  /** Date must be present for the agent to act reliably */
  requiresDate:             boolean;
  /** Time must be present for the agent to act reliably */
  requiresTime:             boolean;
  /** True when the agent may follow a link to obtain missing data */
  linkDependencyAcceptable: boolean;
}

export interface DecisionContext extends TypeRequirements {
  availability: Availability;
}

// ─── Requirements matrix ──────────────────────────────────────────────────────
//
// Defines what is structurally required for every (type × availability) pair.
// To add a new email type: add one row. No scattered if-statements elsewhere.
//
//  requiresDate             → missing date becomes a scored issue
//  requiresTime             → missing time becomes a scored issue
//  linkDependencyAcceptable → agent may follow a link to get missing context

const REQUIREMENTS: Record<EmailType, Record<Availability, TypeRequirements>> = {
  event: {
    scheduled: { requiresDate: true,  requiresTime: true,  linkDependencyAcceptable: false },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  course: {
    scheduled: { requiresDate: true,  requiresTime: false, linkDependencyAcceptable: false },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  content: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  promotion: {
    scheduled: { requiresDate: true,  requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  newsletter: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  billing: {
    scheduled: { requiresDate: true,  requiresTime: false, linkDependencyAcceptable: false },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
  },
  alert: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
  },
  transaction: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  informational: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  unknown: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
};

// ─── Availability detection ────────────────────────────────────────────────────
//
// Determines whether the email's content is time-bound (scheduled) or
// permanently accessible (on_demand). Uses parsed signals first, then
// subtype hints, then type-level defaults. No hardcoded per-field exceptions.

const SCHEDULED_SUBTYPES = new Set([
  'event/live', 'event/webinar', 'event/meeting',
  'course/bootcamp', 'course/workshop', 'course/mentorship',
  'billing/reminder', 'billing/overdue', 'billing/renewal',
  'promotion/flash_sale',
]);

const ON_DEMAND_SUBTYPES = new Set([
  'course/recorded',
  'promotion/discount',
]);

const SCHEDULED_BY_DEFAULT = new Set<EmailType>([
  'event', 'billing', 'alert',
]);

function detectAvailability(data: ParsedData, classified: ClassificationResult): Availability {
  // 1. A detected time is the strongest signal: content is time-bound
  if (data.normalizedTimes.length > 0) return 'scheduled';

  // 2. Subtype carries more specificity than the base type
  if (classified.subtype) {
    if (ON_DEMAND_SUBTYPES.has(classified.subtype))  return 'on_demand';
    if (SCHEDULED_SUBTYPES.has(classified.subtype))  return 'scheduled';
  }

  // 3. Type-level defaults (conservative — avoids false positives)
  if (SCHEDULED_BY_DEFAULT.has(classified.type)) return 'scheduled';

  // 4. Course is scheduled if it has a concrete date, on_demand otherwise
  if (classified.type === 'course') {
    return data.normalizedDates.some(d => d.status === 'exact') ? 'scheduled' : 'on_demand';
  }

  // 5. All other types default to on_demand
  return 'on_demand';
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function resolveDecision(
  data:       ParsedData,
  classified: ClassificationResult,
): DecisionContext {
  const availability = detectAvailability(data, classified);
  const req = REQUIREMENTS[classified.type][availability];
  return { availability, ...req };
}
