# WO-CI3 — Keep the prior-schema release fixture inside its deadline

status: **independently verified on combined candidate — pending merge**
assignee: builder
depends: WO-107b
blocks: WO-107c verification
kind: off-ladder release-test repair

## Objective

Make the existing file-backed prior-schema fixture deterministic under the canonical release load
without changing its deadline, assertions, production code, or schema authority.

## In plain terms

The WO-107c feature passed its independent checks, but an older safety test occasionally spends more
than five seconds creating its test database; prepare that database in one atomic write so a slow
fixture cannot falsely block every later product rung.

## Measured failure

The independent verifier ran `bun qa/verify-release.ts` once from a fresh detached WO-107c candidate
at `a42290f`. Every WO-107c gate and all four independent baits passed, but the canonical command
exited `1` because the unchanged test
`packages/qf-kernel/src/attach-kernel-drift.test.ts` exceeded Bun's fixed 5,000 ms deadline:

```text
prior-schema fixture readonly → warn + getKernelDrift
timeout at 5,000 ms; operation completed at 5,863 ms
```

The immediately repeated focused control passed in 1,281 ms. Historical accepted WO-K3 evidence
records the same test at 1,931 ms. The fixture helper currently sends the large multi-statement
snapshot to a file-backed SQLite database without an outer transaction, allowing each statement to
pay its own durable commit cost.

## Ruling — one fixture transaction, no weaker deadline

Change only `packages/qf-kernel/src/attach-kernel-drift.test.ts` so both file-backed seed helpers
execute their committed SQL fixture inside one explicit `bun:sqlite` transaction before closing the
database. Keep the SQL bytes, database mode, temporary-file lifecycle, test names, assertions, and
Bun's default 5,000 ms timeout unchanged.

The transaction is test setup only. Do not change `attachKernel`, runtime pragmas, migrations,
generated files, product code, package scripts, QA ordering, or global test configuration.

## Deliverables

1. `seedPriorSnapshot()` applies `PRIOR_MIGRATION` through one explicit SQLite transaction.
2. `seedCanaryOnly()` uses the same transaction-shaped fixture setup so the two file-backed helpers
   cannot drift back into per-statement autocommit behavior.
3. No other tracked file changes except this order, the temporary `NEXT.md`/order-log routing, and
   the eventual independent verification receipt.

## Acceptance

### Builder-run

From `packages/qf-kernel`:

```bash
bun test src/attach-kernel-drift.test.ts
```

Then run the standing static gates from repo root and `git diff --check`. Do not run the full release
verifier; the independent verifier owns the one cold canonical run.

Falsification: temporarily add a synchronous delay longer than 5,000 ms inside the named readonly
prior-schema test, run the focused file and record the unchanged deadline failing red, restore the
exact line, then rerun green. This bait proves the repair did not hide the incident by widening the
deadline. The delay is never committed.

### Verifier-run

In a fresh detached worktree at the submitted commit, first inspect that the diff contains no
production or timeout change. Run exactly once:

```bash
bun qa/verify-release.ts
```

It must reach `PASS release-verification`, including the unchanged attach-kernel drift suite. Then
independently repeat the >5,000 ms delay bait against a temporary copy, restore exactly, and rerun
only the focused test green. Do not rerun the canonical verifier until it happens to pass.

## Out of scope

WO-107c feature changes · schema or migration changes · production SQLite behavior · timeout
increases · skipped or renamed tests · retries · new dependencies · QA reordering · network,
credentials, bets, or trades.

## Report back

One plain-language sentence · exact one-file implementation diff · focused green output · deadline
bait red→restore→green · static gates · judgment where the order was silent.

---

## Verification round 1 — target PASS, canonical REWORK (`4a7b2d3`)

The transaction-only diff was exact. In the single canonical run, the formerly failing tests passed
at 296.69 ms and 462.23 ms; the complete Kernel suite passed 67/67. The canonical release still
exited `1` solely because the previously documented machine-wide `runtime-proof` listener trap saw a
foreign port 8180 after its baseline. No CI3 defect was found. WO-CI4 owns that independent gate
correction; the canonical command was not rerun and the conditional verifier bait was not started.
