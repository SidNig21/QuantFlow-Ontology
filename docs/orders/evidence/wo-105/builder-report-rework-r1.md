I fixed the two merge blockers so the app can start after a crash and the typecheck gate passes again.

## 1. BLOCKER 1 — `fail_agent_session` schema + gate restore

**Schema change** (`qf-kernel-schema/src/ontology/agent.ts`): added optional `reason` string to `fail_agent_session`:

```typescript
reason: z
  .string()
  .optional()
  .describe(
    "Diagnostic label for why the session failed (crash code, stop reason, or boot reconciliation). Optional; recorded in the event payload when supplied and does not affect transition legality.",
  ),
```

**Parse proof:**
```
session_id only: true
with reason: true { session_id: "s1", reason: "app_terminated" }
```

**Gate restore** (`qa/gates/agent-path/run.ts:268`):
```typescript
{ session_id: id, reason: "app_terminated" },
```

**Golden regenerated** (`bun run generate` in `qf-kernel-schema`). Only `golden/tools.json` and `golden/ONTOLOGY.md` changed; `migration.sql` and `conformance.test.ts` unchanged.

---

## 2. BLOCKER 2 — harness typecheck

**Approach:** imported `CompatibilityCallToolResult` from `@modelcontextprotocol/sdk/types.js` and typed `toolText` on that union. The helper rejects the `toolResult` variant with `"toolResult" in result`, then reads `content` on the narrowed branch.

**Proof:**
```
cd tools/qf-read-tools && bunx tsc --noEmit
TSC_EXIT=0
```

---

## 3. Full gate runner output

```
PASS  repo-shape
PASS  lockfile-committed
bun install v1.3.14 (0d9b296a)

Checked 6 installs across 7 packages (no changes) [1.00ms]
bun test v1.3.14 (0d9b296a)

 152 pass
 0 fail
 561 expect() calls
Ran 152 tests across 3 files. [118.00ms]
PASS  schema
bun install v1.3.14 (0d9b296a)

Checked 426 installs across 460 packages (no changes) [6.00ms]
bun test v1.3.14 (0d9b296a)
Bundled 119 modules in 28ms

  acp-main.js  1.26 MB  (entry point)

packed qf-toolloop@0.1.0 → /home/sidnig21/qf-worktrees/wo-105/tools/runtime-proof/packed/qf-toolloop.tar
  commands: qf-toolloop-acp
pack-agent: ready /home/sidnig21/qf-worktrees/wo-105/tools/runtime-proof/packed/qf-toolloop.aospkg

src/proof.test.ts:
P1 createSession / AgentOS: 5e04ab2a-eb0c-46b6-bd0f-bc760bfc88c8
P1 listSessions table:     [ "5e04ab2a-eb0c-46b6-bd0f-bc760bfc88c8" ]
P1 notification sessionIds: [ "5e04ab2a-eb0c-46b6-bd0f-bc760bfc88c8", "5e04ab2a-eb0c-46b6-bd0f-bc760bfc88c8",
  "5e04ab2a-eb0c-46b6-bd0f-bc760bfc88c8"
]
P1b unknown-session error: Session not found: unknown-session-ea6288f5-9ca6-4379-99d6-311d0411e7af
P2 listeners before: 2
P2 listeners after start: 2
P2 listeners after session: 2
P2 new after start: []
P2 new after session: []
P3 prompt text: Calling echo_upper. Tool said QUANTFLOW.
P3 chunk events: 3
P4 stopReason: cancelled
P4 chunksBeforeCancel: 1
P4 chunksAfterCancel: 0
P4 orphanSurvivors: []
P4 orphanCheck: {
  sessionGone: true,
  disposeCompleted: true,
  listenerCountFinal: 2,
  zeroOrphanDescendants: true,
}
P4 new listeners after cancel: []

 5 pass
 0 fail
 28 expect() calls
Ran 5 tests across 1 file. [6.92s]
PASS  runtime-proof
bun install v1.3.14 (0d9b296a)

+ qf-kernel-schema@../../qf-kernel-schema

1 package installed [20.00ms]
bun test v1.3.14 (0d9b296a)

src/kernel.test.ts:
illegal_transitions_rejected=7
replay_assertion=equal live.status=failed rebuilt.status=failed
artifact_row_count_after_double_publish=1
artifact_event_count_after_double_publish=1
artifact_replay_assertion=equal id=229eb2b779d77cfcd8460c1c04c8641f6c43ae35f14a121be52fafadff29de0e kind=result_set
G2_objects=[{"t":"artifact","id":"1a9a7cab974b94150659cc3df2e2d51e436f3f8438a2650b60a6075ea42d9689"},{"t":"artifact","id":"c0859dc18ea5362b301848a42221a47f42ef15a0af85c498d8da1945e37f503a"},{"t":"dataset","id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},{"t":"evaluation","id":"2264a9d4-bd09-4b4d-8a92-9120ef37a486"},{"t":"hypothesis","id":"3921a459-c628-42ac-b1a4-6ba5affd2298"},{"t":"run","id":"run-chain-1"}]
G2_links=[{"kind":"evaluated_by","from_id":"1a9a7cab974b94150659cc3df2e2d51e436f3f8438a2650b60a6075ea42d9689","to_id":"2264a9d4-bd09-4b4d-8a92-9120ef37a486"},{"kind":"gates","from_id":"2264a9d4-bd09-4b4d-8a92-9120ef37a486","to_id":"c0859dc18ea5362b301848a42221a47f42ef15a0af85c498d8da1945e37f503a"},{"kind":"produces","from_id":"run-chain-1","to_id":"1a9a7cab974b94150659cc3df2e2d51e436f3f8438a2650b60a6075ea42d9689"},{"kind":"tests","from_id":"run-chain-1","to_id":"3921a459-c628-42ac-b1a4-6ba5affd2298"},{"kind":"uses","from_id":"run-chain-1","to_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]
G4_events=[{"type":"ticket.observed","payload":"{\"command\":\"observe_ticket\",\"origin\":\"operator_supplied\",\"kind\":\"single\",\"external_ref\":\"slip-real\",\"placed_at\":\"2026-07-25T12:00:00.000Z\",\"legs\":[{\"selection\":\"A\",\"price\":1.9}],\"combined_price\":1.9,\"stake\":100,\"payout\":190,\"correlation_note\":\"\",\"grade\":\"win\",\"observation\":true,\"span_id\":\"span-slip\"}"}]

 28 pass
 0 fail
 95 expect() calls
Ran 28 tests across 1 file. [119.00ms]
PASS  kernel
bun install v1.3.14 (0d9b296a)

+ qf-kernel-schema@../../qf-kernel-schema

1 package installed [19.00ms]
bun install v1.3.14 (0d9b296a)

Checked 6 installs across 7 packages (no changes) [0.00ms]
bun install v1.3.14 (0d9b296a)

$ cd ../../packages/qf-kernel && bun install
bun install v1.3.14 (0d9b296a)

+ qf-kernel-schema@../../qf-kernel-schema

1 package installed [19.00ms]

+ qf-kernel@../../packages/qf-kernel

1 package installed [44.00ms]
bun install v1.3.14 (0d9b296a)

$ cd ../../packages/qf-kernel && bun install
bun install v1.3.14 (0d9b296a)

+ qf-kernel-schema@../../qf-kernel-schema

1 package installed [21.00ms]

+ qf-kernel@../../packages/qf-kernel
+ qf-kernel-schema@../../qf-kernel-schema

2 packages installed [64.00ms]
PASS  typecheck
PASS  kernel-sole-writer
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app
no-canvas-domain-writes OK
PASS  no-canvas-domain-writes
PASS  doc-action-surface
PASS  observe-door
bun install v1.3.14 (0d9b296a)

+ qf-kernel@../../../packages/qf-kernel

1 package installed [27.00ms]
$ node ./pack.mjs
Bundled 119 modules in 28ms

  acp-main.js  1.26 MB  (entry point)

packed qf-toolloop@0.1.0 → /home/sidnig21/qf-worktrees/wo-105/qa/gates/agent-path/packed/qf-toolloop.tar
  commands: qf-toolloop-acp
pack: ready /home/sidnig21/qf-worktrees/wo-105/qa/gates/agent-path/packed/qf-toolloop.aospkg
agent-path: spawn-only/turn pair OK {"admitEvents":["agent_session.created","agent_session.started"],"turnChunks":3}
agent-path OK
{"cancelled":"0beaabbf-b2f9-4afc-a1b4-6adb4e3e82c4","completed":"05fbb5f2-4f4e-41fe-bb18-33ea38523f78","artifactId":"2964065d5232f6b41512538a1ed123cebb410b30bba442358c15628392ed6ce7","chunksA":1,"chunksB":3}
PASS  agent-path
one-skin OK
totals: hex=0 func-color=0 raw-font-family=0 (outside collab-electron/src/windows/shared/qf-tokens.css)
PASS  one-skin
bun install v1.3.14 (0d9b296a)

+ @rivet-dev/agentos-toolchain@0.2.7
+ @types/bun@1.3.14
+ @agentclientprotocol/sdk@1.2.1
+ @rivet-dev/agentos-core@0.2.7
+ ai@7.0.31
+ qf-kernel@../../../packages/qf-kernel
+ zod@4.4.3

366 packages installed [27.11s]
$ node ./pack.mjs
Bundled 119 modules in 27ms

  acp-main.js  1.26 MB  (entry point)

packed qf-toolloop@0.1.0 → /home/sidnig21/qf-worktrees/wo-105/qa/gates/dock-registry/packed/qf-toolloop.tar
  commands: qf-toolloop-acp
pack: ready /home/sidnig21/qf-worktrees/wo-105/qa/gates/dock-registry/packed/qf-toolloop.aospkg
dock-registry OK
{"baitA":"dock-registry-bait-a","baitB":"qf-toolloop","packagePath":"/home/sidnig21/qf-worktrees/wo-105/qa/gates/dock-registry/packed/qf-toolloop.aospkg","literalHits":0}
PASS  dock-registry
bun install v1.3.14 (0d9b296a)

$ cd ../../packages/qf-kernel && bun install
bun install v1.3.14 (0d9b296a)

+ qf-kernel-schema@../../qf-kernel-schema

1 package installed [19.00ms]

+ qf-kernel@../../packages/qf-kernel
+ qf-kernel-schema@../../qf-kernel-schema

2 packages installed [72.00ms]
$ bun src/harness.ts
[harness] work dir: /tmp/qf-tool-plane-harness-GCxnug
[harness] kernel db: /tmp/qf-tool-plane-harness-GCxnug/kernel.db

=== G2 doctrine phase-exit gate ===
tool_plane_expected_count=97 served_count=97 read=72 actions=25
tool_plane_operator_only_leaks=[]
G2_experimental_tools=["qf_experimental_get","qf_experimental_links","qf_experimental_query"]
G2_experimental_get_response={"content":[{"type":"text","text":"{\n  \"id\": \"exp-probe-1\",\n  \"created_at\": \"2026-07-26T12:00:00.000Z\",\n  \"label\": \"gate-fixture\"\n}"}]}

=== G3 links traversal ===
tool_plane_expected_count=93 served_count=93 read=69 actions=24
tool_plane_operator_only_leaks=[]
G3_tool_response={"content":[{"type":"text","text":"[\n  {\n    \"id\": \"b2d6a8a7-6094-4198-aad4-d6cb43ba1cc9\",\n    \"kind\": \"tests\",\n    \"from_id\": \"harness-run-1\",\n    \"to_id\": \"167a4abb-25bc-4df0-9d7f-354c374f57d6\",\n    \"created_at\": \"2026-07-26T20:09:25.056Z\"\n  }\n]"}]}
G3_sql_rows=[{"kind":"tests","from_id":"harness-run-1","to_id":"167a4abb-25bc-4df0-9d7f-354c374f57d6"}]

=== tool-plane action surface ===
tool_plane_expected_count=93 served_count=93 read=69 actions=24
tool_plane_operator_only_leaks=[]
tool_plane_action_bad={"content":[{"type":"text","text":"[\n  {\n    \"code\": \"unrecognized_keys\",\n    \"keys\": [\n      \"bogus_gate1_field\"\n    ],\n    \"path\": [],\n    \"message\": \"Unrecognized key: \\\"bogus_gate1_field\\\"\"\n  }\n]"}],"isError":true}
tool_plane_events_before_after_bad=4 4
tool_plane_run_status_after_bad=queued
tool_plane_action_ok={"content":[{"type":"text","text":"{\n  \"object_type\": \"run\",\n  \"object_id\": \"harness-run-action-ok\",\n  \"from\": \"queued\",\n  \"to\": \"running\",\n  \"event\": \"run.started\",\n  \"state\": {\n    \"id\": \"harness-run-action-ok\",\n    \"created_at\": \"2026-07-26T20:09:26.057Z\",\n    \"kind\": \"backtest\",\n    \"status\": \"running\",\n    \"params\": \"{}\",\n    \"trace_id\": \"harness-trace\"\n  }\n}"}]}

=== GATE 2 via action tool ===
tool_plane_illegal_transition={"content":[{"type":"text","text":"IllegalTransitionError: Illegal transition for run: queued → succeeded"}],"isError":true}
tool_plane_illegal_events_before_after=6 6
tool_plane_illegal_status=queued

[harness] tool-plane PASS
PASS  tool-plane
GATE_RUNNER_EXIT=0
```

---

## 4. `golden/tools.json` count

```
cd qf-kernel-schema && jq 'length' golden/tools.json
94
```

---

## 5. Do-not-touch confirmation

**Touched (5 files only):**
- `qf-kernel-schema/src/ontology/agent.ts`
- `qf-kernel-schema/golden/tools.json`
- `qf-kernel-schema/golden/ONTOLOGY.md`
- `qa/gates/agent-path/run.ts`
- `tools/qf-read-tools/src/harness.ts`

**Not touched:** `collab-electron/` (any source), `packages/qf-kernel/src/execute.ts`, action server registration, `operatorOnly` lint, served-set derivation, ROADMAP debt #24 surface.

---

## 6. Suite counts

| Suite | Before (at `dabcc34`) | After | Delta | Mechanism |
|---|---|---|---|---|
| `qf-kernel-schema` | 152 pass | 152 pass | 0 | Optional field only; `migration.sql` / `conformance.test.ts` unchanged |
| `packages/qf-kernel` | 28 pass | 28 pass | 0 | No kernel code changed |
| QA gates | 14 PASS / 1 FAIL | 15 PASS | +1 PASS | `typecheck` fixed; `agent-path` models `reason` again |

---

## 7. Judgment calls (rework record silent)

1. **`reason` description:** Combined both register sentences into one `.describe()` string. Chained `.describe()` calls would have kept only the last.
2. **Harness typing:** Used `CompatibilityCallToolResult` with `"toolResult" in result` narrowing rather than `Awaited<ReturnType<Client["callTool"]>>` — the client return type’s index signature prevented `content` from narrowing after `"content" in result`.
3. **Golden scope:** Only `tools.json` and `ONTOLOGY.md` regenerated; optional `reason` does not affect SQL or conformance tests.

---

## 8. Not fixed (out of scope / pre-existing)

- **ROADMAP debt #24** — action tools advertise zero transport parameters (founder decision for WO-106).
- **`rejectSuppliedInitialState` dormant coverage** — recorded in verification round 1, not this rework’s scope.
- **`bytes` strict-exempt hole** — recorded in verification round 1, low severity, not this rework’s scope.

---

Changes are in the working tree only; no commit made per your instruction.
