## Builder report — WO-103 rework round 1

The system can now create research objects, record connections between them, and distinguish “the AI proposed this bet” from “the operator brought in a settled slip” — without letting a caller fake the distinction by changing one field.

**Branch:** `wo-103` · **Rework commit:** `358d5b4` · **Deliverable 0 standalone commit (unchanged):** `2cf2a0c`

---

### Deliverable 0

Maps remain schema-derived in `qf-kernel-schema/src/transition-meta.ts`. R4 fix: `buildTransitionIdFields()` now uses `commands.filter(c => c.type === type)` and requires all commands for a type agree on the id field; `objectIdFieldFromAction()` errors on multiple `*_id` keys.

**Typecheck gate (R1):** `qa/run.ts` discovers packages via repo walk (any `package.json` with a `typecheck` script), runs `bun install --frozen-lockfile` when a lockfile exists, then `bunx tsc --noEmit` — never `bun run typecheck`.

```bash
bun qa/run.ts typecheck
# PASS  typecheck
echo $?
# 0
```

---

### G1 · D0 regression falsified

**Red — market_event test (bait: hardcoded `event` key in `BROKEN_ID_FIELDS`):**
```
KernelError: Command "start_event" requires undefined
(fail) qf-kernel > market_event start_event transition end to end (WO-103 D0)
g1_red_market=1
```

**Red — typecheck (same bait):**
```
src/execute.ts(21,3): error TS2353: Object literal may only specify known properties, and 'event' does not exist in type 'Record<"run" | "hypothesis" | "ticket" | "market_event" | "agent_session", string>'.
g1_red_typecheck=2
```

**Green — restored:**
```
1 pass ... g1_green_market=0
PASS  typecheck
g1_green_typecheck=0
```

---

### G2 · Six-stage chain + raw SQL read-back

Query (from test):
```sql
SELECT 'hypothesis' AS t, id FROM hypothesis
 UNION ALL SELECT 'dataset', id FROM dataset
 UNION ALL SELECT 'run', id FROM run
 UNION ALL SELECT 'artifact', id FROM artifact
 UNION ALL SELECT 'evaluation', id FROM evaluation
 ORDER BY t, id;

SELECT kind, from_id, to_id FROM links ORDER BY kind, from_id, to_id;
```

Output:
```
G2_objects=[{"t":"artifact","id":"1a9a7cab974b94150659cc3df2e2d51e436f3f8438a2650b60a6075ea42d9689"},{"t":"artifact","id":"c0859dc18ea5362b301848a42221a47f42ef15a0af85c498d8da1945e37f503a"},{"t":"dataset","id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},{"t":"evaluation","id":"07ced8ae-09ea-48d0-bbb3-bd755d1c7c71"},{"t":"hypothesis","id":"1326607b-8728-4176-9d6e-973a93acaf42"},{"t":"run","id":"run-chain-1"}]

G2_links=[{"kind":"evaluated_by","from_id":"1a9a7cab974b94150659cc3df2e2d51e436f3f8438a2650b60a6075ea42d9689","to_id":"07ced8ae-09ea-48d0-bbb3-bd755d1c7c71"},{"kind":"gates","from_id":"07ced8ae-09ea-48d0-bbb3-bd755d1c7c71","to_id":"c0859dc18ea5362b301848a42221a47f42ef15a0af85c498d8da1945e37f503a"},{"kind":"produces","from_id":"run-chain-1","to_id":"1a9a7cab974b94150659cc3df2e2d51e436f3f8438a2650b60a6075ea42d9689"},{"kind":"tests","from_id":"run-chain-1","to_id":"1326607b-8728-4176-9d6e-973a93acaf42"},{"kind":"uses","from_id":"run-chain-1","to_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]
```

**Weak spot (still true):** G2 does not exercise `create_mission` or `observe_ticket`.

---

### G3 · Illegal edges

**Red (bait: `validateEndpointTypes` commented out in `links.ts`):**
```
error: expected IllegalLinkError
(fail) qf-kernel > G3 · wrong endpoint type rejected by validator not sqlite
g3_red=1
```

**Green (restored):** `2 pass ... g3_green=0`

Wrong-endpoint rejection layer: `IllegalLinkError` with `layer: "endpoint"` (validator, not SQLite CHECK).

---

### G4 · Verb split (R2)

- `create_ticket` + `grade: "win"` → rejected: `does not accept "grade"`
- `observe_ticket` + `grade: "win"` → accepted

**Event rows:**
```json
[{"type":"ticket.observed","payload":"{\"command\":\"observe_ticket\",\"origin\":\"operator_supplied\",...,\"grade\":\"win\",\"observation\":true,...}"}]
```
No `ticket.graded` or `pending → win` transition.

**Bypass closed — `origin` never read from input:**
```
grep -r 'input\.origin' packages/qf-kernel/src
# (no matches)
```
`parseTicketFields()` calls `rejectSuppliedInitialState(input, "origin", action)` on both verbs; origin is derived from `TICKET_ORIGIN` keyed by provenance.

---

### G4b · Generalization (R3)

**Mechanism:** `packages/qf-kernel/src/creation-policy.ts`
- `rejectSuppliedInitialState()` — system creates (`create_ticket` rejects `grade`; `create_run` rejects `status`)
- `requireObservedGrade()` + `observationEvent()` — observed creates (`observe_ticket`)
- `TICKET_ORIGIN` maps provenance → row `origin`

A second ingested type can adopt the same helpers without copying handler bodies (e.g. future `observe_run` would call `requireObservedGrade` + `observationEvent`).

**`create_run` + `status: "succeeded"`** → rejected: `does not accept "status"` (G4b test).

---

### Counts

| Metric | Before (main) | After | Delta mechanism |
|---|---|---|---|
| Kernel tests | 17 | 23 | +D0 market_event, +G2, +G3×2, +G4, +G4b |
| Schema tests | 147 | 147 | No new schema tests; golden regen only |
| QA gates | 12 | 13 | +`typecheck` (D0) |

**Writable link kinds end-to-end through `execute()`:** **7**
`tests`, `uses`, `produces`, `derived_from`, `evaluated_by`, `gates`, `delegates_to`

**Unreachable (8):**
- `participates_in`, `offered_on`, `quotes`, `lists`, `settles` — pipeline-fed market types, no creation verbs
- `has_leg` — `instrument` not creatable
- `executes_in` — `execution_environment` not creatable
- `assigned_to` — `task` not creatable

---

### Rulings

**`record_evaluation` lineage:** Input fields `hypothesis_id`, `run_id`, `artifact_id` plus optional `links`. `lineageFieldsToLinks()` turns artifact/run ids into `evaluated_by` edges; explicit `links` still work. Graph truth is in `links`; input fields are convenience that the writer normalizes.

**`ID_FIELD`/`STATE_FIELD` derivation:** Derived from schema action inputs and object state fields. `buildTransitionIdFields()` requires agreement across all transition commands per type. Next rename is safe when action `*_id` inputs stay consistent — lint catches drift at build time; D0 test catches runtime.

**`mission` / `CONTAINS hypothesis`:** Not added. WO-101 added `mission` without that link deliberately; no order here authorizes a new link kind. Route to a future order if mission→hypothesis containment is needed.

**`collab-electron`:** `git diff --stat main...wo-103 -- collab-electron` → empty.

---

### Static gates (builder-run)

All exit 0: `repo-shape`, `lockfile-committed`, `kernel-sole-writer`, `kernel-sole-writer-app`, `no-canvas-domain-writes`, `doc-action-surface`, `one-skin`, `typecheck`.

**G5 (`bun qa/run.ts --all`):** verifier-run — not run by builder.

---

### Judgment where the order was silent

1. **Shared ticket body parsing** — `parseTicketFields()` shared by `create_ticket` and `observe_ticket`; only provenance/grade/event differ.
2. **`FabricatedStateError` retained** — superseded for create-path rejection by `KernelError` via `rejectSuppliedInitialState`; class kept for API stability.
3. **Typecheck discovery skips `node_modules`/`.git`** — walks repo root; finds `packages/qf-kernel` and `tools/qf-peer-bus` today; new packages with a `typecheck` script are picked up automatically.
4. **`observe_ticket` creationCommands event** — `ticket.observed` matches the observation event type written at runtime.

**Nominated weakest spot:** G2 still never calls `create_mission` or `observe_ticket`; `delegates_to` and `derived_from` are writable by schema but not exercised in the chain fixture. A verifier probing only G2 could miss a regression in those paths.

---

### Findings recorded, not acted on (WO-103b)

Six remaining dead actions · `connection` redundancy · market-plane ingest · full `ONTOLOGY_SCHEMA.md` reconciliation (debt #21) · IPC allowlist · `collab-electron` allowlist decision.
