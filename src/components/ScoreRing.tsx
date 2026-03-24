interface ScoreRingProps {
  score: number;
  size?: number;
  animated?: boolean;
}

export function ScoreRing({ score, size = 128, animated = true }: ScoreRingProps) {
  const strokeWidth = Math.max(6, size * 0.07);
  const radius      = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? '#10b981' :
    score >= 50 ? '#f59e0b' :
    '#f43f5e';

  const label =
    score >= 75 ? 'Good' :
    score >= 50 ? 'Fair' :
    'Poor';

  const glowColor =
    score >= 75 ? 'rgba(16,185,129,0.35)' :
    score >= 50 ? 'rgba(245,158,11,0.35)' :
    'rgba(244,63,94,0.35)';

  const scoreFontSize = `${(size * 0.245).toFixed(0)}px`;
  const labelFontSize = `${(size * 0.095).toFixed(0)}px`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={animated ? 'animate-score-in' : ''}
           style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
             style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={radius}
                  fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
          {/* Progress */}
          <circle cx={size / 2} cy={size / 2} r={radius}
                  fill="none" stroke={color} strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
                    filter: `drop-shadow(0 0 ${(size * 0.07).toFixed(0)}px ${glowColor})`,
                  }} />
        </svg>

        {/* Center text */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex',
                      flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: scoreFontSize, fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: labelFontSize, fontWeight: 600, color, marginTop: 2, letterSpacing: '0.05em' }}>
            {label}
          </span>
        </div>
      </div>

      <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium" style={{ fontSize: `${Math.max(9, size * 0.075).toFixed(0)}px` }}>
        Agent Readiness Score
      </span>
    </div>
  );
}
