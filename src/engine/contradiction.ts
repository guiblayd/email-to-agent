/**
 * Contradiction engine for the evidence-based classifier.
 *
 * A contradiction fires when a type has scored positively from lexical matches,
 * but the structural evidence required for that type is absent or directly
 * contradicted by other evidence.
 *
 * Contradictions do NOT override type selection — they produce a score penalty
 * and generate explainability messages that surface in decisionReason[].
 *
 * A type with a contradiction can still win if its adjusted score leads all
 * other candidates — but the confidence will be appropriately reduced.
 */

import type { EmailType, ParsedData } from '../types';
import type { EvidenceItem }           from './evidence';

export interface Contradiction {
  /** Machine-readable label for this contradiction. */
  label:   string;
  /** Human-readable explanation for the explainability output. */
  message: string;
  /** Penalty subtracted from the contradicted type's adjusted score. */
  penalty: number;
  /** Which type this contradiction penalises. */
  targets: EmailType[];
}

// ─── Contradiction patterns ────────────────────────────────────────────────────

const CONTRADICTION_PATTERNS: Array<{
  label:   string;
  message: string;
  penalty: number;
  targets: EmailType[];
  test:    (ev: Set<string>, data: ParsedData) => boolean;
}> = [

  // ── BILLING contradictions ──────────────────────────────────────────────────

  {
    label:   'billing_no_currency_or_amount',
    message: 'Billing vocabulary present but no currency or amount detected',
    penalty: 18,
    targets: ['billing'],
    test: ev => ev.has('billing_word') && !ev.has('currency_detected') && !ev.has('invoice') && !ev.has('payment_due'),
  },
  {
    label:   'billing_no_due_date_or_action',
    message: 'Billing vocabulary present but no due date or payment action found',
    penalty: 18,
    targets: ['billing'],
    test: ev => (ev.has('billing_word') || ev.has('charge_word'))
      && !ev.has('due_date_detected')
      && !ev.has('pay_now_cta')
      && !ev.has('payment_due')
      && !ev.has('overdue'),
  },
  {
    label:   'billing_in_api_or_policy_context',
    message: 'Financial terms appear inside a technical or policy context — not a payment request',
    penalty: 30,
    targets: ['billing'],
    test: ev => (ev.has('api_billing_topic') || ev.has('pricing_policy_topic'))
      && !ev.has('currency_detected')
      && !ev.has('pay_now_cta'),
  },

  // ── EVENT contradictions ────────────────────────────────────────────────────

  {
    label:   'event_with_strong_on_demand_signal',
    message: 'Event language present but email is clearly about on-demand or recorded content',
    penalty: 25,
    targets: ['event'],
    test: ev => ev.has('on_demand_signal') && !ev.has('live_stream') && !ev.has('webinar'),
  },
  {
    label:   'event_no_scheduling_signal',
    message: 'Event vocabulary present but no date, time, or scheduling signal found',
    penalty: 20,
    targets: ['event'],
    test: (ev, d) => (ev.has('event_word') || ev.has('join_attend'))
      && !ev.has('exact_date_detected')
      && !ev.has('exact_time_detected')
      && !ev.has('live_stream')
      && !ev.has('webinar')
      && d.normalizedDates.length === 0
      && d.normalizedTimes.length === 0,
  },

  // ── PROMOTION contradictions ────────────────────────────────────────────────

  {
    label:   'promotion_no_offer_structure',
    message: 'Promotional vocabulary present but no offer structure, discount, or CTA found',
    penalty: 20,
    targets: ['promotion'],
    test: ev => (ev.has('offer_word') || ev.has('promo_word'))
      && !ev.has('percentage_detected')
      && !ev.has('buy_now_cta')
      && !ev.has('coupon_word')
      && !ev.has('discount_word')
      && !ev.has('commercial_intent'),
  },

  // ── NEWSLETTER contradictions ───────────────────────────────────────────────

  {
    label:   'newsletter_is_transaction',
    message: 'Newsletter-like structure but content is clearly a receipt or confirmation',
    penalty: 30,
    targets: ['newsletter'],
    test: ev => ev.has('strong_receipt_in_newsletter'),
  },
  {
    label:   'newsletter_single_action',
    message: 'Short single-action email misidentified as newsletter',
    penalty: 22,
    targets: ['newsletter'],
    test: ev => ev.has('single_operational_action'),
  },

  // ── TRANSACTION contradictions ──────────────────────────────────────────────

  {
    label:   'transaction_is_editorial',
    message: 'Confirmation-style words present but content is editorial or informational',
    penalty: 18,
    targets: ['transaction'],
    test: (ev, d) => (ev.has('confirmation_word') || ev.has('completed_action_context'))
      && !ev.has('order_confirmed')
      && !ev.has('payment_received')
      && !ev.has('receipt_word')
      && d.wordCount > 180,
  },

  // ── ALERT contradictions ────────────────────────────────────────────────────

  {
    label:   'alert_is_commercial',
    message: 'Alert-like urgency language present but email is a commercial offer',
    penalty: 24,
    targets: ['alert'],
    test: ev => ev.has('strong_commercial_offer'),
  },
  {
    label:   'alert_is_purely_educational',
    message: 'Alert vocabulary present but tone is purely educational with no operational impact',
    penalty: 18,
    targets: ['alert'],
    test: ev => (ev.has('important_urgent') && !ev.has('security_alert') && !ev.has('account_locked')
      && !ev.has('system_maintenance') && !ev.has('policy_terms'))
      && (ev.has('educational_intent') || ev.has('course_word') || ev.has('educational_context')),
  },
];

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Identifies all contradictions present in the evidence.
 * Returns a flat list of fired contradictions.
 */
export function detectContradictions(
  evidence: EvidenceItem[],
  data:     ParsedData,
): Contradiction[] {
  const labelSet = new Set(evidence.map(e => e.label));
  const fired: Contradiction[] = [];

  for (const pattern of CONTRADICTION_PATTERNS) {
    if (pattern.test(labelSet, data)) {
      fired.push({
        label:   pattern.label,
        message: pattern.message,
        penalty: pattern.penalty,
        targets: pattern.targets,
      });
    }
  }

  return fired;
}

/**
 * Computes the total contradiction penalty for a specific type.
 */
export function contradictionPenaltyFor(
  type:           EmailType,
  contradictions: Contradiction[],
): number {
  return contradictions
    .filter(c => c.targets.includes(type))
    .reduce((sum, c) => sum + c.penalty, 0);
}
