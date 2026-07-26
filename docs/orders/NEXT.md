# NEXT — the current order (rotated 2026-07-26: WO-105 built, verified, **rework round 1**)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-105 rework round 1 — two blocking defects**

**You are not starting this rung. You are finishing it.** WO-105 was built to `dabcc34`, pushed,
and independently re-measured by the checking seat. Most of it is genuinely green and **must not be
rebuilt**. Two defects block the merge.

### Start here, in this order

1. **`git fetch && git checkout wo-105`** — the branch is on origin at `dabcc34`. Do **not** branch
   from `main`; `main` does not have this work.
2. Read `AGENTS.md` at repo root, then `START_HERE.md` in full (note §5.8).
3. Read [`WO-105.md`](WO-105.md) **end to end, including the two records at the bottom** — the
   pre-build adversarial read, and then **`VERIFICATION ROUND 1`**, which is your actual work order.
   Every finding there was re-measured; the file:line cites are exact.
4. Fix **only** the two blockers below. Commit from a worktree, never the shared tree.
5. Run every gate unpiped and paste full unedited output. Report per [`PROTOCOL.md`](PROTOCOL.md).

### BLOCKER 1 — GATE 1 breaks the Electron app's boot path

`fail_agent_session` declares only `session_id`, but three live callers pass `reason`
(`agent-host.ts:270`, `agent-host.ts:608`, `host-acp-turn.ts:105`). `reconcileStaleSessions()` runs
at boot inside a rethrowing catch (`index.ts:849-857`), so **after any unclean shutdown the app now
fails to start.** A sweep of all 28 `kernelExecute` callsites found exactly these 3 breaking.

**The ruling is made — implement it, do not redesign it:** declare `reason` as an **optional
string** on `fail_agent_session` (the same class of correction D0 already made this rung), and
**revert the `qa/gates/agent-path/run.ts` edit in the same commit**. Do not delete `reason` from
the app. The previous seat deleted the field from the *gate that models* that boot function instead
of fixing the function — that is how a red became green while the product broke.

### BLOCKER 2 — `FAIL typecheck`, the rung's own gate is red

Cold `bun qa/run.ts --all` at `dabcc34` → **`GATE_RUNNER_EXIT=1`**, 14 PASS / 1 FAIL / 15 gates.
Three `TS2345` errors in `tools/qf-read-tools/src/harness.ts` lines **170, 212, 236** — a
`CallToolResult` union (may carry `toolResult` instead of `content`) passed into a helper typed
`{ content: unknown }`. Narrow the union or type the parameter as the SDK result type.

**This also fails in the previous builder's own warm worktree** (`TSC_EXIT=2`). It is not a cold
artifact — the full suite was not run, or its output was misread. **Never pipe the gate runner**; a
prior seat read `tail`'s exit 0 while the gate had failed. Unpiped, `$?` on its own line.

### Do not touch — verified green, re-measured by the checking seat

24 action tools served with `qf_observe_ticket` **absent**; counts genuinely derived (the same
assertion emits `97/72/25` against the fixture schema and `93/69/24` against the real one); GATE 1
rejects and writes nothing (`events_before_after 4 4`); GATE 2 survives the transport; `golden/
tools.json` correctly stays at **94** while the served plane is 93; the single parse site at
`execute.ts:122` sits before the creation/transition fork. **Rebuilding any of this is a defect.**

### Out of scope — do not attempt

Action tools advertise **no parameters** (real shape is only in `_meta`). This is logged as
**ROADMAP debt #24**, is trigger-gated to WO-106, and is a **founder decision** — it changes the
agent-facing contract and is deliberately not delegated. Leave it alone.

Two standing traps, both logged: **`agent-path` gives a false FAIL in a sandboxed shell** (debt
#23) — pre-install before any before/after measurement. **Never pipe the gate runner** (above).

## After this rework

The checking seat verifies independently — cold suite in a throwaway worktree, gates re-baited by
hand, no transcripts taken as evidence — then merges and rotates. **Do not merge to `main`
yourself.**

## Queued behind (do not start)

**WO-106** — the cold seat proves discovery (no priming, generated tools only) and the hand-grown
verbs retire; the only pre-P5 rung touching `collab-electron`. **Blocked on debt #24 above.** Then
**WO-107b** (market ingest — the bulk command with ingest trace; unblocks four link kinds), then
**WO-107** (first market — **Bovada sportsbook only**, doctrine A7; its order may not be written
until the external-surface probe runs — a candidate instrument is triaged in `docs/RESEARCH.md`),
then the loop, the critic, and the one-shot proof. See [`SCOPES.md`](SCOPES.md).

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
