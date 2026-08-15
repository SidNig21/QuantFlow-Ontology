# WO-RD-2 verification

status: PASS
verified-at: 2026-08-15
candidate-sha: 13beba7fb9a24632946b8f50a319f9df161396c1
candidate-branch: wo-V2-3
candidate-upstream: origin/wo-V2-3

## In plain terms

Ryan can submit one Mission to the Research Director, which recruits the exact
production specialist, gives that specialist durable work, and shows the Task,
status, delegator, and exact reason on the canvas without a manual Dock click.

## Immutable candidate checks

Before inspection and the matrix:

~~~text
HEAD_BEFORE=13beba7fb9a24632946b8f50a319f9df161396c1
BRANCH=wo-V2-3
UPSTREAM=origin/wo-V2-3
UPSTREAM_SHA=13beba7fb9a24632946b8f50a319f9df161396c1
UPSTREAM_CONTAINS_CANDIDATE_EXIT=0
TREE_STATUS_BEGIN
TREE_STATUS_END
~~~

After the matrix and before verification-document edits:

~~~text
POST_MATRIX_HEAD=13beba7fb9a24632946b8f50a319f9df161396c1
POST_MATRIX_STATUS_BEGIN
POST_MATRIX_STATUS_END
~~~

## Candidate diff inspected independently

- Director contract and bounded deterministic instrumentation:
  `species/hermes/prompts/research-director.md`,
  `collab-electron/src/main/mission-activation.ts`, its test,
  `collab-electron/cli/qf-hermes-synthetic-responder.mjs`, and
  `collab-electron/src/main/sidecar/server.ts`.
- Kernel-backed Task projection and four separate canvas facts:
  `collab-electron/src/main/task-delegation-projection.ts`, its test,
  `collab-electron/src/windows/shell/src/task-composition.js`, and its test.
- Focused product proof and registration:
  `qa/gates/research-director-delegation.ts`, its test, `qa/run.ts`, and the
  exact read-only SQL allowlist entry in `qa/gates/kernel-sole-writer.ts`.
- Founder-authorized closure correction and recorded legacy debt:
  `qa/gates/team-composition.ts` adds only `Research Director` to the accepted
  production labels, and `docs/DEBT.md` records the stale
  `team-composition-ui` resource-root defect.

No independent scope, identity, writer-boundary, or assertion defect was found
in the candidate diff.

## Acceptance matrix

The first command ran from `collab-electron`; every other command ran from the
repository root. Each command was invoked exactly once in the listed order.
Durations are the verifier's observed command durations.

| # | Command | Duration | Exit |
|---:|---|---:|---:|
| 1 | `bun test src/main/mission-activation.test.ts src/main/task-delegation-projection.test.ts src/main/collaboration-gateway.test.ts src/windows/shell/src/task-composition.test.ts` | 117 ms | 0 |
| 2 | `bun test qa/gates/research-director-delegation.test.ts` | 132 ms | 0 |
| 3 | `bun qa/run.ts research-director-delegation` | 65,806 ms | 0 |
| 4 | `bun qa/run.ts research-director-front-door` | 22,471 ms | 0 |
| 5 | `bun qa/run.ts team-composition` | 434 ms | 0 |
| 6 | `bun qa/run.ts kernel-sole-writer` | 396 ms | 0 |
| 7 | `bun qa/run.ts kernel-sole-writer-app` | 144 ms | 0 |
| 8 | `bun qa/run.ts repo-shape` | 166 ms | 0 |
| 9 | `bun qa/run.ts one-skin` | 125 ms | 0 |
| 10 | `bun qa/run.ts doc-links` | 217 ms | 0 |
| 11 | `bun qa/run.ts rung-ladder` | 102 ms | 0 |
| 12 | `git diff --check` | 61 ms | 0 |
| 13 | `$candidate = '13beba7fb9a24632946b8f50a319f9df161396c1'; git diff --check "$($candidate)^" "$candidate"` | 58 ms | 0 |

### Product-unit receipt

~~~text
bun test v1.3.12 (700fc117)

src\main\collaboration-gateway.test.ts:
(pass) collaboration gateway > peer transport has no persisted task-id mapping column
(pass) collaboration gateway > publishes only dedicated task/result routes and rejects malformed extras
(pass) collaboration gateway > missing task/result grants fail before effects
(pass) collaboration gateway > missing, wrong, cross-seat, and revoked capabilities fail before effects
(pass) collaboration gateway > send_task creates Kernel truth before best-effort notification
(pass) collaboration gateway > oversize task and result payloads fail before Kernel or artifact effects
(pass) collaboration gateway > fabricated, absent, and foreign cite lineage fails before result publication
(pass) collaboration gateway > send_result can report no evidence only from empty market reads
(pass) collaboration gateway > send_result publishes exact lineage, completes Kernel task, and survives bus failure
(pass) collaboration gateway > registered result route reports the founder-visible artifact and worker

src\main\mission-activation.test.ts:
(pass) mission activation is one bounded JSON-safe PTY instruction
(pass) mission activation rejects oversize and invalid ids before bytes exist

src\main\task-delegation-projection.test.ts:
(pass) projectTaskDelegations > projects the complete durable task relationship without a peer bus
(pass) projectTaskDelegations > projects a fresh read of completed durable task rows
(pass) projectTaskDelegations > fails closed when either assignment link is missing or duplicated
(pass) projectTaskAssignments > projects the exact Task presentation fields from Kernel lineage
(pass) projectTaskAssignments > fails closed for missing or malformed delegator lineage
(pass) projectTaskAssignments > fails closed for missing or duplicated assignment links

src\windows\shell\src\task-composition.test.ts:
(pass) Task footer projection > renders four separate Kernel-backed facts for the exact specialist tile
(pass) Task footer projection > hides delegator and reason when the assignment is unavailable

 20 pass
 0 fail
 104 expect() calls
Ran 20 tests across 4 files. [72.00ms]
~~~

### Focused falsifier-test receipt

~~~text
bun test v1.3.12 (700fc117)

qa\gates\research-director-delegation.test.ts:
(pass) Research Director delegation gate owns the 120 second deadline
falsifier=assignment-link-cardinality variant=missing-delegated_by result=red
falsifier=assignment-link-cardinality variant=missing-delegated_by result=green
falsifier=assignment-link-cardinality variant=duplicate-delegated_by result=red
falsifier=assignment-link-cardinality variant=duplicate-delegated_by result=green
falsifier=assignment-link-cardinality variant=missing-assigned_to result=red
falsifier=assignment-link-cardinality variant=missing-assigned_to result=green
falsifier=assignment-link-cardinality variant=duplicate-assigned_to result=red
falsifier=assignment-link-cardinality variant=duplicate-assigned_to result=green
falsifier=renderer-local-reason result=red
falsifier=renderer-local-reason result=green
falsifier=malformed-delegator-lineage variant=missing-spawned_from result=red
falsifier=malformed-delegator-lineage variant=missing-spawned_from result=green
falsifier=malformed-delegator-lineage variant=duplicate-spawned_from result=red
falsifier=malformed-delegator-lineage variant=duplicate-spawned_from result=green
falsifier=malformed-delegator-lineage variant=missing-definition result=red
falsifier=malformed-delegator-lineage variant=missing-definition result=green
falsifier=malformed-delegator-lineage variant=empty-display-name result=red
falsifier=malformed-delegator-lineage variant=empty-display-name result=green
(pass) focused assignment and lineage falsifiers go red and restore green

 2 pass
 0 fail
 2 expect() calls
Ran 2 tests across 1 file. [86.00ms]
~~~

### Exact WO-RD-2 product-gate receipt

~~~text
falsifier=assignment-link-cardinality variant=missing-delegated_by result=red
falsifier=assignment-link-cardinality variant=missing-delegated_by result=green
falsifier=assignment-link-cardinality variant=duplicate-delegated_by result=red
falsifier=assignment-link-cardinality variant=duplicate-delegated_by result=green
falsifier=assignment-link-cardinality variant=missing-assigned_to result=red
falsifier=assignment-link-cardinality variant=missing-assigned_to result=green
falsifier=assignment-link-cardinality variant=duplicate-assigned_to result=red
falsifier=assignment-link-cardinality variant=duplicate-assigned_to result=green
falsifier=renderer-local-reason result=red
falsifier=renderer-local-reason result=green
falsifier=malformed-delegator-lineage variant=missing-spawned_from result=red
falsifier=malformed-delegator-lineage variant=missing-spawned_from result=green
falsifier=malformed-delegator-lineage variant=duplicate-spawned_from result=red
falsifier=malformed-delegator-lineage variant=duplicate-spawned_from result=green
falsifier=malformed-delegator-lineage variant=missing-definition result=red
falsifier=malformed-delegator-lineage variant=missing-definition result=green
falsifier=malformed-delegator-lineage variant=empty-display-name result=red
falsifier=malformed-delegator-lineage variant=empty-display-name result=green
falsifier=old-no-recruit-instruction result=red
falsifier=wrong-worker-definition result=red
director_definition=hermes-research-director director_sessions_added=1
specialist_definition=hermes-worker specialist_sessions_added=1
delegates_to_exact=1 director_to_specialist=true
task_rows_added=1 task_created_open=1
delegated_by_exact=1 assigned_to_exact=1 exact_session_binding=true
mission_objective_equals_task_description=true
director_tile_count=1 specialist_tile_count=1
ui_task_title="Assess the synthetic market coverage for Strategy qf-rd2-v1."
ui_task_status=OPEN
ui_task_delegator=Assigned by Research Director
ui_task_reason="Assess the synthetic market coverage for Strategy qf-rd2-v1."
manual_dock_composition=0 old_orchestrator_sessions_added=0
falsifier=old-no-recruit-instruction result=green
falsifier=wrong-worker-definition result=green
oracle=independent_read_only kernel_unchanged_after_oracle=true
owned_process_tree_remaining=0 electron_processes_remaining=0 hermes_processes_remaining=0 roots_remaining=0
repository_tree_unchanged=true
elapsed_ms=65680
PASS research-director-delegation
PASS  research-director-delegation
~~~

### WO-RD-1 regression receipt

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
elapsed_ms=22353
PASS research-director-front-door
PASS  research-director-front-door
~~~

### Remaining command receipts

~~~text
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-team-composition-ozJPAq\kernel.db provenance=explicit journal=wal sync=2 schema_meta=76
kernel: path=C:\Users\rybow\AppData\Local\Temp\qf-team-composition-ozJPAq\kernel.db provenance=explicit journal=wal sync=2 schema_meta=76
team-composition: PASS Kernel reopen, Dock Owns, tile facts, actions, receipts, and close guard
PASS  team-composition
PASS  kernel-sole-writer
kernel-sole-writer-app OK
PASS  kernel-sole-writer-app
PASS  repo-shape
one-skin OK
totals: hex=0 func-color=0 raw-font-family=0 (outside collab-electron/src/windows/shared/qf-tokens.css)
PASS  one-skin
doc-links: PASS (59 live documents, every pointer resolves)
PASS  doc-links
rung-ladder: PASS (22 rungs; active=R14; complete=15)
PASS  rung-ladder
~~~

Both `git diff --check` commands emitted no output and exited 0.

## What was proved

- One real Research Director form submission created exactly one Mission, one
  Director session, one `hermes-worker` specialist session, one exact
  Director-to-specialist delegation link, and one durable Task with exact
  delegator and assignee links.
- The `task.created` event recorded the exact Task as `open`, even though a
  fast worker may later complete it.
- The real canvas showed exactly one Director tile and one specialist tile.
  Four separate Task nodes matched the independent Kernel Oracle's title,
  uppercased status, Director display name, and exact Mission objective.
- Every required falsifier went red and its restored assertion went green.
- The Oracle did not change the Kernel; the gate left no owned process,
  Electron/Hermes process, disposable root, or repository change; the gate's
  `65,680 ms` receipt was below the literal `120,000 ms` deadline.

## What was not proved

This verification did not approve research judgment or prove research quality,
an Evaluation, a Report, manual Create/Reassign/Cancel controls, live-market or
Strategy/Technique coverage, release packaging, an installer, a soak, or the
legacy `team-composition-ui` harness. It did not place a bet or execute a trade.
