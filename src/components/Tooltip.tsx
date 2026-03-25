import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

/**
 * Hover-on-desktop / tap-on-mobile tooltip.
 * Renders via a portal so it is never clipped by overflow:hidden containers.
 */
export function Tooltip({ text, children }: TooltipProps) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const open = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setCoords({
      x: Math.max(120, Math.min(window.innerWidth - 120, r.left + r.width / 2)),
      y: r.top,
    });
  }, []);

  const close = useCallback(() => setCoords(null), []);

  useEffect(() => {
    if (!coords) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
  }, [coords, close]);

  return (
    <>
      <span
        ref={ref}
        style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center' }}
        onMouseEnter={open}
        onMouseLeave={close}
        onClick={e => { e.stopPropagation(); coords ? close() : open(); }}
      >
        {children}
      </span>

      {coords && createPortal(
        <div
          role="tooltip"
          style={{
            position:  'fixed',
            left:      coords.x,
            top:       coords.y - 8,
            transform: 'translate(-50%, -100%)',
            zIndex:    9999,
            animation: 'tooltipIn 0.14s ease-out forwards',
            background:   '#17171f',
            border:       '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding:      '7px 11px',
            color:        'rgba(248,250,252,0.7)',
            fontSize:     11,
            fontWeight:   400,
            lineHeight:   1.55,
            maxWidth:     230,
            minWidth:     100,
            pointerEvents: 'none',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.65)',
            textAlign:    'center',
          }}
        >
          {text}
          {/* Arrow — border layer */}
          <span style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop:  '5px solid rgba(255,255,255,0.12)',
          }} />
          {/* Arrow — fill layer */}
          <span style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%) translateY(-1px)',
            borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
            borderTop:  '4px solid #17171f',
          }} />
        </div>,
        document.body,
      )}
    </>
  );
}
