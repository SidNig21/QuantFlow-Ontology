# R17 Verification — definitive adversarial batch

## Evidence identity

This is an evidence-only report for the immutable WO-R17 product candidate.

| Field | Value |
|---|---|
| Candidate | `bd619a7483b4ef838ae832302d9b683b85590831` |
| Candidate parent | `98738469b7887da780abf1c61d629bfe93b7a0e9` |
| Branch | `wo-R17` |
| Candidate origin | `bd619a7483b4ef838ae832302d9b683b85590831` |
| Candidate tree | clean |
| Evidence commit | this docs-only commit; its parent is the candidate above |

The independent-verifier REWORK instruction was: “product/matrix PASS, but no committed R17 report binds all eight red→green receipts.” This report supplies that binding. The candidate code tree remains `bd619a7`; this document is separate evidence and does not alter product acceptance code.

## Candidate files and hashes

The candidate diff from build base `7ed2757cfe24d1771117e61cc4a0388aaa332ec5` contains these 37 files:

```text
collab-electron/src/main/agent-host.ts
collab-electron/src/main/host-native-tui.ts
collab-electron/src/main/index.ts
collab-electron/src/main/ipc-kernel.ts
collab-electron/src/main/kernel.ts
collab-electron/src/main/native-tui-orchestration.ts
collab-electron/src/main/research-context.ts
collab-electron/src/main/research-world-projection.ts
collab-electron/src/main/research-world.test.ts
collab-electron/src/preload/shell.ts
collab-electron/src/windows/shell/src/dock.js
collab-electron/src/windows/shell/src/research-world.js
docs/orders/AUTONOMY.md
docs/orders/GOLDEN-RUN.md
docs/orders/NEXT.md
docs/orders/WO-R17.md
packages/qf-kernel/src/create.ts
packages/qf-kernel/src/deterministic-execution.ts
packages/qf-kernel/src/execute.ts
packages/qf-kernel/src/r17-technique-outcome.test.ts
packages/qf-kernel/src/strategy-outcome.ts
packages/qf-kernel/src/upgrade.ts
qa/gates/kernel-sole-writer.ts
qa/gates/technique-outcome-loop.ts
qa/oracles/r17-technique-outcome.json
qa/run.ts
qf-atlas/ATLAS.md
qf-atlas/atlas.html
qf-atlas/atlas.json
qf-kernel-schema/golden/ONTOLOGY.md
qf-kernel-schema/golden/migration.sql
qf-kernel-schema/golden/tools.json
qf-kernel-schema/src/commands.ts
qf-kernel-schema/src/generate/upgrade-independent-critic.ts
qf-kernel-schema/src/generate/upgrade-task-delegation.ts
qf-kernel-schema/src/ontology/research.ts
qf-kernel-schema/src/schema.ts
```

Exact final hashes recorded after the batch:

| File | SHA-256 |
|---|---|
| `collab-electron/src/main/ipc-kernel.ts` | `05c1cdd82b19118ceae7c000ca65286f696d93a3ff51fee69119c02afd135226` |
| `collab-electron/src/main/research-world-projection.ts` | `06d2eba64247a7f174a62b6fe8171a7fb73a3a6fb1bafe634bdaa47f8e2101a7` |
| `collab-electron/src/main/kernel.ts` | `46d2b609795fc7126ec025f715c5e511ccb3b63ee1233748c0c6462bac7b8599` |
| `collab-electron/src/windows/shell/src/research-world.js` | `34fb26699360529890c66276942d857cc3e05071b9d0bae89edd8824123ff004` |
| `qa/gates/technique-outcome-loop.ts` | `a167e6062a65eba56a05ee8b8fcd923652f790d9dd5ee52c51216c7cf9b86599` |
| `qa/oracles/r17-technique-outcome.json` | `038a68c2508d3d671a60a1ab3d562d8d387e70ed08e582a4cca2e7fbf0519fa7` |

## Definitive falsifier batch

Each case ran `bun qa/run.ts technique-outcome-loop` from a fresh process/root. The excerpts below are the exact terminal assertion/cleanup receipts recorded in the final batch; every red exited `1` and ended with `roots_remaining=0 leaked=[]`. Temporary `apply_patch` mutations and environment variables were restored/unset and hash-checked before the next case.

| Case | Temporary mutation / command | Exact red receipt |
|---|---|---|
| 1 | IPC founder resolver selected available v1 instead of the UI-selected v2 | `technique-outcome-loop: FAIL Director Run did not use selected Technique` |
| 2 | `QF_R17_FALSIFY_STRATEGY_BYTES=1` corrupted the Strategy Artifact bytes | `technique-outcome-loop: FAIL Director Technique refusal: TECHNIQUE COVERAGE REFUSED TECHNIQUE COVERAGE REFUSED delta=0` |
| 3 | No mutation; captured from restored green path | `falsifier=authenticated-gateway RED exact-unavailable-action delta=0` |
| 4 | `QF_R17_FALSIFY_GRADES_STRATEGY=1` removed the exact Strategy grade link | `technique-outcome-loop: FAIL missing exact grades_strategy` |
| 5 | `QF_R17_FALSIFY_MISSING_CLOSE=1` removed closing odds | `technique-outcome-loop: FAIL missing-close persisted payload mismatch` |
| 6 | Projection temporarily suppressed only the grade Artifact `addId` | `technique-outcome-loop: FAIL outcome grade was not projected from persisted Kernel state` |
| 7 | Renderer outcome submit temporarily returned `{ ok: true }` without Main/Kernel persistence | `technique-outcome-loop: FAIL renderer acknowledged outcome without Kernel persistence delta=0` |
| 8a | Added exact `r17_test_place_wager` sentinel to a normal changed `.js` source file; candidate scanner was unmodified | `technique-outcome-loop: FAIL placement sentinel surface is present in collab-electron/src/windows/shell/src/research-world.js` |
| 8b | Temporary env propagation plus constructed conditional `kernelExecute` sentinel | `technique-outcome-loop: FAIL R17 placement execution spy intercepted a forbidden action` |

Case 8b's env propagation and conditional call existed only for that temporary falsifier and were restored before the final positive control. No candidate source was committed from either mutation.

## Restored common green

The one restored positive control ran from byte-identical candidate `bd619a7` after all eight reds:

```text
falsifier=missing-malformed-technique RED refusal=TECHNIQUE COVERAGE REFUSED delta=0
falsifier=authenticated-gateway RED exact-unavailable-action delta=0
falsifier=conflicting-replay RED exact-error delta=0
falsifier=missing-close RED payload=clv:null reason=closing_price_unavailable
falsifier=placement-scan-spy GREEN static-surfaces-clean spy-calls=0
runtime_ms=105884
oracle_objects=16 oracle_cables=20 dom_objects=16 dom_cables=20
missing_close_clv=null missing_close_reason=closing_price_unavailable
technique_coverage_refusal=true operator_only_refusal=true conflicting_replay_refusal=true
reopen_same=true placed_bets=0
owned_processes_remaining=0 roots_remaining=0 leaked=[]
roots_remaining=0 leaked=[]
PASS  technique-outcome-loop
```

The restored green exit was `0`. The authenticated gateway receipt is refusal-only evidence; no placement action was executed or claimed. The placement proof is limited to the scanner-clean and execution-spy interception receipts above.

## Product and short-matrix receipts

The following are concise excerpts from the completed WO-R17 short matrix, recorded before this evidence-only pass. The repository root intentionally has no package manifest, so the install command ran with cwd `collab-electron`.

| Command | Recorded receipt |
|---|---|
| `bun install` (cwd `collab-electron`) | PASS; dependencies installed |
| `bun test packages/qf-kernel/src/r11a-deterministic-execution.test.ts` | PASS |
| `bun test packages/qf-kernel/src/r11b-metric-correctness.test.ts` | PASS |
| `bun test packages/qf-kernel/src/kernel.test.ts` | PASS |
| `bun test packages/qf-kernel/src/r17-technique-outcome.test.ts` | PASS |
| `bun qa/run.ts technique-outcome-loop` | PASS; focused live gate |
| `bun qa/run.ts typecheck` | `PASS  typecheck` |
| `bun qa/run.ts repo-shape` | PASS |
| `bun qa/run.ts lockfile-committed` | PASS |
| `bun qa/run.ts kernel-sole-writer` | `PASS  kernel-sole-writer` |
| `bun qa/run.ts kernel-sole-writer-app` | `PASS  kernel-sole-writer-app` |
| `bun qa/run.ts no-canvas-domain-writes` | PASS |
| `bun qa/run.ts doc-action-surface` | PASS |
| `bun qa/run.ts one-skin` | PASS |
| `bun qf-atlas/generate.mjs` / `--check` | current; 435 files, 126 channels, 13 strip candidates |
| `bun qf-atlas/ratchet.mjs` | HARD RED: 0; unexplained coverage: 0 |
| `bun qf-atlas/generate.mjs --diff 7ed2757...` | `VERDICT: UNCHANGED — no architectural change` |
| `bun qa/run.ts doc-links` | `PASS (70 live documents, every pointer resolves)` |
| `git diff --check` / `git diff --cached --check` | PASS |

These are concise recorded receipts, not newly fabricated reruns in this docs-only turn. The final post-batch checks additionally ran typecheck, both kernel laws, Atlas check/ratchet/diff, doc-links, and both diff checks successfully.

## Builder report

The builder froze the product candidate before this report. The final adversarial batch proved each required red mutation and restored the same candidate for the positive control. This commit changes only `docs/orders/evidence/r17/VERIFICATION.md`; it does not change product code, the gate, oracle, Atlas outputs, or the candidate SHA.
