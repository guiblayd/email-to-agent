export type UserProfile =
  | 'developer'
  | 'creator'
  | 'marketer'
  | 'founder'
  | 'operator'
  | 'finance'
  | 'general';

export type EmailType =
  | 'event'
  | 'course'
  | 'content'
  | 'promotion'
  | 'billing'
  | 'transaction'
  | 'alert'
  | 'account'
  | 'support'
  | 'community'
  | 'job'
  | 'legal'
  | 'newsletter'
  | 'unknown';

export type Priority    = 'low' | 'medium' | 'high' | 'critical';
export type Urgency     = 'low' | 'medium' | 'high' | 'critical';
export type Language    = 'pt' | 'en';
export type Availability = 'scheduled' | 'on_demand' | 'ongoing' | 'none';
export type DateStatus  = 'exact' | 'relative' | 'inferred' | 'ambiguous';

export type EmailIntent =
  | 'read' | 'watch' | 'attend' | 'register'
  | 'pay' | 'review' | 'confirm' | 'reply'
  | 'download' | 'verify' | 'resolve'
  | 'track' | 'acknowledge' | 'ignore';

export type Sensitivity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type ExternalDependency =
  | 'none'
  | 'link_optional'
  | 'link_required'
  | 'attachment_optional'
  | 'attachment_required';

export type EmailSubtype =
  // event
  | 'event/live'
  | 'event/webinar'
  | 'event/meeting'
  | 'event/workshop'
  | 'event/launch_event'
  // course
  | 'course/recorded'
  | 'course/live'
  | 'course/mentorship'
  | 'course/training'
  | 'course/cohort'
  | 'course/onboarding_course'
  // content
  | 'content/video'
  | 'content/article'
  | 'content/tutorial'
  | 'content/documentation'
  | 'content/release_notes'
  | 'content/product_update'
  | 'content/educational_resource'
  // promotion
  | 'promotion/discount'
  | 'promotion/coupon'
  | 'promotion/limited_time'
  | 'promotion/launch_offer'
  | 'promotion/upsell'
  | 'promotion/seasonal_offer'
  // billing
  | 'billing/invoice'
  | 'billing/payment_reminder'
  | 'billing/failed_payment'
  | 'billing/charge_notice'
  | 'billing/subscription_due'
  // transaction
  | 'transaction/receipt'
  | 'transaction/purchase_confirmation'
  | 'transaction/order_update'
  | 'transaction/refund_confirmation'
  | 'transaction/booking_confirmation'
  // alert
  | 'alert/security_alert'
  | 'alert/policy_update'
  | 'alert/system_update'
  | 'alert/access_issue'
  | 'alert/service_incident'
  // account
  | 'account/password_reset'
  | 'account/login_notice'
  | 'account/verification'
  | 'account/account_change'
  | 'account/account_warning'
  // support
  | 'support/support_reply'
  | 'support/ticket_update'
  | 'support/issue_resolved'
  | 'support/follow_up'
  // community
  | 'community/invitation'
  | 'community/reply_notification'
  | 'community/mention'
  | 'community/comment_notification'
  | 'community/community_update'
  // job
  | 'job/application_update'
  | 'job/interview_invite'
  | 'job/offer'
  | 'job/recruiter_message'
  | 'job/opportunity_alert'
  // legal
  | 'legal/terms_update'
  | 'legal/privacy_update'
  | 'legal/compliance_notice'
  | 'legal/contract_notice'
  // newsletter
  | 'newsletter/digest'
  | 'newsletter/editorial'
  | 'newsletter/weekly_roundup'
  | 'newsletter/company_news';

export interface WeightedKeyword {
  word:   string;
  weight: 1 | 2 | 3;
}

export interface NormalizedDate {
  raw:        string;
  iso:        string;
  isRelative: boolean;
  status:     DateStatus;
}

export interface NormalizedTime {
  raw:   string;
  value: string; // HH:mm
}

export interface AgentInterpretation {
  action:     string;
  confidence: number;
  reasoning:  string;
}

export interface ReasoningEntry {
  category: string;
  rule:     string;
  effect:   'positive' | 'negative' | 'neutral';
  delta:    number;
}

export interface ScoreBreakdown {
  classificationClarity: number; // 0–30
  timeClarity:           number; // 0–25
  actionClarity:         number; // 0–25
  linkSafety:            number; // 0–10
  completeness:          number; // 0–10
}

export interface ClassificationResult {
  type:                EmailType;
  subtype?:            EmailSubtype;
  confidence:          number;
  alternatives:        Array<{ type: EmailType; score: number }>;
  intent:              EmailIntent;
  /** Warnings generated during classification (e.g. mixed-signal detection). */
  classificationNotes: string[];

  // ── Explainability (evidence engine) ──────────────────────────────────────
  /** Raw scores before eligibility and contradiction adjustments. */
  rawScores:       Partial<Record<EmailType, number>>;
  /** Adjusted scores after eligibility multipliers and contradiction penalties. */
  adjustedScores:  Partial<Record<EmailType, number>>;
  /** Whether each scored type passed its structural eligibility check. */
  eligibility:     Partial<Record<EmailType, boolean>>;
  /** Labels of all contradiction patterns that fired. */
  contradictions:  string[];
  /** Top evidence signal labels that drove the winning classification. */
  strongestEvidence: string[];
  /** Human-readable explanation of the type selection decision. */
  decisionReason:  string[];
}

export interface DetectedSignalGroups {
  technicalSignals:   string[];
  creatorSignals:     string[];
  marketingSignals:   string[];
  financeSignals:     string[];
  businessSignals:    string[];
  operationsSignals:  string[];
}

export interface ProfileRelevanceResult {
  bestProfileMatch:       UserProfile;
  bestMatchExplanation:   string;
  profileRelevance:       Record<UserProfile, number>;
  finalPriorityByProfile: Record<UserProfile, number>;
  detectedSignalGroups:   DetectedSignalGroups;
}

export interface ParsedData {
  rawText:         string;
  subject?:        string;
  sender?:         string;
  body:            string;
  language:        Language;
  normalizedDates: NormalizedDate[];
  normalizedTimes: NormalizedTime[];
  timezone?:       string;
  hasCTA:          boolean;
  hasLinkOnlyCTA:  boolean;
  ctaText?:        string;
  ambiguousTerms:  string[];
  urgencyKeywords: string[];
  wordCount:       number;
  hasSubject:      boolean;
  hasSender:       boolean;
  hasGreeting:     boolean;
  hasSignature:    boolean;
  isFormatted:     boolean;
  linksFound:      number;
  signalGroups:    DetectedSignalGroups;
}

export interface IdealStructuredVersion {
  type:               string;
  priority:           string;
  urgency:            string;
  sensitivity:        string;
  externalDependency: string;
  action:             { type: string; description: string };
  linkDependency:     boolean;
  title?:             string;
  date?:              string;
  time?:              string;
  timezone?:          string;
  start_date?:        string;
  enrollment?:        string;
  duration?:          string;
  sender?:            string;
  subtype?:           string;
  intent?:            string;
  confidence?:        number;
}

export interface AnalysisResult {
  emailType:              EmailType;
  subtype?:               EmailSubtype;
  availability:           Availability;
  confidence:             number;
  alternatives:           Array<{ type: EmailType; score: number }>;
  intent:                 EmailIntent;
  sensitivity:            Sensitivity;
  externalDependency:     ExternalDependency;
  agentReadinessScore:    number;
  safeActionScore:        number;
  scoreBreakdown:         ScoreBreakdown;
  reasoning:              ReasoningEntry[];
  language:               Language;
  priority:               Priority;
  urgency:                Urgency;
  /** Numeric base priority from email content alone (0–100). */
  intrinsicScore:         number;
  /** Contextual relevance from domain/platform/technical signals (0–55). */
  relevanceScore:         number;
  /** Final combined score: intrinsicScore + relevanceScore, clamped to 0–100. */
  priorityScore:          number;
  /** Top signal labels that drove the classification decision. */
  strongestEvidence:      string[];
  /** Human-readable lines explaining why the winning type was selected. */
  decisionReason:         string[];
  /** Contradiction pattern labels that fired during classification. */
  contradictions:         string[];
  detectedIssues:         string[];
  failureModes:           string[];
  agentInterpretation:    AgentInterpretation;
  idealHumanVersion:      string;
  idealStructuredVersion: IdealStructuredVersion;
  profileAnalysis:        ProfileRelevanceResult;
  detectedData: {
    dates:      NormalizedDate[];
    times:      NormalizedTime[];
    timezone?:  string;
    ctaText?:   string;
    linksFound: number;
  };
}
