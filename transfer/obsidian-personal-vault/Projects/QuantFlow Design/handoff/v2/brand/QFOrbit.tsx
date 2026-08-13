/**
 * QFOrbit — DEPRECATED alias for QFMark with pulse=true.
 *
 * TARGET: packages/components/src/brand/QFOrbit.tsx (optional — pure convenience)
 *
 * QFOrbit was a separate orbit/ring symbol in early V2 drafts. The final brand
 * insignia (QFMark) IS the dial-style mark with the spinning signal dot, so
 * QFOrbit collapsed into a simple alias. Prefer importing QFMark directly.
 *
 * Usage:
 *   <QFOrbit size={48} spin glow />       // loading spinner (equivalent to <QFMark pulse glow />)
 *   <QFOrbit size={280} opacity={0.4} />  // soft canvas mark (no animation, faded)
 *
 * DESIGN AUTHORITY: DESIGN.md §4
 */

import React from 'react';
import { QFMark } from './QFMark';

interface QFOrbitProps {
  size?: number;
  color?: string;
  accent?: string;
  spin?: boolean;
  opacity?: number;
  glow?: boolean;
  strokeScale?: number;
}

export const QFOrbit: React.FC<QFOrbitProps> = ({
  size = 64,
  color,
  accent,
  spin = false,
  opacity = 1,
  glow = false,
  strokeScale = 1,
}) => (
  <QFMark
    size={size}
    color={color}
    accent={accent}
    pulse={spin}
    opacity={opacity}
    glow={glow}
    strokeScale={strokeScale}
  />
);

export default QFOrbit;
