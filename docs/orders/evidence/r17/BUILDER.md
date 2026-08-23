# R17 Builder evidence — consumer compatibility repair

Builder work was performed on `wo-R17` from `f1b37d2`. Plain meaning: an accepted
R16 Kernel keeps its founder rows and opens in R17 by adding only the five R17
definitions.

## Changed behavior

- `packages/qf-kernel/src/upgrade.ts` recognizes only the exact
  `pre_r17_current` structural snapshot and upgrades it once through the existing
  current-additions authority inside the existing transaction.
- `packages/qf-kernel/src/db.ts` routes that one predecessor through the normal
  writable attach path.
- `qa/gates/r17-founder-kernel-compatibility.ts` is registered as
  `r17-founder-kernel-compatibility`; it uses disposable on-disk fixtures, full
  row/schema snapshots, reopen, and byte/WAL/SHM refusal checks.
- `qa/gates/kernel-sole-writer.ts` records the gate's fixture-only SQLite/open
  authority.

## Green receipts

```text
bun qa/run.ts r17-founder-kernel-compatibility
pre_r17_shape=pre_r17_current
upgrade=pre_r17_current->current
existing_rows_same=true
schema_delta=grades_ticket,grades_run,grades_strategy,grades_run_result,record_strategy_outcome
second_attach_same=true
partial_extra_refused=true
partial_missing_r16_refused=true
partial_changed_sql_refused=true
transaction_rollback=true
founder_db_touched=false
PASS  r17-founder-kernel-compatibility

bun test packages/qf-kernel/src/r11a-deterministic-execution.test.ts packages/qf-kernel/src/r11b-metric-correctness.test.ts packages/qf-kernel/src/kernel.test.ts packages/qf-kernel/src/r17-technique-outcome.test.ts
41 pass / 0 fail

bun qa/run.ts typecheck
PASS  typecheck

bun qa/run.ts technique-outcome-loop
runtime_ms=104519
owned_processes_remaining=0 roots_remaining=0 leaked=[]
PASS  technique-outcome-loop
```

## Compatibility falsifier batch

Each red was made by one temporary source mutation, run from a fresh disposable
fixture, then restored before the next case. The final green above was run after
all restores.

| # | Mutation | Required red receipt |
|---:|---|---|
| 1 | removed the `pre_r17_current` classifier branch | `fixture is not exact pre_r17_current` |
| 2 | replaced the exact snapshot with a subset | `fixture is not exact pre_r17_current` |
| 3 | skipped the bounded upgrade branch | `upgrade did not classify current` |
| 4 | ran historical profile-identity SQL | `SQLiteError: duplicate column name: runtime_profile` |
| 5 | changed a pre-existing mission payload in the upgrade path | `pre-existing mission rows/schema changed` |
| 6 | failed after current additions | `Error: falsifier: current additions failed` |
| 7 | deleted retained `belongs_to` metadata after additions | `KernelUpgradeShapeError ... R17 current additions did not produce the exact current shape` |
| 8 | retained one R17 metadata addition in the predecessor fixture | `fixture is not exact pre_r17_current` |

No mutation was retained. `git diff --check`, `bun qa/run.ts kernel-sole-writer`,
and the compatibility gate were green after restoration.

## Atlas and scope

```text
bun qf-atlas/generate.mjs --check
qf-atlas: current — 436 files, 126 channels, 13 strip candidates
bun qf-atlas/ratchet.mjs
HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0
bun qf-atlas/generate.mjs --diff 7ed2757cfe24d1771117e61cc4a0388aaa332ec5
VERDICT: UNCHANGED — no architectural change
```

No founder database was opened or modified. No Electron process was launched by
the compatibility gate. No bet/trade placement surface was added.
