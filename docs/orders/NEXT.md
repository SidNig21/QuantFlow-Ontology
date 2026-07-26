# NEXT — no builder-cuttable order right now (rotated 2026-07-26: WO-104 verified + merged)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## There is no order to cut. This is the honest state, not an oversight.

**WO-104 is done** (verified + merged 2026-07-26, one rework round). The read half of P3 is served:
69 read tools over real MCP, the `_links` traversal exists and answers, and a permanent gate now
asserts on every run that zero action tools are served. The next rung is **WO-105**, and its order
file **has not been written yet** — it is a contract in [`SCOPES.md`](SCOPES.md). Writing it is the
architect's job.

**If you are a builder reading this: stop here and tell the founder.** No work without an order
(`AGENTS.md` rule 1). A file that says "nothing to do" is doing its job.

## What the architect writes next: WO-105 — action tools and the two gates

Its contract (`SCOPES.md`) plus three obligations this ladder has since attached:

- **The `qf_observe_ticket` serving ruling — the decision this rung exists to force.** The read
  plane could not open the door (registration never visits `schema.actions`, structurally). The
  action plane must decide: is `qf_observe_ticket` served at all, and to whom? Debt #22 is the
  context: the gate is an alarm on known routes — **six** boundary evasions have now fallen to
  readers who did not write them, the sixth recorded at WO-104 verification — and the lock is
  caller identity, which does not exist. Serving `observe_*` to any agent seat before caller
  identity exists means the alarm fires with no lock behind it. The order must say which way it
  rules and why, in plain language, because this is the founder's fabricated-bet risk.
- **GATE 1 and GATE 2** (Zod-parse at `execute()`; transition check against the generated tables) —
  the two machine gates SCOPES names for this rung.
- **Any new server must land inside the `read-tools` gate's coverage or extend it.** That gate
  asserts the *served set*; a second server outside its reach recreates the one-shot-transcript
  hole WO-104's rework just closed.

**Strong recommendation carried from measurement, not preference: run the pre-build adversarial
read.** The scoreboard is now — WO-103, no read: three order-text defects, two rework rounds.
WO-103b, read: zero rework. WO-104, read: eight defects caught pre-build (including the phase-exit
gate), one rework round for post-build findings. WO-105 makes the single most consequential ruling
on the ladder so far; it is the last order to skip the read on.

Queued behind: **WO-106** (cold seat + retirement of hand-grown verbs), **WO-107b** (market
ingest — unblocks four link kinds including `has_leg`), **WO-107** (first market — **Bovada
sportsbook only**, doctrine A7), then the loop, the critic, and the one-shot proof.

## Standing seat constraint (founder, 2026-07-26)

Builder seats run **`composer-2.5` or `cursor-grok-4.5-high` only** — an API-cost decision, not a
trust one. One model builds, a different one verifies; no model checks its own work.

## Parked / parallel

**Design overhaul** — founder-run, off the critical path; returns as a brief with measured scope
and falsifiable gates, and must fit `one-skin`. **Market-abstraction test** — debt #20,
trigger-gated. **Durable execution** — debt #17, trigger-gated. **Promotion authority +
freeze-lint bypass** — debt #19 (`promote_type` was deleted by WO-103b; its fixing order re-adds
the action). **Caller identity** — debt #22, gated by `bun qa/run.ts observe-door` +
`bun qa/run.ts read-tools`, not closed.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
