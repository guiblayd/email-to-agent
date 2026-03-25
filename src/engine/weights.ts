/**
 * Centralized scoring table for the evidence-based classifier.
 *
 * Structure: signal_label → { email_type: weight }
 *
 * Positive weights reinforce a type. Negative weights penalise it.
 * The same signal can contribute positively to one type and negatively
 * (or with zero contribution) to another.
 *
 * All weights are integers. Magnitude guidelines:
 *   28–35 = unambiguous strong signal (very hard to produce by accident)
 *   18–27 = strong signal (specific multi-word phrase or structural fact)
 *   10–17 = medium signal (common phrase with reasonable specificity)
 *    4–9  = weak signal (single common word, easily co-incidental)
 *  negative = counter-evidence that reduces type likelihood
 */

import type { EmailType } from '../types';

// Record<signalLabel, Record<EmailType, weight>>
export const TYPE_EVIDENCE_WEIGHTS: Record<string, Partial<Record<EmailType, number>>> = {

  // ── BILLING ──────────────────────────────────────────────────────────────────

  invoice:                  { billing: 30, transaction: 12 },
  payment_due:              { billing: 30 },
  overdue:                  { billing: 30 },
  payment_failed:           { billing: 28 },
  auto_renewal:             { billing: 26 },
  billing_statement:        { billing: 28 },
  payment_word:             { billing: 10, transaction: 5 },
  billing_word:             { billing: 10 },
  charge_word:              { billing: 10 },
  price_word:               { billing: 5, promotion: 5 },
  currency_detected:        { billing: 25, promotion: 14, transaction: 14 },
  due_date_detected:        { billing: 22 },
  invoice_id_detected:      { billing: 16, transaction: 16 },
  pay_now_cta:              { billing: 22 },
  payment_execution_intent: { billing: 22 },
  // Billing negatives
  api_billing_topic:        { billing: -22 },
  pricing_policy_topic:     { billing: -22 },
  long_explanatory_text:    { billing: -18 },

  // ── EVENT ─────────────────────────────────────────────────────────────────────

  webinar:                      { event: 30 },
  live_stream:                  { event: 30 },
  conference:                   { event: 30 },
  meeting:                      { event: 26 },
  palestra:                     { event: 24 },
  event_word:                   { event: 18 },
  join_attend:                  { event: 10, course: 6 },
  exact_date_detected:          { event: 22, course: 14, billing: 8, promotion: 10 },
  exact_time_detected:          { event: 22 },
  timezone_detected:            { event: 12 },
  register_cta:                 { event: 12, course: 16 },
  join_event_cta:               { event: 16 },
  scheduled_interaction_intent: { event: 18 },
  // Event negatives
  on_demand_signal:             { event: -28, course: 14, content: 14 },

  // ── COURSE ────────────────────────────────────────────────────────────────────

  course_word:         { course: 28 },
  training_word:       { course: 24 },
  mentorship_word:     { course: 24 },
  bootcamp_word:       { course: 30 },
  masterclass_word:    { course: 28 },
  certification_word:  { course: 24 },
  program_word:        { course: 18 },
  module_lesson:       { course: 12 },
  cohort_turma:        { course: 16 },
  enrollment_signal:   { course: 16 },
  enroll_cta:          { course: 20 },
  educational_intent:  { course: 22, content: 10 },
  on_demand_learning:  { course: 16 },
  duration_detected:   { course: 12 },
  curriculum_structure:{ course: 14 },

  // ── CONTENT ───────────────────────────────────────────────────────────────────

  article_word:              { content: 22, newsletter: 8 },
  video_word:                { content: 24 },
  tutorial_word:             { content: 22 },
  guide_word:                { content: 18 },
  release_notes_word:        { content: 24 },
  product_update_word:       { content: 20, alert: 14 },
  read_watch:                { content: 8,  newsletter: 6 },
  api_context:               { content: 22, alert: 20 },
  technical_update_context:  { content: 20, alert: 16 },
  product_update_context:    { content: 20, alert: 20 },
  educational_context:       { content: 16 },
  on_demand_content_signal:  { content: 16 },
  long_body_text:            { content: 14, newsletter: 10 },
  explanatory_paragraphs:    { content: 16 },

  // ── ALERT ─────────────────────────────────────────────────────────────────────

  security_alert:              { alert: 34, account: 14 },
  account_locked:              { alert: 30, account: 22 },
  policy_terms:                { alert: 20 },
  system_maintenance:          { alert: 30 },
  important_urgent:            { alert: 10 },
  policy_update_context:       { alert: 24, content: 14 },
  system_update_context:       { alert: 24 },
  platform_change_context:     { alert: 20, content: 14 },
  account_notice_context:      { alert: 18, transaction: 8 },
  operational_impact_statement:{ alert: 20 },
  // Alert negatives
  strong_commercial_offer:     { alert: -22 },

  // ── PROMOTION ─────────────────────────────────────────────────────────────────

  promo_word:               { promotion: 28 },
  offer_word:               { promotion: 24 },
  coupon_word:              { promotion: 26 },
  discount_word:            { promotion: 28 },
  percentage_detected:      { promotion: 24, billing: 6 },
  expiry_date_detected:     { promotion: 20, billing: 6 },
  buy_now_cta:              { promotion: 20 },
  commercial_intent:        { promotion: 20 },
  limited_time_context:     { promotion: 16 },
  purely_informational_promo:{ promotion: -18 },

  // ── NEWSLETTER ────────────────────────────────────────────────────────────────

  newsletter_word:             { newsletter: 30 },
  edition_word:                { newsletter: 20 },
  digest_word:                 { newsletter: 24 },
  highlights_word:             { newsletter: 18 },
  multiple_topics:             { newsletter: 24 },
  editorial_structure:         { newsletter: 20 },
  recurring_format:            { newsletter: 20 },
  digest_intent:               { newsletter: 20 },
  single_operational_action:   { newsletter: -22 },
  strong_receipt_in_newsletter:{ newsletter: -24, content: -8 },

  // ── TRANSACTION ───────────────────────────────────────────────────────────────

  receipt_word:              { transaction: 30 },
  order_confirmed:           { transaction: 30 },
  payment_received:          { transaction: 28 },
  booking_confirmed:         { transaction: 28 },
  confirmation_word:         { transaction: 24 },
  reference_id:              { transaction: 22, billing: 6 },
  completed_action_context:  { transaction: 20 },

  // ── ACCOUNT ───────────────────────────────────────────────────────────────────

  password_reset:            { account: 34 },
  account_verification:      { account: 34 },
  login_notice:              { account: 30 },
  account_warning:           { account: 28, alert: 10 },
  account_change_notice:     { account: 26 },
  account_word:              { account: 8 },
  link_expires:              { account: 12 },

  // ── SUPPORT ───────────────────────────────────────────────────────────────────

  ticket_word:               { support: 30 },
  support_reply_signal:      { support: 28 },
  issue_resolved_signal:     { support: 28 },
  support_followup:          { support: 18 },
  support_word:              { support: 10 },

  // ── COMMUNITY ─────────────────────────────────────────────────────────────────

  community_mention:         { community: 30 },
  community_reply:           { community: 28 },
  community_invite:          { community: 26 },
  community_notification:    { community: 18 },
  forum_word:                { community: 10 },

  // ── JOB ───────────────────────────────────────────────────────────────────────

  application_update:        { job: 30 },
  interview_invite:          { job: 34 },
  recruiter_outreach:        { job: 28 },
  job_offer:                 { job: 32 },
  job_word:                  { job: 8 },

  // ── LEGAL ─────────────────────────────────────────────────────────────────────

  terms_update:              { legal: 30, alert: 10 },
  privacy_update:            { legal: 30 },
  compliance_notice:         { legal: 28, alert: 10 },
  contract_signal:           { legal: 26 },
  effective_date_signal:     { legal: 16, alert: 8 },

  // ── INFORMATIONAL (fallback weights — alert/content now absorb most of these) ──

  informational_phrase:      { alert: 10, content: 6 },
  fyi_signal:                { content: 8, newsletter: 4 },
  reminder_word:             { billing: 4, alert: 4 },
};

// ─── Score computation ─────────────────────────────────────────────────────────

/**
 * Sums evidence weights for each email type.
 * Returns only types with a positive raw score.
 */
export function computeRawScores(
  evidence: Array<{ label: string }>,
): Partial<Record<EmailType, number>> {
  const scores: Partial<Record<EmailType, number>> = {};

  for (const item of evidence) {
    const typeWeights = TYPE_EVIDENCE_WEIGHTS[item.label];
    if (!typeWeights) continue;

    for (const [type, weight] of Object.entries(typeWeights) as [EmailType, number][]) {
      scores[type] = (scores[type] ?? 0) + weight;
    }
  }

  // Remove types whose net score is zero or negative
  for (const type of Object.keys(scores) as EmailType[]) {
    if ((scores[type] ?? 0) <= 0) delete scores[type];
  }

  return scores;
}
