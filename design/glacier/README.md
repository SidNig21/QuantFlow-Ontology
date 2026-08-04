# GLACIER — QuantFlow Ontology visual language

Design assets for the full visual swap. **Reference material, not shipped code.**
Nothing here is imported by the application.

## Build sequence

Five orders, in dependency order. One branch each, per `docs/orders/PROTOCOL.md`.

| order | scope | depends on |
| --- | --- | --- |
| [WO-g1](../../docs/orders/WO-g1-glacier.md) | tokens + terminal ANSI palette | — |
| [WO-g2](../../docs/orders/WO-g2-glacier-tile.md) | tile: spine, states, arm/confirm close, dblclick expand | g1 |
| [WO-g3](../../docs/orders/WO-g3-glacier-dock.md) | dock: masthead, ask, launcher, ledger | g1 |
| [WO-g4](../../docs/orders/WO-g4-glacier-shell.md) | title bar, file rail re-skin, canvas, z-layer scale | g1 |
| [WO-g5](../../docs/orders/WO-g5-glacier-cables.md) | cables: ports, overlay, draw, Kernel persistence | g2 + g4 |

g2, g3, and g4 are independent of each other and can run in parallel on separate
branches once g1 is merged. **g5 is the only one that is a build rather than a
re-skin** — no cable code exists in this repo today.

| file | what it is |
| --- | --- |
| `showcase.html` | Full-app mock — shell chrome, file rail, canvas, dock, two cabled tiles. Open in a browser. |
| `tile-spec.html` | The tile alone: anatomy, arm/confirm close, four session states, focus / drag / narrow, cabled pair. |
| `qf-tokens.additions.css` | **The only file meant to be copied verbatim** — append into `collab-electron/src/windows/shared/qf-tokens.css`. |
| `glacier.reference.css` | Component CSS. Reference only — contains literals and must be tokenised before it ships. See the warning below. |
| `qf-ansi.reference.ts` | Drop-in replacement for `packages/components/src/Terminal/theme.ts`. |
| `CABLE-PLUMBING.md` | Scope and integration spec for canvas cables. |

## Before you copy anything

**`glacier.reference.css` will fail CI as-is.** The `one-skin` gate
([`qa/gates/one-skin.ts`](../../qa/gates/one-skin.ts)) scans every `.css` `.ts`
`.tsx` `.js` under `collab-electron/src/windows/` and fails on:

- any raw hex — `#0f1727`
- any `rgb()` `rgba()` `hsl()` `hsla()`
- any `font-family` that is not exactly `var(--qf-mono)` or `var(--qf-sans)`

The only exempt file is `qf-tokens.css` itself. So:

1. Append `qf-tokens.additions.css` into `qf-tokens.css`.
2. Rewrite `glacier.reference.css` so every colour, shadow, and radius reads
   `var(--qf-gl-*)` and every `font-family` reads `var(--qf-mono)` or `var(--qf-sans)`.
3. `color-mix(in srgb, var(--qf-gl-ice) 38%, transparent)` is fine — the gate does
   not match it.

`packages/components/src/Terminal/theme.ts` is **outside** the gate surface
(`packages/`, not `windows/`), so `qf-ansi.reference.ts` can be copied as-is.

## The three rules of the language

1. **Elevation is lightness, never glow.** Surfaces climb the ramp to come forward.
   A coloured halo on a dark surface is the tell this language exists to avoid.
2. **Ice marks live things only.** Focus, a running session, a connected port. It
   never decorates a name, an id, or a button label.
3. **Status is never colour alone.** Every state carries a mark and a word beside
   the hue.

## The tile in one paragraph

A tile is an operational record mounted on the canvas. It hosts a WSL PTY stream;
agents are launched into it by CLI. It renders nothing of its own and never varies
by dock catalog item. The spine has exactly three zones — head (status → arm →
close), id (vertical), grip (drag handle) — and there are no floating icon buttons.
Double-click the spine toggles fullscreen. Cable nodes sit at the four cardinals.
