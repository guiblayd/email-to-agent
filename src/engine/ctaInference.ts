/**
 * Plain-text CTA inference layer.
 *
 * When a user pastes an HTML email as plain text, button labels and anchor
 * text may appear as readable lines but their href targets are lost.
 * This module detects those probable CTA lines deterministically.
 *
 * Rules (evaluated per line):
 *   1. ALL-CAPS lines of 1–10 words → probable button
 *   2. Lines starting with a known imperative verb → probable link
 *   3. Lines ending with "aqui" / "here" / "agora" / "now" → probable link
 *   4. Short verb-led imperative lines (title-case) → probable link
 */

import type { CtaElement } from '../types';

// ─── Vocabulary ───────────────────────────────────────────────────────────────

/** Imperative verbs that commonly open CTA phrases — Portuguese */
const IMPERATIVE_PT = [
  'acesse', 'acesse agora', 'clique', 'participe', 'inscreva-se', 'inscreva',
  'baixe', 'baixar', 'confirme', 'verifique', 'veja', 'assista', 'saiba',
  'cadastre-se', 'cadastre', 'garanta', 'reserve', 'compre', 'faça',
  'quero', 'assine', 'inicie', 'começa', 'obtenha', 'entre', 'experimente',
];

/** Imperative verbs that commonly open CTA phrases — English */
const IMPERATIVE_EN = [
  'click', 'access', 'join', 'enroll', 'download', 'confirm', 'verify',
  'view', 'watch', 'learn', 'register', 'get', 'sign up', 'start',
  'subscribe', 'buy', 'shop', 'read more', 'find out', 'explore',
  'try', 'book', 'reserve', 'apply', 'accept', 'open',
];

const ALL_IMPERATIVES = [...IMPERATIVE_PT, ...IMPERATIVE_EN];

// ─── Line classifiers ─────────────────────────────────────────────────────────

/** Returns true if the line looks like an ALL-CAPS button label. */
function isProbableButton(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 80) return false;

  // Must contain at least one Latin letter
  if (!/[A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇÑa-záéíóúàâêôãõüçñ]/.test(t)) return false;

  // Must be entirely upper-case (accented chars included)
  const upper = t.toUpperCase();
  if (t !== upper) return false;

  const words = t.split(/\s+/);
  return words.length >= 1 && words.length <= 12;
}

/** Returns true if the line looks like an anchor/link CTA. */
function isProbableLink(line: string): boolean {
  const t     = line.trim();
  const lower = t.toLowerCase();

  if (t.length < 3 || t.length > 80) return false;

  // Already caught as button
  if (isProbableButton(line)) return false;

  // Ends with strong CTA terminus words
  if (lower.endsWith('aqui') || lower.endsWith('here')) return true;
  if (lower.endsWith('agora') || lower.endsWith('now')) return true;

  // Starts with a known imperative verb
  if (ALL_IMPERATIVES.some(v => lower.startsWith(v + ' ') || lower === v)) return true;

  return false;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function inferSuspectedCtas(text: string): CtaElement[] {
  const lines    = text.split('\n');
  const suspects: CtaElement[] = [];
  const seen     = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || seen.has(line.toLowerCase())) continue;

    if (isProbableButton(line)) {
      seen.add(line.toLowerCase());
      suspects.push({
        label:    line,
        kind:     'possible_button',
        href:     null,
        priority: suspects.length === 0 ? 'primary' : 'secondary',
      });
    } else if (isProbableLink(line)) {
      seen.add(line.toLowerCase());
      suspects.push({
        label:    line,
        kind:     'possible_link',
        href:     null,
        priority: 'secondary',
      });
    }
  }

  // Cap to avoid noise; prefer buttons first
  return [
    ...suspects.filter(s => s.kind === 'possible_button').slice(0, 3),
    ...suspects.filter(s => s.kind === 'possible_link').slice(0, 3),
  ];
}
