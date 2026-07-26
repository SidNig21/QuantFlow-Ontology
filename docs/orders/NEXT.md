# NEXT — the current order (rotated 2026-07-25: WO-102 is written and unblocked)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-102 — Market plane reframe**

WO-101 is done (verified + merged 2026-07-25, `d4356cc`). WO-102 renames the market plane to neutral vocabulary, gives the sportsbook itself a home, teaches `ticket` that a slip can arrive from a human who already placed it — and then proves all of it by representing a real single and a real five-leg parlay. **Bovada sportsbook only; single bets and parlays only** — doctrine A7.

0. Read `AGENTS.md` at repo root — the cold-start briefing, including the commands and the `golden/` ritual.
1. Read `START_HERE.md` in full (note §5.8, the substrate-triage rule).
2. Read `docs/orders/WO-102.md` — the complete order, end to end, before any edit.
3. Branch `wo-102` from current `main`. **Commit from a worktree, never the shared tree.**
4. Run every gate and paste full unedited output. Report per `PROTOCOL.md`; the verifier runs the cold `bun qa/run.ts --all`.

### Four things about this rung specifically

- **It is larger than it reads.** `market_event` (today `event`) is a **stateful** type: renaming it moves a transition table, three command edges in `commands.ts`, and 33 generated conformance lines. This is the one place the order legitimately touches `commands.ts`.
- **It invalidates every existing `kernel.db`.** Bare `CREATE TABLE`, no migration runner, by design. **Founder consent obtained 2026-07-25** — measured first: the two live databases hold agent-session and trajectory history with **zero market rows**, so the rename touches nothing in them. **You delete nothing.** You confirm a *fresh* database opens clean.
- **`pipelineFed` does not exist in code** — zero occurrences. It is doctrine vocabulary awaiting machinery. This order builds it *with its enforcing lint*, or it does not ship. A flag without a consumer is the `declaration is not capability` failure doctrine A5 names.
- **G3 is the gate that matters: represent a real slip.** Hand-write a **single** and a **five-leg parlay containing a void leg** through the schema's own definitions, zero new object types. **Part of it is already known to fail** — per-leg price and per-leg outcome have no structural home, so they land in the opaque `legs` blob. That is the point: the market-plane side must represent the parlay *structurally*, and your report must **enumerate exactly** which ticket-side facts had nowhere to go. That enumeration is WO-103's brief, drawn from a real bet rather than from doctrine. **No futures, no outrights, no crypto, no second venue.**
- **Do not claim the market plane is market-agnostic.** The type names sound it; nothing tests it, and the test cannot be run inside singles-and-parlays. Recorded as ROADMAP debt #20 with a trigger. Your one duty here: keep `instrument` free of any hard dependency on `market_event` — no non-nullable link, no required field. Untested is fine; foreclosed is not.

### One thing WO-101 proved that this order must not repeat

WO-101's G3 read *"the suite must grow — new types generate new rows in the golden docs."* **That was false.** Conformance tests are generated from `transitions`, so the three stateless types it added produced **zero** new tests; the gate went green for an unrelated reason. Any count-based claim in your report must name the mechanism that produces the count.

## Queued behind (do not start)

**WO-103 — the write path.** Of 22 object types only 3 can be created, 9 defined actions throw `Unknown command` at `execute()`, and **no link is writable** — the `links` table is generated with zero reads and zero writes repo-wide. Until this lands, read tools would read empty tables and the closing proof is a traversal over edges that cannot exist.

Its brief grew on 2026-07-25 from real betting slips: **a parlay leg carries its own price and its own outcome, and the schema cannot say it.** `has_leg` is a property-less edge; `legs` is an untraversable JSON blob. That is the strongest argument on the board for link properties, and it comes from the founder's own primary use case. Findings 1–5 in [`WO-102.md`](WO-102.md), plus 1–10 in [`WO-101.md`](WO-101.md).

Then P3 (WO-104/105/106, the generated tool plane), P4 (markets — **Bovada sportsbook only**, per doctrine A7), P5 (the loop, the critic, the proof). See [`SCOPES.md`](SCOPES.md).

## Parked / parallel

**WO-108 / the market-abstraction test** — cannot be run inside singles-and-parlays; logged as ROADMAP debt #20 with a trigger (the first bet shape that is not one-bounded-event-with-selections) rather than weakened into a gate that reports green. **Visual pass** (WO-006d one-skin + dock redesign) — founder-gated, off the critical path. **WO-009** — absorbed into WO-106's market pick. **Durable execution** — ROADMAP debt #17, trigger-gated. **Promotion authority + the freeze-lint bypass** — ROADMAP debt #19, triggered by the first proposal to promote any type to `active`; nothing is close.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
