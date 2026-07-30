# WO-107b independent verification — REWORK

QuantFlow's new market-loading mechanism passes its focused checks and ships its upgrade file, but the release cannot pass because two existing safeguards reject the candidate.

## Candidate and scope

- Exact candidate: `20a7e2805c753f21ee434f7b04373b4e022a6372`
- Parent/base: `67302b8`; stale `origin/main` was not used.
- Candidate delta: 44 files, 2,951 insertions, 104 deletions.
- Final `git status --porcelain=v1`, unstaged diff, and cached diff were empty; HEAD stayed exact.

## Release evidence and environment separation

The first sandboxed cold launch failed before tests because Bun could not write its temp directory. An escalated continuation inherited that interrupted dependency extraction and failed the renderer build with 41 locked `lib0@0.2.117` files absent. Replacing only the ignored dependency tree through the frozen lock restored the missing files; the production build and real package then passed:

```text
10031 modules transformed
build exit 0
package:verify: PASS
package:verify: checked migration.sql (38327 bytes)
package:verify: checked pre-d1-profile-identity.sql (37432 bytes)
package:verify: checked 0001-agent-profile-identity.sql (1974 bytes)
package:verify: checked 0002-market-ingest.sql (451 bytes)
```

Independent ASAR extraction found all four SQL authorities byte-identical to the repo:

| ASAR artifact | Bytes | SHA-256 |
|---|---:|---|
| `golden/migration.sql` | 38327 | `9a0abfab0b9df9c0c2a98b3a07df60c7f3f770bd43b624ed82d2233dadc4f3dd` |
| `compat/pre-d1-profile-identity.sql` | 37432 | `935fb49c677f91c66da9624fbd2ce501b4f20fb60739acc11b0681a03181f807` |
| `upgrades/0001-agent-profile-identity.sql` | 1974 | `a0a4dc1259aa658cf1a4fe7e47585ed5f289d2963d3306b5d687ffbc8de2a768` |
| `upgrades/0002-market-ingest.sql` | 451 | `cfa923ba7c324a032cc183133fad546c12e0d1ea73575dbea390586ee3621745` |

The bounded all-gates continuation separated sandbox failures (Bun read-only temp directories and npm spawn EPERM) from two deterministic candidate failures. It expired globally at 240 seconds during `vault-projection`; `tool-plane` did not reach its MCP process because its install failed first, so this verifier neither reproduced nor attributed the previously reported `listTools()` stall.

## Candidate blocker 1 — serving-authority boundary

```text
observe-door: serving surface violation (generateMcp() at qa/gates/market-ingest/run.ts
FAIL observe-door
```

`qa/gates/market-ingest/run.ts` imported and called the complete-tool generator outside the narrow allowlist owned by `observe-door`. This is a deterministic source violation, not a sandbox failure.

## Candidate blocker 2 — upgrade structural guard

```text
dock-profile-identity FAIL: expected one production upgradeSqlPath call, found 2
FAIL dock-profile-identity
```

Production correctly resolved both `0001` and required `0002` under the writable branch, but the existing D1 gate still hard-coded one call. The gate must govern the exact two-file set while retaining its writable-only assertion.

## Focused evidence observed

```text
dispatch_actions=26 pipeline_rows=2
objects=23 actions=26 complete_tools=95 served_tools=92
pre_d1_upgrade_preserved=true
d1_upgrade_preserved=true
fresh_current=true
damaged_predecessor_fail_closed=true
market_counts={"instruments":2,"quotes":2,"quoteLinks":2,"hasLegLinks":1,"offeredOnLinks":0,"listsLinks":0,"ingestEvents":4}
PASS market-ingest
```

Kernel tests reported 67 pass / 0 fail. No independent baits were run after the candidate became deterministically red; the coordinator stopped further work on an already-rejected candidate.

## Verdict

**REWORK.** Repair both gate integrations, then submit a new exact candidate for one clean cold release run and four independent red-to-green baits.
