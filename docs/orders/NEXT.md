# NEXT — the current order (rotated 2026-07-26: WO-105 written and read, P3 continues)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-105 — Action tools and the two gates**

WO-104 is done (verified + merged 2026-07-26): 69 read tools served, zero action tools, permanent
gate. WO-105 is P3's middle rung: agents get **write** tools — every one a dumb tool between two
machine checks — and the operator's observe door is structurally excluded from every agent
catalogue.

0. Read `AGENTS.md` at repo root — the cold-start briefing, the commands, the `golden/` ritual.
1. Read `START_HERE.md` in full (note §5.8, the substrate-triage rule).
2. Read [`WO-105.md`](WO-105.md) — the complete order, end to end, **including the pre-build read
   record at the bottom**, before any edit.
3. Branch `wo-105` from current `main`. **Commit from a worktree, never the shared tree.**
4. Run every gate and paste full unedited output. Report per [`PROTOCOL.md`](PROTOCOL.md); the
   verifier runs the cold `bun qa/run.ts --all`.

### Four things about this rung specifically

- **The observe ruling is made and final.** `observe_ticket` is served to no agent seat; exclusion
  by an `operatorOnly` schema flag welded to observation semantics by a generic lint — never by
  name. Do not relitigate it; the reasoning and six failed alternatives are in the order.
- **GATE 1 does not exist today.** `execute()` validates nothing about input shape — the Zod
  schemas exist, are published to MCP, and are enforced nowhere. That gap is the core of the rung.
- **The order was adversarially read before you saw it: ten findings, four High, all fixed** —
  including a literal deadlock between G5 and the current `read-tools` gate, and two gates
  satisfiable by the WO-004 forged-assertion shape. The fixes are visible inline; read them as
  constraints, not commentary.
- **Expect 15 gates, not 16.** `read-tools` is renamed `tool-plane` and its zero-action assertion
  is superseded by set-equality over the schema. The supersession is deliberate and stated; the
  verifier checks it got stronger, not deleted.

## Queued behind (do not start)

**WO-106** — the cold seat proves discovery (no priming, generated tools only) and the hand-grown
verbs retire; the only pre-P5 rung touching `collab-electron`. Then **WO-107b** (market ingest —
the bulk command with ingest trace; unblocks four link kinds), then **WO-107** (first market —
**Bovada sportsbook only**, doctrine A7; its order may not be written until the external-surface
probe runs — a candidate instrument is triaged in `docs/RESEARCH.md`), then the loop, the critic,
and the one-shot proof. See [`SCOPES.md`](SCOPES.md).

## Standing seat constraint (founder, 2026-07-26)

Builder seats run **`composer-2.5` or `cursor-grok-4.5-high` only** — an API-cost decision, not a
trust one. One model builds, a different one verifies; no model checks its own work.

## Parked / parallel

**Design overhaul** — founder-run, off the critical path; returns as a brief with measured scope
and falsifiable gates, and must fit `one-skin`. **Market-abstraction test** — debt #20,
trigger-gated. **Durable execution** — debt #17, trigger-gated. **Promotion authority +
freeze-lint bypass** — debt #19 (`promote_type` deleted by WO-103b; its fixing order re-adds the
action). **Caller identity** — debt #22; WO-105 narrows the served surface but the lock is still
unbuilt.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
