# NEXT — the current order (rotated 2026-07-26: WO-104 written, P3 opens)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-104 — The read plane**

P2 is complete (WO-103 + WO-103b, both verified and merged). WO-104 opens **P3, the generated tool
plane**, and builds its reading half: a schema-driven read layer in the Kernel, the missing
link-traversal tool, and an MCP server that serves **read tools only**.

0. Read `AGENTS.md` at repo root — the cold-start briefing, the commands, the `golden/` ritual.
1. Read `START_HERE.md` in full (note §5.8, the substrate-triage rule).
2. Read [`WO-104.md`](WO-104.md) — the complete order, end to end, before any edit.
3. Branch `wo-104` from current `main`. **Commit from a worktree, never the shared tree.**
4. Run every gate and paste full unedited output. Report per [`PROTOCOL.md`](PROTOCOL.md); the
   verifier runs the cold `bun qa/run.ts --all`.

### Four things about this rung specifically

- **P3 was split three ways before the build, not during it.** WO-104 = read tools · WO-105 =
  action tools + the two gates · WO-106 = cold seat + verb retirement. WO-103 was split for size
  and still took two rework rounds; this split is that lesson applied earlier.
- **The split boundary is safety, not tidiness.** `observe_ticket` is an *action*. Serving only
  read tools means this rung **cannot** open the door ROADMAP debt #22 names — so that decision
  lands in WO-105, which is forced to make it, instead of being made by a generator loop nobody
  reads. **Zero action tools in this order.**
- **It is the biggest `declaration is not capability` gap in the repo** (doctrine A5). 71 tool
  definitions exist and **none is served**; the Kernel can read **3 of 23** object types; and the
  `links` table has had a writer since WO-103 and **no reader at all**. The graph the whole
  ontology exists for cannot currently be walked.
- **Deliverable 0 fixes a gate this rung would otherwise walk through.** `observe-door` clause 2
  trusts the entire `qf-kernel-schema/` tree — a tool server placed inside it passes green
  (verified by probe, ROADMAP debt #22). This order builds a tool server, so the fix comes first.

### One thing WO-103b proved that this order keeps

WO-103b was the first rung to get PROTOCOL's pre-build adversarial read and the first to need
**zero rework rounds** — seven order-text defects fixed before a builder saw the file.

**WO-104 has had the same read: eight findings, three of them High, all in the order text, all
fixed before you.** One of the three was the doctrine phase-exit gate itself, which as first
written would have gone green against 69 hand-written tool registrations. The record is the last
section of the order — read it, because it tells you which parts of this order were nearly wrong
and why the gates are shaped the way they are.

## Queued behind (do not start)

**WO-105** — action tools, GATE 1 (Zod-parse at `execute()`), GATE 2 (transition check), and the
`qf_observe_ticket` serving ruling. **WO-106** — a cold seat calls generated tools; hand-grown
`qf_*` verbs retire. Then **`WO-107b`** (market ingest — unblocks four link kinds including
`has_leg`, which is why a parlay's legs cannot be recorded as a graph today), then **WO-107** (the
first market — **Bovada sportsbook only**, doctrine A7), then the loop, the critic, and the
one-shot proof. See [`SCOPES.md`](SCOPES.md).

## Standing seat constraint (founder, 2026-07-26)

Builder seats run **`composer-2.5` or `cursor-grok-4.5-high` only** — an API-cost decision, not a
trust one. Other models `cursor-agent` lists are not authorized. Decorrelation still holds with the
seats that remain: one model builds, a different one verifies, and no model ever checks its own work.

## Parked / parallel

**Design overhaul** — brand, tokens, cables, settings; founder-run, in progress 2026-07-26, off the
critical path. Returns as a *brief*, not an order: it needs measured scope and falsifiable gates
before anyone builds it, and it must fit the `one-skin` rule. **Market-abstraction test** — debt
#20, trigger: the first bet shape that is not one-bounded-event-with-selections. **Durable
execution** — debt #17, trigger-gated. **Promotion authority + freeze-lint bypass** — debt #19;
note `promote_type` was **deleted** by WO-103b, so that debt's fixing order re-adds the action
rather than wiring an existing one. **Caller identity** — debt #22, gated by
`bun qa/run.ts observe-door`, not closed.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
