# QuantFlow V2 — Design System

> **Authority:** `CONCEPT.md` (what QuantFlow is) · `SCOPE.md` (what's active).
> This doc defines the **visual language**. It does not change scope or build order.
> Visual exploration lives in `../QuantFlow V2 System.html` (open in the design tool).

QuantFlow is **Collaborator's canvas with herdr running the WSL work underneath** —
"tiles and strings on a map," where each WSL tile is a real terminal backed by a herdr
pane. V2 keeps that spine and gives it a **product language**.

**The final bar:** if the logo and app name were hidden, the interface should still be
identifiable as QuantFlow — because of its **cable language, tile anatomy, canvas field,
and operational status system.**

---

## 1. Product posture

QuantFlow V2 is a **live topology console for agent systems** — a serious orchestration
instrument, not a SaaS dashboard. The design is dark, technical, tactile, and intentional.

| Surface | Role |
|---|---|
| **Canvas** | A routed field. Tiles are operational nodes; cables are signal routes. |
| **Cables** | The primary brand signature. Glow means *flow / live state / routing activity* — nothing decorative glows. |
| **Tiles** | Operational nodes with a fixed header anatomy and a per-type role signature. |
| **Registry** (left) | The system index — agents/sessions grouped by class, with live/error counts. |
| **Dock** (rail) | The spawn / control surface — grouped, labelled, mode-aware. |
| **Status strip** | Health and flow readable at a glance. |
| **Watchtower** | System health + event stream (post Gate-3, `events.subscribe`). |

**Hard no's** (carried from the avoid-list): brighter/softer/SaaS-ification, purple-blue AI
gradients, generic cyberpunk, decorative orbs/blobs, glow that doesn't mean flow.

---

## 2. Color

Built on the live `shell.css` ramp. Dark neutral base, slightly tinted. **No pure black, no
pure white.** Green is the live-flow identity; every other hue carries a specific meaning.

### Surfaces
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0d12` | App background / chrome |
| `--ink` | `#06080c` | Deepest wells (tile body, canvas top) |
| `--canvas-bg` | `#0b0f15` | Canvas field base |
| `--tile-bg` / `--tile-bg-hi` | `#0f141b` / `#131923` | Tile surface / raised |
| `--border` / `--border-hi` | `#1c232d` / `#2a3340` | Hairline / emphasized |

The canvas **field floor** carries a *calibrated* violet wash (`#0e0a1a` → near-black, bottom→top)
plus a low green radial at the bottom-center origin. This is the toned-down evolution of the V1
`--canvas-gradient` — present enough to give depth, quiet enough to never read as "AI gradient."

### Meaning palette
| Token | OKLCH / hex | Means |
|---|---|---|
| `--flow` (accent) | **`#B7FF00`** Live Green | **Live flow, running, primary identity / signal** |
| `--flow-dim` | `oklch(0.78 0.18 128)` | Idle-but-present green |
| `--flow-bright` | `#caff4d` | Selected / endpoint emphasis |
| `--cyan` | `oklch(0.72 0.13 210)` | **Tool / CLI distinction** (Codex CLI, tools) |
| `--blue` (context) | `oklch(0.70 0.14 240)` | **Agent / context routes** |
| `--amber` | `oklch(0.80 0.14 80)` | **Queued / backpressure / armed** |
| `--coral` (error) | `oklch(0.68 0.19 25)` | **Error / failed signal** |
| `--violet` | `oklch(0.62 0.16 295)` | **Memory / context only** — never the main brand |

### Text & brand neutrals
`--fg #e7ecf2` · `--muted #6b7686` · `--muted-2 #4a5466` · `--faint #353d4a`

**Brand triad** (from the identity exploration): **Ivory `#F5F5F0`** (the mark's confident line/ring) ·
**Live Green `#B7FF00`** (the live signal) · **Slate `#1A1D21`** (inverted/app-icon ground).

---

## 3. Type

Three roles. Operational text is mono — it makes the product feel instrument-grade.

| Role | Family | Use |
|---|---|---|
| **Display / brand** | Space Grotesk | QF wordmark, section headers, large numerals |
| **UI** | Geist (→ system-ui) | Labels, registry names, buttons, body |
| **Operational** | IBM Plex Mono / Geist Mono | Terminal, badges, routes (`@id`), coordinates, status, counts |

Sizes (from shell tokens): `9.5 / 10.5 / 11.5 / 12.5 / 13` for chrome; tiles never below 10.5px
mono. Pills/eyebrows: uppercase, `letter-spacing: 0.06–0.08em`.

---

## 4. The QF brand — dial mark + wordmark

Two marks, one system:

- **Mark — the QF dial.** The **Q is rendered as a tactile dial**: dark filled disc + thick inset
  charcoal ring + Q tail at 4:30 + faint inner/outer edge highlights. The **F sits inside the dial in
  neon Live Green** (spine + top arm + middle arm, equal weight). A Live Green **signal dot** rides
  the ring — static for the canvas mark, **spinning** for loading.
  Used everywhere: **app icon, title bar, favicon, canvas watermark, loading, lockup**.
- **Wordmark — QUANTFLOW + soft neon underline.** Letterspaced QUANTFLOW in Space Grotesk **600**
  with a soft Live Green underline (low, glowing). Used for **headers, hero, about**.
- **Lockup** combines mark + wordmark + optional descriptor (e.g. "Flow Ledger") + tagline.

The dial reads as a real control — tactile, instrument-grade. The F + signal dot keep it unmistakably QF.

### Usage system
| Context | Treatment |
|---|---|
| Title bar / app icon | QF dial mark + small QUANTFLOW wordmark (no underline) |
| **Canvas background** | QF dial mark (faded) + QUANTFLOW with soft neon underline, centered |
| Loading | QF dial mark with signal dot spinning around the ring |
| Command palette | Small dial mark at the input |
| About / version | Full lockup — dial + wordmark + "Flow Ledger" descriptor + version |

On a busy canvas the watermark recedes (opacity ↓); in the empty state it anchors the gesture hints.

---

## 5. Cables — the signature system

Cables are drawn in world space (SVG `<g>` transformed by pan/zoom), so stroke width scales with
zoom — faithful to `cable-renderer.js`. Each cable is layered: **glow → main → flow (dash) → badge**.

| State | Treatment | Token |
|---|---|---|
| **Idle** | Thin, quiet, low-glow, muted stroke | `--cable-idle` |
| **Live** | Soft animated pulse traveling source→target (`cableFlow`, dash `2 14`, 1.6s) | `--flow` |
| **Selected** | Brighter route + endpoint emphasis (port halos) | `--flow-bright` |
| **Queued** | Denser/segmented pulse, amber — reads as backpressure | `--amber`, 0.9s |
| **Error** | Pressured/broken signal — coral, gapped dash, no smooth flow | `--coral` |
| **Bundled** | One readable grouped path + count badge (`#0d1218` fill, flow stroke ring) | width `3 + min(n,5)` |

Route hue also encodes **kind**: pipe = green, context = blue, trigger = amber (matches
`--cable-pipe / --cable-context / --cable-trigger`). Legibility when several overlap comes from
bundling (count badge) + selected-route brightening + dimming the rest.

---

## 6. Tiles — operational nodes

One **header anatomy** for every tile; the **role signature** is a 2px left **type rail** (colored
by role) + a type glyph chip. This makes type differences clear without adding clutter.

**Header (left→right):** `[type glyph chip] · parent/path · name · [ROLE badge] · @route-handle · [herdr:id] · [STATUS] · ×`

Tile chrome keeps the V1 details that already feel like QuantFlow: the **inset 2px left rail**, the
**crosshair corner overshoots** (`::before/::after` extend 9px past corners), and N/E/S/W **ports**.

### Node types & signatures
| Type | Rail | Glyph | Notes |
|---|---|---|---|
| Terminal session | `--flow` | `>_` | node-pty display (Windows) or herdr PTY |
| Generic CLI | `--flow` | `>_` | `GENERIC CLI` · `AUTO` |
| Codex CLI | `--cyan` | `</>` | `CODEX CLI` · `herdr:id` |
| Agent | `--blue` | `◆` | Hermes / orchestrator |
| Worker | `--amber` | `⚙` | task worker |
| Memory / Context | `--violet` | `◧` | Envoy-backed (later) |
| Tool | `--cyan` | `⌗` | MCP tool tile |

### States
`idle` (muted rail, low) · `running/active` (flow rail + running shadow + lit ports) ·
`selected` (bright-green border + rail) · `queued` (amber `STATUS`) · `blocked` (amber) ·
`error/exited` (coral border + `STATUS`). **Experimental / unfinished templates** render with a
dashed border + reduced opacity + an `EXPERIMENTAL` pill, and are non-spawnable until ready.

---

## 7. Status system

| Element | Meaning |
|---|---|
| **Health LED** (status strip) | `healthy` flow-green (breathing) · `degraded` amber · `down` coral |
| **Registry counts** | `LIVE` (flow) · `ERR` (coral) · `TILES` (fg) per workspace + per group |
| **Tile STATUS badge** | active/running (flow) · waiting (blue) · blocked/queued (amber) · error/exited (coral) |
| **herdr badge** | `idle` muted · `working` flow · `blocked` amber · `done` blue |

---

## 8. Spacing · radius · borders · shadows · motion

- **Spacing:** 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24
- **Radius:** tile 8 · card 7 · button 6 · pill 999 · type-rail 0 (square, structural)
- **Borders:** hairline 1px `--border`; emphasized `--border-hi`; type rail 2px (color = role)
- **Shadows:** `--sh-tile 0 6px 20px /.4` · running `0 0 0 1px flow-glow, 0 8px 24px /.55` · error variant
- **Motion:** `cableFlow` 1.6s linear · queued pulse 0.9s · `cablePulse` 0.65s on send · LED breathe 2s ·
  tile entrance 240ms ease. **Glow only signals flow/focus/live** — no idle decorative animation.

---

## 9. Implementation notes — mapped to the v2 file structure

| Design surface | Lives in |
|---|---|
| Tokens (`:root`) | `src/windows/shell/src/shell.css` — extend the existing ramp; add `--cyan/--blue/--violet/--amber` role tokens + per-type rail vars |
| Cable rendering | `src/windows/shell/src/cable-renderer.js` (+ `cable-math.js`, `cable-overlay.js`) — add `queued`/`error` classes alongside `cable-selected/sending/sent/failed`; bundle badge already present |
| Cable inspector | `src/windows/shell/src/cable-inspector.js` |
| Tile chrome / ports | `shell.css` `.canvas-tile`, `.tile-title-bar`, `.tile-*-badge`, `.tile-port` — add `--rail` color per `data-tile-type` |
| Canvas field + grid + watermark | `shell/index.html` (`#grid-canvas`, `#panel-viewer`) + `canvas-rpc.js`; QF watermark = new low-z layer behind `#tile-layer` |
| Registry / nav | `src/windows/nav/src/App.tsx` + `styles/App.css` (Files/Tiles modes, group headers, `RegistryRow`) |
| Spawn dock | shell renderer (Legend/dock) — roles from the spawn pipeline; `runtimeTarget` (`herdr-wsl` \| `windows-pty`) drives the herdr vs node-pty distinction |
| Status strip / health | `shell/index.html` `#status-bar`, `.status-led` |
| Watchtower | renderer Watchtower view — **2s polling stays until Gate 3** (`events.subscribe`), per `RETIREMENT.md` |
| Settings / tokens | `src/windows/settings/src/App.tsx` |
| Brand mark asset | new shared SVG (e.g. `packages/components/src/brand/QFMark.tsx`); compact form for titlebar + app icon (`build/icon.*`) |

**Scope guardrail:** Watchtower evolution, full legend palette, A2A/Envoy memory tiles, and custom
tile forms are **frozen until Gate 2 passes** (`SCOPE.md`). The memory/context (violet) type and the
Watchtower event stream are designed here as *forward-looking targets*, not a request to build them now.
