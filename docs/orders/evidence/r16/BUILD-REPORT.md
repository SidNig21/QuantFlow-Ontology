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
