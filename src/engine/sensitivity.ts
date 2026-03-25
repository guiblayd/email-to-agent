/**
 * Sensitivity inference layer.
 *
 * Sensitivity indicates the potential harm if an agent mishandles the email.
 * It is independent of priority and urgency — a low-priority legal notice can
 * still be high-sensitivity because misrouting it has compliance consequences.
 *
 * Levels:
 *   critical — security credentials, active threats, legal obligations with deadlines
 *   high     — financial transactions, account changes, compliance notices
 *   medium   — job opportunities, support tickets, policy updates
 *   low      — newsletters, content, promotions, community notifications
 */

import type { EmailType, EmailSubtype, Sensitivity, ParsedData } from '../types';

// ─── Subtype-level overrides (most precise) ───────────────────────────────────

const SUBTYPE_SENSITIVITY: Partial<Record<EmailSubtype, Sensitivity>> = {
  // account — credential and access emails are always critical
  'account/password_reset':   'critical',
  'account/verification':     'critical',
  'account/account_warning':  'critical',
  'account/login_notice':     'high',
  'account/account_change':   'high',
  // alert
  'alert/security_alert':     'critical',
  'alert/access_issue':       'critical',
  'alert/service_incident':   'high',
  'alert/policy_update':      'medium',
  'alert/system_update':      'medium',
  // billing
  'billing/failed_payment':   'critical',
  'billing/payment_reminder': 'high',
  'billing/charge_notice':    'high',
  'billing/subscription_due': 'high',
  'billing/invoice':          'high',
  // legal
  'legal/compliance_notice':  'critical',
  'legal/contract_notice':    'high',
  'legal/terms_update':       'medium',
  'legal/privacy_update':     'medium',
  // transaction
  'transaction/receipt':              'medium',
  'transaction/purchase_confirmation':'medium',
  'transaction/refund_confirmation':  'high',
  'transaction/order_update':         'medium',
  'transaction/booking_confirmation': 'medium',
  // job
  'job/interview_invite':     'high',
  'job/application_update':   'medium',
  'job/offer':                'high',
  'job/recruiter_message':    'low',
  'job/opportunity_alert':    'low',
  // support
  'support/issue_resolved':   'medium',
  'support/ticket_update':    'medium',
  'support/support_reply':    'medium',
  'support/follow_up':        'low',
  // community — notifications are low-stakes
  'community/invitation':          'low',
  'community/reply_notification':  'low',
  'community/mention':             'low',
  'community/comment_notification':'low',
  'community/community_update':    'low',
  // promotion / content / newsletter
  'promotion/discount':       'low',
  'promotion/coupon':         'low',
  'promotion/limited_time':   'low',
  'promotion/launch_offer':   'low',
  'promotion/upsell':         'low',
  'promotion/seasonal_offer': 'low',
  'content/video':            'low',
  'content/article':          'low',
  'content/tutorial':         'low',
  'content/documentation':    'low',
  'content/release_notes':    'low',
  'content/product_update':   'low',
  'content/educational_resource': 'low',
  'newsletter/digest':         'low',
  'newsletter/editorial':      'low',
  'newsletter/weekly_roundup': 'low',
  'newsletter/company_news':   'low',
};

// ─── Main-type defaults ───────────────────────────────────────────────────────

const TYPE_SENSITIVITY_DEFAULT: Record<EmailType, Sensitivity> = {
  alert:       'high',
  account:     'high',
  billing:     'high',
  legal:       'high',
  transaction: 'medium',
  job:         'medium',
  support:     'medium',
  event:       'low',
  course:      'low',
  content:     'low',
  promotion:   'low',
  newsletter:  'low',
  community:   'low',
  unknown:     'medium',
};

// ─── Content-based boosters ───────────────────────────────────────────────────

function detectContentBoost(data: ParsedData): Sensitivity | null {
  const lower = data.rawText.toLowerCase();

  // Explicit compromise / breach language → always critical
  if (
    lower.includes('compromised') || lower.includes('unauthorized access') ||
    lower.includes('breach') || lower.includes('hacked') ||
    lower.includes('suspicious activity') || lower.includes('stolen') ||
    lower.includes('comprometido') || lower.includes('acesso não autorizado')
  ) return 'critical';

  // Financial loss language
  if (
    lower.includes('fraud') || lower.includes('fraudulent') ||
    lower.includes('chargeback') || lower.includes('dispute') ||
    lower.includes('fraude') || lower.includes('contestação')
  ) return 'critical';

  return null;
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function inferSensitivity(
  type:    EmailType,
  subtype: EmailSubtype | undefined,
  data:    ParsedData,
): Sensitivity {
  // 1. Content boost (overrides everything — explicit compromise language)
  const boost = detectContentBoost(data);
  if (boost) return boost;

  // 2. Subtype override
  if (subtype && SUBTYPE_SENSITIVITY[subtype] !== undefined) {
    return SUBTYPE_SENSITIVITY[subtype]!;
  }

  // 3. Main type default
  return TYPE_SENSITIVITY_DEFAULT[type];
}
