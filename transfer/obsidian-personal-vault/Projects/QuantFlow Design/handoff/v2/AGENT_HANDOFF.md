# QuantFlow V2 — Agent Handoff Package

> **Read order:** this file → `DESIGN.md` → `PRODUCT.md` → `tokens/shell-tokens.css` → `brand/` → `components/`
> **Visual reference:** open `QuantFlow V2 System.html` in a browser. Every artboard caption carries its file target.
> **Source of truth for scope/build order:** `CONCEPT.md`, `SCOPE.md`, `BUILD_PLAN_V2.md` in `quantflow-electron/`.

---

## 1. What this package is

This is the **V2 visual system and design handoff** for QuantFlow — a live topology console
where tiles (operational nodes) and cables (signal routes) sit on a routed canvas field.

It contains:
- Drop-in **CSS token extensions** for `shell.css`
- Standalone **React/TSX brand components** ready to copy into `packages/components/src/brand/`
- **Component stubs** showing the exact anatomy of tiles, cables, registry, dock, inspectors
- **Design docs** (`DESIGN.md`, `PRODUCT.md`) with every visual decision explained and justified
- The full **visual reference canvas** (`QuantFlow V2 System.html`) — 11 artboards, 7 sections

This package is NOT a new scope. It is a design description of the **already-built V2 architecture**.
All file targets below map to real files in `quantflow-electron/` at commit `de9c497` (branch `quantflow-v2`).

---

## 2. File-target map

### 2.1 CSS tokens → `src/windows/shell/src/shell.css`

Drop `tokens/shell-tokens.css` into the `:root` block of `shell.css`.
Add the per-type rail variables (`--rail-term`, `--rail-codex`, etc.) to `.canvas-tile[data-tile-type="..."]`.

| Token file | Target |
|---|---|
| `tokens/shell-tokens.css` | `src/windows/shell/src/shell.css` — extend existing `:root` |

### 2.2 Brand components → `packages/components/src/brand/`

These are self-contained React/TSX components. Copy them directly.

| File | Target | Use |
|---|---|---|
| `brand/QFMark.tsx` | `packages/components/src/brand/QFMark.tsx` | App icon, titlebar, favicon, canvas zero-state |
| `brand/QFOrbit.tsx` | `packages/components/src/brand/QFOrbit.tsx` | Loading spinner, soft canvas ring |
| `brand/QFWordmark.tsx` | `packages/components/src/brand/QFWordmark.tsx` | Headers, full-title lockups |
| `brand/QFLockup.tsx` | `packages/components/src/brand/QFLockup.tsx` | Mark + wordmark combined |

**App icon:** use `QFMark` at 512×512 (aspect ~136:100), export to `build/icon.png` and `build/icon.ico`.
The SVG viewBox is `0 0 136 100` — not square. Pad to square with `#0a0d12` fill before exporting.

### 2.3 Shell / canvas → `src/windows/shell/`

| Design element | Target file | What to change |
|---|---|---|
| **Tile anatomy** (type rail, crosshair corners, ports) | `src/windows/shell/src/shell.css` `.canvas-tile` | Add `--rail` color per `data-tile-type`; see `components/Tile.tsx` for the exact header DOM |
| **Tile status states** (running/selected/queued/error) | `shell.css` `.canvas-tile[data-state="..."]` | Border, rail, shadow per state — see token map |
| **Cable states** (idle/live/selected/queued/error/bundled) | `src/windows/shell/src/cable-renderer.js` | Add `queued`/`error` alongside existing `cable-selected/sending/sent/failed` classes |
| **Cable kind hues** (pipe/context/trigger) | `cable-renderer.js` + `shell.css` | `--cable-pipe` = `--flow`; `--cable-context` = `--blue`; `--cable-trigger` = `--amber` |
| **Canvas field** (dot grid + violet floor + origin glow) | `shell/index.html` `#panel-viewer` bg | See `tokens/shell-tokens.css` `--canvas-gradient` + `--canvas-origin-glow` |
| **Canvas watermark** (QF mark + QUANTFLOW label) | New `<div id="canvas-watermark">` behind `#tile-layer` | Low z-index; opacity fades as tile count grows; see `components/CanvasWatermark.tsx` |
| **Spawn mode pill** | New float in canvas chrome | "spawn · viewport center" — see artboard: Active canvas |
| **Status strip** | `shell/index.html` `#status-bar` | Health LED breathe animation; tokens map directly |

### 2.4 Nav / registry → `src/windows/nav/`

| Design element | Target file | What to change |
|---|---|---|
| **Registry header** (LIVE/ERR/TILES stat boxes) | `src/windows/nav/src/App.tsx` | `RegistryHeader` component — see `components/Registry.tsx` |
| **Registry row** (type glyph + name + @route + status chip) | `App.tsx` | `RegRow` component — see `components/Registry.tsx` |
| **Registry groups** (by agent class) | `App.tsx` | `RegGroup` wrapper — see `components/Registry.tsx` |
| **Filter input** | `App.tsx` | Filters name · host · @route · status |
| **Nav CSS** (row hover, selection rail, group labels) | `src/windows/nav/src/styles/App.css` | See `tokens/shell-tokens.css` for color values |

### 2.5 Dock / Legend → `src/windows/shell/` (Legend renderer)

| Design element | What to change |
|---|---|
| **Spawn / connect mode toggle** | Two-button pill at dock top; active state uses role hue |
| **Dock groups** (FLOW · SPAWN · TMPL · CTRL) | Labelled sections with `DockLabel` dividers; see `components/Dock.tsx` |
| **Role → runtimeTarget** | `generic` → `windows-pty`; `codex/agent/worker/tool` → `herdr-wsl`; `memory` → disabled until Gate 3 |
| **Experimental state** | Dashed border + amber dot; non-spawnable — see `components/Dock.tsx` `DockBtn` |

### 2.6 Inspectors → `src/windows/shell/` (selection panel)

| File | Target |
|---|---|
| `components/TileInspector.tsx` | Shell selection panel when a tile is selected |
| `components/CableInspector.tsx` | Shell selection panel when a cable is selected — see `cable-inspector.js` |

### 2.7 Watchtower → `src/windows/shell/` or new window

| Design element | Target |
|---|---|
| Health stat cards + per-agent sparklines | `diagnostics/health-runner.ts` data → Watchtower view |
| Event stream | `herdr events.subscribe` (Gate 3); 2s polling stays until then — see `RETIREMENT.md` |

### 2.8 Settings → `src/windows/settings/src/App.tsx`

Theme (dark/light/contrast), density (comfortable/compact), canvas opacity slider, diagnostics toggle.
Green stays the identity accent across all themes — never let theme selection change `--flow`.

---

## 3. The brand mark system

The QuantFlow brand is **two marks**:

| Mark | Component | Use |
|---|---|---|
| **QF dial** | `QFMark` | App icon · title bar · favicon · canvas watermark · loading · lockup |
| **Wordmark** | `QFWordmark` | Headers · hero · about · canvas empty-state label |

The mark is a **skinny ivory Q** (thin ring + Q tail at 4:30) with a **clean ivory serif-styled F**
inside and a **neon Live Green signal dot** on the ring. The dot is **static at ~1:30 o'clock** for
the canvas/chrome use, and **spins around the ring** for the loading symbol (`pulse={true}`).

The wordmark is **QUANTFLOW** in Space Grotesk **600**, letterspaced (`0.28em`), with an optional
soft Live Green underline (glow, never harsh).

**Lockup** = `QFMark` + `QFWordmark` + optional `descriptor` (e.g. "Flow Ledger") + `tagline`.

`QFOrbit` is kept as a thin convenience alias for `QFMark pulse=true` — prefer `QFMark` directly.

**Canvas empty state:** `QFMark` large + faded (centered) with `QFWordmark` (soft underline)
beneath. Both recede as tiles fill the canvas (opacity driven by tile count — see
`components/CanvasWatermark.tsx`).

---

## 4. Color — meaning palette (add to shell.css :root)

See `tokens/shell-tokens.css` for exact values. Summary:

| Token | Meaning | Never use for |
|---|---|---|
| `--flow` / Live Green | Live · running · primary identity | Decorative glow; anything not live |
| `--cyan` | Tool · CLI type distinction (Codex CLI) | Primary brand |
| `--blue` | Agent · context routes | Errors |
| `--amber` | Queued · backpressure · armed · experimental | Success |
| `--coral` | Error · failed signal | Warnings |
| `--violet` | Memory / Envoy only — forward-looking | Active type rail |

---

## 5. Scope guardrail (do not get ahead of it)

Per `SCOPE.md` and `BUILD_PLAN_V2.md`:
- **Gate 2 active:** Legend spawn → herdr pane → interactive xterm.
- **Frozen until Gate 2 passes:** A2A, Envoy/memory tiles, Watchtower event stream, full legend palette.
- The `--violet` memory type, the Watchtower stream view, and bundled-route inspector in this design
  are **forward-looking targets** — designed for visual coherence, not a request to build them now.
- The `experimental` dock state and dashed-border tile state exist specifically to communicate
  "not ready yet" to the user — use them for anything not yet spawnable.

---

## 6. Visual reference index

Open `QuantFlow V2 System.html` in a browser. Sections and artboards:

| Section | Artboards | Key file targets |
|---|---|---|
| Canvas | Active canvas · Empty canvas | `shell/index.html`, `canvas-rpc.js`, `cable-renderer.js` |
| Components | Tile sheet · Cable sheet | `shell.css` `.canvas-tile`, `cable-renderer.js` |
| Chrome | Registry · Dock | `nav/src/App.tsx`, shell Legend renderer |
| Inspectors | Tile inspector · Cable inspector | `cable-inspector.js`, herdr session spawn |
| System | Watchtower | `diagnostics/health-runner.ts`, `probes.ts` |
| Brand | Brand mark sheet | `packages/components/src/brand/` |
| Foundations | Tokens + settings | `shell.css :root`, `settings/src/App.tsx` |
