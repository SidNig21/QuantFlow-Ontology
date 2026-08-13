/**
 * TileInspector — selected tile detail panel
 *
 * TARGET: src/windows/shell/ (selection panel, shown when a tile is selected)
 *         Replaces/extends any existing tile selection panel.
 *
 * DESIGN AUTHORITY: DESIGN.md §1 (inspectors), PRODUCT.md §3.5
 *
 * ── When shown ───────────────────────────────────────────────
 *
 *   Appears as a floating panel (right side or bottom) when a tile is selected.
 *   Dismissed by: clicking outside, pressing Escape, or clicking the × in the panel.
 *
 * ── Panel structure ──────────────────────────────────────────
 *
 *   HEADER
 *     [TypeGlyph]  Node name
 *     [left: 2px role-color rail via box-shadow]
 *
 *   CHIPS ROW
 *     @route-handle  ·  [STATUS pill]  ·  [herdr:id badge]
 *
 *   SECTION: Node
 *     Role        codex-cli
 *     Runtime     herdr-wsl
 *     herdr pane  be88-2
 *     Command     codex
 *     Startup     <startup text, truncated>
 *     Uptime      14m 02s
 *
 *   SECTION: Routes · N in · M out
 *     [dir]  [connected node name]  [kind hue]
 *     in     ◆ Hermes               context (blue)
 *     in     >_ Generic CLI         pipe (green)
 *     out    ⚙ Replay worker        trigger (amber)
 *
 *   SECTION: Correlation
 *     connection_id    conn_4a2f9c
 *     correlation_id   8f1c-77d2-…
 *
 *   ACTIONS (two rows of flex buttons)
 *     [Focus]  [Send text]
 *     [Reconnect]  [Retire]
 *
 * ── Data sources ─────────────────────────────────────────────
 *
 *   Most fields come from the tile's data model (set at spawn time):
 *     - type, name, route, herdrPaneId, herdrAgentName, command, startupText
 *
 *   Live fields come from herdr (polled or via events.subscribe, Gate 3):
 *     - status, uptime, herdr.status
 *
 *   Routes come from the canvas cable model:
 *     - cables where .sourceId === tile.id OR .targetId === tile.id
 *
 *   Correlation IDs come from the herdr relay model:
 *     - connection_id, correlation_id on the cable object
 *
 * ── Implementation notes ─────────────────────────────────────
 *
 *   The panel floats over the canvas — it does NOT shift layout.
 *   Use position: fixed or position: absolute (z-index above tiles).
 *   Width: ~360px. backdrop-filter: blur(10px) optional.
 *   Background: color-mix(in srgb, var(--tile-bg) 92%, transparent)
 *   Border: 1px solid var(--border-hi), border-radius: 12px
 *   Box-shadow: var(--sh-float)
 */

export interface TileInspectorData {
  id: string;
  type: import('./Tile').TileType;
  name: string;
  route: string;
  status: string;
  herdr?: { id: string; status: string };
  command?: string;
  startupText?: string;
  uptime?: string;
  connectionId?: string;
  correlationId?: string;
  routes?: Array<{
    dir: 'in' | 'out';
    connectedName: string;
    connectedType: import('./Tile').TileType;
    kind: import('./Cable').CableKind;
  }>;
}

export interface TileInspectorProps {
  tile: TileInspectorData;
  onClose: () => void;
  onFocus?: (id: string) => void;
  onSendText?: (id: string, text: string) => void;
  onRetire?: (id: string) => void;
  onReconnect?: (id: string) => void;
}
