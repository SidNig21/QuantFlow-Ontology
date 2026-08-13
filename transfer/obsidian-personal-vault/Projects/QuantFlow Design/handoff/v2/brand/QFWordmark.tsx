/**
 * QFWordmark — QUANTFLOW letterspaced + soft neon underline
 *
 * TARGET: packages/components/src/brand/QFWordmark.tsx
 *
 * Used for headers, full-title lockups, about, and the canvas empty-state label.
 * The underline is a soft Live Green glow stripe — never harsh, never thick.
 *
 * Props:
 *   size      — font-size in px (underline + gap scale from this)
 *   color     — text color (default: ivory)
 *   underline — show the neon underline (default: true)
 *   soft      — apply glow to the underline (default: true)
 *   align     — flex alignment: 'flex-start' | 'center' | 'flex-end'
 *
 * Usage:
 *   <QFWordmark size={32} />                              // full title with neon underline
 *   <QFWordmark size={12} underline={false} />            // titlebar (compact, no underline)
 *   <QFWordmark size={18} soft align="center" />          // canvas empty-state (centered, soft)
 *
 * Font requirement: Space Grotesk 600 must be loaded.
 *   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" />
 *
 * DESIGN AUTHORITY: DESIGN.md §4 (brand mark — Wordmark), §3 (type)
 */

import React from 'react';

const FONT_DISPLAY = "'Space Grotesk', 'Geist', system-ui, sans-serif";
const IVORY       = '#f2f0ec';
const LIVE_GREEN  = '#b7ff00';
const FLOW_GLOW   = 'oklch(0.78 0.16 145 / 0.18)';

interface QFWordmarkProps {
  size?: number;
  color?: string;
  underline?: boolean;
  soft?: boolean;
  align?: 'flex-start' | 'center' | 'flex-end';
}

export const QFWordmark: React.FC<QFWordmarkProps> = ({
  size = 28,
  color = IVORY,
  underline = true,
  soft = true,
  align = 'flex-start',
}) => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: align, gap: size * 0.34 }}>
    <div style={{
      fontFamily: FONT_DISPLAY,
      fontWeight: 600,
      color,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      paddingLeft: '0.28em',
    }}>
      QuantFlow
    </div>
    {underline && (
      <div style={{
        width: '100%',
        height: Math.max(2, size * 0.07),
        borderRadius: 2,
        background: LIVE_GREEN,
        boxShadow: soft
          ? `0 0 ${size * 0.55}px ${FLOW_GLOW}, 0 0 ${size * 0.2}px rgba(183,255,0,0.45)`
          : 'none',
        opacity: soft ? 0.9 : 1,
      }} />
    )}
  </div>
);

export default QFWordmark;
