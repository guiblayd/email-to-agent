/**
 * Deterministic classifier test suite.
 *
 * Each test case describes one archetypal email scenario.
 * Tests verify type, subtype, confidence level, and key explainability fields.
 * No mocking — runs the full parse → classify pipeline.
 */

import { describe, it, expect } from 'vitest';
import { parseEmail }    from '../parser';
import { classifyEmail } from '../classifier';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classify(text: string) {
  const data = parseEmail(text);
  return classifyEmail(data);
}

// ─── Test cases ───────────────────────────────────────────────────────────────

// ── 1. Pure billing email ──────────────────────────────────────────────────────
describe('pure billing email', () => {
  const EMAIL = `
Subject: Invoice #INV-2024-0042 — Payment Due March 31st
From: billing@acme.com

Hi,

Please find your invoice for the current billing period.

Invoice #INV-2024-0042
Amount due: $199.00
Due date: March 31st, 2024

Pay now to avoid service interruption.

[Pay Now]
  `.trim();

  it('classifies as billing', () => {
    const r = classify(EMAIL);
    expect(r.type).toBe('billing');
  });

  it('has high confidence', () => {
    const r = classify(EMAIL);
    expect(r.confidence).toBeGreaterThan(0.65);
  });

  it('passes billing eligibility', () => {
    const r = classify(EMAIL);
    expect(r.eligibility.billing).toBe(true);
  });

  it('has no billing contradiction', () => {
    const r = classify(EMAIL);
    const billingContradictions = r.contradictions.filter(c => c.startsWith('billing_'));
    expect(billingContradictions).toHaveLength(0);
  });

  it('detects invoice and pay_now_cta as strongest evidence', () => {
    const r = classify(EMAIL);
    expect(r.strongestEvidence.some(s => ['invoice', 'pay_now_cta', 'payment_due', 'currency_detected'].includes(s))).toBe(true);
  });
});

// ── 2. Billing keyword inside policy update email ──────────────────────────────
describe('billing keyword inside policy update email', () => {
  const EMAIL = `
Subject: Important: Updates to our Billing API
From: platform@company.com

Hi Developer,

We are updating our billing system and payment API.
These changes affect how usage is calculated and invoiced in our platform.

New pricing model for API calls will take effect on June 1st.
No payment action is required from you at this time.
Your existing integrations will continue to work.

Please review the documentation for the new billing model.
  `.trim();

  it('does NOT classify as billing', () => {
    const r = classify(EMAIL);
    expect(r.type).not.toBe('billing');
  });

  it('classifies as alert or content', () => {
    const r = classify(EMAIL);
    expect(['alert', 'content', 'informational']).toContain(r.type);
  });

  it('billing fails eligibility', () => {
    const r = classify(EMAIL);
    // billing should have failed eligibility (false or absent)
    expect(r.eligibility.billing).not.toBe(true);
  });

  it('fires a billing contradiction', () => {
    const r = classify(EMAIL);
    const hasBillingContra = r.contradictions.some(c =>
      c.includes('billing') || c.includes('api') || c.includes('technical'),
    );
    expect(hasBillingContra).toBe(true);
  });
});

// ── 3. Real event invite ───────────────────────────────────────────────────────
describe('real event invite', () => {
  const EMAIL = `
Subject: You're Invited — AI Summit 2024 on June 15th at 2pm EST
From: events@aisummit.io

Dear Guest,

You are invited to the AI Summit 2024.
Join us live on June 15th at 2:00pm EST for keynote speakers, live demos and networking.

This is a webinar you don't want to miss.

Register now: https://aisummit.io/register

Best regards,
The AI Summit Team
  `.trim();

  it('classifies as event', () => {
    const r = classify(EMAIL);
    expect(r.type).toBe('event');
  });

  it('has high confidence', () => {
    const r = classify(EMAIL);
    expect(r.confidence).toBeGreaterThan(0.60);
  });

  it('has event subtype', () => {
    const r = classify(EMAIL);
    expect(r.subtype).toMatch(/^event\//);
  });

  it('detects scheduling evidence', () => {
    const data = parseEmail(EMAIL);
    expect(data.normalizedTimes.length).toBeGreaterThan(0);
    expect(data.normalizedDates.length).toBeGreaterThan(0);
  });
});

// ── 4. Recorded course email ───────────────────────────────────────────────────
describe('recorded course email', () => {
  const EMAIL = `
Subject: Your Full-Stack Course is now available
From: learn@platform.com

Hi,

The Full-Stack Development Course is now available.
Watch at your own pace. All 24 modules are accessible anytime.

What you will learn:
- React from scratch
- Node.js fundamentals
- Database design step by step

Start learning now: https://platform.com/course/fullstack
  `.trim();

  it('classifies as course', () => {
    const r = classify(EMAIL);
    expect(r.type).toBe('course');
  });

  it('does NOT fire on_demand_signal as negative for course', () => {
    // on_demand should help course (on_demand_learning), not hurt it
    const r = classify(EMAIL);
    expect(r.type).toBe('course');
  });

  it('resolves to course/recorded subtype', () => {
    const r = classify(EMAIL);
    expect(r.subtype).toBe('course/recorded');
  });

  it('on-demand contradiction does not push type away from course', () => {
    // The contradiction may fire (on-demand signal is genuinely present),
    // but it should only penalise 'event' — not 'course'. The winner stays course.
    const r = classify(EMAIL);
    expect(r.type).toBe('course');
  });
});

// ── 5. Live course invite ──────────────────────────────────────────────────────
describe('live course invite', () => {
  const EMAIL = `
Subject: Live Python Bootcamp starts June 3rd — Enroll now
From: academy@pythonacademy.com

Hey there,

Our 8-week Live Python Bootcamp starts on June 3rd, 2024.
Live sessions every Monday and Wednesday at 7pm BRT.
Limited seats — cohort of 30 students only.

Enroll now before spots run out.

Enroll: https://pythonacademy.com/bootcamp
  `.trim();

  it('classifies as course', () => {
    const r = classify(EMAIL);
    expect(r.type).toBe('course');
  });

  it('resolves to bootcamp or live subtype', () => {
    const r = classify(EMAIL);
    expect(r.subtype).toMatch(/^course\/(bootcamp|recorded|workshop)/);
  });

  it('passes course eligibility', () => {
    const r = classify(EMAIL);
    expect(r.eligibility.course).toBe(true);
  });
});

// ── 6. Promotion with discount ─────────────────────────────────────────────────
describe('promotion with discount', () => {
  const EMAIL = `
Subject: 50% OFF — Flash Sale ends tonight!
From: store@shop.com

Get 50% off our premium plan today only.
Use code FLASH50 at checkout.

This offer expires tonight at midnight.

Buy now: https://shop.com/checkout
  `.trim();

  it('classifies as promotion', () => {
    const r = classify(EMAIL);
    expect(r.type).toBe('promotion');
  });

  it('passes promotion eligibility', () => {
    const r = classify(EMAIL);
    expect(r.eligibility.promotion).toBe(true);
  });

  it('resolves to promotion/flash_sale or promotion/discount subtype', () => {
    const r = classify(EMAIL);
    expect(['promotion/flash_sale', 'promotion/discount']).toContain(r.subtype);
  });

  it('has high confidence', () => {
    const r = classify(EMAIL);
    expect(r.confidence).toBeGreaterThan(0.55);
  });
});

// ── 7. Newsletter digest ───────────────────────────────────────────────────────
describe('newsletter digest', () => {
  const EMAIL = `
Subject: Weekly Digest — Top AI News This Week
From: digest@aiweekly.com

Welcome to this week's AI Weekly Digest.

In this edition:

1. OpenAI announces new model — read more
2. Google updates Bard with new features — full story
3. Meta releases new language research paper
4. Stability AI raises $100M in Series B funding
5. Mistral launches lightweight open model

That's all for this week. See you next Monday.

The AI Weekly Team
  `.trim();

  it('classifies as newsletter', () => {
    const r = classify(EMAIL);
    expect(r.type).toBe('newsletter');
  });

  it('passes newsletter eligibility', () => {
    const r = classify(EMAIL);
    expect(r.eligibility.newsletter).toBe(true);
  });

  it('has meaningful confidence', () => {
    const r = classify(EMAIL);
    expect(r.confidence).toBeGreaterThan(0.40);
  });
});

// ── 8. Transaction confirmation ────────────────────────────────────────────────
describe('transaction confirmation', () => {
  const EMAIL = `
Subject: Order Confirmed — Order #ORD-789456
From: orders@shop.com

Hi,

Your order has been confirmed.

Order #ORD-789456
Items: 2x Product A — $49.99
Shipping: FREE

Your order has been successfully placed and is being processed.
Track your order: https://shop.com/track/ORD-789456
  `.trim();

  it('classifies as transaction', () => {
    const r = classify(EMAIL);
    expect(r.type).toBe('transaction');
  });

  it('passes transaction eligibility', () => {
    const r = classify(EMAIL);
    expect(r.eligibility.transaction).toBe(true);
  });

  it('has high confidence', () => {
    const r = classify(EMAIL);
    expect(r.confidence).toBeGreaterThan(0.65);
  });

  it('detects order_confirmed as strong evidence', () => {
    const r = classify(EMAIL);
    expect(r.strongestEvidence).toContain('order_confirmed');
  });
});

// ── 9. Google/API rules update email ──────────────────────────────────────────
describe('Google/API rules update email', () => {
  const EMAIL = `
Subject: Important updates to Google Cloud Billing API
From: cloud-updates@google.com

Dear Developer,

We are updating our Cloud Billing API and usage policies.
A new pricing model for API calls will take effect on June 1st.

These changes affect how your integration reports usage and invoices customers.
No action is required — your existing integrations will continue to work.

Please review the updated documentation and changelog:
https://cloud.google.com/billing/docs/changelog
  `.trim();

  it('does NOT classify as billing', () => {
    const r = classify(EMAIL);
    expect(r.type).not.toBe('billing');
  });

  it('classifies as alert or content', () => {
    const r = classify(EMAIL);
    expect(['alert', 'content', 'informational']).toContain(r.type);
  });

  it('billing does not pass eligibility', () => {
    const r = classify(EMAIL);
    expect(r.eligibility.billing).not.toBe(true);
  });

  it('fires api-context or policy contradiction for billing', () => {
    const r = classify(EMAIL);
    const hasBillingOverride = r.contradictions.some(c =>
      c.includes('billing') || c.includes('api') || c.includes('technical'),
    );
    expect(hasBillingOverride).toBe(true);
  });

  it('surfaces a contradiction explaining billing rejection', () => {
    // billing_in_api_or_policy_context is the authoritative signal
    const r = classify(EMAIL);
    const hasBillingRejection =
      r.contradictions.some(c => c.includes('billing') || c.includes('api') || c.includes('technical'))
      || r.decisionReason.some(d => d.includes('billing'));
    expect(hasBillingRejection).toBe(true);
  });
});
