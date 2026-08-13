# Acceptance checklist

Hand this to QA (or run it yourself at the end). Every box ticked = redesign shipped.

## App-level

- [ ] Boots dark by default. No white-flash on cold start.
- [ ] All text legible against `--bg` and `--canvas-bg`. No `#000 on #000`.
- [ ] Alpha label is a small pill at top-left of the titlebar (not screaming red bottom-center).
- [ ] Mouse cursor is `default` everywhere except: `grab` on tile title bars, `crosshair` on ports, `pointer` on cables and buttons.

## Tokens

- [ ] `--accent`, `--cable-pipe`, `--cable-context`, `--cable-trigger` all reach the rendered DOM (inspect → computed styles).
- [ ] Changing `--accent` in DevTools recolors: tile spine on live tiles, ports, cables, sidebar Q glyph, sidebar live count, watchtower throughput sparkline, watchtower tab underline, all "LIVE" pills. Nothing should be hardcoded to green.

## Tile states

| State | Spine | Border | Shadow | Pill | Dot |
|---|---|---|---|---|---|
| **idle** | `--tile-border-hi` | `--tile-border` | `--sh-tile` | none | `--muted-2` |
| **running** | `--accent` + glow | accent 40% | `--sh-tile-running` | "LIVE" green | accent + glow |
| **failed** | `--failed` + glow | failed 40% | `--sh-tile-error` | "ERR" red | red + glow |
| **selected** | `--selected` | `--selected` | normal + sit at `--z-tile-focused` | none | inherits |
| **armed** | `--armed` (amber) | amber 40% | normal | "ARMED" amber | amber |

Verify in DevTools by toggling `data-running`, `data-status`, `data-selected` on a `.canvas-tile`.

## Tile content (decision #3 — "the tile IS the content")

- [ ] **Terminal tiles** — show last N lines of stdout, monospace, cursor blink visible.
- [ ] **Note tiles** — first N markdown lines rendered with `## ` headings + `- ` bullets + `> ` quotes styled. Updated-at footer.
- [ ] **Browser tiles** — fake URL bar at top; content area shows live thumbnail (or a labeled placeholder).
- [ ] **Data tiles** — hero number top-left (e.g. `+18.4%`), sparkline below, axis labels mono.
- [ ] **Agent tiles** — compact stat readout (k=v pairs), no terminal output.

## Cables

| State | Stroke | Animation |
|---|---|---|
| **default** (source idle) | `--cable-idle`, 1.6px, 90% opacity | none |
| **default** (source running) | `--cable-default`, 1.6px, 100% opacity | flowing dashes |
| **hover** | `--cable-hover` | flow continues |
| **selected** | `--cable-selected` + glow halo | flow continues |
| **failed** | `--cable-failed` | flow desaturated |
| **armed** | `--armed` (amber) | flow paused |
| **bundled** | base stroke + `min(count, 5)`px, count badge at midpoint | inherits source state |

- [ ] Bezier curves render with directional tangents — short cables snap, long cables arc gently.
- [ ] Cable preview path during drag is dashed + translucent, follows cursor through pan/zoom.
- [ ] Shift-click anywhere on a cable's hit area deletes it (and bundle-mates if applicable).
- [ ] Cable layer pans + zooms in lockstep with tiles — no parallax.

## Ports

- [ ] Hidden by default. Reveal on tile hover OR while a cable drag is in progress.
- [ ] Live tiles' ports glow continuously (regardless of hover).
- [ ] Hover scales 1.3× and increases glow.
- [ ] All four sides reachable (N/E/S/W).

## Sidebar (Tile Registry)

- [ ] Header shows workspace name + running count + error count.
- [ ] Tiles grouped by workflow chain with eyebrow + count per group.
- [ ] Click a row → focuses that tile in the canvas.
- [ ] Filter input live-filters by name + host substring.
- [ ] Collapsed rail (width 56) shows one icon per chain with a corner dot when any tile in the chain is live or errored.

## Watchtower

- [ ] Default tab is **Events**; tabs at top: Events / Queues / Agents / Alerts with counts.
- [ ] Top bar: title + LIVE dot + filter input + pause / clear / collapse buttons.
- [ ] Right rail (340px wide) always visible: throughput sparkline + per-cable queue-depth bars + agents rollup.
- [ ] Hot cables (peak > 8) render in amber instead of green.
- [ ] Alerts tab: shows zero-state when no alerts; cards with Acknowledge button when there are.

## Viewport sanity at 1280×720

- [ ] Sidebar expanded (252px) + main viewer + Watchtower (220px) all fit; no horizontal scrollbars.
- [ ] At least 3 tiles fit comfortably in the canvas area.
- [ ] Watchtower right rail wraps gracefully (queue bars stay 80px min).

## Viewport sanity at 1920×1080

- [ ] All four prototype chains (Trading / Training / Monitoring / Scratchpad) visible on canvas without scrolling.
- [ ] No text under 11px (except mono eyebrows + axis labels which are 9.5px).
- [ ] No element pushed flush against window edges — `--nav-inset 12px` minimum.

## Pan / zoom

- [ ] Cables transform identically to tiles — pinch-zoom, pan with spacebar or trackpad, cable bezier shape unchanged at any zoom.
- [ ] Cable hit areas remain clickable at all zoom levels.
- [ ] Edge indicators (`#edge-indicators`) still appear when tiles scroll off-screen.

## State persistence

- [ ] `canvas-state.json` schema bumped to `version: 2` with top-level `cables: []`.
- [ ] v1 files migrate transparently (cables default to `[]`).
- [ ] Adding/removing a cable triggers the same debounced 500 ms save as tile mutations.
- [ ] Reload preserves: tile positions, cable list, sidebar collapsed state, accent color.

## "Do not implement yet" — explicitly NOT in this pass

See `NON_GOALS.md`.
