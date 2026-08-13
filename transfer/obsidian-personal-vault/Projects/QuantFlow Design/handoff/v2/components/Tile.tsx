/**
 * Tile — operational node
 *
 * TARGET: src/windows/shell/src/ (tile chrome + header DOM)
 *         shell.css .canvas-tile, .tile-title-bar, .tile-port, .tile-*-badge
 *
 * ANATOMY (left→right in header):
 *   [TypeGlyph chip] · parent/path · name · [ROLE badge] · @route · [herdr:id] · [STATUS] · ×
 *
 * V1 details to KEEP (they already feel like QuantFlow):
 *   - 2px inset-left box-shadow = the type rail (color = role)
 *   - Crosshair corner overshoots (::before/::after extend 9px past corners)
 *   - N/E/S/W port nodes
 *
 * DATA ATTRIBUTES (set by canvas renderer / spawn pipeline):
 *   data-tile-type  — term | generic | codex | agent | worker | tool | memory | graph
 *   data-tile-state — idle | running | selected | queued | error | experimental
 *
 * DESIGN AUTHORITY: DESIGN.md §6 (Tiles), tokens/shell-tokens.css
 */

import React from 'react';

// ── Type glyph + label map ────────────────────────────────────
export const TILE_TYPES = {
  term:    { rail: 'var(--rail-term)',    glyph: '>_',  label: 'TERMINAL',    runtime: 'node-pty' },
  generic: { rail: 'var(--rail-generic)', glyph: '>_',  label: 'GENERIC CLI', runtime: 'windows-pty' },
  codex:   { rail: 'var(--rail-codex)',   glyph: '</>', label: 'CODEX CLI',   runtime: 'herdr-wsl' },
  agent:   { rail: 'var(--rail-agent)',   glyph: '◆',   label: 'AGENT',       runtime: 'orchestrator' },
  worker:  { rail: 'var(--rail-worker)',  glyph: '⚙',   label: 'WORKER',      runtime: 'task-runner' },
  tool:    { rail: 'var(--rail-tool)',    glyph: '⌗',   label: 'TOOL',        runtime: 'MCP :9811' },
  memory:  { rail: 'var(--rail-memory)', glyph: '◧',   label: 'MEMORY',      runtime: 'Envoy · later' },
  graph:   { rail: 'var(--rail-graph)',   glyph: '⊹',   label: 'GRAPH',       runtime: 'graph-tile' },
} as const;

export type TileType  = keyof typeof TILE_TYPES;
export type TileState = 'idle' | 'running' | 'selected' | 'queued' | 'error' | 'experimental';

// ── Status badge label + tone ─────────────────────────────────
export const STATUS_TONE: Record<string, string> = {
  running: 'flow', active: 'flow', waiting: 'blue',
  queued: 'amber', blocked: 'amber', error: 'coral', exited: 'muted', idle: 'muted',
};

// ── Tile component stub ───────────────────────────────────────
interface TileProps {
  /** Node type — drives rail color, glyph, ROLE badge */
  type: TileType;
  /** Display title: optional parent path + node name */
  title: { parent?: string; name: string };
  /** @route handle shown in header */
  route?: string;
  /** herdr pane binding — id + operational status */
  herdr?: { id: string; status: 'idle' | 'working' | 'blocked' | 'done' };
  /** Operational state — drives border, rail, shadow, STATUS badge */
  status?: string;
  /** Canvas state override (selection, experimental) */
  state?: TileState;
  /** Marks tile as non-spawnable / in-progress template */
  experimental?: boolean;
  /** Position on canvas (world coords) */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  /** Show N/E/S/W port nodes */
  ports?: boolean;
  children?: React.ReactNode;
}

/**
 * Tile
 *
 * Render notes for the canvas implementation:
 *
 * 1. Set data-tile-type and data-tile-state on the root element so shell-tokens.css
 *    applies the correct rail color, border, and shadow automatically.
 *
 * 2. The 2px type rail is implemented as:
 *      box-shadow: inset 2px 0 0 var(--rail), <shadow>;
 *    Do NOT use border-left — it shifts layout.
 *
 * 3. Crosshair corners: ::before spans left-right overshot, ::after spans top-bottom.
 *    Both use the same border color as the tile border.
 *    CSS:
 *      .canvas-tile::before {
 *        content: ''; position: absolute;
 *        top: -1px; bottom: -1px; left: -9px; right: -9px;
 *        border-top: 1px solid <border-color>;
 *        border-bottom: 1px solid <border-color>;
 *        pointer-events: none;
 *      }
 *
 * 4. Port nodes (N/E/S/W):
 *    - Width/height: 12px, border-radius: 50%, border: 2px solid var(--bg)
 *    - Idle: muted fill, no glow
 *    - Lit (running/selected): var(--flow) fill + glow
 *    - Position: absolute, centered on each edge
 *
 * 5. Header anatomy from left to right:
 *    <TypeGlyph> · <parent/> <name> · <ROLE pill> · @route · @herdr-badge · <STATUS pill> · ×
 *    All in a flex row; name/route truncate with text-overflow: ellipsis.
 *
 * 6. The tile body background is var(--ink) — deepest wells.
 *    PTY (xterm.js) mounts here.
 */
export const Tile: React.FC<TileProps> = ({
  type, title, route, herdr, status = 'running', state, experimental = false,
  x, y, width = 360, height = 240, ports = true, children,
}) => {
  // Set data-tile-type and data-tile-state — CSS does the rest via shell-tokens.css
  const tileState: TileState = state || (
    experimental ? 'experimental'
    : status === 'error' || status === 'exited' ? 'error'
    : status === 'queued' || status === 'blocked' ? 'queued'
    : status === 'running' || status === 'active' ? 'running'
    : 'idle'
  );

  return (
    <div
      className="canvas-tile"
      data-tile-type={type}
      data-tile-state={tileState}
      style={{ position: x !== undefined ? 'absolute' : 'relative', left: x, top: y, width, height }}
    >
      {/* Header */}
      <div className="tile-title-bar">
        {/* TypeGlyph chip — see DESIGN.md §6 for glyph map */}
        <span className="tile-type-glyph" data-tile-type={type}>
          {TILE_TYPES[type]?.glyph}
        </span>
        {/* Name */}
        <span className="tile-name">
          {title.parent && <span className="tile-parent">{title.parent}</span>}
          {title.name}
        </span>
        {/* Badges */}
        <span className={`tile-role-badge tile-role-badge--${type}`}>{TILE_TYPES[type]?.label}</span>
        {route && <span className="tile-route">{route}</span>}
        <span className="tile-spacer" />
        {herdr && <span className="tile-herdr-badge" data-herdr-status={herdr.status}>herdr:{herdr.id}</span>}
        {experimental
          ? <span className="tile-status-badge tile-status-badge--experimental">EXPERIMENTAL</span>
          : <span className={`tile-status-badge tile-status-badge--${STATUS_TONE[status] || 'muted'}`}>{status.toUpperCase()}</span>
        }
        <button className="tile-close">×</button>
      </div>
      {/* Body — xterm.js mounts here for PTY tiles */}
      <div className="tile-body">{children}</div>
      {/* Port nodes */}
      {ports && (['N', 'E', 'S', 'W'] as const).map(side => (
        <span key={side} className={`tile-port tile-port--${side}`} data-tile-state={tileState} />
      ))}
    </div>
  );
};

export default Tile;
