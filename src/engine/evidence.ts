/**
 * Evidence model for the deterministic email classifier.
 *
 * Each signal in the registry detects one observable fact about the email.
 * Signals are language-agnostic (EN + PT handled in each detector).
 * Weights live in weights.ts — this file only defines what can be detected.
 */

import type { ParsedData } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type EvidenceCategory =
  | 'lexical_strong'   // high-specificity multi-word phrases
  | 'lexical_weak'     // single common words (low weight, easily overridden)
  | 'structural'       // pattern-derived facts (regex, counts, layout)
  | 'temporal'         // date / time / timezone presence
  | 'financial'        // currency, amounts, monetary structure
  | 'action'           // explicit CTA phrases with payment/event/enroll intent
  | 'contextual'       // signals derived from co-occurrence of multiple weaker signals
  | 'negative';        // counter-evidence that reduces likelihood of a type

export interface EvidenceItem {
  category: EvidenceCategory;
  label:    string;
}

interface SignalDef {
  category: EvidenceCategory;
  detect:   (text: string, data: ParsedData) => boolean;
}

// ─── Detection helpers ─────────────────────────────────────────────────────────

/** Case-insensitive word-boundary match for single-word signals. */
function word(text: string, ...terms: string[]): boolean {
  return terms.some(t => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text));
}

/** Simple substring match — safe for multi-word phrases. */
function phrase(text: string, ...phrases: string[]): boolean {
  return phrases.some(p => text.includes(p));
}

/** Substring OR word match depending on whether the pattern contains a space. */
function any(text: string, ...terms: string[]): boolean {
  return terms.some(t => t.includes(' ') ? text.includes(t) : word(text, t));
}

const CURRENCY_RE   = /[r$€£¥]\s*[\d,.]|[\d,.]+\s*(?:reais|dollars?|usd|eur|brl)\b/i;
const PERCENTAGE_RE = /\b\d+\s*%(?:\s*(?:off|de\s*desconto))?/i;
const REF_ID_RE     = /\b(?:inv|order|ref|tkt|ped)[-\s]?[#\d]{4,}/i;

// ─── Signal registry ───────────────────────────────────────────────────────────

const SIGNALS: Record<string, SignalDef> = {

  // ══ BILLING ════════════════════════════════════════════════════════════════════

  invoice: {
    category: 'lexical_strong',
    detect: t => any(t, 'invoice', 'fatura', 'nota fiscal'),
  },
  payment_due: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'payment due', 'due date', 'amount due', 'balance due',
      'pagamento em atraso', 'vence em breve', 'próximo vencimento',
    ),
  },
  overdue: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'overdue', 'past due', 'final notice', 'último aviso',
      'cobrança pendente', 'valor em aberto',
    ),
  },
  payment_failed: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'payment failed', 'payment declined',
      'pagamento recusado', 'pagamento não processado',
    ),
  },
  auto_renewal: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'auto-renewal', 'renewal notice', 'subscription renewal',
      'renovação automática', 'renovação da assinatura',
    ),
  },
  billing_statement: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'billing statement', 'account statement',
      'extrato de cobrança', 'extrato da conta',
    ),
  },
  payment_word: {
    category: 'lexical_weak',
    detect: t => any(t, 'payment', 'pagamento'),
  },
  billing_word: {
    category: 'lexical_weak',
    detect: t => any(t, 'billing', 'cobrança'),
  },
  charge_word: {
    category: 'lexical_weak',
    detect: t => word(t, 'charge', 'cobrar'),
  },
  price_word: {
    category: 'lexical_weak',
    detect: t => word(t, 'price', 'preço', 'pricing', 'precificação'),
  },

  // ── Financial structural
  currency_detected: {
    category: 'financial',
    detect: t => CURRENCY_RE.test(t),
  },
  due_date_detected: {
    category: 'temporal',
    detect: t => phrase(t,
      'due by', 'due on', 'pay by',
      'vence em', 'vencimento em', 'pague até', 'pague antes de',
    ),
  },
  invoice_id_detected: {
    category: 'structural',
    detect: t => REF_ID_RE.test(t),
  },
  pay_now_cta: {
    category: 'action',
    detect: t => phrase(t,
      'pay now', 'pay before', 'make payment', 'complete payment', 'settle your',
      'pague agora', 'efetue o pagamento', 'realize o pagamento',
    ),
  },
  /** Fires when ≥2 of: pay-action, currency, and due-date language co-occur. */
  payment_execution_intent: {
    category: 'contextual',
    detect: t => {
      const n = [
        phrase(t, 'pay now', 'pague agora', 'efetue o pagamento', 'settle your'),
        CURRENCY_RE.test(t),
        phrase(t, 'due', 'vence', 'vencimento'),
      ].filter(Boolean).length;
      return n >= 2;
    },
  },

  // ── Billing negatives
  /** API/system billing topic — financial vocabulary used in a technical context. */
  api_billing_topic: {
    category: 'negative',
    detect: t => phrase(t,
      'billing api', 'billing system', 'billing policy', 'billing change',
      'billing update', 'billing model', 'billing documentation',
      'api de cobrança', 'sistema de cobrança', 'política de pagamento', 'modelo de cobrança',
    ),
  },
  pricing_policy_topic: {
    category: 'negative',
    detect: t => phrase(t,
      'pricing update', 'pricing change', 'pricing policy', 'pricing model', 'new pricing',
      'atualização de preços', 'mudança de preços', 'nova tabela de preços',
    ),
  },
  long_explanatory_text: {
    category: 'negative',
    detect: (_t, d) => d.wordCount > 200,
  },

  // ══ EVENT ══════════════════════════════════════════════════════════════════════

  webinar: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'webinar', 'virtual event', 'online event', 'evento virtual',
    ),
  },
  live_stream: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'live stream', 'going live', 'tune in live', 'join us live',
      'transmissão ao vivo', 'ir ao vivo', 'ao vivo', 'participe ao vivo',
    ),
  },
  conference: {
    category: 'lexical_strong',
    detect: t => any(t, 'conference', 'summit', 'seminar', 'conferência', 'seminário'),
  },
  meeting: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'team meeting', 'one-on-one', 'standup',
      'reunião de equipe', 'conversa individual',
    ) || (word(t, 'meeting', 'reunião') && !phrase(t, 'meeting agenda was sent', 'meeting notes')),
  },
  palestra: {
    category: 'lexical_strong',
    detect: t => any(t, 'palestra', 'keynote') || phrase(t, 'speaker session'),
  },
  event_word: {
    category: 'lexical_weak',
    detect: t => any(t, 'event', 'evento', 'gathering', 'encontro', 'ceremony', 'cerimônia'),
  },
  join_attend: {
    category: 'lexical_weak',
    detect: t => any(t, 'join', 'attend', 'participate')
      || phrase(t, 'compareça', 'venha', 'participe'),
  },
  exact_date_detected: {
    category: 'temporal',
    detect: (_t, d) => d.normalizedDates.length > 0,
  },
  exact_time_detected: {
    category: 'temporal',
    detect: (_t, d) => d.normalizedTimes.length > 0,
  },
  timezone_detected: {
    category: 'temporal',
    detect: (_t, d) => !!d.timezone,
  },
  register_cta: {
    category: 'action',
    detect: t => phrase(t,
      'register now', 'rsvp', 'book now', 'reserve your spot', 'reserve seu lugar',
      'inscreva-se', 'cadastre-se', 'garanta sua vaga', 'faça sua inscrição',
    ) || (word(t, 'register') && !phrase(t, 'course registration', 'registered user')),
  },
  join_event_cta: {
    category: 'action',
    detect: t => phrase(t,
      'join now', 'join us', 'junte-se a nós', 'entre agora',
    ),
  },
  scheduled_interaction_intent: {
    category: 'contextual',
    detect: (t, d) => {
      const hasTime = d.normalizedTimes.length > 0;
      const hasJoin = phrase(t, 'join', 'attend', 'participe', 'compareça')
        || any(t, 'attend', 'participate');
      return hasTime && hasJoin;
    },
  },
  on_demand_signal: {
    category: 'negative',
    detect: t => phrase(t,
      'on-demand', 'on demand', 'self-paced', 'watch at your own pace',
      'available anytime', 'available any time', 'replay available',
      'watch the recording', 'recorded session', 'access the recording',
      'já disponível', 'disponível agora', 'assista quando quiser',
      'aula gravada', 'gravado', 'acabei de disponibilizar',
      'acabei de lançar', 'acabei de publicar',
    ),
  },

  // ══ COURSE ═════════════════════════════════════════════════════════════════════

  course_word: {
    category: 'lexical_strong',
    detect: t => word(t, 'course', 'curso'),
  },
  training_word: {
    category: 'lexical_strong',
    detect: t => word(t, 'training', 'treinamento'),
  },
  mentorship_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'mentorship', 'mentoria', 'coaching', 'mentor'),
  },
  bootcamp_word: {
    category: 'lexical_strong',
    detect: t => word(t, 'bootcamp'),
  },
  masterclass_word: {
    category: 'lexical_strong',
    detect: t => word(t, 'masterclass'),
  },
  certification_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'certification', 'certificação', 'certificate'),
  },
  program_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'formação', 'curriculum', 'syllabus'),
  },
  module_lesson: {
    category: 'lexical_weak',
    detect: t => any(t, 'module', 'módulo', 'lesson', 'aula', 'capítulo'),
  },
  cohort_turma: {
    category: 'lexical_weak',
    detect: t => any(t, 'cohort', 'turma', 'batch', 'intake'),
  },
  enrollment_signal: {
    category: 'lexical_weak',
    detect: t => phrase(t,
      'enroll', 'enrollment', 'inscrição', 'matrícula',
      'open enrollment', 'vagas disponíveis', 'vagas limitadas',
    ),
  },
  enroll_cta: {
    category: 'action',
    detect: t => phrase(t,
      'enroll now', 'start learning', 'get access',
      'comece a aprender', 'acesse o curso', 'matricule-se',
    ),
  },
  educational_intent: {
    category: 'contextual',
    detect: t => phrase(t,
      'you will learn', 'what you will learn', 'você vai aprender', 'você aprenderá',
      'step by step', 'passo a passo', 'from scratch', 'do zero',
    ),
  },
  on_demand_learning: {
    category: 'contextual',
    detect: t => phrase(t,
      'self-paced', 'on-demand', 'watch at your own pace',
      'no seu ritmo', 'assista quando quiser', 'aula gravada',
    ),
  },
  duration_detected: {
    category: 'structural',
    detect: t => phrase(t, 'hours', 'horas', 'weeks', 'semanas')
      || /\b\d+\s*(?:h|hrs?|weeks?|semanas?)\b/i.test(t),
  },
  curriculum_structure: {
    category: 'structural',
    detect: t => phrase(t,
      'curriculum', 'syllabus', 'grade curricular', 'ementa',
      'módulos do curso', 'course content', 'course outline',
    ),
  },

  // ══ CONTENT ════════════════════════════════════════════════════════════════════

  article_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'article', 'artigo') || phrase(t, 'blog post'),
  },
  video_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'video', 'vídeo', 'youtube')
      || phrase(t, 'watch now', 'assista agora', 'new episode', 'novo episódio'),
  },
  tutorial_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'tutorial') || phrase(t, 'how-to guide', 'como fazer'),
  },
  guide_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'guide', 'guia', 'handbook', 'playbook'),
  },
  release_notes_word: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'release notes', 'notas de versão', 'changelog',
      "what's new", 'o que há de novo',
    ),
  },
  product_update_word: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'product update', 'atualização do produto', 'feature update',
      'new feature', 'novo recurso', 'new release',
    ),
  },
  read_watch: {
    category: 'lexical_weak',
    detect: t => word(t, 'read', 'watch', 'listen', 'ler', 'assistir', 'ouvir'),
  },
  api_context: {
    category: 'contextual',
    detect: t => any(t, 'api', 'sdk', 'endpoint', 'webhook', 'integration', 'integração'),
  },
  technical_update_context: {
    category: 'contextual',
    detect: t => any(t, 'version', 'versão', 'release', 'documentation', 'documentação', 'migration', 'migração'),
  },
  product_update_context: {
    category: 'contextual',
    detect: t => phrase(t,
      'product update', 'platform update', 'atualização do sistema',
      'atualização da plataforma', 'atualização do produto',
    ),
  },
  educational_context: {
    category: 'contextual',
    detect: t => any(t, 'learn', 'understand', 'aprender', 'entender', 'discover', 'descubra'),
  },
  on_demand_content_signal: {
    category: 'contextual',
    detect: t => phrase(t,
      'on-demand', 'available now', 'available anytime', 'watch now',
      'read now', 'listen now', 'já disponível', 'disponível agora',
      'assista agora', 'assista quando quiser', 'acabei de publicar',
      'acabei de disponibilizar', 'acabei de lançar',
    ),
  },
  long_body_text: {
    category: 'structural',
    detect: (_t, d) => d.wordCount > 120,
  },
  explanatory_paragraphs: {
    category: 'structural',
    detect: (t, _d) => (t.match(/\n\n/g) ?? []).length >= 2,
  },

  // ══ ALERT ══════════════════════════════════════════════════════════════════════

  security_alert: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'security alert', 'aviso de segurança', 'security notice',
      'security breach', 'compromised', 'comprometido',
      'unauthorized', 'não autorizado', 'unusual activity', 'atividade incomum',
      'sign-in attempt', 'suspicious activity',
    ),
  },
  account_locked: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'account locked', 'conta bloqueada', 'account suspended', 'conta suspensa',
      'account disabled',
    ),
  },
  policy_terms: {
    category: 'lexical_strong',
    detect: t => any(t, 'policy', 'política', 'terms', 'termos', 'compliance', 'conformidade')
      || phrase(t, 'rules have', 'regras foram'),
  },
  system_maintenance: {
    category: 'lexical_strong',
    detect: t => any(t, 'maintenance', 'manutenção', 'downtime', 'outage', 'indisponibilidade')
      || phrase(t, 'service interruption', 'interrupção do serviço'),
  },
  important_urgent: {
    category: 'lexical_weak',
    detect: t => any(t, 'important', 'importante', 'urgent', 'urgente', 'warning', 'aviso', 'atenção'),
  },
  policy_update_context: {
    category: 'contextual',
    detect: t => {
      const hasPolicy = any(t, 'policy', 'política', 'terms', 'termos', 'rules', 'regras');
      const hasChange = phrase(t, 'update', 'change', 'atualização', 'mudança', 'alteração', 'changed', 'updated');
      return hasPolicy && hasChange;
    },
  },
  system_update_context: {
    category: 'contextual',
    detect: t => {
      const hasSystem = any(t, 'system', 'sistema', 'platform', 'plataforma', 'infrastructure', 'infraestrutura');
      const hasChange = phrase(t, 'update', 'change', 'atualização', 'mudança', 'maintenance', 'manutenção');
      return hasSystem && hasChange;
    },
  },
  platform_change_context: {
    category: 'contextual',
    detect: t => phrase(t,
      'platform', 'plataforma', 'quota', 'rate limit', 'usage policy', 'política de uso',
      'terms of service', 'termos de serviço', 'developer notice', 'aviso para desenvolvedores',
      'service update', 'atualização do serviço',
    ),
  },
  account_notice_context: {
    category: 'contextual',
    detect: t => phrase(t,
      'your account', 'sua conta', 'account activity', 'atividade da conta', 'account update',
    ),
  },
  operational_impact_statement: {
    category: 'structural',
    detect: t => phrase(t,
      'will affect', 'afetará', 'will impact', 'impactará',
      'will be unavailable', 'ficará indisponível',
      'please note that', 'gostaríamos de informar',
      'this will require', 'no action required', 'no action is required',
      'nenhuma ação necessária',
    ),
  },
  strong_commercial_offer: {
    category: 'negative',
    detect: t => {
      const hasDiscount = phrase(t, '% off', 'discount', 'coupon', 'desconto', 'cupom');
      const hasBuy      = any(t, 'buy', 'shop', 'compre');
      return hasDiscount && hasBuy;
    },
  },

  // ══ PROMOTION ══════════════════════════════════════════════════════════════════

  promo_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'promo', 'promoção') || phrase(t, 'flash sale', 'clearance', 'liquidação'),
  },
  offer_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'offer', 'oferta', 'deal'),
  },
  coupon_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'coupon', 'cupom') || phrase(t, 'promo code', 'discount code', 'código promocional'),
  },
  discount_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'discount', 'desconto') || phrase(t, '% off', 'percent off', 'de desconto'),
  },
  percentage_detected: {
    category: 'structural',
    detect: t => PERCENTAGE_RE.test(t),
  },
  expiry_date_detected: {
    category: 'structural',
    detect: t => phrase(t,
      'expires', 'expira', 'valid until', 'válido até', 'offer ends',
      'today only', 'só hoje', 'ends tonight', 'encerra hoje',
    ),
  },
  buy_now_cta: {
    category: 'action',
    detect: t => phrase(t,
      'buy now', 'shop now', 'compre agora', 'get it now',
      'claim now', 'redeem now', 'resgatar',
    ),
  },
  commercial_intent: {
    category: 'contextual',
    detect: t => {
      const hasOffer = phrase(t, 'discount', 'offer', 'desconto', 'oferta', 'coupon', 'cupom');
      const hasCta   = any(t, 'buy', 'shop', 'compre', 'claim', 'get');
      return hasOffer && hasCta;
    },
  },
  limited_time_context: {
    category: 'contextual',
    detect: t => phrase(t,
      'limited time', 'tempo limitado', '24 hours only', 'today only',
      'só hoje', 'this week only', 'apenas esta semana',
    ),
  },
  purely_informational_promo: {
    category: 'negative',
    detect: (t, _d) => {
      const hasOfferWord = phrase(t, 'discount', 'offer', 'desconto', 'oferta');
      const hasBuyCta    = phrase(t, 'buy', 'shop', 'compre', 'purchase');
      return hasOfferWord && !hasBuyCta;
    },
  },

  // ══ NEWSLETTER ═════════════════════════════════════════════════════════════════

  newsletter_word: {
    category: 'lexical_strong',
    detect: t => word(t, 'newsletter'),
  },
  edition_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'edition', 'edição') || word(t, 'issue', 'volume'),
  },
  digest_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'digest', 'roundup', 'curadoria') || phrase(t, 'resumo semanal', 'resumo mensal', 'curated for you'),
  },
  highlights_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'highlights', 'destaques') || phrase(t, 'top stories', 'this week in', 'weekly update', 'monthly update', 'mais lidos'),
  },
  multiple_topics: {
    category: 'structural',
    detect: (t, d) => {
      const paragraphs = t.split(/\n\n+/).filter(p => p.trim().length > 50);
      return paragraphs.length >= 4 || d.wordCount > 300;
    },
  },
  editorial_structure: {
    category: 'structural',
    detect: (t, _d) => {
      const hasMultiSection = (t.match(/\n\n/g) ?? []).length >= 3;
      const hasList = /[-•*]\s.{10,}/m.test(t);
      return hasMultiSection || hasList;
    },
  },
  recurring_format: {
    category: 'structural',
    detect: t => phrase(t,
      'weekly', 'monthly', 'every week', 'toda semana', 'todo mês', 'biweekly', 'quinzenal',
      "this week's", "this month's", 'nesta edição', 'in this issue', 'in this edition',
    ),
  },
  digest_intent: {
    category: 'contextual',
    detect: t => phrase(t,
      "this week's", "this month's", 'semana passada', 'esta semana',
      'nesta edição', 'in this issue', 'in this edition', 'links da semana',
    ),
  },
  single_operational_action: {
    category: 'negative',
    detect: (t, d) => d.wordCount < 60 && (phrase(t, 'pay now', 'order confirmed', 'pague agora', 'pedido confirmado')),
  },
  strong_receipt_in_newsletter: {
    category: 'negative',
    detect: t => phrase(t, 'order confirmed', 'payment received', 'pedido confirmado', 'payment successful'),
  },

  // ══ TRANSACTION ════════════════════════════════════════════════════════════════

  receipt_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'receipt', 'recibo', 'comprovante'),
  },
  order_confirmed: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'order confirmed', 'order placed', 'order has been',
      'pedido confirmado', 'pedido enviado', 'seu pedido foi',
    ),
  },
  payment_received: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'payment received', 'payment successful', 'payment confirmed',
      'pagamento recebido', 'pagamento confirmado', 'compra aprovada',
    ),
  },
  booking_confirmed: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'booking confirmed', 'reservation confirmed', 'reserva confirmada',
    ),
  },
  confirmation_word: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'confirmation number', 'confirmation code', 'confirmation #',
      'número de confirmação', 'código de confirmação', 'código de rastreio',
    ),
  },
  reference_id: {
    category: 'structural',
    detect: t => REF_ID_RE.test(t) || phrase(t,
      'tracking number', 'order number', 'número do pedido', 'tracking #',
    ),
  },
  completed_action_context: {
    category: 'contextual',
    detect: t => phrase(t,
      'has been', 'successfully', 'foi processado', 'foi confirmado',
      'foi enviado', 'concluído', 'has been processed', 'has been confirmed',
    ),
  },

  // ══ ACCOUNT ════════════════════════════════════════════════════════════════════

  password_reset: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'password reset', 'reset your password', 'redefinição de senha',
      'link para redefinir', 'reset link', 'forgot your password',
      'esqueceu sua senha', 'create a new password',
    ),
  },
  account_verification: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'verify your email', 'verify your account', 'confirm your email',
      'confirm your account', 'verifique seu e-mail', 'confirme seu e-mail',
      'email verification', 'account confirmation',
    ),
  },
  login_notice: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'new sign-in', 'new login', 'someone signed in', 'sign-in detected',
      'we noticed a sign-in', 'login from', 'acesso detectado',
      'novo acesso', 'login detectado',
    ),
  },
  account_warning: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'account at risk', 'account may be', 'your account will be',
      'account suspension', 'account termination', 'action required on your account',
      'sua conta está em risco', 'conta será suspensa',
    ),
  },
  account_change_notice: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'your email was changed', 'your password was changed', 'account settings changed',
      'account updated', 'profile updated', 'email address updated',
      'e-mail alterado', 'senha alterada', 'conta atualizada',
    ),
  },
  account_word: {
    category: 'lexical_weak',
    detect: t => phrase(t, 'your account', 'sua conta', 'account access'),
  },
  link_expires: {
    category: 'structural',
    detect: t => phrase(t,
      'link expires', 'link valid for', 'expires in', 'valid for 24 hours',
      'valid for 1 hour', 'link expira', 'válido por',
    ),
  },

  // ══ SUPPORT ════════════════════════════════════════════════════════════════════

  ticket_word: {
    category: 'lexical_strong',
    detect: t => any(t, 'ticket', 'case', 'support request', 'chamado', 'solicitação de suporte')
      || phrase(t, 'your ticket', 'support case', 'ticket number', 'ticket #'),
  },
  support_reply_signal: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'we have replied', 'your reply', 'reply to this email', 'has been updated',
      'our support team', 'resposta do suporte', 'respondemos ao seu chamado',
      'agent replied', 'agent has responded',
    ),
  },
  issue_resolved_signal: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'issue has been resolved', 'ticket closed', 'case resolved', 'problem fixed',
      'chamado encerrado', 'problema resolvido', 'issue resolved', 'resolved successfully',
    ),
  },
  support_followup: {
    category: 'lexical_weak',
    detect: t => phrase(t,
      'following up', 'checking in', 'any questions', 'still need help',
      'acompanhamento', 'verificando', 'precisa de ajuda', 'how did we do',
    ),
  },
  support_word: {
    category: 'lexical_weak',
    detect: t => any(t, 'support', 'suporte', 'helpdesk', 'help desk'),
  },

  // ══ COMMUNITY ══════════════════════════════════════════════════════════════════

  community_mention: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'mentioned you', 'tagged you', 'mentioned in', '@mentioned',
      'te mencionou', 'marcou você', 'foi mencionado',
    ),
  },
  community_reply: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'replied to your', 'commented on your', 'responded to your post',
      'respondeu ao seu', 'comentou em sua', 'new reply on your',
    ),
  },
  community_invite: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'join our community', 'invited to join', 'community invitation',
      'join the group', 'junte-se à nossa comunidade', 'convite para comunidade',
      'you have been invited', 'join the channel', 'join our slack', 'join our discord',
    ),
  },
  community_notification: {
    category: 'lexical_weak',
    detect: t => phrase(t,
      'new comment', 'new reply', 'new post', 'new message in',
      'novo comentário', 'nova resposta', 'nova mensagem', 'activity in',
    ),
  },
  forum_word: {
    category: 'lexical_weak',
    detect: t => any(t, 'forum', 'community', 'grupo', 'group', 'slack', 'discord', 'circle'),
  },

  // ══ JOB ════════════════════════════════════════════════════════════════════════

  application_update: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'application status', 'your application', 'application received',
      'application update', 'application for', 'we received your application',
      'sua candidatura', 'status da candidatura', 'candidatura recebida',
    ),
  },
  interview_invite: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'interview invitation', 'invited for an interview', 'schedule an interview',
      'interview request', 'technical interview', 'convite para entrevista',
      'entrevista agendada', 'vaga de entrevista', 'interview slot',
    ),
  },
  recruiter_outreach: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'recruiter', 'talent acquisition', 'hiring manager', 'open position',
      'job opportunity', 'career opportunity', 'we are hiring', 'recrutador',
      'oportunidade de emprego', 'vaga disponível', 'estamos contratando',
    ),
  },
  job_offer: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'offer letter', 'job offer', 'offer of employment', 'proposta de emprego',
      'carta de oferta', 'oferta de trabalho',
    ),
  },
  job_word: {
    category: 'lexical_weak',
    detect: t => any(t, 'position', 'role', 'vacancy', 'vaga', 'job', 'emprego', 'trabalho'),
  },

  // ══ LEGAL ══════════════════════════════════════════════════════════════════════

  terms_update: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'terms of service', 'terms of use', 'updated terms', 'changes to our terms',
      'terms have changed', 'termos de uso', 'termos de serviço', 'termos atualizados',
      'mudanças nos termos',
    ),
  },
  privacy_update: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'privacy policy', 'privacy notice', 'data protection', 'gdpr', 'lgpd',
      'política de privacidade', 'aviso de privacidade', 'proteção de dados',
      'your data rights', 'personal data', 'dados pessoais',
    ),
  },
  compliance_notice: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'compliance', 'regulatory', 'legal requirement', 'legal notice',
      'mandatory update', 'required by law', 'legal obligation',
      'conformidade', 'regulatório', 'obrigação legal', 'aviso legal',
    ),
  },
  contract_signal: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'contract', 'agreement', 'sign', 'e-signature', 'docusign', 'signature required',
      'contrato', 'acordo', 'assinar', 'assinatura digital', 'assinatura eletrônica',
    ),
  },
  effective_date_signal: {
    category: 'structural',
    detect: t => phrase(t,
      'effective date', 'effective from', 'takes effect', 'will take effect',
      'effective as of', 'data de vigência', 'entra em vigor', 'vigor a partir de',
    ),
  },

  // ══ INFORMATIONAL (retained as fallback) ═══════════════════════════════════════

  informational_phrase: {
    category: 'lexical_strong',
    detect: t => phrase(t,
      'we wanted to let you know', 'this is to inform', 'please note',
      'gostaríamos de informar', 'é para informar', 'gostaríamos de comunicar',
    ),
  },
  fyi_signal: {
    category: 'lexical_weak',
    detect: t => phrase(t, 'fyi', 'heads up', 'for your information', 'just a heads up'),
  },
  reminder_word: {
    category: 'lexical_weak',
    detect: t => any(t, 'reminder', 'lembrete', 'announcement', 'comunicado', 'notice', 'aviso'),
  },
};

// ─── Public API ────────────────────────────────────────────────────────────────

export const SIGNAL_LABELS = Object.keys(SIGNALS) as string[];

/**
 * Scans the email and returns every signal that fired.
 * The text argument must already be lower-cased for speed.
 */
export function collectEvidence(rawText: string, data: ParsedData): EvidenceItem[] {
  const lower = rawText.toLowerCase();
  const items: EvidenceItem[] = [];

  for (const [label, def] of Object.entries(SIGNALS)) {
    if (def.detect(lower, data)) {
      items.push({ category: def.category, label });
    }
  }

  return items;
}

/**
 * Returns the subset of evidence items relevant to a given type,
 * based on whether the TYPE_EVIDENCE_WEIGHTS table assigns a weight.
 * (Used for explainability display — weights.ts handles actual scoring.)
 */
export function getStrongestEvidence(items: EvidenceItem[], topN = 5): string[] {
  const preferred: EvidenceCategory[] = ['financial', 'action', 'contextual', 'lexical_strong', 'structural'];
  const sorted = [...items].sort((a, b) => {
    const ai = preferred.indexOf(a.category);
    const bi = preferred.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return sorted
    .filter(e => e.category !== 'negative')
    .slice(0, topN)
    .map(e => e.label);
}
