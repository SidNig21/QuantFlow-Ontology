# WO-g3 — GLACIER dock: masthead, ask, launcher, ledger

status: DRAFT — needs founder authorization
branch: `wo-g3-glacier-dock`
program: GLACIER full visual swap · order 3 of 5
depends on: WO-g1 merged
ladder: non-ladder. Must not edit `NEXT.md` / `GOLDEN-RUN.md`.

Spec: [`design/glacier/showcase.html`](../../design/glacier/showcase.html) — the
right-hand panel. Open it; it is the acceptance reference.

---

## What is wrong with the shipped dock

Founder screenshot, 2026-08-03:

1. **Eight bordered rectangles stacked inside a bordered panel.** That nesting is
   what makes it read as an admin template.
2. **Four filled lime `Spawn` pills** — the loudest objects in the panel are the
   buttons, not the CLI names.
3. **The same three-line auth boilerplate repeated verbatim on all four CLI cards.**
   Roughly half the panel says nothing.
4. **Fourteen closed sessions at equal weight**, no grouping, no collapse.
5. **`CLOSED` chips rendered green** — a dead session reading as healthy. Exit codes
   are discarded, so `exit 130` and `exit 1` look identical to `exit 0`.
6. **A z-index bug** — the CLI list and the session list overlap; a `Spawn` button
   bleeds through the session rows.

## The rework

Four zones, separated by **scale and density, not borders**. Zero cards.

| zone | treatment |
| --- | --- |
| masthead | eyebrow 8px · title **21px/600** · tally line (`2 live · 14 closed · 4 launchable`) |
| ask | the primary action, so it gets the most air. Recessed well, no border, `⌘⏎` hint inside, ice ring on `:focus-within` |
| launcher | typographic rows, **no buttons** — the row *is* the target. Full-bleed hover + 2px ice left edge. Auth note once, at the foot |
| ledger | fixed columns (`•` / session / species / state), tabular figures, **26px rows**, live first, closed under a collapsible count, **real exit codes** |

## Deliverables

- `collab-electron/src/windows/shell/src/dock.js` — markup restructure.
- Dock CSS in `shell.css` (or a `windows/`-local file — same gate rules apply).
- `dock.test.ts` updated in the same commit.
- Preserve every existing behaviour: spawn, tidy, research-question submit, session
  listing, profile identity.

## The gate trap

Same as WO-g2 — `one-skin` scans all of `src/windows/`. No hex, no `rgba()`, no
`font-family` other than `var(--qf-mono)` / `var(--qf-sans)`. Use `--qf-gl-*`.

## Acceptance gates

**Five behavioural gates already constrain this file. A visual rework must leave
all five green — that is the real test of this order.**

1. `bun qa/run.ts dock-registry` — *fails if:* the registry list/resolve or
   species-literal scan breaks.
2. `bun qa/run.ts dock-definition-launch` — *fails if:* definition-driven argv or
   native-TUI compensation breaks.
3. `bun qa/run.ts dock-profile-identity` — *fails if:* profile identity, upgrade,
   `spawned_from`, or the operator-only surface breaks.
4. `bun qa/run.ts windows-dock-species` — *fails if:* the ontology gateway seats
   break.
5. `bun qa/run.ts windows-research-question` — *fails if:* submit no longer creates
   a Kernel mission and starts the orchestrator. **The ask box is being restyled;
   this gate is what proves the wiring survived.**
6. `bun qa/run.ts one-skin`, `typecheck`, `rung-ladder` pass.
7. `bun test .../dock.test.ts` passes with updated assertions.
8. **Exit codes are real.** *Fails if:* the ledger renders a hardcoded `exit 0`.
   The status column must read actual session exit state — if the data is not
   available, **report that rather than faking it.** Per `PROTOCOL.md`: hard-coded
   success paths never count as proof.
9. **Receipts** in `docs/orders/evidence/wo-g3/`: the dock with ≥2 live and ≥10
   closed sessions, closed group collapsed and expanded, ask box focused.

## Explicitly out of scope

The left file rail (WO-g4). Founder: *"the left sidebar area is perfectly fine."*
