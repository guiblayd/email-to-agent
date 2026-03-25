import { useState } from 'react';
import { examples } from '../data/examples';

interface EmailInputProps {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onPasteHtml?: (html: string) => void;
}

export function EmailInput({ value, onChange, onAnalyze, isAnalyzing, onPasteHtml }: EmailInputProps) {
  const [showExamples, setShowExamples] = useState(false);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html');
    if (html && onPasteHtml) onPasteHtml(html);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isAnalyzing && value.trim()) onAnalyze();
    }
  };

  const tagColors: Record<string, { bg: string; text: string }> = {
    Bad: { bg: 'rgba(244,63,94,0.12)', text: '#f87171' },
    Mediocre: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
    Good: { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  };

  return (
    <div className="flex flex-col h-full p-6 lg:p-8 gap-6">
      {/* Branding */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v7a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 10.5v-7z"
                stroke="white"
                strokeWidth="1.25"
              />
              <path
                d="M2 4.5l6 4 6-4"
                stroke="white"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
              <circle cx="5" cy="11" r="1" fill="white" opacity="0.7" />
              <circle cx="8" cy="11" r="1" fill="white" opacity="0.7" />
              <circle cx="11" cy="11" r="1" fill="white" opacity="0.7" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">
              AgentMail AI
            </h1>
          </div>
          <span
            className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            Beta
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,250,252,0.45)' }}>
          Paste any email and instantly see how an AI agent reads it — and what the ideal version looks like.
        </p>
      </div>

      {/* Textarea */}
      <div className="flex-1 flex flex-col gap-1.5 min-h-0">
        <div
          className="flex-1 relative rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={`Paste your email here...\n\nTry pasting a meeting invite, a promo email, an alert, or any message you send regularly.\n\nPress ⌘↵ to analyze.`}
            className="w-full h-full min-h-[280px] resize-none bg-transparent text-sm leading-relaxed p-4 font-mono focus:outline-none transition-all"
            style={{
              color: 'rgba(248,250,252,0.85)',
              caretColor: '#8b5cf6',
            }}
            spellCheck={false}
          />
          {/* Char count */}
          <span
            className="absolute bottom-3 right-3 text-xs tabular-nums pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            {value.length.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Analyze button */}
        <button
          onClick={onAnalyze}
          disabled={!value.trim() || isAnalyzing}
          className="w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-200 relative overflow-hidden"
          style={{
            background:
              !value.trim() || isAnalyzing
                ? 'rgba(124,58,237,0.25)'
                : 'linear-gradient(135deg, #7c3aed, #6366f1)',
            color:
              !value.trim() || isAnalyzing
                ? 'rgba(255,255,255,0.3)'
                : 'white',
            boxShadow:
              !value.trim() || isAnalyzing
                ? 'none'
                : '0 0 30px rgba(124,58,237,0.35), 0 4px 12px rgba(0,0,0,0.3)',
            cursor: !value.trim() || isAnalyzing ? 'not-allowed' : 'pointer',
            transform: !value.trim() || isAnalyzing ? 'none' : undefined,
          }}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Analyzing…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Analyze Email
            </span>
          )}
        </button>

        {/* Load example */}
        <div className="relative">
          <button
            onClick={() => setShowExamples(v => !v)}
            className="w-full py-2.5 px-5 rounded-xl font-medium text-sm transition-all duration-150"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(248,250,252,0.5)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Load Example
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ transform: showExamples ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>

          {/* Example dropdown */}
          {showExamples && (
            <div
              className="absolute bottom-full mb-2 w-full rounded-xl overflow-hidden z-10 animate-fade-in"
              style={{
                background: '#1c1c24',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              {examples.map((ex, i) => {
                const colors = tagColors[ex.tag] ?? { bg: 'rgba(255,255,255,0.08)', text: '#94a3b8' };
                return (
                  <button
                    key={i}
                    onClick={() => {
                      onChange(ex.text);
                      setShowExamples(false);
                    }}
                    className="w-full text-left px-4 py-3 transition-colors duration-100 flex items-center justify-between gap-3"
                    style={{
                      borderBottom: i < examples.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span className="text-sm" style={{ color: 'rgba(248,250,252,0.75)' }}>
                      {ex.label}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {ex.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>
        No login · No data stored · Free forever
      </p>
    </div>
  );
}
