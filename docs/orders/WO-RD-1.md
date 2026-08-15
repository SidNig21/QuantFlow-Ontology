# WO-RD-1 — Research Director front door

status: Director-tile lifecycle repair Builder open — Reader PASS `01a00788-119e-7003-aad8-2afe70f153a2`
assignee: builder
depends: WO-NORTHSTAR-1 PASS; R13 founder-closed with its packaging-proof gap recorded; WO-V2-3R candidate `a530c27` independently verified
rung: R14 / slice 1 — conversation, durable mission, exact Director session
authorization: founder goal 2026-08-15; routed after adversarial Reader PASS
rework-cycle: 1 of 1 exhausted; one founder-goal reauthorization is limited below

## In plain terms

Ryan gets one trustworthy place to ask a research question; if this is wrong,
the question can disappear or open the wrong worker without showing what happened.

## Outcome

Ryan opens QuantFlow, asks one bounded sports-research question through the
visible Research Director surface, and immediately sees a durable Mission plus
one live canvas tile for the exact custom Hermes profile
`hermes-research-director`. The session receives the Mission activation and is
available for continued conversation in its native Hermes tile.

This is the first honest vertical slice of R14. It proves the front door and
identity, not the rest of R14. It does not yet claim autonomous recruiting,
durable Task assignment, all five steering controls, independent review, live
market coverage, research judgment, learning, recall, or a finished Dock.

## Founder language

QuantFlow opens with one clear place to start: **Research Director**. Ask it a
question such as “NFL Week 2 is coming up; use Strategy qf-nfl-v1 and tell me
what data coverage we have before looking for opportunities.” QuantFlow records
that intent before the model acts, opens the Director on the canvas, and shows
the Mission in the research ledger. It never places a bet or invents coverage.

## Context pack

Read only:

- `START_HERE.md`
- `docs/orders/PROTOCOL.md`
- this order
- `docs/DOCTRINE.md` A10
- `species/hermes/dock-profiles.json`
- `species/hermes/prompts/orchestrator.md`
- `collab-electron/src/main/dock-profiles.ts`
- `collab-electron/src/preload/shell.ts`
- `collab-electron/src/main/mission-activation.ts`
- `collab-electron/src/main/ipc-kernel.ts`
- `collab-electron/src/main/index.ts`
- `collab-electron/cli/qf-hermes-launch.sh`
- `collab-electron/cli/qf-hermes-synthetic-responder.mjs`
- `collab-electron/src/windows/shell/index.html`
- `collab-electron/src/windows/shell/src/dock.js`
- `collab-electron/src/windows/shell/src/tile-renderer.js`
- `collab-electron/src/windows/shell/src/tile-manager.js`
- `qa/run.ts`
- `qa/gates/kernel-sole-writer.ts`

## Deliverables

### A. One exact custom Hermes profile

Replace the temporary production manifest profile `hermes-orchestrator` with:

```yaml
id: hermes-research-director
role: orchestrator
display_name: Research Director
runtime_profile: default
system_prompt_ref: prompts/research-director.md
capability_groups: [desk.orchestrate]
```

This is an exact production-profile contract, not an example. The production
Hermes manifest must contain exactly one entry with those six values, with id
`hermes-research-director`; it must contain no `hermes-orchestrator` entry. The
package-owned prompt is exactly
`species/hermes/prompts/research-director.md`, and profile validation must
reject a missing Director, a duplicate Director, the old id, or any other
prompt ref for that id before it calls the Kernel. QA proof profiles may remain
in QA-only manifests, and an explicit handler override may still select one;
neither changes the production default.

Add that prompt as a tracked package-owned file. It tells the Director:

- the founder Mission is its charter;
- it uses only QuantFlow MCP/ontology tools and exact Kernel identities;
- it must report missing data or Strategy/Technique coverage visibly instead
  of fabricating facts;
- it may recruit governed specialists only through a later authorized slice;
  this slice does not recruit or assign a Task, and it may not pretend it did
  until the Kernel records one; and
- it never places bets or trades.

The old `hermes-orchestrator` is absent from the production Hermes manifest and
is never the default question target. Historical Kernel rows are not deleted in
this slice; `DEBT.md` #35 remains the explicit retirement/reconciliation gap.
The active isolated proof Kernel must contain exactly one new Director
definition. Do not rename the role: `orchestrator` deliberately retains the
existing focused three-tool roster for this slice.

Update `DOCK_DISPLAY_NAMES`, `DockDisplayName`, and the exact error contract in
`collab-electron/src/main/dock-profiles.ts` (plus its focused tests) so
`Research Director` is a valid exact value. The rejection text must enumerate
the four allowed values in this order: `Market Researcher, Orchestrator,
Research Director, or Critic`. Do not relax exact manifest-key, stable-profile,
prompt-ref, or capability validation.

### B. Research Director is the default conversation front door

The visible shell heading is exactly `Research Director`, not `Agent workspace`
or `Ask QuantFlow`. Its textarea placeholder is exactly
`Ask the Research Director about a bounded market mission…`. The specialist
catalog remains below as optional manual control.

The renderer submits through the existing preload method
`window.shellApi.qf.submitResearchQuestion`; it does not gain a second question
API. With `definitionId`/`definition_id` omitted and `QF_DOCK_QA_MODE` unset or
not `1`, both production handlers must select
`hermes-research-director`. With QA mode set, both retain
`qf-proof-orchestrator`; a non-empty explicit definition override wins in the
same way it does today. The focused UI proof exercises the first, production
case, not a QA or explicit override.

Submitting through the existing form must traverse renderer → preload → main →
Kernel. Both production handlers — IPC `qf:research:submitQuestion` and RPC
`qf.research.submit_question` — default to
`hermes-research-director`. Their explicit `definitionId`/`definition_id` proof
override and QA-mode `qf-proof-orchestrator` behavior remain unchanged.

The returned visible status is exactly `Research Director running · Mission <missionId>`,
with the returned Mission id substituted for `<missionId>`. The form is
disabled only while admission is in flight; an error restores the founder's
question and displays the real error.

### C. Kernel truth appears without manual composition

One successful form submission creates, through existing Kernel commands:

- exactly one Mission whose objective is the founder's exact trimmed question;
- exactly one open Hypothesis created by the existing question path;
- exactly one running `agent_session` with exactly one `spawned_from` link to
  `hermes-research-director`; and
- one native-Hermes canvas tile for that exact session.

“Exactly one” means one new row relative to the empty isolated proof Kernel for
this submission, not that a founder's already-used Kernel is wiped. The returned
Mission, Hypothesis, session, link, and tile identities must all bind to that
same submission. The proof stops after this front-door state; it neither waits
for nor asserts worker, Task, Run, Artifact, Evaluation, or Report behavior.

The Mission is visible in the existing research ledger with its objective. The
tile shows the friendly `Research Director` label and exposes exact non-visible
DOM identity as
`data-definition-id="hermes-research-director"` and
`data-session-id="<returned session id>"`. Obtain the friendly label from the
Kernel definition; do not create a renderer-only identity table.

Update the bounded `qf.mission.activation.v1` instruction so it addresses the
Research Director contract: acknowledge the founder Mission, use only
QuantFlow tools, report coverage/refusal honestly, plan future governed work
with exact IDs without recruiting in this slice, and never place a bet or
trade. Retain its JSON-safe byte limits, single post-readiness write, Mission
id, and exact question.

No Mission, Hypothesis, session, tile, or status may depend on direct SQLite
writes, renderer-local durable state, a manually spawned seat, or the Dock
catalog button.

### D. One fast product proof

Add the registered gate `research-director-front-door`. It starts the public
`bun run dev` entrypoint from `collab-electron` against an isolated Kernel and
the tracked repository resource root, using the existing deterministic Hermes
responder only to avoid model cost. It runs on native Windows, sets
`QF_HERMES_SYNTHETIC_TEST=1`, explicitly unsets `QF_DOCK_QA_MODE` and any
definition override, and therefore exercises the production Director default
through the real Hermes launcher/PTY/gateway seam. It must drive the actual
textarea/form in the real Electron renderer by filling the DOM control and
submitting that form. The existing app control channel is allowed only for
readiness, DOM input/form submission, DOM observation, and shutdown. The gate
may not invoke a product action RPC, preload method, submit-question RPC,
`qf.dock.spawn`, or `execute()` directly; it may not mock the renderer, preload,
main handler, Kernel, or responder; and it may not use `.package-staging`.

The proof must emit and assert a production-boundary receipt showing the one
submission crossed renderer form → preload IPC
`qf:research:submitQuestion` → main IPC handler → Kernel command. A proof that
only sees status text, invokes the exposed API directly, or reads a UI fixture
is red. `QF_UI_PROOF` instrumentation may report these boundaries, but it must
not change admission, return values, or Kernel behavior.

The gate independently opens its isolated Kernel SQLite file read-only after
the UI action, in a separate oracle path that uses no app API. The oracle takes
its own before/after byte and mtime snapshot and fails if a read changes the
database. Add only this named gate to the existing read-only driver-SQL
allowlist, with a comment identifying it as an independent UI-proof oracle;
never allowlist the whole `qa/gates` tree.

It proves all Deliverable C rows/links, the exact visible Mission ledger row,
the exact friendly Director tile, the returned Mission-id status, and no
`hermes-orchestrator` session. It does not click or invoke the Dock catalog and
reports `manual_dock_composition=0`. It closes the app and reports separate
baseline-subtracted counts for the owned Electron process tree, Electron
processes, Hermes processes, and disposable roots. It fails if any count is
non-zero or if the repository tree differs from its pre-run snapshot.

The 120,000 ms ceiling is a hard wall-clock deadline starting before the first
child spawn and including UI proof, oracle reads, shutdown, and cleanup. A
watchdog must terminate the owned process tree at the deadline, record any
remaining process/root as a failure, and make the gate exit non-zero by the
deadline; cleanup may not contain an unbounded await after the watchdog fires.
The production deadline is the literal 120,000 ms and is not environment
overridable; only the watchdog helper's unit test may inject a shorter clock.
The timeout receipt always prints `elapsed_ms`, including the red path.

Falsify before green in disposable manifest copies:

1. replace only the Director id with `hermes-orchestrator`; discovery must be
   red because the required stable Director is missing; and
2. change only the Director prompt ref back to `prompts/orchestrator.md`;
   discovery/profile validation must be red because the custom prompt contract
   is missing; and
3. in a disposable product-source copy, bypass the form's production preload
   submission or the automatic session-tile projection; the boundary/tile
   assertions must be red; and
4. in a disposable gate-input copy, retain one owned process/root during
   cleanup and run the receipt validators; the process-tree and root checks
   must be red, then green after restoration. The watchdog helper is also
   tested with an injected short deadline and a never-settling task; it must
   return red without an unbounded cleanup wait. Restore all inputs before the
   real proof.

Restore the disposable inputs, then run the real UI proof against untouched
repository assets. The repository tree must be byte-identical before/after.

Required green receipt:

```text
falsifier=old-orchestrator-id result=red
falsifier=generic-orchestrator-prompt result=red
falsifier=ui-boundary-or-auto-tile-shortcut result=red
falsifier=cleanup-retained-process-or-root result=red
falsifier=watchdog-never-settles result=red
production_manifest_director=hermes-research-director exact=true
production_manifest_old_orchestrator_entries=0
default_ipc_definition=hermes-research-director
default_rpc_definition=hermes-research-director
qa_override_preserved=true explicit_override_preserved=true
front_door=Research Director
renderer_form_submit=1 preload_ipc=qf:research:submitQuestion main_ipc=qf:research:submitQuestion
mission_rows_added=1 hypothesis_rows_added=1
director_definition=hermes-research-director
director_sessions_added=1 spawned_from_exact=1
mission_visible=true director_tile_visible=true manual_dock_composition=0
old_orchestrator_sessions_added=0
oracle=independent_read_only kernel_unchanged_after_oracle=true
convergence_remaining=[]
owned_process_tree_remaining=0 electron_processes_remaining=0 hermes_processes_remaining=0 roots_remaining=0
repository_tree_unchanged=true
elapsed_ms=<value less than 120000>
PASS research-director-front-door
```

## Acceptance

Builder runs once, in order:

```powershell
cd collab-electron
bun test src/main/mission-activation.test.ts src/main/dock-profiles.test.ts src/windows/shell/src/dock.test.ts src/windows/shell/src/tile-renderer.test.ts
cd ..
bun test qa/gates/research-director-front-door.test.ts
bun qa/run.ts research-director-front-door
bun qa/run.ts repo-shape
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts one-skin
bun qa/run.ts doc-links
git diff --check
```

A fresh independent Verifier records candidate SHA/status/upstream before and
after, runs this matrix once, and changes no product file. Any red, SHA change,
tracked change, leak, missing receipt, or 120-second focused-gate breach stops
the slice. No release verifier, installer, package gate, long soak, worktree,
clone, or helper framework.

On PASS, Verifier writes the concise receipt at
`docs/orders/evidence/wo-rd-1/VERIFICATION.md`, marks this order done, closes
the Builder door in `NEXT.md`, commits only those docs, and pushes `wo-V2-3`.

## Visible acceptance

After machine PASS, the router may use Computer Use on an isolated ordinary-dev
app to submit one bounded founder-style sports question. It accepts only seeing
the exact Mission id, `Research Director running`, a friendly Director tile,
and the Mission objective in the ledger. It does not judge market research,
authorize bets, or claim the rest of R14.

## Scope

Allowed product surfaces: the Hermes production profile/prompt; exact profile
validation; both existing submit-question handlers; Mission activation;
Research Director copy/status; tile identity/label projection; the new focused
gate and its registration/read-only allowlist entry; directly related tests.

No new dependency, schema object/action/link, database, state store, adapter,
tool, credential read, network integration, live market feed, Task behavior,
critic path, RL code, recall, Dock redesign, or report publication.

## Stop

Stop if the form cannot reach the exact profile without changing schema or
adding a dependency; if a pass criterion must weaken; if a product file outside
the allowed surfaces is required; if the same assertion is red twice after one
scoped fix; or if the focused gate exceeds 120 seconds. Never place bets or
trades.

## Report

Open with what Ryan can now do. Bind every claim to the candidate SHA and named
gate receipt. State plainly that recruiting/Task assignment and research
judgment are next, not shipped.

## Rework — bounded cleanup convergence

The first Builder pass implemented the product path and reached its live proof
in under three seconds. Its inner cleanup receipt sampled the owned process tree
immediately after app shutdown and observed `3`, then `1`, descendant processes.
In both attempts the unchanged outer cleanup then measured zero owned processes
and zero roots. This names a receipt-timing defect, not permission to ignore or
subtract a live process.

One gate-only rework is authorized after Reader PASS:

1. After `app.shutdown` and the public `bun run dev` parent exit, and before the
   proof returns its `launchPids`, poll the already-captured exact `launchPids`
   until every PID is absent. Here “owned” has one meaning: the PID values in
   that set, captured once by the existing `collectOwnedPids` launch receipt.
   Each poll takes a fresh `processSnapshot()` and checks only PID membership;
   do not recapture ownership or infer it from a parent, name, path, or process
   family.
2. The convergence wait starts after that shutdown/parent-exit point and is
   bounded by the smaller of 5,000 ms and the gate's existing absolute
   120,000 ms deadline. It is observation only: it may not kill, subtract,
   rename, or reclassify a process to obtain green. Any owned PID still alive
   at that bound must make the convergence check red with
   `owned_process_tree_remaining` non-zero; a later outer cleanup receipt may
   report what teardown achieved, but it may not turn this red result green.
3. Only after this bounded convergence reports zero remaining `launchPids` may
   the existing green cleanup receipt be asserted. The existing outer `finally`
   remains responsible for best-effort teardown after a red result or watchdog
   deadline; that teardown is never part of convergence and never earns green.

No product code, existing assertion, pass criterion, existing timeout, fixture,
baseline, process ownership rule, root cleanup, or other gate behavior may
change. The only new wait is the bounded natural-exit poll above; the literal
120,000 ms wall-clock deadline remains hard and non-overridable. The rework
Builder runs exactly:

```powershell
bun test qa/gates/research-director-front-door.test.ts
bun qa/run.ts research-director-front-door
git diff --check
```

Any red stops. Full green commits and pushes the complete authorized WO-RD-1
candidate for one fresh independent Verifier, which owns the full Acceptance
matrix once.

## Reauthorization — synthetic responder owns its input lifetime

The bounded convergence rework still observed one captured process until the
outer kill. The gate did not record that row, so no product process identity is
claimed. Static inspection names one concrete handle defect in the new
Director-only proof path: `PtyLineReader` attaches a `data` listener to stdin;
the Director early-return stops both MCP children but never pauses that input,
so the synthetic responder may keep its Node event loop alive after emitting
`turn: complete`.

This is one narrowly reauthorized diagnostic-and-repair pass under the
founder's active goal to finish the slice without per-assertion approval. In
plain terms: the synthetic proof responder must stop listening to its own
input when its turn ends, and a cleanup failure must show exactly which
captured process is still alive.

1. In `collab-electron/cli/qf-hermes-synthetic-responder.mjs`, give
   `PtyLineReader` exactly one idempotent disposal method. Disposal must reject
   and remove every pending `next()` waiter (never leave one pending or resolve
   it as a successful input line), and must pause only the input stream passed
   to that reader. It must not end or destroy `process.stdin`, touch a parent
   or real-Hermes stream, or change any other responder state. The method must
   remain safe when called again, including when the reader was already closed
   by EOF or error. Call it from `run()`'s existing `finally` after both MCP
   clients stop, including when startup or the role flow throws. This file is
   reached only by the synthetic-test path; do not change activation parsing,
   boundaries, role flows, production Hermes, or any other product behavior.
2. In `qa/gates/research-director-front-door.ts`, retain the bounded natural
   convergence check against the exact `launchPids` set captured once by the
   existing launch receipt. Each poll may take a fresh `processSnapshot()`, but
   diagnostics must filter the final snapshot by that same PID set and may not
   recapture ownership or infer it from names, paths, parents, or families.
   Immediately before the existing non-zero convergence assertion, print one
   JSON line named `convergence_remaining` whose array contains exactly the
   remaining captured rows and exactly these keys: `pid`, `parent_pid`, `name`,
   `executable_path`, and `command_line`. Print
   `convergence_remaining=[]` on the zero-remaining path. Diagnostics do not
   alter the PID set, the zero-process acceptance, any count, or any assertion.

Allowed edits are exactly those two files. The command sequence is one-shot:
invoke no command more than once, stop at the first non-zero result, and do not
retry, apply another fix, or run a later command after red. Run once:

```powershell
bun test qa/gates/research-director-front-door.test.ts
bun qa/run.ts research-director-front-door
git diff --check
```

If the focused gate's convergence assertion is red, it must first print the
exact `convergence_remaining` row(s) described above for the founder's
decision. A unit-test or `git diff --check` red has no process row to print and
still stops the pass immediately; it must not be disguised as a convergence
red. No further attempt is implied after any red. Full green commits and
pushes the complete WO-RD-1 candidate for one fresh independent Verifier and
does not reopen the rework cycle.

## Tooling correction — root the falsifier at its survivor

The reauthorized pass stopped before the live product proof: its cleanup
falsifier failed before the gate advanced to that proof. Its cleanup falsifier
calls `collectOwnedPids(before, after, process.pid)`, which roots ownership at
the gate process. Because `processSnapshot()` itself launches a short-lived
PowerShell child under that process, the falsifier can report its own
measurement helper as a leak after the deliberately retained survivor was
already terminated. The falsifier is awaited before the live proof, and the
live convergence function emits `convergence_remaining` on both its normal
green and red exits; therefore its absence in this early-red receipt proves
that live convergence was not reached. Absence by itself proves only that no
convergence receipt was emitted, not why.

This is a tooling correction, not another product rework. In
`qa/gates/research-director-front-door.ts`, the only permitted source diff is
this one-line root substitution:

```diff
- const owned = [...collectOwnedPids(before, after, process.pid)].filter((pid) =>
+ const owned = [...collectOwnedPids(before, after, survivor.pid)].filter((pid) =>
```

The survivor is the falsifier's owned root; its descendants, if any, remain
included, while transient `processSnapshot()` children under the gate process
are excluded from both the falsifier's owned set and its restored-green
receipt. The live proof's existing `bun run dev` ownership root remains
`child.pid`. Do not change its cleanup assertion, process snapshots, responder,
product code, or any other source line.

Invoke each listed command at most once, in order. Stop at the first non-zero
result; run no later command and make no retry or second attempt:

```powershell
bun test qa/gates/research-director-front-door.test.ts
bun qa/run.ts research-director-front-door
git diff --check
```

Any red stops the slice for the founder. Full green commits and pushes the
complete authorized candidate for one fresh independent Verifier.

## Tooling correction — valid isolated app directory

After the falsifier root was corrected, the live proof timed out waiting for
application readiness with zero leaked processes/roots and an unchanged repo.
Static inspection gives one exact pre-boot cause: the gate sets
`QF_APP_ROOT=<runRoot>/app-root` but sets
`QF_APP_DIR=<runRoot>/app-dir` as its sibling. Existing `paths.ts` rejects that
before RPC startup because `QF_APP_DIR` must be contained beneath
`QF_APP_ROOT`. The independently green `dev-dock-readiness` gate uses
`QF_APP_DIR=<appRoot>/app`.

This is one gate-fixture correction. In
`qa/gates/research-director-front-door.ts`, change only the `appDir` declaration
from `join(runRoot, "app-dir")` to `join(appRoot, "app")`. Do not change product
code, environment contracts, readiness criteria, timeout, output capture,
cleanup, or any other line.

Run each command at most once and stop at first red:

```powershell
bun test qa/gates/research-director-front-door.test.ts
bun qa/run.ts research-director-front-door
git diff --check
```

Any red stops the slice for the founder. Full green commits and pushes the
complete authorized candidate for one fresh independent Verifier.

## Compatibility amendment — Kernel accepts the ratified Director label

After the isolated app directory was corrected, the application built cleanly
but the live proof still timed out before RPC readiness. Static inspection
names the first product blocker: `packages/qf-kernel/src/create.ts` rejects the
ratified exact `display_name: Research Director` while
`collab-electron/src/main/dock-profiles.ts` and the production manifest accept
it. Profile bootstrap runs before the RPC server starts, so this stale Kernel
enumeration aborts startup.

This amendment authorizes only the compatibility needed for Deliverable A:

1. In `packages/qf-kernel/src/create.ts`, add exact `Research Director` to the
   accepted `display_name` values. Update the rejection message to enumerate
   the four accepted labels in this order: `Market Researcher`,
   `Orchestrator`, `Research Director`, `Critic`.
2. In `packages/qf-kernel/src/kernel.test.ts`, add one focused contract test
   proving a definition with exact `display_name: Research Director` is
   accepted and persisted, and that an unknown display name is still rejected
   with the four-value error. Do not change schemas, commands, actions, links,
   defaults, roles, capabilities, or any other Kernel behavior.

The only newly allowed product files are those two Kernel files. All prior
WO-RD-1 scope and assertions remain unchanged. The Builder runs each command
at most once, in order, and stops at the first red:

```powershell
bun qa/run.ts kernel
bun test qa/gates/research-director-front-door.test.ts
bun qa/run.ts research-director-front-door
git diff --check
```

Full green commits and pushes the complete authorized WO-RD-1 candidate for
one fresh independent Verifier. Any red stops; no assertion, timing limit,
fixture, or acceptance criterion may be weakened.

The canonical `kernel` gate above is load-bearing. Running the test path from
the repository root does not resolve `qf-kernel-schema/commands`; in this
checkout the package-local dependency directory was also present but empty.
`qa/run.ts` already defines `kernel` through `bunPackageGate`, which performs a
frozen install in `packages/qf-kernel` and then runs that package's unmodified
test suite. Reuse that existing gate. Do not create another installer, helper,
or dependency workaround. This changes only how the existing Kernel suite is
prepared and invoked; it does not change test scope, product implementation,
or acceptance criteria.

## Baseline correction — R11a fixture represents its historical schema

The first canonical Kernel gate stopped in 3.143 seconds with 86 passing tests
and one failure: `R11a deterministic local execution > upgrades an existing
R10 database in place` expected `deterministic_execution` and received
`partial`. Read-only diagnosis `01a00755-a34a-7652-94f1-cfcc33c99b25`
established that this failure cannot enter either WO-RD-1 Kernel edit: the R11a
test owns a separate in-memory database and calls only schema-shape upgrade
logic.

The fixture begins with today's generated migration and removes historical
metadata to recreate the pre-R11a shape. Commit `97ed7183` later added
`reassign_task` and `cancel_task` metadata, but the fixture still removes only
`performed_by`. The production classifier already excludes all three rows when
constructing the corresponding historical expectation. The fixture therefore
describes no historical schema and correctly classifies as `partial`.

Authorize exactly one test-fixture correction in
`packages/qf-kernel/src/r11a-deterministic-execution.test.ts`: in the existing
`upgrades an existing R10 database in place` setup, delete the
`schema_meta` rows for exact type names `performed_by`, `reassign_task`, and
`cancel_task` before classification. Use one literal, deterministic deletion
statement. Do not edit `upgrade.ts`, generated migration/schema files, product
code, expected classifications, or any assertion.

Then run each command at most once, in order, and stop on first red:

```powershell
bun qa/run.ts kernel
bun test qa/gates/research-director-front-door.test.ts
bun qa/run.ts research-director-front-door
git diff --check
```

This correction must make the historical fixture accurate; it may not skip,
relax, rename, or narrow the Kernel suite. Full green commits and pushes the
complete WO-RD-1 candidate for a fresh independent Verifier. Any red stops.

## Baseline correction supplement — remove the two 0010 table shapes

The approved metadata deletion ran and the same assertion remained red. Exact
read-only comparison `01a0075f-3fae-7bf2-9be8-b7156db3c9e7` found no remaining
link or `schema_meta` mismatch. It found exactly two current table definitions
that the historical fixture still retained:

- `agent_definition` still has 0010's `display_name TEXT NOT NULL` column;
- `task` still allows 0010's `cancelled` status instead of exact historical
  `CHECK (status IN ('open', 'done'))`.

`classifyKernelShape()` compares normalized `sqlite_master` DDL, so row deletion
cannot correct either difference. Authorize only the existing isolated fixture
test file, `packages/qf-kernel/src/r11a-deterministic-execution.test.ts`, to
rebuild those two empty fixture tables after its metadata/link reconstruction:

1. Rebuild `agent_definition` with exact historical columns `id`, `created_at`,
   `name`, `role`, `package_ref`, nullable `system_prompt_ref`, nullable
   `runtime_profile`, and `capability_groups`; preserve rows through an explicit
   column-list `INSERT ... SELECT`; omit only `display_name`.
2. Rebuild `task` with exact historical columns `id`, `created_at`, `title`,
   `description`, and `status`, plus exact
   `CHECK (status IN ('open', 'done'))`; preserve rows through an explicit
   column-list `INSERT ... SELECT`.
3. Add two focused under-repaired controls in the same test file: one fixture
   retaining only `display_name`, and one retaining only the `cancelled` status,
   must each classify as `partial`. These controls must call the real
   `classifyKernelShape()` and may not mock, replace, or copy its implementation.

Use one literal `raw.exec` block for the two production-fixture rebuilds. Test
helpers may remove duplication for the two controls only if they remain local
to this test file and expose which single 0010 shape is retained. Do not edit
`upgrade.ts`, generated schema/migrations, product code, expected classifications,
or any existing assertion. Do not force or stub a classification result.

Run the unchanged one-shot matrix from the preceding section. Full green
commits and pushes the complete candidate for one fresh independent Verifier;
any red stops with no retry.

## Gate diagnostic — one receipt identifies the live timeout boundary

The historical fixture correction is proven: `bun qa/run.ts kernel` passed
89/89 in 2.61 seconds, and the focused gate unit tests passed 3/3 in 0.52
seconds. The single live invocation passed all five falsifiers, then timed out
at 121,159 ms waiting for the four-part visible predicate; cleanup reported
zero processes and zero roots. It did not reveal which predicate or upstream
boundary was red.

Read-only diagnosis `01a0076a-d5ce-7e83-88a2-6283f29681d7` found no provable
Director-identity mismatch. It proved the gate discards the last renderer RPC
error/state and does not read the isolated Kernel until after the predicate is
green. Another blind run is forbidden.

Authorize diagnostic-only edits to
`qa/gates/research-director-front-door.ts` and its existing focused unit test.
Preserve every assertion, polling interval, 120-second hard deadline,
falsifier, cleanup rule, environment, fixture, and product file. Only when the
visible wait rejects or the outer watchdog fires, emit exactly one JSON line
prefixed `rd1_timeout_diag=` containing exactly these keys:

```yaml
failure_boundary: inner_wait_error | outer_watchdog_timeout
failure_class: app_or_renderer_rpc_failure | ipc_rejected | admission_pending | session_projection_missing | visible_projection_mismatch
readiness_returned: boolean
rpc: ok | error
ui_sample: absent | present
ui_phase: empty | starting | running | error | other
input_disabled: boolean
ledger_has_question: boolean
director_tile_count: integer
tile_has_session: boolean
kernel_read: ok | error
mission_for_question: boolean
hypothesis_for_question: boolean
hypothesis_status: absent | open | other
director_session_status: absent | starting | running | blocked | terminal | other
director_definition_exact: boolean
spawned_from_exact: boolean
main_ipc_seen: boolean
create_mission_seen: boolean
native_admission_returned: boolean
```

Implementation constraints:

1. Create one shared diagnostic context before `runFrontDoorProof` starts and
   pass it into that function. It owns the isolated Kernel path, captured output
   reference, last UI sample, most-recent UI-RPC outcome, and inner-wait marker;
   none may depend on the proof promise resolving. Set `readiness_returned=true`
   only after the existing readiness wait returns its endpoint.
   `failure_boundary` is
   `inner_wait_error` only when the visible `waitFor` rejects before the outer
   race wins; otherwise it is `outer_watchdog_timeout`.
2. `rpc` describes the most recent post-submit `app.ui.evaluate` attempt.
   `ui_sample=present` means at least one post-submit evaluation succeeded;
   otherwise all UI fields use `false`, zero, and `ui_phase=empty`. Retain the
   last successful sample. Derive `ui_phase` exactly: empty status → `empty`;
   exact `Starting durable research…` → `starting`; exact Director Mission regex
   → `running`; renderer `data-tone=error` → `error`; every other status →
   `other`. Discard status, tone, ledger strings, tile ids, and RPC error text
   after deriving booleans/enums.
3. Read the existing isolated `kernel.db` once, read-only, synchronously from
   the single outer-finally emitter immediately before the first root deletion.
   `kernel_read=error` on missing DB or query failure and all Kernel booleans use
   false/absent defaults. On success: `mission_for_question` means count of
   Mission rows with `objective=QUESTION` is at least one;
   `hypothesis_for_question` means count with `claim=QUESTION` is at least one;
   `hypothesis_status=open` means every matching row is open, `absent` means
   zero, otherwise `other`; `director_definition_exact` means exactly one
   definition row with id `DIRECTOR_ID`. Query sessions through an exact
   `spawned_from` join to that definition. When exactly one session matches,
   `director_session_status` is its status mapped to
   `running|starting|blocked|terminal|other`, and `spawned_from_exact` means that
   same unprinted session id has exactly one link of kind `spawned_from` to
   `DIRECTOR_ID`. Zero sessions means `absent/false`; more than one means
   `other/false`. This preserves diagnosis when no tile exists without
   attributing another session's link.
4. `director_tile_count` counts only DOM tiles matching the exact Director
   `data-definition-id`; `tile_has_session` is true iff at least one such tile
   has a non-empty `data-session-id`; `ledger_has_question` is true iff an
   existing ledger row contains the exact in-memory QUESTION. Print none of
   those source values.
5. Derive the three boundary booleans only from already-captured output:
   `qf-ui-proof main_ipc=qf:research:submitQuestion`,
   `qf-ui-proof kernel_command=create_mission`, and
   `agent-host: admitted native_tui`. Do not print the captured output.
6. Derive `failure_class` by first match, exactly: (a)
   `app_or_renderer_rpc_failure` when readiness did not return,
   `ui_sample=absent`, or the most recent post-submit UI RPC is `error`; (b)
   `ipc_rejected` when
   `ui_phase=error` or either main-IPC/create-Mission boundary is false; (c)
   `admission_pending` when Mission and Hypothesis exist and Director session is
   absent or starting; (d) `session_projection_missing` when the Director
   session is running and either UI phase is not running or no qualified tile
   has a session; (e) `visible_projection_mismatch` for every remaining allowed
   combination. This precedence maps every receipt to exactly one class.
7. One named production emission callback is called by
   `runResearchDirectorFrontDoorGate` from its outer `finally`, immediately
   before the first `rmSync`. It may make only captured-memory reads and the one
   synchronous read-only Kernel read; it may not await, sleep, poll, retry RPC,
   inspect processes, alter `ok`, suppress the existing red, or retain any
   process/root. During these two timeout paths, replace raw wait/catch error
   interpolation with a fixed `research-director-front-door: FAIL live_timeout`
   label. During any invocation that emits `rd1_timeout_diag`, no stdout or
   stderr line may contain question text, ids, paths, commands, environment,
   raw rows, captured output, or error text; emit the existing
   `convergence_remaining` as count-only for that invocation. Other invocations
   retain their existing detailed convergence receipt.
8. Export pure phase, unique-session status, classification, exact-key
   serializer, and once-only emission helpers for the focused unit test. The
   same production outer-finally emission callback called by
   `runResearchDirectorFrontDoorGate` must accept injected diagnostic context,
   read-only Kernel reader, output writer, and cleanup callback so the unit test
   exercises the real call site for injected inner-wait and outer-watchdog
   failures; testing pure helpers alone is insufficient. The test captures the
   callback's complete stdout/stderr and proves: exact keys; exactly one line;
   both boundaries; readiness false; all five classes with precedence;
   deterministic phase/unique-session mapping; emitter-before-cleanup ordering;
   and absence of hostile sentinel question text, ids, paths, commands,
   environment, raw rows/output, and error text. Missing, duplicate, or
   after-cleanup emission must fail. No product source edit is authorized.
9. Because `runWithWatchdog` does not await its watched task,
   `convergeLaunchPids` must not print `convergence_remaining` directly. Store
   its pending rows/count in the same shared context. The outer `finally` owns
   the only print: emit the existing detailed convergence receipt only when no
   `rd1_timeout_diag` will emit; emit count-only when it will. The injected
   outer-watchdog test must fire while convergence is pending and capture output
   until the watched task settles; any path, command, id, or row field appearing
   anywhere in that diagnostic invocation fails the test. This buffering may
   not delay cleanup or make the outer `finally` await the watched task.

Run once:

```powershell
bun test qa/gates/research-director-front-door.test.ts
bun qa/run.ts research-director-front-door
```

Stop after that live invocation. PASS proceeds to the remaining matrix; red
must include exactly one `rd1_timeout_diag` plus the existing zero-cleanup
receipts and returns to the router for one evidence-based product repair.

## Product repair — persistent Director proof seat and causal tile receipt

The one authorized live diagnostic returned this exact red state while every
cleanup receipt remained zero:

```text
readiness_returned=true rpc=ok ui_phase=running input_disabled=false
ledger_has_question=true director_tile_count=0 tile_has_session=false
main_ipc_seen=true create_mission_seen=true native_admission_returned=true
```

Static lifecycle inspection names the smallest source-backed cause. Native-TUI
admission calls `onStarted` with a PTY id before returning. That callback sends
`create-term-tile`. For this Director-only proof, however, the deterministic
responder emits `turn: complete` and immediately returns; its `finally` then
disposes stdin and exits. The renderer deliberately removes the matching term
tile on `pty:exit`. The gate can therefore miss a correctly created tile after
the proof fixture destroys the seat it is meant to keep observable.

This pass authorizes only the following repair and causal receipt:

1. In `collab-electron/cli/qf-hermes-synthetic-responder.mjs`, the exact
   Director-only branch identified by the activation instruction
   `do not recruit or assign a Task in this slice` must emit its existing
   `turn: complete`, then remain pending until its owning PTY input closes or
   the process receives its normal termination signal. Implement one explicit
   lifecycle handshake using the reader's existing close/end/error state; do
   not use a sleep, interval, network call, second process, or new dependency.
   Other orchestrator, worker, and critic fixture flows retain their current
   return/exit behavior. The existing `finally` still stops both MCP children,
   disposes the reader idempotently, and restores the terminal. App shutdown
   must release or terminate the handshake within the existing cleanup bounds.
2. Add `QF_UI_PROOF`-only, behavior-neutral receipts at the existing hops:
   `tile_event_sent=create-term-tile` immediately before the main process sends
   the Director tile event; `tile_event_received=create-term-tile` on entry to
   that exact renderer handler; and `tile_dom_identity=present` only after the
   newly created DOM node has both exact attributes
   `data-definition-id="hermes-research-director"` and a non-empty
   `data-session-id`. If that handler throws, emit only
   `tile_handler=threw` and rethrow the same error. Do not catch, suppress,
   retry, or translate product behavior.
3. In `qa/gates/research-director-front-door.ts`, capture the runtime
   `renderer_form_submit` and `preload_ipc` lines already emitted by the real
   renderer and preload; a source-text check is not a production-boundary
   receipt. After the existing visible predicate becomes green and before app
   shutdown, assert exactly one form submission and presence of the preload,
   main, Kernel, tile-event-sent, tile-event-received, and tile-DOM-identity
   receipts, plus absence of `tile_handler=threw`. Print exactly:

   ```text
   tile_projection_hops=sent,received,dom_identity handler_threw=false
   ```

   `automatic_tile=1` remains derived from the independently observed visible
   tile and is not treated as evidence for those hop receipts. On a timeout,
   extend the existing redacted diagnostic with only four booleans named
   `tile_event_sent`, `tile_event_received`, `tile_handler_threw`, and
   `tile_dom_identity_present`, derived from captured fixed receipt strings.
   Print no ids, arguments, paths, raw output, or errors.
4. In `qa/gates/research-director-front-door.test.ts`, use the production
   lifecycle helper and production receipt validator to prove before the live
   run that: Director completion occurs before lifecycle release; the Director
   branch remains pending until injected close/termination; it settles after
   release; all listeners are removed; the responder contains no fixed dwell
   sleep; each missing hop makes the receipt validator red; handler-threw makes
   it red; and the complete hop set makes it green. The test must fail if the
   Director early return is restored. Static source substring checks alone do
   not satisfy the lifecycle proof.

The deliverables have one meaning: keep only the Director proof seat alive for
the owning PTY lifetime, and prove each existing tile-projection hop without
changing that path. Do not alter the visible predicate, session/Task semantics,
tile removal policy, PTY shutdown, process ownership, cleanup assertions,
fixture identity, polling interval, or literal 120,000 ms deadline. No file
outside the responder, `ipc-kernel.ts`, `renderer.js`, the focused gate, and its
focused test is authorized.

Builder runs each command once, in order, stopping at the first red:

```powershell
bun test qa/gates/research-director-front-door.test.ts
bun qa/run.ts research-director-front-door
git diff --check
```

The live run must finish below 120 seconds with the existing complete green
receipt, the new causal hop receipt, and zero convergence/process/Hermes/root
cleanup counts. Any red, fixed sleep, missing hop, repeated assertion failure,
or cleanup survivor stops the slice. Full green commits and pushes the complete
WO-RD-1 candidate for one fresh independent Verifier; no later R14 work begins.
