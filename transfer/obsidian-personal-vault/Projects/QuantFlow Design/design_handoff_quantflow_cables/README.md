# Handoff: QuantFlow Cable System + Dark Redesign

> **Goal:** Make QuantFlow look and behave like the prototype in this handoff. Two parts: (1) a dark visual redesign with terminal-green accents, (2) an interactive cable system for connecting tiles.

---

## About the Design Files

The HTML/JSX files in this bundle are **design references** — prototypes showing intended look and behavior, not production code to copy directly. Your task is to **recreate these designs inside the existing QuantFlow codebase** (Electron + React 19 + Tailwind 4 + plain JS for the canvas shell), using its established patterns:

- **Shell window** (`collab-electron/src/windows/shell/`) — plain JS modules + `shell.css`. The canvas, tile manager, and viewport all live here. **This is where most cable work happens.**
- **Nav window** (`collab-electron/src/windows/nav/`) — React + CSS. Sidebar / file tree.
- **Terminal tile** (`collab-electron/src/windows/terminal-tile/`) — React + xterm.js inside a webview.
- **Main process** (`collab-electron/src/main/`) — `pty.ts`, `canvas-rpc.ts`, `canvas-persistence.ts`. Cable wiring (the actual data piping) goes here.

The prototype uses React for speed of iteration, but the production cable layer should match the **plain-JS pattern in `shell/src/`** (see `tile-manager.js`, `tile-renderer.js`, `canvas-viewport.js`). The bezier and port math is pure functions — port directly.

## Fidelity

**High-fidelity.** All colors, typography, spacing, port positions, bezier curve shape, animation timing, and bundle/delete behavior are intentional and should be matched precisely.

---

## Part 1 — Dark Redesign Tokens

### What changes
Replace the `:root` and `.dark` blocks at the top of `collab-electron/src/windows/shell/src/shell.css` with the new token set. Keep the rest of the file as-is — every other selector references these variables and will adapt automatically. The nav window's `App.css` also references `--foreground`, `--background`, `--border`, `--muted-foreground`, `--primary` — make sure those are defined too (see "Compatibility shim" below).

### New tokens (drop-in replacement)

```css
:root {
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'IBM Plex Mono', ui-monospace, monospace;

  /* Surface ramp — deep near-black */
  --bg:           #0a0d12;
  --bg-rgb:       10, 13, 18;
  --canvas-bg:    #0c1117;
  --canvas-bg-hi: #0f141b;
  --canvas-bg-rgb: 12, 17, 23;
  --canvas-opacity: 1;     /* full opacity by default in dark; user can lower in settings */

  /* Tile surfaces */
  --tile-bg:       #0f141b;
  --tile-bg-hi:    #131923;
  --tile-border:   #1c232d;
  --tile-border-hi:#2a3340;

  /* Text */
  --fg:    #e7ecf2;
  --muted: #6b7686;
  --muted-2: #4a5466;
  --border: #1c232d;

  /* Terminal-green accent */
  --accent:      oklch(0.78 0.16 145);
  --accent-dim:  oklch(0.62 0.13 145);
  --accent-glow: oklch(0.78 0.16 145 / 0.18);

  /* Status */
  --running: oklch(0.78 0.16 145);
  --idle:    #6b7686;
  --error:   oklch(0.68 0.19 25);

  /* Edge dot (canvas overflow indicators — already terminal-y) */
  --edge-dot:       var(--accent);
  --edge-dot-hover: oklch(0.85 0.17 145);

  /* New-tile button matched to surface ramp */
  --new-tile-btn-bg:       #13191f;
  --new-tile-btn-bg-hover: #1a2129;

  --toolbar-height: 38px;
  --nav-inset: 12px;
}

/* Compatibility shim for nav window (App.css references these) */
:root {
  --foreground:        var(--fg);
  --background:        var(--bg);
  --muted-foreground:  var(--muted);
  --primary:           var(--accent);
  --primary-foreground: #0a0d12;
  --destructive:       var(--error);
  --card:              var(--tile-bg);
  --scrollbar-width:   10px;
  --scrollbar-thumb:   #1c232d;
  --scrollbar-thumb-hover: #2a3340;
}

/* The .dark class block can be deleted — we're dark by default now.
   If you want to preserve a light mode, keep the old :root values
   under a .light class instead and apply that conditionally. */
```

### Tile crosshair borders (keep, but tune)

Your existing `.canvas-tile::before / ::after` pseudo-elements that overshoot tile corners are great — keep them. Only update the colors to use `var(--tile-border-hi)` for focused state and `var(--accent)` for selected.

### Specific selectors to update beyond the token swap

| Selector | Change |
|---|---|
| `#alpha-label` | Move from screaming red bottom-center to a small pill in titlebar (see Part 1.5). |
| `.canvas-tile[data-tile-type="term"]` | Change `background: rgba(5, 5, 5, 0.2)` to `background: var(--tile-bg)`. |
| `.canvas-tile[data-tile-type="note"] .tile-title-bar` | Dark variant: change `#000` background to `var(--canvas-bg-hi)`. |
| `#tooltip` | Already has `.dark` variant — verify it picks up. |
| `#minimap-wrapper` | Background to `rgba(15, 20, 27, 0.5)` in dark. |
| `#zoom-indicator` | Already uses `var(--bg)` — should adapt. |

### 1.5 — Move the alpha label

Currently `#alpha-label` is a fixed-position red bar at bottom-center. Move it to a small pill in the titlebar:

```css
#alpha-label {
  position: fixed;
  top: 8px;                    /* was: bottom: 8px */
  left: 14px;                  /* was: left: 50%; transform: ... */
  transform: none;
  font-size: 10px;
  color: var(--error);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--error) 40%, transparent);
  background: color-mix(in srgb, var(--error) 8%, transparent);
  z-index: 200;
  -webkit-app-region: no-drag;
}
```

---

## Part 2 — Cable System (the main feature)

### 2.1 Architecture

Cables are a new layer on the canvas alongside tiles. They:
- Live in `canvas-state.json` next to tiles
- Render as SVG bezier paths in a single overlay SVG element
- Have ports on tiles (4 fixed positions: N/E/S/W)
- Are created by drag-from-port-to-port
- Are deleted by shift-click
- Bundle visually when multiple cables share the same tile pair
- Animate flow when the source tile is "running"

### 2.2 New files to create

```
collab-electron/src/windows/shell/src/
  cable-manager.js          # State: list, add, remove, persistence
  cable-renderer.js         # SVG draw: paths, bundling, drag preview
  cable-interactions.js     # Mouse handlers: port mousedown/up, drag preview, shift-click delete
  cable-math.js             # Pure: portPosition(tile, side), bezierPath(a, b)

collab-electron/src/main/
  cable-rpc.ts              # IPC handlers: cable:create, cable:delete, cable:list
  cable-pipe.ts             # Pty stdout → stdin piping for terminal-to-terminal cables
```

### 2.3 Data model

Extend `canvas-state.json`. Bump `"version": 1` to `"version": 2`. Add a top-level `cables` array:

```json
{
  "version": 2,
  "tiles": [ ... ],
  "cables": [
    {
      "id": "cable-<timestamp>-<rand>",
      "from": { "tileId": "tile-...", "side": "E" },
      "to":   { "tileId": "tile-...", "side": "W" },
      "kind": "pipe",        // "pipe" | "context" | "trigger"  (start with "pipe" only)
      "createdAt": "2026-05-04T14:22:00Z"
    }
  ],
  "viewport": { ... }
}
```

In `canvas-persistence.ts`, write a v1 → v2 migration that just sets `cables: []` if missing. Save behavior stays the same (debounced 500ms).

### 2.4 Math (drop-in pure functions)

Copy these from `artboards/04_cable_lab.jsx` into `cable-math.js`:

```js
const SIDES = ['N', 'E', 'S', 'W'];

// Returns world-space port position + outward normal
export function portPosition(tile, side) {
  const { x, y, width: w, height: h } = tile;
  switch (side) {
    case 'N': return { x: x + w/2, y: y,     dx: 0,  dy: -1 };
    case 'S': return { x: x + w/2, y: y + h, dx: 0,  dy:  1 };
    case 'E': return { x: x + w,   y: y + h/2, dx:  1, dy: 0 };
    case 'W': return { x: x,       y: y + h/2, dx: -1, dy: 0 };
  }
}

// Smooth bezier with directional handles based on each end's outward normal.
// Curvature ramp: short cables stay tight, long cables get rounder.
export function bezierPath(a, b, curvature = 0.45) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const k = Math.min(180, Math.max(40, dist * curvature));
  const c1 = { x: a.x + a.dx * k, y: a.y + a.dy * k };
  const c2 = { x: b.x + b.dx * k, y: b.y + b.dy * k };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}
```

These are 1:1 from the prototype — keep `dist * 0.45` clamped to `[40, 180]`. That's what gives short cables their snap-to-port feel and long cables their gentle arc.

### 2.5 SVG layer setup

Edit `collab-electron/src/windows/shell/index.html`. Add a `<svg id="cable-layer">` **between** `#tile-layer` and `#edge-indicators`:

```html
<div id="panel-viewer">
  <button type="button" id="new-tile-btn" ...> ... </button>
  <canvas id="grid-canvas"></canvas>
  <div id="tile-layer"></div>
  <svg id="cable-layer" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- markers, gradients defined dynamically -->
    </defs>
  </svg>
  <div id="edge-indicators"></div>
  ...
</div>
```

CSS:

```css
#cable-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 102;             /* above tiles' bodies (z=100), below #edge-indicators (104) */
  overflow: visible;
}
#cable-layer path.cable {
  pointer-events: stroke;   /* clickable cable */
  cursor: pointer;
}
```

The SVG should be transformed by the same pan/zoom matrix as `#tile-layer`. Look at how `canvas-viewport.js` applies its transform — replicate for `#cable-layer`. (Or wrap both in a single transformed `<g>` if you switch the tile layer to SVG; not required.)

### 2.6 Ports on tiles

In `tile-renderer.js`, when a tile is rendered, append four `<div class="tile-port" data-side="N">` etc. as children of `.canvas-tile`:

```css
.tile-port {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--tile-border);
  border: 2px solid var(--bg);
  cursor: crosshair;
  opacity: 0;
  transition: opacity 0.12s ease, transform 0.12s ease, background 0.12s ease;
  z-index: 11;
  pointer-events: auto;
}
.tile-port[data-side="N"] { left: 50%; top: 0;     transform: translate(-50%, -50%); }
.tile-port[data-side="S"] { left: 50%; bottom: 0;  transform: translate(-50%, 50%); }
.tile-port[data-side="E"] { right: 0;  top: 50%;   transform: translate(50%, -50%); }
.tile-port[data-side="W"] { left: 0;   top: 50%;   transform: translate(-50%, -50%); }

/* Show ports on tile hover, on canvas-wide drag, and on focused tile */
.canvas-tile:hover .tile-port,
body[data-cable-dragging="true"] .tile-port,
.canvas-tile.tile-focused .tile-port {
  opacity: 1;
}

.tile-port:hover {
  background: var(--accent);
  transform: scale(1.4) translate(...);  /* preserve translate per side */
  box-shadow: 0 0 12px var(--accent);
}

/* Live source — port glows green continuously */
.canvas-tile[data-running="true"] .tile-port {
  background: var(--accent);
  box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 60%, transparent);
}
```

### 2.7 Drag interaction (in `cable-interactions.js`)

Mirror the pattern in `tile-interactions.js`:

```js
// On port mousedown: start a drag, set body[data-cable-dragging="true"], 
// remember source { tileId, side }, listen window mousemove/mouseup.
// On mousemove: update drag preview path in #cable-layer (a temp <path id="cable-preview">).
//   Convert client coords through the canvas viewport's inverse transform to canvas-world coords.
// On mouseup over a port: complete the cable. Otherwise: cancel.
// Clear data-cable-dragging on mouseup either way.
```

The preview path uses the same `bezierPath()` with a fake `to` endpoint where `dx, dy` is `-a.dx, -a.dy` (so the bezier still curves nicely toward the cursor).

```css
#cable-layer path.cable-preview {
  stroke: oklch(0.78 0.16 145 / 0.7);
  stroke-width: 2;
  stroke-dasharray: 4 4;
  fill: none;
  pointer-events: none;
}
```

### 2.8 Cable rendering (in `cable-renderer.js`)

For each cable:
- Lookup endpoints with `portPosition(tile, side)`
- Compute `bezierPath(a, b)`
- Render **three** stacked SVG `<path>` elements:
  1. **Hit area** — `stroke="transparent" stroke-width="14" pointer-events: stroke` (clickable)
  2. **Glow** (only when source `running` or hovered) — `stroke-width: w + 6, opacity: 0.18, filter: blur(3px)`
  3. **Main cable** — `stroke="var(--accent)" stroke-width: 1.6 stroke-linecap: round`
  4. **Flowing dashes** (only when source `running`) — overlay path with `stroke-dasharray="2 14"` and CSS animation `cableFlow 1.6s linear infinite`:

```css
@keyframes cableFlow {
  to { stroke-dashoffset: -32; }
}
```

### 2.9 Bundling

Group cables before render:

```js
const groups = new Map();
cables.forEach(c => {
  // Same A↔B regardless of direction, same side pair
  const tilePairKey = [c.from.tileId, c.to.tileId].sort().join('|');
  const sidePairKey = [c.from.side, c.to.side].sort().join(',');
  const key = tilePairKey + ':' + sidePairKey;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(c);
});
```

For each group:
- If `group.length === 1` → render normally.
- If `group.length > 1` → render one path with `stroke-width: 3 + min(count, 5)`, plus a **count badge** at the bezier midpoint:

```js
// SVG badge at midpoint
const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
// <circle r="11" fill="#0d1218" stroke="oklch(0.78 0.16 145 / 0.5)" />
// <text> with the count
```

(For mathematical accuracy use the bezier midpoint at t=0.5; arithmetic average is close enough at typical scales.)

### 2.10 Delete (shift-click)

Attach to the hit-area path:

```js
path.addEventListener('click', (e) => {
  if (e.shiftKey) {
    // For bundles, delete every cable in the group
    group.forEach(c => deleteCable(c.id));
  }
});
```

After delete, re-render and persist.

### 2.11 Auto-route around tiles (optional, phase 2)

Not in the prototype. When you add it: route on a coarse grid (e.g. 20×20 px cells) using A* with tile rectangles as obstacles. Convert the resulting waypoints into a smooth bezier-spline path. Don't bother until cables feel right without it — most pairs are short and direct.

---

## Part 3 — Agent Communication (the cable's actual semantics)

This is **independent of the visual layer** and can ship later. The visual cable system above works on its own and is the part that "looks like the prototype."

### 3.1 Pipe semantics for terminal↔terminal cables

In `collab-electron/src/main/pty.ts`, terminals already manage their own PTY sessions with stdout streams. Add:

```ts
// pty.ts — pseudocode
const pipes = new Map<string, { sourceId: string, targetId: string, dispose: () => void }>();

export function pipeOutput(cableId: string, sourceId: string, targetId: string) {
  const source = sessions.get(sourceId);
  const target = sessions.get(targetId);
  if (!source || !target) return;

  const onData = (chunk: string) => {
    target.write(chunk);   // pipe stdout → stdin
  };
  source.onData(onData);

  pipes.set(cableId, {
    sourceId, targetId,
    dispose: () => source.offData(onData),
  });
}

export function unpipeOutput(cableId: string) {
  pipes.get(cableId)?.dispose();
  pipes.delete(cableId);
}
```

### 3.2 IPC

Create `cable-rpc.ts` in main, mirroring `canvas-rpc.ts`:

```ts
ipcMain.handle('cable:create', (_, cable) => {
  // persist to canvas-state.json
  // if both endpoints are terminal tiles: pipeOutput(cable.id, sourcePtyId, targetPtyId)
  return cable;
});

ipcMain.handle('cable:delete', (_, cableId) => {
  unpipeOutput(cableId);
  // remove from canvas-state.json
});
```

Expose `window.api.cableCreate` / `cableDelete` in the preload script. Renderer's `cable-manager.js` calls these instead of mutating local state directly.

### 3.3 Other tile types

- **note → terminal** — inject the note's content into the target's stdin once on connection (no live streaming).
- **code → terminal** — same as note.
- **terminal → note** — append source stdout to the note file (rate-limited).

Define these in a switch on `cable.from.tileType + cable.to.tileType`. Start with `terminal → terminal` only.

---

## Design Tokens (full reference)

### Colors

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0a0d12` | Window background, sidebar |
| `--canvas-bg` | `#0c1117` | Canvas (main viewer area) |
| `--canvas-bg-hi` | `#0f141b` | Elevated canvas surfaces |
| `--tile-bg` | `#0f141b` | Tile body |
| `--tile-bg-hi` | `#131923` | Tile body, focused/hovered |
| `--tile-border` | `#1c232d` | Default tile + chrome borders |
| `--tile-border-hi` | `#2a3340` | Focused tile border |
| `--fg` | `#e7ecf2` | Primary text |
| `--muted` | `#6b7686` | Secondary text |
| `--muted-2` | `#4a5466` | Tertiary text, disabled |
| `--border` | `#1c232d` | Generic borders |
| `--accent` | `oklch(0.78 0.16 145)` | Live indicators, cables, accents (terminal green) |
| `--accent-dim` | `oklch(0.62 0.13 145)` | Inactive accent |
| `--accent-glow` | `oklch(0.78 0.16 145 / 0.18)` | Glow halos |
| `--running` | `oklch(0.78 0.16 145)` | Status: running |
| `--idle` | `#6b7686` | Status: idle |
| `--error` | `oklch(0.68 0.19 25)` | Errors, alpha label |

### Typography
- **Sans**: Geist (already loaded). Sizes: 11.5 / 12 / 13 / 15 px.
- **Mono**: Geist Mono. Sizes: 9.5 / 10.5 / 11 / 11.5 px. Used for: terminal output, file paths, status pills, small labels, badges.
- Letter-spacing 0.06–0.1em + uppercase for status pills and section headers.
- Line-height 1.5 for body, 1.65 for terminal output.

### Spacing
- Tile internal padding: `8px 14px` body, `8px 10px` title bar.
- Sidebar inset: 12px.
- Tile gap on canvas: typical layouts use ~40–60px between tiles.

### Radii
- Tiles: `8px` (was `0px` in current code — change to 8).
- Pills: `999px`.
- Buttons: `6–8px`.
- Modals: `12px`.

### Shadows
- Tile (idle): `0 6px 20px rgba(0,0,0,0.4)`
- Tile (running): `0 0 0 1px oklch(0.78 0.16 145 / 0.06), 0 8px 24px rgba(0,0,0,0.5)`
- Floating panels: `0 12px 40px rgba(0,0,0,0.5)` + `inset 0 1px 0 rgba(255,255,255,0.05)` highlight

### Animations
- Cable flow: `@keyframes cableFlow { to { stroke-dashoffset: -32; } }` at `1.6s linear infinite`
- Cursor blink: `@keyframes blink { 50% { opacity: 0; } }` at `1.1s steps(1) infinite`
- Port show: `opacity 0.12s ease`

---

## Implementation order (recommended)

1. **Tokens swap** (Part 1) — 30 min. App is now dark + green. Verify nothing visual broke.
2. **SVG cable layer + math + bezier rendering** (no interaction yet) — 2–3 hr. Hardcode 1–2 cables in `canvas-state.json`, see them draw between real tiles, pan/zoom them.
3. **Ports + drag-to-create** (2.6, 2.7) — 2–3 hr.
4. **Persistence + delete** — 1 hr.
5. **Bundling + flow animation** — 1 hr.
6. **PTY piping** (Part 3) — 3–4 hr. Now the cables actually do something.

Total: ~1.5–2 days for a clean implementation matching the prototype.

---

## Files in this handoff

- `README.md` — this file
- `QuantFlow Redesign.html` — main prototype with all 4 artboards
- `tokens.css` — drop-in CSS variable replacements
- `artboards/_shared.jsx` — shared atoms (Pill, Dot, TerminalLines, etc.)
- `artboards/01_faithful.jsx` — port-the-current-layout-to-dark direction
- `artboards/02_cable.jsx` — denser, status spines, cable lines (early take)
- `artboards/03_glass.jsx` — glassy floating panels direction
- `artboards/04_cable_lab.jsx` — **the interactive cable prototype** — this is the one to reference for cable behavior
- `design-canvas.jsx` — host that lays out artboards (not for production)

To run the prototype locally: open `QuantFlow Redesign.html` in a browser.

---

## Notes on what's NOT in the prototype

- **Auto-route around tiles** — currently a direct bezier. Add later with A* on a coarse grid.
- **Hover-to-preview** — show last N stdout lines as a tooltip near the cable. Easy add: on `mouseenter` of a hit-area path, fetch `tail -n 5` of the source via IPC and show in a tooltip.
- **Connection types** — all cables are visually identical. When you add `kind: "context" | "trigger"`, color-code: pipe = green, context = blue (`oklch(0.7 0.14 240)`), trigger = amber (`oklch(0.78 0.14 80)`).
- **Drag file from sidebar onto tile** — separate feature, not part of cables.

Anything ambiguous, reference `artboards/04_cable_lab.jsx` directly — it's the source of truth for cable visual + interaction behavior.
