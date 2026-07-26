# NEXT — the current order (rotated 2026-07-26: WO-105 merged, WO-106 written and read)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-106 — The cold seat, and retirement**

WO-105 is done (verified + merged 2026-07-26; 15 gates cold, exit 0). WO-106 closes P3: the write
tools learn to describe themselves, and the four hand-written read verbs are deleted.

0. Read `AGENTS.md` at repo root — the cold-start briefing, the commands, the `golden/` ritual.
1. Read `START_HERE.md` in full (note §5.8, the substrate-triage rule).
2. Read [`WO-106.md`](WO-106.md) — the complete order, end to end, **including the pre-build read
   record at the bottom**, before any edit.
3. Branch `wo-106` from current `main`. **Commit from a worktree, never the shared tree.**
4. Run every gate unpiped, `$?` on its own line, and paste full unedited output. Report per
   [`PROTOCOL.md`](PROTOCOL.md); the verifier runs the cold suite independently.

### Four things about this rung specifically

- **ROADMAP debt #24 is decided — do not relitigate it.** The founder ruled: fix the advertisement.
  The mechanism is Ruling 1, and it was **probed end-to-end before the order was cut** (the override
  handler runs, advertises real properties and `required`, and a bogus key still reaches the handler
  untouched). Do not "simplify" it by passing the real Zod schema to `registerTool` — that makes MCP
  a second validator and masks GATE 1, which WO-105 exists to prevent.
- **The migration census in the order is a floor, not a closed list.** The first draft said "8
  callsites, 5 files"; measured, it is **16 files**, including a fifth wrapper the draft did not know
  about and **two QA gates** that break the suite if missed. Delete the definitions, then fix every
  compile break. Typecheck and the full suite are the authority on completeness.
- **`golden/` changes in this rung, deliberately.** D2 adds `order` and nullable `limit` to the query
  tools. G6 requires *determinism, not stasis* — after your regeneration is committed, `bun run
  generate` must produce no further diff. An earlier draft demanded byte-identity and contradicted
  D2; that is fixed, but read G6 carefully.
- **The order was adversarially read before you saw it: thirteen findings, seven High, all fixed** —
  including three cases where the order contradicted *itself*, the defect class that cost WO-105 a
  full rework round. The fixes are inline; read them as constraints, not commentary.

### Two standing traps, both measured and logged

- **`agent-path` gives a false FAIL in a sandboxed shell** (debt #23) — its self-install exits 0 but
  leaves no `node_modules`. Pre-install before any before/after measurement.
- **Never pipe the gate runner.** It has now cost two seats: one read `tail`'s exit 0 while the gate
  had failed. Unpiped, `$?` on its own line, every time.

## Where the ladder stands, and what is queued behind (do not start)

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

## Parked / parallel

**Design overhaul** — founder-run, off the critical path; returns as a brief with measured scope
and falsifiable gates, and must fit `one-skin`. **Market-abstraction test** — debt #20,
trigger-gated. **Durable execution** — debt #17, trigger-gated. **Promotion authority +
freeze-lint bypass** — debt #19 (`promote_type` deleted by WO-103b; its fixing order re-adds the
action). **Caller identity** — debt #22; WO-105 narrowed the served surface but the lock is still
unbuilt.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
