# WO-103 Builder Report

The research workflow can now be recorded end-to-end: missing research objects can be created, relationships between them can be written, and settled betting slips can arrive already won without faking a transition the ticket never went through.

**Branch:** `wo-103` · **Commits:** D0 `2cf2a0c` · feature `a09f12f` · **Not merged.**

---

## Deliverable 0 — standalone commit

**Commit:** `2cf2a0c`

**What changed:**
- Replaced hand-maintained `ID_FIELD`/`STATE_FIELD` in `execute.ts` with `transitionIdFields` / `transitionStateFields` derived from schema action inputs and `stateFieldName()` (`qf-kernel-schema/src/transition-meta.ts`).
- Added `typecheck` gate to `qa/run.ts` (runs `bun run typecheck` in `packages/qf-kernel` and `tools/qf-peer-bus`).
- Added kernel test driving `start_event` on a seeded `market_event`.

**Proof:**
```
cd packages/qf-kernel && bun test  → 18 pass, 0 fail
cd packages/qf-kernel && bunx tsc --noEmit  → exit 0
bun qa/run.ts typecheck  → PASS  typecheck
```

---

## Deliverable 1 — Creation commands

Added creation handlers wired through `creationCommands` + `creationHandlers` for:

| Type | Action | Event |
|---|---|---|
| hypothesis | `create_hypothesis` | `hypothesis.created` |
| dataset | `register_dataset_version` | `dataset.registered` |
| run | `create_run` *(new action)* | `run.created` |
| evaluation | `record_evaluation` | `evaluation.recorded` |
| mission | `create_mission` *(new action)* | `mission.created` |
| ticket | `create_ticket` *(new action)* | `ticket.created` / `ticket.observed` |

Three previously-dead actions wired: `create_hypothesis`, `register_dataset_version`, `record_evaluation`. Six remaining dead actions untouched (WO-103b).

**`record_evaluation` lineage ruling:** Both input fields **and** links. Optional `hypothesis_id`, `run_id`, `artifact_id` on the action input carry lineage in the event payload; `artifact_id` / `run_id` are also auto-converted to `evaluated_by` link specs. Explicit `links` array on any creation command is the canonical edge mechanism.

**`mission` ruling:** No `CONTAINS hypothesis` link added — WO-101 deliberately omitted it; mission↔hypothesis grouping remains a WO-103b/schema question. Mission is creatable; hypothesis attachment routes through `tests` links on run creation.

---

## Deliverable 2 — Link writer

`packages/qf-kernel/src/links.ts`:
- Optional `links: [{ kind, from_id?, to_id? }]` stripped from creation input before field validation.
- `writeLinks()` validates kind against `link-endpoints.ts` (generated from schema declarations) and endpoint object types via DB lookup **before** `INSERT INTO links`.
- Rejects with `IllegalLinkError` (layer `kind` or `endpoint`).

---

## Deliverable 3 — `gates` edge

Added `gates` link (`evaluation → artifact`) in `research.ts`. Proven writable in G2 fixture via `publish_artifact` report + `{ kind: "gates", from_id: evaluation_id }`.

---

## Deliverable 4 — Arrival-settled tickets

`create_ticket` enforces structurally via `ticket.origin`:
- `strategy_proposed` + terminal grade → `FabricatedStateError` (nothing written).
- `operator_supplied` + terminal grade → row inserted at grade, event `ticket.observed` (not `ticket.graded`).

Generalized as a creation-path property (`origin` check in `createTicket`), not a ticket-only code path.

---

## Gate transcripts

### G1 — D0 regression falsified

**Bait — typecheck (typed broken maps restored):**
```
src/execute.ts(10,3): error TS2353: Object literal may only specify known properties, and 'event' does not exist in type 'Record<"run" | "hypothesis" | "ticket" | "market_event" | "agent_session", string>'.
src/execute.ts(18,3): error TS2353: Object literal may only specify known properties, and 'event' does not exist in type 'Record<"run" | "hypothesis" | "ticket" | "market_event" | "agent_session", "status" | "grade">'.
exit: 2
```

**Bait — market_event test:**
```
KernelError: Command "start_event" requires undefined
(fail) qf-kernel > market_event start_event transition end to end (WO-103 D0)
test exit: 1
```

**Restore — typecheck:** exit 0  
**Restore — market_event test:** 1 pass, 0 fail, exit 0

### G2 — Six-stage chain + raw SQL read-back

**Query:**
```sql
SELECT 'hypothesis' AS t, id, status FROM hypothesis
UNION ALL SELECT 'dataset', id, kind FROM dataset
UNION ALL SELECT 'run', id, status FROM run
UNION ALL SELECT 'artifact', id, kind FROM artifact
UNION ALL SELECT 'evaluation', id, verdict FROM evaluation
ORDER BY t;

SELECT kind, from_id, to_id FROM links ORDER BY kind;
```

**Output:**
```json
[
  {"t":"artifact","id":"571b0e35…","status":"result_set"},
  {"t":"artifact","id":"fe494651…","status":"report"},
  {"t":"dataset","id":"aaaa…aaaa","status":"odds_history"},
  {"t":"evaluation","id":"32dc7861-…","status":"supports"},
  {"t":"hypothesis","id":"01d46f83-…","status":"open"},
  {"t":"run","id":"run-chain-1","status":"queued"}
]

[
  {"kind":"evaluated_by","from_id":"571b0e35…","to_id":"32dc7861-…"},
  {"kind":"gates","from_id":"32dc7861-…","to_id":"fe494651…"},
  {"kind":"produces","from_id":"run-chain-1","to_id":"571b0e35…"},
  {"kind":"tests","from_id":"run-chain-1","to_id":"01d46f83-…"},
  {"kind":"uses","from_id":"run-chain-1","to_id":"aaaa…aaaa"}
]
```

All via `execute()` only.

### G3 — Illegal edges (both shapes)

**Bait — unknown kind → red:**
```
IllegalLinkError: Illegal link (kind): not_a_real_link — expected participates_in, …
run count after reject: 0, event count unchanged
```

**Bait — wrong endpoint type → red (validator, not SQLite):**
```
IllegalLinkError: Illegal link (endpoint): evaluated_by from dataset — expected allowed from: artifact, run
layer: endpoint
evaluation count after reject: 0
```

**Restore:** full kernel suite 22 pass, 0 fail.

### G4 — Fabricated state impossible

**Rejected:** `strategy_proposed` + `grade: "win"` → `FabricatedStateError`

**Accepted event rows (`operator_supplied` + `grade: "win"`):**
```json
[{"type":"ticket.observed","payload":"{…\"observation\":true,\"grade\":\"win\"…}"}]
```
No `ticket.graded` event; no `pending → win` transition.

---

## Counts before → after (mechanism)

| Measure | Before | After | Delta mechanism |
|---|---|---|---|
| QA gates | 12 | 13 | +`typecheck` gate in `qa/run.ts` |
| Kernel tests | 17 | 22 | +D0 market_event, +G2 chain, +G3×2, +G4 |
| Schema tests | 147 | 147 | unchanged (golden regen is byte-checked by existing generate tests) |
| Creatable types via execute | 3 | 9 | +6 creation handlers |
| Writable link kinds | 0 | 15 | `writeLinks()` + `gates` link added |
| Schema actions | 27 | 30 | +`create_run`, `create_mission`, `create_ticket` |

---

## Static gates (builder-run)

All PASS: `repo-shape`, `lockfile-committed`, `kernel-sole-writer`, `kernel-sole-writer-app`, `no-canvas-domain-writes`, `doc-action-surface`, `one-skin`, `typecheck`.

**`collab-electron` untouched:**
```
git diff --stat main...wo-103 -- collab-electron
(empty)
```

---

## Findings recorded, not acted on (WO-103b)

- Six remaining dead actions: `retry_run`, `close_run`, `request_approval`, `approve`, `deny`, `promote_type`
- `connection` object duplicating `links` table (`kind`/`from_ref`/`to_ref` on an object row)
- Market-plane ingest path for `pipelineFed` types (`instrument`, `quote`)
- `ONTOLOGY_SCHEMA.md` link/state-machine sections still stale vs live schema (debt #21); only §Actions line updated for gate compliance
- `QF_EXECUTE_ALLOWLIST` unchanged at `["publish_artifact"]`

---

## Judgment where the order was silent

1. **ID_FIELD derivation:** Fully derived via `transition-meta.ts` from action `*_id` inputs + `stateFieldName()`. Next rename safety: adding a stateful type requires a transition command whose action input exposes the id field name; module init throws on mismatch.

2. **`record_evaluation` lineage:** Dual path — convenience input fields for payload/traceability plus auto-link conversion for `artifact_id`/`run_id`. `hypothesis_id` stays payload-only (no direct evaluation↔hypothesis link in schema).

3. **New actions vs doc-action-surface:** Order listed `ONTOLOGY_SCHEMA.md` as WO-103b scope but also required `doc-action-surface` green. Added `create_run` / `create_mission` / `create_ticket` to schema **and** the §Actions line — minimal doc touch to satisfy the gate; full doc reconciliation remains WO-103b.

4. **`links` input shape:** Array `{ kind, from_id?, to_id? }` with endpoint inference from which side is the created object — matches SCOPES ruling for atomic node+edge creation.

5. **Ticket observation event:** `ticket.observed` distinct from `ticket.created`/`ticket.graded` so the ledger records arrival-at-state without implying a transition.

6. **Where I think the order may hide a defect:** G2 does not require `create_mission` in the chain — mission creation is implemented but unproven in an acceptance fixture. An agent could ship mission-less desks without failing G2. Also, `objectTypeOf()` scans all ontology tables per link validation — correct but O(tables) per edge; fine at v1 scale, may matter at WO-104 tool volume.

---

**G5 (`bun qa/run.ts --all` cold):** Verifier-run, not executed by this builder per PROTOCOL.

**Status:** Complete pending verification.
