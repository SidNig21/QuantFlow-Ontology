# WO-H1 — verification record

**Verdict: PASS.** Branch `wo-h1`, one commit, merged 2026-07-26.

**In plain terms:** the project's list of known-but-unfixed problems had never been checked against
the actual code. Every open entry has now been re-measured, two were fixed outright, and several
descriptions that had quietly gone wrong were corrected. Nothing about how the product behaves
changed.

## Seat disclosure — read this before trusting the verdict

| Seat | Model | Note |
|---|---|---|
| Order author | Fable (WO-102's verifier) | Barred by the order's own disclosure from verifying it |
| Builder | Cursor `gpt-5.3-codex-high` | **Pre-dates the seat constraint** set 2026-07-26 (composer-2.5 / grok-4.5 only, on API cost grounds). Work retained after review; the constraint is about cost, not trust |
| Verification | Claude Opus 5 (the checking seat) | **Not a fully independent verifier.** This seat re-based WO-H1's order text before the build (gate count 12→13, two expired exclusion reasons). It did not write the code |

The conflict is disclosed rather than papered over: the measurements below are receipts anyone can
re-run, which is what a reader should weigh. No separate third-seat verdict was purchased, by
founder decision on cost.

## Cold suite

Fresh detached worktree, zero `node_modules`, unpiped:

```
13 PASS · 0 FAIL · exit 0
```

Suite counts **unchanged**, as the order requires: schema **147**, kernel **23**. The order is
explicit that a change there means something was touched that should not have been.

Scope confirmed: `qa/run.ts`, `qa/gates/no-canvas-domain-writes.ts`, `docs/ROADMAP.md`. Zero
`qf-kernel-schema/src`, zero `packages/qf-kernel`, zero `collab-electron`.

## Gate falsification — re-run independently, against real regressions

The order's own warning is that this rung refactors **the gate runner itself**, so the failure mode
is a runner that silently stops reporting failure. Synthetic failing tests would prove little, so
each bait was a regression the gate actually exists to catch:

| Bait | Result |
|---|---|
| Drifted `golden/ONTOLOGY.md` by two bytes | `schema` **red** → restore **green** |
| Broke the D0 derivation in `transition-meta.ts` so the `market_event` transition fails | `kernel` **red** → restore **green** |
| Planted `tile.content_hash = "x"` in `canvas-persistence.ts` | **red**, *"via dot-assignment"* — the hole #12 named |
| Planted `{ content_hash: "y" }` (the pre-existing shape) | **red**, *"via property key"* — still caught |
| Both removed | **green** |

The kernel bait is worth noting: it re-breaks the exact regression WO-103 existed to fix, and the
refactored runner caught it.

## Audit quality — the actual deliverable

18 open entries, one verdict each, `path:line` on every one. Four citations spot-checked at random
by the verification seat; all four reproduced, including that exactly **6** dead actions remain
(`retry_run`, `close_run`, `request_approval`, `approve`, `deny`, `promote_type`) — the count WO-103
moved from nine.

Two judgment calls are better than the order asked for and are the reason to trust the rest:

- **#13 recorded "could not measure"** rather than forced into a verdict. The repo shows the menu
  path and the `qf:execute` seam but carries no durable receipt proving the founder click happened.
  Recording uncertainty is the behaviour the order wanted; inferring from absence is the failure.
- **#15 and #16 marked STALE, not DONE.** The technical loopholes are closed (`rgb`/`hsl` scanning,
  `.js` in the scan surface) but an allowlist policy decision about two palette files is still open,
  so closing them would overstate what is settled.

Debt **#22** left unclaimed as instructed.

## Carried forward

**Debt #21's trigger has fired** and the audit recorded it as live, not stale — WO-103 edited one
line of `docs/ONTOLOGY_SCHEMA.md`, and the body of that work belongs to WO-103b.

**A finding this audit did not make, surfaced during #22's drafting** (see `ROADMAP.md` #22): the
`QF_EXECUTE_ALLOWLIST` guards **only** the renderer→main IPC boundary (`ipc-kernel.ts:110`). The
~28 other `kernelExecute` callsites in main-process code are not behind it; they are protected
solely by every one of them hardcoding its verb as a string literal. That is a real protection and
it was nowhere written down. Not a defect in this order — it was out of scope — but it corrects the
mental model that "the allowlist is the lock."
