# WO-107b — builder evidence

**In plain terms:** QuantFlow now has one guarded, all-or-nothing door for loading market rows, and a retry cannot silently duplicate or rewrite what the founder already trusted.

**Candidate branch:** `codex/wo-107b`

**Implementation commit:** `49ae323`

This is builder evidence, not a shipping verdict. A separate cold verifier decides PASS or REWORK.

## D0–D5 implementation

- D0: `qf-kernel` no longer exports `creationHandlers`, `appendEvent`, or `insertRun` from either public entry. The permanent market gate inventories the live package exports and production dispatch source.
- D1: schema authority now owns `pipelineOnly`, a third `pipelineCommands` family, coupled lints, and `ingest_market_batch`. The complete generated catalog contains the action; the agent-served MCP catalog excludes it through one shared policy predicate.
- D2: generated `0002-market-ingest.sql` advances both exact historical predecessors to current, while fresh databases use the current migration and damaged shapes fail closed. Electron package inspection requires and byte-compares `0002` inside `app.asar`.
- D3: `execute()` catalog-dispatches one strict instrument/quote batch into one outer transaction. Rows, derived `quotes` links, and provenance events commit together; canonical state/provenance replays are no-ops and disagreements are typed conflicts.
- D4: generated reads return the ingested rows and derived quote edge. The existing generic link command creates `has_leg`; `offered_on` and `lists` remain absent.
- D5: `market-ingest` is a permanent cold-safe QA gate. The official README now states that trusted bulk ingestion still crosses the Kernel's one `execute()` door and is not an agent write surface.

No real Bovada call, credential, bet, trade, scheduler, venue/event creation, Dock UI, or second market was added.

## Focused builder evidence

```text
$ cd qf-kernel-schema && bun test
158 pass, 0 fail, 576 assertions

$ cd packages/qf-kernel && bun test
67 pass, 0 fail, 214 assertions

$ bun qa/run.ts market-ingest
objects=23 actions=26 complete_tools=95 served_tools=92
pre_d1_upgrade_preserved=true
d1_upgrade_preserved=true
fresh_current=true
damaged_predecessor_fail_closed=true
market_counts={"instruments":2,"quotes":2,"quoteLinks":2,"hasLegLinks":1,"offeredOnLinks":0,"listsLinks":0,"ingestEvents":4}
PASS market-ingest

$ bun qa/run.ts kernel-sole-writer
PASS kernel-sole-writer

$ cd collab-electron && bun test scripts/package-lib/package-inspect.test.ts
14 pass, 0 fail, 38 expect() calls

$ cd tools/qf-read-tools && bun run typecheck
exit 0
```

The schema generator was run once with the implementation. Its committed outputs contain 23 objects, 26 actions, 95 complete tools, 92 served tools, and generated upgrade `0002`. The previously generated conformance artifact and `0001` upgrade are byte-unchanged.

The agent-advertised definition array is byte-identical before and after this order:

```text
main 67302b8:  length=92 bytes=64011 sha256=f42d36773e4b4d726769442f4196ca7ce18c03384b78b8d55446150ff4c72021
WO-107b:      length=92 bytes=64011 sha256=f42d36773e4b4d726769442f4196ca7ce18c03384b78b8d55446150ff4c72021
```

`tool-plane`/`tool-discovery` reached both Kernel boot lines but stalled at the first SDK `listTools()` handshake in this Codex desktop sandbox. A bounded 20-second control on unchanged main `67302b8` stalled at the same point and exited 124, so this is recorded as an environment/pre-existing MCP transport condition rather than concealed as a WO-107b pass. The independent cold verifier owns the canonical release run.

## Required falsification

Each bait changed production source, ran the permanent market gate, and was restored exactly. One final restored run covered all four and printed `PASS market-ingest`; `git diff --exit-code` and `git diff --check` were clean before that run.

| Deliberate break | Red receipt |
|---|---|
| Re-exported `creationHandlers` from the root package | `. leaks raw write primitives: creationHandlers`; exit 1 |
| Replaced the production `0002` upgrade resolution with `0001` | `SQLiteError: duplicate column name: runtime_profile` on the pre-D1 chain; exit 1 |
| Removed `pipelineOnly` from `ingest_market_batch` | `Pipeline command action "ingest_market_batch" must declare pipelineOnly: true`; exit 1 |
| Replaced the outer ingest transaction with a direct function | storage-fault rollback left `instruments=3` and `ingestEvents=5` instead of `2` and `4`; exit 1 |

Restored receipt:

```text
pre_d1_upgrade_preserved=true
d1_upgrade_preserved=true
fresh_current=true
damaged_predecessor_fail_closed=true
market_counts={"instruments":2,"quotes":2,"quoteLinks":2,"hasLegLinks":1,"offeredOnLinks":0,"listsLinks":0,"ingestEvents":4}
PASS market-ingest
```

## Judgment

An exact replay requires the original trace as well as identical row state, source Artifact, observation time, and derived edge. Accepting a new trace as a no-op would return a receipt for a trace that has no event, so a different trace is an explicit conflict rather than a dishonest success. `instrument_id` is not included in the quote row digest because it is not stored in the quote table; the separately governed `quotes` edge is checked exactly. `params` and `coverage` remain declared open JSON objects as ordered, while every surrounding envelope is strict.
