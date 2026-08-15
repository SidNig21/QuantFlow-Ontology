# WO-RD-2 — Research Director recruits and assigns

status: final rewrite 2 of 2 — Reader PASS
assignee: builder
depends: WO-RD-1 done at `5a9a5cea6186b05a4eea5c38f5b8a597a8d02bbf`
rung: R14 / slice 2 — governed specialist recruitment and durable Task ownership
authorization: founder umbrella goal 2026-08-15; initial Reader `01a007a6-325b-71e0-b80d-001ff9f7edc2` answered YES/YES PASS; Rework 1 Reader `01a007be-039d-7740-b6a5-6608773ca4b2` passed its isolation text; final rewrite Reader `01a007c5-d887-7790-abff-d77222381365` answered YES/YES/NO weakening PASS; `NEXT.md` names this order
rework-cycle: 2 of 2 — exhausted after this candidate

## In plain terms

Ryan asks one Research Director, not a row of agents. The Director recruits the
right production specialist, gives that exact session durable work, and the
canvas shows who owns the work, its status, and why it exists.

## Outcome

One submission through the verified Research Director form creates the durable
Mission and Director session from WO-RD-1, then that Director uses only its
existing QuantFlow tool surfaces to:

1. discover the exact production definition `hermes-worker`;
2. create and start one exact specialist session from that definition; and
3. send the founder's exact Mission objective as one durable Task.

The Kernel records exactly one `delegates_to` link from the Director session to
the specialist session and exactly one `delegated_by` plus one `assigned_to`
link for the Task. The canvas creates the specialist tile automatically and its
Task footer visibly names the Task, current status, `Research Director` as the
delegator, and the exact objective as the reason. No Dock click is required.

This slice proves governed recruitment and assignment. It does not claim that
the specialist's research is good, that a result passed review, that all
founder steering controls work, or that live market/Strategy coverage exists.
It never places a bet or trade.

## Fixed vocabulary

- **Director** means the one new `agent_session` whose single `spawned_from`
  link names `hermes-research-director`.
- **specialist** means the one new `agent_session` whose single
  `spawned_from` link names `hermes-worker`.
- **the Task** means the one new Kernel `task` whose `description` is the exact
  trimmed Mission objective, whose status is `open` when created, and whose
  single `delegated_by` and `assigned_to` links name the Director and specialist
  sessions respectively. A later `done` state does not change its identity.
- **visible** means present in the real Electron shell DOM and derived from the
  Kernel task/session projection. Terminal text, a log line, or a direct
  database query alone is not visible.
- **reason** means the Task `description`; it is not model commentary or
  renderer-only copy.

## Context pack

Read only:

- `START_HERE.md`
- `docs/orders/PROTOCOL.md`
- this order
- `docs/DOCTRINE.md` A10
- `species/hermes/dock-profiles.json`
- `species/hermes/prompts/research-director.md`
- `collab-electron/src/main/mission-activation.ts`
- `collab-electron/src/main/ontology-role-tools.ts`
- `collab-electron/src/main/ontology-gateway.ts`
- `collab-electron/src/main/collaboration-gateway.ts`
- `collab-electron/src/main/task-delegation-projection.ts`
- `collab-electron/src/main/kernel.ts`
- `collab-electron/src/main/index.ts`
- `collab-electron/cli/qf-collaboration-mcp.mjs`
- `collab-electron/cli/qf-hermes-launch.sh`
- `collab-electron/cli/qf-hermes-synthetic-responder.mjs`
- `collab-electron/src/windows/shell/src/task-composition.js`
- `collab-electron/src/windows/shell/src/renderer.js`
- `qa/gates/research-director-front-door.ts`
- `qa/gates/windows-golden-run.ts`
- `qa/run.ts`
- `qa/gates/kernel-sole-writer.ts`

Do not read chat transcripts or handoff prose. The order and repository are the
authority.

## Deliverables

### A. Lift only the temporary recruitment prohibition

Update `species/hermes/prompts/research-director.md` and the
`qf.mission.activation.v1` Research Director instruction so both direct the
Director to perform this exact bounded workflow:

1. call `qf_agent_definition_query` and select only `hermes-worker`;
2. call `qf_create_agent_session` once for that definition;
3. call `qf_start_agent_session` once for the returned exact session; and
4. call collaboration `send_task` once with `to_role=worker` and the founder's
   exact trimmed Mission objective.

The prompt must say the Task is not assigned until the Kernel-backed tool call
returns a Task id. It must retain the rules to use only QuantFlow MCP/ontology
tools and exact Kernel identities, report missing data or Strategy/Technique
coverage rather than fabricate it, and never place a bet or trade.

Do not add a second recruitment API, expose `create_task` through the ontology
gateway, call `execute()` from a model adapter, or let the renderer create the
specialist or Task. The existing path is the product path:

```text
Director ontology tools -> create/start exact session
Director collaboration send_task -> Kernel create_task -> peer notification
Kernel projection -> canvas specialist tile and Task footer
```

The existing role routing is accepted only because live peer admission permits
one live recipient for role `worker`, and `send_task` resolves and records that
recipient's exact session id in `assigned_to`. The proof must bind the created
specialist session, live recipient, and `assigned_to` id to the same value.

### B. Project the Task's reason and delegator

Extend the existing read-only task-assignment projection with exactly these
four presentation fields: `title`, `status`, `delegatorDisplayName`, and
`description`. `delegatorDisplayName` is the exact `display_name` of the Kernel
`agent_definition` reached through the Task's one `delegated_by` session and
that session's one `spawned_from` link. For this projection, **exactly
assigned** means the Task has exactly one `delegated_by`, exactly one
`assigned_to`, and the delegator session has exactly one `spawned_from` to an
existing definition with a non-empty `display_name`. If any part is missing or
duplicated, `assignmentState="unavailable"` and
`delegatorDisplayName=null`. Do not add storage or query SQLite from the
renderer.

For an exactly assigned Task, the specialist tile footer must expose four
separate DOM facts derived from the projection:

- `.qf-task-title`: one text node whose text is the exact projected Task title;
- `.qf-task-status`: one text node whose text is the projected Kernel status
  uppercased to `OPEN`, `DONE`, or `CANCELLED`;
- `.qf-task-delegator`: one text node whose text is exactly `Assigned by `
  followed by the projected `delegatorDisplayName`; this slice's expected
  value is exactly `Assigned by Research Director`; and
- `.qf-task-reason`: one text node whose text is the exact projected Task
  description.

Do not put multiple facts in one of those nodes. If either Task assignment link
cardinality is not exact, the Task projection is exactly
`assignmentState="unavailable"`, `delegatorDisplayName=null`, and both
`.qf-task-delegator` and `.qf-task-reason` are absent from every tile; retain
the existing `Assignment unavailable` text on any tile whose exact session id
is still named by a malformed link. The exact specialist tile may therefore
show `No task` after its `assigned_to` link is removed; it must never show a
guessed delegator or reason. This order makes no claim about the manual
Create/Reassign/Cancel renderer controls; `team-composition` preserves only
their Kernel action and lifecycle contract. Founder steering is the separate
slice that must prove those visible controls.

### C. One fast real-shell product proof

Add and register `research-director-delegation`. It must reuse or extract the
WO-RD-1 dev-app proof utilities rather than copy its process supervisor. It
runs the public `bun run dev` entrypoint once on native Windows with isolated
Kernel, artifact, peer-bus, app-root, and Hermes-profile roots. It uses
`QF_HERMES_SYNTHETIC_TEST=1` only to make model decisions deterministic and
sets no QA Dock profile or explicit question-handler definition override.

The green product case starts the public `bun run dev` entrypoint exactly once.
Falsifiers 1 and 2 run the same real path in their own disposable app/Kernel
roots, outside that one green run, so their altered inputs cannot contaminate
the green case's exact-one deltas. All cases remain inside the gate's one
wall-clock deadline. The gate drives the real Research Director textarea/form
in the Electron DOM.
It may use the bounded app control RPC only for readiness, DOM interaction,
DOM observation, fixture seeding, and shutdown. It may not call
`qf.research.submit_question`, `qf.dock.spawn`, a preload product action,
`qf.collaboration.send_task`, an ontology action, or `execute()` directly.

Seed only the already-supported isolated market fixture if needed so the
deterministic specialist can terminate honestly. The asserted slice ends when
the Task and both tiles are visible; a fast worker may subsequently complete
the Task. Both `open` and `done` are valid observed current states, but the
Kernel event ledger must prove the Task was created in `open` before any
completion. No Evaluation or Report is required by this order.

After the UI observation, an independent read-only SQLite oracle binds all of
these exact identities and deltas:

- one Mission and one Director session from the submitted form;
- one specialist session from `hermes-worker`;
- one `delegates_to` from that Director to that specialist;
- one Task whose description equals the Mission objective;
- one `delegated_by` from that Task to that Director;
- one `assigned_to` from that Task to that specialist; and
- one `task.created` event with `events.object_id` equal to that exact Task id
  and payload field `status="open"`.

The oracle must snapshot the database before and after its read and fail if the
read changes it. Add only this gate's named file to the existing read-only
driver-SQL allowlist with the same explanatory pattern as WO-RD-1.

The UI assertion must observe exactly one Director tile and exactly one
specialist tile, not merely find one among duplicates. For the exact specialist
tile it reads the four separate Task nodes from Deliverable B and requires
their exact text values to equal the independent Kernel oracle's title,
uppercased status, delegator display name prefixed by `Assigned by `, and
description. Hard-coded renderer text is red. It also asserts no manual Dock
composition and no old `hermes-orchestrator` session.

The gate has one literal 120,000 ms wall-clock deadline beginning before child
spawn and covering proof, shutdown, cleanup, and receipts. Reuse the bounded
watchdog and cleanup mechanisms already proven by WO-RD-1; do not create a new
runner, detached helper, wrapper, manifest, JSON event stream, or package
cache. It fails on any owned process, new Electron/Hermes process, disposable
root, repository change, or deadline overrun left after cleanup.

### D. Falsification is narrow and executable

Before the green proof, run disposable-input falsifiers that demonstrate:

1. restoring the old `do not recruit or assign` instruction yields zero
   specialist sessions and zero Tasks and is red;
2. changing the selected definition to `hermes-worker-2` makes the exact
   `hermes-worker` identity assertion red;
3. removing or duplicating either the `delegated_by` or `assigned_to` row makes
   the projection report `Assignment unavailable` and hides delegator/reason
   facts; and
4. replacing the projected Task description with renderer-local copy makes the
   independent Kernel/UI equality assertion red. The fixture uses distinct
   literal values `KERNEL_REASON_SENTINEL` and `LOCAL_REASON_SENTINEL`; the
   expected value is read independently from the former, so copying one local
   value into both sides cannot satisfy the bait; and
5. making the delegator session's `spawned_from` link missing, duplicated,
   point at no valid definition, or reach an existing definition whose
   `display_name` is empty makes the Task projection exactly
   `assignmentState="unavailable"`, `delegatorDisplayName=null`, with no
   `.qf-task-delegator` or `.qf-task-reason` node.

Falsifiers 1 and 2 must execute the same real form -> launcher -> Director ->
Kernel proof path as the green product case, with only the disposable
instruction or selected-definition input changed; a manufactured row-count
fixture is not evidence for either. Falsifiers 3 through 5 may use focused
projection/DOM fixtures. No falsifier may mutate the live repository input
during the real green app proof. Restore each bait, run the corresponding same
assertion green, and make the product gate fail if any listed variant's
restoration-green receipt is missing.

## Acceptance

Run once, in this order, from the named directories:

```powershell
cd C:\Users\rybow\QuantFlow-Ontology\collab-electron
bun test src/main/mission-activation.test.ts src/main/task-delegation-projection.test.ts src/main/collaboration-gateway.test.ts src/windows/shell/src/task-composition.test.ts
cd C:\Users\rybow\QuantFlow-Ontology
bun test qa/gates/research-director-delegation.test.ts
bun qa/run.ts research-director-delegation
bun qa/run.ts research-director-front-door
bun qa/run.ts team-composition
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts repo-shape
bun qa/run.ts one-skin
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
git diff --check
$candidate = '<immutable builder SHA>'
git diff --check "$($candidate)^" "$candidate"
```

Replace the one quoted placeholder when assigning `$candidate`; the following
command is then literal pasteable PowerShell. `$candidate` is the immutable
Builder commit under verification. Do not run
`verify-release`, a Windows package/installer gate, a soak, or a second
consecutive product proof for this slice. Every command must exit 0. Any red
receipt stops that verification round.

Required product-gate receipt:

```text
falsifier=old-no-recruit-instruction result=red
falsifier=old-no-recruit-instruction result=green
falsifier=wrong-worker-definition result=red
falsifier=wrong-worker-definition result=green
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
director_definition=hermes-research-director director_sessions_added=1
specialist_definition=hermes-worker specialist_sessions_added=1
delegates_to_exact=1 director_to_specialist=true
task_rows_added=1 task_created_open=1
delegated_by_exact=1 assigned_to_exact=1 exact_session_binding=true
mission_objective_equals_task_description=true
director_tile_count=1 specialist_tile_count=1
ui_task_title=<JSON string exactly equal to Kernel title>
ui_task_status=<OPEN|DONE exactly equal to uppercased Kernel status>
ui_task_delegator=Assigned by Research Director
ui_task_reason=<JSON string exactly equal to Kernel description>
manual_dock_composition=0 old_orchestrator_sessions_added=0
oracle=independent_read_only kernel_unchanged_after_oracle=true
owned_process_tree_remaining=0 electron_processes_remaining=0 hermes_processes_remaining=0 roots_remaining=0
repository_tree_unchanged=true
elapsed_ms=<integer less than 120000>
PASS research-director-delegation
```

## Scope boundary

Allowed product surfaces are only:

- the Research Director package prompt and Mission activation text/tests;
- the existing task-assignment projection and tile Task footer/tests; and
- the smallest existing launcher/responder instrumentation needed by the
  focused deterministic proof, without changing production behavior.

Gate registration, its focused tests, exact read-only-oracle allowlist entry,
and evidence/order status files are also allowed. No schema change, new
dependency, new truth store, Dock redesign, steering controls, critic changes,
research-object redesign, live-data integration, release packaging, or RL work
belongs here.

Stop and return an order defect if this outcome requires changing an assertion,
adding a dependency, changing Task semantics, altering product code outside
the listed surfaces, reading credentials, or placing a bet/trade. After two
failed verification/rework cycles, stop for an order rewrite.

## Reader gate

A fresh Reader who did not write this order must answer exactly:

1. Can every acceptance gate actually fail?
2. Does every deliverable have exactly one meaning?

Every defect is edited into this file. Chat-only guidance is not authority.
Only after both answers are unqualified yes may this order change to
`status: ready — Reader PASS` and `NEXT.md` open the Builder door.

## Report back

Report only:

1. what Ryan can now do;
2. immutable candidate SHA and changed files by responsibility;
3. the exact product-gate receipt and acceptance command exits/durations;
4. falsifier red/green receipts;
5. what was not proved; and
6. the next authorized action.

## Rework 1 — isolate the pre-existing team-composition UI harness

Measured 2026-08-15 after the first Builder pass:

```text
research-director-delegation exit=0 elapsed_ms=65169
research-director-front-door exit=0 elapsed_ms=22111
team-composition-ui exit=1 elapsed_ms=121120
failure=production app RPC timed out
ui_assertions_exercised=0
owned_electron_or_bun_processes_after=0
```

This red does not name a WO-RD-2 product assertion. The existing
`qa/gates/team-composition-ui.ts` function `connectApp(temp)` ignores `temp`
and always reads `.package-staging/socket-path`. Its failure-proof app and main
app also both set `QF_APP_ROOT` to the shared `.package-staging` directory.
Sequential launches can therefore read a prior app's endpoint or race Windows
teardown while the next app owns no unique endpoint file; the gate then waits
until timeout without reporting an early child exit. Multiple preserved
`.qf-team-composition-ui-*` roots and the stale shared socket file measured the
same missing isolation.

The original Builder must make exactly this gate-only repair before producing
a candidate:

1. Every app launch in `team-composition-ui.ts` sets `QF_APP_ROOT` to that
   launch's already-created unique `temp` root. Keep
   `QF_UI_PROOF_RESOURCE_ROOT=PROOF_RESOURCES`; production resource loading is
   not changed.
2. `connectApp(temp, child, output?)` reads only `join(temp, "socket-path")`.
   It never reads or removes the shared `.package-staging/socket-path`.
3. While waiting, a non-null child exit code fails immediately and includes
   the bounded captured app output when available; it does not spend the
   45-second budget polling an endpoint that cannot appear.
4. Apply the same unique-root rule to the failure-proof, delay falsifier, and
   main green launch. Preserve every existing UI assertion, row/link check,
   timing threshold, falsifier, and receipt unchanged.
5. Extract endpoint-resolution and child-exit-classification helpers;
   production `connectApp` must call both exact helpers. Add a focused test of
   those helpers proving two distinct roots resolve two distinct endpoint
   files and a non-null child exit fails before timeout. A disconnected helper
   that `connectApp` does not call is red. Do not add a runner, wrapper,
   dependency, retry loop, global cleanup, or package step.

The Builder does not rerun `research-director-delegation` or
`research-director-front-door` in this rework lap. Run exactly:

```powershell
cd C:\Users\rybow\QuantFlow-Ontology
bun test qa/gates/team-composition-ui.test.ts
bun qa/run.ts team-composition-ui
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts repo-shape
bun qa/run.ts one-skin
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
git diff --check
```

Any red stops the rework. Full green permits one immutable candidate commit and
push. A fresh independent Verifier then runs the original complete Acceptance
matrix exactly once against that candidate; the verifier, not the Builder,
re-measures the corrected WO-RD-2 receipt label. This amendment authorizes no
product change outside the original scope and no assertion weakening.

### Rework 1 result — superseded

Rework 1's focused helper test passed in 129 ms. The unchanged legacy live gate
was red again after 117,620 ms at `production app RPC timed out`; the child had
not exited and no bounded app output was emitted. The Builder stopped without
commit or push. Unique endpoint roots were necessary hygiene but did not reach
the causal startup defect below. Rework 2 supersedes Rework 1's implementation
instructions; they authorize nothing further.

## Rework 2 — remove the stale legacy harness from this product slice

Read-only diagnosis measured the actual pre-RPC incompatibility:

```text
tracked production profile=hermes-research-director
.package-staging profile=hermes-orchestrator
team-composition-ui resource root=.package-staging
runBuild refreshes JavaScript only
RPC socket written=false
UI assertions exercised=0
```

`team-composition-ui` is a legacy V2-3 manual-Dock harness. It boots from the
stale `.package-staging/species` copy, which predates WO-RD-1's required
Research Director identity. Current startup validation rejects that resource
tree before JSON-RPC readiness. This is neither a WO-RD-2 product failure nor a
useful regression measurement of the changed surfaces.

The final Builder lap is exact:

1. Restore `qa/gates/team-composition-ui.ts` to its pre-Rework-1 content and
   remove the uncommitted `qa/gates/team-composition-ui.test.ts`. Do not repair,
   run, weaken, or otherwise change that legacy gate in this order.
2. The Acceptance matrix above permanently replaces
   `bun qa/run.ts team-composition-ui` with the fast
   `bun qa/run.ts team-composition`. This does not remove a WO-RD-2 assertion:
   the new `research-director-delegation` real-shell gate proves the exact
   Director/specialist tiles and four Kernel-equal Task facts; the focused
   `task-composition.test.ts` proves the renderer's assigned/unavailable DOM;
   and `team-composition` proves Task/link projection and lifecycle behavior.
3. Record the stale `.package-staging` resource-root defect in `docs/DEBT.md`,
   naming the trigger: repair or retire `team-composition-ui` before any order
   relies on it again. Do not make that repair inside WO-RD-2.
4. Do not run a third `team-composition-ui`, a second WO-RD-2 live product
   proof, or another WO-RD-1 front-door proof in the Builder lap. Run only:

```powershell
cd C:\Users\rybow\QuantFlow-Ontology
bun qa/run.ts team-composition
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts repo-shape
bun qa/run.ts one-skin
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
git diff --check
```

Full green permits the immutable candidate commit and push. The independent
Verifier runs the revised complete Acceptance matrix once. Because the second
rework cycle is exhausted, any verifier red stops WO-RD-2 for a founder-level
rewrite; there is no third implementation lap.

## Founder-authorized closure correction — stale production label set

The first Rework 2 command failed in 266 ms before any Task assertion:

```text
team-composition: FAIL invalid Dock display name: hermes-research-director
```

Exact cause: `qa/gates/team-composition.ts` line 71 still allows only
`Market Researcher`, `Orchestrator`, and `Critic`, while WO-RD-1 already
verified the production profile's exact friendly label `Research Director`.
This is a stale gate input contract, not a product or Task-projection failure.

Under the founder's 2026-08-15 umbrella delivery authority and fresh Reader
`01a007ca-d76b-7e83-a0b2-77e31750ffa0` YES/YES/NO PASS, one closure edit is
authorized: add exactly `Research Director` to that
local allowed-label set. Do not remove `Orchestrator` because QA fixtures still
use it. Do not change a product file, fixture row, Task assertion, receipt, or
any other gate logic. Re-run Rework 2's same eight-command list from the first
command. Full green permits the immutable candidate; any red stops with no
further correction.
