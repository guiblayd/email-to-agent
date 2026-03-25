import type {
  ParsedData,
  ClassificationResult,
  EmailType,
  EmailSubtype,
  Priority,
  Urgency,
  Sensitivity,
  ExternalDependency,
  AgentInterpretation,
  IdealStructuredVersion,
} from '../types';

// ─── Agent action type map ─────────────────────────────────────────────────────

const ACTIONS: Record<EmailType, string> = {
  event:       'add_to_calendar',
  course:      'register_enrollment',
  content:     'read_or_watch',
  promotion:   'archive_or_save',
  newsletter:  'read_and_archive',
  billing:     'process_payment',
  alert:       'immediate_action_required',
  transaction: 'log_and_confirm',
  account:     'verify_or_secure',
  support:     'reply_or_resolve',
  community:   'read_and_engage',
  job:         'review_opportunity',
  legal:       'review_legal_notice',
  unknown:     'flag_for_human_review',
};

const SUBTYPE_ACTIONS: Partial<Record<EmailSubtype, string>> = {
  // event
  'event/live':                  'tune_in_live',
  'event/webinar':               'join_webinar',
  'event/meeting':               'attend_meeting',
  'event/workshop':              'attend_workshop',
  'event/launch_event':          'attend_launch_event',
  // course
  'course/live':                 'join_live_session',
  'course/cohort':               'join_cohort',
  'course/recorded':             'access_recorded_content',
  'course/mentorship':           'schedule_mentorship_session',
  'course/training':             'attend_training',
  'course/onboarding_course':    'complete_onboarding',
  // content
  'content/video':               'watch_video',
  'content/article':             'read_article',
  'content/tutorial':            'follow_tutorial',
  'content/documentation':       'read_documentation',
  'content/release_notes':       'review_release_notes',
  'content/product_update':      'review_product_update',
  'content/educational_resource':'access_learning_material',
  // promotion
  'promotion/discount':          'apply_discount_code',
  'promotion/coupon':            'redeem_coupon',
  'promotion/limited_time':      'act_before_deadline',
  'promotion/launch_offer':      'claim_launch_offer',
  'promotion/upsell':            'review_upgrade_offer',
  'promotion/seasonal_offer':    'apply_seasonal_offer',
  // newsletter
  'newsletter/digest':           'read_and_archive',
  'newsletter/editorial':        'read_and_archive',
  'newsletter/weekly_roundup':   'read_and_archive',
  'newsletter/company_news':     'read_and_archive',
  // billing
  'billing/failed_payment':      'update_payment_method',
  'billing/payment_reminder':    'schedule_payment',
  'billing/charge_notice':       'review_charge',
  'billing/subscription_due':    'review_subscription',
  'billing/invoice':             'process_invoice',
  // alert
  'alert/security_alert':        'secure_account_immediately',
  'alert/access_issue':          'resolve_access_issue',
  'alert/service_incident':      'monitor_incident',
  'alert/policy_update':         'review_policy_changes',
  'alert/system_update':         'review_system_changes',
  // transaction
  'transaction/receipt':             'save_receipt',
  'transaction/purchase_confirmation':'confirm_purchase',
  'transaction/refund_confirmation': 'verify_refund',
  'transaction/order_update':        'track_order',
  'transaction/booking_confirmation':'confirm_booking',
  // account
  'account/password_reset':      'reset_password_immediately',
  'account/verification':        'verify_account',
  'account/login_notice':        'review_login_activity',
  'account/account_warning':     'investigate_account_warning',
  'account/account_change':      'review_account_changes',
  // support
  'support/issue_resolved':      'confirm_resolution',
  'support/ticket_update':       'review_ticket_update',
  'support/support_reply':       'reply_to_support',
  'support/follow_up':           'follow_up_on_issue',
  // community
  'community/invitation':             'accept_or_decline_invitation',
  'community/reply_notification':     'read_reply',
  'community/mention':                'respond_to_mention',
  'community/comment_notification':   'read_comment',
  'community/community_update':       'read_update',
  // job
  'job/interview_invite':        'confirm_interview',
  'job/application_update':      'review_status',
  'job/offer':                   'review_job_offer',
  'job/recruiter_message':       'review_recruiter_message',
  'job/opportunity_alert':       'review_opportunity',
  // legal
  'legal/compliance_notice':     'review_compliance_requirements',
  'legal/contract_notice':       'review_contract',
  'legal/terms_update':          'review_terms_update',
  'legal/privacy_update':        'review_privacy_update',
};

// ─── Structured action payload ─────────────────────────────────────────────────

function buildActionPayload(
  type:    EmailType,
  subtype: EmailSubtype | undefined,
  data:    ParsedData,
): { type: string; description: string } {
  const actionType = (subtype && SUBTYPE_ACTIONS[subtype]) ?? ACTIONS[type];
  const title  = data.subject;
  const dueStr = data.normalizedDates[0]?.iso;

  const subtypeDesc: Partial<Record<EmailSubtype, string>> = {
    'event/live':                  title ? `Tune in live to "${title}"` : 'Tune in to the live broadcast',
    'event/webinar':               title ? `Join the webinar: "${title}"` : 'Join the online webinar',
    'event/meeting':               'Attend the scheduled meeting at the stated time',
    'event/workshop':              title ? `Register for the workshop: "${title}"` : 'Register for the hands-on workshop',
    'event/launch_event':          title ? `Attend the launch event: "${title}"` : 'Attend the product launch event',
    'course/recorded':             title ? `Access recorded content: "${title}"` : 'Access the self-paced recorded course',
    'course/mentorship':           'Schedule and attend the mentorship session',
    'course/live':                 title ? `Join the live session: "${title}"` : 'Join the live course session',
    'course/cohort':               title ? `Enroll in cohort: "${title}"` : 'Enroll in the cohort program',
    'content/video':               title ? `Watch the video: "${title}"` : 'Watch the video content',
    'content/article':             title ? `Read the article: "${title}"` : 'Read the article',
    'content/tutorial':            title ? `Follow the tutorial: "${title}"` : 'Follow the step-by-step tutorial',
    'promotion/discount':          'Apply the discount code before it expires',
    'promotion/limited_time':      dueStr ? `Act before ${dueStr} — limited-time offer` : 'Act before the limited-time offer expires',
    'billing/failed_payment':      'Update payment method to restore account access',
    'billing/payment_reminder':    dueStr ? `Process payment before ${dueStr}` : 'Process the upcoming payment',
    'billing/invoice':             dueStr ? `Pay invoice before ${dueStr}` : 'Review and pay the invoice',
    'account/password_reset':      'Click the password reset link before it expires',
    'account/verification':        'Click the verification link to confirm your account',
    'account/account_warning':     'Investigate the security warning and secure your account',
    'alert/security_alert':        'Secure account immediately — potential breach detected',
    'alert/access_issue':          'Resolve the access issue to restore normal operation',
    'support/support_reply':       'Review the support team reply and respond if needed',
    'support/issue_resolved':      'Confirm the resolution and close the support ticket',
    'job/interview_invite':        dueStr ? `Confirm interview attendance before ${dueStr}` : 'Confirm or decline the interview invitation',
    'job/offer':                   'Review the job offer and respond within the stated deadline',
    'legal/compliance_notice':     dueStr ? `Review compliance requirements — effective ${dueStr}` : 'Review and act on the compliance requirements',
    'legal/contract_notice':       'Review the attached contract and respond to the sender',
  };

  const typeDesc: Record<EmailType, string> = {
    event:       title ? `Attend the event: "${title}"` : 'Attend the scheduled event',
    course:      title ? `Enroll in: "${title}"` : 'Enroll in the course',
    content:     title ? `Access the content: "${title}"` : 'Access and consume the content item',
    promotion:   title ? `Review the offer: "${title}"` : 'Review and apply the promotion',
    newsletter:  'Read and archive the newsletter edition',
    billing:     dueStr ? `Process payment due ${dueStr}` : 'Process the outstanding payment',
    alert:       'Investigate and respond to the alert immediately',
    transaction: 'Log the transaction reference and confirm receipt',
    account:     'Review and act on the account security notice',
    support:     'Review the support update and reply if action is required',
    community:   'Read the community notification and engage if relevant',
    job:         title ? `Review the opportunity: "${title}"` : 'Review the career-related email',
    legal:       'Review the legal notice and consult if action is required',
    unknown:     'Route to human review — intent could not be determined',
  };

  const description = (subtype && subtypeDesc[subtype]) ?? typeDesc[type];
  return { type: actionType, description };
}

// ─── Agent interpretation reasoning ──────────────────────────────────────────

function generateReasoning(
  type:    EmailType,
  subtype: EmailSubtype | undefined,
  data:    ParsedData,
): string {
  const hasDate = data.normalizedDates.length > 0;
  const hasTime = data.normalizedTimes.length > 0;
  const sender  = data.sender ?? 'unknown sender';

  switch (type) {
    case 'event':
      return hasDate && hasTime
        ? `Event from ${sender} with date and time found — calendar scheduling is possible.`
        : hasDate
        ? `Event from ${sender} has a date but no time — partial scheduling only.`
        : `Event from ${sender} detected but date and time are missing — cannot schedule automatically.`;

    case 'course':
      return subtype === 'course/recorded'
        ? `Self-paced recorded course from ${sender} — content is available on demand, no scheduling required.`
        : hasDate
        ? `Course from ${sender} with start date found — enrollment action can be triggered.`
        : `Course from ${sender} detected but no start date found — enrollment requires manual follow-up.`;

    case 'content':
      return subtype === 'content/video'
        ? `Video content from ${sender} — agent should surface for watching.`
        : subtype === 'content/article'
        ? `Article from ${sender} — agent should surface for reading.`
        : subtype === 'content/tutorial'
        ? `Tutorial from ${sender} — agent should surface for learning.`
        : `Content item from ${sender} — no time-sensitive action required.`;

    case 'promotion':
      return hasDate
        ? `Promotional offer expires ${data.normalizedDates[0].iso} — agent should archive or apply discount code.`
        : `Promotional content from ${sender} — archive or save discount code if present.`;

    case 'newsletter':
      return `Newsletter from ${sender} — informational, read and archive. No required action.`;

    case 'billing':
      return subtype === 'billing/failed_payment'
        ? `Failed payment from ${sender} — update payment method to restore access.`
        : hasDate
        ? `Payment request from ${sender} due ${data.normalizedDates[0].iso} — process before deadline.`
        : `Payment request from ${sender} without a clear due date — prioritise for human review.`;

    case 'alert':
      return subtype === 'alert/security_alert'
        ? `Security alert from ${sender} — potential account compromise, immediate action required.`
        : `Alert from ${sender} — may require immediate response.`;

    case 'transaction':
      return `Transaction confirmation from ${sender} — log reference number for records.`;

    case 'account':
      return subtype === 'account/password_reset'
        ? `Password reset from ${sender} — link expires soon, act immediately.`
        : subtype === 'account/verification'
        ? `Account verification from ${sender} — verify before the link expires.`
        : `Account notice from ${sender} — review for required security action.`;

    case 'support':
      return subtype === 'support/issue_resolved'
        ? `Support ticket resolved by ${sender} — confirm resolution or reopen if needed.`
        : `Support update from ${sender} — review and reply if action is required.`;

    case 'community':
      return `Community notification from ${sender} — read and engage if relevant.`;

    case 'job':
      return subtype === 'job/interview_invite'
        ? `Interview invitation from ${sender} — confirm or decline before the deadline.`
        : subtype === 'job/offer'
        ? `Job offer from ${sender} — review carefully and respond within the stated window.`
        : `Career-related email from ${sender} — review and follow up if interested.`;

    case 'legal':
      return subtype === 'legal/compliance_notice'
        ? `Compliance notice from ${sender} — review requirements and act before the effective date.`
        : subtype === 'legal/contract_notice'
        ? `Contract notice from ${sender} — review the attached document and respond.`
        : `Legal notice from ${sender} — review and consult if action is required.`;

    default:
      return `Cannot determine intent from ${sender} — human review is recommended.`;
  }
}

// ─── Missing-field marker ──────────────────────────────────────────────────────

const M = (field: string) => `⚠️ [MISSING: ${field}]`;

// ─── Human-version templates ──────────────────────────────────────────────────

function tEvent(d: ParsedData, subtype?: EmailSubtype): string {
  const date   = d.normalizedDates[0]?.iso ?? M('date');
  const time   = d.normalizedTimes[0]?.value ?? M('time');
  const tz     = d.timezone ?? M('timezone');
  const subj   = d.subject ?? M('event name');
  const sender = d.sender  ?? M('sender name');

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

─────────────────
${sender}
[Organisation]`;
}

function tCourse(d: ParsedData, subtype?: EmailSubtype): string {
  const date   = d.normalizedDates[0]?.iso ?? M('start date');
  const subj   = d.subject ?? M('course name');
  const sender = d.sender  ?? M('sender name');

  const formatLine = subtype === 'course/recorded'
    ? '💻 Format:    Self-paced (recorded)'
    : subtype === 'course/live'
    ? '💻 Format:    Live sessions'
    : subtype === 'course/cohort'
    ? '💻 Format:    Cohort-based'
    : subtype === 'course/mentorship'
    ? '💻 Format:    1-on-1 Mentorship'
    : subtype === 'course/training'
    ? '💻 Format:    Instructor-led Training'
    : '💻 Format:    [Online / In-person]';

  return `Subject: ${subj} — Enrollment Open

Hi [Name],

[Course Name] by ${sender} is now open for enrollment.

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

─────────────────
${sender}`;
}

function tContent(d: ParsedData, subtype?: EmailSubtype): string {
  const subj   = d.subject ?? M('title');
  const sender = d.sender  ?? M('sender name');
  const date   = d.normalizedDates[0]?.iso;

  const isVideo    = subtype === 'content/video';
  const isArticle  = subtype === 'content/article';
  const isTutorial = subtype === 'content/tutorial';

  const formatLine = isVideo   ? '📺 Format:    Video'
    : isArticle               ? '📄 Format:    Article'
    : isTutorial               ? '🧑‍💻 Format:    Tutorial'
    : '📄 Format:    [Video / Article / Tutorial]';

  const actionVerb = isVideo ? 'Watch' : isArticle ? 'Read' : isTutorial ? 'Follow' : 'Access';
  const linkLabel  = isVideo ? 'Watch now' : isArticle ? 'Read now' : isTutorial ? 'Start tutorial' : 'Access now';

  return `Subject: ${subj}

Hi [Name],

${sender} just released new content for you.

${formatLine}
⏱ Duration:  [Length]${date ? `\n📅 Published: ${date}` : ''}

What this covers:
• [Key takeaway 1]
• [Key takeaway 2]

${actionVerb} it here and let us know what you think.

${linkLabel}: [Direct link]

─────────────────
${sender}
To unsubscribe: [Link]`;
}

function tPromotion(d: ParsedData, subtype?: EmailSubtype): string {
  const date   = d.normalizedDates[0]?.iso ?? M('expiry date');
  const time   = d.normalizedTimes[0]?.value;
  const subj   = d.subject ?? M('offer name');
  const sender = d.sender  ?? M('sender name');

  const urgencyLine = subtype === 'promotion/limited_time'
    ? `⚡ Limited Time — ends ${date}${time ? ` at ${time}` : ''}`
    : `Valid until:   ${date}${time ? ` at ${time}` : ''}`;

  return `Subject: ${subj} — Expires ${date}

Hi [Name],

Save [X]% on [Product / Category].

Offer:         [Specific discount]
${urgencyLine}
Code:          [COUPON CODE]

Shop now: [Link]

─────────────────
${sender}`;
}

function tNewsletter(d: ParsedData): string {
  const date   = d.normalizedDates[0]?.iso ?? M('date');
  const subj   = d.subject ?? M('newsletter name');
  const sender = d.sender  ?? M('sender or publication name');

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

─────────────────
${sender}`;
}

function tBilling(d: ParsedData, subtype?: EmailSubtype): string {
  const date   = d.normalizedDates[0]?.iso ?? M('due date');
  const subj   = d.subject ?? 'Invoice';
  const sender = d.sender  ?? M('company name');

  const statusLine = subtype === 'billing/failed_payment'
    ? 'Status:     PAYMENT FAILED — update payment method immediately'
    : subtype === 'billing/subscription_due'
    ? 'Status:     Subscription renewal due'
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

─────────────────
${sender} Billing Team`;
}

function tAlert(d: ParsedData, subtype?: EmailSubtype): string {
  const date   = d.normalizedDates[0]?.iso ?? M('date');
  const time   = d.normalizedTimes[0]?.value ?? M('time');
  const tz     = d.timezone ?? M('timezone');
  const sender = d.sender  ?? M('company name');

  const alertType = subtype === 'alert/security_alert'
    ? '⚠️ Security Alert'
    : subtype === 'alert/access_issue'
    ? '🔐 Access Issue'
    : subtype === 'alert/service_incident'
    ? '🔧 Service Incident'
    : '⚠️ Alert';

  return `Subject: ${alertType} — Action Required

Hi [Name],

We detected an issue with your account or service.

What:     ${M('specific event')}
When:     ${date} at ${time} ${tz}
Location: ${M('detected location')}
Action:   ${M('specific required step')}

Resolve now: [Link]

→ If this was you: no action needed.
→ If NOT you: click the link above immediately.

─────────────────
${sender} Security Team`;
}

function tTransaction(d: ParsedData): string {
  const date   = d.normalizedDates[0]?.iso ?? M('date');
  const time   = d.normalizedTimes[0]?.value;
  const subj   = d.subject ?? 'Order Confirmation';
  const sender = d.sender  ?? M('company name');

  return `Subject: ${subj}

Hi [Name],

Your [order / booking] is confirmed.

Reference:    #${M('reference ID')}
Date:         ${date}${time ? ` at ${time}` : ''}
Items:        ${M('item list')}

Track your order: [Link]

─────────────────
${sender}`;
}

function tAccount(d: ParsedData, subtype?: EmailSubtype): string {
  const subj   = d.subject ?? 'Account Notice';
  const sender = d.sender  ?? M('company name');

  if (subtype === 'account/password_reset') {
    return `Subject: ${subj}

Hi [Name],

We received a request to reset your password.

Reset link: [Link] (expires in [X] hours)

→ If you did not request this, ignore this email — your password is unchanged.
→ If you requested this, click the link above now.

─────────────────
${sender} Account Security`;
  }

  if (subtype === 'account/verification') {
    return `Subject: ${subj}

Hi [Name],

Please verify your email address to complete your account setup.

Verify now: [Link] (expires in [X] hours)

─────────────────
${sender}`;
  }

  return `Subject: ${subj}

Hi [Name],

There has been a change or activity on your account.

What happened: ${M('specific event')}
When:          ${d.normalizedDates[0]?.iso ?? M('date')}
Action needed: ${M('required action or "none"')}

Review your account: [Link]

─────────────────
${sender} Account Team`;
}

function tSupport(d: ParsedData, subtype?: EmailSubtype): string {
  const subj   = d.subject ?? 'Support Update';
  const sender = d.sender  ?? M('company name');

  const statusLine = subtype === 'support/issue_resolved'
    ? 'Status:    RESOLVED ✓'
    : subtype === 'support/ticket_update'
    ? 'Status:    In Progress'
    : 'Status:    Open';

  return `Subject: ${subj}

Hi [Name],

We have an update on your support request.

Ticket #:  ${M('ticket number')}
${statusLine}
Update:    ${M('resolution or update summary')}

View ticket: [Link]

─────────────────
${sender} Support Team`;
}

function tCommunity(d: ParsedData, subtype?: EmailSubtype): string {
  const subj   = d.subject ?? 'Community Notification';
  const sender = d.sender  ?? M('platform name');

  const contextLine = subtype === 'community/mention'
    ? 'Someone mentioned you in a discussion.'
    : subtype === 'community/reply_notification'
    ? 'Someone replied to your post.'
    : subtype === 'community/comment_notification'
    ? 'There is a new comment on content you follow.'
    : subtype === 'community/invitation'
    ? 'You have been invited to join a community.'
    : 'There is a new update in your community.';

  return `Subject: ${subj}

Hi [Name],

${contextLine}

Where: ${M('community or group name')}
What:  ${M('content preview')}

View it here: [Link]

─────────────────
${sender}
Manage notifications: [Link]`;
}

function tJob(d: ParsedData, subtype?: EmailSubtype): string {
  const subj   = d.subject ?? 'Career Opportunity';
  const sender = d.sender  ?? M('company or recruiter name');
  const date   = d.normalizedDates[0]?.iso;

  if (subtype === 'job/interview_invite') {
    return `Subject: ${subj}

Hi [Name],

You have been invited to interview for [Role] at [Company].

Date:     ${date ?? M('interview date')}
Time:     ${d.normalizedTimes[0]?.value ?? M('interview time')}
Format:   ${M('in-person / video call')}
Link:     ${M('meeting link or address')}

Please confirm your attendance: [Link]

─────────────────
${sender}`;
  }

  if (subtype === 'job/offer') {
    return `Subject: ${subj}

Hi [Name],

We are pleased to offer you the position of [Role] at [Company].

Start date:  ${date ?? M('start date')}
Salary:      $${M('salary')}
Response by: ${M('deadline date')}

Review and accept: [Link]

─────────────────
${sender}`;
  }

  return `Subject: ${subj}

Hi [Name],

[Company or recruiter] has a career update for you.

Role:    ${M('job title')}
Company: ${M('company name')}
Action:  ${M('next step')}

View details: [Link]

─────────────────
${sender}`;
}

function tLegal(d: ParsedData, subtype?: EmailSubtype): string {
  const subj   = d.subject ?? 'Legal Notice';
  const sender = d.sender  ?? M('company name');
  const date   = d.normalizedDates[0]?.iso ?? M('effective date');

  const noticeType = subtype === 'legal/compliance_notice'
    ? 'Compliance Requirement'
    : subtype === 'legal/contract_notice'
    ? 'Contract Notice'
    : subtype === 'legal/terms_update'
    ? 'Terms of Service Update'
    : subtype === 'legal/privacy_update'
    ? 'Privacy Policy Update'
    : 'Legal Notice';

  return `Subject: ${subj}

Hi [Name],

Please review the following ${noticeType}.

Effective:   ${date}
Summary:     ${M('one-sentence summary of what changed')}
Action:      ${M('required action or "Review and accept" or "No action required"')}

Read in full: [Link]

Questions? Contact: ${M('legal or support email')}

─────────────────
${sender} Legal Team`;
}

function tUnknown(d: ParsedData): string {
  const date   = d.normalizedDates[0]?.iso ?? M('date');
  const time   = d.normalizedTimes[0]?.value ?? M('time');
  const tz     = d.timezone ?? M('timezone');
  const sender = d.sender  ?? M('sender name');

  return `Subject: [Clear, specific subject line]

Hi [Name],

[One-sentence statement of purpose.]

Date/Time:  ${d.normalizedDates.length > 0 ? `${date} at ${time} ${tz}` : `${M('date')} at ${M('time')} ${M('timezone')}`}
Action:     ${M('specific action')}
Deadline:   ${M('deadline date')}

[Link or contact info]

─────────────────
${sender}`;
}

// ─── Structured JSON output ────────────────────────────────────────────────────

function buildStructured(
  d:                  ParsedData,
  classified:         ClassificationResult,
  priority:           Priority,
  urgency:            Urgency,
  sensitivity:        Sensitivity,
  externalDependency: ExternalDependency,
): IdealStructuredVersion {
  const date = d.normalizedDates[0]?.iso;
  const time = d.normalizedTimes[0]?.value;
  const tz   = d.timezone;

  const linkDependency = d.linksFound > 0 && d.hasLinkOnlyCTA && !date;
  const emailType      = classified.type;

  const base: IdealStructuredVersion = {
    type:           emailType,
    priority,
    urgency,
    sensitivity,
    externalDependency,
    action:         buildActionPayload(emailType, classified.subtype, d),
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
    case 'legal':
      return { ...base, ...(date && { date }) };
    case 'alert':
    case 'account':
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
  data:               ParsedData,
  classified:         ClassificationResult,
  priority:           Priority,
  urgency:            Urgency,
  sensitivity:        Sensitivity,
  externalDependency: ExternalDependency,
): Recommendations {
  const { type: emailType, subtype, confidence } = classified;

  const templateFns: Record<EmailType, (d: ParsedData, s?: EmailSubtype) => string> = {
    event:       tEvent,
    course:      tCourse,
    content:     tContent,
    promotion:   tPromotion,
    newsletter:  tNewsletter,
    billing:     tBilling,
    alert:       tAlert,
    transaction: tTransaction,
    account:     tAccount,
    support:     tSupport,
    community:   tCommunity,
    job:         tJob,
    legal:       tLegal,
    unknown:     tUnknown,
  };

  return {
    agentInterpretation: {
      action:     (subtype && SUBTYPE_ACTIONS[subtype]) ?? ACTIONS[emailType],
      confidence: parseFloat(Math.max(0.05, Math.min(0.99, confidence)).toFixed(2)),
      reasoning:  generateReasoning(emailType, subtype, data),
    },
    idealHumanVersion:      templateFns[emailType](data, subtype),
    idealStructuredVersion: buildStructured(data, classified, priority, urgency, sensitivity, externalDependency),
  };
}
