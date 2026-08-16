# WO-RD-3 — Founder steering over live Director work

status: rewritten — fresh Reader required before Builder
assignee: builder
depends: WO-RD-2 done at `13beba7fb9a24632946b8f50a319f9df161396c1`; independently verified in `docs/orders/evidence/wo-rd-2/VERIFICATION.md`
rung: R14 / slice 3 — clarify, redirect, reassign, cancel, and request a second opinion
authorization: founder umbrella goal 2026-08-15; fresh Reader `01a007d7-e59d-79d2-bf68-ed832015b6b1` returned PASS at `bdefeb4`
rework-cycle: 2 of 2 exhausted; rewrite-cycle: 0 of 1

## Objective

Let Ryan steer the exact durable work created through the Research Director, with every accepted action and every refused invalid action visible from Kernel truth.

## In plain terms

Ryan can change course without restarting the desk or talking separately to every agent, and the app shows exactly what changed, who received it, and when a request was refused.

## Context pack

Read only:

1. `START_HERE.md`
2. `docs/orders/PROTOCOL.md`
3. this order
4. `docs/orders/evidence/wo-rd-2/VERIFICATION.md`
5. the R14 and golden-run definitions in `docs/orders/GOLDEN-RUN.md`
6. `docs/orders/AUTONOMY.md`, especially the founder standing override that
   forbids a second checkout and packaged/release gates for this order

Do not inherit chat diagnosis. Measure the current seams before editing.

## Fixed vocabulary

- **original Task** is the one open Task projected on the `hermes-worker` tile after the WO-RD-2 flow.
- **Director** is the exact running `agent_session` linked by `spawned_from` to `hermes-research-director` and by `delegated_by` from the original Task.
- **current assignee** is the exact running session named by the original Task's single `assigned_to` link inside the same Kernel transaction that accepts a steering action. The accepted action result returns that captured session id; later runtime delivery never resolves the link again.
- **clarify** adds bounded context to the original Task without changing its durable `title` or `description`.
- **redirect** replaces the original Task's durable `description` for future work while preserving its id, title, delegator, assignment lineage, and the previous description in the append-only receipt.
- **reassign** is the existing `reassign_task` transition: move the still-open original Task to a different running specialist session, preserve the Director and Task identity, then deliver the Task's current instruction to the new assignee.
- **cancel** is the existing `cancel_task` transition plus stopping the currently assigned live turn/session. The Task remains durable as `cancelled`; the assignee provenance remains queryable.
- **second opinion** means one founder request recruits the exact production `hermes-critic` definition if no suitable critic is running, then creates one new open Task assigned to that exact critic session. Its durable receipt binds both the original Task id and the new review Task id. It does not yet claim that an Artifact was evaluated or that publication was gated; those are R15.
- **accepted** means the Kernel committed the domain change before runtime delivery was attempted.
- **refused** means trusted Electron main received a Kernel rejection, appended one Kernel audit receipt with the canonical reason code below without changing Task/session/domain state, and the mapped message appeared on the owning tile.
- **delivered** means Electron main wrote one bounded instruction to the exact current assignee's owned PTY/runtime boundary and then appended a Kernel delivery receipt. A failed delivery remains visible as `RECORDED · DELIVERY FAILED`; it may never be painted as success.
- **steering history** is the ordered Kernel event projection for the original Task. Renderer memory, DOM text, terminal output, and an in-memory array are never durable history.
- **bounded instruction** means non-empty UTF-8 text of at most 4,096 bytes after normalizing CRLF and CR to LF. The 4,096 bytes count only the founder text, not the JSON delivery envelope. C0/C1 control bytes other than normalized LF are rejected.

Canonical refusal codes and founder-visible messages are exact:

| Code | Message |
|---|---|
| `TASK_NOT_FOUND` | `Task not found.` |
| `TASK_NOT_OPEN` | `This Task is no longer open.` |
| `ACTOR_NOT_DELEGATOR` | `Only the Task's delegator can steer it.` |
| `ASSIGNMENT_CARDINALITY` | `Task assignment is unavailable.` |
| `ASSIGNEE_NOT_RUNNING` | `The assigned seat is not running.` |
| `INSTRUCTION_EMPTY` | `Enter an instruction.` |
| `INSTRUCTION_TOO_LARGE` | `Instruction must be 4,096 UTF-8 bytes or fewer.` |
| `INSTRUCTION_CONTROL_BYTES` | `Instruction contains unsupported control characters.` |
| `REASSIGN_NOOP` | `Choose a different running seat.` |
| `REASSIGN_TARGET_NOT_RUNNING` | `The new owner must be running.` |
| `CRITIC_DEFINITION_UNAVAILABLE` | `The production Critic is unavailable.` |
| `CRITIC_SESSION_AMBIGUOUS` | `More than one idle production Critic is available.` |
| `SECOND_OPINION_ALREADY_OPEN` | `A second-opinion Task is already open.` |
| `CANCEL_ALREADY_FINAL` | `This Task is already cancelled.` |

## Deliverables

### A — One Kernel steering contract

Add the smallest schema/action surface necessary for `clarify_task` and `redirect_task` plus host-recorded delivery/refusal receipts.

1. Both actions require trusted `actor_session_id` equal to the original Task's exact `delegated_by` Director, an open Task, exactly one current assignee, and one bounded instruction as defined above. The Task row, both identity-link cardinalities, actor equality, and assignee `running` state are read and decided in one `BEGIN IMMEDIATE` transaction; the result returns the captured assignee id.
2. `clarify_task` does not mutate the Task row. It appends one accepted receipt containing the Task id, Director id, current assignee id, mode `clarify`, and exact instruction.
3. `redirect_task` atomically replaces only `task.description` and appends one accepted receipt containing the Task id, Director id, current assignee id, mode `redirect`, previous description, and exact new description.
4. The Kernel refuses unknown/closed/cancelled Tasks, missing or duplicate identity links, a non-running assignee, wrong actor, blank/control-byte/over-limit text before domain mutation, using the exact canonical codes above.
5. Add internal actions `record_task_steering_delivery` and `record_task_steering_refusal`. They are callable only from Electron main's existing trusted Kernel service and are never registered in generated MCP/model tools, preload, or renderer APIs.
6. `record_task_steering_delivery` accepts only an existing accepted-event id plus outcome `delivered|delivery_failed`. It derives Task, mode, actor, and captured target session from the accepted event; callers cannot submit or replace those fields. There is at most one delivery receipt per accepted event. Repeated recording returns the existing receipt without a second write or delivery attempt.
7. Electron main generates one UUID `attempt_id` for every visible submit before calling the Kernel. `record_task_steering_refusal` accepts that id, attempted action, optional Task id, canonical reason code, and trusted actor context. It derives the founder-visible message from the code. The same `attempt_id` is idempotent and returns its existing receipt; a later click has a new id and therefore a new receipt. It may not mutate Task, links, sessions, or the rejected target.
8. Accepted-event and delivery/refusal event ids are Kernel generated. Runtime delivery is attempted exactly once per accepted UI submission; this order adds no automatic retry.
9. All new schema, generated command, migration, golden SQL, action documentation, and compatibility surfaces are regenerated by the repository's existing generators. Do not hand-edit generated drift.

### B — Clarify and Redirect controls on the owning tile

Add two controls to the original Task footer: `Clarify` and `Redirect`.

1. Each opens one inline input on that tile; it does not open a detached modal or Dock workflow.
2. Submit crosses renderer → preload → Electron main → Kernel. Renderer input never supplies the actor session id, current assignee id, or PTY id.
3. After the Kernel accepts, main delivers exactly one JSON-line envelope followed by carriage return to the captured assignee: `{"contract":"qf.task.steering.v1","task_id":"<id>","mode":"clarify|redirect","instruction":"<exact normalized founder text>"}`. Serialize with `JSON.stringify`; do not concatenate/quote shell text. No raw control byte other than the final carriage return reaches the PTY.
4. The same tile projects the resulting Kernel history as separate facts: action, exact text, accepted/refused, delivery state, and target display name. A projection refresh or close/reopen reconstructs them without renderer memory.
5. An invalid request shows the exact Kernel refusal reason on the same tile and the refusal remains present after refresh.

### C — Reassign means the new owner receives the work

Retain the existing `reassign_task` semantics and UI, then close the runtime-delivery gap.

1. Preserve the exact `reassign_task` contract already defined by `qf-kernel-schema/src/ontology/agent.ts` and WO-V2-3: only an open Task, different running target, one `assigned_to` replacement, preserved `delegated_by`, one atomic `task.reassigned` event, and no write on rejection.
2. The successful action result returns the old and newly captured assignee ids. Main delivers once to the returned new assignee using `{"contract":"qf.task.assignment.v1","task_id":"<id>","title":"<current title>","instruction":"<current durable description>"}` plus carriage return, serialized with `JSON.stringify`.
3. One delivery receipt derives the old/new assignee ids from `task.reassigned` and records `delivered|delivery_failed`; a caller cannot supply replacement identity fields.
4. The old tile shows no active Task; the new tile shows the Kernel-equal Task facts and steering history.
5. A no-op reassignment, non-running target, wrong actor, or non-open Task is refused, writes no reassignment/domain change, appends one canonical refusal receipt, and shows that refusal on the original owning tile.

### D — Cancel stops work without deleting history

Retain the existing `cancel_task` transition and compose it with the owned runtime stop.

1. The Kernel moves the exact original Task from `open` to `cancelled` first and appends its existing `task.cancelled` receipt.
2. `cancel_task` returns the assignee id captured in its transaction. Main calls the existing `cancelAgentSession(capturedAssigneeId)` exactly once; the target is the complete owned `agent_session`/runtime, not only a terminal keystroke or renderer tile.
3. Append one host outcome receipt. `runtime_stopped` means the live-host registry owned the session and the governed cancel resolved. `already_stopped` means no live-host entry existed and the Kernel session was already `closed|cancelled|failed`. Any other missing/mismatched state or a rejected governed cancel is `stop_failed` with a non-secret error class. No automatic retry is added.
4. The tile shows `CANCELLED` plus the outcome and retains the Task title, Director, final assignee, prior steering history, and assignment provenance after refresh and close/reopen.
5. A repeated cancel is refused and audited without a second runtime stop.

### E — Request a governed second opinion

Add `Second opinion` to the original Task footer.

1. Production means QA mode false and the exact tracked definition id `hermes-critic` loaded once from `PRODUCTION_DOCK_PROFILE_MANIFESTS`. Ready means `getDockDefinitionAvailability(definition).available === true`. Absent, duplicate, not production, or unready maps to `CRITIC_DEFINITION_UNAVAILABLE`.
2. An idle reusable critic is a `running` session with exactly one `spawned_from` link to `hermes-critic` and zero open Tasks assigned to it. Reuse it only when exactly one exists. If zero exists, recruit one through the existing definition-backed admission path. If more than one exists, refuse with `CRITIC_SESSION_AMBIGUOUS`; do not choose by ordering.
3. Add one atomic Kernel action `request_second_opinion`. It rechecks the source Task is open, no source-bound review Task is open, and the captured critic session is running; it creates exactly one ordinary open Task with id generated by the Kernel, title `Second opinion — <source Task title>`, description `Independently review Task <source Task id>: <source Task current description>`, the Director as trusted delegator, and the critic as assignee. The original Task is unchanged.
4. Append one `task.second_opinion_requested` receipt binding `source_task_id`, `review_task_id`, Director id, and critic session id.
5. Deliver once using `{"contract":"qf.task.second_opinion.v1","source_task_id":"<id>","review_task_id":"<id>","title":"<source title>","instruction":"<source current description>"}` plus carriage return, serialized with `JSON.stringify`. Show the review Task on the critic tile and the request in the source Task's history.
6. Duplicate detection uses the `task.second_opinion_requested` event created in step 4 whose source id matches and whose bound review Task is still `open`; `request_second_opinion` checks and creates under one `BEGIN IMMEDIATE` transaction. A failed runtime delivery does not remove or duplicate the open review Task. Repeating the control is refused with `SECOND_OPINION_ALREADY_OPEN` and may not create another critic session or Task.
7. This slice does not create an Evaluation, read an Artifact, or authorize publication.

### F — One focused product gate

Add product gate `qa/gates/founder-steering.ts`, its focused pure/unit test `qa/gates/founder-steering.test.ts`, and register only the product gate in `qa/run.ts`. The `.test.ts` imports and tests the product gate's pure parsing/normalization helpers; it does not substitute for the renderer-through-main product run.

The gate uses one isolated temporary Kernel and one isolated app/user-data/resource root. It drives the real renderer controls through preload and Electron main. Synthetic runtimes are real child processes admitted through the production host boundary and may make model output deterministic; they are not mocked main/preload handlers. No test may call `execute()` directly for a result it claims came from a visible control, mock a main/preload handler, mutate the database while an app process is running, or paint expected DOM text itself.

In exactly two launches against the same isolated Kernel it must:

1. On launch one, submit through the visible Research Director form. The synthetic Director uses the real generated discovery/spawn/collaboration tools to create the specialist and original Task; no domain row is seeded after launch.
2. accept one Clarify and prove Task description unchanged, exact instruction acknowledged by the captured assignee child, accepted/delivered receipts present, and visible history equals Kernel;
3. accept one Redirect and prove Task description changed exactly once, the `task.redirected` payload's `previous_description` equals the pre-click description byte-for-byte, the exact new instruction is acknowledged by the captured assignee child, and visible history equals Kernel;
4. create the second specialist as gate setup through exactly one call to existing app RPC `qf.dock.spawn` with `{ definitionId: "hermes-worker-2" }` and explicit RPC timeout `20_000` ms. Never put the spawn call inside a retry/poll loop: the shared RPC helper defaults to 5 seconds while synthetic Hermes launcher readiness may take 10 seconds, so abandoning and repeating the call can create half-observed seats. This is the same definition-backed admission used by the Dock and is not evidence for any claimed founder control. After the one call returns, poll only the returned exact session id until it has one `spawned_from` link to `hermes-worker-2` and `running` state; then use the visible `Reassign` control. Require the old tile to show no active Task, the new tile to show the exact title/status/delegator/reason, and only the new runtime to acknowledge the current Task description;
5. request one second opinion and prove exactly one running session with one `spawned_from -> hermes-critic`, exactly one new open review Task with exact `assigned_to`/`delegated_by` links and source-bound event, exact source/review Task ids in the critic child acknowledgement, and the exact review Task on the critic tile;
6. before cancel, capture the current assignee's Kernel session id and live synthetic acknowledgement channel. Cancel once, then require Task status `cancelled`, session status `cancelled`, Kernel-to-PTY capture unavailable, the pre-cancel owned child PID absent, and all history still visible. A `task.cancel_outcome` receipt alone cannot satisfy runtime stop;
7. immediately before clicking `Cancel` the second time, snapshot exact Task fields, assignment/delegator links, and all involved session fields. After the click require exactly `CANCEL_ALREADY_FINAL`, its exact visible message, one new Kernel refusal receipt, and byte-equal pre/post domain snapshots excluding only the new refusal event;
8. Close launch one completely. On launch two, reconstruct the tiles/history from the same Kernel and prove equality, then close it;
9. report `processes_remaining=0 roots_remaining=0 leaked=[]` and finish under 120 seconds.

The relevant event kinds are exactly `task.clarified`, `task.redirected`, `task.steering_delivery`, `task.steering_refused`, `task.reassigned`, `task.reassignment_delivery`, `task.second_opinion_requested`, `task.second_opinion_delivery`, `task.cancelled`, and `task.cancel_outcome`. The independent read-only Oracle orders them by `(sequence,event_id)` and normalizes each to `[sequence,event_id,kind,task_id,mode,text,outcome,target_session_id]`, using JSON `null` for an inapplicable field. The gate compares that ordered array to separate visible DOM facts carrying the same eight values; extra/missing/reordered facts fail. It separately reads and asserts Redirect's exact `previous_description`, which is not part of the display tuple.

The reopen snapshot is exact: for the source and review Tasks, `[id,title,description,status]`; for the Director, both specialists, and critic, `[id,status]`; and for every `spawned_from|delegated_by|assigned_to` link touching those ids, `[kind,from_id,to_id]`, each collection sorted lexically by id then kind/from/to. Reopen equality means the launch-two normalized DOM/event array and this Task/session/link snapshot exactly equal the launch-one Oracle snapshot.

The cleanup baseline is the process ids and existing directories recorded before launch one. `processes_remaining` counts only child/descendant process ids created by the gate that are still live after cleanup. After closing every owned handle and child, the gate removes its unique `qf-founder-steering-<uuid>` root through the repository's guarded Windows cleanup helper and asserts `existsSync(root) === false`; `roots_remaining` is `0|1` from that measurement and `leaked` is `[]|[exact root]`. The printed cleanup line is derived from measured values and any nonzero value fails before PASS. Elapsed time uses `performance.now()` immediately before launch one's process spawn through final child/root cleanup after launch two.

Synthetic delivery is independently observable. In QA mode only, the checked-in responder parses the three exact JSON contracts from Deliverables B, C, and E and emits `QF_SYNTHETIC delivery_received role=<exact role> contract=<exact contract> task_id=<id>` plus source/review ids for second opinion only after its PTY reader received that exact envelope. Add proof-only app RPC `qf.session.capture` behind `QF_UI_PROOF=1`; it accepts a Kernel `agent_session` id, resolves the owned PTY through `agentActivity.getPtySessionId`, and returns captured output or exact error `Session runtime unavailable.` It exposes no write. The gate uses this child output—not main's delivery receipt—to prove the intended runtime received each envelope, and proves excluded children did not emit the matching acknowledgement.

The gate prints one compact ledger with exact Task/session ids and one line per accepted/refused action. It fails on any absent/duplicate relation or receipt, UI/Kernel mismatch, wrong runtime delivery, stale renderer state, uncontrolled process/root residue, or elapsed time over budget.

## Acceptance gates

### Builder-run

Run once, in this order:

```powershell
cd collab-electron
bun test cli/qf-hermes-synthetic-responder.test.ts src/main/task-steering.test.ts src/main/task-delegation-projection.test.ts src/windows/shell/src/task-composition.test.ts
cd ..
bun test qa/gates/founder-steering.test.ts
bun qa/run.ts founder-steering
bun qa/run.ts team-composition
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts repo-shape
bun qa/run.ts one-skin
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
git diff --check
```

If an exact named test file is split differently during implementation, the order file must be corrected before the lap; do not silently substitute a command.

### Mandatory falsification receipts

The builder must show each named condition red, restore the owning seam, then show green:

1. `non-main-direct-execute-shortcut`
2. `clarify-mutated-description`
3. `redirect-lost-previous-description`
4. `reassign-delivered-to-old-session`
5. `second-opinion-wrong-definition`
6. `refusal-not-kernel-backed`
7. `cancel-left-runtime-working`
8. `ui-history-survived-with-kernel-history-removed`

For falsifiers 2–7, each QA-only switch must replace or suppress the named dependency at the owning production boundary before launch while the normal gate assertions and expected values remain byte-for-byte identical. A switch may not branch inside an assertion, Oracle, DOM expected-value builder, PASS printer, or cleanup check. The red transcript must name the unchanged assertion that failed. Exact product-path switches and red observations are:

| Falsifier | `QF_FOUNDER_STEERING_FALSIFY` | Required red observation |
|---|---|---|
| 2 | `clarify_mutated_description` | read-only Task description changed |
| 3 | `redirect_lost_previous_description` | exact `previous_description` absent/wrong |
| 4 | `reassign_delivered_to_old_session` | old child acknowledged or new child did not |
| 5 | `second_opinion_wrong_definition` | critic definition/session/Task cardinality mismatch |
| 6 | `refusal_not_kernel_backed` | visible refusal lacks matching Kernel event |
| 7 | `cancel_left_runtime_working` | session, PTY mapping, or owned PID remains live |
| 8 | `ui_history_survived_with_kernel_history_removed` | refreshed DOM retains facts absent from projection |

Run each product-path pair with the table value. Red must exit nonzero and print `FALSIFY RED <falsifier name>` beside the unchanged failed assertion; restored must exit 0 and print the normal PASS ledger. A timeout or failure before the named assertion is not a receipt.

```powershell
$env:QF_FOUNDER_STEERING_FALSIFY = '<table value>'
bun qa/run.ts founder-steering
if ($LASTEXITCODE -eq 0) { throw 'falsifier did not go red' }
Remove-Item Env:QF_FOUNDER_STEERING_FALSIFY
bun qa/run.ts founder-steering
if ($LASTEXITCODE -ne 0) { throw 'restored gate did not return green' }
```

`non-main-direct-execute-shortcut` uses the repository's existing writer guard exactly: `$env:QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE='1'; bun qa/run.ts kernel-sole-writer` must exit nonzero and name the planted non-allowlisted `execute` call; after removing that environment variable, `bun qa/run.ts kernel-sole-writer` must exit 0. Do not change the guard or its allowlists for this proof.

`ui-history-survived-with-kernel-history-removed` injects one sequence at the main-process history projection dependency before launch: its first read returns real Kernel history and its second/subsequent reads return an empty list. The gate renders the real history, triggers the normal projection refresh, and the unchanged equality assertion must go red if the renderer retains the prior DOM facts. Restore the real projection dependency and the same assertion must go green. It does not mutate the database or branch in renderer/assertion code.

### Verifier-run

The founder's 2026-08-15 umbrella directive and the reconciled standing override in `AUTONOMY.md` supersede PROTOCOL's older worktree/cold-release text for this order: use this one checkout, no worktree/copy, and no `verify-release`. First record the immutable candidate SHA and clean state. Nobody else edits the repository while the matrix runs. Re-run the Builder matrix exactly once, inspect the candidate diff for scope and trust-boundary changes, and run:

```powershell
$candidate = git rev-parse HEAD
git diff --check "$($candidate)^" "$candidate"
```

Do not run `verify-release`, installer, packaged Windows gates, a soak, a second copy, or a second consecutive focused run. Any non-zero command stops the slice for a numbered rework record.

## Acceptance conditions

The order is green only when all are true:

- All five controls are visibly reachable from the exact Task tile.
- Every accepted action and the one required refusal are reconstructed from Kernel state after refresh; no durable UI-only state exists.
- Runtime delivery targets exact session identity and its outcome is recorded honestly.
- Reassign preserves the Task and Director while changing only the current owner.
- Cancel leaves durable Task/history and stops the exact assigned live runtime.
- Second opinion creates exactly one production critic session and one review Task while making no Evaluation/publication claim.
- The focused gate exits 0 under 120 seconds with zero process/temp residue.
- The static matrix and both diff checks exit 0.

## Out of scope

- critic judgment, Artifact review, Evaluation creation, report publication, or publication gating (R15)
- domain-object canvas redesign (R16)
- Strategy/Technique selection or outcome grading (R17)
- recall, RL, PufferLib, playbook learning, betting, or trading (R18–R20)
- Dock redesign, new runtime species, dependencies, installer/package/release matrices, soak tests, helper frameworks, worktrees, clones, or extra checkouts
- weakening an existing action, assertion, writer boundary, identity check, or production inventory rule

## Report back

Return only:

1. candidate SHA and pushed branch;
2. files changed grouped by Deliverables A–F;
3. unedited Builder matrix exits and durations;
4. all eight red/restored-green falsifier receipts;
5. exact accepted/refused Kernel ledger plus UI-equality and delivery targets;
6. process/root cleanup receipt;
7. remaining limits, especially anything deferred to R15.

## Rework 1 — exact second-specialist admission route

Builder lap `01a007df-8512-7d20-96ca-bad1abbbbed9` stopped before the matrix,
commit, or push after the same setup assertion stayed red twice. Its final
receipt was:

```text
second specialist timed out: Method not found: qf:spawnSession
```

The order had required a second running specialist but did not name its gate
setup boundary. The live app RPC is `qf.dock.spawn`, registered in
`collab-electron/src/main/index.ts`; `qf:spawnSession` is an IPC/preload name and
is not an app RPC. Rework only the setup call to the exact route and assertions
now stated in Deliverable F step 4. Preserve every product edit, assertion,
falsifier, time limit, cleanup condition, and matrix command. This is Rework 1;
if the same second-specialist assertion is red again after this correction, or
any other assertion repeats red after its one correction, stop for router
decision. No R15 work begins.

## Rework 2 — wait for the one admission already in flight

Rework 1 corrected the method name, but the gate left `qf.dock.spawn` inside
`waitFor` and used `rpcCall`'s 5,000 ms default. The exact receipt was:

```text
second specialist timed out: RPC timeout: qf.dock.spawn
```

The measured synthetic Hermes admission boundary may wait 10,000 ms in
`host-native-tui.ts`; a 5,000 ms client timeout abandons the response while the
server continues the admission, and the outer retry can start another one.
Rework exactly Deliverable F step 4: one RPC call, explicit 20,000 ms timeout,
then read-only polling of only the returned session id. Do not change the
120-second whole-gate budget, any product behavior, assertion, falsifier,
cleanup rule, or matrix command. This is the final rework cycle. Any red receipt
after this correction stops WO-RD-3 with no further lap.

## REWRITE — role-complete synthetic production fixture

Everything above remains the product contract and acceptance. The two rework
cycles are history and authorize no third lap. This rewrite adds one measured
prerequisite repair, then authorizes one fresh Builder to complete the unchanged
order from the preserved uncommitted product edits.

The final timeout was not a slow admission. Independent read-only diagnosis
task `01a007fb-99ca-7561-910d-7ff0e0c76370` traced this exact path:

1. production definition `hermes-worker-2` carries peer role `worker2`;
2. `qf.dock.spawn` reaches normal definition-backed admission and waits for
   launcher readiness;
3. `collab-electron/cli/qf-hermes-synthetic-responder.mjs` rejects every role
   except `orchestrator|worker|critic` before it emits its readiness transition;
4. the host therefore waits for a receipt the rejected child cannot emit.

The rewrite authorizes exactly this additional repair:

- In `collab-electron/cli/qf-hermes-synthetic-responder.mjs`, accept exact role
  `worker2` in the synthetic configuration check and dispatch `worker2` through
  the existing `worker()` behavior.
- Preserve `QF_PEER_ROLE=worker2`, the distinct Kernel session, definition
  `hermes-worker-2`, and peer-registry key `worker2`. Do not alias it to
  `worker`, remove peer registration, spawn a fixture-only fake, retry
  admission, or extend any timeout.
- Export one pure role selector from the production responder module and make
  `run()` use that same selector for dispatch. Add focused test
  `collab-electron/cli/qf-hermes-synthetic-responder.test.ts` that imports the
  production selector and proves exact `worker2 -> worker()` dispatch, exact
  `worker -> worker()`, `critic -> critic()`, `orchestrator -> orchestrator()`,
  and unknown-role rejection. A parallel helper or source-text assertion does
  not count. It performs no network/live-app work and completes under 10 seconds.
- Add that exact test file to the first Builder unit command in this order.
  Nothing else in the matrix, eight falsifiers, 120-second product-gate budget,
  cleanup, Oracle, UI, Kernel, or runtime-delivery acceptance changes.

The earlier red receipts plus the source diagnosis are the falsification for
this prerequisite. The rewritten Builder must show the focused worker2 test
green before running the full Builder matrix once. Any red command in the
rewritten lap stops the order; there is no rework cycle after this rewrite.

Reader `01a007fe-f6a4-77e1-b270-1a522b52a1b4` found the proof gaps corrected
above before the rewritten Builder door opened: prior-description was not read,
delivery/cancel trusted host receipts instead of child state, repeated cancel
lacked a pre-click snapshot, cleanup text was hard-coded, falsifier commands
were unnamed, and the worker2 test could have bypassed production dispatch.
These findings are now order requirements, not chat guidance.
