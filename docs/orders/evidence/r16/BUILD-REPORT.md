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

## NORMAL CONSUMER HYPOTHESIS BINDING REPAIR — Builder closure

Plain meaning: both question entry points now remember which Hypothesis belongs
to the Director they start, so the completed worker result can continue into
the deterministic and independent-review pipeline.

| Field | Receipt |
|---|---|
| Starting WIP SHA | `f728487b964e2e06c508e6f8c3100e85495868e5` |
| Product candidate SHA | `f8f085b3e87639f598e6973dca92ebfb2a781b57` |
| Branch | `wo-R16` |
| Candidate result | **PASS** for the exact short matrix, both falsifiers, and authorized Atlas refresh |
| Live model/proof R16 gate | not run, per order |

### Changed paths

The product candidate changed exactly these paths:

```text
collab-electron/src/main/index.ts
collab-electron/src/main/ipc-kernel.ts
collab-electron/src/main/research-context.ts
collab-electron/src/main/research-context.test.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
```

The Router-owned `docs/orders/NEXT.md` and `docs/orders/WO-R16.md` edits were
preserved unstaged. The context module is process-local only: it writes no file
and no database, and exports only bind, read, clear-one, and clear-all.

### Required Builder matrix — unedited receipts

```text
bun test collab-electron/src/main/research-context.test.ts
native_exit=0
bun test v1.3.12 (700fc117)

collab-electron\src\main\research-context.test.ts:
(pass) binds one session and leaves an unbound session absent
(pass) clearing one session does not clear another
(pass) rejects empty ids before mutating existing bindings
(pass) clear-all leaves every session unaddressable

 4 pass
 0 fail
 10 expect() calls
Ran 4 tests across 1 file. [54.00ms]

bun test collab-electron/src/main/mission-activation.test.ts
native_exit=0
bun test v1.3.12 (700fc117)

collab-electron\src\main\mission-activation.test.ts:
(pass) mission activation is one bounded JSON-safe PTY instruction
(pass) mission activation rejects oversize and invalid ids before bytes exist

 2 pass
 0 fail
 23 expect() calls
Ran 2 tests across 1 file. [55.00ms]

bun test collab-electron/src/main/native-tui-orchestration.test.ts
native_exit=0
bun test v1.3.12 (700fc117)

collab-electron\src\main\native-tui-orchestration.test.ts:
(pass) orchestrateNativeTuiAdmission > create failure leaves no process-local or Kernel compensation residue
(pass) orchestrateNativeTuiAdmission > start failure records fail and close, cleans maps, then permits same role
(pass) orchestrateNativeTuiAdmission > late peer failure unregisters only its PTY and same-role relaunch succeeds
(pass) orchestrateNativeTuiAdmission > duplicate role preflight rejects before process start
(pass) orchestrateNativeTuiAdmission > duplicate-role preflight revokes a minted capability without starting a process
(pass) orchestrateNativeTuiAdmission > precreated admission preserves the exact id and registers delivery before running
(pass) orchestrateNativeTuiAdmission > failed admission revokes its in-memory seat capability during owned cleanup
(pass) orchestrateNativeTuiAdmission > readiness rejection writes no start and cleans every owned runtime seam

 8 pass
 0 fail
 40 expect() calls
Ran 8 tests across 1 file. [59.00ms]

bun qa/run.ts kernel-sole-writer
native_exit=0
PASS  kernel-sole-writer

bun qf-atlas/generate.mjs --check
native_exit=0
qf-atlas: current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
native_exit=0
qf-atlas ratchet — 3.3s (budget 60s)


  baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 20 · undecided: 42

git diff --check
native_exit=0
```

The first post-edit Atlas check and ratchet were intentionally stale until the
order-authorized generation step:

```text
bun qf-atlas/generate.mjs --check
native_exit=1
qf-atlas: STALE — atlas.json fingerprint 5d7c121939e697e8 != 0f3729344ed46ba0
The map is a projection. Run: bun qf-atlas/generate.mjs

bun qf-atlas/ratchet.mjs
native_exit=1
qf-atlas ratchet — 3.3s (budget 60s)

  FAIL  STALE: the committed Atlas does not match the code. Run `bun qf-atlas/generate.mjs`.

  baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 20 · undecided: 42
```

### Bind and clear falsifiers

The test file was unchanged for both mutations. The bind operation was first
made a no-op; it exited nonzero and named the missing binding:

```text
bun test collab-electron/src/main/research-context.test.ts
native_exit=1

Expected: "hypothesis-a"
Received: undefined
(fail) binds one session and leaves an unbound session absent
Expected: "hypothesis-b"
Received: undefined
(fail) clearing one session does not clear another
Expected: "hypothesis-a"
Received: undefined
(fail) rejects empty ids before mutating existing bindings
(pass) clear-all leaves every session unaddressable

 1 pass
 3 fail
 8 expect() calls
Ran 4 tests across 1 file. [66.00ms]
```

The clear-one operation was then made a no-op; it exited nonzero and named the
uncleared session:

```text
bun test collab-electron/src/main/research-context.test.ts
native_exit=1

(pass) binds one session and leaves an unbound session absent
Received: "hypothesis-a"
(fail) clearing one session does not clear another
(pass) rejects empty ids before mutating existing bindings
(pass) clear-all leaves every session unaddressable

 3 pass
 1 fail
 9 expect() calls
Ran 4 tests across 1 file. [53.00ms]
```

The exact candidate bytes were restored after each mutation. The final restored
focused run is the `4 pass / 0 fail` receipt above, and `git diff HEAD --` for
the seven candidate paths was empty before this report was appended.

### Authorized Atlas refresh and final receipts

```text
bun qf-atlas/generate.mjs
native_exit=0
qf-atlas: wrote atlas.json + atlas.html + ATLAS.md
  432 files · 109 subsystems · 124 IPC channels
  wires: 111 live · 0 unreached · 13 unused · 0 DEAD
  legacy loops: 6/8 healthy · Review and publish, Close the app
  decisions: 42 undecided of 47
  13 strip candidates · 10 confirmed violations · 3 gray · 22 coverage gaps

bun qf-atlas/generate.mjs --check
native_exit=0
qf-atlas: current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
native_exit=0
qf-atlas ratchet — 3.3s (budget 60s)


  baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 20 · undecided: 42

bun qf-atlas/generate.mjs --diff 94c4ee61e9b64fca56d0101557eeb64cb5f4c534
native_exit=0
Atlas diff  21b8c0b -> f728487
VERDICT: UNCHANGED — no architectural change

  added 0 · newly-detected 0 · resolved 0 · regressed 0
  confidence changed 0 · owners changed 0
  coverage worse 0 · better 0
  undecided 42 -> 42

wrote qf-atlas/atlas-diff.json

git diff --check
native_exit=0
```

The product candidate was committed before this report section:

```text
f8f085b3e87639f598e6973dca92ebfb2a781b57 fix(r16): bind research hypotheses across front doors
```

No live model, proof-mode R16 gate, installer, release matrix, typecheck
rebuild, founder database, or R17 path was touched. The candidate commit
contains only the seven paths listed above; the report is the subsequent
evidence commit.

## NORMAL CONSUMER GOVERNED-WORLD AND SHUTDOWN REPAIR — final Builder closure

Plain meaning: normal research continuation now binds the worker's exact
lineage, admits and delivers exactly one governed critic review before
evaluation/publication, and native-TUI shutdown retains detached teardown
work until it settles. The Reader closure is covered by the named tests and
the Atlas projection was regenerated once as authorized.

### Immutable candidate and scope

| Field | Receipt |
|---|---|
| Router head before build | c84f9e953c51e5b48646fce5aa08d7c44dd068e1 |
| Required base | fef713c06f091dc8df13f7bde07be859d3b04930 |
| Base ancestry check | git merge-base --is-ancestor fef713c06f091dc8df13f7bde07be859d3b04930 c84f9e953c51e5b48646fce5aa08d7c44dd068e1 -> exit 0 |
| Product candidate commit | 34c4bd254165901b8e2d8df72e717c76a171c341 |
| Branch / push | wo-R16 / pushed to origin/wo-R16 |
| Product candidate status before evidence | clean |

The product candidate commit changed exactly these ten paths:

~~~
collab-electron/src/main/agent-host.ts
collab-electron/src/main/governed-review.test.ts
collab-electron/src/main/index.ts
collab-electron/src/main/kernel.ts
collab-electron/src/main/native-tui-orchestration.test.ts
collab-electron/src/main/precreated-native-tui.test.ts
collab-electron/src/main/research-world.test.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
~~~

No product or test path was changed after the immutable product candidate.
The evidence report is the only subsequent change in this Builder turn.

### Candidate test-path receipt

Command:

~~~
git diff --name-only fef713c06f091dc8df13f7bde07be859d3b04930 HEAD -- "*.test.ts"
exit=0
collab-electron/src/main/dock-profiles.test.ts
collab-electron/src/main/governed-review.test.ts
collab-electron/src/main/native-tui-orchestration.test.ts
collab-electron/src/main/ontology-gateway.test.ts
collab-electron/src/main/precreated-native-tui.test.ts
collab-electron/src/main/research-context.test.ts
collab-electron/src/main/research-world.test.ts
collab-electron/src/windows/shell/src/research-world.test.ts
collab-electron/src/windows/shell/src/task-composition.test.ts
collab-electron/src/windows/shell/src/tile-manager-layout.test.ts
packages/qf-kernel/src/r11a-deterministic-execution.test.ts
packages/qf-kernel/src/r16-visible-world.test.ts
qa/gates/research-world-visible.test.ts
~~~

This is the full historical test-path receipt from the required base; the
product commit itself contains only the four named test paths listed in the
candidate scope above.

### Exact Builder matrix

Each command below was run individually, exactly once against the product
candidate. Every command exited 0.

| Exact command | Exit / receipt |
|---|---|
| bun test collab-electron/src/main/governed-review.test.ts | 0 — 4 pass / 0 fail / 22 expect |
| bun test collab-electron/src/main/research-world.test.ts | 0 — 3 pass / 0 fail / 13 expect |
| bun test collab-electron/src/windows/shell/src/research-world.test.ts | 0 — 6 pass / 0 fail / 32 expect |
| bun test collab-electron/src/windows/shell/src/task-composition.test.ts | 0 — 3 pass / 0 fail / 55 expect |
| bun test collab-electron/src/main/native-tui-orchestration.test.ts | 0 — 9 pass / 0 fail / 42 expect |
| bun test collab-electron/src/main/precreated-native-tui.test.ts | 0 — 2 pass / 0 fail / 5 expect |
| bun test packages/qf-kernel/src/r15-governed-review.test.ts | 0 — 7 pass / 0 fail / 55 expect |
| bun test packages/qf-kernel/src/r16-visible-world.test.ts | 0 — 3 pass / 0 fail / 5 expect |
| bun test qa/gates/governed-review.test.ts | 0 — nested focused production/kernel 11 pass / 0 fail / 77 expect; live broker control 7 pass / 0 fail / 55 expect; gate 3 pass / 0 fail / 6 expect |
| bun test qa/gates/research-world-visible.test.ts | 0 — 13 pass / 0 fail / 192 expect |
| bun qa/run.ts kernel-sole-writer | 0 — PASS  kernel-sole-writer |
| bun qf-atlas/generate.mjs --check | 0 — qf-atlas: current — 432 files, 124 channels, 13 strip candidates |
| bun qf-atlas/ratchet.mjs | 0 — baseline 3 entries; HARD RED 0; unexplained coverage 0; AMBER 20; undecided 42 |
| git diff --check | 0 — no output |

No live app, real model, proof-mode R16 gate, installer, release suite, or
typecheck rebuild was launched.

### F1–F7 independent mutation falsifiers

Each mutation was applied temporarily to the named seam, run against its
owning test/control, then restored byte-for-byte before the next mutation.
The owning test file SHA was unchanged before and after each mutation.

| Falsifier | Mutation and owning command | Red receipt | Restoration / green receipt |
|---|---|---|---|
| F1 | Make kernelBindSourceWork(sourceWork) a no-op; bun test collab-electron/src/main/governed-review.test.ts; test SHA 05E14CC0D117E56C235369B837203A0D6AC61858E23F339F2A767E1F5CD4346B | exit 1; 3 pass / 1 fail; exact-admission error: governed research review admission did not return the exact review Task and source work | git diff --quiet -- collab-electron/src/main/kernel.ts exit 0; restored exit 0, 4 pass / 0 fail / 22 expect |
| F2 | Force the helper admission condition true; same command/test SHA as F1 | exit 1; 3 pass / 1 fail; exact-admission error: governed research review admission did not return the exact review Task and source work | kernel diff quiet exit 0; restored exit 0, 4 pass / 0 fail / 22 expect |
| F3 | Remove kernelMarkGovernedDelivery(...) from the helper finally; same command/test SHA as F1 | exit 1; 3 pass / 1 fail; review lifecycle remained pending instead of running | kernel diff quiet exit 0; restored exit 0, 4 pass / 0 fail / 22 expect |
| F4 | Replace executor_session_id: input.executor_session_id with "director-continuation"; same command/test SHA as F1 | exit 1; 3 pass / 1 fail; KernelError: Review requires one succeeded Run with one exact Hypothesis, result Artifact, executor, and R14 source-Task lineage. | kernel diff quiet exit 0; restored exit 0, 4 pass / 0 fail / 22 expect |
| F5 | Omit one projected object, then separately omit uses links in research-world-projection.ts; Main world test SHAs before/after D4144604742085523D2A33C6847C951448FBF38BE0C35E7526F845F4D18EA52E and F2B4EBCC4BA7C0269429064B2A68321D8661EB01A580F8AB451C285A6CAD5F7D | object mutation: exit 1, 2 pass / 1 fail, expected 13 objects and received 12; link mutation: exit 1, 2 pass / 1 fail, expected 15 links and received 14 | projection diff quiet exit 0; Main restored exit 0, 3 pass / 0 fail / 13 expect; shell control restored exit 0, 6 pass / 0 fail / 32 expect; both test SHAs unchanged |
| F6 | Remove inFlight.set(sessionId, promise) from the teardown registry; bun test collab-electron/src/main/native-tui-orchestration.test.ts; test SHA 94E81C369508C02145DE24C3A7D3F298DD91360A86FAC33013A0D869C31F76EB | exit 1; 8 pass / 1 fail; shutdown test expected shutdownFinished=false, received true | agent-host diff quiet exit 0; restored exit 0, 9 pass / 0 fail / 42 expect; test SHA unchanged |
| F7 | Remove repeated-close promise reuse (if existing return existing); bun test collab-electron/src/main/precreated-native-tui.test.ts; test SHA 9ECDFA52FC1562B5AA3F23AA74F76A100344C34EE65FA7556AF7CF1122C7ED8D | exit 1; 1 pass / 1 fail; repeated close returned two promises instead of the same promise | agent-host diff quiet exit 0; restored exit 0, 2 pass / 0 fail / 5 expect; test SHA unchanged |

F5's shell test is a fixed resolver-manifest control, so the Main-owned
projection mutation is expected to fail the Main assertion while the shell
control remains/restores green; no red receipt was fabricated for that
independent control.

### Atlas receipts and handoff state

Preflight Atlas receipts were both green:

~~~
bun qf-atlas/generate.mjs --check
exit=0
qf-atlas: current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
exit=0
baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · AMBER: 20 · undecided: 42
~~~

The authorized candidate refresh was:

~~~
bun qf-atlas/generate.mjs
exit=0
qf-atlas: wrote atlas.json + atlas.html + ATLAS.md
432 files · 109 subsystems · 124 IPC channels
wires: 111 live · 0 unreached · 13 unused · 0 DEAD
legacy loops: 6/8 healthy · Review and publish, Close the app
decisions: 42 undecided of 47
13 strip candidates · 10 confirmed violations · 3 gray · 22 coverage gaps

bun qf-atlas/generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930
exit=0
Atlas diff c59ebfa -> c84f9e9
VERDICT: WORSE — 1 finding(s) added
added 1 · newly-detected 0 · resolved 0 · regressed 0
coverage worse 0 · better 0
undecided 41 -> 42
ADDED: persistence links insert into
wrote qf-atlas/atlas-diff.json
~~~

The Atlas verdict is machine-green for currentness and ratchet (HARD RED: 0);
the explicit diff verdict is WORSE because one persistence-link finding was
added. atlas-diff.json is ignored and was not included in the candidate.

The final evidence commit will contain only this report. After that commit is
pushed, git status --porcelain=v1 must be empty and a fresh Verifier may
begin. The Builder did not claim the unlaunched normal-app consumer check as
verified; that remains within the fresh Verifier's independent scope.

## FINAL COMPUTER RED — critic-submit repair

Plain meaning: the critic's review message is now typed once, allowed to settle,
and submitted once to the same live Hermes terminal; if that terminal changes or
the submit key is missing, the review attempt fails closed instead of claiming
delivery.

### Immutable product candidate and scope

| Field | Receipt |
|---|---|
| Builder base | `e08dce505a351064d117332e23e6367158b47372` |
| Product candidate SHA | `d77dfff0e027229ad19a5205802ae7374dae2c52` |
| Branch / push | `wo-R16` / pushed to `origin/wo-R16` |
| Product candidate status before evidence | clean |
| Evidence scope | this BUILD-REPORT only after the product commit |

The product candidate changed exactly these six paths:

~~~text
collab-electron/src/main/agent-host.ts
collab-electron/src/main/governed-review.test.ts
collab-electron/src/main/index.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
~~~

The normal continuation calls `submitAgentSessionInstruction` exactly once and
does not call `deliverToAgentSession`. The helper writes the instruction without
its terminal carriage return once, waits 400 ms, rechecks the same live
native-TUI session and PTY id, then writes exactly one `\r` to that captured PTY.
Changed-target and missing-target paths reject before a second write.

### Exact short matrix receipts

Each command below was run against the unchanged bytes that became candidate
`d77dfff0e027229ad19a5205802ae7374dae2c52`; every command exited natively zero.

| Exact command | Native receipt |
|---|---|
| `bun test collab-electron/src/main/governed-review.test.ts` | `0`; `4 pass / 0 fail / 27 expect` |
| `bun test collab-electron/src/main/research-world.test.ts` | `0`; `3 pass / 0 fail / 13 expect` |
| `bun test collab-electron/src/windows/shell/src/research-world.test.ts` | `0`; `6 pass / 0 fail / 32 expect` |
| `bun test collab-electron/src/windows/shell/src/task-composition.test.ts` | `0`; `3 pass / 0 fail / 55 expect` |
| `bun test collab-electron/src/main/native-tui-orchestration.test.ts` | `0`; `9 pass / 0 fail / 42 expect` |
| `bun test collab-electron/src/main/precreated-native-tui.test.ts` | `0`; `2 pass / 0 fail / 5 expect` |
| `bun test packages/qf-kernel/src/r15-governed-review.test.ts` | `0`; `7 pass / 0 fail / 55 expect` |
| `bun test packages/qf-kernel/src/r16-visible-world.test.ts` | `0`; `3 pass / 0 fail / 5 expect` |
| `bun test qa/gates/governed-review.test.ts` | `0`; nested production/kernel `11 pass / 0 fail`, live broker `7 pass / 0 fail`, gate `3 pass / 0 fail` |
| `bun test qa/gates/research-world-visible.test.ts` | `0`; `13 pass / 0 fail / 192 expect` |
| `bun qa/run.ts kernel-sole-writer` | `0`; `PASS  kernel-sole-writer` |
| `bun qf-atlas/generate.mjs --check` | `0`; `qf-atlas: current — 432 files, 124 channels, 13 strip candidates` |
| `bun qf-atlas/ratchet.mjs` | `0`; baseline `3`, HARD RED `0`, unexplained `0`, AMBER `20`, undecided `42` |
| `git diff --check` | `0`; no output |

Atlas regeneration was authorized and completed with native exit 0. The
post-change `bun qf-atlas/generate.mjs --diff e08dce505a351064d117332e23e6367158b47372`
receipt was `VERDICT: UNCHANGED` with added/newly-detected/resolved/regressed
all `0`; coverage and undecided counts were unchanged.

### Critic-submit falsifier

The only temporary mutation removed exactly the second
`writeToSession(capturedPtySessionId, "\r")` in
`submitAgentSessionInstruction`; tests, expected values, and gate files were
unchanged.

~~~text
Command: bun test collab-electron/src/main/governed-review.test.ts
Red native exit: 1
Red receipt: the unchanged test expected two writes but received only the
instruction write; the missing second write was the exact separate "\r" submit.
Restoration: exact second write restored.
Restored native exit: 0
Restored receipt: 4 pass / 0 fail / 27 expect
git diff --quiet HEAD -- collab-electron/src/main/agent-host.ts
native_exit=0
~~~

The focused runtime test also records the first write byte-for-byte as the
`buildMissionActivationInstruction()` result minus its one terminal `\r`, the
second write as exactly `\r`, a measured settle of at least 350 ms around the
fixed 400 ms bounded wait, one delivery receipt, the unchanged four governed
receipts, Evaluation, and supports publication. It exercises changed-PTY and
missing-live-target rejection without changing Kernel receipts.

### Verification boundary

No live Electron app, normal consumer launch, build, package/installer gate,
release gate, Computer Use, founder database, or R17 path was run or changed.
Independent verification remains required at immutable product SHA
`d77dfff0e027229ad19a5205802ae7374dae2c52`: the Verifier must rerun the named
matrix, inspect the candidate before and after, and write separate verification
evidence. The Router's one-build/two-launch normal consumer check remains
unopened until that independent PASS.

## CRITIC SUBMIT VERIFIER RED — write-status correction Builder closure

Plain meaning: a critic review is no longer called delivered when the terminal
accepted none of the bytes; both the typed instruction and its separate submit
key must be accepted by the same live PTY.

### Immutable product candidate

| Field | Receipt |
|---|---|
| Builder base | `61243c30f872b9398ffcf8c9ab4a12cfc24d8712` |
| Product candidate SHA | `e824ae10f50336a1640afeecd802ed7141bbeeb7` |
| Branch / push | `wo-R16` / `origin/wo-R16` |
| Product candidate status before evidence | clean |
| Product paths | `collab-electron/src/main/pty.ts`; `collab-electron/src/main/agent-host.ts`; `collab-electron/src/main/governed-review.test.ts`; generated `qf-atlas/ATLAS.md`, `qf-atlas/atlas.html`, `qf-atlas/atlas.json` |

The product candidate was committed and pushed before this evidence section.
`index.ts`, Kernel semantics, timings, payloads, peer delivery, founder Submit,
and all other product files remained unchanged. The candidate file SHA-256
receipts are:

```text
pty.ts                 DE3091571AEB96DCE37EBFDA1104941423AA013E2098A2603B0C8A613009BEEB
agent-host.ts          0542DE9685FAC9FA67A9B9D5069B554EB1A90D97570F3EA27DEA5C5B75E6A7FA
governed-review.test.ts ECE7A1DBE2F384CA6CB6CE36F7F0DDB527F758D8928198DD34F3F2C0CC4F66F9
```

### Focused production proof

```text
bun test collab-electron/src/main/governed-review.test.ts
exit=0
4 pass / 0 fail / 51 expect
```

The green path records exactly two writes through the production helper:
the instruction returned by `buildMissionActivationInstruction()` with its
one terminal `\r` removed, then exactly `"\r"` after the bounded 400 ms wait.
The test also exercises changed-target and missing-live-entry rejection.
Two fresh isolated delivery fixtures run the real
`kernelContinueGovernedResearchResult` continuation with only its delivery
callback supplied. A false first write yields exactly one attempted text write;
a true text write followed by a false submit write yields exactly the text and
one `"\r"` attempt. Each case records exactly one failed delivery receipt,
zero delivered receipts, zero governed invocations, zero Evaluation rows, zero
findings Artifacts, and zero publication rows.

### Required write-status falsifiers

The focused test file remained unchanged during both production mutations. Its
candidate SHA-256 before and after each mutation was
`ECE7A1DBE2F384CA6CB6CE36F7F0DDB527F758D8928198DD34F3F2C0CC4F66F9`.

1. Missing-submit falsifier: only the second production assignment was changed
   from `writeToSession(capturedPtySessionId, "\r")` to a no-op accepted value.

   ```text
   command: bun test collab-electron/src/main/governed-review.test.ts
   native exit=1
   error: governed review critic submit write was not accepted
   ```

   The exact assignment was restored. `agent-host.ts` returned to SHA-256
   `0542DE9685FAC9FA67A9B9D5069B554EB1A90D97570F3EA27DEA5C5B75E6A7FA`,
   with zero diff from its pre-mutation bytes, and the same command returned
   native exit 0 with `4 pass / 0 fail / 51 expect`.

2. False-first-result falsifier: only the first production result expression
   was changed to `writeToSession(capturedPtySessionId, text) && false`.

   ```text
   command: bun test collab-electron/src/main/governed-review.test.ts
   native exit=1
   error: governed review critic instruction write was not accepted
   ```

   The exact expression was restored. `agent-host.ts` again matched the same
   pre-mutation SHA-256 with zero diff, and the same command returned native
   exit 0 with `4 pass / 0 fail / 51 expect`.

### Exact parent short matrix

The exact focused/direct commands were run against immutable candidate
`e824ae10f50336a1640afeecd802ed7141bbeeb7`:

```text
bun test collab-electron/src/main/governed-review.test.ts                         exit=0  4 pass / 0 fail / 51 expect
bun test collab-electron/src/main/research-world.test.ts                           exit=0  3 pass / 0 fail / 13 expect
bun test collab-electron/src/windows/shell/src/research-world.test.ts              exit=0  6 pass / 0 fail / 32 expect
bun test collab-electron/src/windows/shell/src/task-composition.test.ts             exit=0  3 pass / 0 fail / 55 expect
bun test collab-electron/src/main/native-tui-orchestration.test.ts                  exit=0  9 pass / 0 fail / 42 expect
bun test collab-electron/src/main/precreated-native-tui.test.ts                     exit=0  2 pass / 0 fail / 5 expect
bun test packages/qf-kernel/src/r15-governed-review.test.ts                         exit=0  7 pass / 0 fail / 55 expect
bun test packages/qf-kernel/src/r16-visible-world.test.ts                           exit=0  3 pass / 0 fail / 5 expect
bun test qa/gates/governed-review.test.ts                                           exit=0  nested 11/0; live 7/0; gate 3/0
bun test qa/gates/research-world-visible.test.ts                                    exit=0  13 pass / 0 fail / 192 expect
bun qa/run.ts kernel-sole-writer                                                    exit=0  PASS  kernel-sole-writer
bun qf-atlas/generate.mjs --check                                                   exit=0  current — 432 files, 124 channels, 13 strip candidates
bun qf-atlas/ratchet.mjs                                                           exit=0  HARD RED: 0; unexplained coverage: 0; AMBER: 20; undecided: 42
git diff --check                                                                   exit=0
```

The broader parent command `bun qa/run.ts governed-review` also exited 0 with
its focused production/kernel proof and governed-review PASS. The remaining
named static commands were run exactly: `lockfile-committed`,
`no-canvas-domain-writes`, `doc-action-surface`, `repo-shape`, `one-skin`,
`doc-links`, and `rung-ladder` all exited 0 with PASS. The one unchanged
parent static hard red was:

```text
bun qa/run.ts kernel-sole-writer-app
exit=1
kernel-sole-writer-app FAIL — offenders:
  collab-electron/src/main/governed-review.test.ts (node:sqlite)
  collab-electron/src/main/native-tui-orchestration.test.ts (node:sqlite)
  collab-electron/src/main/ontology-gateway.test.ts (qf-kernel)
  collab-electron/src/main/precreated-native-tui.test.ts (node:sqlite)
```

This is pre-existing gate debt: the unchanged gate allowlist omits these
already-existing focused tests, and the allowed WO-R16 correction paths do not
include that gate or the unrelated tests. No out-of-scope edit was made to
manufacture green.

The required historical candidate test-path receipt was also captured:

```text
git diff --name-only fef713c06f091dc8df13f7bde07be859d3b04930 HEAD -- "*.test.ts"
collab-electron/src/main/dock-profiles.test.ts
collab-electron/src/main/governed-review.test.ts
collab-electron/src/main/native-tui-orchestration.test.ts
collab-electron/src/main/ontology-gateway.test.ts
collab-electron/src/main/precreated-native-tui.test.ts
collab-electron/src/main/research-context.test.ts
collab-electron/src/main/research-world.test.ts
collab-electron/src/windows/shell/src/research-world.test.ts
collab-electron/src/windows/shell/src/task-composition.test.ts
collab-electron/src/windows/shell/src/tile-manager-layout.test.ts
packages/qf-kernel/src/r11a-deterministic-execution.test.ts
packages/qf-kernel/src/r16-visible-world.test.ts
qa/gates/research-world-visible.test.ts
```

The extra historical paths predate this correction; the candidate itself
changed only `governed-review.test.ts` among test files.

### Atlas and diff receipts

```text
bun qf-atlas/generate.mjs
exit=0
432 files · 109 subsystems · 124 IPC channels
wires: 111 live · 0 unreached · 13 unused · 0 DEAD
13 strip candidates · 10 confirmed violations · 3 gray · 22 coverage gaps

bun qf-atlas/generate.mjs --check
exit=0
qf-atlas: current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
exit=0
baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · AMBER: 20 · undecided: 42

bun qf-atlas/generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930
exit=0
Atlas diff  c59ebfa -> 61243c3
VERDICT: WORSE — 1 finding(s) added
ADDED: persistence links insert into

git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
exit=0
```

The current Atlas and ratchet are green with HARD RED zero. The explicit base
diff is recorded as WORSE because Atlas added one persistence finding; no Atlas
baseline or semantic code was altered. No product file changed after
`e824ae10f50336a1640afeecd802ed7141bbeeb7`; this report is a separate
evidence-only commit. No Electron build/launch, Computer Use, packaged/release
gate, founder-state change, or R17 work occurred.

## WRITE-STATUS MATRIX GATE-ONLY BUILDER RECEIPT

Immutable product candidate: `e824ae10f50336a1640afeecd802ed7141bbeeb7`.
Gate candidate commit: `ed9de40fc801340aa5a299821c3b322183a547f3`.
Only `qa/gates/kernel-sole-writer-app.ts` and generated Atlas projections changed
in the gate candidate; product paths remain byte-identical to the immutable
candidate. Evidence is committed separately from the gate candidate.

### Gate correction and falsifier

```text
Changed gate path:
qa/gates/kernel-sole-writer-app.ts

Added exactly four KERNEL_ALLOWED literals:
collab-electron/src/main/governed-review.test.ts
collab-electron/src/main/native-tui-orchestration.test.ts
collab-electron/src/main/ontology-gateway.test.ts
collab-electron/src/main/precreated-native-tui.test.ts

Comment:
These are isolated fixture/oracle tests and add no application runtime writer.

bun qa/run.ts kernel-sole-writer-app
exit=0
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app

Falsifier: removed only the new governed-review.test.ts literal.
bun qa/run.ts kernel-sole-writer-app
exit=1
kernel-sole-writer-app FAIL — offenders:
  collab-electron/src/main/governed-review.test.ts (node:sqlite)
FAIL  kernel-sole-writer-app

Pre-falsifier gate SHA-256:
B18BF6EE5D19A5F00048B232C3FF08BE4066A15EB6AC3274EAAEE3C34B2AE03C
Restored gate SHA-256:
B18BF6EE5D19A5F00048B232C3FF08BE4066A15EB6AC3274EAAEE3C34B2AE03C
restoration_zero_diff=0

Restored command:
bun qa/run.ts kernel-sole-writer-app
exit=0
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app
```

### Unchanged parent short matrix

Each command ran once, in the exact WO-R16 order, after restoration:

```text
bun test collab-electron/src/main/research-world.test.ts collab-electron/src/windows/shell/src/research-world.test.ts collab-electron/src/windows/shell/src/task-composition.test.ts
exit=0; 12 pass / 0 fail

bun test packages/qf-kernel/src/r16-visible-world.test.ts qf-kernel-schema/src/generate.test.ts
exit=0; 26 pass / 0 fail

bun test qa/gates/research-world-visible.test.ts
exit=0; 13 pass / 0 fail

bun qa/run.ts governed-review
exit=0; 11 pass / 0 fail; PASS  governed-review

bun qa/run.ts kernel-sole-writer
exit=0; PASS  kernel-sole-writer

bun qa/run.ts kernel-sole-writer-app
exit=0; PASS  kernel-sole-writer-app

bun qa/run.ts lockfile-committed
exit=0; PASS  lockfile-committed

bun qa/run.ts no-canvas-domain-writes
exit=0; PASS  no-canvas-domain-writes

bun qa/run.ts doc-action-surface
exit=0; PASS  doc-action-surface

bun qa/run.ts repo-shape
exit=0; PASS  repo-shape

bun qa/run.ts one-skin
exit=0; PASS  one-skin

bun qa/run.ts doc-links
exit=0; PASS  doc-links

bun qa/run.ts rung-ladder
exit=0; PASS  rung-ladder

git diff --check
exit=0

git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
exit=0
```

### Atlas and final diff receipts

The gate edit required generated projections; no semantic product or Atlas
baseline change was made.

```text
bun qf-atlas/generate.mjs
exit=0
432 files · 109 subsystems · 124 IPC channels
wires: 111 live · 0 unreached · 13 unused · 0 DEAD

bun qf-atlas/generate.mjs --check
exit=0
qf-atlas: current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
exit=0
baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 20 · undecided: 42

git diff --check
exit=0

git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
exit=0
```

Final gate-candidate changed paths:

```text
qa/gates/kernel-sole-writer-app.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
```

No product candidate file changed. No build, launch, Computer Use,
founder-state, or R17 work occurred.

## NORMAL REOPEN RED — governed-review support tables

Plain meaning: governed-review support records now survive a real close and
reopen, while an unrelated review-named table still fails closed as drift.

### Immutable candidate and scope

| Field | Receipt |
|---|---|
| Builder base | `c3b2b8fb8eb0b6eefd886ffed47e3b8ac397e3f4` |
| Immutable product candidate | `5445578508e3b76f107e5c3ed40eafefd0e18319` |
| Atlas projection commit | `790186b5057f70d916f1eb1a72cc81a318a5e9e8` |
| Branch / push | `wo-R16` / `origin/wo-R16` |
| Evidence scope | this existing `BUILD-REPORT.md` only |
| Founder DB / build / launch | not accessed / not run / not run |

The immutable product candidate changed exactly:

```text
packages/qf-kernel/src/registry-drift.ts
packages/qf-kernel/src/registry-drift.test.ts
packages/qf-kernel/src/attach-kernel-drift.test.ts
```

The separate generated projection commit changed exactly:

```text
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
```

### Focused commands

Each command ran natively in the required order:

```text
bun test packages/qf-kernel/src/registry-drift.test.ts
exit=0; 7 pass / 0 fail / 12 expect

bun test packages/qf-kernel/src/attach-kernel-drift.test.ts
exit=0; 6 pass / 0 fail / 16 expect

bun test packages/qf-kernel/src/r15-governed-review.test.ts
exit=0; 7 pass / 0 fail / 55 expect
```

The lifecycle test creates one isolated file-backed writable Kernel with
`openKernel(path, { create: true })`, calls the real
`ensureGovernedReviewSchema(db)` once, inserts the six exact deterministic
support rows, snapshots each literal table with `SELECT * ... ORDER BY rowid`,
closes the handle, reopens the same path through writable `openKernel(path)`,
requires `getKernelDrift` to be null, and proves the snapshots are byte-equal.
No founder database or hand-inserted `schema_meta`/ontology row was used.

### Exact qf_review_task falsifier

The only temporary source mutation removed the literal `qf_review_task` entry
from `INFRA_TABLES`. The test and all other files remained unchanged.

```text
Command: bun test packages/qf-kernel/src/attach-kernel-drift.test.ts
Native exit: 1
KernelRegistryDriftError: Kernel object-type registry drift: missing=[] retired=[] inconsistent=[qf_review_task]
Result: 5 pass / 1 fail; the failure was
`reopens governed-review schema with support rows intact`.
```

Candidate `registry-drift.ts` SHA-256 before mutation:
`AD5F06C5F7A09B817A7978B99AC48C57595A249284A97C2BB47E92C89EF026B7`.
The exact literal was restored. The restored SHA-256 was the same
`AD5F06C5F7A09B817A7978B99AC48C57595A249284A97C2BB47E92C89EF026B7`,
`restoration_zero_diff=0`, and the unchanged command returned:

```text
bun test packages/qf-kernel/src/attach-kernel-drift.test.ts
exit=0; 6 pass / 0 fail / 16 expect
```

### Complete bounded R16 parent matrix

The exact commands ran without wrappers, substitutions, or omissions:

```text
bun test collab-electron/src/main/governed-review.test.ts
exit=0; 4 pass / 0 fail / 51 expect

bun test collab-electron/src/main/research-world.test.ts
exit=0; 3 pass / 0 fail / 13 expect

bun test collab-electron/src/windows/shell/src/research-world.test.ts
exit=0; 6 pass / 0 fail / 32 expect

bun test collab-electron/src/windows/shell/src/task-composition.test.ts
exit=0; 3 pass / 0 fail / 55 expect

bun test collab-electron/src/main/native-tui-orchestration.test.ts
exit=0; 9 pass / 0 fail / 42 expect

bun test collab-electron/src/main/precreated-native-tui.test.ts
exit=0; 2 pass / 0 fail / 5 expect

bun test packages/qf-kernel/src/r15-governed-review.test.ts
exit=0; 7 pass / 0 fail / 55 expect

bun test packages/qf-kernel/src/r16-visible-world.test.ts
exit=0; 3 pass / 0 fail / 5 expect

bun test qa/gates/governed-review.test.ts
exit=0; nested production/kernel 11 pass / 0 fail; live contract 7 pass / 0 fail; gate 3 pass / 0 fail

bun test qa/gates/research-world-visible.test.ts
exit=0; 13 pass / 0 fail / 192 expect

bun qa/run.ts kernel-sole-writer
exit=0; PASS  kernel-sole-writer

bun qf-atlas/generate.mjs --check
exit=0; qf-atlas: current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
exit=0; HARD RED: 0; unexplained coverage: 0; AMBER: 20; undecided: 42

git diff --check
exit=0; no output

git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
exit=0; no output
```

An initial currentness check before the required Atlas regeneration reported
the expected stale fingerprint (`9f03856a7d06a3b7 != d770980b61d234a3`); it
was not accepted as a matrix result. The allowed generator then wrote only the
three Atlas projections above, after which the currentness/ratchet and both
diff checks were green.

### Atlas receipts

```text
bun qf-atlas/generate.mjs
exit=0
qf-atlas: wrote atlas.json + atlas.html + ATLAS.md
  432 files · 109 subsystems · 124 IPC channels
  wires: 111 live · 0 unreached · 13 unused · 0 DEAD
  legacy loops: 6/8 healthy · Review and publish, Close the app
  decisions: 42 undecided of 47
  13 strip candidates · 10 confirmed violations · 3 gray · 22 coverage gaps

bun qf-atlas/generate.mjs --check
exit=0
qf-atlas: current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
exit=0
baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 ·
AMBER (visible, non-blocking): 20 · undecided: 42

bun qf-atlas/generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930
exit=0
VERDICT: WORSE — 1 analyzer cell(s) got worse
added 1 · newly-detected 0 · resolved 0 · regressed 0
coverage worse 1 · better 0 · undecided 41 -> 42
ADDED: persistence links insert into
COVERAGE REGRESSED: attach-kernel-drift.test.ts persistence
not-applicable -> partial
```

The Atlas diff is explicitly `WORSE` because the new lifecycle test contains
six direct support-table SQL sites that the analyzer classifies as partial
coverage; currentness remains green and `HARD RED: 0`. No Atlas baseline or
semantic code was changed. `atlas-diff.json` is ignored and was not staged.

### Final state

The product candidate was committed before the Atlas projection commit and
this evidence commit. Final allowed paths are the three product/test files,
the three generated Atlas projections, and this existing report. No product
file changed after candidate `5445578`; the final tree was verified clean and
the branch was pushed to `origin/wo-R16`. No build, launch, Computer Use,
founder-state change, package/release work, or R17 work occurred.

## NORMAL CONSUMER RED — shared result Artifact isolation Builder closure

Plain meaning: two real Missions can share the same data without showing each
other's history, and the old leakage is proven to return when the repair is removed.

### Immutable candidate and scope

| Field | Receipt |
|---|---|
| Builder base | `a175f45` |
| Immutable product candidate SHA | `7dda122435dce47adbc650e5d5b9d933db249263` |
| Branch | `wo-R16` |
| Product/test SHA-256 | projection `ecd64a563e53fe73be8bddeed59a49904284e12c789c5446a3b55fcbdbbdd279`; test `155f75ce5204679ddf0db68bc5fce8d25c09fed585a2db39451dfe46ae0ee64c` |
| Candidate status before evidence | clean |

Candidate paths changed exactly:

```text
collab-electron/src/main/research-world-projection.ts
collab-electron/src/main/research-world.test.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
```

The test appends exactly one named regression and retains the three prior tests
and their assertions. The fixture uses real Kernel actions for two complete
Missions, with equal Dataset and result Artifact ids and distinct other named
world ids; each direction asserts the exact 13 objects and 15 links.

### Focused command

```text
bun test collab-electron/src/main/research-world.test.ts
exit=0
4 pass
0 fail
52 expect() calls
```

### Complete bounded R16 parent matrix

Each command ran once, natively, in the exact fenced order:

```text
bun test collab-electron/src/main/governed-review.test.ts
exit=0; 4 pass / 0 fail / 51 expect

bun test collab-electron/src/main/research-world.test.ts
exit=0; 4 pass / 0 fail / 52 expect

bun test collab-electron/src/windows/shell/src/research-world.test.ts
exit=0; 6 pass / 0 fail / 32 expect

bun test collab-electron/src/windows/shell/src/task-composition.test.ts
exit=0; 3 pass / 0 fail / 55 expect

bun test collab-electron/src/main/native-tui-orchestration.test.ts
exit=0; 9 pass / 0 fail / 42 expect

bun test collab-electron/src/main/precreated-native-tui.test.ts
exit=0; 2 pass / 0 fail / 5 expect

bun test packages/qf-kernel/src/r15-governed-review.test.ts
exit=0; 7 pass / 0 fail / 55 expect

bun test packages/qf-kernel/src/r16-visible-world.test.ts
exit=0; 3 pass / 0 fail / 5 expect

bun test qa/gates/governed-review.test.ts
exit=0; nested production/kernel 11 pass / 0 fail; live contract 7 pass / 0 fail; gate 3 pass / 0 fail

bun test qa/gates/research-world-visible.test.ts
exit=0; 13 pass / 0 fail / 192 expect

bun qa/run.ts kernel-sole-writer
exit=0; PASS  kernel-sole-writer

bun qf-atlas/generate.mjs --check
exit=0; qf-atlas: current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
exit=0; HARD RED: 0; unexplained coverage: 0; AMBER: 20; undecided: 42

git diff --check
exit=0; no output

git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
exit=0; no output
```

### Executable shared-Artifact falsifier and restoration

Only `collab-electron/src/main/research-world-projection.ts` was temporarily
replaced with its exact bytes from base `5445578508e3b76f107e5c3ed40eafefd0e18319`.
The test and every other path remained byte-identical.

```text
Command: bun test collab-electron/src/main/research-world.test.ts
Native exit: 1
Native result: 3 pass / 1 fail
Named failure: expected target Mission's 13 objects but received 24;
decoy-only ids included decoy-shared-mission, decoy-shared-run,
decoy-shared-source-task, decoy-critic, decoy-director, and decoy-worker.
```

The mutation was red because the old broad closure re-imported the decoy world
through the shared result Artifact. A green mutation run would have failed acceptance.

Candidate bytes were restored from immutable candidate SHA
`7dda122435dce47adbc650e5d5b9d933db249263`:

```text
restored_projection_sha256=ecd64a563e53fe73be8bddeed59a49904284e12c789c5446a3b55fcbdbbdd279
restored_test_sha256=155f75ce5204679ddf0db68bc5fce8d25c09fed585a2db39451dfe46ae0ee64c
projection_zero_diff=0
test_zero_diff=0

bun test collab-electron/src/main/research-world.test.ts
exit=0
4 pass
0 fail
52 expect() calls
```

### Atlas receipts and final status

```text
bun qf-atlas/generate.mjs
exit=0
qf-atlas: wrote atlas.json + atlas.html + ATLAS.md
432 files · 109 subsystems · 124 IPC channels
wires: 111 live · 0 unreached · 13 unused · 0 DEAD

bun qf-atlas/generate.mjs --check
exit=0; qf-atlas: current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
exit=0; HARD RED: 0; unexplained coverage: 0; AMBER: 20; undecided: 42

bun qf-atlas/generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930
exit=0; VERDICT: WORSE; added 1 analyzer cell; coverage worse 1; ADDED: persistence links insert into

git diff --check
exit=0
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
exit=0
```

The Atlas diff is the existing analyzer coverage classification for direct
support-table SQL in the repository; currentness is green and HARD RED is zero.
No Atlas baseline or semantic code was changed. No build, launch, Computer Use,
founder-state change, package/release work, or R17 work occurred in this Builder turn.

## NORMAL CONSUMER RED — governed critic cannot inspect result Artifact bytes — Builder closure

Plain meaning: a governed critic now receives the same hash-verified result evidence that the Kernel records, without receiving a filesystem path.

### Immutable candidate and scope

| Field | Receipt |
|---|---|
| Starting WIP SHA | `c023f747e4a5451e8c1d0a5bad8adb792a86ca41` |
| Atlas comparison base | `fef713c06f091dc8df13f7bde07be859d3b04930` |
| Product candidate SHA | `99188c6b3e039821c5c615c621a45d5c3f484ab9` |
| Branch / remote | `wo-R16` / `origin/wo-R16` |
| Candidate commit | `fix(r16): expose verified Artifact receipt to governed critics` |
| Builder result | **PASS** |
| Build / app / R17 | not run / not launched / not started |

The candidate changed exactly these six allowed paths:

```text
collab-electron/src/main/research-world-projection.ts
collab-electron/src/main/ontology-gateway.ts
collab-electron/src/main/ontology-gateway.test.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.json
qf-atlas/atlas.html
```

`artifactReceipt()` is exported and reused by the governed Artifact gateway
read. An admitted governed `qf_artifact_get` returns only `id`, `created_at`,
`kind`, `content_hash`, and that shared receipt; the same enriched object is
persisted in `qf_review_invocation`. The five existing gateway test blocks are
unchanged and the test file appends exactly the named sixth test.

### Exact Builder matrix — rows 1–9

Rows 1–9 ran once before the Router’s out-of-scope consumer-receipt correction.
Their native outputs were:

```text
bun test collab-electron/src/main/ontology-gateway.test.ts
bun test v1.3.12 (700fc117)

collab-electron\src\main\ontology-gateway.test.ts:
(pass) only ontology reads receive the Kernel read marker
(pass) production read dispatch marks market reads but not desk orchestration reads
(pass) generic ontology actions expose deterministic execution but not task bypasses
(pass) native research roles receive a focused generated ontology surface
kernel: path=:memory: provenance=env journal=memory sync=2 schema_meta=84
(pass) production list_tools serves action and read schemas for admitted seats [47.00ms]
(pass) an admitted governed critic receives and records the verified Artifact receipt [125.00ms]

 6 pass
 0 fail
 67 expect() calls
Ran 6 tests across 1 file. [333.00ms]
native exit=0

bun test collab-electron/src/main/research-world.test.ts
bun test v1.3.12 (700fc117)

collab-electron\src\main\research-world.test.ts:
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=84
(pass) Main research-world projection > returns exact root errors and honest empty-world facts
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=84
(pass) Main research-world projection > returns a frozen value snapshot with no filesystem path in Artifact receipts [15.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=84
(pass) Main research-world projection > projects the complete normal governed world as 13 objects and 15 links [31.00ms]
kernel: path=:memory: provenance=explicit journal=memory sync=2 schema_meta=84
(pass) Main research-world projection > isolates two Missions that share Dataset and result Artifact in both root directions [47.00ms]

 4 pass
 0 fail
 52 expect() calls
Ran 4 tests across 1 file. [234.00ms]
native exit=0

bun test collab-electron/src/main/governed-review.test.ts
bun test v1.3.12 (700fc117)

collab-electron\src\main\governed-review.test.ts:
(pass) R15 production governed-review seams > critic policy is exact and least privilege
(pass) R15 production governed-review seams > request review crosses preload and Main IPC, and block literals are order-owned
(pass) R15 production governed-review seams > sidecar shutdown exit preserves the durable Task/session/link snapshot
kernel: path=:memory: provenance=env journal=memory sync=2 schema_meta=84
(pass) R15 production governed-review seams > normal continuation binds worker lineage, admits one review, delivers once, and publishes supports [1078.00ms]

 4 pass
 0 fail
 51 expect() calls
Ran 4 tests across 1 file. [1159.00ms]
native exit=0

bun qa/run.ts kernel-sole-writer-app
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app
native exit=0

bun qf-atlas/generate.mjs
qf-atlas: wrote atlas.json + atlas.html + ATLAS.md
  432 files · 109 subsystems · 124 IPC channels
  wires: 111 live · 0 unreached · 13 unused · 0 DEAD
  legacy loops: 6/8 healthy · Review and publish, Close the app
  decisions: 42 undecided of 47
  13 strip candidates · 10 confirmed violations · 3 gray · 22 coverage gaps
native exit=0

bun qf-atlas/generate.mjs --check
qf-atlas: current — 432 files, 124 channels, 13 strip candidates
native exit=0

bun qf-atlas/ratchet.mjs
qf-atlas ratchet — 3.5s (budget 60s)

  baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 20 · undecided: 42
native exit=0

bun qf-atlas/generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930
Atlas diff  c59ebfa -> 36235b3
VERDICT: WORSE — 1 analyzer cell(s) got worse — a finding that vanishes because the analyzer stopped reading the file is a regression, not a fix

  added 1 · newly-detected 0 · resolved 0 · regressed 0
  confidence changed 0 · owners changed 0
  coverage worse 1 · better 0
  undecided 41 -> 42

ADDED (code got worse):
  persistence links insert into

COVERAGE REGRESSED:
  packages/qf-kernel/src/attach-kernel-drift.test.ts persistence: not-applicable -> partial (6 of 6 SQL site(s) are not inside a named function, so no call path can be traced)

wrote qf-atlas/atlas-diff.json
native exit=0; Atlas verdict is the pre-existing transparent `WORSE` classification with HARD RED 0

git diff --check
native exit=0; no output
```

### Row-10 continuation

The first row-10 attempt at the starting WIP was red only because the existing
consumer receipt contained seven Markdown hard-break spaces. The Router fixed
those seven spaces and recorded the continuation in pushed commit
`c023f747e4a5451e8c1d0a5bad8adb792a86ca41`; the product and generated-Atlas WIP
was not staged or altered by that correction. The authorized continuation ran
row 10 exactly once, after that correction and before the candidate commit:

```text
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
native exit=0; no output
```

All ten required commands therefore have native exit zero across the original
rows 1–9 and the authorized row-10 continuation. No row 1–9 was rerun after
the Router correction.

### Exact four-file falsifier and restoration

Before mutation, the candidate SHA-256 hashes were recorded for exactly the
four required product/test paths:

```text
collab-electron/src/main/research-world-projection.ts  51ABB6D8EA34FAC6466BB3F81E7507A2FF2211CB51B0B79181F912FDB2D9C77A
collab-electron/src/main/ontology-gateway.ts            08CE2F507538E08AD30994B5D7CFBDDF217FB4839E58BFEA60B11819808E3C8A
collab-electron/src/main/ontology-gateway.test.ts       48189153395479484B323C4E2407409271A65D37921ACF743074B55C06A2CBF0
collab-electron/src/main/governed-review.test.ts        ECE7A1DBE2F384CA6CB6CE36F7F0DDB527F758D8928198DD34F3F2C0CC4F66F9
```

Only `collab-electron/src/main/ontology-gateway.ts` was replaced, with its
exact bytes from base candidate
`7dda122435dce47adbc650e5d5b9d933db249263`. The other three paths and all
generated Atlas bytes remained unchanged. The required focused command was:

```text
bun test collab-electron/src/main/ontology-gateway.test.ts
native exit=1
```

The mutation was red because the old gateway returned the raw Artifact row:
the assertion named the missing `receipt` and showed leaked `storage_ref` where
the new test requires the shared verified receipt:

```text
  {
    "content_hash": "ad2b4752d6a4f24a35d0d354608c239d04129b4f95ef8d91969ec110d2fe229e",
    "created_at": "2026-08-22T12:54:07.410Z",
    "id": "ad2b4752d6a4f24a35d0d354608c239d04129b4f95ef8d91969ec110d2fe229e",
    "kind": "result_set",
-   "receipt": {
-     "artifact_id": "ad2b4752d6a4f24a35d0d354608c239d04129b4f95ef8d91969ec110d2fe229e",
-     "content_hash": "ad2b4752d6a4f24a35d0d354608c239d04129b4f95ef8d91969ec110d2fe229e",
-     "durable_bytes_available": true,
-     "kind": "result_set",
-     "preview": "{\"metrics\":{\"roi\":\"1.000000\",\"net_profit\":\"100.000000\"}}",
-   },
+   "storage_ref": "C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-r16-gateway-artifact-XG9POR\\valid.json",
  }
```

The candidate gateway bytes were restored from immutable candidate
`99188c6b3e039821c5c615c621a45d5c3f484ab9`. Restoration proof:

```text
collab-electron/src/main/research-world-projection.ts  51ABB6D8EA34FAC6466BB3F81E7507A2FF2211CB51B0B79181F912FDB2D9C77A
collab-electron/src/main/ontology-gateway.ts            08CE2F507538E08AD30994B5D7CFBDDF217FB4839E58BFEA60B11819808E3C8A
collab-electron/src/main/ontology-gateway.test.ts       48189153395479484B323C4E2407409271A65D37921ACF743074B55C06A2CBF0
collab-electron/src/main/governed-review.test.ts        ECE7A1DBE2F384CA6CB6CE36F7F0DDB527F758D8928198DD34F3F2C0CC4F66F9
diff_exit=0
```

The restored focused command returned:

```text
bun test collab-electron/src/main/ontology-gateway.test.ts
bun test v1.3.12 (700fc117)

collab-electron\src\main\ontology-gateway.test.ts:
(pass) only ontology reads receive the Kernel read marker
(pass) production read dispatch marks market reads but not desk orchestration reads
(pass) generic ontology actions expose deterministic execution but not task bypasses
(pass) native research roles receive a focused generated ontology surface
kernel: path=:memory: provenance=env journal=memory sync=2 schema_meta=84
(pass) production list_tools serves action and read schemas for admitted seats [47.00ms]
(pass) an admitted governed critic receives and records the verified Artifact receipt [125.00ms]

 6 pass
 0 fail
 67 expect() calls
Ran 6 tests across 1 file. [349.00ms]
native exit=0
```

### Final status

The product candidate is immutable at `99188c6b3e039821c5c615c621a45d5c3f484ab9`.
The report append is the separate evidence commit requested by the order. No
Electron build, normal application launch, Computer Use, founder-state access,
package/release work, consumer receipt edit, order/NEXT edit, or R17 work was
performed in this Builder turn.

## NORMAL CONSUMER ATTEMPT 2 RED — numeric rubric discovery Builder closure

Plain meaning: the critic now receives four actual numeric scores, so it can
record an evaluation instead of sending text that the Kernel must reject.

### Immutable candidate and bounded scope

| Field | Receipt |
|---|---|
| Starting docs head | `7a6faa18e8e0c6fd00975330d424052b9e240807` |
| Atlas comparison base | `fef713c06f091dc8df13f7bde07be859d3b04930` |
| Base schema for falsifier | `99188c6b3e039821c5c615c621a45d5c3f484ab9` |
| Product candidate SHA | `e94e544` (`fix(r16): publish numeric evaluation rubric authority`) |
| Branch / remote | `wo-R16` / `origin/wo-R16` |
| Builder result | **PASS** |
| Build / app / consumer / R17 | not run / not launched / not run / not started |

The candidate changed exactly these seven allowed paths:

```text
qf-kernel-schema/src/ontology/research.ts
qf-kernel-schema/src/generate.test.ts
qf-kernel-schema/golden/tools.json
collab-electron/src/main/ontology-gateway.test.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
```

`record_evaluation.rubric` is now one named strict Zod object with exactly
`faithfulness`, `answer_relevancy`, `context_precision`, and `context_recall`;
each is a number bounded from `0` through `1`. The shared action property stays
optional. No Kernel validation, verdict derivation, coercion, retry, renderer,
gateway implementation, fixture, order, consumer receipt, package,
credential, founder-state, or R17 path changed. `golden/ONTOLOGY.md` and
`golden/migration.sql` remained byte-identical.

### Exact Builder matrix

The required commands ran in the order below before the candidate commit; all
native exits were zero:

```text
bun run --cwd qf-kernel-schema generate
exit=0; wrote golden/migration.sql, golden/tools.json, golden/ONTOLOGY.md, golden/conformance.test.ts, and upgrades 0001 through 0012

bun test --cwd qf-kernel-schema
exit=0; 178 pass / 0 fail / 613 expect calls; exactly 178 tests across 3 files

bun test collab-electron/src/main/ontology-gateway.test.ts
exit=0; 6 pass / 0 fail / 70 expect calls

bun test collab-electron/src/main/governed-review.test.ts
exit=0; 4 pass / 0 fail / 51 expect calls

bun qa/run.ts governed-review
exit=0; focused production/kernel proof 11 pass / 0 fail; PASS governed-review

bun qa/run.ts kernel-sole-writer-app
exit=0; kernel-sole-writer-app OK; PASS kernel-sole-writer-app

bun qf-atlas/generate.mjs
exit=0; 432 files; 109 subsystems; 124 IPC channels; 111 live wires; HARD RED not reported

bun qf-atlas/generate.mjs --check
exit=0; qf-atlas current — 432 files, 124 channels, 13 strip candidates

bun qf-atlas/ratchet.mjs
exit=0; HARD RED: 0; unexplained coverage: 0; undecided without blocker: 0

git diff --check
exit=0; no output

git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
exit=0; no output
```

The appended schema test is named exactly
`record_evaluation publishes an exact numeric rubric object`; the schema suite
reported exactly `178 pass / 0 fail`. The existing five gateway test blocks and
all their assertions remain present; the focused gateway suite reported exactly
`6 pass / 0 fail`. The extended production `list_tools` test independently
asserts the four literal property names, numeric types, `0`/`1` bounds, required
list, closed object, and equality with the generated action authority.

### Candidate SHA-256 freeze

The seven changed product/test/generated files were hashed after candidate
commit and before falsification:

```text
collab-electron/src/main/ontology-gateway.test.ts 31B9D45B062E56AEF7B8FCFC90BD11EE599C628BE326C3F60F3EFE829EFA89A4
qf-atlas/ATLAS.md FB46A8C93047D8BDF6919227863870F5B75D4CA1E8B698C775FC54A96D4B2D3B
qf-atlas/atlas.html A789746D3FC974F3267B66C84C1E6B90CD25531FC20EA288B7025E599A0E5516
qf-atlas/atlas.json 0C90C090DBE0FAA49702CB8F3EBBEAD4F66013C528AFD20FB98E2FF37A42FE82
qf-kernel-schema/golden/tools.json 09E2A2B57B515736B23E951EA2D90E69D37317EF3ED9852203660613AB05DBCD
qf-kernel-schema/src/generate.test.ts D56D2A58D817EF97C65B183FB0390282F3D044CD2FC8EB4FF379C867D624BC4D
qf-kernel-schema/src/ontology/research.ts D84DE3362D842A3C192EB6314B12757C62B6C1356C9CA9D854FB7E10CBCBD942
```

### Source-only falsifier and exact restoration

Only `qf-kernel-schema/src/ontology/research.ts` was restored from the exact
base bytes at `99188c6b3e039821c5c615c621a45d5c3f484ab9`. The base schema was
regenerated, then both focused commands were run:

```text
git restore --source=99188c6b3e039821c5c615c621a45d5c3f484ab9 -- qf-kernel-schema/src/ontology/research.ts
bun run --cwd qf-kernel-schema generate
exit=0

bun test --cwd qf-kernel-schema
native exit=1; 177 pass / 1 fail / 613 expect calls
named failure: record_evaluation publishes an exact numeric rubric object
named defect: received generic object shape with propertyNames={type:string} and additionalProperties={}; missing the four numeric properties, required list, bounds, and closed object

bun test collab-electron/src/main/ontology-gateway.test.ts
native exit=0; 6 pass / 0 fail / 70 expect calls
```

The required falsifier was red on the missing/generic numeric rubric shape.
Every candidate file was then restored from immutable candidate `e94e544`.
The exact seven hashes above were reproduced, `git diff --exit-code` against
those candidate paths returned `0`, and the working tree had no product diff.

The focused restoration commands were rerun green:

```text
bun test --cwd qf-kernel-schema
exit=0; 178 pass / 0 fail / 613 expect calls

bun test collab-electron/src/main/ontology-gateway.test.ts
exit=0; 6 pass / 0 fail / 70 expect calls
```

### Final status

The product candidate was committed before this evidence append. The only
post-candidate change is this report section. The candidate and evidence will
be pushed to `origin/wo-R16` as required; no build, app launch, consumer check,
founder-state change, order/NEXT change, or R17 work occurred.
