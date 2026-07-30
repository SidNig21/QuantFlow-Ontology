# WO-107b independent verification — PASS

QuantFlow now has one trustworthy, all-or-nothing door for loading market rows, and independent cold verification found no release blocker in that door or in the repaired release checks.

## Verdict

**PASS** for exact candidate `d1719ef34e80213da4fd367067e1e8308cd724b9`.

Verification ran in fresh detached worktree `/tmp/qf-verify-107b-r2`. Before the canonical run, Git status was empty and no dependency, build, package, staging, or receipt output existed.

## Round-1 repair remeasurement

- The market gate no longer calls complete MCP authority. It derives complete cardinality from the schema and checks the production served set separately, so `observe-door` remains closed.
- `dock-profile-identity` binds production to exact literal upgrades `0001-agent-profile-identity.sql` and `0002-market-ingest.sql`, rejects dynamic filenames, retains the read-only ancestor rule, and expects both upgrades on a pre-D1 read-only database.
- The canonical run printed `PASS observe-door`, `dock-profile-identity OK`, and `PASS dock-profile-identity`.

## Canonical cold release proof

The verifier invoked exactly once, escalated at the outset after round 1 had measured desktop-sandbox install contamination:

```text
$ bun qa/verify-release.ts
QF release run ID: 00c6b080-d73c-4341-b3cb-7ffc911e2e7e
exit: 0
package:verify: PASS
PASS market-ingest
PASS tool-plane
PASS observe-door
PASS dock-profile-identity
PASS release-verification
```

The run installed 2,341 packages, rebuilt `node-pty`, passed the Electron unit suites, completed the production build, built and inspected the real Linux package, and passed the full QA board. Schema reported 158 pass / 0 fail; Kernel reported 67 pass / 0 fail.

The real `app.asar` contained and byte-matched all SQL authorities:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `golden/migration.sql` | 38327 | `9a0abfab0b9df9c0c2a98b3a07df60c7f3f770bd43b624ed82d2233dadc4f3dd` |
| `compat/pre-d1-profile-identity.sql` | 37432 | `935fb49c677f91c66da9624fbd2ce501b4f20fb60739acc11b0681a03181f807` |
| `upgrades/0001-agent-profile-identity.sql` | 1974 | `a0a4dc1259aa658cf1a4fe7e47585ed5f289d2963d3306b5d687ffbc8de2a768` |
| `upgrades/0002-market-ingest.sql` | 451 | `cfa923ba7c324a032cc183133fad546c12e0d1ea73575dbea390586ee3621745` |

Real packaged `app.asar` hash: `084c44b613de4347e38e06d0f2cf8c09821869be223e3e5fef56a2e1e346e57b`.

## D0–D5 receipts

- Public root/portable inventories contained none of `creationHandlers`, `appendEvent`, or `insertRun`; dispatch reported 26 actions and 2 pipeline rows.
- Schema reported 23 objects, 26 actions, 95 complete tools, and 92 served tools. Production tool-plane independently reported 92 expected / 92 served with no restricted leak.
- Pre-D1 and D1 paths preserved historical data; fresh reached current; damaged shapes failed closed.
- Atomic proof ended with 2 instruments, 2 quotes, 2 `quotes` links, 1 `has_leg`, 0 `offered_on`, 0 `lists`, and 4 ingest events.
- Generated reads returned the market rows/edges. Exact replay, typed conflicts, invalid final rows, and injected final storage faults wrote no residue.

## Independent baits

Every tracked target was hashed before mutation and restored to the identical hash before its green control.

1. Re-export `creationHandlers`:

```text
market-ingest: . leaks raw write primitives: creationHandlers
FAIL market-ingest; exit 1
restore → PASS market-ingest; exit 0
```

2. Remove `0002` from an isolated copy of the canonical real package:

```text
removed=["node_modules/qf-kernel-schema/golden/upgrades/0002-market-ingest.sql"]
inspection={"ok":false,"reason":"missing packaged SQL artifact: node_modules/qf-kernel-schema/golden/upgrades/0002-market-ingest.sql"}
exit 1
untouched canonical package → inspection ok; exit 0
```

The disposable 1.7 GB bait copy was removed after capture; the canonical package was never mutated.

3. Remove `pipelineOnly`:

```text
Pipeline command action "ingest_market_batch" must declare pipelineOnly: true
FAIL market-ingest; exit 1
restore → PASS market-ingest; exit 0
```

4. Replace the outer transaction with a direct function:

```text
storage-fault rollback actual instruments=3, ingestEvents=5
expected instruments=2, ingestEvents=4
FAIL market-ingest; exit 1
restore → PASS market-ingest; exit 0
```

## Final authority

```text
HEAD=d1719ef34e80213da4fd367067e1e8308cd724b9
git status --porcelain=v1: empty
git diff --exit-code: 0
git diff --cached --exit-code: 0
git diff --check: 0
```

The packaged-app bait used an isolated exact copy of canonical build output so the verifier exercised real ASAR removal/repack and the production inspector without mutating the green control. The literal two-file upgrade list is accepted because supported predecessor history is finite and fail-closed; the guard rejects both omission and unauthorized extra authorities.
