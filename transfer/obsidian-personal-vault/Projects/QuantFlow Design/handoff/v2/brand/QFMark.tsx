/**
 * QFMark — QuantFlow brand insignia
 *
 * TARGET: packages/components/src/brand/QFMark.tsx
 *
 * Skinny ivory Q (thin ring + tail at 4:30), clean ivory serif-styled F inside,
 * neon Live Green signal dot on the ring. The F gives it product identity;
 * the dot is the live signal.
 *
 *   pulse=true  → dot spins around the ring (LOADING SYMBOL)
 *   pulse=false → static dot at ~1:30 o'clock (canvas mark, titlebar, etc.)
 *
 * Square viewBox 0 0 120 120. For a square app icon, pad with #0a0d12 fill before export.
 *
 * Props:
 *   size        — width = height (square)
 *   color       — ring + F color (default: ivory #f2f0ec)
 *   accent      — signal dot color (default: Live Green #b7ff00)
 *   glow        — adds drop-shadow to the F + dot (hero/loading)
 *   opacity     — for watermark / low-opacity uses
 *   pulse       — true: dot spins (loading); false: static (canvas mark + chrome)
 *   mono        — single-color variant (ignored — already a flat ivory mark)
 *   strokeScale — scales all stroke widths
 *
 * Usage:
 *   import { QFMark } from '@quantflow/components/brand';
 *
 *   <QFMark size={22} />                          // titlebar (compact)
 *   <QFMark size={120} glow />                    // hero
 *   <QFMark size={48} pulse glow />               // loading spinner
 *   <QFMark size={280} pulse opacity={0.5} />     // canvas background watermark
 *
 * Required CSS keyframes:
 *   @keyframes qfSpin { to { transform: rotate(360deg); } }
 *
 * DESIGN AUTHORITY: DESIGN.md §4 (brand mark)
 */

import React from 'react';

const IVORY      = '#f2f0ec';
const LIVE_GREEN = '#b7ff00';

interface QFMarkProps {
  size?: number;
  color?: string;
  accent?: string;
  glow?: boolean;
  opacity?: number;
  pulse?: boolean;
  mono?: boolean;
  strokeScale?: number;
}

export const QFMark: React.FC<QFMarkProps> = ({
  size = 120,
  color = IVORY,
  accent = LIVE_GREEN,
  glow = false,
  opacity = 1,
  pulse = false,
  // mono kept for API compat; ring + F are already single-color ivory
  mono = false,
  strokeScale = 1,
}) => {
  const ringR = 38;
  const sw    = 2.4 * strokeScale;   // skinny ring stroke
  const fSw   = 3.6 * strokeScale;   // F stroke (slightly bolder than ring)
  const serif = 5.5 * strokeScale;   // serif arm length
  const dotR  = 4.2 * strokeScale;
  const ink   = color;

  // Q tail at 4:30 — short diagonal extending outside the ring
  const tailX1 = 84, tailY1 = 82, tailX2 = 94, tailY2 = 93;
  // Static dot at ~1:30 o'clock on ring (≈45° clockwise from top)
  const dotCx = 87, dotCy = 33;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{ display: 'block', opacity, overflow: 'visible' }}
    >
      {/* Q ring — skinny ivory */}
      <circle cx="60" cy="60" r={ringR} fill="none" stroke={ink} strokeWidth={sw} />
      {/* Q tail */}
      <line x1={tailX1} y1={tailY1} x2={tailX2} y2={tailY2}
        stroke={ink} strokeWidth={sw} strokeLinecap="round" />
      {/* F inside — serif-styled */}
      <g stroke={ink} strokeWidth={fSw} strokeLinecap="square">
        <line x1="53" y1="40" x2="53" y2="82" />               {/* spine */}
        <line x1="53" y1="40" x2="74" y2="40" />               {/* top arm */}
        <line x1="53" y1="60" x2="68" y2="60" />               {/* middle arm */}
        {/* serif at top of spine */}
        <line x1={53 - serif * 0.55} y1="40" x2={53 + serif * 0.4} y2="40"
          strokeWidth={fSw * 0.9} />
        {/* base foot at bottom of spine */}
        <line x1={53 - serif * 0.7} y1="82" x2={53 + serif * 0.7} y2="82"
          strokeWidth={fSw * 0.95} />
      </g>
      {/* Signal dot — static at 1:30 or spinning around the ring */}
      {pulse ? (
        <g style={{ transformOrigin: '60px 60px', animation: 'qfSpin 2.6s linear infinite' }}>
          <circle cx="60" cy={60 - ringR} r={dotR} fill={accent}
            style={{ filter: `drop-shadow(0 0 ${glow ? 8 : 5}px ${accent}) drop-shadow(0 0 2px ${accent})` }} />
        </g>
      ) : (
        <circle cx={dotCx} cy={dotCy} r={dotR} fill={accent}
          style={{ filter: `drop-shadow(0 0 ${glow ? 7 : 4}px ${accent}) drop-shadow(0 0 2px ${accent})` }} />
      )}
    </svg>
  );
};

export default QFMark;
