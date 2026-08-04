# WO-g2 — GLACIER tile: spine chrome, states, close, expand

status: DRAFT — needs founder authorization
branch: `wo-g2-glacier-tile`
program: GLACIER full visual swap · order 2 of 5
depends on: **WO-g1 merged** (`--qf-gl-*` tokens must exist)
ladder: non-ladder. Must not edit `NEXT.md` / `GOLDEN-RUN.md`.

Spec: [`design/glacier/tile-spec.html`](../../design/glacier/tile-spec.html) —
open it in a browser. It is the acceptance reference, not prose.

---

## What the tile is

An operational record mounted on the canvas, hosting a WSL PTY stream. Agents are
launched into it by CLI. **It renders nothing of its own and never varies by dock
catalog item.** Every tile looks the same; only the stream differs.

## The spine — three zones, no floating icons

| zone | height | behaviour |
| --- | --- | --- |
| head | 44px | status light → hover shows `CLOSE` → click **arms** (coral, `SURE?`) → second click closes. Arm lapses after 2000ms. |
| id | flex | session id, `writing-mode: vertical-rl` |
| grip | 44px | three rules. Marks the spine as the drag handle. |

Spine width 44px (`--qf-gl-spine`). **Double-click anywhere on the spine toggles
fullscreen.** Cable nodes at the four cardinals — static in this order, no
interaction (that is WO-g5).

The 18px `⛶` and `×` buttons are **removed entirely.**

## Deliverables

1. `collab-electron/src/windows/shell/src/shell.css` — replace the tile block at
   **`:912–1093`**: `.canvas-tile`, its `::before`/`::after` crosshair overshoot,
   `.tile-title-bar`, `.tile-btn-group`, `.tile-action-btn`, `.tile-close-btn`,
   `.tile-content`. Port `design/glacier/glacier.reference.css`, **tokenised** — see
   the gate trap below.
2. `collab-electron/src/windows/shell/src/tile-renderer.js` — restructure the markup.
   Today: `titleBar (:62) → titleGroup (:78) + badges (:82) + navGroup (:101) +
   btnGroup (:173) + copyBtn (:184) + fsBtn (:199) + closeBtn (:211)`, then
   `contentArea (:240)`. Becomes: `spine(head, id, grip) + body(title, screen)`.
3. `tile-renderer.test.ts` — updated in **this commit**, not after.
4. Arm/confirm state machine. Clear the armed state on `mouseleave`, on `blur`, and
   on the 2s timer.
5. Rebind fullscreen from the removed `fsBtn` to `dblclick` on the spine, without
   breaking drag-start in `tile-interactions.js`.

## The gate trap — read before writing CSS

`qa/gates/one-skin.ts` scans every `.css .ts .tsx .js` under
`collab-electron/src/windows/` and fails on **any** raw hex, `rgb()/rgba()/hsl()`,
or a `font-family` that is not literally `var(--qf-mono)` or `var(--qf-sans)`.
Only `qf-tokens.css` is exempt.

- `glacier.reference.css` **will fail as shipped** — it contains `rgba()` shadows.
  Use `var(--qf-gl-shadow)`, `var(--qf-gl-edge-light)`, `var(--qf-gl-screen-ring)`.
- Do not introduce `--qf-gl-mono`. The gate regex is
  `/^var\(\s*--qf-(?:mono|sans)\s*\)$/`. Reuse `--qf-mono` / `--qf-sans`.
- `color-mix(in srgb, var(--qf-gl-ice) 38%, transparent)` is **not** matched. Use it
  for tints.

## Acceptance gates

1. **`bun qa/run.ts one-skin` passes.** *Fails if:* any literal survives the port.
   This is the gate most likely to go red — a single `rgba(0,0,0,.95)` fails it.
2. **`bun test collab-electron/src/windows/shell/src/tile-renderer.test.ts` passes**
   with assertions covering the new structure. *Fails if:* tests still assert
   `.tile-title-bar` / `.tile-action-btn`, which no longer exist.
3. **New test: arm/confirm.** One click on the head does **not** close. Two clicks
   within 2s does. One click then 2100ms then one click does **not**.
   *Fails if:* a single click closes — that is the destructive bug this design exists
   to prevent.
4. **New test: dblclick spine toggles fullscreen and does not start a drag.**
5. **`bun qa/run.ts typecheck` and `rung-ladder` pass.**
6. **Receipts** in `docs/orders/evidence/wo-g2/`: a real streaming tile at rest,
   hovered, armed, focused, dragging, and at 200px wide. *Fails if:* blank or error
   tiles are submitted as evidence.

## Known risk to report on, not to silently absorb

Chrome moves from ~28px vertical to 44px horizontal, so **minimum tile width grows
and saved canvas layouts may reflow.** Load an existing canvas with ≥4 tiles and
report what happens. If tiles clip, stop and report — do not "fix" it by shrinking
the spine.
