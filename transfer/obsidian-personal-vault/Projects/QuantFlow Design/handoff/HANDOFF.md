# QuantFlow Visual Redesign — Handoff Package

> **Target repo:** `C:\Users\rybow\QuantFlow\quantflow-electron`
> **Tool of choice:** Codex CLI or Claude Code, run locally with this folder as context.
> **Status:** prototype + tokens + new-file source + walkthroughs. Production tile-renderer / canvas-viewport patches are described, not produced, because those source files weren't available when this handoff was assembled (see [OPEN_QUESTIONS](#open-questions)).

This folder is the complete brief for porting the redesign into the live Electron app. Everything is self-contained: open `prototype/QuantFlow Redesign.html` in a browser to see the target; copy the `new-files/` tree into the repo; follow the per-file instructions below.

---

## Contents

```
handoff/
├── HANDOFF.md                                ← this file
├── CHECKLIST.md                              ← Section 6: acceptance
├── OPEN_QUESTIONS.md                         ← things I couldn't decide alone
├── NON_GOALS.md                              ← what is intentionally NOT in this pass
├── prototype/                                ← Section 1: complete prototype source
│   ├── QuantFlow Redesign.html
│   ├── tokens.css
│   ├── design-canvas.jsx
│   ├── tweaks-panel.jsx
│   └── artboards/
│       ├── _shared.jsx
│       ├── 01_faithful.jsx     · dark port of current layout
│       ├── 02_cable.jsx        · denser status-spine direction
│       ├── 03_glass.jsx        · glassy floating panels direction
│       ├── 04_cable_lab.jsx    · interactive cable prototype ★
│       ├── 05_sidebar.jsx      · tile-registry sidebar
│       ├── 06_watchtower.jsx   · bottom telemetry panel
│       └── 07_full_shell.jsx   · composed shell (the target) ★
└── new-files/                                ← Section 5: drop into repo
    ├── tokens/
    │   ├── Theme.css           → packages/shared/src/styles/Theme.css
    │   └── TOKENS.md           ← reference doc
    ├── shell/                  → src/windows/shell/src/
    │   ├── cable-math.js
    │   ├── cable-manager.js
    │   ├── cable-renderer.js
    │   ├── cable-overlay.js
    │   └── cable-drop.js
    └── nav/                    → src/windows/nav/src/
        ├── TileRegistry.tsx
        └── Watchtower.tsx
```

★ Artboards `04` and `07` are the canonical source of truth for visual fidelity. When something is ambiguous, open the prototype and look there.

---

# Section 1 — Prototype source

Every visual decision in this handoff has a corresponding artboard in `prototype/`. To run:

```
open prototype/QuantFlow Redesign.html      # macOS
start "" "prototype\QuantFlow Redesign.html" # Windows
```

It's a static HTML file — React 18 via UMD, JSX transpiled at runtime via Babel-standalone. No build step required.

### Sample data baked into the artboards

| Surface | Where the sample data lives |
|---|---|
| Tile chains (Trading / Training / Monitoring / Scratchpad) | `artboards/07_full_shell.jsx` → `FS_TILES`, `FS_CABLES`, `FS_LABELS` |
| Cable lab tiles | `artboards/04_cable_lab.jsx` → `initialTiles`, `initialCables` |
| Sidebar registry | `artboards/05_sidebar.jsx` → `chains` array inside `SidebarRegistry` |
| Watchtower events / queues / agents / alerts | `artboards/06_watchtower.jsx` → `events`, `cables`, `agents` arrays |
| Terminal output, equity curve, TB scalar | `artboards/_shared.jsx` and inline in `07_full_shell.jsx` |

### Tweaks (live in the prototype)

The bottom-right floating panel exposes:
- **Accent color** — green (default) / amber / cyan / blue. Scoped CSS-var override on the artboard, no token mutation.
- **Sidebar collapsed** — toggle for the rail-vs-expanded sidebar variant.

Both settings persist to the EDITMODE JSON block in `QuantFlow Redesign.html` so they survive reload.

### SVG drawing logic

All cable rendering uses two pure functions:
- `portPosition(tile, side)` — returns `{x, y, dx, dy}` (point + outward normal)
- `bezierPath(a, b)` — cubic Bézier with directional handles, curvature clamped to `[40, 180]` based on distance

Production copies live in `new-files/shell/cable-math.js` and are byte-identical to the prototype's behavior.

---

# Section 2 — Design tokens

Full token set lives at `new-files/tokens/Theme.css`. Reference documentation at `new-files/tokens/TOKENS.md`.

**Highlights of what's new vs your existing Theme.css:**

1. Surface ramp deepened — `--bg: #0a0d12`, `--canvas-bg: #0c1117`.
2. `--canvas-gradient` added — `linear-gradient(to top, #16092a 0%, #0a0820 30%, #06070d 65%, #050812 100%)` to be applied to `#panel-viewer`.
3. `--accent: oklch(0.78 0.16 145)` — terminal green. Replaces whatever blue/neutral primary you had.
4. **Semantic cable tokens** — `--cable-pipe`, `--cable-context`, `--cable-trigger`, plus state variants (`--cable-hover`, `--cable-selected`, `--cable-failed`, `--cable-idle`, `--cable-default`).
5. **Semantic status tokens** — `--running`, `--idle`, `--selected`, `--failed`, `--armed`.
6. Full typography scale (`--fs-xxs` through `--fs-2xl`), spacing scale (`--space-1` through `--space-8`), radii, shadows, z-index, animation timings.
7. Shadcn-compat shim at bottom (`--foreground`, `--background`, etc.) so existing code reading those names doesn't break.

**Drop-in instructions:** replace the entire current contents of `packages/shared/src/styles/Theme.css` with `new-files/tokens/Theme.css`. The file is self-contained.

---

# Section 3 — File map for `quantflow-electron`

| Mockup surface | Repo file | Change type |
|---|---|---|
| **Tokens** — every color, font, spacing | `packages/shared/src/styles/Theme.css` | **Replace contents** (see §4.1) |
| **Tile body** — title bar, status spine, content area, crosshair borders | `src/windows/shell/src/tile-renderer.js` | **Refactor** (see §4.2) |
| **Tile state model** — `running` flag, `kind` (term/note/file/browser/data/agent) | `src/windows/shell/src/tile-manager.js` | **Extend** (see §4.3) |
| **Canvas background + grid + gradient** | `src/windows/shell/index.html` + `src/windows/shell/src/shell.css` (or inline in Theme.css) | **Update one CSS rule** (see §4.4) |
| **Pan/zoom transform applied to cable SVG** | `src/windows/shell/src/canvas-viewport.js` | **Add hook** (see §4.5) |
| **Cable SVG layer** | NEW: `src/windows/shell/src/cable-renderer.js` | **Drop in** |
| **Cable state + persistence** | NEW: `src/windows/shell/src/cable-manager.js` | **Drop in** |
| **Cable interactions** (drag, delete) | NEW: `src/windows/shell/src/cable-drop.js` | **Drop in** |
| **Cable math** | NEW: `src/windows/shell/src/cable-math.js` | **Drop in** |
| **Cable overlay wiring** | NEW: `src/windows/shell/src/cable-overlay.js` | **Drop in** |
| **Tile Registry sidebar** | `src/windows/nav/src/App.tsx` + NEW: `src/windows/nav/src/TileRegistry.tsx` | **Add component + mount** (see §4.6) |
| **Watchtower panel** | `src/windows/nav/src/App.tsx` + NEW: `src/windows/nav/src/Watchtower.tsx` | **Add component + mount** (see §4.7) |
| **Main process — cable IPC** | NEW: `src/main/cable-rpc.ts`, NEW: `src/main/cable-pipe.ts` | **Out of scope here** (see NON_GOALS) |

---

# Section 4 — Implementation instructions

Steps are in ship order. Each is independent enough to be one commit.

## 4.1 — Tokens swap (15 min)

**File:** `packages/shared/src/styles/Theme.css`

1. Back up the current file.
2. Replace contents with `new-files/tokens/Theme.css`.
3. Restart `bun dev`. App should already look 60 % redesigned — dark, green-accented, all text legible.

**What to preserve:** any project-specific CSS that lived *below* the `:root` block (component selectors, resets, etc.) — keep that. Only the `:root` block (and any `.dark` block) is replaced.

**Dependencies:** none. Do this first.

## 4.2 — Tile chrome refactor

**File:** `src/windows/shell/src/tile-renderer.js`

Goal: every tile renders as a card with a status spine, a title bar, a content body, and 4 ports.

**Required structure (HTML output of `renderTile()`):**

```html
<div class="canvas-tile"
     data-tile-id="${tile.id}"
     data-tile-type="${tile.kind}"
     data-running="${tile.running}"
     data-status="${tile.status}"
     data-selected="${tile.selected}"
     style="left:${x}px; top:${y}px; width:${w}px; height:${h}px;">

  <!-- Status spine — left edge, 2px -->
  <div class="tile-spine"></div>

  <!-- Title bar — drag handle -->
  <div class="tile-title-bar">
    <span class="tile-dot"></span>
    <span class="tile-title">
      <span class="tile-host">${host}/</span>${name}
    </span>
    <span class="tile-pill">LIVE</span>           <!-- when running -->
    <button class="tile-close" aria-label="Close">×</button>
  </div>

  <!-- Content area — type-specific rendering -->
  <div class="tile-body">…</div>

  <!-- Crosshair overshoot borders — keep your existing pseudo-elements -->
  <!-- (::before and ::after on .canvas-tile, no markup needed) -->

  <!-- Four ports — N, E, S, W -->
  <div class="tile-port" data-side="N"></div>
  <div class="tile-port" data-side="E"></div>
  <div class="tile-port" data-side="S"></div>
  <div class="tile-port" data-side="W"></div>
</div>
```

**New classes to add to your shell CSS** (or fold into Theme.css):

```css
.canvas-tile {
  position: absolute;
  background: var(--tile-bg);
  border: 1px solid var(--tile-border);
  border-radius: var(--r-tile);
  box-shadow: var(--sh-tile);
  overflow: hidden;
  z-index: var(--z-tile);
}
.canvas-tile[data-running="true"] {
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  box-shadow: var(--sh-tile-running);
}
.canvas-tile[data-status="error"] {
  border-color: color-mix(in srgb, var(--failed) 40%, transparent);
  box-shadow: var(--sh-tile-error);
}
.canvas-tile[data-selected="true"] {
  border-color: var(--selected);
  z-index: var(--z-tile-focused);
}

.tile-spine {
  position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
  background: var(--tile-border-hi);
  border-radius: var(--r-tile) 0 0 var(--r-tile);
}
.canvas-tile[data-running="true"] .tile-spine {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}
.canvas-tile[data-status="error"] .tile-spine {
  background: var(--failed);
  box-shadow: 0 0 8px var(--failed);
}

.tile-title-bar {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--tile-title-pad-y) var(--tile-title-pad-x);
  border-bottom: 1px solid var(--border);
  cursor: grab; user-select: none;
}
.tile-title {
  font-family: var(--font-mono); font-size: var(--fs-sm);
  color: #aab3c0; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.tile-host { color: var(--muted-2); }
.tile-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--muted-2);
}
.canvas-tile[data-running="true"] .tile-dot {
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
}
.tile-body { position: relative; overflow: hidden; }
```

**Port styles** are already in `Theme.css` (we put them there because they sit logically with cable styles). Don't duplicate.

**What to preserve:** keep your existing `::before` / `::after` crosshair overshoot pseudo-elements — they're great. Only update their color refs to `var(--tile-border-hi)` for focused state and `var(--accent)` for selected.

**Dependencies:** §4.1.

## 4.3 — Tile state model

**File:** `src/windows/shell/src/tile-manager.js`

Add these fields to each tile in `canvas-state.json` and the in-memory model:

```ts
{
  id: string,
  kind: 'term' | 'note' | 'file' | 'browser' | 'data' | 'agent',  // NEW (default 'term' for back-compat)
  running: boolean,        // already exists, expose to renderer
  status: 'idle' | 'running' | 'error' | 'armed',  // NEW
  selected: boolean,       // NEW — used by Tile Registry click-to-focus
  // ... existing fields (x, y, width, height, title, etc.)
}
```

Expose to `cable-overlay.js` via `tileManager.list()`, `tileManager.byId(id)`, `tileManager.subscribe(fn)`.

If your existing tile-manager doesn't have `subscribe()`, add a tiny emitter:

```js
const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { for (const fn of listeners) fn(); }
// Call notify() at the end of every mutating method (add/move/resize/close/setRunning).
```

**Dependencies:** §4.1, §4.2.

## 4.4 — Canvas background + grid + gradient

**File:** `src/windows/shell/index.html` + your shell CSS

In your shell CSS, find `#panel-viewer` (or whatever element wraps the canvas):

```css
#panel-viewer {
  /* OLD: background: var(--canvas-bg); */
  background: var(--canvas-gradient);
}
```

Keep the dot-grid `<canvas id="grid-canvas">` rendering you already have — `--canvas-gradient` reads through to it cleanly. If the grid looks too bright on the gradient, fade the dot color to `rgba(255,255,255,0.025)`.

**Dependencies:** §4.1.

## 4.5 — Wire cable layer into pan/zoom

**File:** `src/windows/shell/src/canvas-viewport.js`

Your viewport already applies a pan/zoom transform to `#tile-layer`. Expose two methods so the cable overlay can ride the same transform:

```js
// canvas-viewport.js
const transformListeners = new Set();

export function onTransform(fn) {
  transformListeners.add(fn);
  return () => transformListeners.delete(fn);
}

export function getTransform() {
  return { tx, ty, scale };   // your existing internal state
}

export function clientToWorld({ x, y }) {
  return { x: (x - tx) / scale, y: (y - ty) / scale };
}

// At the end of your existing applyTransform() function, after the matrix is set:
for (const fn of transformListeners) fn();
```

Then in shell boot:

```js
// shell.js — boot sequence
import { attachCableOverlay } from './cable-overlay.js';
import { attachCableDrop } from './cable-drop.js';
import * as cableManager from './cable-manager.js';

cableManager.init(savedState.cables || []);

const renderer = attachCableOverlay({
  panelViewer: document.getElementById('panel-viewer'),
  viewport,
  tileManager,
  cableManager,
});

attachCableDrop({
  panelViewer: document.getElementById('panel-viewer'),
  viewport,
  tileManager,
  cableManager,
  renderer,
});
```

**Dependencies:** §4.1, §4.2, §4.3, plus the new files in `new-files/shell/`.

## 4.6 — Mount Tile Registry sidebar

**File:** `src/windows/nav/src/App.tsx`

Copy `new-files/nav/TileRegistry.tsx` into the same folder. Then in `App.tsx`:

```tsx
import { TileRegistry, type Chain } from './TileRegistry';

// In your sidebar render — replace the Tiles tab body, or add as the main view:
<TileRegistry
  chains={tileChains}                  // shape: Chain[] (see TileRegistry.tsx)
  selectedTileId={focusedTileId}
  onSelect={(id) => focusTile(id)}     // calls into shell window via IPC
  collapsed={sidebarCollapsed}
  workspace={workspaceName}
  version={appVersion}
/>
```

**Data to provide:** group tiles by workflow chain. The four prototype chains (`trading` / `training` / `monitoring` / `scratchpad`) are starting points — the real grouping is up to you. Sensible v1: read groups from a top-level `chains` array in `canvas-state.json`, falling back to a single "All tiles" chain.

**What to preserve:** Files tab and any existing file-tree logic. Tiles tab is what changes.

**Dependencies:** §4.1, §4.3.

## 4.7 — Mount Watchtower

**File:** `src/windows/nav/src/App.tsx` *(or a new BrowserWindow — your call; see Open Questions)*

Copy `new-files/nav/Watchtower.tsx` next to `App.tsx`. Then:

```tsx
import { Watchtower } from './Watchtower';

// At the bottom of your shell layout, fixed-height ~220px:
<div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 220, zIndex: 200 }}>
  <Watchtower
    events={liveEvents}
    cables={cableQueueStats}
    agents={agentStates}
    alerts={activeAlerts}
    throughput={throughputSamples}
    onAcknowledgeAlert={(id) => ack(id)}
  />
</div>
```

**Data shape:** all prop types are exported from `Watchtower.tsx`. The v1 dataflow doesn't need a real IPC stream — feed it dummy/last-known values from `canvas-state.json` until you wire `cable-rpc.ts` (Part 3 of the original cable handoff).

**Dependencies:** §4.1. Independent of cables; can ship before the cable system if you want.

---

# Section 5 — New files

All files below are in `new-files/`. Drop them into the listed repo paths.

| Source | Destination | Imports it |
|---|---|---|
| `new-files/tokens/Theme.css` | `packages/shared/src/styles/Theme.css` | Already imported by both windows |
| `new-files/shell/cable-math.js` | `src/windows/shell/src/cable-math.js` | `cable-renderer.js`, `cable-drop.js` |
| `new-files/shell/cable-manager.js` | `src/windows/shell/src/cable-manager.js` | Imported by shell boot script |
| `new-files/shell/cable-renderer.js` | `src/windows/shell/src/cable-renderer.js` | `cable-overlay.js` |
| `new-files/shell/cable-overlay.js` | `src/windows/shell/src/cable-overlay.js` | Imported by shell boot script |
| `new-files/shell/cable-drop.js` | `src/windows/shell/src/cable-drop.js` | Imported by shell boot script |
| `new-files/nav/TileRegistry.tsx` | `src/windows/nav/src/TileRegistry.tsx` | `App.tsx` |
| `new-files/nav/Watchtower.tsx` | `src/windows/nav/src/Watchtower.tsx` | `App.tsx` |

### How the new shell files connect

```
shell.js (boot)
  ├── import * as cableManager from './cable-manager.js'
  ├── import { attachCableOverlay } from './cable-overlay.js'
  │     └── cable-overlay.js
  │           ├── import { initCableRenderer } from './cable-renderer.js'
  │           │     └── cable-renderer.js
  │           │           └── import { ... } from './cable-math.js'
  │           └── reads from viewport + tileManager + cableManager
  └── import { attachCableDrop } from './cable-drop.js'
        └── reads from viewport + tileManager + cableManager + renderer
```

All five new shell files are ESM (`import`/`export`). If your project still uses CommonJS, swap to `require`/`module.exports` — the file shapes are otherwise unchanged.

---

# Section 6 — Acceptance checklist

See `CHECKLIST.md` for the full thing. Top-level summary:

- ✅ App boots dark + green at first run, no light flash.
- ✅ Canvas background is the purple-to-black gradient. Dot grid still visible.
- ✅ Tiles have 8px rounded corners, status spine on left edge, crosshair borders, 4 ports visible on hover.
- ✅ Cables: bezier curves between ports, animated flow when source is running, bundle into one thick line when multiple cables share a tile-pair.
- ✅ Ports: 12px green dots when source tile is live; gray otherwise. Hover scales 1.3×.
- ✅ Drag from a port → bezier preview path follows cursor. Drop on another port → cable created.
- ✅ Shift-click a cable → it (and its bundle-mates) delete.
- ✅ Sidebar shows tiles grouped by chain, with live status dots. Collapsed rail mode works.
- ✅ Watchtower bottom panel shows event stream, queue depth bars, agent state cards, alerts tab.
- ✅ Accent color tokens (`--accent`) flip the whole UI palette when changed.
- ✅ Renders correctly at 1280×720 and 1920×1080 (see CHECKLIST.md for exact expected layouts).

---

# Where to start

If you want one PR-shaped first step: **just do §4.1**. Replace `Theme.css`, ship. The app turns dark + green that day, and every later change builds on that foundation. The cable system is the largest item; landing tokens first removes risk from everything that follows.

Anything ambiguous → read `OPEN_QUESTIONS.md` and ping back.
