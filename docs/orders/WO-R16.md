# WO-R16 - Visible research world

status: rewrite build authorized - fresh Reader YES/YES at `0700b77`
assignee: one fresh Builder session
depends: R15 PASS at `5d8b2f42205220f466878b32f6b17b41b4732fa8`, evidence commit `38464dd39c0b78c711119ac2f67acb96c77119c5`; Atlas v1 accepted at `7889074f10e089d450e307a2c6af0f827e8f06dd`; governed-review product repair `718816a654048f8e3105a0b18a45ad417c22275a`; independently verified falsifier candidate `c59ebfaab687ed6d4a40e2885b98135315da1a86`; operationalization commit below
rung: R16 - visible research world
authorization: founder umbrella goal 2026-08-15; `NEXT.md` names this order
rework-cycle: 1 of 1 used
rewrite-cycle: 0 of 1 used
R16_BUILD_BASE_SHA: `fef713c06f091dc8df13f7bde07be859d3b04930`
R16_REWRITE_WIP_SHA: `a9420ec0697fe587e619fd88c3839ee3a88da6ad` (preservation only; not a candidate or PASS)

## In plain terms

Ryan opens one Mission or source Task and chooses `Show research world`. The
canvas reveals the durable Mission, Task, Hypothesis, Dataset, Run, result
Artifact, Evaluation, findings Artifact, and published Report as inspectable
Glacier objects connected by honest semantic cables. He can understand the
question, ownership, inputs, execution, evidence, review, and publication
without reading a terminal or database.

## Product scene and register

This is a product surface for one expert operator at a Windows research desk.
The existing dark Glacier canvas, rotating cube, Dock, tile spine, typography,
tokens, and ordinary terminal tiles remain. Do not re-skin the app. The research
world adds structure to the canvas and uses familiar click, Enter, Escape, Tab,
and arrow-key behavior. Status and controls stay on the work, not in a detached
observability panel.

## Fixed vocabulary

**World root** is one selected Mission or one selected source Task. It never
means every row in the Kernel.

**Research object tile** is one canvas projection keyed exactly as
`ontology:<type>:<id>`. One Kernel object produces at most one tile, even when
several paths reach it. The underlying object id and type are always visible.

**Inspector** is the expanded body of its research object tile. It is not a
modal or a right-panel replacement. Click or Enter toggles it; Escape collapses
it and restores focus to the tile spine.

**Semantic cable** is an inert `view` connection derived only from one durable
Kernel link. It is dashed, carries the exact link kind as its label, and never
claims runtime data/control behavior. No link means no cable.

**Artifact receipt** is the Artifact id, kind, exact content hash, durable byte
availability, and a bounded text preview when the stored bytes are valid UTF-8.
The preview is never the source of truth and never replaces the hash.

Artifact preview is exact: Main streams and hashes the full file first. If the
hash differs, it returns no bytes. If byte length exceeds 65,536, the inspector
shows exactly `Preview unavailable: artifact exceeds 65536 bytes`. Otherwise
the full bytes must decode through fatal UTF-8. Invalid UTF-8 shows exactly
`Preview unavailable: artifact is not UTF-8`. Valid text renders the first 2,048
Unicode code points and appends one `…` only when more code points exist.

## Exact visible world

The production Main process returns one immutable read projection for the world
root. Renderer and preload never open SQLite. The projection contains only
Kernel rows, durable link rows, R15 source-work bindings, and bounded Artifact
bytes resolved through the existing app-owned Artifact boundary.

The transport contract has one meaning: renderer calls preload method
`getResearchWorldProjection({ root_type, root_id })`; preload invokes only
`qf:research-world:projection`; `root_type` is exactly `mission | task` and
`root_id` is the full Kernel id. Main returns either
`{ ok: true, world: { root, objects, links, missing_lineage } }` or
`{ ok: false, code, message }`. The only root errors are
`WORLD_ROOT_NOT_FOUND` and `WORLD_ROOT_INELIGIBLE`; neither returns a partial
world. Arrays sort deterministically: objects by type then id, links by kind,
from id, then to id, and missing-lineage facts by owning type, owning id, then
kind. The result is a value snapshot with no methods or mutation surface; a
renderer mutation cannot alter Main or Kernel state.

Main freezes all relational ids and fields in one SQLite read transaction, then
closes that transaction before reading files. Every Artifact receipt uses the
Kernel's existing lowercase 64-hex SHA-256 `content_hash`. Main hashes the full
bytes it actually read and returns a preview only when that hash still equals
the frozen hash. A file change, disappearance, or read error after the snapshot
returns that Artifact receipt with no bytes and exact
`Artifact unavailable: hash mismatch`; it never retries into a mixed snapshot.

The complete supporting fixture projects these unique tiles:

1. **Mission**: id, name, full objective.
2. **Task**: id, title, description, lifecycle, assignee identity, delegator
   identity, and steering/review state.
3. **Hypothesis**: id, full claim, success criteria, source citations, status.
4. **Dataset**: id, kind, `as_of`, content hash, coverage, and source Artifact
   receipt.
5. **Run**: id, kind, lifecycle, trace id, parameters, exact Dataset and
   Hypothesis identities, executor identity, and result Artifact identity.
6. **Result Artifact**: id, kind, content hash, durable-byte availability, and
   bounded preview.
7. **Evaluation**: id, critic identity, four Ragas scores, overall, verdict,
   confidence, rationale, block reason when present, findings Artifact identity,
   and review Task identity.
8. **Findings Artifact**: id, kind, content hash, and bounded canonical findings
   preview.
9. **Report Artifact** when publication exists: id, `report` kind, content hash,
   publication Evaluation identity, and bounded canonical report preview.

For a rejecting or inconclusive Evaluation, tile 9 does not exist. The
Evaluation tile instead shows exact `PUBLICATION BLOCKED`, the exact R15 code and
message, plus the already-governed `Request revision` and `Second critic`
controls. The separate positive supporting fixture shows exactly one Report
tile and `PUBLISHED`.

Every scalar above is shown in compact form when collapsed and in full when
expanded. Long ids may be visually abbreviated only if the full exact id is
available in the inspector and accessible name. Hashes always expose the full
value. Missing optional facts render `Not recorded`; zero, empty string, and
missing are never collapsed into one display state.

Within each inspector, fields appear in the literal order listed for that tile
above. Stored numeric scores render with `String(value)` and are not rounded;
citations render in stored order with their full exact value. The compact row is
`<Type> · <primary label or status> · <full id in accessible name>`; visible id
abbreviation may change only presentation, never the accessible value. Each
control's accessible name is `<action> <type> <full id>`.

## Mission to Task truth

Add one canonical durable link kind, `belongs_to`, from `task` to `mission`.
Each Task has at most one outgoing `belongs_to` link across the database. An
exact idempotent replay creates zero additional rows; an attempt to bind the
same Task to a different Mission refuses before any row/link/event with code
`MISSION_CONTEXT_CONFLICT`.
For Research Director delegation, `mission_id` exists only in trusted execution
context beside `actor_session_id`; it is not an action/tool input and any
caller-supplied `mission_id` field rejects. Main binds the new Mission id to the
exact admitted Director session before activation, and the production peer-bus
Task write receives that binding as trusted context. `create_task` atomically
writes `belongs_to` with the Task. If the binding is absent after restart,
unknown, or belongs to another Director session, Task creation refuses before
any row/link/event with code `MISSION_CONTEXT_REQUIRED` and visible message
`Reopen the Mission and ask the Research Director to delegate this work again.`
Manual Tasks created outside the Research Director path remain valid and show
`Mission not linked`; the renderer never infers membership from equal text,
timestamps, or proximity.

The Director-session-to-Mission admission binding is intentionally Main-memory
state, not a new durable table or canvas fact. Close/reopen clears it; reopening
the exact Mission recreates it only after Main verifies the same admitted
Director session. The durable `belongs_to` link preserves already-created Task
membership across restart, while new post-restart delegation refuses until that
explicit reopen.

The existing R14 flow must therefore produce exactly one `belongs_to` link. No
historical Task is backfilled by a guess. This is the only new domain relation in
R16.

The existing `tests` relation must also be written by the deterministic research
path. `execute_deterministic_run` accepts an exact existing `hypothesis_id` and
atomically writes one `tests` link from the new Run. The supporting R16 path and
the production Research Director orchestration call site require it; the gate
must prove that call site supplies it. The Kernel action keeps the field optional
only for pre-R16/manual callers: omission creates the Run under the legacy
contract, writes no `tests` link, and the projection returns the literal
missing-lineage fact `Lineage incomplete: tests`. A supplied unknown Hypothesis
refuses before any Run/Artifact/link/event; no historical row is backfilled.

## World traversal and cables

Traversal starts from the exact selected root and follows only these facts:

- `belongs_to` between Task and Mission;
- R15 source-work binding from source Task to Hypothesis, Run, result Artifact,
  and executor session;
- `tests`, `uses`, `produces`, `evaluated_by`, `performed_by`, `gates`,
  `assigned_to`, `delegated_by`, and `delegates_to` durable links;
- Evaluation fields that name findings Artifact, review Task, Report, and source
  work.

Traversal respects stored direction `from_id -> to_id`; it may traverse a named
link in reverse only to reach the other endpoint, never to relabel or reverse the
cable. A Task root is eligible only when it has exactly one R15 source-work
binding. A Mission root is eligible when it has at least one `belongs_to` Task;
zero produces `No linked research Task yet.`, one selects automatically, and
more than one requires the chooser described below. A Task with zero binding
produces `This Task has no completed research lineage yet.`; more than one is
`WORLD_ROOT_INELIGIBLE` and names the duplicate binding count. No arbitrary
first row is selected.

Source-work/Evaluation field references admit tiles but do not draw cables unless
a corresponding durable link exists. Required supporting-fixture cable labels
and endpoints are exactly:

1. source Task `belongs_to` Mission;
2. source Task `assigned_to` executor session;
3. source Task `delegated_by` Director session;
4. Director session `delegates_to` executor session;
5. Run `tests` Hypothesis;
6. Run `uses` Dataset;
7. Run `produces` result Artifact;
8. Hypothesis, Run, and result Artifact each `evaluated_by` the Evaluation;
9. Evaluation `performed_by` critic session;
10. critic session `produces` findings Artifact; and
11. Evaluation `gates` Report.

These are 13 cables total. The three agent-session endpoints reuse their
existing exact session tiles and are not counted among the nine research tiles.
The positive fixture manifest therefore contains exactly 12 world-member tiles:
nine research-object tiles plus the Director, executor, and critic session
tiles. Gate tile counts and deduplication include all 12; the phrase "nine
research tiles" never excludes the three session endpoints from the manifest.
The Dataset's `derived_from` source Artifact remains an Artifact receipt inside
the Dataset inspector because that source Artifact is not a world tile in this
rung; therefore it draws no cable. A missing required link shows
`Lineage incomplete: <kind>` on the nearest owning tile and draws no substitute
cable.

All semantic cables reuse only the existing Glacier cable renderer. They are
transient view edges derived from the current Kernel projection and never call
the `connection` write boundary or create `connection` rows. View positions may
persist in app-local canvas state; object facts, labels, endpoints, and lineage
may not.

## Layout and interaction

`Show research world` appears on the selected Mission and eligible source Task.
It is disabled with an inline exact reason when the root cannot resolve a world.
Activation reveals or focuses the existing tiles; it never duplicates them.
Mission without one `belongs_to` Task shows exactly `No linked research Task yet.`
Task without an R15 source-work binding shows exactly
`This Task has no completed research lineage yet.` More than one eligible source
Task under a Mission shows a compact Task chooser ordered by creation time then
id; choosing one is required before reveal.

First reveal uses deterministic lanes around the world root:

- intent: Mission, Task, Hypothesis;
- evidence: Dataset, Run, result and findings Artifacts;
- judgment: Evaluation and Report.

Existing user-moved positions win on later reveals. New tiles occupy the nearest
free slots in their lane and never cover the rotating cube, Dock, or another
tile. `Tidy` remains the operator's explicit global layout control.

All geometry below uses logical canvas coordinates with each rectangle anchored
at its top-left. The selected root tile's saved top-left is the lane origin
`(x0, y0)`. Lane columns begin at `x0`, `x0 + 444`, and `x0 + 888`; row candidates
begin at `y0 + n * 304`. Within each lane, candidates sort by the object type
order in `Exact visible world`, then full id. The selected root keeps its saved
position and counts as occupied. Every other existing tile, the live Dock
rectangle, and the live cube rectangle expanded 24 pixels on every side also
count as occupied in the same canvas coordinate space. On collision, advance
the candidate downward by exactly 20 pixels until its 420-by-280 rectangle no
longer intersects any occupied rectangle, then reserve it before placing the
next candidate.

Every research tile uses the existing 420 by 280 canvas footprint. Compact and
expanded inspector modes do not resize that footprint; the expanded detail body
scrolls inside it. Initial positions snap to the existing 20-pixel baseline.
Persist only the final app-local top-left under the existing tile key
`ontology:<type>:<id>`; do not add another layout store or persist lane facts.

Tab reaches every research tile and its visible controls. Enter expands or
collapses. Escape collapses. Existing cable keyboard parity remains green.
Focus-visible and state contrast use only shared tokens. State is expressed by
text plus tokenized color, never color alone. Reduced-motion mode removes reveal
motion without changing final placement.

## Deliverables

### A - Exact read projection

Add one Main-owned read projection and matching preload surface for a selected
world root. It returns one immutable snapshot with object rows, links, Artifact
receipts, missing-lineage facts, and no mutation capability. It performs one
Kernel read transaction for relational facts, then reads only Artifact bytes
whose ids/hashes were frozen by that snapshot. A changed or missing byte hash is
shown as `Artifact unavailable: hash mismatch`; stale bytes never render.
The IPC name, preload method, union result, sorting, error codes, SHA-256 format,
and byte-race behavior are exactly those in `Exact visible world`; alternative
channels, result shapes, silent empty worlds, or filesystem paths in the result
do not comply.

### B - Mission membership

Add `belongs_to` and bind it to the production R14 Director Task creation path
exactly as specified. Generated schema/docs/migration and focused Kernel tests
remain byte-consistent. No guessed backfill.

### C - Research tiles and inline inspectors

Add the nine exact projections above with deduplication, compact state, inline
inspection, keyboard parity, honest missing values, and no direct database or
filesystem access from the renderer.

### D - Semantic view cables

Project exact durable link kinds/endpoints into the existing dashed view-cable
surface. Never persist duplicate domain lineage in canvas state. Never render
data/control styling or a cable for a field-only reference.

### E - Fast product proof

Add and register exactly `research-world-visible`. Its total deadline is 60
seconds including cleanup; exceeding it is a gate failure, not permission to
raise the timeout. It uses one prebuilt isolated supporting fixture,
launches production Electron, uses real preload/Main projection and renderer,
opens the world by visible click, exercises pointer and keyboard inspection,
fully closes, reopens the same root, and proves identical visible/domain facts.
It does not launch a real model, package the app, or run an installer.

The gate implementation is `qa/gates/research-world-visible.ts`; its focused
test is `qa/gates/research-world-visible.test.ts`; `qa/run.ts` registers that
exact file/name. It creates one random run nonce and derives every fixture id
from it. Before Electron starts, the gate uses a separate read-only
`bun:sqlite` connection over the isolated Kernel to build and freeze the 12-tile,
13-cable expected manifest; it never calls the production projection to produce
expected values. The renderer contract exposes `data-qf-world-type`,
`data-qf-world-id`, `data-qf-world-field`, and `data-qf-world-cable-kind/from/to`
attributes for observation; those are inspection attributes, not truth stores.
The same change adds only this named gate file to
`kernel-sole-writer`'s read-only Oracle allowance with that reason in its comment;
it does not allow any renderer, preload, or product writer.

## Product gate

Before the first launch, construct the supporting fixture only through Kernel
commands and exact R14/R15 production helpers. The fixture contains one Mission,
one source Task, one Hypothesis, one Dataset plus source Artifact, one succeeded
Run, one result Artifact, one supporting Evaluation, one findings Artifact, and
one Report, plus the exact Director, executor, and critic session tiles. It
contains the 13 literal projected links above. Other durable links may exist,
but the projection excludes kinds not named in `World traversal and cables`.
Freeze an independent expected manifest before Electron starts.

Independence is enforced three ways: the Oracle above reads SQLite directly;
all fixture ids vary with the random run nonce; and the focused gate test scans
the changed renderer sources and fails if they contain any full runtime fixture
id or import `bun:sqlite`, `node:sqlite`, `better-sqlite3`, `node:fs`, or
`node:fs/promises`. In the renderer, `typeof require` must be `undefined`; the
preload exposes no raw database path, storage path, filesystem method, or
fixture/manifest value.

The gate must prove:

1. visible Mission-root and Task-root clicks each reveal the same exact world,
   with exactly one tile per expected object id/type;
2. every collapsed and expanded field equals the independent manifest;
3. full ids/hashes are accessible and no value came from fixture constants in
   renderer code;
4. every expected durable cable has exact kind/endpoints and dashed `view`
   honesty, with no extra cable;
5. click and keyboard inspection reach the same facts and restore focus;
6. a second reveal focuses existing tiles and creates zero duplicates;
7. no tile overlaps another, the Dock, or the cube's protected bounds;
8. a full close/reopen returns the identical object, field, position, inspector,
   and cable manifest;
9. direct read-only SQLite Oracle and DOM facts agree while the renderer has no
   SQLite or filesystem access; and
10. all owned processes and allocated roots are gone after success, failure, and
    timeout.

Cleanup item 10 is not inferred from the happy path. Within the same 60-second
outer deadline, the gate runs: the normal reveal/reopen case; one forced failure
immediately after Electron ready; and one forced 500 ms gate timeout immediately
after Electron ready. Each case records process and allocated-root snapshots
before launch and after cleanup, and fails unless owned-process delta and
owned-root delta are both zero. The failure/timeout injections live in the gate
harness, do not alter assertions or production behavior, and cleanup measurement
happens after termination without deleting residue before the snapshot.

A separate rejecting fixture in the focused renderer/Main tests proves no Report
tile, exact block code/message, and both R15 actions. It does not require another
Electron boot.

## Required falsifiers

Each mutation changes production code or fixture truth, never the gate,
assertions, expected manifest, timeout, or selector. The unchanged gate/test must
go red, then exact restoration must return green:

1a-l. omit each one of the 12 manifest tiles: the nine required research-object
tiles and the Director, executor, and critic session tiles;
2. replace one object id with a renderer literal;
3. render stale Artifact bytes whose hash does not match;
4. draw one cable with no durable link;
5. swap one cable's endpoints;
6. render a field-only source-work reference as a cable;
7. create a duplicate tile on the second reveal;
8. flatten missing, zero, and empty string to the same display;
9. show a Report for a non-supporting Evaluation;
10. hide the exact R15 blocking code or message;
11. break Enter inspection while pointer inspection remains;
12. persist a domain fact or cable label in canvas state;
13. infer Mission membership from matching Task description; and
14. remove the `belongs_to` write from the R14 Director path.

Every entry gets its own red and restored-green receipt. Add focused tests for
manifest comparison, tile deduplication, traversal, Artifact hash refusal,
layout collision, keyboard parity, and the rejecting projection.

Each falsifier receipt is one row in the Builder report with: mutation id;
immutable candidate SHA; SHA-256 of the unchanged gate/test file before and
after; changed production/fixture path and diff hash; native nonzero red exit;
restoration command plus zero diff for that path; and native zero green exit.
The Verifier checks those fields against the committed candidate and reruns a
sample it chooses. Missing fields or a changed gate hash reject the evidence.
This is report evidence reviewed by the independent Verifier, not a new receipt
framework or test runner.

## Literal Builder and Verifier matrix

Before its first source edit, the Builder records clean local and remote
candidate HEAD, verifies `R16_BUILD_BASE_SHA` is its immutable ancestor and uses
that SHA only as the comparison base, reads `qf-atlas/ATLAS.md`, and runs this
preflight:

```text
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
```

Any stale map, new hard red, or unexplained coverage stops before construction.
Atlas is a map and regression instrument only; it cannot authorize a semantic
change, baseline edit, or deletion.

After final repair state, the Builder runs every non-launching focused/static
command below once. No package, installer, `verify-release`, soak, full Atlas
falsifier, or real-model command is authorized.

```text
bun test collab-electron/src/main/research-world.test.ts collab-electron/src/windows/shell/src/research-world.test.ts collab-electron/src/windows/shell/src/task-composition.test.ts
bun test packages/qf-kernel/src/r16-visible-world.test.ts qf-kernel-schema/src/generate.test.ts
bun test qa/gates/research-world-visible.test.ts
bun qa/run.ts governed-review
bun qa/run.ts kernel-sole-writer
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts lockfile-committed
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts doc-action-surface
bun qa/run.ts repo-shape
bun qa/run.ts one-skin
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
git diff --check
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
```

After those commands are green, the Builder runs and retains these final Atlas
receipts, commits any changed generated projections with the candidate, and
reports whether the DIFF is better, worse, or unchanged and why:

```text
bun qf-atlas/generate.mjs
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930
git diff --check
```

The Builder then commits and pushes one immutable candidate before collecting
falsifier receipts. It runs and pastes the exact output of:

```text
git diff --name-only fef713c06f091dc8df13f7bde07be859d3b04930 HEAD -- "*.test.ts"
```

Every path in that committed-candidate output must appear literally in a
Builder `bun test` command above. The Verifier compares the pasted list to the
unaltered command logs and rejects on any missing path; this evidence therefore
fails on an uncovered test without adding a meta-test framework. If
implementation changes a production contract outside files exercised by the
listed tests, amend this order before that change.

## Verifier acceptance

Builder and fresh different-model Verifier use the founder's single checkout on
branch `wo-R16`. Before and after the matrix, each records local HEAD, remote
`origin/wo-R16`, empty status, process baseline, and allocated-root baseline.
All commands use fresh candidate-specific per-command logs with captured native
exit codes. No whole-matrix wrapper or stale log may establish a result.

The Verifier reruns the complete Builder block above, then owns these launching
product gates; the order deliberately assigns them to the Verifier so it does
not conflict with PROTOCOL's Builder/cold-run split:

```text
bun qa/run.ts research-world-visible
bun qa/run.ts founder-steering
bun qa/run.ts research-director-delegation
```

The Verifier reads `qf-atlas/ATLAS.md` and reruns `generate.mjs --check`, the
ratchet, and `generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930`
against the immutable candidate. It does not regenerate, edit, or commit the
candidate. A new hard red, stale projection, unexplained coverage, or DIFF that
lost coverage is a numbered defect even when the product gate is green.

Only after all commands pass may the Verifier write and commit
`docs/orders/evidence/r16/VERIFICATION.md`. Evidence names exact object ids,
hashes, visible fields, cable endpoints, keyboard receipts, reopen equality,
falsifier red/restored-green receipts, command exits, and zero residue.

## Out of scope

- Strategy/Technique versioning and operator outcome grading, owned by R17.
- Recall/vector retrieval, owned by R18.
- PufferLib, Policy training, promotion, or rollback, owned by R19.
- Harness/playbook learning, owned by R20.
- Dock redesign, cable data/control execution, cross-species panels, package,
  installer, release, signing, betting, or trading.

## Stop conditions

Stop only if an acceptance criterion must change, repair crosses this exact
scope, or the same assertion is red twice after a repair. In-scope defects do
not require a founder prompt. No R17 implementation begins from this order.

## Rework 1 - independent Verifier at `388d8f25`

Preserve the complete candidate product implementation and every green focused,
static, Atlas, and legacy launch receipt. Repair exactly these numbered defects;
this is the order's only rework cycle.

### 1. `research-world-visible` does not launch or observe the product

Measured command output is
`research-world-visible contract=green oracle=independent launch=verifier-owned`.
The gate source names itself a non-launching contract check and contains no
Electron launch/click/reopen/failure/timeout path. A sub-second static PASS cannot
prove the visible R16 outcome required by Deliverable E and Product gate items
1-10.

Repair `qa/gates/research-world-visible.ts` into the one production-Electron
gate already specified by this order, under the unchanged 60-second total
deadline. Keep the current independent Oracle/source checks as supplemental
preflight inside that gate. Use the production preload/Main/renderer, visible
Mission-root and Task-root activation, exact 12-tile/13-cable DOM manifest,
pointer/keyboard inspection, duplicate reveal, close/reopen equality, and the
forced failure/500 ms timeout zero-residue cases. Do not add a second gate,
fixture truth store, wrapper, package build, or weaker assertion.

Plain meaning: the check must actually open QuantFlow and click the research
world; reading source code and saying the button exists is not proof.

### 2. Required falsifier receipts are absent from the immutable candidate

At candidate `388d8f25`, the only tracked R16 document is this order. No Builder
report contains the required per-mutation candidate SHA, unchanged gate hashes,
native red exit, restoration-zero-diff, and restored-green exit, so the Verifier
cannot inspect or rerun a sample.

After defect 1 is green, add exactly
`docs/orders/evidence/r16/BUILD-REPORT.md` with all 12 tile-omission receipts and
falsifiers 2-14 in the receipt shape already specified above. The unchanged live
gate must go red for each production/fixture mutation and green after exact
restoration. This file records command evidence only; do not add receipt tooling
or alter a gate/assertion to manufacture it. Commit it with the repaired
candidate so the fresh Verifier can validate hashes and independently rerun a
sample.

Plain meaning: the candidate must carry the proof that its new visible check can
catch each promised break, not leave that proof in a vanished chat transcript.

## REWRITE - authorized after exhausted Rework 1

The original deliverables, product contracts, 60-second ceiling, acceptance
assertions, and Builder/Verifier separation above remain binding. The original
Builder/rework instructions are history and authorize nothing further. This
section authorizes one fresh Builder lap from preservation SHA `a9420ec` to
finish the existing live proof; it does not reopen R16 product scope.

The preserved prototype is useful but not a candidate. It launches production
Electron and reaches fixture seeding. It still has four measured defects that a
fresh Builder must repair before collecting any falsifier receipt.

### W1 - Process ownership is captured too late

Current `launch()` takes its process baseline after spawning and then discards
the collected PID set. On success it sets the active child to null after only
the Bun parent closes, without proving Electron descendants are gone. A stale
GPU/cache handle can therefore outlive the parent long enough to keep the app
root undeletable.

Take `processSnapshot()` before every spawn. `ownedPids` is the union of the
root PID and every descendant first observed at any snapshot from spawn through
teardown: during readiness polling, immediately after readiness, before
shutdown, after shutdown, and during cleanup polling. Newly observed descendants
of any already-owned PID join the union even if the original root has exited or
the child is later reparented. Every normal, failure, timeout, and exceptional
exit must request shutdown when possible, terminate the root tree when
necessary, call the existing
`terminateOwnedProcesses(ownedPids, remainingBudget)`, and assert
`owned_processes_remaining=0` from a fresh snapshot before attempting root
deletion. Never infer ownership by process name and never touch an ambient PID.

Plain meaning: QuantFlow must fully close everything this check opened before
the check says cleanup passed.

### W2 - Reopen is printed, not executed

The prototype prints `reopen_equal=true` immediately after the first shutdown.
It never launches the app a second time. Before the first launch, freeze the
independent expected ids/types, displayed field values, cable
kinds/endpoints, and accessible-name values from the read-only Oracle/fixture
contract. After the first visible launch matches those facts, freeze the
observed logical tile positions and inspector expanded/collapsed state before
closing. Then perform an actual second launch against the same Kernel, Artifact
root, and app-local geometry, without reseeding. Activate the same root through
the renderer and compare all 12 ids/types, every displayed field/value, all 13
cables, accessible names, first-launch positions, and first-launch inspector
state. Any difference is red. Only after the second owned process set is zero
may that case's root be removed.

Plain meaning: close and reopen must really preserve the same visible research
desk; a printed sentence is not a restart.

### W3 - Forced failure and timeout are printed, not executed

The prototype prints `forced_failure_cleanup=green` and
`forced_timeout_cleanup=green` without running either case. Replace those
literals with two actual gate-harness cases, each using its own registered root
and pre-spawn process baseline:

1. launch to Electron ready, deliberately raise the gate-owned failure, then
   run the common cleanup path and prove zero owned PIDs and zero owned roots;
2. launch to Electron ready, wait on a gate-owned never-settling operation under
   an exact 500 ms watchdog, observe the watchdog red, then run the same cleanup
   path and prove zero owned PIDs and zero owned roots.

These injections never change production code, assertions, selectors, or the
overall 60-second deadline. The gate passes only after it has observed both
intended internal reds and their cleanup greens. Each case mints a unique marker
from the run nonce. The failure case prints that marker only from the caught
deliberate exception. The timeout case records monotonic elapsed milliseconds
and prints its marker only when the 500 ms watchdog actually wins the race
against the never-settling operation. Cleanup labels without those measured
marker receipts are red.

Plain meaning: error and timeout cleanup must happen, not be claimed.

### W4 - Root removal is ad hoc and hides the failed path

The prototype performs repeated direct `rmSync` calls but emits only a final
count. Use one gate-local removal function for every registered root. It retries
only `EBUSY`, `EPERM`, and `ENOTEMPTY` with a named bounded attempt/delay policy
inside the existing deadline; records path, error code, and attempts; and never
deletes before measuring residue. The final receipt is exactly
`roots_created=<n> roots_remaining=0 retried=<n> leaked=[]`. A non-transient
error or remaining root is red. Pre-existing roots are informational and are
never deleted or counted as this run's success.

Receipt counters are exact: `roots_created` is the count of unique absolute
roots registered by this invocation; `roots_remaining` is how many of those
paths exist after the final measurement; `retried` is the total number of
transient removal attempts after each root's first failed attempt; and `leaked`
is the sorted JSON array of registered absolute paths still present after that
measurement. The receipt does not include or delete pre-existing paths.

The two roots left by the exhausted attempt were measured after all owned
Electron/Bun/Node processes had exited. They are historical residue, not inputs
to this rewrite and not permission to clean between a red assertion and its
receipt.

Plain meaning: Windows may release files late, but the check must show exactly
what it retried and may never sweep evidence before counting it.

### Rewrite acceptance

Before any new falsifier run, the unchanged live gate must complete all four
real cases above under 60 seconds and print only measured receipts. The focused
test must make each printed success false when its corresponding call is
removed; source-token checks alone are supplemental, not proof.

For this rewrite only, the Builder is explicitly authorized to run
`bun qa/run.ts research-world-visible` to establish the repaired final green and
to run that same gate against temporary falsifier mutations for the required
red/restored-green receipts. This narrow exception overrides the earlier
Verifier-only ownership of that one launching command; it does not authorize
the Builder to run `founder-steering`, `research-director-delegation`, any
package/release gate, or to self-certify. The fresh Verifier still reruns the
unaltered live gate independently.

Then execute the existing Builder matrix, Atlas sequence, and every falsifier
receipt already required by this order. The complete evidence file remains
`docs/orders/evidence/r16/BUILD-REPORT.md`. A fresh different-model Verifier
reruns the complete matrix and independently chooses at least one tile omission,
one cable mutation, one renderer-access mutation, and both cleanup injections.

The fresh Builder may change only these files:

- `qa/gates/research-world-visible.ts`;
- `qa/gates/research-world-visible.test.ts`;
- `collab-electron/src/main/index.ts`, limited to the preserved
  `qf.research.seed_fixture_dataset` RPC registration/dispatch seam; and
- `collab-electron/src/main/kernel.ts`, limited to the preserved R16 fixture
  seeding helper called only by that QA-mode RPC; plus
- `docs/orders/evidence/r16/BUILD-REPORT.md`.

No production semantics, public IPC, ordinary app behavior, or other function
in `index.ts`/`kernel.ts` may change. If the same live assertion proves an exact
product defect outside these named seams, the Builder stops with the receipt; it
does not widen scope. Any assertion change, deadline increase, cleanup before
measurement, simulated reopen, or simulated failure/timeout is an immediate
stop. No third implementation lap follows a failed rewrite.

### Launch prerequisite discovered by the rewrite

The rewrite stopped before fixture seeding with the exact production launch
error
`DockProfilesContractError: tools/qf-proof-agent/dock-profiles.json.profiles[0]
missing required display_name`. Measurement shows the Dock manifest contract
began requiring `display_name` at `97ed718`, while the checked-in proof-agent
manifest was not migrated. The existing focused test creates synthetic valid
manifests and therefore cannot catch this repository-file mismatch.

This is one bounded prerequisite repair, not a third R16 implementation lap.
The same rewrite Builder may additionally change only:

- `tools/qf-proof-agent/dock-profiles.json`, adding `display_name:
  "Orchestrator"` to `qf-proof-orchestrator` and `display_name:
  "Market Researcher"` to `qf-proof-worker`; and
- `tools/runtime-proof/dock-profiles.json`, adding `display_name:
  "Market Researcher"` to `qf-toolloop`; and
- `collab-electron/src/main/dock-profiles.test.ts`, adding one focused test that
  reads the two actual checked-in QA manifest files and asserts those three
  exact ids/display names. It does not synthesize a replacement manifest or
  require an ignored package artifact to exist; full discovery is exercised by
  the live launch below.

Because `tools/runtime-proof/packed/qf-toolloop.aospkg` is an intentionally
ignored generated artifact required by QA-mode Dock discovery, the live gate
may invoke only the existing `tools/runtime-proof` `pack-agent` script once
before its first Electron launch. The native nonzero exit is red, the generated
package must exist afterward, and this preparation remains inside the unchanged
60-second outer deadline. Do not add a packer, wrapper, cache, or committed
package.

The new focused test must fail against the pre-repair manifests and pass after
the three fields are added. No manifest id, role, runtime profile, prompt,
capability, package, discovery rule, display-name allowlist, R16 assertion,
deadline, or other file may change. After this prerequisite is green, resume
the existing W1-W4 rewrite and acceptance exactly where it stopped.

Plain meaning: stale checked-in QA seat definitions violate the current Dock
contract, so migrate those three labels and permanently test the real files.

### Windows pack ruling - production Director path

The authorized runtime-proof pack invocation failed twice before Electron
launch: first because the AgentOS toolchain selected extensionless `npm`, then
because Node `spawnSync` cannot execute `npm.cmd` directly on Windows. R16 does
not use `qf-toolloop`, and repairing an obsolete AgentOS packaging path is not
an R16 prerequisite.

This ruling supersedes only the pack paragraph above. Keep the three manifest
label repairs and their direct-file regression test because they repair the
measured checked-in contract mismatch. Remove the runtime-proof pack call and
do not generate or require `qf-toolloop.aospkg` in this gate.

For `research-world-visible`, leave `QF_DOCK_QA_MODE` unset so startup loads
only production Dock inventory. Submit the Mission through the default
`hermes-research-director` definition, not `qf-proof-orchestrator`, while
retaining the existing `QF_HERMES_SYNTHETIC_TEST=1` provider replacement. Set
the existing `QF_HERMES_SYNTHETIC_OLD_NO_RECRUIT=1` isolation flag for this
gate so that the production Director path records the Mission, Hypothesis, and
Director session without asynchronously creating a second R14 Task inside the
fixed R16 world. This changes no production behavior or visible-world
assertion; ordinary product launches receive neither flag.

Plain meaning: prove the real Research Director front door with its existing
credential-free responder, and do not revive AgentOS merely to open R16.

## FINAL RECONCILIATION - correct the false world count

Preservation SHA `5a92a25536c70e3131e5642670e41960aa541d3d` is WIP, not a
candidate. The preceding rewrite stopped correctly after the same final
cleanup assertion appeared twice. No earlier Builder or rewrite paragraph
authorizes another run. This section resolves the measured order contradiction
and authorizes one fresh final Builder lap.

The preserved Kernel contains the complete supporting world. It also proves
why the gate waited until its deadline: the Evaluation's governed
`review_task_id` names a real review Task. The production projection follows
that field exactly as `World traversal and cables` requires, so the visible
world has 13 tiles, not 12. Because that review Task is durably assigned to the
critic and delegated by the Director, it also has two named cables. The world
therefore has 15 cables, not 13. The earlier count excluded the review Task
while simultaneously requiring Evaluation field references to admit it.

The corrected positive manifest is exact:

- ten research-object tiles: Mission, source Task, review Task, Hypothesis,
  Dataset, Run, result Artifact, Evaluation, findings Artifact, and Report;
- three session tiles: Director, executor, and critic;
- the original 13 cables plus review Task `assigned_to` critic and review Task
  `delegated_by` Director.

Every earlier positive-fixture numeric requirement is superseded, including
W2's `all 12 ids/types`, its `all 13 cables`, every `12 tiles`/`12-tile`
phrase, `nine research-object tiles`, and `13 cables`: the positive manifest is
13 tiles, ten research-object tiles, and 15 cables. Required falsifier 1 is now
1a-m: omit each of the 13 manifest tiles independently. The Builder report must
contain all 13 omission receipts. No production projection, durable link, or
review Task may be removed to recover the old count. The only exception is a
temporary falsifier mutation that omits the review Task for 1m, observes the
unchanged gate red, and restores the exact candidate bytes with zero diff
before the restored-green run.

### Deadline and cleanup honesty

The failed run's only root was created at 19:10:24 and last written at
19:11:25. `removeRegisteredRoot()` recorded zero attempts because the 60-second
deadline had already expired. Its cleanup error then replaced the primary
visible-world timeout. The next gate must make both failures independently
observable without increasing the outer deadline:

1. Keep `RESEARCH_WORLD_VISIBLE_DEADLINE_MS = 60_000` as the hard deadline.
2. Define one global named `CLEANUP_RESERVE_MS = 8_000`. The invocation has one
   `hardDeadlineAt = startedAt + 60_000` and one shared
   `functionalDeadlineAt = hardDeadlineAt - CLEANUP_RESERVE_MS`; there is no
   per-case reserve. All launch readiness, fixture, renderer, reopen,
   failure-injection, and timeout-injection work uses the functional deadline.
   Shutdown RPC waits, owned-process termination/polling, and registered-root
   removal use the hard deadline and therefore consume the one shared reserve
   when functional time is exhausted. Cleanup may begin earlier.
3. Every case returns an unexpected functional exception separately from its
   cleanup exception. The deliberately raised forced-failure marker and the
   deliberately won 500 ms watchdog are expected receipts after their exact
   marker/elapsed assertions and are not primary failures. Sort unexpected
   functional exceptions by fixed case priority `normal`, `forced-failure`,
   `forced-timeout`; print the first as exactly
   `primary_failure=null` or
   `primary_failure={"case":"<case>","message":"<string>"}` using
   `JSON.stringify`, and print all cleanup failures exactly as
   `cleanup_failures=<JSON array sorted by case then message>`. Always run
   cleanup and print process/root receipts. A non-empty cleanup array makes the
   gate red but never replaces or hides the primary failure.
4. Start the normal first launch, forced-failure launch, and forced-timeout
   launch through one exported scheduling helper against three isolated roots.
   The helper invokes all three case callbacks before awaiting any result. A
   focused fake-runner test holds every callback unresolved until all three
   have reported `started`; it fails within 250 ms if the helper serializes
   them. In the live gate, a callback reports `started` only after its own
   pre-spawn snapshot and successful spawn have returned a root PID. Record
   that instant's monotonic offset from the same `startedAt`, print
   `initial_case_start_spread_ms=<n>`, and fail when the maximum-minus-minimum
   offset exceeds 2,000 ms. The normal case still
   closes and performs its real second launch sequentially against the same
   Kernel, Artifact root, and app-local geometry. Await all three case results
   before the final receipt. This changes wall-clock scheduling only; it
   removes no launch, assertion, marker, cleanup, or measurement.
   Each case captures its own pre-spawn snapshot. Its owned set is exactly the
   earlier W1 contract: its root PID plus every descendant first observed at
   any required snapshot, including newly observed descendants of an already
   owned PID and descendants later reparented. A concurrent case's processes
   never become owned without that ancestry.
5. The gate remains red unless all four real launches, 13-tile/15-cable
   comparisons, real reopen, both injected reds, zero owned processes, and
   `roots_remaining=0` complete before the hard deadline.

Plain meaning: the gate must look for the world QuantFlow actually and
correctly renders, while reserving enough of its same one-minute budget to tell
the truth and clean up when something fails.

### Final Builder authority

A fresh Builder may change only:

- `qa/gates/research-world-visible.ts`;
- `qa/gates/research-world-visible.test.ts`;
- `docs/orders/evidence/r16/BUILD-REPORT.md`; and
- generated Atlas projections required by the normal change-control rule.

It begins from clean local `HEAD == origin/wo-R16` at the Router's pushed
Reader-defect-fix commit that immediately follows `a6ee712`; that exact SHA is
supplied in the Builder task. Preservation SHA `5a92a255` must be an ancestor
and remains the immutable WIP comparison base, not the checkout HEAD. It first
freezes an independent expected 13-tile/15-cable manifest including the review
Task and its two links, then implements the deadline/primary-error scheduling above.
Focused tests must falsify the 13/15 count, cleanup reserve, primary-error
preservation, and concurrent three-root scheduling without launching Electron.
The Builder may then run the one live gate and required falsifiers under the
same exception already granted above, execute the unchanged short Builder
matrix and Atlas sequence, write the complete BUILD-REPORT, and push one
immutable candidate.

No product semantics, projection traversal, Main/Kernel fixture seam, manifest,
display name, timeout value, assertion strength, package path, AgentOS path, or
other file may change. A fresh different-model Verifier owns acceptance. Any
same assertion repeated after one repair attempt, any primary failure other
than the corrected count during the first live run, or any need outside these
four path classes stops R16 for founder decision. No further implementation lap
is authorized.
