# NEXT — no order is currently cuttable (rotated 2026-07-26: WO-105 verified + merged)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## STOP — there is no builder work right now

**WO-105 is done** (verified + merged 2026-07-26 after 1 rework round; 15 gates cold,
`GATE_RUNNER_EXIT=0`). P3 rung 2 of 3 is closed: GATE 1 exists at `execute.ts:122`, 24 action tools
are served, and `qf_observe_ticket` is structurally absent from every agent catalogue.

**The next rung — WO-106 — is blocked on a founder decision (ROADMAP debt #24) and may not be
written or cut until that decision is made.** If you are a builder and you arrived here, stop and
report that; do not select another order, and do not start WO-106.

## What the decision is

WO-105 shipped 24 working write tools. **They advertise no parameters.** `qf_create_ticket`'s
transport `inputSchema` has zero properties; its real eight-field shape survives only in
`_meta["qf/inputSchema"]`, which standard MCP clients ignore.

This is not a defect to assign. In `@modelcontextprotocol/sdk@1.29.0`, `registerTool` **derives**
the advertised JSON Schema from the same object it validates with — so advertising the true shape
would make MCP a second validator, masking GATE 1 and violating WO-105 D3, which the order
mandated. The fork is real:

- **Leave it** — tools are callable but not self-describing; an agent must be told the shape.
- **Serve `tools/list` from a low-level handler** that emits the real JSON Schema while
  `registerTool` keeps the permissive validator. The write path stays single; only the
  *advertisement* changes. Real work, and a change to the agent-facing contract.

**It gates WO-106 because WO-106's entire premise is "the cold seat proves discovery — no priming,
generated tools only."** A cold seat cannot discover parameters that are not advertised. Deciding
this after WO-106 is written means rewriting it.

Full statement: ROADMAP debt #24. Measurements behind it:
[`evidence/wo-105/VERIFICATION.md`](evidence/wo-105/VERIFICATION.md).

## Where the ladder stands

**5 of 11 rungs done** (`SCOPES.md` is authoritative on numbering). P1 closed, P2 closed, P3 at
2 of 3. Remaining: **WO-106** (cold seat + verb retirement — the only pre-P5 rung touching
`collab-electron`), then **WO-107b** (market ingest; unblocks four link kinds), **WO-107** (first
market — **Bovada sportsbook only**, doctrine A7; its order may not be written until the
external-surface probe runs — candidate instrument triaged in `docs/RESEARCH.md`), **WO-108**
(second market), then **WO-109/110/111** — the loop, the critic, and the one-shot proof.

Rung count is not effort. The remaining six rungs include every one that touches real external
data and the closing proof; they are heavier than the five behind us.

## Standing seat constraint (founder, 2026-07-26)

Builder seats run **`composer-2.5` or `cursor-grok-4.5-high` only** — an API-cost decision, not a
trust one. One model builds, a different one verifies; no model checks its own work.

## Two standing traps, both measured and logged

- **`agent-path` gives a false FAIL in a sandboxed shell** (debt #23) — its self-install exits 0 but
  leaves no `node_modules`. Pre-install before any before/after measurement.
- **Never pipe the gate runner.** It has now cost two seats: one read `tail`'s exit 0 while the gate
  had failed. Unpiped, `$?` on its own line, every time.

## Parked / parallel

**Design overhaul** — founder-run, off the critical path; returns as a brief with measured scope
and falsifiable gates, and must fit `one-skin`. **Market-abstraction test** — debt #20,
trigger-gated. **Durable execution** — debt #17, trigger-gated. **Promotion authority +
freeze-lint bypass** — debt #19 (`promote_type` deleted by WO-103b; its fixing order re-adds the
action). **Caller identity** — debt #22; WO-105 narrowed the served surface but the lock is still
unbuilt.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
