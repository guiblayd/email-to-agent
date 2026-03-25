import type { WeightedKeyword, EmailSubtype, EmailIntent } from '../../types';

export type SubtypeSignals = Partial<Record<EmailSubtype, WeightedKeyword[]>>;
export type IntentSignals  = Partial<Record<EmailIntent, WeightedKeyword[]>>;

export interface Rules {
  /** Common words used for language detection */
  indicatorWords: string[];

  typeKeywords: {
    event:       WeightedKeyword[];
    course:      WeightedKeyword[];
    content:     WeightedKeyword[];
    promotion:   WeightedKeyword[];
    newsletter:  WeightedKeyword[];
    billing:     WeightedKeyword[];
    alert:       WeightedKeyword[];
    transaction: WeightedKeyword[];
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

  /**
   * Phrases that strongly indicate the content is already accessible —
   * no scheduling required. Used by the availability detection layer.
   * Takes priority over detected times and dates.
   */
  onDemandPhrases:  string[];

  /**
   * Phrases that strongly indicate the content is time-bound —
   * a live event, a session starting at a specific time.
   * Used by the availability detection layer when on-demand phrases are absent.
   */
  scheduledPhrases: string[];
}
