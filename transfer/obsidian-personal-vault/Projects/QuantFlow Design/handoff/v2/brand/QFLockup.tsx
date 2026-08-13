/**
 * QFLockup — QFMark + QFWordmark combined
 *
 * TARGET: packages/components/src/brand/QFLockup.tsx
 *
 * Props:
 *   markSize     — size of the QFMark (wordmark scales from this)
 *   glow         — pass-through to QFMark
 *   descriptor   — product identity line, e.g. "Flow Ledger" — mono, muted, below wordmark
 *   tagline      — version / context line — smaller, further muted
 *   orientation  — 'horizontal' (default) | 'vertical'
 *
 * Usage:
 *   <QFLockup markSize={96} descriptor="Flow Ledger" tagline="Live topology console" glow />
 *   <QFLockup markSize={48} orientation="vertical" descriptor="Flow Ledger" tagline="v0.9.0" />
 *
 * DESIGN AUTHORITY: DESIGN.md §4
 */

import React from 'react';
import { QFMark } from './QFMark';
import { QFWordmark } from './QFWordmark';

const FONT_MONO = "'IBM Plex Mono', 'Geist Mono', ui-monospace, Consolas, monospace";
const MUTED  = '#6b7686';
const MUTED2 = '#4a5466';

interface QFLockupProps {
  markSize?: number;
  glow?: boolean;
  descriptor?: string;
  tagline?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const QFLockup: React.FC<QFLockupProps> = ({
  markSize = 64,
  glow = true,
  descriptor,
  tagline,
  orientation = 'horizontal',
}) => {
  const horiz = orientation === 'horizontal';
  return (
    <div style={{
      display: 'flex',
      flexDirection: horiz ? 'row' : 'column',
      alignItems: 'center',
      gap: horiz ? 22 : 18,
    }}>
      <QFMark size={markSize} glow={glow} />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: horiz ? 'flex-start' : 'center',
        gap: 8,
      }}>
        <QFWordmark size={markSize * 0.32} align={horiz ? 'flex-start' : 'center'} />
        {descriptor && (
          <div style={{
            fontFamily: FONT_MONO,
            fontSize: markSize * 0.155,
            color: MUTED,
            textTransform: 'uppercase',
            letterSpacing: '0.24em',
            paddingLeft: '0.24em',
            marginTop: -2,
          }}>
            {descriptor}
          </div>
        )}
        {tagline && (
          <div style={{
            fontFamily: FONT_MONO,
            fontSize: markSize * 0.13,
            color: MUTED2,
            textTransform: 'uppercase',
            letterSpacing: '0.28em',
            paddingLeft: '0.28em',
          }}>
            {tagline}
          </div>
        )}
      </div>
    </div>
  );
};

export default QFLockup;
