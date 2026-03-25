import type { ParsedData, EmailType, EmailSubtype, EmailIntent } from '../types';

// ─── Default intent per main type ─────────────────────────────────────────────

const TYPE_INTENT_DEFAULT: Record<EmailType, EmailIntent> = {
  event:       'attend',
  course:      'register',
  content:     'read',
  promotion:   'review',
  newsletter:  'read',
  billing:     'pay',
  transaction: 'track',
  alert:       'review',
  account:     'verify',
  support:     'reply',
  community:   'acknowledge',
  job:         'review',
  legal:       'acknowledge',
  unknown:     'read',
};

// ─── Subtype-level intent overrides ───────────────────────────────────────────
//
// When a subtype is detected, it provides a more precise intent signal than
// the main type alone. These take precedence over text-pattern overrides
// when the subtype is high-confidence.

const SUBTYPE_INTENT: Partial<Record<EmailSubtype, EmailIntent>> = {
  // event
  'event/live':         'attend',
  'event/webinar':      'attend',
  'event/meeting':      'attend',
  'event/workshop':     'attend',
  'event/launch_event': 'attend',
  // course
  'course/recorded':         'watch',
  'course/live':             'attend',
  'course/mentorship':       'attend',
  'course/training':         'attend',
  'course/cohort':           'register',
  'course/onboarding_course':'register',
  // content
  'content/video':               'watch',
  'content/article':             'read',
  'content/tutorial':            'read',
  'content/documentation':       'read',
  'content/release_notes':       'read',
  'content/product_update':      'read',
  'content/educational_resource':'read',
  // promotion
  'promotion/discount':      'review',
  'promotion/coupon':        'review',
  'promotion/limited_time':  'review',
  'promotion/launch_offer':  'review',
  'promotion/upsell':        'review',
  'promotion/seasonal_offer':'review',
  // billing
  'billing/invoice':           'pay',
  'billing/payment_reminder':  'pay',
  'billing/failed_payment':    'pay',
  'billing/charge_notice':     'pay',
  'billing/subscription_due':  'pay',
  // transaction
  'transaction/receipt':              'confirm',
  'transaction/purchase_confirmation':'confirm',
  'transaction/order_update':         'track',
  'transaction/refund_confirmation':  'confirm',
  'transaction/booking_confirmation': 'confirm',
  // alert
  'alert/security_alert':   'review',
  'alert/policy_update':    'read',
  'alert/system_update':    'read',
  'alert/access_issue':     'resolve',
  'alert/service_incident': 'acknowledge',
  // account
  'account/password_reset':   'verify',
  'account/login_notice':     'review',
  'account/verification':     'verify',
  'account/account_change':   'review',
  'account/account_warning':  'resolve',
  // support
  'support/support_reply':   'reply',
  'support/ticket_update':   'track',
  'support/issue_resolved':  'resolve',
  'support/follow_up':       'reply',
  // community
  'community/invitation':          'confirm',
  'community/reply_notification':  'acknowledge',
  'community/mention':             'reply',
  'community/comment_notification':'acknowledge',
  'community/community_update':    'read',
  // job
  'job/application_update':  'review',
  'job/interview_invite':    'confirm',
  'job/recruiter_message':   'reply',
  'job/opportunity_alert':   'review',
  // legal
  'legal/terms_update':       'acknowledge',
  'legal/privacy_update':     'acknowledge',
  'legal/compliance_notice':  'acknowledge',
  'legal/contract_notice':    'review',
  // newsletter
  'newsletter/digest':         'read',
  'newsletter/editorial':      'read',
  'newsletter/weekly_roundup': 'read',
  'newsletter/company_news':   'read',
};

// ─── Text-pattern overrides ────────────────────────────────────────────────────
//
// Applied after subtype check when no subtype is available or when the pattern
// is type-specific and adds precision the subtype map cannot.

const DOWNLOAD_PHRASES = [
  'download', 'baixar', 'get the pdf', 'download the guide',
  'download report', 'get the report', 'download your',
];

const VERIFY_PHRASES = [
  'verify', 'verifique', 'confirm your email', 'confirm your account',
  'click to verify', 'confirm your address', 'activate your account',
];

const WATCH_PHRASES = [
  'watch', 'assista', 'view the video', 'watch the recording', 'tune in',
  'watch now', 'watch this', 'new video',
];

export function detectIntent(
  data:    ParsedData,
  type:    EmailType,
  subtype: EmailSubtype | undefined,
): EmailIntent {
  // 1. Subtype override (most precise)
  if (subtype && SUBTYPE_INTENT[subtype] !== undefined) {
    return SUBTYPE_INTENT[subtype]!;
  }

  const lower = data.rawText.toLowerCase();

  // 2. Cross-type text-pattern overrides
  if (DOWNLOAD_PHRASES.some(p => lower.includes(p))) return 'download';
  if (VERIFY_PHRASES.some(p => lower.includes(p)) && (type === 'account' || type === 'transaction')) return 'verify';
  if (WATCH_PHRASES.some(p => lower.includes(p)) && type === 'content') return 'watch';
  if (lower.includes('track') || lower.includes('tracking') || lower.includes('delivery status') || lower.includes('shipping update')) return 'track';

  // 3. Default per main type
  return TYPE_INTENT_DEFAULT[type];
}
