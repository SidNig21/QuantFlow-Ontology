/**
 * Watchtower — system health view
 *
 * TARGET: src/windows/shell/ or new Electron window (post Gate 3)
 *         Data: diagnostics/health-runner.ts + probes.ts
 *
 * DESIGN AUTHORITY: DESIGN.md §1 (Watchtower), PRODUCT.md §3.7, RETIREMENT.md
 *
 * ── Scope note ───────────────────────────────────────────────
 *
 *   The Watchtower EVENT STREAM (live via herdr events.subscribe) is a Gate 3 feature.
 *   Until Gate 3, use the 2s polling loop from health-runner.ts.
 *   Do NOT remove the polling loop until events.subscribe is proven reliable.
 *   See RETIREMENT.md for the retirement register.
 *
 * ── Surface sections ─────────────────────────────────────────
 *
 *   1. HEALTH HEADER
 *      - Live green pulsing LED (breathing animation)
 *      - "Watchtower" in display font
 *      - Source note: "live via herdr events.subscribe · gate 3"
 *        (or: "polled every 2s" until Gate 3)
 *      - Status pills: [SOCKET OK] [MCP :9811]
 *
 *   2. STAT CARDS (horizontal row)
 *      Tiles · Agents live · Routes · Queued · Errors
 *      Each card: label (mono, muted, uppercase) + large number (display font, tone color)
 *      + optional sub-line (mono, muted)
 *
 *   3. PER-AGENT TABLE (left column, ~320px wide)
 *      Rows: [TypeGlyph] [agent name] [sparkline] [herdr badge]
 *      Sparkline: tiny SVG line chart of recent activity (7 data points)
 *      herdr badge: shows herdr operational status
 *
 *   4. EVENT STREAM (right column, fills remaining width)
 *      Column headers: timestamp · source · level · message
 *      Row colors:
 *        info  → var(--fg)
 *        warn  → var(--amber)
 *        error → var(--coral)
 *      Timestamp: var(--muted2) — de-emphasized
 *      Source: var(--muted) — de-emphasized
 *      Level: uppercase, tone color
 *      Message: var(--fg)
 *      Background: var(--ink) — deepest; reads like a log panel
 *
 * ── Data interfaces ───────────────────────────────────────────
 */

export interface HealthStats {
  tiles: number;
  agentsLive: number;
  routes: number;
  queued: number;
  errors: number;
  socketOk: boolean;
  mcpOk: boolean;
}

export interface AgentHealth {
  id: string;
  type: import('./Tile').TileType;
  name: string;
  herdrStatus: 'idle' | 'working' | 'blocked' | 'done';
  herdrId?: string;
  /** Recent activity values for sparkline (7 points) */
  activityHistory: number[];
}

export type EventLevel = 'info' | 'warn' | 'error';

export interface HealthEvent {
  timestamp: string;   // "HH:MM:SS"
  source: string;      // "@agent-id" or "diagnostics" or "herdr.socket"
  level: EventLevel;
  message: string;
}

export interface WatchtowerData {
  stats: HealthStats;
  agents: AgentHealth[];
  events: HealthEvent[];
}

/**
 * Data flow (current — 2s polling):
 *
 *   health-runner.ts polls health-checker.ts → produces HealthStats
 *   probes.ts produces AgentHealth[] from herdr pane states
 *   Event log populated from health-runner callbacks
 *
 * Data flow (Gate 3 — events.subscribe):
 *
 *   herdr.events.subscribe('tile.*', handler) → push to events[]
 *   herdr.events.subscribe('agent.*', handler) → update AgentHealth
 *   Polling loop RETIRED (see RETIREMENT.md)
 */
