# WO-g6 FOUNDER-REVIEW

Plain language: The canvas should now tell you what you can grab, when a cable really landed (as *declared*, not broken), and that the Kernel is busy — and Tidy should bring everything back on screen.

**Package note:** Rebuild used `bun install --force` then `bun run package:unsigned` in `collab-electron/`. Artifacts: `collab-electron/dist/win-unpacked/QuantFlow.exe` and `collab-electron/dist/QuantFlow Setup 0.8.4.exe`. Launch the **new** install / unpacked exe, not a stale L1 asar.

## D2 answer (established before code)

**Cables already tracked tiles in source.** Drag → `repositionAllTiles` → `cableOverlay.redraw()` recomputes paths from live tile geometry via `cable-math` (no stored cable coordinates). What felt stuck was likely Kernel `refresh()` on every drag frame; that re-fetch was removed so redraw stays geometry-only during move/resize/Tidy.

---

## Click script (exact)

### D1 · Cable legibility — declared ≠ failed

1. Create two tiles (New tile ×2).
2. Drag from a port on tile A to a port on tile B until the curve is ice-colored.
3. Release on a valid port.
4. **Correct:** toast reads `Declared · no runtime honours this yet` (ok tone, not coral). Curve does a short settle animation, stays **dashed**, nodes hollow. Click the cable: label/inspector says `declared · no runtime honours this yet`.
5. Drag A→B again the same way (duplicate).
6. **Correct:** toast is **reject** tone (alert/coral) with a Kernel error about duplicate — not the same as the declared success toast.
7. Mid-drag over the same tile: preview is muted dashed; invalid target shows alert ring — distinct from a finished declared cable.

**Do not expect solid cables.** Solid would mean honoured (ADR-0003).

### D2 · Cables track tiles

1. With a declared cable between A and B, drag tile A slowly across the canvas.
2. **Correct:** the curve stays attached to both ports the whole time (no lagging rubber-band left behind).
3. Resize a tile from an edge: curve follows.
4. Click **Tidy**: after layout + viewport motion, cables still meet ports.

### D3 · Tile affordances

1. At rest (no hover): spine grip ticks are visible; cursor over spine is `grab`.
2. Drag: cursor becomes `grabbing`.
3. Hover a tile edge/corner: resize cursor; hit area is ~10px (forgiving).
4. Ports are visible without hover; cursor `crosshair`; hover/focus-visible ice ring.

### D4 · Kernel ledger moves

1. Look at the Dock section **kernel activity** (above the session ledger).
2. Empty: `idle · waiting for Kernel events`.
3. Draw a cable (or spawn/close a session).
4. **Correct:** a new row appears at the top within a moment: event type, object type, relative time (e.g. `connection.created` · `connection` · `just now`). Closing a cabled tile should also show `connection.deleted`.

### D5 · Tidy reframes

1. Pan/zoom so tiles are partly off-screen.
2. Click **Tidy**.
3. **Correct:** tiles rearrange, then the viewport **animates** (not a hard cut) so every tile is visible with margin. With zero tiles, toast `Nothing to tidy` — no error.

---

## Builder verification status (mandatory)

| Deliverable | Verified how |
| --- | --- |
| D1 | **Package smoke:** `QuantFlow.exe` from `dist/win-unpacked` launched and stayed running (then stopped). Interactive create/reject toast path: **founder click** per script below. Unit coverage: yes. |
| D2 | **Tested** (geometry gate). Tracking already present in source; drag-frame Kernel refresh removed. **Founder:** drag a cabled tile in the new package. |
| D3 | **Tested** (CSS). **Founder:** confirm grab/resize/port hit targets in the new package. |
| D4 | **Tested** (projection gate + IPC). **Founder:** watch **kernel activity** while drawing a cable. |
| D5 | **Tested** (`fitViewportToTiles`). **Founder:** Tidy with tiles partly off-screen. |

Gates green on builder machine: `one-skin`, `no-canvas-domain-writes`, `rung-ladder` (`active=R9`), `glacier-feel` (falsified red then restored green).
