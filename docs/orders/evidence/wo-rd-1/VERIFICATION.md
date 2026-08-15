# WO-RD-1 verification

status: PASS
verified-at: 2026-08-15
candidate-sha: 5a9a5cea6186b05a4eea5c38f5b8a597a8d02bbf
candidate-branch: wo-V2-3
candidate-upstream: origin/wo-V2-3

## In plain terms

Ryan can submit one bounded research question through the Research Director,
and the verified path records that question, opens the exact Director session,
and shows its live canvas tile; if this were wrong, the question could
disappear or open the wrong worker without showing what happened.

## Immutable candidate checks

Before the matrix:

~~~text
preflight_head=5a9a5cea6186b05a4eea5c38f5b8a597a8d02bbf
preflight_branch=wo-V2-3
preflight_upstream=origin/wo-V2-3
preflight_status=clean
preflight_gate=GREEN
~~~

After the matrix:

~~~text
post_matrix_head=5a9a5cea6186b05a4eea5c38f5b8a597a8d02bbf
post_matrix_branch=wo-V2-3
post_matrix_upstream=origin/wo-V2-3
post_matrix_status=clean
post_matrix_candidate_integrity=GREEN
~~~

## Acceptance matrix

The first command ran with collab-electron as its working directory. Durations
are the observed command wall durations; every command was invoked once, in
the listed order, and exited 0.

| # | Command | Duration | Exit |
|---:|---|---:|---:|
| 1 | bun test src/main/mission-activation.test.ts src/main/dock-profiles.test.ts src/windows/shell/src/dock.test.ts src/windows/shell/src/tile-renderer.test.ts | 0.7413872 s | 0 |
| 2 | bun test qa/gates/research-director-front-door.test.ts | 0.5716158 s | 0 |
| 3 | bun qa/run.ts research-director-front-door | 21.3947664 s | 0 |
| 4 | bun qa/run.ts repo-shape | 0.5332616 s | 0 |
| 5 | bun qa/run.ts kernel-sole-writer | 0.7687979 s | 0 |
| 6 | bun qa/run.ts kernel-sole-writer-app | 0.4835854 s | 0 |
| 7 | bun qa/run.ts one-skin | 0.5398435 s | 0 |
| 8 | bun qa/run.ts doc-links | 0.640064 s | 0 |
| 9 | git diff --check | 0.4249086 s | 0 |

Focused unit-gate receipt:

~~~text
bun test v1.3.12 (700fc117)
qa\gates\research-director-front-door.test.ts:
(pass) front-door boundary and cleanup receipts are falsifiable
(pass) timeout phase and unique-session mappings are deterministic
(pass) timeout classification uses the required five-class precedence
(pass) the production timeout emitter is redacted, exact-key, once-only, and before cleanup
(pass) a missing boundary emits nothing, and after-cleanup emission is rejected by ordering
(pass) outer watchdog emission remains once-only while the watched task settles later [78.00ms]
(pass) watchdog returns red without awaiting never-settling cleanup [47.00ms]
(pass) Director lifecycle holds the production branch until PTY release and removes listeners
QF_SYNTHETIC boundary=activation_delivery role=undefined mission_id=mission-production-lifecycle
(pass) the production Director branch uses the lifecycle handshake and has no fixed dwell

 9 pass
 0 fail
 109 expect() calls
Ran 9 tests across 1 file. [200.00ms]
~~~

Focused live-gate receipt:

~~~text
falsifier=old-orchestrator-id result=red
falsifier=generic-orchestrator-prompt result=red
falsifier=ui-boundary-or-auto-tile-shortcut result=red
falsifier=cleanup-retained-process-or-root result=red
falsifier=cleanup-retained-process-or-root restored=true
falsifier=watchdog-never-settles result=red
tile_projection_hops=sent,received,dom_identity handler_threw=false
production_manifest_director=hermes-research-director exact=true
production_manifest_old_orchestrator_entries=0
default_ipc_definition=hermes-research-director
default_rpc_definition=hermes-research-director
qa_override_preserved=true explicit_override_preserved=true
front_door=Research Director
renderer_form_submit=1 preload_ipc=qf:research:submitQuestion main_ipc=qf:research:submitQuestion
kernel_command=create_mission
mission_rows_added=1 hypothesis_rows_added=1
director_definition=hermes-research-director
director_sessions_added=1 spawned_from_exact=1
mission_visible=true director_tile_visible=true manual_dock_composition=0
old_orchestrator_sessions_added=0
oracle=independent_read_only kernel_unchanged_after_oracle=true
convergence_remaining=[]
owned_process_tree_remaining=0 electron_processes_remaining=0 hermes_processes_remaining=0 roots_remaining=0
repository_tree_unchanged=true
elapsed_ms=20947
PASS research-director-front-door
PASS  research-director-front-door
~~~

The remaining receipts were:

~~~text
PASS  repo-shape
PASS  kernel-sole-writer
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app
one-skin OK
totals: hex=0 func-color=0 raw-font-family=0 (outside collab-electron/src/windows/shared/qf-tokens.css)
PASS  one-skin
doc-links: PASS (58 live documents, every pointer resolves)
PASS  doc-links
~~~

## Independent product-path inspection

- The production Hermes manifest has exactly one hermes-research-director
  profile with Research Director, default runtime, the research-director
  prompt, and desk.orchestrate; production validation rejects the retired id,
  duplicate Director, and wrong prompt ref.
- Both existing question handlers default to hermes-research-director while
  retaining QA and explicit-definition overrides. The renderer still submits
  through the existing form and preload method, and the main handler records
  create_mission before native admission.
- The Director activation explicitly forbids recruiting or Task assignment in
  this slice. The synthetic responder emits completion, holds the seat until
  PTY release, and disposes its reader listeners in finally.
- The native tile path emits sent immediately before the main event, received
  on the renderer handler, and DOM identity only after the exact definition and
  non-empty session attributes exist; handler errors are rethrown.
- The focused gate is registered, runs the public dev entrypoint against an
  isolated Kernel, uses a separate read-only oracle with a byte/mtime check,
  proves the one-row Mission/Hypothesis/session/link deltas, and verifies
  cleanup, deadline, and repository invariants. Its falsifiers were observed
  red before the live proof and restored.

No product, test, gate, or candidate file changed during verification. The
only subsequent changes are this evidence, the WO-RD-1 done mark, and the
closed NEXT door.
