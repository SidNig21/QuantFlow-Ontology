# WO-V2-3 — compose a team

status: open
assignee: builder
depends: V2-1 founder accepted; V2-2 packaged matrix stopped
rung: R13 / V2-3
authorization: founder-via-NEXT

## In plain terms

Ryan adds two agents from the Dock, gives one of them a task, and sees that
assignment on the tiles. He can move the task to the other agent, cancel it, or
close a seat, and those changes survive because they live in the Kernel. If this
is wrong, QuantFlow still only launches idle terminals.

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
