# WO-V2-2 verification

Branch: `wo-V2-2`
Tested product candidate: `1b899d813cc021ff16442fc75688aad3e39f7e40`
Final branch HEAD: recorded after this evidence-only commit
Founder acceptance: `not performed`
L4 certification: `pending`
Live model turns: `0`
Live market data: `0`

The final Builder-run matrix and the packaged synthetic proof ran on native
Windows against candidate `1b899d813cc021ff16442fc75688aad3e39f7e40`. The
synthetic responder used the checked-in deterministic fixture through the
production Hermes profile, WSL launcher, PTY, app-owned MCP bridges, Kernel,
peer delivery, independent critic, Evaluation, and Report. No credentials were
read or changed, and no provider, model, or live market was called.

## Final positive-control raw receipts

```text
hermes-first-turn-synthetic: package-identity={"commitSha":"1b899d813cc021ff16442fc75688aad3e39f7e40","packagedAt":"2026-08-14T09:38:24.575Z"}
windows-hermes-research: FALSIFY RED future Dataset after as_of refused; FALSIFY GREEN no downstream objects
hermes-first-turn-synthetic: dock_admission=pass definition=hermes-orchestrator session=52cc0ed0-8cba-44d0-92ea-3a005a625d23
hermes-first-turn-synthetic: launch_readiness=pass pty_session=9eca58f5e32f30e2
hermes-first-turn-synthetic: boundary-ledger={"candidate_sha":"1b899d813cc021ff16442fc75688aad3e39f7e40","packaged_at":"2026-08-14T09:38:24.575Z","hermes_session_ids":{"orchestrator":"52cc0ed0-8cba-44d0-92ea-3a005a625d23","orchestrator_pty":"9eca58f5e32f30e2","worker":"synthetic-worker-1d26739e-9ae3-419c-bd1a-9e1cf543b07c","critic":"critic-e0e9385f-7291-44a7-95fe-d1fea4de3c91","seats":["52cc0ed0-8cba-44d0-92ea-3a005a625d23","synthetic-worker-1d26739e-9ae3-419c-bd1a-9e1cf543b07c","critic-e0e9385f-7291-44a7-95fe-d1fea4de3c91"]},"durable_measurement_artifacts":{"dataset":{"id":"9361d0c3434f1e1f02b5e5729d441587986b120d12757d2486c1c2a4d75fd47f","content_hash":"9361d0c3434f1e1f02b5e5729d441587986b120d12757d2486c1c2a4d75fd47f","kind":"result_set","storage_ref":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-hermes-first-turn-synthetic-vdaM5V\\stores\\artifacts\\onboarding\\9361d0c3434f1e1f02b5e5729d441587986b120d12757d2486c1c2a4d75fd47f.json"},"deterministic_result":{"id":"cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16","content_hash":"cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16","kind":"result_set","storage_ref":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-hermes-first-turn-synthetic-vdaM5V\\stores\\artifacts\\deterministic-results\\cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16.json"},"worker_result":{"id":"1fd87ac484f3fc2941c74159085f5c5b1b157c4406b3deaf6c6fb799e95a2c94","content_hash":"1fd87ac484f3fc2941c74159085f5c5b1b157c4406b3deaf6c6fb799e95a2c94","kind":"trajectory","storage_ref":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-hermes-first-turn-synthetic-vdaM5V\\stores\\artifacts\\peer-handoffs\\1fd87ac484f3fc2941c74159085f5c5b1b157c4406b3deaf6c6fb799e95a2c94.json"},"market_read_trajectories":[{"id":"04f1abb4c81f481997458f88e0fdf9de10a7fa2d4e61ff69bb18b22c27afcf43","content_hash":"04f1abb4c81f481997458f88e0fdf9de10a7fa2d4e61ff69bb18b22c27afcf43","kind":"trajectory","storage_ref":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-hermes-first-turn-synthetic-vdaM5V\\stores\\artifacts\\ontology-calls\\04f1abb4c81f481997458f88e0fdf9de10a7fa2d4e61ff69bb18b22c27afcf43.json"}],"report":{"id":"8c485f3241b99f3f404c939beb3e877db5396b403ea844ebb3c8ca31df054d73","content_hash":"8c485f3241b99f3f404c939beb3e877db5396b403ea844ebb3c8ca31df054d73","kind":"report","storage_ref":"C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-hermes-first-turn-synthetic-vdaM5V\\stores\\artifacts\\reports\\8c485f3241b99f3f404c939beb3e877db5396b403ea844ebb3c8ca31df054d73.json"}},"boundaries":[{"boundary":"dock_admission","outcome":"pass","failed_boundary":null,"failure_mechanism":"none"},{"boundary":"launch_readiness","outcome":"pass","failed_boundary":null,"failure_mechanism":"none"},{"boundary":"activation_delivery","outcome":"pass","failed_boundary":null,"failure_mechanism":"none"},{"boundary":"first_turn","outcome":"pass","failed_boundary":null,"failure_mechanism":"none"},{"boundary":"tool_discovery","outcome":"pass","failed_boundary":null,"failure_mechanism":"none"},{"boundary":"tool_input","outcome":"pass","failed_boundary":null,"failure_mechanism":"none"},{"boundary":"tool_output","outcome":"pass","failed_boundary":null,"failure_mechanism":"none"},{"boundary":"run_control","outcome":"pass","failed_boundary":null,"failure_mechanism":"none"},{"boundary":"lineage_publication","outcome":"pass","failed_boundary":null,"failure_mechanism":"none"},{"boundary":"result_return","outcome":"pass","failed_boundary":null,"failure_mechanism":"none"}],"failed_boundary":null,"failure_mechanism":"none"}
hermes-first-turn-synthetic: ids-hashes={"candidate_sha":"1b899d813cc021ff16442fc75688aad3e39f7e40","packaged_at":"2026-08-14T09:38:24.575Z","hypothesis":"49e2f537-4a3b-48d7-9dbd-7caf178126ec","question":"Does the packaged deterministic fixture preserve the declared bounded edge signal?","dataset":"dataset:9361d0c3434f1e1f02b5e5729d441587986b120d12757d2486c1c2a4d75fd47f","dataset_artifact":{"id":"9361d0c3434f1e1f02b5e5729d441587986b120d12757d2486c1c2a4d75fd47f","content_hash":"9361d0c3434f1e1f02b5e5729d441587986b120d12757d2486c1c2a4d75fd47f","kind":"result_set"},"run":"run-a4083184-605e-4c3c-be52-f6e00c81b03b","result_artifact":{"id":"cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16","content_hash":"cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16","kind":"result_set"},"worker_result_artifact":{"id":"1fd87ac484f3fc2941c74159085f5c5b1b157c4406b3deaf6c6fb799e95a2c94","content_hash":"1fd87ac484f3fc2941c74159085f5c5b1b157c4406b3deaf6c6fb799e95a2c94","kind":"trajectory"},"market_read_trajectory_artifacts":[{"id":"04f1abb4c81f481997458f88e0fdf9de10a7fa2d4e61ff69bb18b22c27afcf43","content_hash":"04f1abb4c81f481997458f88e0fdf9de10a7fa2d4e61ff69bb18b22c27afcf43","kind":"trajectory"}],"evaluation":"27c99a69-b69c-4149-90a3-e6aeb97b8f16","worker_session":"synthetic-worker-1d26739e-9ae3-419c-bd1a-9e1cf543b07c","critic_session":"critic-e0e9385f-7291-44a7-95fe-d1fea4de3c91","report_artifact":{"id":"8c485f3241b99f3f404c939beb3e877db5396b403ea844ebb3c8ca31df054d73","content_hash":"8c485f3241b99f3f404c939beb3e877db5396b403ea844ebb3c8ca31df054d73","kind":"report"}}
hermes-first-turn-synthetic: metrics={"average_clv":"0.111111","clv_count":1,"contract":"qf.metrics.v1","definitions":{"average_clv":"mean of per-row (decimal_odds / closing_decimal_odds - 1), each rounded half-up to 6 decimals; missing close and void rows excluded","hit_rate":"wins / (wins + losses); push and void rows excluded","missing_settlement":"selected rows without settlement are counted and excluded","roi":"net profit / stake across win, loss, and push rows; void rows excluded"},"excluded_count":0,"hit_rate":"1.000000","losses":0,"net_profit":"100.000000","pushes":0,"roi":"1.000000","scale":6,"selected_count":1,"settled_count":1,"total_stake":"100.000000","version":1,"voids":0,"wins":1} as_of=2026-08-09T12:00:00.000Z report_evaluation_id=27c99a69-b69c-4149-90a3-e6aeb97b8f16
hermes-first-turn-synthetic: l4_candidate_ready=true l4_certified=false live_turn_count=0 retry_count=0
hermes-first-turn-synthetic: PASS
PASS  hermes-first-turn-synthetic
```

The positive ledger is the machine-readable boundary ledger emitted by the
gate. It records all ten boundaries, candidate identity, packaged timestamp,
orchestrator/PTY/worker/critic sessions, durable Dataset/result/worker/read
trajectory/Report artifacts with ids and content hashes, and top-level
`failed_boundary`/`failure_mechanism`.

## Falsification receipts

```text
windows-hermes-research: FALSIFY RED future Dataset after as_of refused; FALSIFY GREEN no downstream objects
hermes-first-turn-synthetic: FALSIFY RED multi-run/multi-worker swapped first trajectory rejected; FALSIFY GREEN exact-run evidence restored={"first_run":"run-a4083184-605e-4c3c-be52-f6e00c81b03b","first_worker":"synthetic-worker-1d26739e-9ae3-419c-bd1a-9e1cf543b07c","second_run":"run-e946db30-4086-4c5d-ab7e-08274e3f8863","second_worker":"synthetic-worker-e4d304a0-d264-4c1f-b858-4573d1356c75"}
hermes-first-turn-synthetic: FALSIFY RED missing_report rejected=KernelError: publish_artifact report requires an Evaluation with verdict supports
hermes-first-turn-synthetic: FALSIFY RED rejects_evaluation rejected=status=rejected
hermes-first-turn-synthetic: FALSIFY RED changed_repeat rejected=KernelError: claimed deterministic repeat input manifest differs
hermes-first-turn-synthetic: FALSIFY GREEN missing Evaluation, rejects Evaluation, and changed replay restored to accepted positive-control boundaries
hermes-first-turn-synthetic: FALSIFY RED boundary=dock_admission failed_boundary=dock_admission failure_mechanism=admission_rejected
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_dock_admission failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=launch_readiness failed_boundary=launch_readiness failure_mechanism=readiness_missing
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_launch_readiness failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=activation_delivery failed_boundary=activation_delivery failure_mechanism=activation_missing
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_activation_delivery failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=first_turn failed_boundary=first_turn failure_mechanism=turn_incomplete
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_first_turn failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=tool_discovery failed_boundary=tool_discovery failure_mechanism=tool_discovery_missing
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_tool_discovery failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=tool_input failed_boundary=tool_input failure_mechanism=tool_schema_ambiguity
hermes-first-turn-synthetic: Gateway falsifier gateway_tool_input_rejected=qf_market_event_get_MCP_call_failed:_qf_market_event_get_requires_id
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_tool_input failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=tool_output failed_boundary=tool_output failure_mechanism=gate2_rejected
hermes-first-turn-synthetic: Gateway falsifier gateway_tool_output_rejected=send_result_MCP_call_failed:_cited_market_id_does_not_exist:_market:missing-boundary-falsifier
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_tool_output failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=run_control failed_boundary=run_control failure_mechanism=run_control_failed
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_run_control failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=lineage_publication failed_boundary=lineage_publication failure_mechanism=lineage_rejected
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_lineage_publication failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=result_return failed_boundary=result_return failure_mechanism=result_return_missing
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_result_return failed_boundary=null failure_mechanism=none
```

The tool-input and tool-output reds are produced by calls through the actual
packaged ontology/collaboration Gateway bridges. The rejected calls are,
respectively, `qf_market_event_get` with a missing id and `send_result` with a
nonexistent cited market id; the valid calls are then restored and the positive
control returns green. The future-Dataset falsifier preflights the time fence
before writing, and verifies no downstream Hypothesis, Run, Metrics,
Artifact, Evaluation, Report, or links remain.

## Builder acceptance exits

```text
bun qa/run.ts repo-shape                         exit 0
bun qa/run.ts lockfile-committed                 exit 0
bun qa/run.ts kernel-sole-writer                 exit 0
bun qa/run.ts no-canvas-domain-writes            exit 0
bun qa/run.ts kernel-sole-writer-app             exit 0
bun qa/run.ts kernel-one-path                    exit 0
bun qa/run.ts one-skin                            exit 0
bun qa/run.ts kernel                              exit 0
bun qa/run.ts typecheck                           exit 0
bun qa/run.ts kernel-market-lineage               exit 0
bun qa/run.ts hermes-first-turn-synthetic         exit 0
bun qa/run.ts doc-links                           exit 0
git diff --check                                  exit 0
git diff --check origin/wo-r9-research-integrity...HEAD exit 0
```

The final synthetic command ended with the exact receipt:

```text
hermes-first-turn-synthetic: failed_boundary=null repair=none failure_mechanism=none
hermes-first-turn-synthetic: PASS
PASS  hermes-first-turn-synthetic
```

Founder-state, installed-chain, and release-verifier gates are verifier-run
scope and were not performed by this Builder. No founder credentials were
touched. `founder_acceptance: not performed` and `l4_certified: pending` remain
the required state; there are no remaining WO-V2-2 Builder acceptance reds.

## Independent verifier — Round 2 post-rework result: FAIL

Verifier worktree: `C:\tmp\qf-v22-verifier-r2-20260814-1b899`

Tested product candidate: `1b899d813cc021ff16442fc75688aad3e39f7e40`

Builder evidence HEAD inspected: `e1b9c9b420bab6893ebb5b8feb083fb19f22fd24`

The verifier fetched `origin`, created a brand-new clean detached worktree at
the exact candidate, and verified the full authorized range from
`origin/wo-r9-research-integrity` through the candidate, including the
approved proposal ancestor `45a916f`. No product code, `NEXT.md`, founder
acceptance, credentials, live model turn, or live market was touched.

### Cold command receipts

```text
bun qa/run.ts repo-shape                         exit 0
bun qa/run.ts lockfile-committed                 exit 0
bun qa/run.ts kernel-sole-writer                 exit 0
bun qa/run.ts no-canvas-domain-writes            exit 0
bun qa/run.ts kernel-sole-writer-app             exit 0
bun qa/run.ts kernel-one-path                    exit 0
bun qa/run.ts one-skin                            exit 0
bun qa/run.ts kernel                              exit 0
bun qa/run.ts typecheck                           exit 0
bun qa/run.ts kernel-market-lineage               exit 0
bun qa/run.ts hermes-launch-policy                exit 0
bun qa/run.ts hermes-founder-state                exit 0
git diff --check origin/wo-r9-research-integrity...HEAD exit 0
git diff --check                                  exit 0
node --check collab-electron/cli/qf-hermes-synthetic-responder.mjs exit 0
bun qa/verify-release.ts                          exit 0
bun qa/run.ts windows-installer                   exit 0
bun qa/run.ts windows-hermes-research-chain      exit 0
```

`bun qa/run.ts hermes-first-turn-synthetic` was rerun with a longer bounded
verifier budget and exited `1`. Its positive packaged chain completed, then
the boundary falsifier failed at the intentionally suppressed
`launch_readiness` case:

```text
hermes-first-turn-synthetic: FAIL EBUSY: resource busy or locked, rm 'C:\Users\rybow\AppData\Local\Temp\qf-boundary-red-launch_readiness-oBGmzK'
```

The exact defect is at `qa/gates/hermes-research.ts:515,544-549`: if
`launch(...)` throws before returning, `red` remains `null`, so the `finally`
block does not call the owned-process shutdown and attempts to remove a still
busy test root. Expected exit is `0` after all ten boundary red/green pairs;
actual exit is `1`, so the remaining eight boundary falsifiers do not have an
independent completion receipt. Scope is the verifier acceptance gate and
rework blocker, not a product-code repair performed by this verifier.

### Independent packaged receipts before the blocker

The positive synthetic run bound package identity to candidate
`1b899d813cc021ff16442fc75688aad3e39f7e40`, emitted a single machine-readable
ledger with all ten boundaries `pass`, and recorded
`failed_boundary=null`, `failure_mechanism=none`. It also completed the
multi-run/multi-worker exact-Run evidence check and the actual packaged
Gateway Gate 1/Gate 2, Evaluation/Report, and changed deterministic-input
falsifiers before the boundary loop reached the cleanup failure.

The installed-chain identity was:

```text
windows-hermes-research: installed-identity commitSha=1b899d813cc021ff16442fc75688aad3e39f7e40 authenticode=NotSigned
windows-hermes-research-chain: future-Dataset refusal=red; downstream=none; restored=green
windows-hermes-research-chain: founder_state_unchanged=true founder_acceptance=not_performed
windows-hermes-research-chain: l4_candidate_ready=true l4_certified=false live_turn_count=0 retry_count=0
windows-hermes-research: process-shutdown remainingGateOwnedProcesses=0
```

Installed-chain research receipts were:

```text
hypothesis=c6cdb60f-7c4c-401b-b8c6-050aec40d967
dataset=dataset:9361d0c3434f1e1f02b5e5729d441587986b120d12757d2486c1c2a4d75fd47f
dataset_artifact=9361d0c3434f1e1f02b5e5729d441587986b120d12757d2486c1c2a4d75fd47f
run=run-89526045-cdb2-4c6f-a3fa-e2d51a811ca2
result_artifact=cba126f77ef6bf9bc099639dc2b91ee339341e1fba88ccdb511b41327f394a16
worker_result_artifact=4c412a2220eed6a046246effabaef7441197e129f1b8efc45b0b051b8cded82e
market_read_trajectory=91778062d543370c147876b2b7d3970744d9abebbd12dd1d8fb84b7fc412bfcf
evaluation=aa6bfa23-36fa-4f57-8e10-f6245db6ec0a
critic_session=critic-01e7cc1c-23e2-41cf-987f-6951716dd3b1
report_artifact=1f0b3e1436f9cd25a61bfbf0b141cb3b39cf53a3e821f7fb2968120e5eddeeea
```

### Round 1 finding retest

1. Founder-state nonce/toolset path: **PASS**, exact gate exit `0`; founder
   config/auth digests remained unchanged.
2. Three-dot range diff check: **PASS**, exact command exit `0`.
3. Production falsifiers: **FAIL**, exact synthetic command exit `1` at
   launch-readiness cleanup; see the exact file/line and `EBUSY` receipt above.
4. Single machine-readable ledger: **PASS in the completed positive portion**;
   candidate/package/session/artifact/hash fields and ten green entries were
   present before the suite blocker.
5. Future Dataset: **PASS**, installed-chain exit `0`; zero downstream
   Hypothesis/Run/Evaluation/Artifact/links, with Metrics represented in Run
   and Report represented as an Artifact in this Kernel schema.
6. Critic/Report: **PASS**, installed-chain exit `0`; exact generated reads,
   independent sessions, Evaluation, metrics, and durable trajectory/report
   hashes were checked.
7. Exact multi-run Report selection: **PASS in the completed portion**; the
   synthetic receipt showed distinct Run/worker identities and exact-run
   evidence restoration before the suite blocker.

### Final state

```text
founder_acceptance=not_performed
l4_certified=pending
live_turn_count=0
retry_count=0
NEXT.md=unchanged
V2-3/R14+ implementation=not begun
remaining_red=hermes-first-turn-synthetic exit 1 at launch-readiness falsifier cleanup
verifier_result=FAIL; order stopped for rewrite; no third lap authorized
```

## Rewrite builder run — final candidate

Plain language: the harness now cleans up the processes and temporary folders it creates, reports deliberate failures separately, and leaves no registered test root behind.

Branch: `wo-V2-2`
Candidate SHA: `ddc95853aef4645d6c9e1bfb5d452f4a156aca83`
Captured package identity SHA from the final builder run: `3018c4334f88072af8bf14592571f7b88e7d506b`
Founder acceptance: `not performed`
L4 certification: `pending`
Live model turns: `0`
Live market data: `0`
Scope check: only `qa/gates/hermes-research.ts` and this evidence file changed; `NEXT.md` was not edited; V2-3 was not started.

### Builder acceptance exits

```text
PASS  repo-shape
PASS  lockfile-committed
PASS  kernel-sole-writer
no-canvas-domain-writes OK
PASS  no-canvas-domain-writes
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app
kernel-one-path G1: PASS (no illicit env reads or kernel.db literals)
kernel-one-path G2/G3: PASS
kernel-one-world G4 PASS
PASS  kernel-one-path
one-skin OK
totals: hex=0 func-color=0 raw-font-family=0 (outside collab-electron/src/windows/shared/qf-tokens.css)
PASS  one-skin
PASS  kernel
kernel-market-lineage: FALSIFY RED empty lineage
kernel-market-lineage: FALSIFY RED fabricated cite
kernel-market-lineage: PASS
PASS  kernel-market-lineage
doc-links: PASS (53 live documents, every pointer resolves)
doc-links: PASS
PASS  typecheck
git diff --check: exit 0
```

Commands and exits:

```text
bun qa/run.ts repo-shape                         exit 0
bun qa/run.ts lockfile-committed                 exit 0
bun qa/run.ts kernel-sole-writer                 exit 0
bun qa/run.ts no-canvas-domain-writes            exit 0
bun qa/run.ts kernel-sole-writer-app             exit 0
bun qa/run.ts kernel-one-path                    exit 0
bun qa/run.ts one-skin                           exit 0
bun qa/run.ts kernel                             exit 0
bun qa/run.ts typecheck                          exit 0
bun qa/run.ts kernel-market-lineage              exit 0
bun qa/run.ts hermes-first-turn-synthetic        exit 0
bun qa/run.ts doc-links                          exit 0
git diff --check                                  exit 0
```

### Final positive-control receipts

```text
hermes-first-turn-synthetic: package-identity={"commitSha":"3018c4334f88072af8bf14592571f7b88e7d506b","packagedAt":"2026-08-15T03:00:48.437Z"}
hermes-first-turn-synthetic: dock_admission=pass
hermes-first-turn-synthetic: launch_readiness=pass
hermes-first-turn-synthetic: l4_candidate_ready=true l4_certified=false live_turn_count=0 retry_count=0
hermes-first-turn-synthetic: failed_boundary=null repair=none failure_mechanism=none
hermes-first-turn-synthetic: PASS
PASS  hermes-first-turn-synthetic
```

The positive machine ledger emitted the exact ten ordered labels
`dock_admission`, `launch_readiness`, `activation_delivery`, `first_turn`,
`tool_discovery`, `tool_input`, `tool_output`, `run_control`,
`lineage_publication`, and `result_return`, all with `outcome=pass`,
`failed_boundary=null`, and `failure_mechanism=none`. It carried the candidate
SHA, packaged timestamp, orchestrator/PTY/worker/critic identities, Dataset,
deterministic result, worker trajectory, market-read trajectory, and Report
artifact IDs/content hashes.

### Ten boundary red/green pairs

```text
hermes-first-turn-synthetic: FALSIFY RED boundary=dock_admission failed_boundary=dock_admission failure_mechanism=admission_rejected
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_dock_admission failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=launch_readiness failed_boundary=launch_readiness failure_mechanism=readiness_missing
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_launch_readiness failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=activation_delivery failed_boundary=activation_delivery failure_mechanism=activation_missing
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_activation_delivery failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=first_turn failed_boundary=first_turn failure_mechanism=turn_incomplete
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_first_turn failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=tool_discovery failed_boundary=tool_discovery failure_mechanism=tool_discovery_missing
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_tool_discovery failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=tool_input failed_boundary=tool_input failure_mechanism=tool_schema_ambiguity
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_tool_input failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=tool_output failed_boundary=tool_output failure_mechanism=gate2_rejected
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_tool_output failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=run_control failed_boundary=run_control failure_mechanism=run_control_failed
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_run_control failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=lineage_publication failed_boundary=lineage_publication failure_mechanism=lineage_rejected
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_lineage_publication failed_boundary=null failure_mechanism=none
hermes-first-turn-synthetic: FALSIFY RED boundary=result_return failed_boundary=result_return failure_mechanism=result_return_missing
hermes-first-turn-synthetic: FALSIFY GREEN repair=restore_result_return failed_boundary=null failure_mechanism=none
```

### Rewrite falsification receipts

```text
hermes-first-turn-synthetic: FALSIFY RED launch-failure remaining_pids=[42001,42002] cleanup_errors=[] reason=launch-failure retained PIDs: [42001,42002]
hermes-first-turn-synthetic: FALSIFY RED launch-failure receipt-validator cleanup_errors=corrupted reason=launch-failure cleanup_errors is not an array
hermes-first-turn-synthetic: FALSIFY GREEN launch-failure remaining_pids=[] cleanup_errors=[]
hermes-first-turn-synthetic: launch-failure remaining_pids=[]
cleanup_errors=[]

hermes-first-turn-synthetic: cleanup-leak path=C:\Users\rybow\AppData\Local\Temp\qf-retry-red-EBUSY code=EBUSY attempts=1
hermes-first-turn-synthetic: FALSIFY RED retry-code=EBUSY attempts=1 reason=retry suppression for EBUSY did not go red at the second call (attempts=1)
hermes-first-turn-synthetic: temp-cleanup-retry path=C:\Users\rybow\AppData\Local\Temp\qf-retry-green-EBUSY code=EBUSY attempts=2
hermes-first-turn-synthetic: FALSIFY GREEN retry-code=EBUSY attempts=2 receipt_required=true
hermes-first-turn-synthetic: cleanup-leak path=C:\Users\rybow\AppData\Local\Temp\qf-retry-red-EPERM code=EPERM attempts=1
hermes-first-turn-synthetic: FALSIFY RED retry-code=EPERM attempts=1 reason=retry suppression for EPERM did not go red at the second call (attempts=1)
hermes-first-turn-synthetic: temp-cleanup-retry path=C:\Users\rybow\AppData\Local\Temp\qf-retry-green-EPERM code=EPERM attempts=2
hermes-first-turn-synthetic: FALSIFY GREEN retry-code=EPERM attempts=2 receipt_required=true
hermes-first-turn-synthetic: cleanup-leak path=C:\Users\rybow\AppData\Local\Temp\qf-retry-red-ENOTEMPTY code=ENOTEMPTY attempts=1
hermes-first-turn-synthetic: FALSIFY RED retry-code=ENOTEMPTY attempts=1 reason=retry suppression for ENOTEMPTY did not go red at the second call (attempts=1)
hermes-first-turn-synthetic: temp-cleanup-retry path=C:\Users\rybow\AppData\Local\Temp\qf-retry-green-ENOTEMPTY code=ENOTEMPTY attempts=2
hermes-first-turn-synthetic: FALSIFY GREEN retry-code=ENOTEMPTY attempts=2 receipt_required=true
hermes-first-turn-synthetic: cleanup-leak path=C:\Users\rybow\AppData\Local\Temp\qf-retry-red-EMFILE code=EMFILE attempts=1
hermes-first-turn-synthetic: FALSIFY RED retry-code=EMFILE attempts=1 reason=retry suppression for EMFILE did not go red at the second call (attempts=1)
hermes-first-turn-synthetic: temp-cleanup-retry path=C:\Users\rybow\AppData\Local\Temp\qf-retry-green-EMFILE code=EMFILE attempts=2
hermes-first-turn-synthetic: FALSIFY GREEN retry-code=EMFILE attempts=2 receipt_required=true
hermes-first-turn-synthetic: cleanup-leak path=C:\Users\rybow\AppData\Local\Temp\qf-retry-red-ENFILE code=ENFILE attempts=1
hermes-first-turn-synthetic: FALSIFY RED retry-code=ENFILE attempts=1 reason=retry suppression for ENFILE did not go red at the second call (attempts=1)
hermes-first-turn-synthetic: temp-cleanup-retry path=C:\Users\rybow\AppData\Local\Temp\qf-retry-green-ENFILE code=ENFILE attempts=2
hermes-first-turn-synthetic: FALSIFY GREEN retry-code=ENFILE attempts=2 receipt_required=true

hermes-first-turn-synthetic: FALSIFY RED static-rm-routing reason=direct gate-root rmSync call remains outside the removal helper (1)
hermes-first-turn-synthetic: FALSIFY GREEN static-rm-routing helper-only=true
hermes-first-turn-synthetic: FALSIFY RED tool_output failed_boundary=tool_output failure_mechanism=gate2_rejected error=failed_boundary=tool_output failure_mechanism=gate2_rejected
hermes-first-turn-synthetic: cleanup-leak path=C:\Users\rybow\AppData\Local\Temp\qf-boundary-falsifier-tool-output code=EBUSY attempts=9
hermes-first-turn-synthetic: FALSIFY GREEN cleanup-preserved-original=failed_boundary=tool_output failure_mechanism=gate2_rejected
hermes-first-turn-synthetic: temp-cleanup roots_created=1 roots_remaining=1 leaked=["C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-boundary-falsifier-held"]
hermes-first-turn-synthetic: FALSIFY RED roots_remaining=1 leaked=["C:\\Users\\rybow\\AppData\\Local\\Temp\\qf-boundary-falsifier-held"] reason=deliberately retained registered root unexpectedly passed cleanup assertion
hermes-first-turn-synthetic: FALSIFY GREEN preexisting=14 roots_remaining=0 leaked=[]
hermes-first-turn-synthetic: FALSIFY RED static-mkdtemp-routing reason=gate-owned mkdtempSync calls must route through one creation helper (2)
hermes-first-turn-synthetic: FALSIFY GREEN static-mkdtemp-routing helper-only=true
hermes-first-turn-synthetic: FALSIFY RED half-born-seat receipt-validator reason=half-born-seat self_exit=true retained live PIDs
hermes-first-turn-synthetic: FALSIFY GREEN half-born-seat receipt-validator self_exit=true pids=[]
```

Observed half-born receipt:

```text
hermes-first-turn-synthetic: half-born-seat self_exit=false elapsed_ms=20000 pids=[3016,24792,25356,26420,26636,27064,29380,30312,30496,33356,33484]
```

Final cleanup receipt:

```text
hermes-first-turn-synthetic: temp-cleanup roots_created=22 roots_remaining=0 retried=0 preexisting=12 leaked=[]
```

The builder did not perform the verifier-only cold `verify-release.ts`,
installed `windows-hermes-research-chain`, or founder acceptance. The second
gate's terminal cleanup receipt remains verifier evidence, not builder
evidence.

### Rewrite final state

```text
founder_acceptance=not_performed
l4_certified=pending
live_turn_count=0
retry_count=0
NEXT.md=unchanged
V2-3/R14+ implementation=not begun
remaining_red=none in builder-run acceptance
builder_result=PASS
verifier_result=pending
```

## R13 independent verifier final failure — 2026-08-14

role: independent verifier; builder reasoning not used
candidate_under_test: `f9e65574030ee66ecdacbe4dbb83dc02ad6cbfb8`
implementation_candidate: `ddc95853aef4645d6c9e1bfb5d452f4a156aca83`
exact_detached_worktree: `C:\tmp\qf-v22-verifier-20260814-independent`
builder_evidence_sha256_before_verifier_record: `0BE4F3D766E488086BCE227FEE8B4508C3BD681B36B5E718208677C99084BD76`
founder_acceptance: not performed
l4_certified: pending

Result: **FAIL — final R13 stop for founder decision.** In plain terms, the
fresh proof started its first full synthetic replay but did not finish, so the
required ten-breaker proof and the required second immediate replay do not
exist as receipts.

### Cold verifier command exits

The following exact commands completed with exit `0` before the stop:

```text
bun qa/run.ts repo-shape                         exit 0
bun qa/run.ts lockfile-committed                 exit 0
bun qa/run.ts kernel-sole-writer                 exit 0
bun qa/run.ts no-canvas-domain-writes            exit 0
bun qa/run.ts kernel-sole-writer-app             exit 0
bun qa/run.ts kernel-one-path                    exit 0
bun qa/run.ts one-skin                           exit 0
bun qa/run.ts kernel                            exit 0
bun qa/run.ts typecheck                          exit 0
bun qa/run.ts kernel-market-lineage              exit 0
bun qa/run.ts hermes-launch-policy               exit 0
bun qa/run.ts hermes-founder-state               exit 0  (exact retry after a batch-wrapper timeout)
```

The first batch wrapper timed out at shell exit `124` while the founder-state
command was still in WSL startup; it did not produce a Bun exit. The exact
founder-state command was then rerun unchanged and completed with exit `0`,
printing both scratch mutation falsifier receipts, unchanged real founder
digests, and `hermes-founder-state: PASS`.

### Mandatory rewrite-lap result

One PowerShell invocation opened the durable run-1 stdout/stderr files before
starting run 1, invoked the exact synthetic command, and then was required to
invoke run 2 immediately. The wrapper timed out after `604027 ms` with shell
exit `124` before run 1 returned. Therefore:

```text
bun qa/run.ts hermes-first-turn-synthetic run 1: Bun exit not recorded; wrapper timeout
bun qa/run.ts hermes-first-turn-synthetic run 2: not started
synthetic exit receipt: absent
```

The complete durable run-1 stdout contains only one boundary red/green pair:
`dock_admission` (`admission_rejected` then restored). It also contains
`launch-failure remaining_pids=[]` and `cleanup_errors=[]`. It contains no
terminal `temp-cleanup` receipt, no half-born-seat receipt, and no remaining
boundary pairs. The run-2 stdout/stderr files and the combined exit receipt do
not exist because run 2 was never invoked. This is an incomplete ten-red /
ten-green ledger and a missing required second receipt, regardless of the
partial positive output.

Per the no-rework rule, these exact later commands were not run after the
synthetic stop: `bun qa/verify-release.ts`, `bun qa/run.ts windows-installer`,
`bun qa/run.ts windows-hermes-research-chain`, `bun qa/run.ts doc-links`,
`git diff --check origin/wo-r9-research-integrity...HEAD`, and
`git diff --check`.

### Independent scope inspection

The rewrite tree from `3018c4334f88072af8bf14592571f7b88e7d506b` through this
candidate contains exactly these two files:

```text
M docs/orders/evidence/r13/V2-2-VERIFICATION.md
M qa/gates/hermes-research.ts
```

The protected-path diff for `collab-electron/`, `packages/`, `species/`, and
`docs/orders/NEXT.md` is empty. The ten `BOUNDARIES` labels, the `MECHANISMS`
failure vocabulary, and the existing ledger fields/mapping are unchanged;
the implementation diff adds cleanup/receipt enforcement and ledger
validation but does not add a boundary, rename a label, or alter the ledger
contract. No V2-3 work or founder acceptance was performed.

### Durable verifier logs

All files below are outside the detached worktree and were written during the
run:

```text
manifest: C:\tmp\qf-v22-verifier-logs-20260814-independent\acceptance-exits.tsv
manifest_sha256: E7427FC34B304805A5500408BDCDA384FB3BDD2AECF39077B678A32A30C16CF3
run1_stdout: C:\tmp\qf-v22-verifier-logs-20260814-independent\hermes-first-turn-synthetic-run1.stdout.log
run1_stdout_sha256: 4D117ADBBD051A04BDCEC604C3004E703D04E61A9A520EC18B7073006BB381BD
run1_stderr: C:\tmp\qf-v22-verifier-logs-20260814-independent\hermes-first-turn-synthetic-run1.stderr.log
run1_stderr_sha256: B86790BD5A1E29B1647BE406BB4EED06A9C624C9E10167E6D6D23F83A8DA8EFA
founder_state_retry: C:\tmp\qf-v22-verifier-logs-20260814-independent\hermes-founder-state-retry.log
founder_state_retry_sha256: 79999BE183658715507C4A32A892F1325249077D7352F1ED83D353089A67051C
```

The detached worktree was clean at the time of this append; only this
docs-only failure record is being added now. No product or gate repair was
made.

## R13 independent verifier authorization rerun — tooling stop — 2026-08-14

role: brand-new independent verifier; builder reasoning not used
candidate_under_test: `83bcfc590bb56a853cc21e16a2f58efe96723f99`
implementation_candidate: `ddc95853aef4645d6c9e1bfb5d452f4a156aca83`
exact_detached_worktree: `C:\tmp\qf-v22-rerun-20260814-083b`
external_log_directory: `C:\tmp\qf-v22-rerun-logs-20260814-083b`
helper: `C:\tmp\qf-v22-rerun-helper-20260814-083b.ps1`
helper_pid: `33588`
founder_acceptance: not performed
l4_certified: pending

Result: **STOP — tooling defect; no verifier PASS/FAIL receipt.** In plain
terms, the first static check passed, but the helper could not save its
required durable manifest, so no synthetic proof or later release gate may be
treated as verified and this authorized attempt is not repeated.

### Helper receipt

The hidden helper opened the first command's stdout and stderr before launch.
`bun qa/run.ts repo-shape` printed `PASS  repo-shape` and exited `0`, but while
persisting that record the helper raised:

```text
Exception calling "Replace" with "3" argument(s): "The path is not of a legal form."
```

The helper atomically wrote a STOP completion receipt and ended without being
killed or restarted. The immediate synthetic pair was never reached, so the
required two synthetic runs, their ten red/green boundary pairs, half-born-seat
receipt, terminal cleanup receipts, and every later verifier command are
missing. This is recorded as a tooling defect, not as a verifier PASS or a
product red.

```text
completion: C:\tmp\qf-v22-rerun-logs-20260814-083b\completion-receipt.json
completion_sha256: 4F1F6D2609543C1B443F618CED70DB8823268E14C3BB7F2FA402D53A6249D64F
completion_status: STOP
completion_reason: helper exception during manifest atomic replacement
durable_manifest: C:\tmp\qf-v22-rerun-logs-20260814-083b\acceptance-manifest.json
durable_manifest_sha256: 4F53CDA18C2BAA0C0354BB5F9A3ECBE5ED12AB4D8E11BA873C2F11161202B945
durable_manifest_contents: []
provisional_manifest_tmp: C:\tmp\qf-v22-rerun-logs-20260814-083b\acceptance-manifest.json.tmp
helper_sha256: 6E3D69A0DEE9790AA348E3CD1E6EE9D801A03ACB308C894DE50227F1BBDE7E52
first_stdout: C:\tmp\qf-v22-rerun-logs-20260814-083b\001-repo-shape.stdout.log
first_stdout_sha256: F50D2185A6F23E43A540E46399A37D22D69E13288D42CAE16A5D711682205E0A
first_stderr: C:\tmp\qf-v22-rerun-logs-20260814-083b\001-repo-shape.stderr.log
first_stderr_sha256: E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855
recorded_command: `bun qa/run.ts repo-shape`
recorded_command_exit: `0` (provisional record only; not in durable manifest)
synthetic_run_1: not started
synthetic_run_2: not started
later_matrix_commands: not started
```

No matrix command was run after the helper stop. In particular, no install,
reset, manual cleanup, or second verifier attempt was performed.

### Independent scope inspection

The read-only diff from baseline `3018c4334f88072af8bf14592571f7b88e7d506b`
through the tested HEAD returned exactly:

```text
M docs/orders/evidence/r13/V2-2-VERIFICATION.md
M qa/gates/hermes-research.ts
```

The protected-path diff for `collab-electron/`, `packages/`, `species/`, and
`docs/orders/NEXT.md` was empty. The ten `BOUNDARIES` labels and their
`MECHANISM_FOR` mapping matched baseline exactly (normalized block SHA-256
`480b0a4d69958fc0834f3011ffa57b6feb37f4c1588432f36a1f5c8d1b59af55` at both
baseline and HEAD). The `BoundaryLedger` field contract also matched exactly
(normalized type SHA-256
`1155b3bea3e0effd7c7a233148142e0a68129bc960d24852ccaef1ee7eda3796` at both
baseline and HEAD). No product code, `NEXT.md`, boundary, or ledger-contract
drift was observed.

The detached worktree remained clean at the stop. No founder acceptance, live
model turn, live market quota, or V2-3 work was performed. Per the exact
authorization, this tooling stop is final for the rerun.
