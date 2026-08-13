# Design tokens — semantic reference

Single source of truth: `Theme.css`. Every other stylesheet reads through these
variables. Change a token here → entire app reflows.

## Surface ramp (deepest → top)

| Token | Value | Where it's used |
|---|---|---|
| `--bg` | `#0a0d12` | Window background, sidebar, watchtower |
| `--canvas-bg` | `#0c1117` | Flat canvas fallback |
| `--canvas-bg-hi` | `#0f141b` | Elevated canvas surfaces |
| `--canvas-gradient` | linear purple→black | Apply to `#panel-viewer` background |
| `--tile-bg` | `#0f141b` | Tile body |
| `--tile-bg-hi` | `#131923` | Hover / focused tile body |

## Borders

| Token | Value | Where |
|---|---|---|
| `--border` | `#1c232d` | Generic dividers |
| `--tile-border` | `#1c232d` | Default tile border |
| `--tile-border-hi` | `#2a3340` | Focused/hovered tile border |

## Text

| Token | Value | Role |
|---|---|---|
| `--fg` | `#e7ecf2` | Primary text |
| `--muted` | `#6b7686` | Secondary |
| `--muted-2` | `#4a5466` | Tertiary, eyebrows, kbd hints |

## Accent (terminal green)

| Token | Value | Role |
|---|---|---|
| `--accent` | `oklch(0.78 0.16 145)` | Live indicators, default cable, brand glyph |
| `--accent-dim` | `oklch(0.62 0.13 145)` | Inactive accent (low-emphasis live) |
| `--accent-glow` | `oklch(0.78 0.16 145 / 0.18)` | Halos, soft glows |

## Status (semantic)

| Token | Value | Used when |
|---|---|---|
| `--running` | green | Tile or agent is producing output |
| `--idle` | `--muted` | Inactive, not running |
| `--selected` | bright green | User-selected tile/cable |
| `--failed` | `oklch(0.68 0.19 25)` | Error state, last message errored |
| `--armed` | `oklch(0.78 0.14 80)` | Primed but waiting upstream |

## Cables (semantic kinds)

| Token | Value | Cable kind |
|---|---|---|
| `--cable-pipe` | green | `kind: "pipe"` — stdout/stdin piping |
| `--cable-context` | blue | `kind: "context"` — read-only context wire |
| `--cable-trigger` | amber | `kind: "trigger"` — event/trigger wire |
| `--cable-default` | translucent green | Visible idle cable |
| `--cable-hover` | bright green | Mouse-over a cable |
| `--cable-selected` | bright green | After click-select |
| `--cable-failed` | red | Last message errored |
| `--cable-idle` | translucent gray | Source not running |

### Cable stroke widths

| Token | Value | When |
|---|---|---|
| `--cable-w-default` | `1.6px` | Single cable |
| `--cable-w-bundle` | `3px + min(count,5)` | Bundled cables (formula in `cable-renderer.js`) |
| `--cable-w-hit` | `14px` | Invisible hit area |

## Typography scale

| Token | Size | Used for |
|---|---|---|
| `--fs-xxs` | `9.5px` | Status pills, eyebrows |
| `--fs-xs` | `10.5px` | Terminal output (mono) |
| `--fs-sm` | `11.5px` | Tile titles, sidebar rows |
| `--fs-md` | `12.5px` | Body |
| `--fs-lg` | `13px` | Tile content headers |
| `--fs-xl` | `15px` | Hero numbers (data tiles) |
| `--fs-2xl` | `18px` | Equity-curve hero |

Line-heights: `--lh-body 1.5` / `--lh-terminal 1.65`.

Letter-spacing: `--ls-eyebrow 0.1em` (uppercase sections), `--ls-pill 0.06em`.

## Spacing

`--space-1` … `--space-8` = 4 / 6 / 8 / 10 / 12 / 14 / 18 / 24 px.

Tile internals: `--tile-pad-y 8px`, `--tile-pad-x 14px`, `--tile-title-pad-y 7px`, `--tile-title-pad-x 12px`.

## Radii

| Token | Value | For |
|---|---|---|
| `--r-tile` | `8px` | Tile body (was `0px` — bumped in redesign) |
| `--r-card` | `7px` | Inner cards (agent state cards) |
| `--r-button` | `6px` | Buttons |
| `--r-modal` | `12px` | Modals |
| `--r-pill` | `999px` | Pills, kbd hints |
| `--r-input` | `6px` | Search, command bar |

## Shadows

| Token | Value | Used for |
|---|---|---|
| `--sh-tile` | `0 6px 20px rgba(0,0,0,0.4)` | Idle tile |
| `--sh-tile-running` | layered halo + drop | Running tile |
| `--sh-tile-error` | red halo + drop | Failed tile |
| `--sh-floating` | strong drop + inner highlight | Floating panels |
| `--sh-port-live` | `0 0 6px --accent-glow` | Live tile ports |

## Z-index

| Token | Value | Layer |
|---|---|---|
| `--z-canvas-bg` | 0 | Grid background |
| `--z-tile` | 100 | Tile bodies |
| `--z-tile-focused` | 101 | Focused tile |
| `--z-cable-layer` | 102 | Cable SVG (between tiles and edge indicators) |
| `--z-port` | 103 | Port circles on tile edges |
| `--z-edge-indicator` | 104 | Off-canvas edge dots |
| `--z-watchtower` | 200 | Bottom panel |
| `--z-tooltip` | 300 | Tooltips |
| `--z-modal` | 400 | Modals |

## Animation timings

| Token | Value | Where |
|---|---|---|
| `--t-port-show` | `0.12s` | Port fade-in on tile hover |
| `--t-cable-flow` | `1.6s` | Flowing dashes on live cables |
| `--t-cursor-blink` | `1.1s` | Terminal cursor |
