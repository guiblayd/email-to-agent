import type { Rules } from './types';

const w = (word: string, weight: 1 | 2 | 3) => ({ word, weight });

export const enRules: Rules = {
  indicatorWords: [
    'the', 'and', 'for', 'with', 'this', 'that', 'you', 'are', 'have',
    'from', 'will', 'your', 'more', 'has', 'was', 'but', 'can', 'here',
    'about', 'when', 'there', 'which', 'their', 'or', 'is', 'in', 'on',
    'at', 'to', 'of', 'a', 'an', 'be', 'by', 'we', 'our', 'it', 'not',
    'as', 'if', 'do', 'its', 'up', 'so',
  ],

  typeKeywords: {
    event: [
      w('summit', 3), w('seminar', 3), w('conference', 3), w('webinar', 3),
      w('launch event', 3), w('live session', 3), w('live stream', 3),
      w('going live', 3), w('live on', 3),
      w('join us', 2), w('attend', 2), w('gathering', 2), w('ceremony', 2),
      w('event', 2), w('meeting', 2), w('take place', 2),
      w('happening', 1),
    ],
    course: [
      w('certification', 3), w('bootcamp', 3), w('masterclass', 3),
      w('mentorship', 3), w('curriculum', 3), w('cohort', 3),
      w('you will learn', 3), w('what you will learn', 3), w('advanced course', 3),
      w('course', 2), w('training', 2), w('lesson', 2), w('module', 2),
      w('tutorial', 2), w('step by step', 2), w('from scratch', 2),
      w('how to use', 2), w('how to build', 2),
      w('program', 1), w('beginner', 1), w('skill', 1), w('learn', 1),
    ],
    content: [
      w('youtube', 3), w('like and subscribe', 3), w('just released', 3),
      w('new episode', 3), w('released today', 3),
      w('podcast', 3), w('subscribe to', 2), w('new release', 2),
      w('watch now', 2), w('listen now', 2), w('episode', 2), w('new content', 2),
      w('published', 2),
      w('video', 1), w('article', 1), w('blog post', 1), w('channel', 1),
      w('watch', 1), w('listen', 1),
    ],
    promotion: [
      w('flash sale', 3), w('promo code', 3), w('coupon', 3),
      w('clearance', 3), w('% off', 3), w('percent off', 3), w('price drop', 3),
      w('free shipping', 2), w('special price', 2), w('discount', 2),
      w('sale', 2), w('deal', 2), w('shop now', 2), w('buy now', 2),
      w('get it now', 2),
      w('exclusive', 1), w('save', 1), w('offer', 1),
    ],
    newsletter: [
      w('newsletter', 3), w('digest', 3), w('roundup', 3), w('curated', 3),
      w('reading list', 3), w('this week in', 3), w('what we read', 3),
      w('weekly update', 3), w('monthly update', 3), w('top stories', 3),
      w('highlights', 2), w('recap', 2), w('edition', 2),
    ],
    billing: [
      w('payment due', 3), w('due date', 3), w('overdue', 3),
      w('amount due', 3), w('past due', 3), w('final notice', 3),
      w('payment failed', 3), w('auto-renewal', 3), w('renewal notice', 3),
      w('balance due', 3),
      w('invoice', 2), w('billing', 2), w('statement', 2),
      w('your subscription', 2),
    ],
    alert: [
      w('security alert', 3), w('breach', 3), w('compromised', 3),
      w('unauthorized', 3), w('account locked', 3), w('unusual activity', 3),
      w('sign-in attempt', 3), w('security notice', 3),
      w('suspicious', 2), w('detected', 2), w('verify', 2), w('potential risk', 2),
      w('alert', 2), w('warning', 2),
    ],
    transaction: [
      w('order confirmed', 3), w('order shipped', 3), w('has been shipped', 3),
      w('tracking number', 3), w('booking confirmed', 3), w('password reset', 3),
      w('successfully delivered', 3), w('confirmation number', 3),
      w('your purchase', 3),
      w('order placed', 2), w('download ready', 2), w('account created', 2),
      w('receipt', 2),
      w('welcome to', 1),
    ],
  },

  subtypeKeywords: {
    // ── event ──────────────────────────────────────────────────────────────────
    'event/live': [
      w('live stream', 3), w('going live', 3), w('live on', 3),
      w('live session', 2), w('tune in live', 2),
    ],
    'event/webinar': [
      w('webinar', 3), w('zoom link', 3), w('virtual event', 2),
      w('join online', 2), w('join via', 2), w('online event', 2),
    ],
    'event/meeting': [
      w('meeting', 3), w('one-on-one', 3), w('team meeting', 3),
      w('call with', 2), w('standup', 2), w('sync', 1),
    ],
    'event/workshop': [
      w('workshop', 3), w('hands-on', 2), w('practical session', 2),
      w('in-person session', 2), w('interactive session', 2),
    ],
    'event/launch_event': [
      w('launch event', 3), w('product launch', 3), w('launch party', 3),
      w('grand opening', 2), w('live launch', 2),
    ],

    // ── course ─────────────────────────────────────────────────────────────────
    'course/recorded': [
      w('self-paced', 3), w('on-demand', 3), w('watch at your own pace', 3),
      w('recorded', 3), w('available now', 2),
    ],
    'course/live': [
      w('live cohort', 3), w('live classes', 3), w('bootcamp', 3),
      w('full-time program', 3), w('intensive', 2), w('immersive', 2),
    ],
    'course/mentorship': [
      w('mentorship', 3), w('coaching', 3),
      w('mentor', 2), w('1-on-1', 2), w('personal guidance', 2),
    ],
    'course/training': [
      w('training program', 3), w('corporate training', 3),
      w('skills training', 2), w('onboarding training', 2), w('training', 1),
    ],
    'course/cohort': [
      w('cohort', 3), w('next cohort', 3), w('cohort starts', 3),
      w('join the cohort', 2), w('batch', 2), w('intake', 2),
    ],
    'course/onboarding_course': [
      w('onboarding', 3), w('getting started course', 3), w('welcome course', 2),
      w('onboarding series', 2), w('new user guide', 2),
    ],

    // ── content ────────────────────────────────────────────────────────────────
    'content/video': [
      w('new video', 3), w('watch this video', 3), w('video is now live', 3),
      w('just dropped', 2), w('watch now', 2), w('video', 1),
    ],
    'content/article': [
      w('new article', 3), w('just published', 3), w('read this', 2),
      w('article', 1), w('blog post', 1),
    ],
    'content/tutorial': [
      w('tutorial', 3), w('step by step', 3), w('how to', 2),
      w('guide to', 2), w('walkthrough', 2),
    ],
    'content/documentation': [
      w('documentation', 3), w('docs updated', 3), w('api docs', 3),
      w('reference guide', 2), w('developer docs', 2), w('docs', 2),
    ],
    'content/release_notes': [
      w('release notes', 3), w('changelog', 3), w("what's new", 3),
      w('new release', 2), w('api update', 2), w('version', 2), w('improvements', 2),
    ],
    'content/product_update': [
      w('feature update', 3), w('product update', 3), w('new feature', 3),
      w('new in', 2), w('platform update', 2), w('we shipped', 2),
    ],
    'content/educational_resource': [
      w('free guide', 3), w('ebook', 3), w('whitepaper', 3),
      w('checklist', 2), w('template', 2), w('resource', 2),
    ],

    // ── promotion ──────────────────────────────────────────────────────────────
    'promotion/discount': [
      w('% off', 3), w('discount code', 3), w('coupon', 3), w('promo code', 3), w('save', 2),
    ],
    'promotion/coupon': [
      w('coupon code', 3), w('use code', 3), w('redeem', 3),
      w('coupon', 2), w('code:', 2),
    ],
    'promotion/limited_time': [
      w('flash sale', 3), w('today only', 3), w('24 hours only', 3),
      w('limited time', 2), w('ends tonight', 2), w('48 hours', 2),
    ],
    'promotion/launch_offer': [
      w('launch price', 3), w('early bird', 3), w('founding member', 3),
      w('launch deal', 2), w('introductory price', 2), w('launch discount', 2),
    ],
    'promotion/upsell': [
      w('upgrade', 3), w('upgrade your plan', 3), w('unlock more', 3),
      w('premium', 2), w('pro plan', 2), w('add-on', 2),
    ],
    'promotion/seasonal_offer': [
      w('black friday', 3), w('cyber monday', 3), w('holiday sale', 3),
      w('seasonal offer', 2), w('end of year', 2), w('new year', 2),
    ],

    // ── billing ────────────────────────────────────────────────────────────────
    'billing/invoice': [
      w('invoice attached', 3), w('your invoice', 3), w('invoice number', 3),
      w('invoice is ready', 3), w('view your invoice', 3),
      w('invoice', 2), w('statement', 2),
    ],
    'billing/payment_reminder': [
      w('payment reminder', 3), w('upcoming payment', 3),
      w('due soon', 2), w('reminder', 2), w('payment due', 2),
    ],
    'billing/failed_payment': [
      w('payment failed', 3), w('payment declined', 3), w('payment unsuccessful', 3),
      w('card declined', 2), w('update your payment', 2),
    ],
    'billing/charge_notice': [
      w('you were charged', 3), w('charge notice', 3), w('billing notice', 3),
      w('amount charged', 2), w('charge of', 2),
    ],
    'billing/subscription_due': [
      w('subscription renewal', 3), w('auto-renewal', 3), w('renews on', 3),
      w('renewal notice', 2), w('subscription due', 2), w('overdue', 2),
    ],

    // ── transaction ────────────────────────────────────────────────────────────
    'transaction/receipt': [
      w('receipt', 3), w('your receipt', 3), w('payment receipt', 3),
      w('proof of payment', 2), w('transaction receipt', 2),
    ],
    'transaction/purchase_confirmation': [
      w('order confirmed', 3), w('purchase confirmed', 3), w('order placed', 3),
      w('your order', 2), w('successfully purchased', 2),
    ],
    'transaction/order_update': [
      w('order shipped', 3), w('order dispatched', 3), w('out for delivery', 3),
      w('tracking number', 2), w('estimated delivery', 2), w('order status', 2),
    ],
    'transaction/refund_confirmation': [
      w('refund', 3), w('refund confirmed', 3), w('refund processed', 3),
      w('amount refunded', 2), w('refund issued', 2),
    ],
    'transaction/booking_confirmation': [
      w('booking confirmed', 3), w('reservation confirmed', 3),
      w('your booking', 2), w('reservation number', 2), w('check-in', 2),
    ],

    // ── alert ──────────────────────────────────────────────────────────────────
    'alert/security_alert': [
      w('security alert', 3), w('unauthorized', 3), w('breach', 3),
      w('compromised', 3), w('suspicious activity', 2), w('unusual activity', 2),
    ],
    'alert/policy_update': [
      w('policy update', 3), w('terms update', 3), w('privacy update', 3),
      w('policy has changed', 2), w('updated policy', 2), w('changes to our', 2),
    ],
    'alert/system_update': [
      w('system maintenance', 3), w('scheduled maintenance', 3),
      w('planned outage', 3), w('downtime', 3), w('maintenance window', 2),
    ],
    'alert/access_issue': [
      w('account locked', 3), w('account suspended', 3), w('access denied', 3),
      w('account disabled', 2), w('login blocked', 2),
    ],
    'alert/service_incident': [
      w('service incident', 3), w('service disruption', 3), w('outage', 3),
      w('degraded performance', 2), w('partial outage', 2), w('incident', 2),
    ],

    // ── account ────────────────────────────────────────────────────────────────
    'account/password_reset': [
      w('password reset', 3), w('reset your password', 3), w('forgot your password', 3),
      w('reset link', 2), w('create a new password', 2),
    ],
    'account/login_notice': [
      w('new sign-in', 3), w('sign-in detected', 3), w('login from', 3),
      w('new login', 2), w('we noticed a sign-in', 2),
    ],
    'account/verification': [
      w('verify your email', 3), w('confirm your email', 3), w('email verification', 3),
      w('verify your account', 2), w('confirm your account', 2), w('activate', 2),
    ],
    'account/account_change': [
      w('email was changed', 3), w('password was changed', 3), w('account updated', 3),
      w('settings changed', 2), w('profile updated', 2),
    ],
    'account/account_warning': [
      w('account at risk', 3), w('account may be suspended', 3), w('action required', 3),
      w('account suspension', 2), w('account termination', 2),
    ],

    // ── support ────────────────────────────────────────────────────────────────
    'support/support_reply': [
      w('has replied', 3), w('agent replied', 3), w('support team replied', 3),
      w('response to your ticket', 2), w('we have responded', 2),
    ],
    'support/ticket_update': [
      w('ticket updated', 3), w('ticket status', 3), w('case updated', 3),
      w('ticket number', 2), w('your ticket', 2), w('case number', 2),
    ],
    'support/issue_resolved': [
      w('issue resolved', 3), w('ticket closed', 3), w('case closed', 3),
      w('resolved successfully', 2), w('problem has been fixed', 2),
    ],
    'support/follow_up': [
      w('following up', 3), w('checking in', 3), w('how did we do', 3),
      w('satisfaction survey', 2), w('any questions', 2),
    ],

    // ── community ──────────────────────────────────────────────────────────────
    'community/invitation': [
      w('invited to join', 3), w('join our community', 3), w('community invitation', 3),
      w('join the group', 2), w('join our slack', 2), w('join our discord', 2),
    ],
    'community/reply_notification': [
      w('replied to your', 3), w('new reply', 3), w('responded to your', 3),
      w('reply in', 2), w('someone replied', 2),
    ],
    'community/mention': [
      w('mentioned you', 3), w('tagged you', 3), w('@mentioned', 3),
      w('someone mentioned', 2), w('you were mentioned', 2),
    ],
    'community/comment_notification': [
      w('new comment', 3), w('commented on your', 3), w('left a comment', 3),
      w('comment on', 2), w('new comment on', 2),
    ],
    'community/community_update': [
      w('community update', 3), w('community announcement', 3), w('group update', 3),
      w('community news', 2), w('platform update', 2),
    ],

    // ── job ────────────────────────────────────────────────────────────────────
    'job/application_update': [
      w('application status', 3), w('your application', 3), w('application update', 3),
      w('application received', 2), w('application for', 2),
    ],
    'job/interview_invite': [
      w('interview invitation', 3), w('invited for an interview', 3), w('interview request', 3),
      w('schedule an interview', 2), w('technical interview', 2), w('interview slot', 2),
    ],
    'job/recruiter_message': [
      w('recruiter', 3), w('talent acquisition', 3), w('hiring manager', 3),
      w('open position', 2), w('career opportunity', 2),
    ],
    'job/opportunity_alert': [
      w('job opportunity', 3), w('new job', 3), w('new opening', 3),
      w('job alert', 2), w('new position', 2), w('we are hiring', 2),
    ],

    // ── legal ──────────────────────────────────────────────────────────────────
    'legal/terms_update': [
      w('terms of service', 3), w('updated terms', 3), w('terms have changed', 3),
      w('terms of use', 2), w('changes to our terms', 2),
    ],
    'legal/privacy_update': [
      w('privacy policy', 3), w('privacy notice', 3), w('data protection', 3),
      w('gdpr', 2), w('your data rights', 2), w('personal data', 2),
    ],
    'legal/compliance_notice': [
      w('compliance', 3), w('regulatory', 3), w('legal requirement', 3),
      w('mandatory', 2), w('required by law', 2), w('legal obligation', 2),
    ],
    'legal/contract_notice': [
      w('contract', 3), w('agreement', 3), w('sign', 3),
      w('e-signature', 2), w('docusign', 2), w('signature required', 2),
    ],

    // ── newsletter ─────────────────────────────────────────────────────────────
    'newsletter/digest': [
      w('digest', 3), w('roundup', 3), w('curated', 3),
      w('top stories', 2), w('reading list', 2), w('this week in', 2),
    ],
    'newsletter/editorial': [
      w('editorial', 3), w('editor\'s note', 3), w('from the editor', 3),
      w('perspective', 2), w('point of view', 2), w('opinion', 2),
    ],
    'newsletter/weekly_roundup': [
      w('weekly update', 3), w('weekly roundup', 3), w('this week', 3),
      w('week in review', 2), w('weekly recap', 2), w('this week\'s', 2),
    ],
    'newsletter/company_news': [
      w('company update', 3), w('team update', 3), w('company news', 3),
      w('what we\'ve been up to', 2), w('from the team', 2), w('company announcement', 2),
    ],
  },

  intentSignals: {
    attend: [
      w('you are invited', 3), w('join us', 3), w('rsvp', 3),
      w('we would love to have you', 2), w('attend', 2),
    ],
    review: [
      w('buy now', 2), w('shop now', 2), w('% off', 2),
      w('sale', 2), w('deal', 2), w('offer', 1),
    ],
    pay: [
      w('payment due', 3), w('amount due', 3), w('invoice', 3),
      w('please pay', 3), w('overdue', 3),
    ],
    read: [
      w('we wanted to let you know', 3), w('this is to inform', 3),
      w('please note', 2), w('fyi', 2), w('announcement', 2),
    ],
    verify: [
      w('warning', 3), w('suspicious activity', 3), w('compromised', 3),
      w('security notice', 3), w('unauthorized', 3),
      w('alert', 2),
    ],
    confirm: [
      w('order confirmed', 3), w('booking confirmed', 3),
      w('confirmation', 2), w('confirmed', 3), w('successfully', 2),
    ],
    register: [
      w('you will learn', 3), w('what you will learn', 3),
      w('enroll', 2), w('lesson', 2), w('how to', 1),
    ],
    download: [
      w('download now', 3), w('get your copy', 3), w('available for download', 2),
      w('download', 2),
    ],
  },

  enrollmentWords: [
    'enroll', 'enrollment', 'register', 'sign up', 'join', 'get access',
    'reserve your spot', 'book your seat', 'limited spots', 'seats available',
    'open enrollment', 'apply now', 'get started', 'start learning',
  ],

  ctaWords: [
    'click here', 'click below', 'sign up', 'register', 'rsvp', 'book now',
    'buy now', 'shop now', 'subscribe', 'download', 'get started', 'learn more',
    'view more', 'access now', 'confirm', 'verify', 'pay now', 'read more',
    'watch now', 'get access', 'enroll now', 'join now', 'start now',
    'open', 'track order', 'claim', 'apply',
  ],

  urgencyHigh: [
    'urgent', 'immediately', 'right away', 'emergency', 'critical',
    'last chance', 'expires today', 'today only', 'action required',
    'response needed', 'do not ignore', 'asap', 'act now',
    'deadline today', 'final notice',
  ],
  urgencyMedium: [
    'expires', 'expiring', 'limited time', 'deadline', "don't wait",
    'hurry', '24 hours', '48 hours', 'this week only', 'ends soon',
    'final reminder', 'last day', 'running out',
  ],

  ambiguousTerms: [
    'soon', 'later', 'sometime', 'eventually', 'shortly',
    'when possible', 'at some point', 'in the near future', 'coming soon',
    "we'll let you know", 'more details to follow', 'stay tuned',
    'tbd', 'to be determined', 'to be announced', 'tba',
    'in the coming weeks', 'in the coming days', 'tonight', 'this evening',
  ],

  monthNames: {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
    april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
    august: 8, aug: 8, september: 9, sep: 9, sept: 9, october: 10,
    oct: 10, november: 11, nov: 11, december: 12, dec: 12,
  },

  relativeToday: ['today'],
  relativeTomorrow: ['tomorrow'],
  relativeDayAfterTomorrow: ['day after tomorrow'],
  relativeNextWeek: [
    'next week', 'next monday', 'next tuesday', 'next wednesday',
    'next thursday', 'next friday',
  ],

  greetingPattern:  /^(hi|hello|hey|dear|good morning|good afternoon|good evening|greetings|howdy|to whom it may concern)\b/im,
  signaturePattern: /\b(best regards|kind regards|warm regards|sincerely|thanks|thank you|cheers|regards|yours truly|with best wishes|best,)\b/i,

  // ── Availability signals ──────────────────────────────────────────────────
  // Phrases whose presence indicates content is permanently accessible (no scheduling).
  onDemandPhrases: [
    'on-demand', 'on demand', 'self-paced', 'watch at your own pace',
    'available anytime', 'available any time', 'available whenever',
    'already available', 'replay available', 'watch the recording',
    'access the recording', 'recorded session', 'recorded version',
    'access now', 'available now', 'available on youtube',
    'watch now', 'listen now', 'read now',
  ],

  // Phrases whose presence indicates content is time-bound (must attend live).
  scheduledPhrases: [
    'going live', 'tune in live', 'live stream', 'join us live',
    'starts at', 'begins at', 'join us at', 'tune in at',
    'happening tomorrow', 'happening today', 'join live',
    'real-time', 'register to attend', 'register now to join',
  ],
};
