/**
 * CableInspector — selected cable detail panel
 *
 * TARGET: src/windows/shell/src/cable-inspector.js
 *         Extends / replaces the existing cable inspector.
 *
 * DESIGN AUTHORITY: DESIGN.md §5 (cables), PRODUCT.md §3.5
 *
 * ── When shown ───────────────────────────────────────────────
 *
 *   Appears when a cable is clicked on the canvas.
 *   Dismissed by: clicking elsewhere, Escape, or ×.
 *
 * ── Panel structure ──────────────────────────────────────────
 *
 *   HEADER
 *     [connect icon in kind hue]  Route
 *     [left: 2px kind-hue rail]
 *
 *   CHIPS ROW
 *     [KIND pill]  [STATE chip]  "1 of N" count
 *
 *   ENDPOINT ROW (card background)
 *     [TypeGlyph] Source tile name   →→→   [TypeGlyph] Target tile name
 *     from · port E                        to · port W
 *
 *   SECTION: Relay
 *     state      sent (or: idle / sending / queued / error)
 *     kind       context
 *     latency    42 ms
 *
 *   SECTION: Identity
 *     connection_id  conn_4a2f9c
 *     correlation_id 8f1c-77d2-…
 *
 *   ACTIONS
 *     [Reroute]  [Delete]
 *
 * ── Data sources ─────────────────────────────────────────────
 *
 *   From the cable data model (set at connect time):
 *     - sourceId, targetId, sourceSide, targetSide, kind
 *
 *   Live relay state from herdr (via string-relay or cable-renderer events):
 *     - state: idle | sending | sent | queued | error
 *     - connection_id, correlation_id, latency
 *
 *   Bundle count: cables sharing the same source+target pair are bundled.
 *   The inspector shows "1 of N" where N = bundle count.
 *
 * ── Reroute action ───────────────────────────────────────────
 *
 *   "Reroute" puts the canvas into connect mode with this cable's source pre-selected,
 *   allowing the user to drag to a new target port. The old cable is deleted on success.
 *
 * ── Delete action ────────────────────────────────────────────
 *
 *   Deletes the cable from the canvas model and the herdr relay.
 *   Requires confirmation if the cable is in state "sending".
 */

export interface CableInspectorData {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: import('./Tile').TileType;
  sourceSide: 'N' | 'E' | 'S' | 'W';
  targetId: string;
  targetName: string;
  targetType: import('./Tile').TileType;
  targetSide: 'N' | 'E' | 'S' | 'W';
  kind: import('./Cable').CableKind;
  state: import('./Cable').CableState;
  connectionId?: string;
  correlationId?: string;
  latencyMs?: number;
  bundleCount?: number;    // 1 = single cable
  bundleIndex?: number;    // 1-based index within bundle
}

export interface CableInspectorProps {
  cable: CableInspectorData;
  onClose: () => void;
  onReroute?: (id: string) => void;
  onDelete?: (id: string) => void;
}
