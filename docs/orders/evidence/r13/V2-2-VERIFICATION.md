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
