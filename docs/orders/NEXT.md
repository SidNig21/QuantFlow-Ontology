# NEXT — the current order (rotated 2026-07-26: WO-103b written, P2 continues)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-103b — Make the action surface honest before it is published**

WO-103 and WO-H1 are both done (verified + merged 2026-07-25 and 2026-07-26). WO-103b deletes six
actions the system declares but cannot execute, collapses a second link store, fixes the schema doc
that describes a two-rungs-dead schema, and gates one door that is about to open by itself.

0. Read `AGENTS.md` at repo root — the cold-start briefing, the commands, the `golden/` ritual.
1. Read `START_HERE.md` in full (note §5.8, the substrate-triage rule).
2. Read [`WO-103b.md`](WO-103b.md) — the complete order, end to end, before any edit.
3. Branch `wo-103b` from current `main`. **Commit from a worktree, never the shared tree.**
4. Run every gate and paste full unedited output. Report per [`PROTOCOL.md`](PROTOCOL.md); the
   verifier runs the cold `bun qa/run.ts --all`.

### Four things about this rung specifically

- **It is timed, not tidy.** WO-104 emits **one tool per action**. Every dead action shipped into it
  becomes a published tool that throws. Worse: `qf_observe_ticket` is *already generated*
  (`golden/tools.json:1060`) and unserved — the door ROADMAP debt #22 exists for opens on WO-104 **by
  codegen, with nobody deciding**. This rung interrupts that.
- **Most of the diff is deletion, and that is the point.** Six actions go; the tool surface shrinks
  77 → 71. A shrinking capability count is progress here, because every removed item was a lie.
- **One gate is the deliverable, not a chore.** Three seats hand-wrote three triggers for the
  observe-door risk on 2026-07-26 and **all three read "safe" while exposed**. Deliverable 4 turns
  the trigger into a gate, because a document with no duty attached rots (`PROTOCOL.md:121`).
- **Two rulings get recorded, zero machinery gets built.** The ingest seam and the IPC allowlist are
  *decided* here and built elsewhere. WO-103 was split for size and still took two rework rounds;
  mixing adjudication with machinery is how that happened.

### One thing WO-103 proved that this order must not repeat

Three of WO-103's five defects were born in its **order text**, not its code, and one adversarial
read found five more in minutes. Every count in this order carries the mechanism that produces it —
hold your own report to the same standard. A count that matches its prediction proves nothing on its
own.

## Queued behind (do not start)

**WO-104/105 — the generated tool plane.** WO-104 is flagged as the fattest rung and will likely
split. It inherits a hard obligation from this rung: decide whether `qf_observe_ticket` is served at
all, and to whom. Then **WO-107** (the first market — **Bovada sportsbook only**, doctrine A7), then
the loop, the critic, and the one-shot proof. See [`SCOPES.md`](SCOPES.md).

**The market-plane ingest rung** — contract written by WO-103b, build unassigned. Unblocks 4 link
kinds including `has_leg`, which is why a parlay's legs cannot be recorded as a graph today.

## Standing seat constraint (founder, 2026-07-26)

Builder seats run **`composer-2.5` or `cursor-grok-4.5-high` only** — an API-cost decision, not a
trust one. Other models `cursor-agent` lists are not authorized. Decorrelation still holds with the
seats that remain: one model builds, a different one verifies, and no model ever checks its own work.

## Parked / parallel

**Market-abstraction test** — ROADMAP debt #20, trigger: the first bet shape that is not
one-bounded-event-with-selections. **Visual pass** (WO-006d one-skin + dock redesign, and the cable
design system) — founder-gated, off the critical path; the cable principle is in `SCOPES.md` under
WO-109. **Durable execution** — debt #17, trigger-gated. **Promotion authority + freeze-lint
bypass** — debt #19, triggered by the first `active` promotion proposal. **Caller identity** — debt
#22; WO-103b gates the door, it does not close it.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
