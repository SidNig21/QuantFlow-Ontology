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

1. **Dock names the role first.** Production profiles show a human role
   (`Market Researcher`, `Orchestrator`, `Critic`) over the runtime
   (`Hermes · native CLI`). Machine ids like `hermes-worker-2` are not the
   primary label. QA / `ungranted` profiles stay out of the production Dock.
2. **Create and assign a Task from the app.** The founder creates one Task and
   assigns it to a live seat without typing a Kernel command. The write goes
   through `execute()`. The assignment is `task → assigned_to → agent_session`.
3. **The tile and ledger show the assignment.** The assigned seat's tile shows
   the Task title. The ledger shows who owns it. Close and reopen still show it.
4. **Redirect.** Reassign the Task to the other seat, cancel the Task, and close
   a seat. Each is a Kernel action with a visible result. UI-only state is a
   defect.

## Proof

Ryan opens the installed or `bun run dev` app, adds two seats, assigns a task,
sees it, reassigns it, cancels it. That is acceptance.

Builder tests, focused only:

- Dock role label test (production inventory, no `ungranted`)
- create / assign / reassign / cancel through `execute()`, then a Kernel read
  after a simulated reopen
- tile / ledger projection reads Kernel assignment, not a UI cache

No 19-command matrix. No installer loop. Falsify assign by dropping
`assigned_to` — the tile must go red, then restore green.

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
