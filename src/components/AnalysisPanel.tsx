import { useState } from 'react';
import type { AnalysisResult, EmailType, Priority, Urgency, Language, Intent, EmailSubtype, Availability } from '../types';
import { ScoreRing } from './ScoreRing';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';
import { JsonViewer } from './JsonViewer';
import { EmptyState } from './EmptyState';

// ─── Skeleton / loading ───────────────────────────────────────────────────────

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 8,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

function LoadingState() {
  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton style={{ width: 80, height: 24 }} />
          <Skeleton style={{ width: 60, height: 22, borderRadius: 999 }} />
          <Skeleton style={{ width: 160, height: 14 }} />
        </div>
        <Skeleton style={{ width: 128, height: 128, borderRadius: '50%' }} />
      </div>
      <div className="flex gap-2">
        <Skeleton style={{ width: 80, height: 24, borderRadius: 999 }} />
        <Skeleton style={{ width: 80, height: 24, borderRadius: 999 }} />
        <Skeleton style={{ width: 50, height: 24, borderRadius: 999 }} />
      </div>
      <Skeleton style={{ width: '100%', height: 6, borderRadius: 999 }} />
      <div className="flex flex-col gap-2">
        {[140, 200, 165, 120].map((w, i) => (
          <Skeleton key={i} style={{ width: w, height: 14 }} />
        ))}
      </div>
      <Skeleton style={{ width: '100%', height: 90 }} />
      <Skeleton style={{ width: '100%', height: 160 }} />
      <Skeleton style={{ width: '100%', height: 200 }} />
      <p className="text-xs text-center animate-pulse-slow" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Analysing email structure and intent…
      </p>
    </div>
  );
}

// ─── Metadata maps ─────────────────────────────────────────────────────────────

const TYPE_META: Record<EmailType, { label: string; color: string; bg: string }> = {
  event:         { label: 'Event',         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  course:        { label: 'Course',        color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  content:       { label: 'Content',       color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  promotion:     { label: 'Promotion',     color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  newsletter:    { label: 'Newsletter',    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  billing:       { label: 'Billing',       color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
  alert:         { label: 'Alert',         color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  transaction:   { label: 'Transaction',   color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  informational: { label: 'Informational', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  unknown:       { label: 'Unknown',       color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  medium:   { label: 'Medium',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  high:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

const URGENCY_META: Record<Urgency, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low urgency',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  medium:   { label: 'Medium urgency',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  high:     { label: 'High urgency',     color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  critical: { label: 'Critical urgency', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

const LANGUAGE_META: Record<Language, { label: string; flag: string; color: string; bg: string }> = {
  pt: { label: 'PT', flag: '🇧🇷', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  en: { label: 'EN', flag: '🇺🇸', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
};

const AVAILABILITY_META: Record<Availability, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled',  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  on_demand: { label: 'On-demand',  color: '#38bdf8', bg: 'rgba(56,189,248,0.1)'  },
};

const INTENT_META: Record<Intent, { label: string; icon: string; color: string }> = {
  invite:  { label: 'Invite',   icon: '📩', color: '#a78bfa' },
  sell:    { label: 'Sell',     icon: '🛒', color: '#fb923c' },
  remind:  { label: 'Remind',   icon: '🔔', color: '#f59e0b' },
  charge:  { label: 'Charge',   icon: '💳', color: '#f43f5e' },
  inform:  { label: 'Inform',   icon: 'ℹ️', color: '#60a5fa' },
  warn:    { label: 'Warn',     icon: '⚠️', color: '#ef4444' },
  confirm: { label: 'Confirm',  icon: '✅', color: '#34d399' },
  educate: { label: 'Educate',  icon: '📚', color: '#38bdf8' },
  unknown: { label: 'Unknown',  icon: '❓', color: '#6b7280' },
};

// ─── Shared primitives ────────────────────────────────────────────────────────

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div
      className="animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest mb-3"
       style={{ color: 'rgba(255,255,255,0.3)' }}>
      {children}
    </p>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: bg, color }}>
      {label}
    </span>
  );
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex-shrink-0 text-xs font-medium px-3 py-1 rounded-lg transition-all"
      style={{ color: copied ? '#10b981' : '#94a3b8', background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)' }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

// ─── Safe Action Score bar ────────────────────────────────────────────────────

function SafeActionBar({ score }: { score: number }) {
  const color =
    score >= 75 ? '#10b981' :
    score >= 50 ? '#f59e0b' :
    '#f43f5e';

  const label =
    score >= 75 ? 'Self-contained' :
    score >= 50 ? 'Partial' :
    'Link-dependent';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
          Safe Action Score
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color }}>{label}</span>
          <span className="text-sm font-bold tabular-nums" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="rounded-full overflow-hidden"
           style={{ height: 5, background: 'rgba(255,255,255,0.06)' }}>
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            borderRadius: 999,
            boxShadow: `0 0 8px ${color}60`,
            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Measures whether an agent can act without following external links.
      </p>
    </div>
  );
}

// ─── Confidence bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct   = Math.round(value * 100);
  const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 rounded-full overflow-hidden"
           style={{ height: 5, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color, borderRadius: 999,
          boxShadow: `0 0 8px ${color}80`, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <span className="text-xs font-mono tabular-nums" style={{ color, minWidth: 36 }}>{pct}%</span>
    </div>
  );
}

// ─── Classification meta panel ────────────────────────────────────────────────

function ClassificationMeta({ result }: { result: AnalysisResult }) {
  const typeMeta = TYPE_META[result.emailType];
  const intentMeta = INTENT_META[result.intent];

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3"
         style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Type + confidence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Type</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ background: typeMeta.bg, color: typeMeta.color }}>
            {typeMeta.label}
          </span>
          {result.subtype && (
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              · {result.subtype}
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Confidence</span>
      </div>
      <ConfidenceBar value={result.confidence} />

      {/* Availability + Intent */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Availability</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: AVAILABILITY_META[result.availability].bg, color: AVAILABILITY_META[result.availability].color }}>
          {AVAILABILITY_META[result.availability].label}
        </span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Intent</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: intentMeta.color }}>
          {intentMeta.icon} {intentMeta.label}
        </span>
      </div>

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Also matched:
          </span>
          {result.alternatives.map(alt => {
            const m = TYPE_META[alt.type];
            return (
              <span key={alt.type} className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: m.bg, color: m.color, opacity: 0.75 }}>
                {m.label} <span style={{ opacity: 0.6 }}>({alt.score})</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Detected data section ────────────────────────────────────────────────────

const DATE_STATUS_COLOR: Record<string, string> = {
  exact:    '#a78bfa',
  inferred: '#f59e0b',
  relative: '#38bdf8',
  ambiguous: '#f43f5e',
};

function DetectedDataSection({ result }: { result: AnalysisResult }) {
  const { detectedData, language } = result;
  const langMeta = LANGUAGE_META[language];
  const hasAnyData = detectedData.dates.length > 0 || detectedData.times.length > 0 ||
    detectedData.timezone || detectedData.ctaText || detectedData.linksFound > 0;

  return (
    <details>
      <summary className="text-xs cursor-pointer select-none font-medium"
               style={{ color: 'rgba(255,255,255,0.3)' }}>
        Detected data
      </summary>
      <div className="mt-3 rounded-xl p-4 flex flex-col gap-3"
           style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Language */}
        <div className="flex items-center gap-2">
          <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>Language</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: langMeta.bg, color: langMeta.color }}>
            {langMeta.flag} {langMeta.label}
          </span>
        </div>

        {detectedData.dates.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs w-20 flex-shrink-0 mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>Dates</span>
            <div className="flex flex-col gap-1">
              {detectedData.dates.map((d, i) => {
                const col = DATE_STATUS_COLOR[d.status] ?? '#a78bfa';
                return (
                  <span key={i} className="text-xs font-mono" style={{ color: col }}>
                    {d.iso}
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}> [{d.status}]</span>
                    {d.raw !== d.iso && (
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}> ← "{d.raw}"</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {detectedData.times.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-xs w-20 flex-shrink-0 mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>Times</span>
            <div className="flex flex-col gap-1">
              {detectedData.times.map((t, i) => (
                <span key={i} className="text-xs font-mono" style={{ color: '#6ee7b7' }}>
                  {t.value}
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}> ← "{t.raw}"</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {detectedData.timezone && (
          <div className="flex items-center gap-2">
            <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>Timezone</span>
            <span className="text-xs font-mono" style={{ color: '#fbbf24' }}>{detectedData.timezone}</span>
          </div>
        )}

        {detectedData.ctaText && (
          <div className="flex items-center gap-2">
            <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>CTA</span>
            <span className="text-xs font-mono" style={{ color: '#fb923c' }}>"{detectedData.ctaText}"</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs w-20 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>Links</span>
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{detectedData.linksFound}</span>
        </div>

        {!hasAnyData && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No structured data detected.</p>
        )}
      </div>
    </details>
  );
}

// ─── Reasoning trace ──────────────────────────────────────────────────────────

const EFFECT_STYLE = {
  positive: { color: '#34d399', symbol: '+' },
  negative: { color: '#f43f5e', symbol: '−' },
  neutral:  { color: '#94a3b8', symbol: '·' },
};

function ReasoningTrace({ entries }: { entries: AnalysisResult['reasoning'] }) {
  if (entries.length === 0) return null;
  return (
    <details>
      <summary className="text-xs cursor-pointer select-none font-medium"
               style={{ color: 'rgba(255,255,255,0.3)' }}>
        Score reasoning ({entries.length} signals)
      </summary>
      <div className="mt-3 rounded-xl overflow-hidden"
           style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        {entries.map((e, i) => {
          const st = EFFECT_STYLE[e.effect];
          return (
            <div key={i}
                 className="flex items-start gap-3 px-3 py-2"
                 style={{
                   borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                   background: i % 2 === 0 ? 'rgba(0,0,0,0.15)' : 'transparent',
                 }}>
              <span className="text-xs font-mono w-4 flex-shrink-0 mt-0.5" style={{ color: st.color }}>
                {st.symbol}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', marginRight: 6 }}>
                  [{e.category}]
                </span>
                <span className="text-xs" style={{ color: 'rgba(248,250,252,0.55)' }}>
                  {e.rule}
                </span>
              </div>
              {e.delta !== 0 && (
                <span className="text-xs font-mono tabular-nums flex-shrink-0"
                      style={{ color: e.delta > 0 ? '#34d399' : '#f43f5e' }}>
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}

// ─── Main result view ─────────────────────────────────────────────────────────

function ResultView({ result }: { result: AnalysisResult }) {
  const priorityMeta = PRIORITY_META[result.priority];
  const urgencyMeta  = URGENCY_META[result.urgency];
  const langMeta     = LANGUAGE_META[result.language];

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-7">

      {/* ── Header: classification (left) / score ring (right) ── */}
      <Section delay={0}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-3 pt-1 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest"
               style={{ color: 'rgba(255,255,255,0.3)' }}>
              Detected Type
            </p>
            <ClassificationMeta result={result} />
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: langMeta.bg, color: langMeta.color }}>
                {langMeta.flag} {langMeta.label}
              </span>
              <Badge {...priorityMeta} label={`${priorityMeta.label} priority`} />
              <Badge {...urgencyMeta} />
            </div>
          </div>
          <ScoreRing score={result.agentReadinessScore} />
        </div>
      </Section>

      {/* ── Safe Action Score ── */}
      <Section delay={60}>
        <SafeActionBar score={result.safeActionScore} />
      </Section>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* ── Score breakdown ── */}
      <Section delay={90}>
        <SectionLabel>Score Breakdown</SectionLabel>
        <ScoreBreakdownPanel breakdown={result.scoreBreakdown} />
      </Section>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* ── Detected data (collapsible) ── */}
      <Section delay={110}>
        <DetectedDataSection result={result} />
      </Section>

      {/* ── Reasoning trace (collapsible) ── */}
      <Section delay={130}>
        <ReasoningTrace entries={result.reasoning} />
      </Section>

      {/* ── Issues ── */}
      <Section delay={160}>
        <SectionLabel>Detected Issues</SectionLabel>
        {result.detectedIssues.length === 0 ? (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
               style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ color: '#34d399' }}>✓</span>
            <span className="text-sm" style={{ color: '#6ee7b7' }}>No significant issues found</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {result.detectedIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,0.5)' }} />
                <span className="text-sm leading-relaxed"
                      style={{ color: 'rgba(248,250,252,0.65)' }}>
                  {issue}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Agent interpretation ── */}
      <Section delay={230}>
        <SectionLabel>How an Agent Sees This</SectionLabel>
        <div className="rounded-xl p-4"
             style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Action</span>
              <code className="text-xs px-2 py-0.5 rounded font-mono"
                    style={{ background: 'rgba(167,139,250,0.12)', color: '#c4b5fd' }}>
                {result.agentInterpretation.action}
              </code>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Confidence</span>
            </div>
            <ConfidenceBar value={result.agentInterpretation.confidence} />
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(248,250,252,0.4)' }}>
            {result.agentInterpretation.reasoning}
          </p>
        </div>
      </Section>

      {/* ── Ideal human version ── */}
      <Section delay={300}>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Ideal Human Email</SectionLabel>
          <CopyButton text={result.idealHumanVersion} label="Copy text" />
        </div>
        <div className="rounded-xl overflow-hidden"
             style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-3 py-2 flex items-center gap-1.5"
               style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>ideal-email.txt</span>
          </div>
          <pre className="text-xs leading-relaxed p-4 overflow-x-auto whitespace-pre-wrap font-mono"
               style={{ color: 'rgba(248,250,252,0.7)', background: 'rgba(0,0,0,0.2)' }}>
            {result.idealHumanVersion}
          </pre>
        </div>
      </Section>

      {/* ── Ideal structured JSON ── */}
      <Section delay={370}>
        <SectionLabel>Ideal Structured Version</SectionLabel>
        <JsonViewer data={result.idealStructuredVersion} title="agent-payload.json" />
      </Section>

      {/* ── Full analysis (collapsible) ── */}
      <Section delay={440}>
        <details>
          <summary className="text-xs cursor-pointer select-none font-medium"
                   style={{ color: 'rgba(255,255,255,0.3)' }}>
            View full analysis object
          </summary>
          <div className="mt-3">
            <JsonViewer
              data={{
                emailType:           result.emailType,
                subtype:             result.subtype,
                availability:        result.availability,
                confidence:          result.confidence,
                intent:              result.intent,
                alternatives:        result.alternatives,
                agentReadinessScore: result.agentReadinessScore,
                safeActionScore:     result.safeActionScore,
                scoreBreakdown:      result.scoreBreakdown,
                language:            result.language,
                priority:            result.priority,
                urgency:             result.urgency,
                detectedIssues:      result.detectedIssues,
              }}
              title="full-analysis.json"
            />
          </div>
        </details>
      </Section>
    </div>
  );
}

// ─── Public export ─────────────────────────────────────────────────────────────

interface AnalysisPanelProps {
  result:      AnalysisResult | null;
  isAnalyzing: boolean;
}

export function AnalysisPanel({ result, isAnalyzing }: AnalysisPanelProps) {
  if (isAnalyzing) return <LoadingState />;
  if (!result)     return <EmptyState />;
  return <ResultView result={result} />;
}
