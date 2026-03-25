/**
 * HTML-aware CTA extractor.
 *
 * Runs in browser context only (uses DOMParser).
 * Extracts anchor tags, button elements, and styled link-as-buttons from
 * the HTML version of a clipboard paste — giving the engine accurate CTA
 * count, link targets, and button-vs-link classification that are lost
 * when text/plain is the only available format.
 */

import type { CtaElement } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Detects whether a link element is visually styled as a button.
 * Common in HTML email templates: <a> with background-color, padding,
 * border-radius, or a class name that includes "btn"/"button"/"cta".
 */
function isButtonStyled(el: Element): boolean {
  const style = (el.getAttribute('style') || '').toLowerCase();
  const cls   = (el.getAttribute('class') || '').toLowerCase();
  return (
    style.includes('background') ||
    style.includes('background-color') ||
    style.includes('border-radius') && style.includes('padding') ||
    cls.includes('btn') ||
    cls.includes('button') ||
    cls.includes('cta') ||
    cls.includes('action')
  );
}

/** Normalise href — drop mailto, anchors, and empty values. */
function normaliseHref(href: string | null): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (
    trimmed === '' ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('#') ||
    trimmed === 'javascript:void(0)' ||
    trimmed === 'javascript:;'
  ) return null;
  return trimmed;
}

/** Extract readable text from an element, collapsing whitespace. */
function extractLabel(el: Element): string {
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

/** Heuristic: first anchor (or the one with the largest button styling) is primary. */
function assignPriority(ctas: CtaElement[]): CtaElement[] {
  let primaryAssigned = false;
  return ctas.map(c => {
    if (!primaryAssigned && c.kind === 'button') {
      primaryAssigned = true;
      return { ...c, priority: 'primary' };
    }
    return c;
  });
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface HtmlParseResult {
  ctaElements: CtaElement[];
  linkCount:   number;
  buttonCount: number;
}

export function parseHtmlForCtas(html: string): HtmlParseResult {
  if (typeof DOMParser === 'undefined') {
    return { ctaElements: [], linkCount: 0, buttonCount: 0 };
  }

  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, 'text/html');
  const ctas:  CtaElement[] = [];
  const seen   = new Set<string>();

  // ── Anchor elements ───────────────────────────────────────────────────────
  const anchors = Array.from(doc.querySelectorAll('a'));
  let linkCount  = 0;

  for (const a of anchors) {
    const href  = normaliseHref(a.getAttribute('href'));
    if (!href) continue; // skip decorative or anchor-only links
    linkCount++;

    const label = extractLabel(a);
    if (!label || label.length < 2 || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());

    const isBtn = isButtonStyled(a);
    ctas.push({
      label,
      kind:     isBtn ? 'button' : 'link',
      href,
      priority: 'secondary', // will be reassigned below
    });
  }

  // ── Native button / submit elements ──────────────────────────────────────
  const buttons    = Array.from(doc.querySelectorAll('button, input[type="submit"], input[type="button"]'));
  const buttonCount = buttons.length;

  for (const btn of buttons) {
    const label = extractLabel(btn) || (btn as HTMLInputElement).value || '';
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    ctas.push({ label, kind: 'button', href: null, priority: 'secondary' });
  }

  // ── Sort: buttons first, then links; then assign primary ─────────────────
  const sorted = [
    ...ctas.filter(c => c.kind === 'button'),
    ...ctas.filter(c => c.kind === 'link'),
  ];

  return {
    ctaElements: assignPriority(sorted),
    linkCount,
    buttonCount,
  };
}
