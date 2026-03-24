import { useState } from 'react';

interface JsonViewerProps {
  data: object;
  title?: string;
}

type Token = { type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'other'; value: string };

function tokenize(json: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < json.length) {
    // String
    if (json[i] === '"') {
      let j = i + 1;
      while (j < json.length && !(json[j] === '"' && json[j - 1] !== '\\')) j++;
      const raw = json.slice(i, j + 1);
      // Check if it's a key (followed by :)
      let k = j + 1;
      while (k < json.length && (json[k] === ' ' || json[k] === '\t')) k++;
      const isKey = json[k] === ':';
      tokens.push({ type: isKey ? 'key' : 'string', value: raw });
      i = j + 1;
      continue;
    }

    // Number
    const numMatch = json.slice(i).match(/^-?\d+\.?\d*/);
    if (numMatch) {
      tokens.push({ type: 'number', value: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }

    // Boolean / null
    if (json.slice(i, i + 4) === 'true') {
      tokens.push({ type: 'boolean', value: 'true' });
      i += 4;
      continue;
    }
    if (json.slice(i, i + 5) === 'false') {
      tokens.push({ type: 'boolean', value: 'false' });
      i += 5;
      continue;
    }
    if (json.slice(i, i + 4) === 'null') {
      tokens.push({ type: 'null', value: 'null' });
      i += 4;
      continue;
    }

    tokens.push({ type: 'other', value: json[i] });
    i++;
  }

  return tokens;
}

const tokenColors: Record<Token['type'], string> = {
  key: '#a78bfa',      // violet
  string: '#6ee7b7',   // emerald
  number: '#fbbf24',   // amber
  boolean: '#60a5fa',  // blue
  null: '#f87171',     // red
  other: '#94a3b8',    // zinc
};

export function JsonViewer({ data, title }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);
  const tokens = tokenize(jsonString);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
          {title && (
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-2">
              {title}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="text-xs font-medium px-3 py-1 rounded-lg transition-all duration-150"
          style={{
            color: copied ? '#10b981' : '#94a3b8',
            background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
          }}
        >
          {copied ? '✓ Copied' : 'Copy JSON'}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <pre
          className="text-xs leading-relaxed p-4 font-mono"
          style={{ tabSize: 2 }}
        >
          {tokens.map((token, i) => (
            <span key={i} style={{ color: tokenColors[token.type] }}>
              {token.value}
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}
