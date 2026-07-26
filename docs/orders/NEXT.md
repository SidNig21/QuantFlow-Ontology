# NEXT — no builder-cuttable order right now (rotated 2026-07-26: WO-H1 verified + merged)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## There is no order to cut. This is the honest state, not an oversight.

**WO-103 and WO-H1 are both done** (verified + merged, 2026-07-25 and 2026-07-26). The next rung on
the ladder is **WO-103b**, and its order file **has not been written yet** — it is a contract in
[`SCOPES.md`](SCOPES.md), not a cuttable order. Writing it is the architect's job, not a builder's.

**If you are a builder reading this: stop here and tell the founder.** Do not pick your own work,
do not "get ahead" on WO-103b from its SCOPES contract, and do not start a queued rung. `AGENTS.md`
rule 1 is *no work without an order*, and a builder improvising against a contract is exactly the
drift that rule exists to prevent. A file that says "nothing to do" is doing its job.

## What the architect writes next: WO-103b

**The write path's policy half.** Its inbox is already recorded — two WO-103 builder rounds logged
these and, correctly, acted on none of them:

- **Six dead actions** — `retry_run`, `close_run`, `request_approval`, `approve`, `deny`,
  `promote_type`. Confirmed still exactly six by WO-H1's audit. Each gets wired or deleted; deleting
  changes the action surface and drags the doc surface with it, which is why WO-103 was forbidden to.
- **`connection` duplicates the `links` table** — an object type carrying `kind` / `from_ref` /
  `to_ref`, i.e. a link stored as an object. Two mechanisms for one job; one of them has to go.
- **`docs/ONTOLOGY_SCHEMA.md` reconciliation** — ROADMAP debt **#21, whose trigger has now fired**.
  WO-103 edited exactly one line of it under an explicit carve-out. The entry names the choice:
  regenerate-and-gate the object surface, or formally demote the file to design prose and point
  readers at `golden/ONTOLOGY.md`.
- **The market-plane ingest seam** for `pipelineFed` types (`instrument`, `quote`), which are
  deliberately not creatable through `execute()`.
- **The `QF_EXECUTE_ALLOWLIST` decision.** Read ROADMAP debt **#22** before touching this: the
  allowlist guards only the renderer→main IPC boundary, and ~28 main-process callsites are protected
  solely by hardcoding their verb. Adding an entry is not a small change; it is #22's trigger.

Also queued behind: **WO-104/105** (the generated tool plane — WO-104 is flagged as the fattest rung
and will likely split), **WO-107** (the first market, **Bovada sportsbook only**, doctrine A7), then
the loop, the critic, and the one-shot proof.

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
#22, trigger in the entry.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies. Until then, NEXT stays as written.*
