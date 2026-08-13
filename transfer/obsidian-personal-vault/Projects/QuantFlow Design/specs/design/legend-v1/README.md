# Legend v1 — Implementation Handoff

**Slice 1 deliverable.** Spawn dock pinned to the left edge of the canvas viewer.
Six one-click recipes (Hermes, Codex CLI, Claude Code, PufferLib worker,
Python script, Generic CLI), grouped Agents / Workers / Shell, plus a
Templates section with the RL Training proof layout and a prominent
Commence control.

## Canonical artboards

The implementation should match these visuals verbatim — no placement
or hierarchy changes without explicit sign-off.

| | @1x | @2x | Source |
|---|---|---|---|
| **17 · in context** (armed, compact) | [`exports/artboard-17-1x.png`](artboard-17-1x.png) | [`exports/artboard-17-2x.png`](artboard-17-2x.png) | [`exports/artboard-17-armed.html`](artboard-17-armed.html) |
| **18 · states reference** | [`exports/artboard-18-1x.png`](artboard-18-1x.png) | [`exports/artboard-18-2x.png`](artboard-18-2x.png) | [`exports/artboard-18.html`](artboard-18.html) |

> Note: filenames use `-1x` / `-2x` (not `@1x` / `@2x`) because the project
> filesystem rewrites `@` characters in paths. Treat them as the iOS-style
> 1x and 2x exports.

## Contents

- [`tokens.json`](tokens.json) / [`tokens.md`](Projects/QuantFlow%201/specs/design/legend-v1/tokens.md) — every measurement,
  color, radius, type spec a developer needs. Single source of truth — if
  this disagrees with the PNGs, the JSON wins.
- [`anatomy.md`](anatomy.md) — DOM structure + class/data-attribute hooks
  for each state.
- [`interactions.md`](interactions.md) — click behaviour, arm/commence flow,
  reset semantics.
- [`content.md`](content.md) — final copy for every label, tooltip, button.
- [`clarifications.md`](clarifications.md) — open questions answered:
  RL template tile count, Hermes role color provenance, etc.
- [`icons/`](icons/) — extracted SVG assets (recipe glyphs, dock chrome,
  Commence states, density + spawn toggles).
- [`exports/`](exports/) — the canonical PNGs and the source HTML used to
  generate them. The HTML files are runnable in any browser and serve as
  a live reference for hover/click states the PNGs can't capture.

## What's out of scope for Slice 1

Read [`clarifications.md`](clarifications.md) for the full list. Headline
omissions: real herdr / Envoy wiring, string inspector, role editor.

## Vault path

Commit this folder under `Projects/QuantFlow/specs/design/legend-v1/` and
reference it from the Slice 1 GoalBuddy task.
