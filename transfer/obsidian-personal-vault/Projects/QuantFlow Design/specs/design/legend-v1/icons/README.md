# Legend v1 — SVG asset index

All icons are inline-able. The recipe icons embed their role color
directly in the `stroke` attribute; UI-chrome icons use `currentColor`
so the parent's CSS `color` can re-tint them.

## Recipe glyphs (use inside `.lv1-recipe__disc`)

| File | Role color | Used for |
|---|---|---|
| `hermes.svg` | #06b6d4 (placeholder) | Hermes |
| `codex.svg` | #38bdf8 | Codex CLI |
| `claude.svg` | #f97316 | Claude Code |
| `puffer.svg` | #f59e0b | PufferLib worker |
| `python.svg` | #6366f1 | Python script |
| `shell.svg` | #64748b | Generic CLI |

## Dock chrome

| File | Tints with | Used for |
|---|---|---|
| `legend-glyph.svg` | inline #5bd17a | Compact-density header glyph |
| `template-rl.svg` | inline (cyan + amber) | RL Training template card |
| `armed-badge-dot.svg` | inline #5bd17a | Optional small dot for "● ARMED" |

## Commence

| File | Tints with | Used for |
|---|---|---|
| `commence-play.svg` | currentColor | Idle and armed states |
| `commence-pause.svg` | currentColor | Running state |

## Footer toggles

| File | Tints with | Used for |
|---|---|---|
| `density-compact.svg` | currentColor | Density toggle (current = compact) |
| `density-comfortable.svg` | currentColor | Density toggle (current = comfortable) |
| `spawn-center.svg` | currentColor | Spawn mode toggle (current = center) |
| `spawn-click.svg` | currentColor | Spawn mode toggle (current = click-to-place) |

## Tile utilities

| File | Tints with | Used for |
|---|---|---|
| `tile-close.svg` | currentColor | Tile `×` close button |
| `new-tile-plus.svg` | currentColor | Canvas top-right `+` button |
| `group-divider.svg` | inline #1c232d | Compact-density section divider (optional — easier to just CSS `border-top`) |
