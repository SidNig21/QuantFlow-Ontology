## Plain language

An AI assistant can now look up records, search them with simple filters, and follow connections between them through a live tool server — but it still cannot change anything in the system.

---

## Deliverables

### D0 · observe-door clause 2 allowlist

**What:** Replaced directory-wide trust of `qf-kernel-schema/` with a file allowlist; removed `.json` exclusion so JSON configs are scanned.

**File:** `qa/gates/observe-door.ts` — `SERVING_ALLOWLIST` now holds exactly three generator paths plus the gate itself.

**observe-door allowlist addition:** None. The MCP server lives in `tools/qf-read-tools/`, iterates `schema.objects` at runtime, and never reads `golden/tools.json` or calls `generateMcp()`.

### D1 · Schema-driven read layer

**What:** `packages/qf-kernel/src/read.ts` — `getObject`, `queryObjects`, `getLinks`.

**Mechanism (type-agnostic, no per-type switch):**

```1:7:packages/qf-kernel/src/read.ts
import { schema as defaultSchema } from "qf-kernel-schema";
import { unwrapZodType, type DefinedObject, type Schema } from "qf-kernel-schema/define";
import type { KernelDb } from "./db.ts";
import { KernelError } from "./errors.ts";

function objectByName(schema: Schema): Map<string, DefinedObject> {
  return new Map(schema.objects.map((o) => [o.name, o]));
```

Second caller: `tools/qf-read-tools/src/register.ts` passes `schema` into `getObject` / `queryObjects` inside the `schema.objects` loop.

**Legacy readers:** `listArtifacts`, `listAgentSessions`, `listAgentDefinitions`, `getAgentDefinition` unchanged. They *could* later become thin wrappers over `queryObjects` / `getObject`, but each bakes in a specific `ORDER BY` or lookup key (`agent_definition` by name not id) — worth a dedicated cleanup rung, not this one.

### D2 · Third read tool + honest `_query` filters

**Predicted vs measured:**

| Metric | Predicted | Measured | Mechanism |
|---|---|---|---|
| Tool definitions | 71 → 94 | **94** | `23 × 3 read + 25 action` |
| Read definitions | 46 → 69 | **69** | `readToolsForObject()` emits `_get`, `_query`, `_links` per object |
| Action definitions | 25 → 25 | **25** | `generateMcp` action loop untouched |

**Omitted from `_query` filters** (record/object/array-of-object — not expressible as simple equality JSON-schema filters):

`competitor.external_refs`, `instrument.params`, `quote.coverage`, `result.outcome`, `ticket.legs`, `dataset.coverage`, `run.params`, `evaluation.metrics`

**Golden files changed:** `golden/tools.json` only (+854 lines). `migration.sql`, `ONTOLOGY.md`, `conformance.test.ts` unchanged.

### D3 · MCP read server

**Where:** `tools/qf-read-tools/` — same precedent as `tools/qf-peer-bus/`.

**Why:** Tool servers live under `tools/`; keeps the server outside `qf-kernel-schema/` so it does not need observe-door serving allowlist trust.

**Exclusion mechanism:** `registerReadTools()` iterates `schema.objects` only; `schema.actions` is never visited. Registration is in `tools/qf-read-tools/src/register.ts`; entrypoint is `tools/qf-read-tools/src/server.ts`. Kernel opened with `openKernel(path, { readonly: true })` — Bun supports `readonly: true` on `bun:sqlite`.

### D4 · Debt #9 compaction ruling

| | Bytes |
|---|---|
| Before | 46,589 |
| After | 82,340 (+76.7%) |

**Ruling: no compaction.** Growth is from +23 `_links` tools and larger per-object `_query` schemas with property filters. Pretty-printed JSON makes per-type diffs reviewable; minifying would shrink bytes but obscure what changed in review.

---

## Gates

### G1 · observe-door attacks (6 transcripts)

**Attack A (1) pre-fix miss:**
```
PASS  observe-door
exit=0
```

**Attack A (2) red:**
```
observe-door: serving surface violation (golden/tools.json) at qf-kernel-schema/src/mcp-server.ts
FAIL  observe-door
exit=1
```

**Attack A (3) green:**
```
PASS  observe-door
exit=0
```

**Attack B (1) pre-fix miss:**
```
PASS  observe-door
exit=0
```

**Attack B (2) red:**
```
observe-door: serving surface violation (golden/tools.json) at collab-electron/mcp-config.json
FAIL  observe-door
exit=1
```

**Attack B (3) green:**
```
PASS  observe-door
exit=0
```

### G2 · Doctrine phase-exit gate

```
=== G2 doctrine phase-exit gate ===
G2_experimental_tools=["qf_experimental_get","qf_experimental_links","qf_experimental_query"]
G2_experimental_get_response={"content":[{"type":"text","text":"{\n  \"id\": \"exp-probe-1\",\n  \"created_at\": \"2026-07-26T12:00:00.000Z\",\n  \"label\": \"gate-fixture\"\n}"}]}
```

Fixture: `tools/qf-read-tools/src/fixtures/experimental-schema.ts`. Server loaded via `QF_READ_SCHEMA_MODULE`. **Zero new `registerTool` lines outside the `schema.objects` loop** — only three `registerTool` calls inside the loop in `register.ts`.

### G3 · Links traversal (tool vs SQL)

```
G3_tool_response={"content":[{"type":"text","text":"[\n  {\n    \"id\": \"bbf43e69-cda8-42b5-9ecf-9375a3bd9aa1\",\n    \"kind\": \"tests\",\n    \"from_id\": \"harness-run-1\",\n    \"to_id\": \"ece538ae-2755-4d09-81b5-607c0dc2c06b\",\n    \"created_at\": \"2026-07-26T17:52:16.868Z\"\n  }\n]"}]}
G3_sql_rows=[{"kind":"tests","from_id":"harness-run-1","to_id":"ece538ae-2755-4d09-81b5-607c0dc2c06b"}]
```

### G4 · Zero action tools (MCP client `tools/list`)

```
G4_tools_list_length=69
G4_action_tools_leaked=[]
```

(Full raw `tools/list` response is 74.8 KB / 1995 lines — captured in harness run; all 69 names match `_(get|query|links)$`, zero action tools from `schema.actions`.)

### G5 · Read layer rejects bait

**Unknown type — green baseline:**
```
 2 pass
 0 fail
exit=0
```

**Unknown type — red (validation removed):**
```
(fail) read layer > unknown type name errors before SQL
Expected pattern: /Unknown object type/
Received message: "no such table: not_a_real_type"
exit=1
```

**Unknown type — green restore:**
```
 2 pass
 0 fail
exit=0
```

**Unknown filter — red:**
```
(fail) read layer > unknown filter key errors before SQL
Expected pattern: /Unknown filter key/
exit=1
```

**Unknown filter — green restore:**
```
 2 pass
 0 fail
exit=0
```

### G6 · Cold suite (verifier-run — not executed by builder)

Per PROTOCOL cold-run-is-verifier-only rule. Builder did **not** run `bun qa/run.ts --all` cold.

### Builder static + package gates

```
PASS  repo-shape          exit=0
PASS  lockfile-committed  exit=0
PASS  schema              exit=0  (149 tests)
PASS  kernel              exit=0  (28 tests)
PASS  typecheck           exit=0
PASS  kernel-sole-writer  exit=0
PASS  kernel-sole-writer-app exit=0
PASS  no-canvas-domain-writes exit=0
PASS  doc-action-surface  exit=0
PASS  observe-door        exit=0
```

`agent-path` failed on pre-existing `ai/test` resolve during `pack-agent` — outside WO-104 scope; not introduced by this branch.

Gate count: **14** (unchanged). Schema tests: **140 → 149** (+9: links tool count test, expanded description test, plus golden byte tests reflecting new `tools.json`).

---

## collab-electron untouched

```
git diff --stat main...wo-104
```

No `collab-electron/` paths in diff (18 files changed, all listed above — zero under `collab-electron/`).

---

## Git

**Branch:** `wo-104` (worktree `/home/sidnig21/qf-worktrees/wo-104`)

**Commits:**
- `968914a` feat(wo-104): serve schema-driven read tools over MCP
- `1a0e4b3` chore(wo-104): commit qf-read-tools lockfile

**Push:** `git push -u origin wo-104` was **refused by the sandbox** (no workaround attempted). Operator must push from this worktree.

---

## Judgment (where the order was silent)

1. **Optional `schema` parameter on `getObject` / `queryObjects`** — G2 requires a fixture type not in production schema. The server passes its loaded schema through; default remains production `qf-kernel-schema`. This is the smallest seam that makes the phase-exit gate honest without polluting production golden files.

2. **`seedExperimentalFixtureTable` in `packages/qf-kernel/src/fixtures.ts`** — G2 harness DDL had to live inside `packages/qf-kernel/` to satisfy `kernel-sole-writer`. The order did not name this helper.

3. **G4 action-tool absence check** — harness derives forbidden names from `schema.actions` at runtime instead of hardcoding `qf_observe_ticket`, which would trip `observe-door` clause 1.

4. **Suspected order-text gap:** G2 fixture type named `experimental` collides conceptually with lifecycle `experimental` on every other type. Worked, but a name like `fixture_probe` would have been clearer — the gate text's backticks invited the collision.
