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
