/**
 * Registry — left system index panel
 *
 * TARGET: src/windows/nav/src/App.tsx + styles/App.css
 *
 * The registry is the agent's system index. It groups tiles by class,
 * shows live/err/tiles counts, and selecting a row selects + centers the tile on canvas.
 *
 * DESIGN AUTHORITY: DESIGN.md §1 (surfaces), PRODUCT.md §3.2
 *
 * ── Panel structure ───────────────────────────────────────────
 *
 *   <RegistryPanel>
 *     <RegistryNavToolbar />         — Files | Tiles tab switcher + settings icon
 *     <RegistryHeader />             — workspace name + LIVE/ERR/TILES stat boxes
 *     <FilterInput />                — filters name · @route · host · status
 *     <RegGroup label="Codex CLI agents" count={1}>
 *       <RegRow ... />
 *     </RegGroup>
 *     ... groups for each class
 *     <RegGroup label="Memory" count={0}>  ← forward-looking, disabled
 *       <RegRow type="memory" ... />
 *     </RegGroup>
 *   </RegistryPanel>
 *
 * ── Agent class groups (in order) ────────────────────────────
 *
 *   1. Codex CLI agents
 *   2. Generic CLI agents
 *   3. Agents (Hermes / orchestrator)
 *   4. Workers
 *   5. Terminal sessions
 *   6. Graph tiles
 *   7. Memory (forward-looking, disabled until Gate 3)
 *
 * ── RegRow anatomy ───────────────────────────────────────────
 *
 *   [TypeGlyph 20px] · [name (sans) + @route (mono)] · [status chip]
 *
 *   Grid: 20px auto 1fr auto   (glyph · gap · text · chip)
 *   Selected row:
 *     - 2px left border in role color
 *     - background: color-mix(in srgb, <role-hue> 10%, transparent)
 *
 * ── Status chips ─────────────────────────────────────────────
 *
 *   running  → "● LIVE"   color: var(--flow)   (with glow dot)
 *   error    → "● ERR"    color: var(--coral)
 *   queued   → "QUEUE"    color: var(--amber)
 *   waiting  → "WAITING"  color: var(--blue)
 *   idle     → "IDLE"     color: var(--muted)
 *
 * ── LIVE/ERR/TILES stat boxes ────────────────────────────────
 *
 *   Three small boxes in the registry header.
 *   LIVE: var(--flow)                 — always green
 *   ERR:  var(--coral) if err > 0, else var(--muted)
 *   TILES: var(--fg)
 *   Layout: min-width 38px, padding 4px 6px, border-radius 6px
 *
 * ── Filter ───────────────────────────────────────────────────
 *
 *   Filters are applied client-side across: name, @route, host, status string.
 *   Group headers remain visible during filtering (orientation anchor).
 *   Empty filter result: show "No tiles match" inside the list area.
 *
 * ── Zero state (empty canvas) ────────────────────────────────
 *
 *   When tile count === 0:
 *     - Hide all groups
 *     - Show centered: QFMark (40px, opacity 0.5) + "No tiles yet" + Ctrl+K hint
 */

import React from 'react';
import type { TileType } from './Tile';

export type TileStatus = 'running' | 'error' | 'queued' | 'waiting' | 'idle';

export interface RegRowData {
  id: string;
  type: TileType;
  name: string;
  route: string;
  status: TileStatus;
  selected?: boolean;
  /** Callback when row is clicked — should select + center tile on canvas */
  onSelect?: (id: string) => void;
}

export interface RegistryHeaderProps {
  workspace: string;
  live: number;
  err: number;
  tiles: number;
}

/**
 * RegistryHeader
 *
 * CSS class targets (add to styles/App.css):
 *   .registry-header           — flex row, align items flex-end
 *   .registry-header__name     — font: var(--font-display), 15px, weight 600
 *   .registry-stats            — flex row, gap 4px
 *   .registry-stat             — min-width 38px, padding 4/6px, border-radius 6px
 *   .registry-stat__value      — font: var(--font-mono), 13px
 *   .registry-stat__label      — font: var(--font-mono), 8.5px, uppercase, letter-spacing 0.06em
 */
export interface RegistryProps {
  workspace: string;
  tiles: RegRowData[];
  selectedId?: string;
  filterValue?: string;
  onFilterChange?: (v: string) => void;
  onSelectTile?: (id: string) => void;
}

// Groups — order matters (see group order above)
export const REGISTRY_GROUPS: { type: TileType; label: string }[] = [
  { type: 'codex',   label: 'Codex CLI agents' },
  { type: 'generic', label: 'Generic CLI agents' },
  { type: 'agent',   label: 'Agents' },
  { type: 'worker',  label: 'Workers' },
  { type: 'term',    label: 'Terminal sessions' },
  { type: 'graph',   label: 'Graph tiles' },
  { type: 'tool',    label: 'Tools' },
  { type: 'memory',  label: 'Memory' }, // forward-looking
];
