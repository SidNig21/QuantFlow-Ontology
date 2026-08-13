# Non-goals

These are intentionally NOT in this pass. Pin to a future milestone.

## Not in this pass

### Cable semantics (the actual piping)

This handoff covers the **visual** cable system: bezier rendering, ports, drag-to-create, bundling, flow animation, persistence to `canvas-state.json`. It does **not** cover making cables actually pipe data between tiles.

That work lives in:
- `src/main/cable-rpc.ts` — IPC handlers for `cable:create` / `cable:delete`
- `src/main/cable-pipe.ts` — pty stdout → stdin wiring (terminal-to-terminal cables)
- Preload script — expose `window.api.cableCreate` / `cableDelete`

Until that's done, cables are pretty decorations. The visual layer ships independently. Ship the visuals first; cable IPC can come in a follow-up PR.

### Auto-route cables around tiles

The prototype draws a direct bezier between ports, ignoring intermediate tiles. A* / coarse-grid routing is a separate ticket — don't attempt now. Most cable pairs are short and direct; the bezier looks fine.

### Hover-to-preview cable contents

"Hover a cable for 0.5s → tooltip showing last 5 stdout lines from the source." Nice future feature. Not v1. Requires a new IPC for `tile:tail` + tooltip wiring.

### Drag file from sidebar onto canvas to create a tile

Separate feature. Not part of cables. The sidebar currently has a Files tab — leave its drag behavior unchanged.

### Trace viewer

The Watchtower component has tabs for Events / Queues / Agents / Alerts. **Not** Trace. Distributed trace spans across cables are a real feature later, but for v1 the user explicitly said the rich trace viewer wasn't needed.

### Pop-out Watchtower as separate BrowserWindow

Mentioned in OPEN_QUESTIONS §3. Worth doing eventually (lets user park Watchtower on a second monitor). Not v1.

### Light mode

The `.dark` class block in your current Theme.css can be deleted. App is dark-only. If you want light mode later, fork the values into `:where(.light)` and toggle the class on `<html>`. Not in scope here.

### Per-tile color customization

The user-facing accent color picker in the prototype (green / amber / cyan / blue) sets the *whole-app* accent. Per-tile accent overrides ("make this tile blue") are not part of v1.

### Programmatic cable creation API

`cable-manager.add(cable)` exists internally, but there's no Python / JS API for users to script cable creation from outside the app. Future ticket.

### Snap-to-grid / smart alignment

Tiles drop where you drop them. No magnetic snap. No alignment guides. Future ticket.

### Cable groups / labels

You cannot label a cable ("this is the order pipe") or group cables semantically. Visual bundling exists, but only by tile-pair, not by user choice. Future ticket.

### Animations on cable creation / deletion

Cables appear and disappear instantly. No grow-out animation when created, no fade when deleted. Add later if it feels jarring — not blocking.

### Tooltips on ports

Hovering a port doesn't say "Output: stdout". Tooltips on ports are a v2 polish item.

### Accessibility audit

The components use semantic HTML where it's cheap (`role="button"`, `aria-label`), but I have not run a full a11y audit. Keyboard navigation for the canvas itself (focus a tile, tab between ports, etc.) is not implemented. Acceptable for an alpha; revisit before public release.
