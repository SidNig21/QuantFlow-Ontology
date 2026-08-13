/**
 * Cable renderer — SVG route drawing
 *
 * TARGET: src/windows/shell/src/cable-renderer.js
 *         (extends existing glow→main→flow→badge layering)
 *
 * V2 additions to the existing renderer:
 *   1. `queued` class — dense amber pulse (backpressure)
 *   2. `error` class — broken coral signal + warning icon
 *   3. `kind` attribute — pipe | context | trigger (drives hue, already mapped in CSS)
 *   4. Bundle width formula: 3 + Math.min(count, 5) (already present — verify)
 *
 * DESIGN AUTHORITY: DESIGN.md §5 (Cables)
 *
 * ── Bezier geometry ──────────────────────────────────────────
 *
 * The existing bezierPath() + portPosition() in cable-math.js is correct.
 * Control-point distance: Math.max(54, dist * 0.42)
 * Control points are offset in the port's exit direction (E→right, W→left, N→up, S→down).
 *
 * ── Layer order (SVG <g> per cable) ──────────────────────────
 *
 *   1. .cable-glow   — blurred wide stroke, low opacity (signals glow, not decoration)
 *   2. .cable-main   — the solid route stroke
 *   3. .cable-flow   — animated dash overlay (only on live/selected/queued states)
 *   4. .cable-badge  — bundle count badge (only when count > 1)
 *   5. .cable-error-icon — broken signal icon (only on error state)
 *
 * ── State → CSS class mapping ────────────────────────────────
 *
 *   idle      → (no extra class)       — thin, quiet, no glow
 *   live      → .cable-live            — glow + animated flow pulse (cableFlow 1.6s)
 *   selected  → .cable-selected        — brighter + endpoint halos (already in cable-renderer.js)
 *   sending   → .cable-sending         — already exists
 *   sent      → .cable-sent            — already exists
 *   queued    → .cable-queued          — NEW: dense amber pulse (0.85s)
 *   error     → .cable-error           — NEW: coral + broken signal icon (was: .cable-failed)
 *   failed    → .cable-error           — rename/alias .cable-failed → .cable-error
 *
 * ── Kind → CSS class + stroke color ─────────────────────────
 *
 *   pipe      → .cable-kind--pipe      → stroke: var(--cable-pipe)    = var(--flow)
 *   context   → .cable-kind--context   → stroke: var(--cable-context) = var(--blue)
 *   trigger   → .cable-kind--trigger   → stroke: var(--cable-trigger) = var(--amber)
 *
 *   Set className on the <g> root of each cable:
 *     `cable-root cable-kind--${kind} ${stateClass}`
 *
 * ── Bundle badge ─────────────────────────────────────────────
 *
 *   When count > 1:
 *     stroke width: 3 + Math.min(count, 5)
 *     badge: <circle r="11" fill="#0d1218" stroke="kindHue" strokeWidth="1" />
 *             <text fill="var(--flow-bright)" fontFamily="monospace" fontSize="11">N</text>
 *   Positioned at the midpoint of the bezier path.
 *
 * ── Port endpoints (selected state) ─────────────────────────
 *
 *   When a cable is selected, draw endpoint markers at both ports:
 *     outer: <circle r="7" fill="none" stroke="var(--flow-bright)" strokeWidth="1.3" opacity="0.5" />
 *     inner: <circle r="3.4" fill="var(--flow-bright)" />
 *
 * ── Error icon ───────────────────────────────────────────────
 *
 *   Centered on the midpoint of the bezier:
 *     <circle r="9" fill="var(--ink)" stroke="var(--coral)" strokeWidth="1.2" />
 *     <path d="M0 -4.2 L0 1.2 M0 3.6 L0 4" stroke="var(--coral)" strokeWidth="1.6" strokeLinecap="round" />
 *
 * ── CSS animations required ──────────────────────────────────
 *
 *   @keyframes cableFlow      { to { stroke-dashoffset: -32; } }   (1.6s, live)
 *   @keyframes cableFlowDense { to { stroke-dashoffset: -28; } }   (0.85s, queued)
 *   @keyframes cablePulse     { ... }                               (0.65s, on-send — already exists)
 *
 * ── TypeScript interface (for typed wrapper if needed) ───────
 */

export type CableState = 'idle' | 'live' | 'selected' | 'sending' | 'sent' | 'queued' | 'error';
export type CableKind  = 'pipe' | 'context' | 'trigger';

export interface CablePort {
  /** World-coordinate X */
  x: number;
  /** World-coordinate Y */
  y: number;
  /** Exit direction of the port */
  side: 'N' | 'E' | 'S' | 'W';
}

export interface CableRenderOptions {
  a: CablePort;
  b: CablePort;
  state?: CableState;
  kind?: CableKind;
  /** Number of bundled routes; 1 = single, >1 = bundle */
  count?: number;
  /** Unique cable ID for key prop */
  id: string;
}

/**
 * getCableClasses — derive CSS class string for a cable root <g>
 *
 * Usage in cable-renderer.js:
 *   const g = document.createElementNS(SVG_NS, 'g');
 *   g.setAttribute('class', getCableClasses(state, kind));
 */
export function getCableClasses(state: CableState, kind: CableKind): string {
  const stateMap: Partial<Record<CableState, string>> = {
    live: 'cable-live',
    selected: 'cable-selected',
    sending: 'cable-sending',
    sent: 'cable-sent',
    queued: 'cable-queued',
    error: 'cable-error',
  };
  return ['cable-root', `cable-kind--${kind}`, stateMap[state] ?? ''].filter(Boolean).join(' ');
}

/**
 * getBundleWidth — stroke width for bundled cables
 */
export function getBundleWidth(count: number, baseWidth = 1.7): number {
  return count > 1 ? 3 + Math.min(count, 5) : baseWidth;
}
