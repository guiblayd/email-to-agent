/**
 * Eligibility engine for the evidence-based classifier.
 *
 * A type can accumulate a high raw score from lexical matches alone,
 * yet still be structurally implausible for the email's content.
 * Eligibility rules enforce minimum structural requirements per type.
 *
 * When eligibility fails:
 * - The type's adjusted score is multiplied by the returned scoreMultiplier
 *   (typically 0.0–0.3), effectively collapsing it in the competition.
 * - The failed checks are surfaced in the explainability output.
 *
 * Eligibility is checked ONLY for types that actually scored > 0.
 */

import type { EmailType, ParsedData } from '../types';
import type { EvidenceItem } from './evidence';

export interface EligibilityResult {
  passed:        boolean;
  failedChecks:  string[];
  /** Score multiplier applied to the raw score when eligibility fails (0–1). */
  scoreMultiplier: number;
}

// ─── Label set helper ──────────────────────────────────────────────────────────

function labels(evidence: EvidenceItem[]): Set<string> {
  return new Set(evidence.map(e => e.label));
}

// ─── Per-type eligibility checkers ────────────────────────────────────────────

function billingEligibility(ev: EvidenceItem[], data: ParsedData): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  // Hard signal groups — billing requires ≥ 2 distinct categories
  const hasDocumentTerm  = L.has('invoice') || L.has('billing_statement');
  const hasCurrencyOrAmt = L.has('currency_detected') || L.has('invoice_id_detected');
  const hasDueDateSignal = L.has('due_date_detected') || L.has('payment_due') || L.has('overdue');
  const hasPaymentAction = L.has('pay_now_cta') || L.has('payment_execution_intent') || L.has('payment_failed');
  const hasAutoRenewal   = L.has('auto_renewal');

  const hardCount = [hasDocumentTerm, hasCurrencyOrAmt, hasDueDateSignal, hasPaymentAction, hasAutoRenewal]
    .filter(Boolean).length;

  // Automatic disqualification: billing vocabulary in a purely technical context
  // with no actual payment structure present
  const isApiOrPolicyContext = L.has('api_billing_topic') || L.has('pricing_policy_topic');
  const hasRealMoneyStructure = hasCurrencyOrAmt || hasDueDateSignal || hasPaymentAction;

  if (isApiOrPolicyContext && !hasRealMoneyStructure) {
    failed.push('billing_disqualified_technical_context');
    return { passed: false, failedChecks: failed, scoreMultiplier: 0.0 };
  }

  if (hardCount < 2) {
    failed.push('billing_requires_two_hard_signals');
    if (!hasDocumentTerm && !hasCurrencyOrAmt) failed.push('no_invoice_or_currency');
    if (!hasDueDateSignal && !hasPaymentAction)  failed.push('no_due_date_or_payment_action');
  }

  // Long explanatory text with no hard billing structure = topic email, not a bill
  if (data.wordCount > 200 && hardCount < 2) {
    failed.push('long_text_without_billing_structure');
  }

  const passed = failed.length === 0;
  return {
    passed,
    failedChecks: failed,
    scoreMultiplier: passed ? 1.0 : hardCount === 1 ? 0.25 : 0.0,
  };
}

function eventEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  // Requires: scheduling evidence (time OR date) AND a live/interaction signal
  const hasSchedulingEvidence = L.has('exact_date_detected') || L.has('exact_time_detected');
  const hasLiveSignal = L.has('webinar') || L.has('live_stream') || L.has('conference')
    || L.has('meeting') || L.has('palestra') || L.has('scheduled_interaction_intent');

  if (!hasSchedulingEvidence && !hasLiveSignal) {
    failed.push('event_requires_scheduling_or_live_signal');
  }

  // Strong on-demand evidence collapses event confidence
  if (L.has('on_demand_signal') && !L.has('live_stream') && !L.has('webinar')) {
    failed.push('on_demand_signal_contradicts_event');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.2 };
}

function courseEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasEducationalBase = L.has('course_word') || L.has('training_word')
    || L.has('mentorship_word') || L.has('bootcamp_word') || L.has('masterclass_word')
    || L.has('certification_word') || L.has('program_word');

  const hasStructuralSignal = L.has('enrollment_signal') || L.has('enroll_cta')
    || L.has('module_lesson') || L.has('cohort_turma') || L.has('curriculum_structure')
    || L.has('educational_intent') || L.has('on_demand_learning');

  if (!hasEducationalBase) {
    failed.push('course_requires_educational_base_term');
  }
  if (!hasStructuralSignal && !hasEducationalBase) {
    failed.push('course_requires_enrollment_or_module_structure');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.3 };
}

function promotionEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasCommercialOffer = L.has('promo_word') || L.has('offer_word')
    || L.has('coupon_word') || L.has('discount_word');
  const hasOfferStructure = L.has('percentage_detected') || L.has('expiry_date_detected')
    || L.has('buy_now_cta') || L.has('commercial_intent') || L.has('limited_time_context');

  if (!hasCommercialOffer) {
    failed.push('promotion_requires_offer_vocabulary');
  }
  if (!hasOfferStructure) {
    failed.push('promotion_requires_offer_structure_or_cta');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.3 };
}

function newsletterEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasEditorialMarker = L.has('newsletter_word') || L.has('edition_word')
    || L.has('digest_word') || L.has('highlights_word');
  const hasStructure = L.has('multiple_topics') || L.has('editorial_structure')
    || L.has('recurring_format') || L.has('digest_intent');

  if (!hasEditorialMarker && !hasStructure) {
    failed.push('newsletter_requires_editorial_marker_or_structure');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.3 };
}

function transactionEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasCompletionSignal = L.has('receipt_word') || L.has('order_confirmed')
    || L.has('payment_received') || L.has('booking_confirmed')
    || L.has('confirmation_word') || L.has('password_reset');

  const hasProof = L.has('reference_id') || L.has('completed_action_context')
    || L.has('currency_detected') || L.has('invoice_id_detected');

  if (!hasCompletionSignal) {
    failed.push('transaction_requires_completion_or_confirmation_signal');
  }
  if (!hasProof && !hasCompletionSignal) {
    failed.push('transaction_requires_reference_or_confirmation_structure');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.3 };
}

function alertEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasAlertSignal = L.has('security_alert') || L.has('account_locked')
    || L.has('system_maintenance') || L.has('policy_terms');
  const hasContext = L.has('policy_update_context') || L.has('system_update_context')
    || L.has('platform_change_context') || L.has('account_notice_context')
    || L.has('operational_impact_statement');

  if (!hasAlertSignal && !hasContext) {
    failed.push('alert_requires_operational_or_security_signal');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.3 };
}

function contentEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasContentSignal = L.has('article_word') || L.has('video_word')
    || L.has('tutorial_word') || L.has('guide_word') || L.has('release_notes_word')
    || L.has('product_update_word');
  const hasContext = L.has('api_context') || L.has('technical_update_context')
    || L.has('product_update_context') || L.has('educational_context')
    || L.has('on_demand_content_signal') || L.has('long_body_text');

  if (!hasContentSignal && !hasContext) {
    failed.push('content_requires_content_type_or_context_signal');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.4 };
}

function accountEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasAccountSignal = L.has('password_reset') || L.has('account_verification')
    || L.has('login_notice') || L.has('account_warning') || L.has('account_change_notice')
    || L.has('account_locked');

  if (!hasAccountSignal) {
    failed.push('account_requires_explicit_account_action_signal');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.2 };
}

function supportEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasSupportSignal = L.has('ticket_word') || L.has('support_reply_signal')
    || L.has('issue_resolved_signal') || L.has('support_followup');

  if (!hasSupportSignal) {
    failed.push('support_requires_ticket_or_reply_signal');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.3 };
}

function communityEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasCommunitySignal = L.has('community_mention') || L.has('community_reply')
    || L.has('community_invite') || L.has('community_notification');

  if (!hasCommunitySignal) {
    failed.push('community_requires_mention_reply_or_invite_signal');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.3 };
}

function jobEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasJobSignal = L.has('application_update') || L.has('interview_invite')
    || L.has('recruiter_outreach') || L.has('job_offer');

  if (!hasJobSignal) {
    failed.push('job_requires_application_interview_or_recruiter_signal');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.3 };
}

function legalEligibility(ev: EvidenceItem[]): EligibilityResult {
  const L = labels(ev);
  const failed: string[] = [];

  const hasLegalSignal = L.has('terms_update') || L.has('privacy_update')
    || L.has('compliance_notice') || L.has('contract_signal');

  if (!hasLegalSignal) {
    failed.push('legal_requires_terms_privacy_compliance_or_contract_signal');
  }

  const passed = failed.length === 0;
  return { passed, failedChecks: failed, scoreMultiplier: passed ? 1.0 : 0.3 };
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Checks whether the evidence is structurally sufficient to classify the email
 * as the given type. Returns a scoreMultiplier that should be applied to the
 * raw score before final type resolution.
 */
export function checkEligibility(
  type:     EmailType,
  evidence: EvidenceItem[],
  data:     ParsedData,
): EligibilityResult {
  switch (type) {
    case 'billing':     return billingEligibility(evidence, data);
    case 'event':       return eventEligibility(evidence);
    case 'course':      return courseEligibility(evidence);
    case 'promotion':   return promotionEligibility(evidence);
    case 'newsletter':  return newsletterEligibility(evidence);
    case 'transaction': return transactionEligibility(evidence);
    case 'alert':       return alertEligibility(evidence);
    case 'content':     return contentEligibility(evidence);
    case 'account':     return accountEligibility(evidence);
    case 'support':     return supportEligibility(evidence);
    case 'community':   return communityEligibility(evidence);
    case 'job':         return jobEligibility(evidence);
    case 'legal':       return legalEligibility(evidence);
    case 'unknown':     return { passed: true, failedChecks: [], scoreMultiplier: 1.0 };
  }
}
