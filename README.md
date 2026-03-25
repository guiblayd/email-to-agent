# AgentMail AI

<img width="1905" height="863" alt="image" src="https://github.com/user-attachments/assets/ff00cba0-e61f-4ad4-b2af-bb1ca2c46b4c" />


**A deterministic email analysis engine that evaluates how well an email can be understood and acted on by an AI agent.**

No LLMs. No external APIs. No machine learning.
Fully explainable, reproducible, and structured by design.

---

## The Problem

Emails are written for humans. They assume context, defer to links, and rely on social conventions that agents cannot resolve.

As AI agents increasingly handle:
- inbox filtering and prioritization
- automated action triggering
- CRM ingestion and routing
- deadline and event scheduling

...they encounter emails that fail silently. Not because the agent is wrong — but because the email never provided enough structure to act on.

Common failure patterns:

| Problem | Example |
|---|---|
| Missing date/time | "We'll go live soon" |
| Link-only CTA | "Click here for details" (no inline context) |
| Ambiguous intent | "Billing update" (invoice? policy change? API docs?) |
| Weak classification signals | Single keyword triggers wrong type |
| Conflicting evidence | Discount language inside a policy notice |

AgentMail AI detects these problems before an agent tries to act on them.

---

## What It Does

Given a raw email string, AgentMail AI:

1. **Parses** structural elements: dates, times, timezone, CTAs, links, sender, subject
2. **Classifies** the email type using a weighted evidence model
3. **Validates** classification against structural eligibility rules
4. **Detects** contradictions between evidence signals
5. **Evaluates** agent-readiness and safe-action capability
6. **Simulates** how a cautious agent would behave on this email
7. **Generates** structured output for use in automation pipelines

---

## Quick Example

**Input:**

```
Subject: Important updates to our Billing API
From: platform@company.com

We are updating our billing system and payment API.
These changes affect how usage is calculated and invoiced.
No payment action is required from you at this time.
```

**Output:**

```json
{
  "emailType": "alert",
  "subtype": "alert/policy_update",
  "confidence": 0.81,
  "availability": "scheduled",
  "intent": "inform",

  "agentReadinessScore": 62,
  "safeActionScore": 58,

  "rawScores": {
    "billing": 22,
    "alert": 68,
    "content": 54
  },
  "adjustedScores": {
    "alert": 68,
    "content": 54
  },
  "eligibility": {
    "billing": false,
    "alert": true,
    "content": true
  },
  "contradictions": [
    "billing_in_api_or_policy_context"
  ],
  "strongestEvidence": [
    "api_context",
    "policy_update_context",
    "platform_change_context"
  ],
  "decisionReason": [
    "\"alert\" selected with adjusted score 68",
    "\"billing\" had raw score 22 but failed eligibility: billing_disqualified_technical_context",
    "Financial terms appear inside a technical or policy context — not a payment request"
  ],
  "detectedIssues": [
    "Financial terms appear inside a technical or policy context — not a payment request",
    "No action path detected — agent has no clear next step to execute"
  ],
  "failureModes": [
    "No action path found — will file the email without processing",
    "Sender is unverifiable — reduced trust applied, action may be quarantined"
  ]
}
```

The engine correctly rejects `billing` — despite the financial vocabulary — because no currency, due date, or payment action was detected, and the context is clearly technical. This distinction cannot be made with keyword matching alone.

---

## Architecture

```
src/
├── engine/
│   ├── parser.ts          # Extracts dates, times, timezone, CTAs, links, language
│   ├── evidence.ts        # 60+ signal detectors (lexical, structural, contextual, financial)
│   ├── weights.ts         # Centralized scoring table: signal → per-type weights
│   ├── eligibility.ts     # Structural minimum requirements per type
│   ├── contradiction.ts   # Detects conflicting signal patterns
│   ├── classifier.ts      # 7-step evidence pipeline → type + subtype + explainability
│   ├── decision.ts        # Availability model + type×availability requirements matrix
│   ├── scoring.ts         # Agent-readiness and safe-action scores
│   ├── recommendations.ts # Ideal email rewrite + structured action payload
│   ├── intent.ts          # Intent detection (charge vs. inform for billing, etc.)
│   ├── language.ts        # Language detection (EN/PT)
│   └── rules/
│       ├── en.ts          # English keyword sets, CTA words, urgency, availability phrases
│       ├── pt.ts          # Portuguese equivalents
│       └── types.ts       # Rules interface definition
├── types/
│   └── index.ts           # All shared TypeScript interfaces and types
└── components/            # React UI (analysis panel, score ring, JSON viewer)
```

### Module responsibilities

**`parser.ts`**
Extracts machine-readable structure from raw email text. Normalizes dates (ISO 8601), times (24-hour), timezones, CTA phrases, link counts, and structural features (greeting, signature, word count). Language-agnostic entry point for the engine.

**`evidence.ts`**
Contains the signal registry — every observable fact the engine can detect. Signals are categorized as `lexical_strong`, `lexical_weak`, `structural`, `temporal`, `financial`, `action`, `contextual`, or `negative`. Detection functions are pure and deterministic.

**`weights.ts`**
Centralized scoring table mapping each signal label to per-type weights. The same signal can contribute positively to one type and negatively to another. All weights are explicit integers.

**`eligibility.ts`**
Enforces structural minimum requirements per type. A type can score high from vocabulary alone but still fail eligibility if the required structural signals are absent. For example: billing requires at least two of — invoice/document term, currency, due date, payment action, or auto-renewal signal.

**`contradiction.ts`**
Detects conflicting evidence patterns and applies score penalties to affected types. Examples: billing vocabulary without financial structure; event language with strong on-demand signals; promotional copy inside a policy notice.

**`classifier.ts`**
Implements the 7-step evidence pipeline and produces the full `ClassificationResult` including raw scores, adjusted scores, eligibility map, contradictions, and decision reasoning.

**`decision.ts`**
Determines content availability (`scheduled` vs `on_demand`) using a 7-step priority chain: intrinsic type → text signals → subtype → scheduled phrases → clock time → course heuristic → default. Maps `type × availability` to structural requirements (`requiresDate`, `requiresTime`, `linkDependencyAcceptable`).

**`scoring.ts`**
Computes `agentReadinessScore` (0–100) and `safeActionScore` (0–100) from five breakdown categories: classification clarity, time clarity, action clarity, link safety, and completeness. Generates agent-centric failure modes.

---

## Classification Model

### 1. Evidence collection

The engine scans the email for ~60 typed signals across eight categories:

| Category | Examples |
|---|---|
| `lexical_strong` | `invoice`, `webinar`, `bootcamp`, `order confirmed` |
| `lexical_weak` | `payment`, `billing`, `join`, `event` |
| `financial` | `currency_detected`, `due_date_detected` |
| `temporal` | `exact_date_detected`, `exact_time_detected`, `timezone_detected` |
| `structural` | `reference_id`, `percentage_detected`, `long_body_text` |
| `action` | `pay_now_cta`, `buy_now_cta`, `register_cta` |
| `contextual` | `api_context`, `policy_update_context`, `payment_execution_intent` |
| `negative` | `api_billing_topic`, `on_demand_signal`, `strong_commercial_offer` |

Signals are language-agnostic — each detector handles both EN and PT internally.

### 2. Raw scoring

Each fired signal contributes its weight to every applicable type. The weights table is centralized in `weights.ts`:

```
invoice          → billing: +30, transaction: +12
api_billing_topic→ billing: −22
api_context      → content: +22, alert: +20
on_demand_signal → event: −28, course: +14, content: +14
```

### 3. Eligibility filtering

Before type selection, each scored type is tested against its structural requirements:

- **Billing**: requires ≥2 distinct hard-signal categories (invoice/document, currency, due date, payment action, auto-renewal). API/policy context with no monetary structure → score multiplier: 0.0
- **Event**: requires a live/interaction signal OR scheduling evidence (date/time)
- **Promotion**: requires both an offer term AND offer structure (percentage, CTA, expiry, or commercial intent)
- **Newsletter**: requires an editorial marker (newsletter, digest, edition) OR clear structural evidence (multiple topics, recurring format)
- **Transaction**: requires a completion signal (order confirmed, payment received, receipt, booking confirmed)

Failed eligibility applies a `scoreMultiplier` (0.0–0.3) to collapse the type's adjusted score.

### 4. Contradiction detection

Ten contradiction patterns detect cases where evidence is internally inconsistent:

```
billing_in_api_or_policy_context  → billing −30
event_with_strong_on_demand_signal → event −25
promotion_no_offer_structure       → promotion −20
transaction_is_editorial           → transaction −18
alert_is_commercial                → alert −24
```

### 5. Confidence

```
confidence = 1 − (second_score / first_score)
           − eligibility_penalty (0.20 if winner failed its own check)
           − contradiction_penalty (0.08 per contradiction targeting winner)
           − margin_penalty (0.12 if gap < 15%)
```

Clamped to [0.05, 0.97].

---

## Availability Model

The engine determines whether email content is `scheduled` (must attend live) or `on_demand` (access any time). This directly affects what is structurally required from the email:

| Type | Availability | requiresDate | requiresTime | linkDependencyAcceptable |
|---|---|---|---|---|
| event | scheduled | ✓ | ✓ | ✗ |
| course | scheduled | ✓ | ✗ | ✗ |
| course | on_demand | ✗ | ✗ | ✓ |
| billing | scheduled | ✓ | ✗ | ✗ |
| content | on_demand | ✗ | ✗ | ✓ |

Detection priority chain:
1. Intrinsic type — `event`, `billing`, `alert` are always `scheduled`
2. Text signals — explicit on-demand or scheduled phrases (language-specific, from rules files)
3. Subtype — `course/recorded` → `on_demand`; `event/webinar` → `scheduled`
4. Clock time — a specific time in the body suggests scheduled
5. Course heuristic — exact start date → `scheduled`; no date → `on_demand`
6. Default — `on_demand`

On-demand text signals take precedence over detected clock times. This prevents false positives where a recording timestamp (e.g., "posted at 14:32") is treated as a scheduling requirement.

---

## Agent Behavior Model

The scoring layer simulates a cautious, conservative agent:

- **Does not click links** unless the type makes link-following acceptable and the action is explicit
- **Does not assume context** — missing date/time is treated as an error, not an approximation
- **Does not act on vague language** — terms like "soon", "TBD", "when possible" generate scheduling penalties
- **Does not trust unverified senders** — missing sender reduces trust score
- **Does not process unknown types** — unknown or low-confidence classification routes to human review

Failure modes are generated explicitly:

```
"Will refuse to follow the external link — action requires human approval"
"Cannot schedule — will defer or skip the time-triggered action"
"No action path found — will file the email without processing"
"Intent is unknown — will escalate to human review queue"
"Low classification confidence (38%) — may misroute as 'billing'"
```

These reflect what a real agent would do given the same constraints, not what an ideal agent should be able to infer.

---

## Why No AI

Using a language model to classify emails would produce a system that is:

- **Non-deterministic**: the same email can return different results
- **Unexplainable**: no auditability of why a type was chosen
- **Expensive at scale**: every email requires an API call
- **Hallucination-prone**: models invent plausible but wrong structure
- **Non-testable**: behavior cannot be unit-tested with assertions

AgentMail AI is:

- **Deterministic**: identical input always produces identical output
- **Explainable**: every classification traces back to specific signals and weights
- **Free to run**: no API costs, no rate limits
- **Hallucination-free**: the engine can only report what it found
- **Unit-testable**: full test suite with assertions on type, subtype, eligibility, and contradictions

The goal is not to be smarter than an LLM. The goal is to be auditable.

---

## Use Cases

**Agent infrastructure developers**
Integrate the analysis output into an email-processing agent to gate unsafe actions before execution.

**Email automation systems**
Use `agentReadinessScore` and `safeActionScore` to decide whether an email should be auto-processed or queued for human review.

**Inbox classification pipelines**
Route emails by type and subtype with confidence-weighted fallback to manual triage.

**CRM ingestion**
Use `idealStructuredVersion` output as a normalized record for leads, events, transactions, and billing records.

**Content creators and email marketers**
Use the `idealHumanVersion` and `detectedIssues` to improve email clarity for both humans and agent-based readers.

**Researchers and standards contributors**
Use the evidence model as a reference for what constitutes a structurally complete email for automated processing.

---

## Supported Email Types

| Type | Subtypes |
|---|---|
| `event` | `live`, `webinar`, `meeting` |
| `course` | `recorded`, `bootcamp`, `workshop`, `mentorship` |
| `content` | `video`, `article`, `podcast`, `product_update` |
| `promotion` | `discount`, `flash_sale` |
| `newsletter` | — |
| `billing` | `invoice`, `reminder`, `overdue`, `renewal` |
| `alert` | `system_update`, `policy_update` |
| `transaction` | — |
| `informational` | `passive`, `actionable`, `product_update` |

Languages supported: **English**, **Portuguese**

---

## Stack

| Layer | Technology |
|---|---|
| UI | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Language | TypeScript 5 |
| Tests | Vitest |
| Runtime | Browser / Node |
| Dependencies | None (runtime) |

No runtime dependencies. The engine is a pure TypeScript module.

---

## Running Locally

```bash
git clone https://github.com/guiblayd/email-to-agent.git
cd email-to-agent
npm install
npm run dev
```

Tests:

```bash
npm test
```

Type checking:

```bash
npx tsc --noEmit
```

---

## Roadmap

**Near-term**
- [ ] HTML email stripping (parse structured HTML bodies)
- [ ] Multi-language expansion (ES, FR, DE)
- [ ] Attachment presence detection
- [ ] Stronger sender trust signals (domain patterns, known senders)

**Medium-term**
- [ ] Plugin system for custom signal definitions
- [ ] JSON schema export for `idealStructuredVersion`
- [ ] Per-signal explainability in UI
- [ ] Extended subtype coverage

**Long-term**
- [ ] Open specification for agent-readable email formats
- [ ] Reference implementation for email authoring tools
- [ ] Benchmark dataset for classification quality

---

## Contributing

Contributions are welcome. The project has a strict constraint: **all logic must remain deterministic and explainable**.

What this means in practice:
- New signals must have a pure detection function and explicit per-type weights
- New eligibility rules must have documented rationale
- Behavior changes must be verified by deterministic test cases
- No ML models, embeddings, or probabilistic components

Good contribution areas:
- New signal detectors for underrepresented email patterns
- Portuguese/Spanish/French vocabulary expansion
- Edge case emails that expose classification errors
- New eligibility rules for underspecified types
- Test cases that document expected behavior

For signal contributions, follow the pattern in [`evidence.ts`](src/engine/evidence.ts) and add corresponding weights in [`weights.ts`](src/engine/weights.ts).

For new test cases, add them to [`src/engine/__tests__/classifier.test.ts`](src/engine/__tests__/classifier.test.ts) with explicit type, eligibility, and contradiction assertions.

---

## Design Principles

1. **No AI** — the engine must produce the same output on any machine without network access
2. **Structure over vocabulary** — isolated keywords cannot classify; evidence must converge
3. **Intent over words** — "billing API update" and "your invoice is due" both contain billing vocabulary; only one is a billing email
4. **Eligibility as a gate** — every type has structural requirements; scoring alone is insufficient
5. **Explainability by default** — every classification produces a full decision trace
6. **Agent-first assumptions** — the agent does not infer; if data is absent, capability is absent
7. **Safety over completeness** — a cautious agent that declines is better than one that acts incorrectly

---
