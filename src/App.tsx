import { useState } from 'react';
import { EmailInput } from './components/EmailInput';
import { AnalysisPanel } from './components/AnalysisPanel';
import { analyzeEmail } from './engine';
import type { AnalysisResult } from './types';

export default function App() {
  const [emailText, setEmailText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!emailText.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const analysis = await analyzeEmail(emailText);
      setResult(analysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f13',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar — desktop only decorative strip */}
      <div
        style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, #7c3aed, #6366f1, transparent)',
          opacity: 0.6,
          flexShrink: 0,
        }}
      />

      {/* Main layout */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* On large screens: side-by-side. On small: stacked */}
        <div
          className="lg:flex lg:h-screen lg:overflow-hidden"
          style={{ flex: 1 }}
        >
          {/* Left panel — input */}
          <div
            className="lg:w-[44%] lg:h-full lg:overflow-y-auto"
            style={{
              borderRight: '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
            }}
          >
            {/* Subtle gradient bg */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 300,
                background: 'radial-gradient(ellipse at top left, rgba(124,58,237,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <EmailInput
              value={emailText}
              onChange={v => { setEmailText(v); if (result) setResult(null); }}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Right panel — results */}
          <div
            className="lg:flex-1 lg:h-full lg:overflow-y-auto"
            style={{ position: 'relative' }}
          >
            {/* Subtle gradient bg for results panel */}
            {result && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 300,
                  height: 300,
                  background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.05) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
            )}
            <AnalysisPanel result={result} isAnalyzing={isAnalyzing} />
          </div>
        </div>
      </div>
    </div>
  );
}
