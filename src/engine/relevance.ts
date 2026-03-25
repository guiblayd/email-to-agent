/**
 * Contextual relevance scoring.
 *
 * Relevance is independent of intrinsic priority — it elevates or preserves
 * the priority of emails that carry domain-meaningful signals, regardless of
 * their base type.
 *
 * A promotional email about a Stripe API change is more relevant to a
 * developer than a generic discount email. A newsletter covering OpenAI
 * updates carries more signal than a generic digest.
 *
 * Four signal categories:
 *
 *   technical   — code / API / integration context   → up to +20
 *   platform    — known product/service platforms     → up to +15
 *   domain      — industry and role signals           → up to +10
 *   educational — learning and skill-building signals → up to +10
 *
 * Max raw relevanceScore: 55.
 * This is intentional — relevance is additive on top of intrinsic priority,
 * not a replacement for it.
 */

// ─── Signal tables ─────────────────────────────────────────────────────────────

const TECHNICAL_SIGNALS = [
  // Core developer vocabulary
  'api', 'sdk', 'integration', 'webhook', 'endpoint', 'library', 'framework',
  'repository', 'cli', 'terminal', 'script', 'deploy', 'deployment', 'pipeline',
  // Engineering practice
  'backend', 'frontend', 'fullstack', 'microservice', 'devops', 'ci/cd',
  // Infrastructure
  'docker', 'kubernetes', 'terraform', 'container', 'cluster',
  // Code artifacts
  'commit', 'pull request', 'branch', 'merge', 'release', 'version', 'changelog',
  // Auth and security
  'oauth', 'jwt', 'token', 'authentication', 'authorization', 'credentials',
  // Data and integration
  'database', 'query', 'schema', 'migration', 'payload', 'request', 'response',
  // PT equivalents
  'integração', 'autenticação', 'implantação', 'repositório',
];

const PLATFORM_SIGNALS = [
  // Cloud providers
  'google', 'aws', 'azure', 'gcp', 'firebase', 'cloudflare',
  'digitalocean', 'heroku', 'vercel', 'netlify', 'fly.io',
  // AI platforms
  'openai', 'anthropic', 'claude', 'gemini', 'mistral', 'groq', 'hugging face',
  // Payment and commerce
  'stripe', 'paypal', 'braintree', 'square', 'shopify', 'woocommerce',
  // Developer tools
  'github', 'gitlab', 'bitbucket', 'linear', 'jira', 'confluence',
  'sentry', 'datadog', 'pagerduty', 'grafana', 'postman',
  // Communication and CRM
  'slack', 'discord', 'twilio', 'sendgrid', 'mailchimp', 'hubspot', 'salesforce',
  // Productivity and data
  'notion', 'airtable', 'zapier', 'make', 'n8n', 'supabase', 'planetscale', 'neon',
];

// Domain signals grouped by industry — each group contributes independently
const DOMAIN_SIGNAL_GROUPS: Record<string, string[]> = {
  engineering: [
    'developer', 'engineer', 'devops', 'architect', 'programmer',
    'desenvolvedor', 'engenheiro', 'arquiteto',
  ],
  marketing: [
    'marketing', 'campaign', 'conversion', 'analytics', 'funnel',
    'seo', 'roi', 'ctr', 'subscriber', 'audience', 'lead',
    'campanha', 'conversão', 'análise', 'audiência',
  ],
  finance: [
    'revenue', 'accounting', 'budget', 'expense', 'invoice',
    'profit', 'loss', 'tax', 'audit', 'fiscal',
    'receita', 'contabilidade', 'orçamento', 'despesa',
  ],
  product: [
    'product manager', 'product owner', 'roadmap', 'sprint', 'backlog',
    'user story', 'feature flag', 'a/b test', 'onboarding', 'retention',
  ],
};

const EDUCATIONAL_SIGNALS = [
  'course', 'tutorial', 'guide', 'lesson', 'workshop',
  'mentorship', 'bootcamp', 'certification', 'training',
  'learn', 'step by step', 'from scratch', 'how to', 'hands-on',
  // PT
  'curso', 'tutorial', 'guia', 'aula', 'treinamento',
  'mentoria', 'certificação', 'aprenda', 'passo a passo', 'do zero',
];

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RelevanceCategoryScores {
  technical:   number;
  platform:    number;
  domain:      number;
  educational: number;
}

export interface RelevanceResult {
  relevanceScore:    number;
  categoryScores:    RelevanceCategoryScores;
  /** Signal labels that contributed to the score (for explainability). */
  detectedSignals:   string[];
}

// ─── Scoring helpers ───────────────────────────────────────────────────────────

function countMatches(lower: string, signals: string[]): string[] {
  return signals.filter(s => lower.includes(s));
}

/**
 * Converts a match count to a capped contribution.
 * First match gives full credit; each additional match adds a diminishing bonus.
 * No match → 0. Max capped at `ceiling`.
 */
function gradedContribution(count: number, base: number, ceiling: number): number {
  if (count === 0) return 0;
  const extra = Math.min(count - 1, 3) * Math.round(base * 0.15);
  return Math.min(ceiling, base + extra);
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes a contextual relevance score from email text.
 *
 * The score is purely signal-driven — no user profile or external data.
 * The same email always produces the same score.
 */
export function computeRelevanceScore(rawText: string): RelevanceResult {
  const lower = rawText.toLowerCase();
  const detected: string[] = [];

  // ── Technical signals ─────────────────────────────────────────────────────
  const techMatches = countMatches(lower, TECHNICAL_SIGNALS);
  if (techMatches.length > 0) detected.push(...techMatches.slice(0, 3).map(s => `tech:${s}`));
  const technical = gradedContribution(techMatches.length, 20, 20);

  // ── Platform signals ──────────────────────────────────────────────────────
  const platMatches = countMatches(lower, PLATFORM_SIGNALS);
  if (platMatches.length > 0) detected.push(...platMatches.slice(0, 3).map(s => `platform:${s}`));
  const platform = gradedContribution(platMatches.length, 15, 15);

  // ── Domain signals ────────────────────────────────────────────────────────
  // Each domain group contributes independently, total capped at 10
  let domainRaw = 0;
  for (const [group, terms] of Object.entries(DOMAIN_SIGNAL_GROUPS)) {
    const groupMatches = countMatches(lower, terms);
    if (groupMatches.length > 0) {
      domainRaw += 4;
      detected.push(`domain:${group}`);
    }
  }
  const domain = Math.min(10, domainRaw);

  // ── Educational signals ───────────────────────────────────────────────────
  const eduMatches = countMatches(lower, EDUCATIONAL_SIGNALS);
  if (eduMatches.length > 0) detected.push(...eduMatches.slice(0, 2).map(s => `edu:${s}`));
  const educational = gradedContribution(eduMatches.length, 10, 10);

  const relevanceScore = technical + platform + domain + educational;

  return {
    relevanceScore,
    categoryScores: { technical, platform, domain, educational },
    detectedSignals: detected,
  };
}
