# NEXT — no builder-cuttable order right now (rotated 2026-07-26: WO-103b verified + merged, **P2 complete**)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## There is no order to cut. This is the honest state, not an oversight.

**P2 is complete.** WO-103 and WO-103b are both done (verified + merged 2026-07-25 and 2026-07-26),
and WO-H1 with them. The next rung is **WO-104**, and its order file **has not been written yet** —
it is a contract in [`SCOPES.md`](SCOPES.md), not a cuttable order. Writing it is the architect's job.

**If you are a builder reading this: stop here and tell the founder.** Do not pick your own work, do
not get ahead on WO-104 from its SCOPES contract, and do not start a queued rung. `AGENTS.md` rule 1
is *no work without an order*, and a builder improvising against a contract is the drift that rule
exists to prevent. A file that says "nothing to do" is doing its job.

## What the architect writes next: WO-104 — the generated tool plane

**Flagged in `SCOPES.md` as the fattest rung on the ladder, and likely to split.** WO-103 was split
for size and still took two rework rounds; WO-104 is larger. Three things are already known about it:

- **It inherits a decision it cannot avoid.** The generator emits one tool per action, and
  `qf_observe_ticket` generates today while being served to nobody. WO-104 must rule on **whether
  that tool is served at all, and to whom.** The `observe-door` gate (WO-103b) makes that ruling
  mandatory rather than automatic — it alarms when the door opens, it does not decide.
- **Debt #9 lands here** — compacting the 1k-line `golden/tools.json` surface. The determinism half
  is already covered and was corrected in WO-H1's audit; do not rebuild it.
- **Debt #22 is gated, not closed.** Nothing yet gives the Kernel caller identity. Serving any
  `observe_*` tool without it means the alarm fires and there is no lock behind it.

Also unassigned: **the market-plane ingest rung** (`WO-107b` in `SCOPES.md`, contract written by
WO-103b). It unblocks four link kinds including `has_leg` — which is why a parlay's legs cannot be
recorded as a graph today. Then **WO-107** (the first market — **Bovada sportsbook only**, doctrine
A7), then the loop, the critic, and the one-shot proof.

## The one process finding worth carrying into WO-104

**WO-103b is the first rung in this sequence to get PROTOCOL's pre-build adversarial read, and the
first to need zero rework rounds.** That read found seven defects, all in the order text, before a
builder ever saw it. WO-103 skipped it, carried three order-text defects into the build, and cost two
rework rounds plus a correction.

The read asks exactly two questions and takes minutes: **can each acceptance gate actually fail?**
and **does each deliverable have exactly one meaning?** Given WO-104 is the fattest rung on the
ladder, it is the worst possible one to skip it on.

## Standing seat constraint (founder, 2026-07-26)

Builder seats run **`composer-2.5` or `cursor-grok-4.5-high` only** — an API-cost decision, not a
trust one. Other models `cursor-agent` lists are not authorized. Decorrelation still holds with the
seats that remain: one model builds, a different one verifies, and no model ever checks its own work.

## Parked / parallel

**Market-abstraction test** — ROADMAP debt #20, trigger: the first bet shape that is not
one-bounded-event-with-selections. **Visual pass** (WO-006d one-skin + dock redesign, and the cable
design system) — founder-gated, off the critical path; the cable principle is in `SCOPES.md` under
WO-109, and WO-103b's `connection` ruling now feeds it. **Durable execution** — debt #17,
trigger-gated. **Promotion authority + freeze-lint bypass** — debt #19, triggered by the first
`active` promotion proposal; note `promote_type` was **deleted** by WO-103b, so that debt's fixing
order re-adds the action rather than wiring an existing one. **Caller identity** — debt #22, now
gated by `bun qa/run.ts observe-door` rather than by prose.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
