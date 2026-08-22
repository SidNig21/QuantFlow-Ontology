# R16 Builder BUILD-REPORT — finite machine-gate closure

| Field | Receipt |
|---|---|
| Base WIP SHA | `63ffb8049535eca7deb6e1d8cc704d5a44dcd1a5` |
| Product candidate SHA | `7f03d8e586e504fbe947614f56b60b9a91c0b60d` |
| Branch | `wo-R16` |
| Builder result | **PASS** for the bounded machine gate and authorized Builder matrix |
| Live-gate invocations | exactly `1` |

## Scope and changed paths

The current `CONSUMER-OWNED REOPEN` correction was applied on the preserved
cleanup-preflight WIP. `runNormalReopenCase` and only its proof-preview reopen
assertions/receipts were removed. The gate now performs exactly three serial
attempts: forced failure, forced timeout, and one ready first-world launch.
The existing first-world saved-state readback remains; no second proof-mode
preview was launched.

Candidate paths changed:

- production paths: **none**;
- `qa/gates/research-world-visible.ts`;
- `qa/gates/research-world-visible.test.ts` (existing 13th test extended; test count remains 13);
- `qf-atlas/ATLAS.md`;
- `qf-atlas/atlas.html`;
- `qf-atlas/atlas.json`.

The Router-owned `docs/orders/NEXT.md` and `docs/orders/WO-R16.md` edits were
preserved unchanged and were not staged in the product candidate.

## Exact pre-live gate

All required pre-live commands were green before the one live invocation:

```text
bun test collab-electron/src/windows/shell/src/task-composition.test.ts   exit=0  3 pass / 0 fail / 55 expect
bun test collab-electron/src/windows/shell/src/research-world.test.ts      exit=0  6 pass / 0 fail / 32 expect
bun test qa/gates/research-world-visible.test.ts                          exit=0  13 pass / 0 fail / 192 expect
bun qf-atlas/generate.mjs                                                  exit=0
bun qf-atlas/generate.mjs --check                                          exit=0
bun qf-atlas/ratchet.mjs                                                   exit=0
```

The focused source contract rejects a second normal preview, retains the
15,000 ms cleanup preflight, unchanged 60,000/8,000 product clock, exact
preview vector `['run', 'preview', '--', '--skipBuild']`, runtime-derived
three/1/1 activity receipt, pointer proof, exact 13/15 world, forced-case
markers, and final process/root cleanup.

## One live gate — unedited receipt

Command:

```text
bun qa/run.ts research-world-visible
```

Native exit: `0`.

```text
build_once_ms=60628 build_exit=0
forced_failure_marker=r16-forced-failure-ed756666-ac57-4c27-b87f-2f6f392fe2f9
forced_failure_phase=spawned_not_ready
forced-failure shutdown_requested=false owned_processes_remaining=0
forced_timeout_phase=spawned_not_ready
forced_timeout_marker=r16-forced-timeout-ed756666-ac57-4c27-b87f-2f6f392fe2f9 elapsed_ms=518
forced-timeout shutdown_requested=false owned_processes_remaining=0
cleanup_preflight_ms=12077 forced_roots_remaining=0
pointer_tiles=10 inspect=10 collapse=10
nonce=ed756666-ac57-4c27-b87f-2f6f392fe2f9 oracle_tiles=13 oracle_cables=15 dom_tiles=13 dom_cables=15
first-launch shutdown_requested=true owned_processes_remaining=0
first_world_stage_ms=33555
roots_created=3 roots_remaining=0 retried=0 leaked=[]
primary_failure=null
cleanup_failures=[]
launch_attempts=3 ready_launches=1 active_launches=0 max_concurrent_launches=1
PASS  research-world-visible
```

The live gate built once before the product clock and root allocation and
required `collab-electron/out/main/index.js`. The forced preflight was under
15,000 ms with zero forced roots. The first world passed pointer 10/10,
independent Oracle/DOM 13/15 counts, all displayed-field checks, shutdown,
and final zero-process/zero-root cleanup. No proof-mode reopen launch or
`reopen_equal` receipt is claimed; restart ownership is the later normal-app
consumer check.

## Authorized short matrix

Every command ran once after the live PASS and exited zero:

```text
bun test collab-electron/src/windows/shell/src/tile-manager-layout.test.ts  exit=0  2 pass / 0 fail / 4 expect
bun test qa/gates/research-world-visible.test.ts                            exit=0  13 pass / 0 fail / 192 expect
bun qa/run.ts no-canvas-domain-writes                                       exit=0
bun qa/run.ts one-skin                                                     exit=0
bun qa/run.ts doc-links                                                     exit=0  69 live documents
bun qa/run.ts rung-ladder                                                   exit=0  22 rungs; active=R16
bun qf-atlas/generate.mjs --check                                           exit=0
bun qf-atlas/ratchet.mjs                                                    exit=0  6.2s; HARD RED=0; unexplained coverage=0
git diff --check                                                            exit=0
```

## Pointer falsifier

Only the gate receipt literal was temporarily changed from
`pointer_tiles=10 inspect=10 collapse=10` to a non-matching final count
(`collapse=11`). The app was not launched.

```text
mutated command: bun test qa/gates/research-world-visible.test.ts
mutated exit=1
mutated result: 12 pass / 1 fail; the pointer contract assertion received 0
               matches where it expected 1
```

The exact receipt literal was restored. The restored command returned:

```text
bun test qa/gates/research-world-visible.test.ts
exit=0
13 pass / 0 fail / 192 expect
```

## Atlas and candidate freeze

The final Atlas refresh exited zero and reported:

```text
431 files · 109 subsystems · 124 IPC channels
wires: 111 live · 0 unreached · 13 unused · 0 DEAD
legacy loops: 6/8 healthy · Review and publish, Close the app
decisions: 42 undecided of 47
13 strip candidates · 10 confirmed violations · 3 gray · 22 coverage gaps
```

The measured product candidate was committed only after the pre-live gates,
one live gate, short matrix, falsifier red, restoration green, and Atlas checks
were green. `product_candidate_sha` is the immutable commit above. No product
file changed after that SHA; the separate BUILD-REPORT evidence commit and any
later generated-projection-only commit do not alter the measured candidate.

Independent Verifier measurement and the normal non-proof application’s
Computer Use consumer close/reopen check were not run in this Builder turn,
per the current delegated instruction. No second live gate, timeout increase,
product change, package change, or R17 action occurred.

## R16 founder-kernel upgrade compatibility — bounded Builder closure

| Field | Receipt |
|---|---|
| Base WIP SHA | `c5a759efafc2a967dea959d5ad6c74ffcc6c2881` |
| Immutable candidate SHA | `b8e7d57c04288e1315bbe658a4665a57b4d5f3e7` |
| Branch | `wo-R16` |
| Live R16 gate | not run, per authority |
| Real founder DB | read-only source; copy-only upgrade proof |
| Stale dependency backup | preserved at `packages/qf-kernel/node_modules/qf-kernel-schema.stale-r16` |

The final compatibility repair keeps current authority exact, derives every
historical predecessor with the correct later-addition removals, materializes
the two R16 schema additions from current migration authority inside the
existing transaction, and preserves exact partial-shape rejection. The pinned
regression is independent of classifier snapshots and proves
`task_steering` → writable `attachKernel()` → `current`, nondecreasing
artifact/task/link/event counts, and preserved representative data, links,
events, and hashes.

## Green matrix

```text
bun test packages/qf-kernel/src/r11a-deterministic-execution.test.ts -t "pinned post-composition|extra or missing"  exit=0  2 pass / 0 fail / 16 expect
bunx tsc --noEmit                                                                                                  exit=0
bun qa/run.ts dock-profile-identity                                                                              exit=0  PASS
bun qa/run.ts kernel-drift                                                                                        exit=0  G1/G2/G3/G6 PASS
bun qa/run.ts kernel-sole-writer                                                                                  exit=0  PASS
bun test qa/gates/research-world-visible.test.ts                                                                  exit=0  13 pass / 0 fail / 192 expect
bun qf-atlas/generate.mjs --check                                                                                exit=0
bun qf-atlas/ratchet.mjs                                                                                          exit=0  HARD RED=0
git diff --check                                                                                                  exit=0
```

Atlas was refreshed and verified at `431 files · 109 subsystems · 124 IPC
channels`, with `111 live` wires, `0 unreached`, `0 DEAD`, and `HARD RED: 0`.

## Isolated founder-copy proof

The real source `C:\Users\rybow\.quantflow\kernel.db` was opened read-only
only. Its source shape was `task_steering`; only `kernel.db` was copied to an
isolated temporary path and upgraded. The copy reached `current`.

```text
sourceHashBefore = c29fd79a328d1006eedfc425a5f55ca5a60fdc5a07b89db861a7cad128369bdf
sourceHashAfter  = c29fd79a328d1006eedfc425a5f55ca5a60fdc5a07b89db861a7cad128369bdf
before counts    = artifacts 8, tasks 1, links 25, events 58
after counts     = artifacts 8, tasks 1, links 25, events 58
copy shape       = current
```

Representative preservation included artifact
`41382a3f664128ac1c297c98c2b4cd8244b06c3e2b1b743bb70169be5d2713eb` with the
same content hash, task
`task-32dcfa3d-2365-4ece-885b-ee3b5bbaa469`, link
`02f22077-d82b-41e0-9f9b-ab341a7ce513` (`derived_from`), and event
`0165976f-68cf-462e-a0c0-bda73fbb7e0f` with identical payload and trace ID.

The source hash was identical before and after; the real founder DB was never
opened writable, the app was not launched, and no live gate was run. The
Router-owned `NEXT.md` and `WO-R16.md` edits, including the named defect
receipts, remain preserved and unstaged. This report is the evidence commit
following immutable candidate `b8e7d57c04288e1315bbe658a4665a57b4d5f3e7`.

## NORMAL CONSUMER ACTION-SCHEMA REPAIR — Builder closure

Plain meaning: the Director now receives the fields it needs to create a
worker, so it no longer retries an empty request.

| Field | Receipt |
|---|---|
| Starting WIP SHA | `21b8c0b7f1803bb5401a04b86b80a615e9ef3d4d` |
| Atlas comparison base | `fef713c06f091dc8df13f7bde07be859d3b04930` |
| Product candidate SHA | `94c4ee61e9b64fca56d0101557eeb64cb5f4c534` |
| Branch | `wo-R16` |
| Live R16 gate | not run, per the order |
| Candidate result | **PASS**; product candidate committed before this evidence section |

### Candidate scope and changed paths

The product candidate changed exactly these five paths:

- `collab-electron/src/main/kernel.ts`
- `collab-electron/src/main/ontology-gateway.test.ts`
- `qf-atlas/ATLAS.md`
- `qf-atlas/atlas.html`
- `qf-atlas/atlas.json`

`kernel.ts` now calls the existing `actionToolForAction(action)` authority for
each capability-group action. The existing filters, grants,
`EXPOSED_ACTIONS`, gateway validation, Kernel actions, and action semantics are
unchanged. The runtime test invokes the production `qf.ontology.list_tools`
handler for admitted `desk.orchestrate` and `market.read` seats and compares
the complete action/read definitions. No schema, golden, timing, assertion,
installer, release, helper, or R17 file changed. The pre-existing dirty
Router-owned `docs/orders/NEXT.md` and `docs/orders/WO-R16.md` files remained
unstaged.

### Exact Builder matrix

The required commands ran with these native exits and counts:

```text
bun test collab-electron/src/main/ontology-gateway.test.ts              exit=0  5 pass / 0 fail / 26 expect
bun test collab-electron/src/main/mission-activation.test.ts             exit=0  2 pass / 0 fail / 23 expect
bun test collab-electron/src/main/native-tui-orchestration.test.ts       exit=0  8 pass / 0 fail / 40 expect
bun qa/run.ts dock-profile-identity                                        exit=0  PASS  dock-profile-identity
bun qa/run.ts kernel-sole-writer                                           exit=0  PASS  kernel-sole-writer
bun test qa/gates/research-world-visible.test.ts                          exit=0  13 pass / 0 fail / 192 expect
bun qa/run.ts typecheck                                                     exit=0  PASS  typecheck
bun qf-atlas/generate.mjs --check                                           exit=0  qf-atlas: current — 431 files, 124 channels, 13 strip candidates
bun qf-atlas/ratchet.mjs                                                    exit=0  HARD RED: 0; unexplained coverage: 0; undecided w/o blocker: 0
git diff --check                                                            exit=0
```

The focused runtime command's unedited result was:

```text
bun test v1.3.12 (700fc117)

collab-electron\src\main\ontology-gateway.test.ts:
(pass) only ontology reads receive the Kernel read marker
(pass) production read dispatch marks market reads but not desk orchestration reads
(pass) generic ontology actions expose deterministic execution but not task bypasses
(pass) native research roles receive a focused generated ontology surface
kernel: path=:memory: provenance=env journal=memory sync=2 schema_meta=84
(pass) production list_tools serves action and read schemas for admitted seats [47.00ms]

 5 pass
 0 fail
 26 expect() calls
Ran 5 tests across 1 file. [220.00ms]
```

The three supplemental Builder commands required to cover the committed
candidate test-path receipt also exited zero:

```text
bun test collab-electron/src/main/dock-profiles.test.ts
exit=0
11 pass / 0 fail / 28 expect

bun test collab-electron/src/main/research-world.test.ts
exit=0
2 pass / 0 fail / 6 expect

bun test packages/qf-kernel/src/r16-visible-world.test.ts
exit=0
3 pass / 0 fail / 5 expect
```

The other paths in the committed-candidate receipt are covered by the
unaltered Builder command logs already above in this report:
`collab-electron/src/windows/shell/src/research-world.test.ts`,
`collab-electron/src/windows/shell/src/task-composition.test.ts`,
`collab-electron/src/windows/shell/src/tile-manager-layout.test.ts`, and
`packages/qf-kernel/src/r11a-deterministic-execution.test.ts`.

### Old empty-schema falsifier and exact restoration

Before the mutation, the candidate bytes were recorded as:

```text
candidate_kernel_sha256=bac7575769537a6d23ef818c7152acb634dc0d0cc841ced2e2de4187f95beb93
candidate_test_sha256=aac75fabe6cc050f214cf992dfc9d0ac8774ebe31d4c8908c54c3b63391b6c18
candidate_kernel_blob=f65fdcef6ba17bea7c9d6e4587c830fd88f3b27a
candidate_test_blob=055df049c30d8e56bdccb1ca5967097507a7b6cd
```

Only the old empty action schema in `kernel.ts` was temporarily restored; the
test and schema authority were unchanged. The exact focused test then returned
native exit `1` and named the missing action fields:

```text
bun test collab-electron/src/main/ontology-gateway.test.ts
native exit=1

error: expect(received).toEqual(expected)

  {
    "description": "Create an agent_session by adopting a guest-minted session_id (Kernel never mints). Requires agent_definition_id and atomically links spawned_from; label is presentation-only.",
    "inputSchema": {
-     "properties": {
-       "agent_definition_id": {
-         "description": "Existing agent_definition row id for the profile that admitted this session. Identity lives in spawned_from, not label.",
-         "type": "string",
-       },
-       "label": {
-         "anyOf": [
-           {
-             "description": "Optional operator-facing label for readability only; never the profile identity.",
-             "type": "string",
-           },
-           {
-             "type": "null",
-           },
-         ],
-       },
-       "session_id": {
-         "description": "Guest-minted ACP session id — adopted as the Kernel row id, never re-minted.",
-         "type": "string",
-       },
-     },
-     "required": [
-       "session_id",
-       "agent_definition_id",
-     ],
+     "additionalProperties": true,
+     "properties": {},
      "type": "object",
    },
    "name": "qf_create_agent_session",
  }

(fail) production list_tools serves action and read schemas for admitted seats

 4 pass
 1 fail
 21 expect() calls
Ran 5 tests across 1 file.
```

The candidate bytes were restored exactly before the green rerun:

```text
restored_kernel_sha256=bac7575769537a6d23ef818c7152acb634dc0d0cc841ced2e2de4187f95beb93
restored_test_sha256=aac75fabe6cc050f214cf992dfc9d0ac8774ebe31d4c8908c54c3b63391b6c18
restored_kernel_blob=f65fdcef6ba17bea7c9d6e4587c830fd88f3b27a
restored_test_blob=055df049c30d8e56bdccb1ca5967097507a7b6cd
restoration_zero_diff=True
```

The same focused command after restoration returned native exit `0`, `5 pass`,
`0 fail`, and `26 expect() calls`.

### Final Atlas receipts

The final normal refresh, check, and ratchet were green:

```text
bun qf-atlas/generate.mjs
exit=0
qf-atlas: wrote atlas.json + atlas.html + ATLAS.md
  431 files · 109 subsystems · 124 IPC channels
  wires: 111 live · 0 unreached · 13 unused · 0 DEAD
  legacy loops: 6/8 healthy · Review and publish, Close the app
  decisions: 42 undecided of 47
  13 strip candidates · 10 confirmed violations · 3 gray · 22 coverage gaps

bun qf-atlas/generate.mjs --check
exit=0
qf-atlas: current — 431 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
exit=0
qf-atlas ratchet — 3.6s (budget 60s)
  baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 20 · undecided: 42

git diff --check
exit=0
```

The required Atlas build-base diff returned this unedited receipt:

```text
Atlas diff  c59ebfa -> 21b8c0b
VERDICT: WORSE — 1 finding(s) added

  added 1 · newly-detected 0 · resolved 0 · regressed 0
  confidence changed 0 · owners changed 0
  coverage worse 0 · better 0
  undecided 41 -> 42

ADDED (code got worse):
  persistence links insert into

wrote qf-atlas/atlas-diff.json
```

This is the existing build-base Atlas finding from the compatibility work; the
action-schema repair itself adds no new product path beyond the three normal
generated projections committed with the candidate. `atlas-diff.json` is
ignored and was not staged.

### Candidate freeze and committed-candidate test paths

The immutable product candidate was committed first:

```text
94c4ee61e9b64fca56d0101557eeb64cb5f4c534 fix(r16): advertise action schemas in ontology gateway
```

The exact post-candidate command and unedited output were:

```text
git diff --name-only fef713c06f091dc8df13f7bde07be859d3b04930 HEAD -- "*.test.ts"
collab-electron/src/main/dock-profiles.test.ts
collab-electron/src/main/ontology-gateway.test.ts
collab-electron/src/main/research-world.test.ts
collab-electron/src/windows/shell/src/research-world.test.ts
collab-electron/src/windows/shell/src/task-composition.test.ts
collab-electron/src/windows/shell/src/tile-manager-layout.test.ts
packages/qf-kernel/src/r11a-deterministic-execution.test.ts
packages/qf-kernel/src/r16-visible-world.test.ts
qa/gates/research-world-visible.test.ts
```

No product file changed after `94c4ee61e9b64fca56d0101557eeb64cb5f4c534`.
The following evidence-only commit contains this appended report section and
will be pushed separately. The real founder database and backup were not
accessed, the app was not launched, and no live R16 gate was run.
