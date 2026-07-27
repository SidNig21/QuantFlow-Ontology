# NEXT — the current order (rotated 2026-07-26: WO-106 merged, P3 CLOSED)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-106b — close the `publish_artifact` file-read surface**

**Phase P3 is closed.** WO-106 merged 2026-07-26 with zero rework rounds: 19 gates cold, exit 0, and
the write catalogue now describes itself (0 of 24 action tools advertise zero properties, down from
24 of 24). A real model that previously needed four attempts and dropped a field now does the same
task in one.

WO-106b is a **small, single-purpose security order** carrying a ruling that is already made. It is
the split-out D6 — see below for why it is its own order.

> **NOT YET CUTTABLE — the pre-build adversarial read is still running (started 2026-07-26).**
> Do not hand this to a builder until the read record is appended at the bottom of `WO-106b.md` and
> this notice is removed. The entire reason this order exists separately is that its predecessor
> skipped that step; cutting it early would repeat the exact mistake.
>
> One collision is already found and fixed by the author: a naive fail-closed implementation would
> have reddened the shipped `tool-plane` and `tool-discovery` gates, because `expectedServedToolNames`
> derives the served set from the schema alone and knows nothing about an artifact root. See D1.

0. Read `AGENTS.md` at repo root — the cold-start briefing, the commands, the `golden/` ritual.
1. Read `START_HERE.md` in full (note §5.8, the substrate-triage rule).
2. Read [`WO-106b.md`](WO-106b.md) end to end, **including the pre-build read record at the bottom**.
3. Branch `wo-106b` from current `main`. **Commit from a worktree, never the shared tree.**
4. Run every gate unpiped, `$?` on its own line, and paste full unedited output. Report per
   [`PROTOCOL.md`](PROTOCOL.md); the verifier runs the cold suite independently.

### Why this is its own order — read this before you judge its size

It was `WO-106 D6`, added **after** WO-106's adversarial read. It was therefore the one deliverable
nobody reviewed, and it was **wrong in three measured ways**: it claimed the Electron app publishes
through `bytes` (every app callsite uses `path`), it referred to "a declared staging root" that had
no spelling, and it demanded a Kernel-wide rejection that would have broken the founder's own
file-picker publish. The builder-preparer seat stopped before writing any of it. **A deliverable
added after the read is a deliverable with no read** — so this one gets its own.

### Three standing traps, all measured and logged

- **`agent-path` gives a false FAIL in a sandboxed shell** (debt #23) — its self-install exits 0 but
  leaves no `node_modules`. Pre-install before any before/after measurement.
- **Never pipe the gate runner.** It has cost two seats: one read `tail`'s exit 0 while the gate had
  failed. Unpiped, `$?` on its own line, every time.
- **Do not run the suite while another agent is running** (new, WO-106) — a concurrent Cursor session
  makes `runtime-proof` fail on foreign sockets. Run quiet, or you will chase a phantom red.

### The standard this rung set — match it

WO-106's builder **falsified every gate it wrote by editing shipping code**, not by flipping a
fixture switch, and sent back five defects in its own gates. Three were the same shape: *a check
whose two sides come from one source*. It also proved one gate this architect specified was
**modelling** the boot path rather than watching it — the real edit passed all 19 gates. That is the
bar now.

## Where the ladder stands, and what is queued behind (do not start)

**6 of 11 rungs done** (`SCOPES.md` is authoritative on numbering). **P1, P2 and P3 all closed.**
Next on the ladder after WO-106b: **WO-107b** (market ingest; unblocks four link kinds), **WO-107** (first
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
