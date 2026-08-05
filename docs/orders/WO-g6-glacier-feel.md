# WO-g6 — Glacier feel: affordances, live ledger, framing

status: open
assignee: builder
depends: WO-g2 (tile spine), WO-g4 (shell/canvas), WO-g5 (cables) — all landed on `main`

## Objective

Make the canvas answer three questions without the founder guessing: *can I grab this*, *did my action land*, and *is anything happening*.

## In plain terms

Right now the app looks finished but does not feel finished. You cannot always tell what is draggable, a cable you successfully drew looks like it failed, the activity bar sits still while the system is busy, and Tidy does not put your work back on screen. This order fixes how it feels to use, and changes nothing about what is true underneath.

## Why this order exists — read this first

WO-g5 shipped with **13 passing unit tests** covering cable math, honesty rendering, orphan cascade, and the keyboard seam. Its own evidence closes with:

> *"Screenshots + restart persistence proof need package-click after rebuild."*

The click test was deferred and never run. The founder ran it on 2026-08-05, five minutes after the first matching package existed, and reported four problems. **The parts worked; the thing did not.** Do not let this order end the same way — its acceptance requires the app running, not only a green suite.

## Measured evidence — do not re-diagnose this

The founder reported "cables do not attach to one another". **That report is wrong about the mechanism, and the Kernel proves it.** From `~/.quantflow/kernel.db`:

```
2026-08-05T04:32:17.308Z  connection.created
  { "command": "create_connection", "kind": "view",
    "from_ref": "tile-1785904313703-3:w",
    "to_ref":   "tile-1785904279575-2:e" }

2026-08-05T04:34:40.043Z  connection.deleted   (orphan cascade)
2026-08-05T04:34:40.226Z  agent_session.closed (183 ms later)
```

The cable attached, wrote through `create_connection`, persisted, and was correctly removed by the cascade when its tile closed. **The write path is not broken.**

What is broken is legibility: ADR-0003 requires declared cables to render as *dashed curves with hollow nodes*, and to the founder that reads as a failed connection rather than as "declared, not yet honoured". The honesty marker is doing its job and communicating the wrong thing.

## Deliverables

### D1 · Cable legibility — "declared" must not look like "failed"

Keep the ADR-0003 distinction; change how it reads. Dashed-and-hollow must remain visually distinct from solid-honoured, but must stop reading as an error or an incomplete drag.

- On successful create, give an unmistakable **confirmation** — a brief settle animation on the curve, endpoint nodes seating into the ports, or equivalent.
- Give the state a **name the founder can see**: the inspector already prints a runtime-honour line; surface the same fact at the cable itself (hover or selection), in words, e.g. `declared · no runtime honours this yet`.
- Distinguish three states clearly: *drag in progress*, *declared (dashed/hollow)*, *rejected* (duplicate, cross-workspace, invalid port). A rejection today is indistinguishable from a successful declaration.

**Do not** make declared cables solid. Solid means honoured. Overstating honour is a false close (ADR-0003).

### D2 · Cables track their tiles

Verify and, if needed, fix: a declared cable must follow both endpoints live while a tile is dragged, resized, or moved by Tidy — recomputing through `cable-math.js`, not by storing coordinates.

The founder could not confirm whether this works. **Establish it with a runnable check before writing any code**, and report the answer either way.

### D3 · Tile affordances

Make the tile spine's interactive regions discoverable and forgiving:

- **Move** — the grab region must be obvious at rest, not only on hover, and must show a `grab` / `grabbing` cursor.
- **Resize** — resize handles need a hit area larger than their visual footprint (a visually 4px edge should accept roughly 8–10px of pointer slop).
- **Ports** — cable-source ports need the same treatment: visible at rest when the canvas is in a state where connecting is possible, with a hit target that does not demand pixel accuracy.
- Every affordance gets a hover state and a focus-visible state. Keyboard reachability must not regress the g5 keyboard seam.

### D4 · Kernel ledger shows live movement

The ledger bar does not reflect Kernel activity. It should. The Kernel wrote four events during the founder's session (`connection.created`, `connection.deleted`, `agent_session.started`, `agent_session.closed`) and the bar stayed still.

- Subscribe to the Kernel event stream and render events as they are appended.
- Newest first, with event type, object type, and a relative timestamp.
- **Projection only.** The ledger renders `events` rows; it never caches, derives, or invents them, and it holds no state of its own (Law A).
- Empty state must say the system is idle, not look broken.

### D5 · Tidy reframes the workspace

Tidy currently rearranges without bringing the result on screen. After Tidy, every tile must be visible in the viewport.

- Compute the bounding box of all tiles, then set zoom and pan so the box fits with a margin.
- Respect the z-scale ceiling from WO-g4 (≤30) and the 24px grid.
- Animate the reframe rather than snapping; a viewport that teleports loses the founder's sense of place.
- Tidy with no tiles is a no-op, not an error.

## Contract

These may not be violated:

- **`one-skin` stays green.** No raw hex, rgb, hsl, or non-token font-family outside `collab-electron/src/windows/shared/qf-tokens.css`. Extend the `--qf-gl-*` token set if you need new values; do not introduce a second palette or import an external design system.
- **Law A — a tile that remembers is a bug.** No affordance, ledger entry, or cable position may become durable UI state. `no-canvas-domain-writes` stays green.
- **ADR-0003 holds.** `connection` stays `experimental`. Solid stroke continues to mean honoured wiring, and nothing here honours it.
- **The Kernel remains the sole writer.** Any new interaction that changes durable state goes through `kernelExecute`, never direct SQL.
- **No schema change.** If you believe one is required, stop and report — promotion and schema edits are founder-gated (ADR-0002).
- Do not edit `START_HERE.md`, `docs/DOCTRINE.md`, `docs/LAWS.md`, `NEXT.md`, or the rung status table. R9 stays `active` and blocked.

## Acceptance gates

Runnable first:

```bash
bun qa/run.ts one-skin
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts rung-ladder
bun qa/verify-release.ts
```

All must exit 0, and `rung-ladder` must still report `active=R9`.

Add at least one **new** runnable gate covering D2 and D4 — the two deliverables with mechanical truth behind them:

- cable endpoints recompute from tile geometry rather than stored coordinates;
- the ledger's rendered entries equal a direct `events` query, in order, with no extra or missing rows.

**Falsify every gate you add.** Break what it guards, show it red, restore it, show it green, paste both.

### Then the part g5 skipped

Rebuild and install the package, launch it, and record what actually happens:

```bash
cd collab-electron && bun install --force && bun run package:unsigned
```

`bun install --force` is not optional. `node_modules/qf-kernel` is a **copy** made at install time, so editing `packages/qf-kernel/src` and packaging without reinstalling silently ships the old code — this cost three build cycles on 2026-08-04 before anyone noticed.

Write `docs/orders/evidence/wo-g6/FOUNDER-REVIEW.md` listing, for each of D1–D5, exactly what to click and what correct looks like. The founder has computer use; you do not. Make the instructions precise enough that they need no interpretation.

## Out of scope

- Making any runtime honour `view` connections. Cables stay dashed.
- `data` or `control` connection kinds.
- Dock, masthead, or launcher rework (WO-g3 landed; leave it).
- Any Act I rung, any R9 work, and the founder's Act I sign-off.
- New third-party design systems or icon libraries.

## Report back

Per `PROTOCOL.md`. Lead with the runnable outcome and the command that proves it, plus one sentence a non-programmer can read. Then, for each deliverable: what shipped, which gate covers it, the falsification transcript, and — mandatory, non-empty — **what this does not prove**.

State plainly which of D1–D5 you verified in a running application and which you verified only by test. g5's failure was not that its tests were weak; it was that the distinction went unstated.
