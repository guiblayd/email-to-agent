export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[480px] text-center px-10 select-none">
      {/* Icon */}
      <div className="relative mb-8">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="3" y="7" width="30" height="22" rx="3" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
            <path d="M3 12l15 9 15-9" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" strokeLinejoin="round" />
            {/* AI circuit dots */}
            <circle cx="10" cy="24" r="1.5" fill="rgba(139,92,246,0.4)" />
            <circle cx="18" cy="24" r="1.5" fill="rgba(139,92,246,0.4)" />
            <circle cx="26" cy="24" r="1.5" fill="rgba(139,92,246,0.4)" />
            <line x1="11.5" y1="24" x2="16.5" y2="24" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
            <line x1="19.5" y1="24" x2="24.5" y2="24" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
          </svg>
        </div>
        {/* Glow behind icon */}
        <div
          className="absolute inset-0 rounded-2xl animate-pulse-slow"
          style={{
            background: 'rgba(124,58,237,0.15)',
            filter: 'blur(20px)',
            zIndex: -1,
          }}
        />
      </div>

      <h3
        className="text-lg font-semibold mb-3"
        style={{ color: 'rgba(248,250,252,0.7)' }}
      >
        Paste an email to begin
      </h3>
      <p
        className="text-sm leading-relaxed max-w-xs"
        style={{ color: 'rgba(248,250,252,0.3)' }}
      >
        See exactly how an AI agent reads, classifies, and acts on your message — then get the ideal version.
      </p>

      {/* Feature list */}
      <div className="mt-10 flex flex-col gap-3 text-left w-full max-w-xs">
        {[
          { label: 'Agent Readiness Score (0–100)', color: '#7c3aed' },
          { label: 'Detected issues & ambiguities', color: '#f59e0b' },
          { label: 'Agent interpretation & action', color: '#6366f1' },
          { label: 'Ideal email rewrite', color: '#10b981' },
          { label: 'Structured JSON for agents', color: '#a78bfa' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-3">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: color, boxShadow: `0 0 6px ${color}` }}
            />
            <span className="text-sm" style={{ color: 'rgba(248,250,252,0.25)' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
