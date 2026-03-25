/**
 * External dependency inference layer.
 *
 * Determines how much the email's core value depends on resources outside
 * the email body itself.
 *
 * Levels:
 *   none                — all required information is in the email body
 *   link_optional       — links present but not required to understand the email
 *   link_required       — the primary action or content is behind an external link
 *   attachment_required — the email references an attached document as required context
 */

import type { EmailType, EmailSubtype, ExternalDependency, ParsedData } from '../types';

// ─── Attachment signal detection ──────────────────────────────────────────────

// Strong attachment signals → attachment_required
const ATTACHMENT_REQUIRED_PHRASES = [
  'please find attached', 'find attached', 'attached is', 'attached document',
  'attached file', 'docusign', 'e-signature', 'sign the attached',
  'em anexo', 'segue em anexo', 'arquivo em anexo',
];

// Soft attachment references → attachment_optional (email is still readable without opening)
const ATTACHMENT_OPTIONAL_PHRASES = [
  'attached', 'see attachment', 'attachment included',
  'veja o anexo', 'attachment',
];

function hasAttachmentRequired(lower: string): boolean {
  return ATTACHMENT_REQUIRED_PHRASES.some(p => lower.includes(p));
}

function hasAttachmentOptional(lower: string): boolean {
  return ATTACHMENT_OPTIONAL_PHRASES.some(p => lower.includes(p));
}

// ─── Subtype-level overrides ──────────────────────────────────────────────────
//
// Some subtypes are structurally link-required (e.g. password reset, download)
// or attachment-required (e.g. contract notice).

const SUBTYPE_DEPENDENCY: Partial<Record<EmailSubtype, ExternalDependency>> = {
  'account/password_reset':   'link_required',
  'account/verification':     'link_required',
  'account/login_notice':     'link_optional',
  'account/account_warning':  'link_optional',
  'legal/contract_notice':    'attachment_required',
  'content/video':            'link_required',
  'content/article':          'link_required',
  'content/tutorial':         'link_required',
  'content/documentation':    'link_required',
};

// ─── Public API ────────────────────────────────────────────────────────────────

export function inferExternalDependency(
  type:    EmailType,
  subtype: EmailSubtype | undefined,
  data:    ParsedData,
): ExternalDependency {
  const lower = data.rawText.toLowerCase();

  // 1a. Attachment-required: strong document signal
  if (hasAttachmentRequired(lower)) return 'attachment_required';

  // 1b. Attachment-optional: soft reference — email has inline content
  if (hasAttachmentOptional(lower) && !data.hasLinkOnlyCTA) return 'attachment_optional';

  // 2. Subtype override
  if (subtype && SUBTYPE_DEPENDENCY[subtype] !== undefined) {
    return SUBTYPE_DEPENDENCY[subtype]!;
  }

  // 3. Structural: link-only CTA with no inline content → link_required
  if (data.hasLinkOnlyCTA && !data.hasCTA) return 'link_required';

  // 4. Links present — classify based on type context
  if (data.linksFound > 0) {
    // Types where a link is the primary delivery mechanism
    const linkRequiredTypes: EmailType[] = ['content', 'course', 'transaction'];
    if (linkRequiredTypes.includes(type)) return 'link_required';
    return 'link_optional';
  }

  return 'none';
}
