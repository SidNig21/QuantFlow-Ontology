# Legend v1 — Content Map

Final copy for every visible string. Do not paraphrase; do not localize
in slice 1.

---

## Dock header

| Surface | Density | String |
|---|---|---|
| Title | comfortable | `Legend` |
| Eyebrow | comfortable | `spawn` |
| Glyph | compact | (no text — double-chevron icon) |

---

## Group labels

| Surface | Density | String |
|---|---|---|
| Group `agents` | comfortable | `Agents` |
| Group `workers` | comfortable | `Workers` |
| Group `shell` | comfortable | `Shell` |
| Section divider | compact | (no text — 1px top-border only) |
| Templates section | comfortable | `Templates` (left) · count (right) |
| Templates section | compact | `TMPL` (centered) |

All comfortable labels are UPPERCASE via CSS `text-transform` — store as
title-case in source so screen readers don't read them letter-by-letter.

---

## Recipes

Order matters (top-to-bottom). All strings are final.

| Group | Name (label) | Description (sub) | Tooltip (compact) |
|---|---|---|---|
| Agents | `Hermes` | `Sync · gossip rooms` | name + description, stacked |
| Agents | `Codex CLI` | `Local Codex agent` | name + description, stacked |
| Agents | `Claude Code` | `Implementation agent` | name + description, stacked |
| Workers | `PufferLib worker` | `RL training · dumb` | name + description, stacked |
| Workers | `Python script` | `One-shot script` | name + description, stacked |
| Shell | `Generic CLI` | `Plain shell terminal` | name + description, stacked |

> **"dumb"** in "RL training · dumb" is intentional — refers to the worker
> being un-orchestrated (no agent layer). If product copy wants to soften,
> swap to "RL training · raw" or "RL training · worker". Don't ship "dummy"
> or anything that reads as user-disparaging.

---

## Templates

| Field | Value |
|---|---|
| Name | `RL Training` |
| Summary | `Hermes ↔ PufferLib · paper trade loop` |
| Meta | `2 tiles · 1 string` |
| Armed badge | `● ARMED` |
| Compact label | `RL` |

---

## Commence button

| State | Density | Primary label | Sub-label |
|---|---|---|---|
| idle | comfortable | `Commence` | `Arm a template first` |
| armed | comfortable | `Commence` | `Start armed workers` |
| running | comfortable | `Running` | `Workers live` |
| idle | compact | `GO` | (no sub) |
| armed | compact | `GO` | (no sub) |
| running | compact | `LIVE` | (no sub) |

Sub-labels are UPPERCASE via CSS. The Commence button uses its sub-label
to communicate state more loudly than a tooltip — read pre-Commence and
mid-running, that line is the "what does this do now?" answer.

---

## Footer toggles

| Toggle | Compact label | Comfortable label |
|---|---|---|
| Density (currently compact) | (icon only) | `Density · comfortable` (action label — clicking switches *to* comfortable) |
| Density (currently comfortable) | (icon only) | `Density · compact` |
| Spawn mode (center) | (icon only) | `Spawn · center` |
| Spawn mode (click-to-place) | (icon only) | `Spawn · click-to-place` |

The toggle labels show the **current** value, not the action. Hover title
attribute (`title=…`) describes the action:

| Toggle | Current | `title` attr |
|---|---|---|
| Density | compact | `Comfortable density` |
| Density | comfortable | `Compact density` |
| Spawn | center | `Click-to-place` |
| Spawn | click | `Viewport center` |

---

## Tile chrome (spawned tiles)

| Field | Value |
|---|---|
| Title | `[recipe.tileTitle]` — see table below |
| Status pill (template, pre-commence) | `PENDING` |
| Status pill (running) | `LIVE` |
| Status pill (idle single-spawn) | `IDLE` |
| Status pill (exited) | `EXIT` |
| Body (template, pre-commence) | `[recipe.sample]` (line 1) · `Awaiting Commence` (line 2) |
| Body (running, sample) | `[recipe.sample]` (line 1, role color) · contextual hint (line 2) · meta (line 3) · `$ ▌` (line 4) |
| Body (single-spawn, idle) | `[recipe.sample]` (muted) · `Idle · click to focus` (muted2) |

### Tile titles by recipe

| Recipe | Tile title |
|---|---|
| hermes | `hermes` |
| codex | `codex` |
| claude | `claude` |
| puffer | `pufferlib` |
| python | `python` |
| shell | `shell` |

### Sample command line per recipe

| Recipe | Sample |
|---|---|
| hermes | `envoy listen` |
| codex | `codex` |
| claude | `claude` |
| puffer | `pufferlib serve --no-start` |
| python | `python ./run.py` |
| shell | `$` |

> `pufferlib serve --no-start` is the canonical "armed but not running"
> command — the `--no-start` flag is the worker's promise to render its
> shell but not begin RL training until told. Mirror this convention if
> Hermes or others grow analogous flags.

### Running body — line 2 ("contextual hint")

| Recipe | Line 2 (running) | Line 3 (meta) |
|---|---|---|
| hermes | `envoy listen · room admin` | `space: rl-loop-01` |
| puffer | `starting RL loop · seed 42` | `env: cartpole-v1  agents: 16` |
| (others) | `ready` | (empty) |

These are **stand-ins for v1 visuals**. Wire real telemetry when herdr /
Envoy integration lands.

---

## Empty-canvas state

When no tiles exist (post-load, pre-spawn):

```
Empty canvas
Click a spawn recipe to drop a tile · arm a template to chain
```

- Line 1: `system-ui`, `13px`, color `#6b7686`
- Line 2: `ui-monospace`, `11px`, color `#4a5466`, marginTop `6px`

Position: centered horizontally, top `40%` of canvas. Removed the moment
a tile (any kind) appears.

---

## Spawn-mode banner (canvas overlay)

Permanently visible chip at top-right of the canvas (next to the `+` new-tile button):

| Mode | Text |
|---|---|
| center | `spawn · viewport center` |
| click | `spawn · click-to-place` |

Style: mono `10px`, color `#4a5466`, padding `4px 10px`, radius `999`,
bg `rgba(10,13,18,0.6)`, border `1px solid #1c232d`, backdrop-blur `6px`.

This chip is informational only — clicking it does NOT toggle the mode.
Use the footer toggle.
