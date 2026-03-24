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
    informational: [
      w('we wanted to let you know', 3), w('this is to inform', 3),
      w('policy update', 3),
      w('please note', 2), w('important update', 2), w('fyi', 2),
      w('heads up', 2),
      w('update', 1), w('announcement', 1), w('notice', 1), w('reminder', 1),
    ],
  },

  subtypeKeywords: {
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
    'course/mentorship': [
      w('mentorship', 3), w('coaching', 3),
      w('mentor', 2), w('1-on-1', 2), w('personal guidance', 2),
    ],
    'course/workshop': [
      w('workshop', 3), w('hands-on', 2), w('practical session', 2),
      w('in-person session', 2),
    ],
    'course/bootcamp': [
      w('bootcamp', 3), w('full-time program', 3), w('immersive', 2),
      w('intensive', 2),
    ],
    'course/recorded': [
      w('self-paced', 3), w('on-demand', 3), w('watch at your own pace', 3),
      w('recorded', 3), w('available now', 2),
    ],
    'promotion/discount': [
      w('% off', 3), w('discount code', 3), w('coupon', 3), w('promo code', 3),
      w('save', 2),
    ],
    'promotion/flash_sale': [
      w('flash sale', 3), w('today only', 3), w('24 hours only', 3),
      w('limited time', 2), w('24 hours', 2), w('48 hours', 2),
    ],
    'billing/reminder': [
      w('payment reminder', 3), w('upcoming payment', 3),
      w('due soon', 2), w('reminder', 2),
    ],
    'billing/overdue': [
      w('overdue', 3), w('past due', 3), w('final notice', 3),
      w('outstanding balance', 3),
    ],
    'billing/renewal': [
      w('auto-renewal', 3), w('renewal notice', 3),
      w('subscription renewal', 3), w('renews on', 2),
    ],
  },

  intentSignals: {
    invite: [
      w('you are invited', 3), w('join us', 3), w('rsvp', 3),
      w('we would love to have you', 2), w('attend', 2),
    ],
    sell: [
      w('buy now', 3), w('shop now', 3), w('% off', 3),
      w('sale', 2), w('deal', 2), w('offer', 1),
    ],
    remind: [
      w("don't forget", 3), w('just a reminder', 3), w('final reminder', 3),
      w("don't miss", 2), w('reminder', 2),
    ],
    charge: [
      w('payment due', 3), w('amount due', 3), w('invoice', 3),
      w('please pay', 3), w('overdue', 3),
    ],
    inform: [
      w('we wanted to let you know', 3), w('this is to inform', 3),
      w('please note', 2), w('fyi', 2), w('announcement', 2),
    ],
    warn: [
      w('warning', 3), w('suspicious activity', 3), w('compromised', 3),
      w('security notice', 3), w('unauthorized', 3),
      w('alert', 2),
    ],
    confirm: [
      w('order confirmed', 3), w('booking confirmed', 3),
      w('confirmation', 2), w('confirmed', 3), w('successfully', 2),
    ],
    educate: [
      w('you will learn', 3), w('what you will learn', 3),
      w('tutorial', 2), w('lesson', 2), w('how to', 1),
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
};
