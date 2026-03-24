export type EmailType =
  | 'event'
  | 'course'
  | 'content'
  | 'promotion'
  | 'newsletter'
  | 'billing'
  | 'alert'
  | 'transaction'
  | 'informational'
  | 'unknown';

export type Priority    = 'low' | 'medium' | 'high' | 'critical';
export type Urgency     = 'low' | 'medium' | 'high' | 'critical';
export type Language    = 'pt' | 'en';
export type Availability = 'scheduled' | 'on_demand';

export type DateStatus = 'exact' | 'relative' | 'inferred' | 'ambiguous';

export type Intent =
  | 'invite'
  | 'sell'
  | 'remind'
  | 'charge'
  | 'inform'
  | 'warn'
  | 'confirm'
  | 'educate'
  | 'unknown';

export type EmailSubtype =
  | 'event/live'
  | 'event/webinar'
  | 'event/meeting'
  | 'course/mentorship'
  | 'course/workshop'
  | 'course/bootcamp'
  | 'course/recorded'
  | 'promotion/discount'
  | 'promotion/flash_sale'
  | 'billing/reminder'
  | 'billing/overdue'
  | 'billing/renewal';

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
  type:         EmailType;
  subtype?:     EmailSubtype;
  confidence:   number;
  alternatives: Array<{ type: EmailType; score: number }>;
  intent:       Intent;
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
}

export interface IdealStructuredVersion {
  type:           string;
  priority:       string;
  urgency:        string;
  action:         string;
  linkDependency: boolean;
  title?:         string;
  date?:          string;
  time?:          string;
  timezone?:      string;
  start_date?:    string;
  enrollment?:    string;
  duration?:      string;
  sender?:        string;
  subtype?:       string;
  intent?:        string;
  confidence?:    number;
}

export interface AnalysisResult {
  emailType:              EmailType;
  subtype?:               EmailSubtype;
  availability:           Availability;
  confidence:             number;
  alternatives:           Array<{ type: EmailType; score: number }>;
  intent:                 Intent;
  agentReadinessScore:    number;
  safeActionScore:        number;
  scoreBreakdown:         ScoreBreakdown;
  reasoning:              ReasoningEntry[];
  language:               Language;
  priority:               Priority;
  urgency:                Urgency;
  detectedIssues:         string[];
  agentInterpretation:    AgentInterpretation;
  idealHumanVersion:      string;
  idealStructuredVersion: IdealStructuredVersion;
  detectedData: {
    dates:      NormalizedDate[];
    times:      NormalizedTime[];
    timezone?:  string;
    ctaText?:   string;
    linksFound: number;
  };
}
