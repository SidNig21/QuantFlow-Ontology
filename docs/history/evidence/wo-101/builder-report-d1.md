I split the schema into subject-specific parts so future work is easier to change safely, while keeping behavior and generated outputs unchanged.

### 1) Files created and what moved

Created:

- `qf-kernel-schema/src/ontology/market.ts`
  - Moved market-plane object definitions: `competitor`, `event`, `market`, `odds_series`, `result`
  - Moved links owned by market types: `participates_in`, `offered_on`, `quotes`, `settles`
  - Moved market-plane actions: `start_event`, `settle_event`, `void_event`

- `qf-kernel-schema/src/ontology/research.ts`
  - Moved research-plane object definitions: `hypothesis`, `strategy`, `ticket`, `dataset`, `run`, `artifact`, `evaluation`
  - Moved links owned by research types: `tests`, `has_leg`, `uses`, `executes_in`, `produces`, `derived_from`, `evaluated_by`
  - Moved research-plane actions: `create_hypothesis`, `register_dataset_version`, `start_run`, `cancel_run`, `complete_run`, `fail_run`, `retry_run`, `close_run`, `grade_ticket`, `publish_artifact`, `record_evaluation`, `resolve_hypothesis`

- `qf-kernel-schema/src/ontology/agent.ts`
  - Moved agent-plane object definitions: `workspace`, `agent_definition`, `agent_session`, `task`, `tool`, `execution_environment`, `connection`
  - Moved links owned by agent types: `assigned_to`, `delegates_to`
  - Moved agent-plane actions: `register_agent_definition`, `create_agent_session`, `start_agent_session`, `block_agent_session`, `unblock_agent_session`, `cancel_agent_session`, `fail_agent_session`, `close_agent_session`, `request_approval`, `approve`, `deny`, `promote_type`

Updated:

- `qf-kernel-schema/src/schema.ts`
  - Now a pure aggregator: imports plane exports, re-exports all, preserves original declaration order in `schema`, and runs `lintSchema` + `lintCommands` unchanged.

Working tree (no commit made):

```text
 M qf-kernel-schema/src/schema.ts
?? qf-kernel-schema/src/ontology/
```

---

### 2) Full unedited output of `bun test` (from `cd qf-kernel-schema && bun install && bun test`)

```text
bun install v1.3.14 (0d9b296a)

Checked 6 installs across 7 packages (no changes) [1.00ms]
bun test v1.3.14 (0d9b296a)

 140 pass
 0 fail
 355 expect() calls
Ran 140 tests across 3 files. [77.00ms]
```

Explicit statement on golden tests in `src/generate.test.ts`:
- I did **not** run `bun run generate`.
- `bun test` reported `0 fail`.
- I also ran `bun test src/generate.test.ts`, which reported `10 pass / 0 fail`.
- So the golden tests in `src/generate.test.ts` were green **without regenerating**.

---

### 3) Test count before and after

- Before (order baseline, 2026-07-25): **140**
- After (this run): **140**

---

### 4) Places I exercised judgment where WO-101 was silent

- Cross-plane placement for `produces`: its `from` side includes both `run` (research) and `agent_session` (agent). I placed it in `research.ts` and imported `agent_session` there, keeping behavior identical and preserving the original schema order in `schema.ts`.
- Plane ownership for governance actions (`request_approval`, `approve`, `deny`, `promote_type`) was not explicitly spelled out; I grouped them under `agent.ts` as operational/agent-plane concerns.
- Doctrine naming says market/agent while schema object names remain unchanged (`workspace`, etc.); I applied doctrine naming at the file/module boundary only (`market.ts`, `research.ts`, `agent.ts`) to keep Deliverable 1 behavior-neutral.

---

### 5) Anything found broken and not fixed

- No new breakage introduced or repaired in this run.
- Known WO-103-owned write-path breakage remained untouched (as required).
- No edits were made to `golden/`, `packages/qf-kernel`, `collab-electron`, or `commands.ts`.

For completeness, static gate listing command output (`bun qa/run.ts --list`) was:

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
