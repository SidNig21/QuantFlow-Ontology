I added the schema safeguards and ticket fields needed so feed-owned data cannot be written by command paths, and real placed slips can now be represented alongside strategy-proposed wagers.

- I did **not** commit; changes are left in the working tree.

## Deliverables Completed

- **Deliverable 3 (`pipelineFed` flag + enforcing lint)**
  - `qf-kernel-schema/src/define.ts`
    - Added `pipelineFed?: boolean` to `DefinedObject` and `defineObject(...)`.
    - Added `lintCommands(...)` enforcement that throws if a `pipelineFed: true` object is referenced by:
      - any transition command edge (`commands` list), or
      - any creation command (`creationCommands` list).
  - `qf-kernel-schema/src/ontology/market.ts`
    - Set `pipelineFed: true` on `instrument` and `quote`.
  - `qf-kernel-schema/src/define.test.ts`
    - Added explicit tests proving lint goes red for transition-edge and creation-command violations.

- **Deliverable 4a (`ticket` rewrite + `origin`)**
  - `qf-kernel-schema/src/ontology/research.ts`
    - Rewrote `ticket` description to cover both strategy-proposed and operator-supplied as first-class origins.
    - Added `origin: "strategy_proposed" | "operator_supplied"` with trust/provenance-focused description.
  - Regenerated outputs:
    - `qf-kernel-schema/golden/migration.sql`
    - `qf-kernel-schema/golden/tools.json`
    - `qf-kernel-schema/golden/ONTOLOGY.md`

- **Deliverable 4b (missing fields, stake description fix)**
  - `qf-kernel-schema/src/ontology/research.ts`
    - Added `external_ref` (idempotency key semantics in description).
    - Added `placed_at` (CLV-critical timestamp semantics in description).
    - Added `payout` (`nullable`).
    - Updated `stake` description to support both operator-supplied actual stake and strategy-proposed stake.
  - `qf-kernel-schema/src/define.test.ts`
    - Added G3 fixture test that constructs both required bet shapes with synthetic values.

## G1 — `pipelineFed` Falsification (Bait → Red → Restore → Green)

### Red transcript (baited with a temporary `quote` creation command)

Command:
`bun test qf-kernel-schema/src/generate.test.ts`

```text
bun test v1.3.14 (0d9b296a)

qf-kernel-schema/src/generate.test.ts:

# Unhandled error between tests
-------------------------------
529 |     }
530 |     if (typeof cmd.event !== "string" || cmd.event.trim().length === 0) {
531 |       throw new Error(`Creation command "${cmd.action}" is missing event type`);
532 |     }
533 |     if (pipelineFedTypes.has(cmd.object_type)) {
534 |       throw new Error(
                      ^
error: Pipeline-fed type "quote" must not have creation commands (publish_artifact)
      at lintCommands (/home/sidnig21/qf-worktrees/wo-102/qf-kernel-schema/src/define.ts:534:17)
      at /home/sidnig21/qf-worktrees/wo-102/qf-kernel-schema/src/schema.ts:166:1
-------------------------------


 0 pass
 1 fail
 1 error
Ran 1 test across 1 file. [76.00ms]
```

### Green transcript (bait removed)

Command:
`bun test qf-kernel-schema/src/generate.test.ts`

```text
bun test v1.3.14 (0d9b296a)

 10 pass
 0 fail
 126 expect() calls
Ran 10 tests across 1 file. [85.00ms]
```

## G3 — Real-Slip Representability Fixture

- **Fixture path:** `qf-kernel-schema/src/define.test.ts`
- **Test name:** `real-slip representability fixture builds a single and a five-leg parlay with a void leg`

Command:
`bun test qf-kernel-schema/src/define.test.ts --test-name-pattern "real-slip representability fixture"`

```text
bun test v1.3.14 (0d9b296a)

 1 pass
 18 filtered out
 0 fail
 8 expect() calls
Ran 1 test across 1 file. [64.00ms]
```

### Exact enumeration: ticket-side facts with no structural home (forced into `ticket.legs` blob)

In the fixture, these facts must live in `legs` JSON because no structural link/property model exists for them:

- `price_american_at_selection` per leg
- `outcome` per leg (including `void` inside a ticket graded `loss`)
- `quote_id` per leg (which exact quote snapshot was taken at selection)
- leg sequencing/association context (array position used to keep per-leg facts aligned)

## `pipelineFed` Marking Report

- **Marked `pipelineFed: true`:**
  - `instrument`
  - `quote`

- **Not marked `pipelineFed: true`:**
  - `competitor`, `market_event`, `venue`, `result`
  - and all non-market objects (`mission`, `hypothesis`, `policy`, `environment`, `strategy`, `ticket`, `dataset`, `run`, `artifact`, `evaluation`, `workspace`, `agent_definition`, `agent_session`, `task`, `tool`, `execution_environment`, `connection`)

- **Why `market_event` cannot be pipeline-fed:**
  - It is stateful and has governed transitions/actions (`start_event`, `settle_event`, `void_event`) represented in transition command edges; the new lint intentionally treats such command coverage as incompatible with `pipelineFed: true`.

## Suite Counts Before → After (with mechanism)

- **Before this run:** `143 pass / 0 fail`, `Ran 143 tests across 3 files`.
- **After this run:** `147 pass / 0 fail`, `Ran 147 tests across 3 files`.

**Mechanism for +4 tests (not inferred from count alone):**
- Added 2 `pipelineFed` lint tests (transition-edge and creation-command red checks).
- Added 1 G3 representability fixture test.
- Added 1 flag-assignment test (only `instrument` and `quote` are pipeline-fed).

No conformance expansion happened from transition growth here; this delta is test-authoring, not transition-table growth.

## Verification Commands Run

Command:
`cd qf-kernel-schema && bun test`

```text
bun test v1.3.14 (0d9b296a)

 147 pass
 0 fail
 392 expect() calls
Ran 147 tests across 3 files. [95.00ms]
```

Command:
`cd qf-kernel-schema && bun run generate && bun test`

```text
$ bun run scripts/generate.ts
Wrote golden/migration.sql, golden/tools.json, golden/ONTOLOGY.md, golden/conformance.test.ts
bun test v1.3.14 (0d9b296a)

 147 pass
 0 fail
 392 expect() calls
Ran 147 tests across 3 files. [89.00ms]
```

Command:
`bun qa/run.ts --list`

```text
repo-shape	Front door + authority map + orders dir exist; CLA machinery stays gone
lockfile-committed	bun.lock exists and is not gitignored (reproducible installs)
schema	qf-kernel-schema tests green (lint, golden, determinism, conformance)
runtime-proof	WO-004a AgentOS→ACP→ToolLoopAgent proof (P1–P4; no API key; installs own deps; pack-once in test beforeAll)
kernel	qf-kernel tests green (migration, commands, replay, session id, trace) — installs own deps
kernel-sole-writer	Law E: no SQLite/DDL/DML for domain types outside packages/qf-kernel (+ schema allowlist)
kernel-sole-writer-app	WO-006b: only collab-electron/src/main/kernel.ts may import qf-kernel/sqlite or reference kernel.db
no-canvas-domain-writes	Law E: no QuantFlow domain type persisted via canvas-state / canvas-persistence
doc-action-surface	Debt #0: ONTOLOGY_SCHEMA.md §Actions equals schema.ts actions (names both directions)
agent-path	WO-006c: headless spawn→stream→tool→artifact, concurrency, cancel, orphans, reconcile
one-skin	WO-006d/007: no raw hex/rgb/hsl or non-token font-family outside windows/shared/qf-tokens.css
dock-registry	WO-007: agent_definition registry list/resolve, species-literal scan, linkSoftware admission
```

## Scope Guard Confirmations

- `packages/qf-kernel`: **not touched**
- `collab-electron`: **not touched**
- Added **no** transition edge, command, or creation path for arrival-settled tickets.
- Added **no** link writes/properties.

## Judgment Calls Where Order Was Silent

- Chose to enforce `pipelineFed` inside existing `lintCommands(...)` (instead of a new lint function) so the flag and its consumer remain in the same command-coverage contract.
- Chose to place G3 representability proof in `src/define.test.ts` (existing schema lint test file) to keep scope local to schema package tests and avoid introducing another test file.
- For the synthetic five-leg parlay fixture, set `payout: 0` on a graded `loss` ticket to keep terminal-grade + payout semantics explicit in typed data while preserving synthetic-only values.

## Broken/Observed but Not Fixed

- No additional out-of-scope defects were changed.
- Known WO-102 carry-forward gap remains: per-leg structured ticket facts still require `legs` JSON due lack of leg-level structural link properties (intentionally left for WO-103).
