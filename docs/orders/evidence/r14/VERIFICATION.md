# R14 verification — Research Director and founder steering

status: PASS
verified-at: 2026-08-16
candidate-sha: 24c418a3d5126eef3dcb2e05e8eff0a4c9fd85fa
candidate-branch: wo-V2-3
candidate-upstream: origin/wo-V2-3
verifier-task: 01a00991-ca6a-72e2-8a78-83fb09106063

## In plain terms

Ryan can ask one Hermes Research Director for bounded work. The Director recruits
the exact production specialist, creates one durable Task, and exposes the work
on the canvas. Ryan can then Clarify, Redirect, Reassign, request a Second
opinion, and Cancel from the Task surface. The accepted actions, exact runtime
targets, refusal, and history survive close/reopen without visible drift.

## Immutable candidate

~~~text
HEAD_BEFORE=24c418a3d5126eef3dcb2e05e8eff0a4c9fd85fa
HEAD_AFTER=24c418a3d5126eef3dcb2e05e8eff0a4c9fd85fa
UPSTREAM_SHA=24c418a3d5126eef3dcb2e05e8eff0a4c9fd85fa
STATUS_BEFORE=clean
STATUS_AFTER=clean
RELEVANT_PROCESSES=0 -> 0
~~~

One pre-existing root, `qf-founder-steering-XWMgvK`, was in the Verifier's
baseline and remained unchanged. The verified commands created no new process
or temporary-root residue.

## Once-only independent matrix

Every command ran once and exited `0`.

| Command | Duration |
|---|---:|
| `bun test cli/qf-hermes-synthetic-responder.test.ts src/main/task-steering.test.ts src/main/task-delegation-projection.test.ts src/windows/shell/src/task-composition.test.ts` | 249 ms |
| `bun test qa/gates/windows-cold-boot.test.ts` | 126 ms |
| `bun test qa/gates/founder-steering.test.ts` | 125 ms |
| `bun qa/run.ts research-director-delegation` | 65,006 ms |
| `bun qa/run.ts founder-steering` | 43,400 ms |
| `bun qa/run.ts team-composition` | 419 ms |
| `bun qa/run.ts kernel-sole-writer` | 351 ms |
| `bun qa/run.ts kernel-sole-writer-app` | 140 ms |
| `bun qa/run.ts repo-shape` | 164 ms |
| `bun qa/run.ts one-skin` | 120 ms |
| `bun qa/run.ts doc-links` | 217 ms |
| `bun qa/run.ts rung-ladder` | 99 ms |
| `git diff --check` | 56 ms |
| candidate-only `git diff --check` | 48 ms |

## Product receipts

- Delegation cleanup measured
  `owned_process_tree_remaining=0 electron_processes_remaining=0 hermes_processes_remaining=0 roots_remaining=0`.
- Founder steering completed in `41,860 ms`, below its 120-second limit.
- Exact delivery targets were worker one for Clarify and Redirect, worker two
  for Reassign and Cancel, and the admitted critic for Second opinion.
- Accepted Kernel receipts covered Clarify, Redirect, Reassign, Second opinion,
  and Cancel. Delivery outcomes were `delivered`; Cancel returned
  `runtime_stopped`.
- Repeated Cancel wrote exactly one durable refusal with message
  `This Task is already cancelled.`
- UI receipts were
  `launch_one_oracle=true launch_two_reopen=true visible_task_session_link_equality=true`.
- Founder cleanup measured
  `processes_remaining=0 roots_remaining=0 leaked=[]` after termination and root
  removal.

## Independent trust-boundary inspection

- Owned processes are captured relative to the gate baseline, sampled again
  around shutdown, drained, then measured. Unrelated processes are not counted
  as owned or killed.
- Repeated Second opinion checks Kernel open-review truth before recruitment;
  its focused test proved no recruiter call or session-inventory change.
- Founder cleanup prints only post-cleanup measurements and revokes PASS for any
  residue.
- Launch two compares normalized visible Task/session/link/history facts exactly
  with launch one, in addition to the independent durable Oracle.
- The steering hold is QA-only and synthetic-only. Normal responder mode still
  performs its market read and `send_result` path.

## Falsification

The Builder broke and restored every named founder boundary: direct-execute
shortcut, Clarify description mutation, Redirect previous-description loss,
Reassign delivery to the old session, wrong critic definition, non-Kernel
refusal, Cancel leaving the runtime active, and UI history surviving after
Kernel history removal. Each injected run was red and each restored run green.
The independent Verifier then ran the restored matrix once.

## Not proven here

R14 does not claim that a critic reads the research evidence, creates a scored
Evaluation, or gates Report publication. It does not add the R16 dedicated
research-object inspectors, R17 Strategy/outcome grading, recall, RL learning,
or playbook learning. It never places a bet or trade.
