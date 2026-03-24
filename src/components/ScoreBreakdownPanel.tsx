import type { ScoreBreakdown } from '../types';

interface ScoreBreakdownPanelProps {
  breakdown: ScoreBreakdown;
}

const CATEGORIES = [
  { key: 'classificationClarity', label: 'Classification Clarity', max: 30, color: '#a78bfa' },
  { key: 'timeClarity',           label: 'Time Clarity',           max: 25, color: '#38bdf8' },
  { key: 'actionClarity',         label: 'Action Clarity',         max: 25, color: '#34d399' },
  { key: 'linkSafety',            label: 'Link Safety',            max: 10, color: '#fb923c' },
  { key: 'completeness',          label: 'Completeness',           max: 10, color: '#f472b6' },
] as const;

export function ScoreBreakdownPanel({ breakdown }: ScoreBreakdownPanelProps) {
  const total = CATEGORIES.reduce((sum, c) => sum + breakdown[c.key], 0);
  const maxTotal = 100; // 30+25+25+10+10 = 100

  return (
    <div className="flex flex-col gap-2.5">
      {CATEGORIES.map(({ key, label, max, color }) => {
        const value = breakdown[key];
        const pct   = Math.round((value / max) * 100);
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
              <span className="text-xs font-mono tabular-nums" style={{ color }}>
                {value}<span style={{ color: 'rgba(255,255,255,0.2)' }}>/{max}</span>
              </span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${color}70, ${color})`,
                  borderRadius: 999,
                  boxShadow: `0 0 6px ${color}40`,
                  transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between mt-1 pt-2"
           style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Total score basis</span>
        <span className="text-xs font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {total}<span style={{ color: 'rgba(255,255,255,0.2)' }}>/{maxTotal}</span>
        </span>
      </div>
    </div>
  );
}
