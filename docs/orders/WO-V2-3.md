# WO-V2-3 — compose a team

status: stopped-for-founder
assignee: builder
depends: V2-1 founder accepted; V2-2 packaged matrix stopped
rung: R13 / V2-3
authorization: founder-via-NEXT
rework-cycle: 1 of 1
reauthorization: required

## In plain terms

Ryan adds two agents from the Dock, gives one of them a task, and sees that
assignment on the tiles. He can move the task to the other agent, cancel it, or
close a seat, and those changes survive because they live in the Kernel. If this
is wrong, QuantFlow still only launches idle terminals.

## V2-3.1 founder rework — binding over the original build

The original candidate `97ed7183dab1871b46b1a2a9c25bae309c2d4aa5` passed its
machine verifier and failed the founder's installed-app check on 2026-08-15.
This section is the only authorized rework. Where it conflicts with the
original Proof section, this section wins. The Kernel task actions, links,
events, schema migration, role labels, and projections already passed and must
not be rebuilt or reverted.

Founder receipt from the installed candidate:

```text
Create Task attempts: 3 clicks plus Enter, with one seat and with two
Kernel query after attempts: task: 0 rows
Main-process error shown to founder: none
Seat spawn: about 12 seconds with no visible pending state
```

In plain terms: Ryan could see a Create Task button, but pressing it created
nothing and told him nothing. With two tiles the button disappeared from the
tile he was looking at, and a slow seat launch looked broken because the app
showed no progress.

### Rework deliverables

1. **A real click creates exactly one Kernel Task or shows an error.** Trace the
   existing renderer event through preload and `qf:tasks:create`; repair the
   broken seam rather than bypassing it. Submitting a valid title, completion
   description, and running assignee from a running Orchestrator tile must
   add exactly one new Task, one new `delegated_by`, and one new `assigned_to`
   row for each isolated valid submission. A rejected submission adds zero new
   rows of those three types and renders the returned error in the same tile
   foot. Immediately after the first accepted click and until its response,
   disable and ignore additional submits.
2. **The control does not disappear behind tile focus.** Every running
   Orchestrator tile has a visible, hit-testable `Create Task` control after any
   other tile is selected or raised. Clicking a tile header or its
   non-interactive body selects it and gives it the highest canvas z-order; the
   grip remains the drag affordance. Form fields and action buttons must not
   trigger the raise handler, and already-entered form values remain byte-for-
   byte unchanged.
3. **Spawn acknowledges the click immediately.** Measure
   `pending_visible_ms` from the timestamp of the user activation event to the
   first rendered frame in which that activation's pending tile is visible and
   hit-testable; require `pending_visible_ms <= 250`. The canvas shows exactly
   one ephemeral pending tile with
   that profile's display name and `STARTING` state, and the Dock row reads
   `starting…` with duplicate activation disabled. Success reconciles that
   placeholder to the one live Kernel-backed seat. Failure changes the same
   placeholder to `FAILED — RETRY` with the returned reason; it never creates a
   fake `agent_session` row. Pending state is UI-only and is not restored after
   app restart.
4. **Add product-level proof of the three product seams.** The gate covers Task
   creation through the production renderer/preload/main/Kernel path; tile
   raise without control or input loss; and Dock spawn pending/success/failure
   through the production UI route. It clicks the production Dock activation
   control, proves the production preload/main spawn route creates exactly one
   Kernel-backed seat, and proves the same pending tile reconciles to it. Two
   activations before the first response are disabled or ignored. Extend the
   focused acceptance with one renderer-level gate that
   launches the production renderer with the production preload, clicks the
   rendered control, proves the preload invokes `qf:tasks:create`, proves the
   production main handler receives it, and proves that handler writes the
   reported rows to a temporary Kernel database. Fixture DOMs, injected or
   mocked preload/main handlers, test doubles, and direct calls to `execute()`,
   `projection()`, or the IPC handler fail the green production-path proof. It
   must not replace the
   existing Kernel-only `team-composition` gate. It must finish in under two
   minutes and print the Task/link row counts plus the pending-tile timing it
   measured.

### Rework acceptance

```powershell
bun qa/run.ts repo-shape
bun qa/run.ts kernel-sole-writer
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts one-skin
bun qa/run.ts team-composition
bun qa/run.ts team-composition-ui
bun qa/run.ts doc-links
git diff --check
```

`team-composition-ui` uses an actual renderer click and the production
renderer, preload, and main IPC route against a temporary Kernel. Its green
receipt includes:

```text
renderer_click=1 preload=production main_ipc=qf:tasks:create temporary_kernel=1
task_rows=1 delegated_by=1 assigned_to=1 create_errors=0
rejected_rows_added=0 rejected_error_in_tile=true duplicate_task_rows=0
background_controls=<unselected running Orchestrator count> header_raised=1 body_raised=1
grip_drag=1 form_preserved=1 action_controls_preserved=1
pending_visible_ms=<n <= 250> duplicate_spawns=0 failure_retry=true failure_reason=true
failed_spawn_session_rows_added=0 pending_restored_after_restart=0
```

For the z-order receipt, `background_controls` must equal the number of
unselected running Orchestrator tiles and each counted control must be visible
and hit-testable. `header_raised=1` and `body_raised=1` require separate header
and non-interactive-body clicks to give the clicked tile the highest canvas
z-order. `grip_drag=1` requires a grip drag without the header/body raise action
firing. `form_preserved=1` and `action_controls_preserved=1` require clicking
every field and action button without raising the tile and with every entered
field value byte-for-byte unchanged. The gate also proves that a rejected
submission adds zero Task or identity-link rows and renders its returned error
in the submitting tile; two submit activations before the first response add
one Task; a failed spawn keeps the same tile showing `FAILED — RETRY` plus the
returned reason and adds zero `agent_session` rows; and restarting while a
spawn is pending restores no pending tile.

Falsify it by disconnecting only the Create Task control's dispatch while the
button still renders. The gate must exit nonzero with
`task_rows=0 dead_control=true`. Restore the dispatch and rerun the same command
green. Then delay the external spawn completion beyond one second after the
production renderer/preload/main route has been crossed, without replacing
those layers or the Kernel: the pending placeholder must still appear within
250 ms. Test doubles remain forbidden in the green proof; this delayed external
completion is allowed only in the falsification run. These are the only new
falsification receipts.

### Rework exclusions and stop

Do not repair closed-tile lifecycle, cables, Dock information architecture,
GLACIER styling, cross-species routing, or the long Windows harness in this
lap. Do not package the app, run `verify-release`, create verification helpers,
or add a dependency. If the renderer-level proof cannot exercise the
production preload/main IPC route in this checkout, stop and report the exact
seam instead of substituting a machine-only unit test. A failed Builder or
Verifier rework stops V2-3 for founder decision; there is no second rework lap.

### V2-3.1 Builder stop — 2026-08-15

The sole founder-rework Builder lap stopped red before commit or push. Preserve
the uncommitted implementation and gate files for founder disposition; they are
not an accepted candidate.

```text
team-composition-ui: FAIL first live Kernel seat timed out
[json-rpc] Listening on \\.\pipe\collaborator-13903476-ipc
[pty] createHostCommandSession ok sessionId=d41921ad8f12cdfa
[pty] session.exited sessionId=d41921ad8f12cdfa exitCode=1
```

Measured seam: the production Dock activation and immediate pending-tile route
ran, but the staged Claude native adapter exited with code 1 before it created
a running Kernel seat. The UI gate therefore never reached its Task-click
receipt. No verifier may start, no product change may be committed, and no
second Builder lap is authorized until the founder decides whether to discard
the uncommitted work, reauthorize a bounded gate-fixture correction, or rewrite
the order.

## Objective

Deliver the V2-3 founder promise from `docs/proposals/V2-SCOPE.md`: compose a
team by hand, with no hidden orchestrator.

## Work here only

- This checkout only. Branch name `wo-V2-3` is fine. No extra folder or worktree.
- Do not run `bun qa/verify-release.ts`.
- Do not run packaged Windows gates or `hermes-first-turn-synthetic`.
- Do not edit `WO-V2-2.md` or resume its matrix.
- Do not add a dependency or handle credentials.

## Already true — do not rebuild

Kernel `create_task`, `assigned_to`, and `delegated_by` exist. Dock launch of
Hermes seats exists. Glacier tile spine stays 44px / vertical id / grip. Do not
re-skin the Dock.

## Deliverables

1. **Dock names the role first and explains readiness.** A production profile
   is one loaded from the production `species/*/dock-profiles.json` inventory,
   never a QA fixture or an id containing `ungranted`. Every production profile
   has one required `display_name`: `Market Researcher`, `Orchestrator`, or
   `Critic`. Missing or unknown display names fail the inventory gate; the UI
   must not fall back to the machine id. The primary row is `display_name`; the
   secondary row is `Hermes · native CLI` or `Claude Code · native CLI`, derived
   from its adapter. Each row also shows its capability groups and a per-profile
   readiness dot. A non-ready row states its own actionable reason; no global
   readiness footnote satisfies this deliverable.
2. **Create and assign one Task from the app.** A `Create Task` control lives in
   the selected delegator/orchestrator tile foot, not in a detached side panel.
   It requires a non-empty title, non-empty completion description, and one
   assignee selected from currently `running` sessions. Submit calls the existing
   `create_task` action through `execute()` with trusted delegator context;
   creation and initial assignment are one atomic action. The Kernel writes
   exactly one `delegated_by` and one `assigned_to` link.
3. **Project assignment from Kernel truth.** The assigned seat's tile fact strip
   shows the open Task title and `OPEN`; the Dock Active row for that same seat
   shows `Owns: <Task title>`. Both projections read the Task plus its exact-one
   `assigned_to` link from the Kernel. With no assignment they show `No task`;
   missing or duplicate assignment links show `Assignment unavailable` and must
   never retain a stale title. Closing and reopening the app produces the same
   title, status, and owner from the same Kernel rows.
4. **Add exactly two governed Task actions.** `reassign_task(task_id,
   assignee_session_id)` is allowed only for an `open` Task and a different
   `running` session. It atomically replaces the one `assigned_to` link and
   preserves `delegated_by`. `cancel_task(task_id)` changes only an `open` Task
   to `cancelled`; it preserves both identity links for provenance. Both actions
   are schema-defined, generated, routed through `execute()`, event-receipted,
   and reject unknown Tasks, non-running assignees, illegal status, and no-op
   reassignment without writing anything.
5. **Redirect and close visibly.** `Reassign` and `Cancel` controls live in the
   Task fact strip/tile foot. After reassign, the old seat shows `No task` and
   the second running seat shows the title. After cancel, the owning tile shows
   the title plus `CANCELLED`, and its Dock row no longer claims active work.
   Closing a seat that owns an open Task is refused on screen with `Reassign or
   cancel this task before closing the seat.` After reassign or cancel, the
   existing governed close action is allowed and the tile shows `CLOSED`.

## Exact contract definitions

- **Inventory and profile precedence.** Production means exactly the manifests
  named by `PRODUCTION_DOCK_PROFILE_MANIFESTS`, in that array's order. QA mode
  is false. Duplicate definition ids across those manifests are a contract
  error; no file wins by precedence. `display_name` is added to each profile,
  to `agent_definition`, and to `register_agent_definition`, so the runtime Dock
  still reads the Kernel rather than reopening manifests.
- **Capability display.** The source is the selected Kernel
  `agent_definition.capability_groups` value written by profile bootstrap.
  Render the existing groups in stored order using exactly these labels:
  `desk.orchestrate` → `Orchestrate`, `market.read` → `Market read`, and
  `research.evaluate` → `Evaluate research`, comma-separated. An empty list
  renders `No capabilities`; an unknown group is a contract error, not text the
  UI invents.
- **Readiness.** The sole source is main-process
  `getDockDefinitionAvailability(agent_definition)`, extended to return a
  non-null result for every production adapter. `available=true` means the
  package, required bridge resources, platform/WSL target, and launch command
  resolve without reading credentials; show a green dot and `Ready to launch`.
  `available=false` shows a red dot and the function's per-profile `message`,
  which must state the missing prerequisite and one next action. Authentication
  remains launch-time only and is never inspected by readiness.
- **Trusted delegator.** The selected delegator tile's Kernel `agent_session.id`
  is supplied by Electron main—not renderer input—as
  `TrustedExecutionContext.actor_session_id`. The Kernel accepts it only when
  that session exists and is `running`. The assignee is independently selected
  from Kernel sessions whose status is `running`.
- **Receipts.** Successful `reassign_task` appends `task.reassigned`; successful
  `cancel_task` appends `task.cancelled`. Each is one row in the existing
  append-only `events` table, in the same transaction as the Task/link change,
  with `object_type=task`, `object_id=<task_id>`, the trusted trace id, and a
  payload containing `command`, `previous_assignee_session_id`, and
  `assignee_session_id` (the preserved final assignee for cancel). Rejections
  append no event and change no Task or link.
- **Reopen proof.** The focused gate closes its Kernel handle, opens a new
  Kernel handle against the same temporary database, and constructs a new
  projection reader with no carried renderer objects. The founder proof closes
  and reopens the development app from this same checkout.

## Proof

Ryan runs the app from this checkout with `bun run dev`, adds two seats, creates
one Task from the orchestrator tile, assigns it to seat A, sees it on seat A and
in Dock Active, reassigns it to seat B, cancels it, then closes seat B. He
reopens the app and sees the cancelled Task, final owner, and closed seat from
Kernel state. That is acceptance; this order does not rebuild an installer.

Builder commands, focused and bounded:

```powershell
bun qa/run.ts repo-shape
bun qa/run.ts kernel-sole-writer
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts one-skin
bun qa/run.ts team-composition
bun qa/run.ts doc-links
git diff --check
```

`team-composition` is one focused gate and must finish within two minutes. It
loads the production profile inventory, exercises create / assign / reassign /
cancel through `execute()`, closes and reopens a fresh Kernel reader on the same
temporary database, and renders the tile/Dock projection from those rows. It
goes red on a missing role label, QA/ungranted production profile, UI-cached
assignment, illegal/no-op action that writes, or lost reopen state.

No 19-command matrix. No installer loop. Falsify the focused gate by removing
the fixture Task's `assigned_to` link: the projection must return the named
`Assignment unavailable` failure and the gate must exit nonzero. Restore the
exact-one link and show the same command green. This red/green pair is the only
new falsification proof required by this order.

## Out of scope

V2-2 live Hermes research turn. V2-4 critic routing. V2-5 research-object tiles.
V2-6 orchestrator hiring. Recipes. RL. Visual redesign of the spine. New
truth stores.

## Stop

Need files outside this product surface, a new dependency, credentials, or a
second verification factory: stop and report. Two failed attempts: stop.

## Report back

One sentence Ryan can read. What he can click. The short test command and its
output. What you did not do.
