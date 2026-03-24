import type {
  ParsedData,
  ClassificationResult,
  EmailType,
  EmailSubtype,
  Priority,
  Urgency,
  AgentInterpretation,
  IdealStructuredVersion,
} from '../types';

// ─── Agent action map ─────────────────────────────────────────────────────────

const ACTIONS: Record<EmailType, string> = {
  event:         'add_to_calendar',
  course:        'register_enrollment',
  content:       'read_or_watch',
  promotion:     'archive_or_save',
  newsletter:    'read_and_archive',
  billing:       'process_payment',
  alert:         'immediate_action_required',
  transaction:   'log_and_confirm',
  informational: 'read_and_file',
  unknown:       'flag_for_human_review',
};

const SUBTYPE_ACTIONS: Partial<Record<EmailSubtype, string>> = {
  'event/live':           'tune_in_live',
  'event/webinar':        'join_webinar',
  'event/meeting':        'attend_meeting',
  'course/mentorship':    'schedule_mentorship_session',
  'course/workshop':      'register_workshop',
  'course/bootcamp':      'enroll_bootcamp',
  'course/recorded':      'access_recorded_content',
  'promotion/discount':   'apply_discount_code',
  'promotion/flash_sale': 'purchase_before_expiry',
  'billing/reminder':     'schedule_payment',
  'billing/overdue':      'process_overdue_payment',
  'billing/renewal':      'review_subscription_renewal',
};

const REASONING: Record<EmailType, (d: ParsedData) => string> = {
  event: d => d.normalizedDates.length > 0
    ? 'Event with date/time found — calendar scheduling is possible.'
    : 'Event identified but date/time missing — cannot schedule automatically.',
  course: d => d.normalizedDates.length > 0
    ? 'Course with start date found — enrollment action is possible.'
    : 'Course identified but start date missing — enrollment requires follow-up.',
  content:       () => 'Content item identified — no time-sensitive action required.',
  promotion:     () => 'Promotional content — archive or apply discount code.',
  newsletter:    () => 'Newsletter format — informational, no required action.',
  billing: d => d.normalizedDates.length > 0
    ? 'Payment request with due date — process before deadline.'
    : 'Payment request without due date — prioritise for human review.',
  alert:         () => 'Security or account alert — may require immediate response.',
  transaction:   () => 'Transaction confirmation — log reference number for records.',
  informational: () => 'Informational announcement — no immediate action required.',
  unknown:       () => 'Cannot determine intent — human review recommended.',
};

// ─── Missing-field marker ──────────────────────────────────────────────────────

const M = (field: string) => `⚠️ [MISSING: ${field}]`;

// ─── Human-version templates ──────────────────────────────────────────────────

function tEvent(d: ParsedData, subtype?: EmailSubtype): string {
  const date = d.normalizedDates[0]?.iso ?? M('date');
  const time = d.normalizedTimes[0]?.value ?? M('time');
  const tz   = d.timezone ?? M('timezone');
  const subj = d.subject ?? M('event name');

  const venue = subtype === 'event/webinar' || subtype === 'event/live'
    ? '[Online Link]'
    : '[Venue or Online Link]';

  return `Subject: ${subj} — ${date} at ${time} ${tz}

Hi [Name],

You are invited to [Event Name].

📅 Date:      ${date}
⏰ Time:      ${time} (${tz})
📍 Location:  ${venue}

What to expect:
• [Highlight 1]
• [Highlight 2]

RSVP by [Deadline Date]: [Link]

[Sender Name]
[Organisation]`;
}

function tCourse(d: ParsedData, subtype?: EmailSubtype): string {
  const date = d.normalizedDates[0]?.iso ?? M('start date');
  const subj = d.subject ?? M('course name');

  const formatLine = subtype === 'course/recorded'
    ? '💻 Format:    Self-paced (recorded)'
    : subtype === 'course/bootcamp'
    ? '💻 Format:    Intensive Bootcamp'
    : subtype === 'course/workshop'
    ? '💻 Format:    Workshop (hands-on)'
    : subtype === 'course/mentorship'
    ? '💻 Format:    1-on-1 Mentorship'
    : '💻 Format:    [Online / In-person]';

  return `Subject: ${subj} — Enrollment Open

Hi [Name],

[Course Name] is now open for enrollment.

📅 Starts:    ${date}
⏱ Duration:  [X weeks / hours]
📚 Topics:    [Topic 1], [Topic 2], [Topic 3]
${formatLine}

What you will learn:
• [Learning outcome 1]
• [Learning outcome 2]
• [Learning outcome 3]

Enroll now: [Link]
Enrollment deadline: ${M('enrollment deadline')}

[Sender Name]`;
}

function tContent(d: ParsedData): string {
  const subj = d.subject ?? M('title');
  return `Subject: ${subj}

Hi [Name],

[Title] is now available.

📺 Format:    [Video / Podcast / Article]
⏱ Duration:  [Length]
📅 Published: [Date]

What it covers:
• [Topic 1]
• [Topic 2]

Watch / Listen / Read: [Direct Link]

To unsubscribe: [Link]

[Sender Name]`;
}

function tPromotion(d: ParsedData, subtype?: EmailSubtype): string {
  const date = d.normalizedDates[0]?.iso ?? M('expiry date');
  const time = d.normalizedTimes[0]?.value;
  const subj = d.subject ?? M('offer name');

  const urgencyLine = subtype === 'promotion/flash_sale'
    ? `⚡ Flash Sale — ends ${date}${time ? ` at ${time}` : ''}`
    : `Valid until:   ${date}${time ? ` at ${time}` : ''}`;

  return `Subject: ${subj} — Expires ${date}

Hi [Name],

Save [X]% on [Product / Category].

Offer:         [Specific discount]
${urgencyLine}
Code:          [COUPON CODE]

Shop now: [Link]

[Sender Name]`;
}

function tNewsletter(d: ParsedData): string {
  const date = d.normalizedDates[0]?.iso ?? M('date');
  const subj = d.subject ?? M('newsletter name');
  return `Subject: ${subj} — ${date}

Hi [Name],

Here is your curated digest for ${date}.

─────────────────────────
TOP STORIES
─────────────────────────
1. [Headline] — [Summary]. Read →
2. [Headline] — [Summary]. Read →
3. [Headline] — [Summary]. Read →
─────────────────────────

Full edition: [Link]
Unsubscribe:  [Link]

[Publication Name]`;
}

function tBilling(d: ParsedData, subtype?: EmailSubtype): string {
  const date = d.normalizedDates[0]?.iso ?? M('due date');
  const subj = d.subject ?? 'Invoice';

  const statusLine = subtype === 'billing/overdue'
    ? 'Status:     OVERDUE — immediate payment required'
    : subtype === 'billing/renewal'
    ? 'Status:     Upcoming renewal'
    : 'Status:     Unpaid';

  return `Subject: ${subj} — Due ${date}

Hi [Name],

Payment is due on your account.

Invoice:    #${M('invoice number')}
Amount:     $${M('amount')}
Due date:   ${date}
${statusLine}

Pay now: [Link]

Questions? [support@company.com]

[Company] Billing Team`;
}

function tAlert(d: ParsedData): string {
  const date = d.normalizedDates[0]?.iso ?? M('date');
  const time = d.normalizedTimes[0]?.value ?? M('time');
  const tz   = d.timezone ?? M('timezone');
  return `Subject: ⚠️ Security Alert — Action Required

Hi [Name],

We detected unusual activity on your account.

What:     ${M('specific event')}
When:     ${date} at ${time} ${tz}
Location: ${M('detected location')}
Action:   ${M('specific required step')}

Secure your account: [Link]

→ If this was you: no action needed.
→ If NOT you: click the link above immediately.

[Company] Security Team`;
}

function tTransaction(d: ParsedData): string {
  const date = d.normalizedDates[0]?.iso ?? M('date');
  const time = d.normalizedTimes[0]?.value;
  const subj = d.subject ?? 'Order Confirmation';
  return `Subject: ${subj}

Hi [Name],

Your [order / booking] is confirmed.

Reference:    #${M('reference ID')}
Date:         ${date}${time ? ` at ${time}` : ''}
Items:        ${M('item list')}

Track: [Link]

[Company Name]`;
}

function tInformational(d: ParsedData): string {
  const date = d.normalizedDates[0]?.iso ?? M('effective date');
  const subj = d.subject ?? 'Update';
  return `Subject: ${subj}

Hi [Name],

[Summary of what changed or what this is about.]

Effective:   ${date}
Action:      [Specific step, or "No action required"]
More info:   [Link]

[Sender Name]`;
}

function tUnknown(d: ParsedData): string {
  const date = d.normalizedDates[0]?.iso ?? M('date');
  const time = d.normalizedTimes[0]?.value ?? M('time');
  const tz   = d.timezone ?? M('timezone');
  return `Subject: [Clear, specific subject line]

Hi [Name],

[One-sentence statement of purpose.]

Date/Time:  ${d.normalizedDates.length > 0 ? `${date} at ${time} ${tz}` : `${M('date')} at ${M('time')} ${M('timezone')}`}
Action:     ${M('specific action')}
Deadline:   ${M('deadline date')}

[Link or contact info]

[Signature]`;
}

// ─── Structured JSON output ────────────────────────────────────────────────────

function buildStructured(
  d:          ParsedData,
  classified: ClassificationResult,
  priority:   Priority,
  urgency:    Urgency,
): IdealStructuredVersion {
  const date = d.normalizedDates[0]?.iso;
  const time = d.normalizedTimes[0]?.value;
  const tz   = d.timezone;
  const linkDependency = d.linksFound > 0 && !date && !time;
  const emailType = classified.type;

  const base: IdealStructuredVersion = {
    type:           emailType,
    priority,
    urgency,
    action:         (classified.subtype && SUBTYPE_ACTIONS[classified.subtype]) ?? ACTIONS[emailType],
    linkDependency,
    intent:         classified.intent,
    confidence:     Math.round(classified.confidence * 100) / 100,
    ...(classified.subtype && { subtype: classified.subtype }),
    ...(d.subject   && { title:  d.subject }),
    ...(d.sender    && { sender: d.sender }),
  };

  switch (emailType) {
    case 'event':
      return {
        ...base,
        date:     date ?? 'YYYY-MM-DD',
        time:     time ?? 'HH:mm',
        timezone: tz   ?? 'America/Sao_Paulo',
      };
    case 'course':
      return {
        ...base,
        start_date: date ?? 'YYYY-MM-DD',
        enrollment: 'open',
        duration:   'not_specified',
      };
    case 'billing':
      return { ...base, ...(date && { date }) };
    case 'alert':
      return { ...base, ...(date && { date }), ...(time && { time }) };
    default:
      return { ...base, ...(date && { date }), ...(time && { time }) };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface Recommendations {
  agentInterpretation:    AgentInterpretation;
  idealHumanVersion:      string;
  idealStructuredVersion: IdealStructuredVersion;
}

export function generateRecommendations(
  data:                ParsedData,
  classified:          ClassificationResult,
  agentReadinessScore: number,
  priority:            Priority,
  urgency:             Urgency,
): Recommendations {
  const { type: emailType, subtype, confidence } = classified;

  const templateFns: Record<EmailType, (d: ParsedData, s?: EmailSubtype) => string> = {
    event:         tEvent,
    course:        tCourse,
    content:       tContent,
    promotion:     tPromotion,
    newsletter:    tNewsletter,
    billing:       tBilling,
    alert:         tAlert,
    transaction:   tTransaction,
    informational: tInformational,
    unknown:       tUnknown,
  };

  return {
    agentInterpretation: {
      action:     (subtype && SUBTYPE_ACTIONS[subtype]) ?? ACTIONS[emailType],
      confidence: parseFloat(Math.max(0.05, Math.min(0.99, confidence)).toFixed(2)),
      reasoning:  REASONING[emailType](data),
    },
    idealHumanVersion:      templateFns[emailType](data, subtype),
    idealStructuredVersion: buildStructured(data, classified, priority, urgency),
  };
}
