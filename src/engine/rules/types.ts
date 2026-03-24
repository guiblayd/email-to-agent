import type { WeightedKeyword, EmailSubtype, Intent } from '../../types';

export type SubtypeSignals = Partial<Record<EmailSubtype, WeightedKeyword[]>>;
export type IntentSignals  = Partial<Record<Intent, WeightedKeyword[]>>;

export interface Rules {
  /** Common words used for language detection */
  indicatorWords: string[];

  typeKeywords: {
    event:         WeightedKeyword[];
    course:        WeightedKeyword[];
    content:       WeightedKeyword[];
    promotion:     WeightedKeyword[];
    newsletter:    WeightedKeyword[];
    billing:       WeightedKeyword[];
    alert:         WeightedKeyword[];
    transaction:   WeightedKeyword[];
    informational: WeightedKeyword[];
  };

  subtypeKeywords: SubtypeSignals;
  intentSignals:   IntentSignals;

  /** Words signalling enrollment intent (used to distinguish course vs event) */
  enrollmentWords: string[];

  /** Call-to-action words */
  ctaWords: string[];

  urgencyHigh:   string[];
  urgencyMedium: string[];

  /** Vague expressions that reduce the agent readiness score */
  ambiguousTerms: string[];

  /** Full month name / abbreviation → month number (1-12) */
  monthNames: Record<string, number>;

  relativeToday:            string[];
  relativeTomorrow:         string[];
  relativeDayAfterTomorrow: string[];
  relativeNextWeek:         string[];

  greetingPattern:  RegExp;
  signaturePattern: RegExp;
}
