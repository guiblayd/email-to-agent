import { enRules, ptRules } from './rules';
import type { Language } from '../types';

/**
 * Detects the dominant language by counting how many language-specific
 * indicator words appear in the text. Falls back to 'pt' on a tie.
 */
export function detectLanguage(text: string): Language {
  const lower = text.toLowerCase();
  const tokens = lower.split(/[\s\W]+/).filter(w => w.length > 1);

  let ptScore = 0;
  let enScore = 0;

  const ptSet = new Set(ptRules.indicatorWords);
  const enSet = new Set(enRules.indicatorWords);

  for (const token of tokens) {
    if (ptSet.has(token)) ptScore++;
    if (enSet.has(token)) enScore++;
  }

  return ptScore >= enScore ? 'pt' : 'en';
}
