import type { ParsedData, EmailType, Availability, ClassificationResult } from '../types';
import { enRules, ptRules } from './rules';
import type { Rules } from './rules';

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
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  course: {
    scheduled: { requiresDate: true,  requiresTime: false, linkDependencyAcceptable: false },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  content: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  promotion: {
    scheduled: { requiresDate: true,  requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  newsletter: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  billing: {
    scheduled: { requiresDate: true,  requiresTime: false, linkDependencyAcceptable: false },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
  },
  alert: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
  },
  transaction: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  // Account: link required for password reset / verification flows (link expires)
  account: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  // Support: no time requirement; replies are asynchronous
  support: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  // Community: notifications are informational, no date/time required
  community: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  // Job: interview invites are time-bound (scheduled path); other subtypes are not
  job: {
    scheduled: { requiresDate: true,  requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  // Legal: compliance notices have effective dates (scheduled path)
  legal: {
    scheduled: { requiresDate: true,  requiresTime: false, linkDependencyAcceptable: false },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: false },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
  unknown: {
    scheduled: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    on_demand: { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    ongoing:   { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
    none:      { requiresDate: false, requiresTime: false, linkDependencyAcceptable: true  },
  },
};

// ─── Availability detection ────────────────────────────────────────────────────
//
// Step 1 — intrinsic type: event/billing/alert are always time-bound.
// Step 2 — text signals: explicit on-demand or scheduled phrases in the body,
//           scanned from language-specific phrase lists. On-demand phrases win
//           over any detected time/date in the text, eliminating false positives
//           where a recording timestamp is parsed as a scheduling requirement.
// Step 3 — subtype: if the classifier identified a subtype, it is a reliable
//           structural signal (e.g. course/recorded → on_demand).
// Step 4 — time heuristic: a specific clock time in the body means the content
//           is time-bound, but only when no on-demand phrases are present.
// Step 5 — course date heuristic: a course with an exact start date is scheduled;
//           one without is likely self-paced.
// Step 6 — default: on_demand.

// Types whose availability is always scheduled regardless of content signals.
const ALWAYS_SCHEDULED = new Set<EmailType>(['event', 'billing', 'legal']);

// Types whose availability is always 'none' (transactional/reactive, not content to attend/access)
const ALWAYS_NONE = new Set<EmailType>(['alert', 'account', 'transaction']);

// Types whose availability is always 'ongoing' (continuous/recurring engagement)
const ALWAYS_ONGOING = new Set<EmailType>(['support', 'community']);

// Subtypes that definitively resolve availability without needing text analysis.
const ON_DEMAND_SUBTYPES = new Set([
  'course/recorded',
  'content/video', 'content/article', 'content/tutorial',
  'content/documentation', 'content/release_notes',
  'content/product_update', 'content/educational_resource',
  'promotion/discount', 'promotion/coupon', 'promotion/upsell',
  'newsletter/digest', 'newsletter/editorial',
  'newsletter/weekly_roundup', 'newsletter/company_news',
  'support/issue_resolved', 'support/ticket_update',
  'community/reply_notification', 'community/mention',
  'community/comment_notification', 'community/community_update',
  'job/application_update', 'job/recruiter_message', 'job/opportunity_alert',
  'legal/terms_update', 'legal/privacy_update',
]);

const SCHEDULED_SUBTYPES = new Set([
  'event/live', 'event/webinar', 'event/meeting',
  'event/workshop', 'event/launch_event',
  'course/live', 'course/cohort', 'course/mentorship',
  'course/training', 'course/onboarding_course',
  'billing/payment_reminder', 'billing/failed_payment',
  'billing/subscription_due', 'billing/charge_notice',
  'promotion/limited_time', 'promotion/launch_offer', 'promotion/seasonal_offer',
  'job/interview_invite',
  'legal/compliance_notice', 'legal/contract_notice',
  'account/password_reset', 'account/verification',
]);

// ── Text-signal scanner ──────────────────────────────────────────────────────

function countTextSignals(
  text:  string,
  rules: Rules,
): { onDemand: number; scheduled: number } {
  const lower = text.toLowerCase();
  return {
    onDemand:  rules.onDemandPhrases.filter(p  => lower.includes(p)).length,
    scheduled: rules.scheduledPhrases.filter(p => lower.includes(p)).length,
  };
}

// ── Availability detection ───────────────────────────────────────────────────

function detectAvailability(data: ParsedData, classified: ClassificationResult): Availability {
  // Step 0a — transactional/reactive types: availability is not applicable
  if (ALWAYS_NONE.has(classified.type)) return 'none';

  // Step 0b — support and community are continuous engagement
  if (ALWAYS_ONGOING.has(classified.type)) return 'ongoing';

  // Step 1 — intrinsic types are always scheduled
  if (ALWAYS_SCHEDULED.has(classified.type)) return 'scheduled';

  // Step 2 — explicit text signals
  // On-demand phrases (e.g. "já disponível", "watch at your own pace") take
  // precedence over any time/date found in the body to prevent false positives
  // where a recording timestamp is treated as a scheduling requirement.
  const rules = data.language === 'pt' ? ptRules : enRules;
  const { onDemand: odScore, scheduled: sScore } = countTextSignals(data.rawText, rules);

  if (odScore > 0 && odScore >= sScore) return 'on_demand';

  // Step 3 — subtype is a reliable structural signal
  if (classified.subtype) {
    if (ON_DEMAND_SUBTYPES.has(classified.subtype))  return 'on_demand';
    if (SCHEDULED_SUBTYPES.has(classified.subtype))  return 'scheduled';
  }

  // Step 4 — explicit scheduled text signal (no on-demand counter-signal)
  if (sScore > 0) return 'scheduled';

  // Step 5 — a clock time in the body means the content is time-bound
  if (data.normalizedTimes.length > 0) return 'scheduled';

  // Step 6 — course heuristic: scheduled only when an explicit start date is stated
  if (classified.type === 'course') {
    return data.normalizedDates.some(d => d.status === 'exact') ? 'scheduled' : 'on_demand';
  }

  // Step 7 — default
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
