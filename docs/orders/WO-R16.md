# WO-R16 - Visible research world

status: normal consumer Attempt 3 red - sixteenth-cable bounded Builder authorized
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
canvas reveals the durable Mission, source Task, governed review Task,
Hypothesis, Dataset, Run, result Artifact, Evaluation, findings Artifact,
published Report, Director, executor, and critic as 13 inspectable Glacier
objects connected by 15 honest semantic cables. He can understand the question,
ownership, inputs, execution, evidence, review, and publication without reading
a terminal or database.

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
2. **Source Task**: id, title, description, lifecycle, assignee identity,
   delegator identity, steering/review state, and Mission identity.
3. **Review Task**: the same Task field order as item 2, using the Evaluation's
   durable `review_task_id`; it is a second Task tile, never folded into the
   source Task or Evaluation. It has no `belongs_to` Mission link in R16, so its
   `mission_id` field renders exactly `Not recorded`. Evaluation membership
   admits it to this world; that field reference does not invent a cable or
   Mission ownership.
4. **Hypothesis**: id, full claim, success criteria, source citations, status.
5. **Dataset**: id, kind, `as_of`, content hash, coverage, and source Artifact
   receipt.
6. **Run**: id, kind, lifecycle, trace id, parameters, exact Dataset and
   Hypothesis identities, executor identity, and result Artifact identity.
7. **Result Artifact**: id, kind, content hash, durable-byte availability, and
   bounded preview.
8. **Evaluation**: id, critic identity, four Ragas scores, overall, verdict,
   confidence, rationale, block reason when present, findings Artifact identity,
   and review Task identity.
9. **Findings Artifact**: id, kind, content hash, and bounded canonical findings
   preview.
10. **Report Artifact** when publication exists: id, `report` kind, content hash,
   publication Evaluation identity, and bounded canonical report preview.

For a rejecting or inconclusive Evaluation, tile 10 does not exist. The
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
11. Evaluation `gates` Report;
12. review Task `assigned_to` critic session; and
13. review Task `delegated_by` Director session.

These are 15 cables total because item 8 names three distinct cables. The three
agent-session endpoints reuse their existing exact session tiles and are not
counted among the ten research-object tiles. The positive fixture manifest
therefore contains exactly 13 world-member tiles: ten research-object tiles
plus the Director, executor, and critic session tiles. Gate tile counts and
deduplication include all 13.
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
Persist only the existing layout envelope under the tile key
`ontology:<type>:<id>`: final app-local `x`, `y`, fixed `width=420`, fixed
`height=280`, and UI stacking `zIndex`. These are projection geometry, not
domain facts. Do not add another layout store or persist lane facts.
Placement collision is computed in canvas logical coordinates. Tile rectangles
are `x,y,420,280`; Dock and protected-cube client rectangles convert once as
`canvasX = (clientX - panX) / zoom` and `canvasY = (clientY - panY) / zoom` at
the reveal's current pan/zoom. The live DOM check uses each element's
`getBoundingClientRect()` at that same pan/zoom and rejects every positive-area
intersection. Touching edges are not an overlap.

Native Tab reaches every research-object tile and its visible controls in DOM
order. The live gate inserts one temporary focus sentinel immediately before
the first research-object tile, focuses it, then sends one real Electron Tab
input per expected focusable. The expected order is the DOM order of each of
the ten research-object tile containers followed by that tile's enabled visible
buttons; every step records exact object type/id and control accessible name.
The sentinel is always removed. On each of the ten tile containers, native
Enter expands, native Escape collapses, and focus remains on that same tile.
Existing cable keyboard parity remains green.
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
exactly as specified. The generated set is exactly
`qf-kernel-schema/golden/migration.sql`,
`qf-kernel-schema/golden/tools.json`,
`qf-kernel-schema/golden/ONTOLOGY.md`,
`qf-kernel-schema/golden/conformance.test.ts`, and every file under
`qf-kernel-schema/golden/upgrades/` from `0001` through `0012`, written by
`bun --cwd qf-kernel-schema run generate`; `bun test
qf-kernel-schema/src/generate.test.ts` must compare that entire set byte-for-
byte to the generators. No guessed backfill.

### C - Research tiles and inline inspectors

Add the ten exact research-object projections above, including distinct source
and review Task tiles with the same Task field contract. Sort both Tasks by id
with the other objects and place both through the one collision algorithm. Add
deduplication, compact state, inline inspection, keyboard parity, honest missing
values, and no direct database or filesystem access from the renderer.

### D - Semantic view cables

Project exact durable link kinds/endpoints into the existing dashed view-cable
surface. Never persist duplicate domain lineage in canvas state. Never render
data/control styling or a cable for a field-only reference.

For a persisted research tile, the complete allowed key set is `id`, `type`,
`x`, `y`, `width`, `height`, `zIndex`, `ontologyType`, and `ontologyId`.
Persisted viewport keys remain `centerX`, `centerY`, and `zoom`. No object field,
status, title, description, cable id/kind/endpoint, world snapshot, or inspector
value may appear anywhere in saved canvas state; all are re-projected.

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
`bun:sqlite` connection over the isolated Kernel to build and freeze the 13-tile,
15-cable expected manifest; it never calls the production projection to produce
expected values. The renderer contract exposes `data-qf-world-type`,
`data-qf-world-id`, `data-qf-world-field`, and `data-qf-world-cable-kind/from/to`
attributes for observation; those are inspection attributes, not truth stores.
The same change adds only this named gate file to
`kernel-sole-writer`'s read-only Oracle allowance with that reason in its comment;
it does not allow any renderer, preload, or product writer.

The bounded UI proof may add exactly one Main RPC method in
`collab-electron/src/main/index.ts`: `app.ui.pressKey`. It is disabled unless
`QF_UI_PROOF=1`, accepts only `Tab`, `Enter`, or `Escape`, requires the production
shell window, sends matching Electron `keyDown` and `keyUp` input events to that
window, and returns `{ key, sent: true }`. Any other key or environment is an
error. It stores nothing and is not exposed through preload.

## Product gate

Before the first launch, construct the supporting fixture only through Kernel
commands and exact R14/R15 production helpers. The fixture contains one Mission,
one source Task, one governed review Task, one Hypothesis, one Dataset plus
source Artifact, one succeeded Run, one result Artifact, one supporting
Evaluation, one findings Artifact, and one Report, plus the exact Director,
executor, and critic session tiles. It contains the 15 literal projected links
above. Other durable links may exist,
but the projection excludes kinds not named in `World traversal and cables`.
Freeze an independent expected manifest before Electron starts.

Independence is enforced three ways: the Oracle above reads SQLite directly;
all fixture ids vary with the random run nonce; and the focused gate test scans
the changed renderer sources and fails if they contain any full runtime fixture
id or import `bun:sqlite`, `node:sqlite`, `better-sqlite3`, `node:fs`, or
`node:fs/promises`. In the renderer, `typeof require` must be `undefined`; the
preload exposes no raw database path, storage path, filesystem method, or
fixture/manifest value.

The independent Oracle is the corrected 13-tile/15-cable manifest. It contains
ten research-object tiles, including both Task tiles, and three session tiles.

The gate must prove:

1. visible Mission-root and Task-root clicks each reveal the same exact world,
   with exactly one tile per expected object id/type;
2. every collapsed and expanded field equals the independent manifest;
3. full ids/hashes are accessible. The source scan rejects every full runtime
   id or hash, every nonce-bearing non-id manifest string, and the exact JSON
   encodings of the fixture's citations, Run parameters, Evaluation rubric and
   score tuple when any appears in changed renderer source. Together with item
   2's comparison of every DOM field to the read-only Oracle, this is the exact
   finite anti-constant claim; it does not claim to prove an unbounded negative;
4. every expected durable cable has exact kind/endpoints and dashed `view`
   honesty, with no extra cable;
5. click Inspect expands and click Collapse collapses on the Mission tile. Then
   execute the exact native-Tab sequence above and emit
   `tab_focus_receipts=<JSON array>` containing every expected type/id/control
   in order. For each of the ten research-object tiles, focus it, send native
   Enter, assert expanded and focus retained, send native Escape, assert
   collapsed and focus retained. Emit `keyboard_tiles=10 enter=10 escape=10
   focus_retained=20`. Any missing, extra, reordered, disabled, skipped, or
   trapped focus target is red. Arrow-key tile navigation remains owned by its
   existing focused tests and is not redefined by this live receipt;
6. a second reveal focuses existing tiles and creates zero duplicates;
7. no tile overlaps another, the Dock, or the cube's protected bounds;
8. a full close/reopen returns the identical object, field, position, inspector,
   and cable manifest. After first close and again after reopen, the gate reads
   the isolated app's saved canvas JSON and proves every research tile has
   exactly the allowed key set in Deliverable D. `ontologyType` and
   `ontologyId` are the only allowed domain references; no additional key may
   hold a projected field or cable id/kind/endpoint;
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

1a-m. omit each one of the 13 manifest tiles: the ten required research-object
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
12. in the temporary production mutation, add exactly `domainFact` containing
the source Task title and `cableKind` containing `belongs_to` to the serialized
research tile. The unchanged gate reads saved canvas state after reopen and
must go red because its research-tile key set is not the exact allowlist above;
13. add a decoy Task whose description exactly equals the source Task's
description but which has no `belongs_to` link to the selected Mission. The
correct projection remains 13/15. Temporarily replace the production Mission
membership lookup with description equality; the unchanged gate must go red on
the extra/wrong Task and restore green only after the durable-link lookup is
restored; and
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
Mission-root and Task-root activation, exact 13-tile/15-cable DOM manifest,
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
`docs/orders/evidence/r16/BUILD-REPORT.md` with all 13 tile-omission receipts and
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
the renderer and compare all 13 ids/types, every displayed field/value, all 15
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
   `cleanup_failures=<JSON array>` where every element is exactly
   `{"case":"normal|forced-failure|forced-timeout","message":"<string>"}`
   and the array is sorted by `case`, then `message`. Always run cleanup and
   print process/root receipts. A non-empty cleanup array makes the gate red
   but never replaces or hides the primary failure.
4. **Historical scheduling text - superseded by `SCHEDULING CORRECTION`.** The
   earlier requirement to start all three cold apps together and print
   `initial_case_start_spread_ms` authorizes no implementation and no receipt.
   The active schedule starts the first normal world alone, then overlaps the
   reopen/failure/timeout cases and prints `post_first_case_start_spread_ms`.
   The ownership rule from this paragraph remains active: each case captures
   its own pre-spawn snapshot. Its owned set is exactly the
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
- `collab-electron/src/main/index.ts`, only for the bounded
  `app.ui.pressKey` method above;
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

## DIAGNOSTIC RULING - expose the renderer exception

WIP SHA `471650c99a8638b878c0a8a1eb9bee16ae4bf604` proves the final
reconciliation harness itself: focused tests 5/5; initial cases overlapped
within 134 ms; both deliberate failure markers passed; every owned process and
all three roots reached zero; `cleanup_failures=[]`. The normal case still
failed, but Electron's `executeJavaScript()` boundary replaced the renderer
exception with the generic `Script failed to execute` message. The gate cannot
classify or repair a failure it deliberately discards.

This ruling authorizes one diagnostic-only change to
`qa/gates/research-world-visible.ts` and its focused test. Add one gate-local
renderer-evaluation helper used by every `app.ui.evaluate` call. It JSON-encodes
the inner expression, evaluates it inside a stable renderer-side `try/catch`,
and returns exactly one of:

```text
{ "ok": true, "value": <JSON-serializable result> }
{ "ok": false, "message": "<Error message>", "stack": "<stack or empty>" }
```

The helper throws in the gate on `ok:false` with exact
`renderer_error={"label":"<call label>","message":"<message>","stack":"<stack>"}`.
The focused test must prove quotes, backslashes, newlines, and a deliberately
throwing inner expression survive encoding and return the exact error shape.
No selector, expected value, count, product code, timeout, launch schedule, or
cleanup behavior may change for diagnosis.

Run the unchanged live gate once. If the exact renderer error identifies a
mistake solely in the gate's observation expression, this same Builder may
repair only that expression, add a focused red/green test for the mistake, and
run the live gate one final time. If it identifies product behavior, an
assertion change, or any other file, stop with the exact receipt. A green final
run resumes the already-required falsifiers, Builder matrix, evidence,
candidate commit, and independent verification. No further diagnostic or
implementation run is authorized.

Plain meaning: make Electron tell us the real one-line UI error, fix it only if
the measuring script is wrong, and stop guessing.

## OBSERVATION RULING - retain the last visible manifest

Diagnostic WIP SHA `58c3288fe36d4f58f8e3db24fef91323c311ea5a` fixed
the measured renderer-expression syntax error (`missing ) after argument list`)
and proves the encoded renderer helper with 7/7 focused tests. Its final live
run returned successful renderer evaluations but timed out waiting for the
13/15 count. The current wait loop discards every non-matching snapshot, so the
receipt cannot distinguish one missing tile from an empty canvas.

This ruling authorizes only `qa/gates/research-world-visible.ts` and its focused
test to retain the last successfully evaluated world snapshot during the normal
case wait. On timeout, compare that snapshot to the frozen independent Oracle
and throw exactly one JSON receipt with sorted arrays:

```text
world_timeout={
  "object_count": <number>,
  "link_count": <number>,
  "missing_objects": ["type:id"],
  "extra_objects": ["type:id"],
  "missing_links": ["kind:from_id:to_id"],
  "extra_links": ["kind:from_id:to_id"]
}
```

The focused test supplies a known 12/14 snapshot against a 13/15 expected
manifest and must assert every exact missing/extra entry and stable sort order.
Do not change the 13/15 expectation, selectors, fixture, product, schedule,
deadline, or cleanup. Run the focused test and one live diagnostic gate.

If the exact delta identifies a defect solely in the gate's observation or
fixture seam already named by this order, the same Builder may repair that one
defect, add its focused red/green test, and run one final live gate. Any product
projection change, assertion change, other file, or unexplained delta stops
R16. A green final run resumes the required falsifiers, matrix, BUILD-REPORT,
candidate, and fresh verification. No further diagnostic lap is authorized.

Plain meaning: when the canvas count is wrong, print exactly what is missing or
extra instead of waiting a minute and throwing the evidence away.

## SCHEDULING CORRECTION - prove the first world without cold-launch interference

Observation WIP SHA `3b86d140d06a86665b87a082d2a85a31bfebb2fe` is evidence,
not a candidate. Its focused contract tests pass 8/8 and preserve the exact
renderer error and `world_timeout` receipts. Its one live run stopped before
world observation because the normal fixture tried to assign its source Task
to a Hermes worker session that was no longer running:

```text
create_task assignee_session_id must name a running session:
75847055-12bf-4056-bb06-e85dacdcf40b
```

That run also left two owned processes in the simultaneously launched forced-
timeout case until final root cleanup. The product Kernel correctly rejected
the dead assignee. The gate created the race by cold-launching the production
Director, worker, critic, forced-failure app, and forced-timeout app at once.

This section supersedes only FINAL RECONCILIATION item 4's initial scheduling
and its `initial_case_start_spread_ms` receipt. It also supersedes the two
later diagnostic sections' prohibition on a further lap. Every product
assertion, exact 13-tile/15-cable Oracle, selector, fixture command, four real
Electron launches, 60-second hard deadline, one 8-second cleanup reserve,
failure vocabulary, cleanup ownership rule, falsifier, and matrix command
remains unchanged.

### Exact schedule

1. Register the same three isolated roots. Launch only the normal first app.
   Use the production `hermes-research-director`, spawn the worker and critic,
   create the durable research world, reveal it from the Mission, compare the
   exact 13 tiles and 15 cables, exercise inspection and duplicate-reveal
   behavior, then close that app and prove its owned process set is zero.
   Neither forced case may spawn before this first app has closed.
2. Preserve the first world's independent manifest, rendered snapshot, Mission
   id, source Task id, Kernel, Artifact root, and app-local geometry. Do not
   rebuild, synthesize, or copy them for reopen.
3. After item 1 succeeds, invoke exactly three callbacks through one exported
   post-first scheduling helper, each against its already registered root:
   the real normal reopen, the real forced-failure launch, and the real forced-
   timeout launch. The helper invokes all three callbacks before awaiting any
   result. Each callback reports started only after its pre-spawn snapshot and
   successful spawn return a root PID.
4. Record those three monotonic offsets against the original gate `startedAt`,
   print exactly `post_first_case_start_spread_ms=<n>`, and fail when their
   maximum-minus-minimum exceeds 2,000 ms. The previous
   `initial_case_start_spread_ms` receipt no longer exists.
5. The normal reopen must observe the same 13-tile/15-cable world and compare
   byte-for-byte equal ids, fields, cables, positions, and inspection state to
   the first rendered snapshot. The other two callbacks must produce the
   unchanged forced marker and 500 ms timeout receipts. Await all three, clean
   all owned processes and roots, and emit the unchanged primary and cleanup
   receipts before deciding PASS or red.

The focused fake-runner test is renamed to the post-first helper and remains
bounded to 250 ms. It must prove all three callbacks have reported started
before any callback is released; a serial helper makes the test red. Add one
focused scheduling test proving no post-first callback is invoked when the
first-world stage rejects. Existing 13/15, cleanup-reserve, primary-error,
renderer-encoding, observation-expression, timeout-delta, and projection-
independence tests remain unchanged.

### Builder and acceptance authority

A fresh Builder starts only from clean local and remote
`3b86d140d06a86665b87a082d2a85a31bfebb2fe` plus the Router's Reader-fix
commit. It may change only:

- `qa/gates/research-world-visible.ts`;
- `qa/gates/research-world-visible.test.ts`;
- `docs/orders/evidence/r16/BUILD-REPORT.md`; and
- generated Atlas projections required by normal change control.

It first runs the focused test. It then runs exactly one live
`bun qa/run.ts research-world-visible`. A red live receipt stops this lap; it
does not authorize another diagnostic. A green live receipt opens the already
specified falsifiers, short static/Atlas matrix, BUILD-REPORT, immutable
candidate commit, and push. No package, installer, release, AgentOS, second
checkout, wrapper, or helper framework is authorized.

A fresh different-model Verifier records the immutable candidate SHA before
and after, reruns the focused test, the live gate, the named falsifiers and
short matrix from this order, and writes `docs/orders/evidence/r16/VERIFICATION.md`
only on full PASS. Any edit during verification voids the run.

Plain meaning: let QuantFlow finish building and showing the real research
team before starting the three cheap shutdown checks that were crowding it off
the machine.

## CABLE ENDPOINT REPAIR - resolve every projected object tile, not only sessions

Post-first WIP SHA `04b2596acf84668b8405304c1a2f886f87c9e23f` is evidence,
not a candidate. It implements the Reader-approved schedule, bounded native-key
bridge, saved-state boundary, and 11/11 focused contract tests. Its one live run
proved the real canvas contained all 13 expected objects but only one cable:

```text
world_timeout={"object_count":13,"link_count":1,
"missing_objects":[],"extra_objects":[],
"missing_links":[14 exact research-object lineage links],"extra_links":[]}
```

The one rendered cable was Director `delegates_to` executor. Cleanup was fully
green: the normal owned process set and all three roots reached zero, and
`cleanup_failures=[]`.

The measured product defect is in
`collab-electron/src/windows/shell/src/research-world.js`. Its cable endpoint
lookup asks only for `ontology:agent_session:<id>` or a tile whose `sessionId`
matches. Therefore session-to-session endpoints resolve while Mission, Task,
Hypothesis, Dataset, Run, Artifact, and Evaluation endpoints are labeled
unknown and filtered out even though their exact ontology tiles exist.

### Exact repair

Export exactly one pure endpoint resolver named
`resolveResearchWorldEndpointTileId` from `research-world.js`. It receives the
current projection's `objects`, the current canvas `tiles`, and one endpoint id.
It behaves exactly:

1. Find projection objects whose full `id` equals the endpoint id. Zero matches
   returns `null`; more than one match also returns `null` rather than choosing
   an arbitrary type.
2. For the single matching non-session object, collect research tiles whose
   `type === "research"`, `ontologyType === object.type`, and
   `ontologyId === object.id`. Return the exact tile `id` only when exactly one
   tile matches; zero or multiple matching canvas tiles return `null`.
3. For the single matching `agent_session`, collect non-research tiles whose
   `type !== "research"` and `sessionId === object.id`. Return the exact tile
   `id` only when exactly one matches; zero or multiple matches return `null`.
   A research-style tile carrying `sessionId`, including
   `ontology:agent_session:*`, is never a canonical session tile.
4. Cable projection calls this resolver independently for `from_id` and
   `to_id`. It emits the unchanged dashed `view` cable only when both resolve;
   it never guesses, reverses, persists, or relabels an endpoint.

The focused renderer test constructs all ten research-object tiles and three
session tiles, then supplies the exact 15-link manifest. It must prove every
link resolves to the expected two tile ids. Separate cases prove unknown ids,
a duplicate id across two projection object types, duplicate matching research
tiles, duplicate matching non-research session tiles, and a research tile that
also carries `sessionId` all return `null`. The old session-only lookup makes
the positive case red because 14 links have a null endpoint.

### Builder and acceptance authority

A fresh Builder starts only from clean local and remote
`04b2596acf84668b8405304c1a2f886f87c9e23f` plus the Router's pushed Reader-fix
commit. It may change only:

- `collab-electron/src/windows/shell/src/research-world.js`;
- `collab-electron/src/windows/shell/src/research-world.test.ts`;
- `docs/orders/evidence/r16/BUILD-REPORT.md`; and
- generated Atlas projections required by normal change control.

It runs Atlas preflight, the focused renderer test, and the unchanged 11-test
`research-world-visible` contract test. Only then may it run exactly one live
`bun qa/run.ts research-world-visible`. A red stops with its exact receipt. A
green proceeds through the already-specified falsifiers, short matrix,
BUILD-REPORT, Atlas regeneration, immutable candidate commit, and push. The
gate, expected 13/15 manifest, schedule, timeout, fixture, selectors, Main,
preload, Kernel, persistence, and every other product file remain byte-
unchanged from `04b2596`.

A fresh different-model Verifier records the candidate SHA before and after,
reruns both focused tests, the live gate, the named falsifier sample and short
matrix, and writes `docs/orders/evidence/r16/VERIFICATION.md` only on full PASS.
No package, installer, release, worktree, wrapper, or helper framework is part
of this repair.

Plain meaning: QuantFlow already has every research object on screen; make the
cable renderer connect those real tiles instead of recognizing only agent
sessions.

## SESSION RECEIPT REPAIR - expose projected identity without replacing the live seat

Cable-resolution WIP SHA `4548736a8d216f140a483cbd9d3685d2166acc57` is
evidence, not a candidate. Its focused resolver tests pass 3/3 and the unchanged
gate contract passes 11/11. The live gate advanced through the exact 13-object,
15-cable count and cable manifest, then stopped at the first session comparison:

```text
primary_failure={"case":"normal","message":"displayed fields differ for agent_session:9b21bf90-70b9-4df5-882b-8b33e2bf677c"}
```

Cleanup remained fully green: normal owned processes and all three roots reached
zero, with `cleanup_failures=[]`.

The measured product defect is the existing `decorateSession(object)` path in
`collab-electron/src/windows/shell/src/research-world.js`. It marks the live
terminal seat with research-world type/id and accessible name but emits none of
the projection's exact `id`, `status`, and `label` fields. The independent Oracle
correctly expects those three fields, with `Not recorded` for an absent label.

### Exact repair

1. Export one pure function named `researchSessionReceiptFields(object)`. It
   returns an array of exactly three objects in this literal shape and order:
   `[{ field: "id", value: "<display>" }, { field: "status", value:
   "<display>" }, { field: "label", value: "<display>" }]`. Each `value` is the
   same display string produced by `displayValue`: missing/null/undefined is
   `Not recorded`, empty string is `[empty string]`, and all other values use
   `String(value)`. No third property or alternative container complies.
2. `decorateSession` keeps the existing unique non-research session tile and
   its native terminal/CLI body. It must not call `renderObject`, replace or
   clear `dom.contentArea`, change the tile type/id/session identity, or create
   a research tile.
3. Under that tile's existing `dom.taskFoot`, inspect only direct children with
   class `.qf-world-session-receipt`. Zero matches creates one and appends it as
   the final direct child. One match reuses it. More than one keeps the first in
   DOM order and removes only the later matching receipt nodes. On every
   projection refresh, replace only the retained receipt's children with the
   three rows returned above, rendered through the existing `makeField` seam so
   each row exposes `data-qf-world-field` and `.qf-world-field-value`. Never
   replace, reorder, or remove any non-receipt task-foot child.
4. A second reveal in the same window reuses the same receipt DOM node and
   leaves exactly one copy. A full close/reopen creates a new DOM tree and
   therefore a new receipt node, but it again leaves exactly one copy with the
   same three field/value rows. The existing `data-qf-world-type`,
   `data-qf-world-id`, and full accessible name remain on the terminal tile.
   Session receipt fields are a transient projection and add nothing to saved
   canvas state.

The focused renderer test proves the pure field order and every display-value
case. Its source seam also fails unless `decorateSession` targets
`dom.taskFoot`, names `.qf-world-session-receipt`, and contains no
`contentArea.replaceChildren` or `renderObject` call. The unchanged live gate is
the integration proof: all three session tiles must match their independent
fields on first reveal and reopen while the 13/15 manifest, terminal seats,
native-key receipts, saved-state allowlist, and cleanup remain green.

### Builder and acceptance authority

A fresh Builder starts only from clean local and remote
`4548736a8d216f140a483cbd9d3685d2166acc57` plus the Router's pushed Reader-fix
commit. It may change only:

- `collab-electron/src/windows/shell/src/research-world.js`;
- `collab-electron/src/windows/shell/src/research-world.test.ts`;
- `docs/orders/evidence/r16/BUILD-REPORT.md`; and
- generated Atlas projections required by normal change control.

It runs Atlas preflight, the focused renderer test, and the unchanged 11-test
gate contract before exactly one live `bun qa/run.ts research-world-visible`.
A red stops with its exact receipt. A green proceeds through the already-
specified falsifiers, short matrix, BUILD-REPORT, Atlas regeneration, immutable
candidate commit, and push. The gate, expected manifest, schedule, timeout,
fixture, Main, preload, Kernel, canvas persistence, terminal body, and all other
product files remain byte-unchanged from `4548736`.

A fresh different-model Verifier records the candidate SHA before and after,
reruns both focused tests, the live gate, the named falsifier sample and short
matrix, and writes `docs/orders/evidence/r16/VERIFICATION.md` only on full PASS.
No package, installer, release, worktree, wrapper, or helper framework is part
of this repair.

Plain meaning: keep each real Hermes terminal intact, but add the three small
Kernel-backed identity facts that let Ryan inspect who that seat is in the
research world.

## ONE-MINUTE BUDGET REPAIR - overlap specialists and never mask the red

Session-receipt WIP SHA `eb2300631385673794a59110b6fba19a508b7703` is
evidence, not a candidate. Its renderer tests pass 6/6 and the unchanged gate
contract passes 11/11. The live command returned after 61.152 seconds with the
normal owned process set already at zero, but all three roots still present:

```text
normal-exception shutdown_requested=true owned_processes_remaining=0
roots_created=3 roots_remaining=3 retried=0 leaked=[three exact roots]
error: research-world-visible cleanup left roots
```

`removeRegisteredRoot()` made zero attempts because the hard deadline had
already expired. The root assertion then threw before `primary_failure` and
`cleanup_failures` were printed, violating this order's existing requirement
that cleanup never hide the functional failure.

The one-minute ceiling and one global eight-second cleanup reserve remain exact.
No assertion, launch, world interaction, failure case, or cleanup obligation is
removed. This repair changes only scheduling inside the first normal stage and
receipt-safe cleanup behavior.

### Exact repair

1. Export exactly one helper named `scheduleFirstWorldSpecialists`. It receives
   an executor-spawn callback and critic-spawn callback, invokes both callbacks
   synchronously before awaiting either promise, then returns
   `Promise.all([executor, critic])` in that fixed order. A focused fake-runner
   holds both promises unresolved and fails within 250 ms unless both callbacks
   have started. It resolves the critic promise first and the executor promise
   second, then must still receive exactly `["executor-result",
   "critic-result"]`; a reversed return array is red. The first normal stage
   calls this helper immediately after the Director question returns, using the
   unchanged production `qf.dock.spawn` calls for `hermes-worker` and
   `hermes-critic`.
2. Keep `RESEARCH_WORLD_VISIBLE_DEADLINE_MS = 60_000` and
   `CLEANUP_RESERVE_MS = 8_000`. Print `first_world_stage_ms=<n>` after the first
   13/15 world has passed, its app has closed, its process set is zero, and its
   saved-state check has passed. The value is monotonic milliseconds since the
   original gate start and must be below the functional deadline.
3. `removeRegisteredRoot(root, deadlineAt)` makes one immediate removal attempt
   whenever the resolved root exists, even when `remainingMs(deadlineAt) === 0`.
   After that first attempt it retries only transient `EBUSY`, `EPERM`, or
   `ENOTEMPTY` errors while time remains, with the existing bounded delay. It
   never waits after the deadline. Its focused test creates one isolated temp
   root, passes an already-expired deadline, and must observe `attempts=1` and
   that root absent. The test owns and removes only its exact temp root.
4. Root cleanup never throws before receipts. Associate each normal/failure/
   timeout root with its existing case. A root-removal failure or surviving root
   becomes that case's `cleanupError`. “An earlier functional error exists”
   means any final case outcome has `functionalError !== undefined` after fixed
   normal/failure/timeout merging. If none does and the hard deadline is
   exceeded, set the normal case's functional error to exactly
   `research-world-visible exceeded its 60 second total deadline`. A cleanup
   error is never a functional error and never becomes `primary_failure`.
5. After all process and root cleanup attempts have finished, print exactly one
   final receipt block in this fixed order: the existing `roots_created=...`
   line, `primary_failure=...`, then `cleanup_failures=...`. Do not print those
   three lines per attempt. Only after the one complete block exists may the
   gate assert the hard deadline, zero roots, and `receipts.ok`. Thus a cleanup
   defect can make the gate red but cannot replace or suppress the primary
   receipt.

### Builder and acceptance authority

A fresh Builder starts only from clean local and remote
`eb2300631385673794a59110b6fba19a508b7703` plus the Router's pushed Reader-fix
commit. It may change only:

- `qa/gates/research-world-visible.ts`;
- `qa/gates/research-world-visible.test.ts`;
- `docs/orders/evidence/r16/BUILD-REPORT.md`; and
- generated Atlas projections required by normal change control.

It runs Atlas preflight and the focused gate contract before exactly one live
`bun qa/run.ts research-world-visible`. A red stops with all three exact receipt
lines. A green proceeds through the already-specified falsifiers, short matrix,
BUILD-REPORT, Atlas regeneration, immutable candidate commit, and push. Every
product file, expected 13/15 manifest, selector, fixture, Main/preload/Kernel
behavior, native-key check, saved-state check, four real Electron launches, and
cleanup ownership rule remains byte-unchanged from `eb23006`.

A fresh different-model Verifier records the candidate SHA before and after,
reruns the focused test, live gate, named falsifier sample and short matrix, and
writes `docs/orders/evidence/r16/VERIFICATION.md` only on full PASS. No package,
installer, release, worktree, wrapper, or helper framework is part of this
repair.

Plain meaning: start the two specialist seats together, keep the same hard
one-minute proof, and always clean up and tell the truth even when time runs out.

## NATIVE TAB DIAGNOSTIC - name the focus thief before repair

Budget-repair WIP SHA `c8c7094a56d4be5c23abf40ea8e4d8f496d21fcc` is
evidence, not a candidate. Its focused contract passes 13/13. Its single live
run completed process and root cleanup with zero residue and zero cleanup
failures, and preserved this primary failure:

```text
renderer_error={"label":"tab-focus-step","message":"native Tab focus left the research world"}
```

The failure is inside the unchanged R16 native-key acceptance contract, but the
receipt discards the failing step, expected target, and actual focused element.
No product or assertion repair is authorized until that finite evidence exists.

### Exact diagnostic

Change only `qa/gates/research-world-visible.ts` and its focused contract test.
Export exactly one new renderer-expression helper named
`tabFocusObservationExpression()`. It reads `document.activeElement` and returns
this exact `FocusedElementReceipt` shape in this key order:

```text
{"tag":string,"id":string,"class":string,"input_type":string,"world_type":string,"world_id":string,"control":"tile"|"button"|"other","accessible_name":string}
```

The existing planned `KeyboardFocusReceipt` means exactly
`{"type":string,"id":string,"control":"tile"|"button","accessible_name":string}`.
At each native-Tab step, evaluate the new expression before asserting. The
actual equals the planned target only when `world_type === type`,
`world_id === id`, `control` is the same `tile` or `button`, and
`accessible_name` is byte-equal. When any comparison differs, first print one
standalone line to stdout, then throw an Error containing that same complete
line. Its exact outer shape and stable key order are:

```text
tab_focus_failure={"step":<zero-based integer>,"expected":<KeyboardFocusReceipt>,"actual":{"tag":<lowercase tag or "none">,"id":<string>,"class":<string>,"input_type":<string>,"world_type":<string>,"world_id":<string>,"control":<"tile"|"button"|"other">,"accessible_name":<string>}}
```

`tag` is the lowercase `tagName`, or `none` when no Element is active. `id` is
the active element's id or empty. `class` is its `className` only when that is a
string, otherwise empty. `input_type` is its exact `type` attribute or empty.
World type/id are the exact `data-qf-world-type` and `data-qf-world-id` values
from the closest `.canvas-tile[data-qf-world-type]`, or empty. `control` is
`tile` only when the active element is that closest tile, `button` only when it
is an HTML button inside that tile, and `other` otherwise. Accessible name is
the first non-empty trimmed string among aria-label, title, and textContent, or
empty. The existing exact expected-order assertion remains unchanged
in strength; missing, extra, reordered, disabled, skipped, trapped, or external
focus is still red.

The focused test evaluates `tabFocusObservationExpression()` with mocked DOM
globals against (a) an exact tile, (b) a button within a tile, and (c) an
outside input, and asserts all exact fields above. The 13 tests present at
`c8c7094` remain byte-identical; only the import list may be extended and one
new test named `describes exact Tab focus targets and an outside focus thief`
may be appended. `bun test qa/gates/research-world-visible.test.ts` must report
exactly 14 pass and 0 fail. A diff that deletes, renames, or changes any of the
13 existing test bodies is red.

Run Atlas preflight, the focused contract, then exactly one live
`bun qa/run.ts research-world-visible`. On red, preserve and report the exact
`tab_focus_failure`, `roots_created`, `primary_failure`, and `cleanup_failures`
lines. On green, continue the already-authorized short matrix and candidate
path. No package, installer, release, worktree, wrapper, timeout increase,
fixture change, product change, assertion weakening, or cleanup outside the
gate.

The conditional repair boundary is mechanical. A gate-only defect exists only
when the active element is the exact expected tile/button and the new receipt
serialized or compared it incorrectly, or when the gate-owned sentinel remains
active after the acknowledged native Tab. The same Builder may repair only that
gate defect, add one focused red/green test, and run one final live gate. If the
actual element is outside the expected research tile, an unplanned focusable is
interleaved, or an expected tile/button is skipped or reordered, that is a
product DOM-order/focusability defect: stop with the receipt for a separately
bounded product repair. No repair may skip or omit a real focus target.

Plain meaning: identify the exact element that steals Tab focus, then fix only
what the evidence names.

## TERMINAL TAB-ORDER REPAIR - keep guest webviews out of shell traversal

Diagnostic WIP SHA `49e9fd529a4dae8f70681e26478719ecdca7fc09` is
evidence, not a candidate. Its focused contract passes 14/14. Its single live
run removed all roots and processes with no cleanup failure and produced this
standalone product receipt:

```text
tab_focus_failure={"step":9,"expected":{"type":"artifact","id":"<nonce-specific artifact id>","control":"button","accessible_name":"Inspect artifact <same id>"},"actual":{"tag":"webview","id":"","class":"","input_type":"","world_type":"agent_session","world_id":"<live Hermes session id>","control":"other","accessible_name":""}}
```

The active element was a real terminal guest webview inside an agent-session
tile. It interleaved with the shell's research-object Tab sequence. The gate's
planned target and active-element serializer were correct, so no gate or
assertion change is authorized.

### Exact product repair

Change only:

- `collab-electron/src/windows/shell/src/tile-manager.js`;
- `collab-electron/src/windows/shell/src/tile-manager-layout.test.ts`;
- `docs/orders/evidence/r16/BUILD-REPORT.md`; and
- generated Atlas projections required by normal change control.

In `spawnTerminalWebview`, immediately after
`document.createElement("webview")` and before setting source/preload or
appending it, set that guest element's DOM `tabIndex` property to exactly `-1`.
This removes a terminal guest from sequential shell Tab traversal. It does not
make the webview inert, disable pointer input, or remove programmatic focus.
The existing `focusCanvasTile` call to `dom.webview.focus()` remains
byte-unchanged, so clicking a terminal tile and the existing focused-tile
shortcut can still enter the terminal.

Add exactly one focused test to `tile-manager-layout.test.ts` named
`keeps terminal guests out of Tab order without removing programmatic focus`.
It extracts the `spawnTerminalWebview` body and fails unless the create call is
followed by `wv.tabIndex = -1` before `setAttribute("src"` and before
`dom.contentArea.appendChild(wv)`. It extracts `focusCanvasTile` and fails
unless that body still contains `dom.webview.focus()`. The two existing tests
remain byte-identical. The file must report exactly 3 pass and 0 fail. The
unchanged R16 focused contract must remain exactly 14 pass and 0 fail.

The source-focused test is not the runtime product proof. It pins the exact
repair and retained programmatic-focus seam cheaply; the unchanged live
`research-world-visible` native-Tab sequence is the runtime proof and remains
mandatory.

### Builder and acceptance authority

A fresh Builder starts only from clean local and remote
`49e9fd529a4dae8f70681e26478719ecdca7fc09` plus the Router's pushed Reader-fix
and Atlas-refresh commits. It runs Atlas preflight, the 3-test tile-manager
file, and the 14-test R16 contract, then exactly one live
`bun qa/run.ts research-world-visible`. Any red stops with its exact
`tab_focus_failure` when present, `roots_created`, `primary_failure`, and
`cleanup_failures` receipts. A green proceeds through exactly this short matrix
once; any nonzero exit is red:

```text
bun test collab-electron/src/windows/shell/src/tile-manager-layout.test.ts
bun test qa/gates/research-world-visible.test.ts
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts one-skin
bun qa/run.ts doc-links
bun qa/run.ts rung-ladder
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
```

The one cheap falsifier sample is exact. After the green live run, temporarily
change only the new `wv.tabIndex = -1` assignment to `wv.tabIndex = 0`, run
only the 3-test tile-manager file, and require a native nonzero exit naming the
new test. Restore the exact candidate line, require `git diff` for
`tile-manager.js` to be empty relative to the pre-mutation working state, and
rerun the same file to exactly 3 pass / 0 fail. The pre-repair live receipt at
`49e9fd5` is the real runtime red; this mutation proves the cheap regression
guard and never launches a second app.

After product/tests are green, commit them as `product_candidate_sha`. Write
`docs/orders/evidence/r16/BUILD-REPORT.md` with exactly: base WIP SHA; product
candidate SHA; changed production/test paths; `git diff --check` exit; focused
test command/exits/counts; the pre-repair `49e9fd5` standalone
`tab_focus_failure`; the post-repair live `tab_focus_receipts`,
`keyboard_tiles`, `roots_created`, `primary_failure`, `cleanup_failures`, PASS,
and native exit; every short-matrix command/exit; falsifier mutation/red/
restoration/green receipts; Atlas check/ratchet summary; and an explicit
statement that no product file changed after `product_candidate_sha`. Commit
that report, regenerate Atlas from the resulting clean commit, run Atlas check,
ratchet, and `git diff --check`, then commit only changed generated Atlas
projections. That final clean pushed HEAD is the immutable Builder candidate.

No other webview constructor, renderer, fixture, expected focus target,
assertion, timeout, schedule, Kernel behavior, package, installer, release,
worktree, wrapper, or cleanup path changes. A fresh different-model Verifier
records the candidate SHA before and after and requires them equal while it
reruns the two focused tests, the one live gate, the exact cheap falsifier
sample, and every short-matrix command above. Only full green may create
`docs/orders/evidence/r16/VERIFICATION.md`. That file must name: immutable
candidate SHA; unchanged pre/post SHA and clean status; every command and native
exit; exact live Tab/keyboard/root/primary/cleanup/PASS receipts; falsifier red,
restoration-zero-diff, and restored-green receipts; Atlas hard-red/unexplained
coverage totals; and a final `verdict: PASS`. The Verifier commits only that
evidence file after measurement; the evidence commit is not the measured
candidate.

Plain meaning: Tab stays on QuantFlow's shell controls; a click or explicit
focus still enters the real Hermes terminal.

## SENTINEL SETTLE REPAIR - observe one native Tab before judging it

Terminal-focus WIP SHA `808e5382aa685655e00021382709a28d40ef475c` is
evidence, not a candidate. The tile-manager repair tests pass 3/3 and the R16
contract passes 14/14. Its one live run kept the gate-owned sentinel focused at
step 0 immediately after the acknowledged native Tab; all roots and processes
were removed and cleanup failures were empty. The exact actual receipt was the
sentinel button itself, with id `qf-r16-tab-sentinel-<timestamp>`.

This is the gate-owned sentinel case already defined by the preceding
diagnostic's mechanical decision rule. The terminal product repair remains
unchanged. No second key input, product edit, target omission, assertion change,
or longer gate deadline is authorized.

### Exact gate repair

Change only `qa/gates/research-world-visible.ts` and its focused contract test.
Export one helper named `waitForSentinelDeparture`. It receives the sentinel id,
an async observation callback returning `FocusedElementReceipt`, an async pause
callback, and a monotonic `now` callback. It records `deadlineAt = now() + 250`
once, then reads immediately. While and only while the actual `id` equals the
exact sentinel id, it may pause `min(10, deadlineAt - now())` milliseconds and
read again, for at most 25 pauses / 26 total reads and never after `now() >=
deadlineAt`. Thus both the actual monotonic 250 ms ceiling and the read ceiling
bind independently even when observation or pause callbacks are slow. It
returns the first receipt whose id
differs from the sentinel, including any wrong external element. If all 26 reads
still name the sentinel, or the monotonic deadline arrives first, it returns the
last sentinel receipt. It never sends or retries a key input and never
suppresses a receipt.

In `exerciseNativeKeyboard`, use this helper only after the first native Tab
and before the existing exact comparison for step 0. Every later step retains
its immediate observation. A wrong non-sentinel element is compared and fails
immediately; a stuck sentinel fails through the unchanged
`tab_focus_failure` after at most 250 ms.

Append exactly three tests to the existing R16 contract file without changing
its 14 current test bodies. The first returns the sentinel twice and this exact
complete third receipt:

```text
{"tag":"div","id":"ontology:mission:m","class":"canvas-tile","input_type":"","world_type":"mission","world_id":"m","control":"tile","accessible_name":"mission m"}
```

It must observe two 10 ms pauses, three reads, and that exact return. The second
uses a fake monotonic clock and returns the sentinel until the 250 ms deadline;
it must prove no pause crosses the deadline and no read occurs afterward. A
separate read-count case in that same test keeps `now()` below the deadline and
must observe exactly 25 pauses, 26 reads, and the final sentinel receipt. The
third returns an outside input on its second read and must return that exact
wrong receipt after one pause, without further read or pause; it also source-
checks that `exerciseNativeKeyboard` contains exactly one
`pressNativeKey(endpoint, "Tab")` call and `waitForSentinelDeparture` contains
none. It also checks the complete gate source still contains exactly one
`"app.ui.pressKey"` string. The candidate diff from the recorded Builder-open
SHA must contain no added line bearing `pressNativeKey`, `rpcCall`,
`app.ui.pressKey`, `sendInputEvent`, or an alias assignment to any of them;
only the pre-existing single Tab call may send input. The file must report
exactly 17 pass and 0 fail. The tile-manager file remains exactly 3 pass and 0
fail.

### Builder and acceptance authority

A fresh Builder starts only when `808e538` is an ancestor and clean local HEAD
equals remote `origin/wo-R16` and the exact Builder-open SHA supplied by the
Router in the task prompt after the final Reader/NEXT/Atlas commits. The Builder
records that supplied SHA in BUILD-REPORT. It runs Atlas preflight, the 3-test
tile-manager file, and the 17-test R16 contract, then exactly one live
`bun qa/run.ts research-world-visible`. Any red stops with exact focus/root/
primary/cleanup receipts. Green resumes the exact short matrix, cheap
tabIndex falsifier, BUILD-REPORT, candidate sequencing, and fresh different-
model verification specified in TERMINAL TAB-ORDER REPAIR.

No product, Main, key bridge, fixture, expected target, assertion, timeout,
schedule, package, installer, release, worktree, wrapper, or helper framework
change. Builder and Verifier command logs must contain exactly one invocation of
the live gate; `git diff --name-only` against the recorded Builder-open SHA must
contain only the allowed gate/test/report/generated-Atlas paths;
`git ls-files --others --exclude-standard` must be empty; and final
`git status --porcelain=v1` must be empty. The Builder report records all three
outputs and the Verifier reruns them. Any second live invocation, other changed
or untracked path, added key-send symbol, second Tab call in the source scan,
missing receipt, or evidence written before green is red. Plain meaning: give
the one native Tab up to a quarter-second to become observable; never send it
twice and never call a wrong destination correct.

## FOUNDER MOUSE-FIRST CORRECTION - remove invalid global Tab parity

Founder authorization, 2026-08-21:

> QuantFlow is currently a founder-operated desktop product where canvas
> navigation and controls may be mouse-first; keyboard is required for normal
> text/terminal input and must not become trapped. Remove global Tab-order
> parity as an R16 acceptance requirement and record full keyboard-accessibility
> parity as later product debt before any broader release. Preserve every
> ontology, 13-object/15-cable, interaction, reopen, and cleanup assertion.

WIP `90672d93e6bb0bdb6d4aa95eaada4dc3599cf51a` is evidence, not a
candidate. Its focused contracts pass, but its single live run still focused a
real Hermes agent-session `<webview>` at step 0. All three reported PIDs were
absent on the Router's post-run process check. The global sentinel/Tab
assertion is superseded by this founder ruling; no other R16 assertion is
removed.

### Exact supersession map

This final section is the only live authority for R16 keyboard acceptance. It
supersedes only these earlier requirements, wherever they appear above:

- `Product scene and register`: remove `Tab` from the list of R16-required
  canvas interactions. Click, Enter, Escape, arrow-key behavior already owned
  by focused tests, and ordinary terminal/text input remain unchanged.
- `Layout and interaction`: lines beginning `Native Tab reaches every
  research-object tile...` through `The sentinel is always removed.` no longer
  bind. The immediately following ten-tile native Enter/Escape requirement and
  existing cable keyboard parity still bind.
- `Product gate`, item 5: the native-Tab sequence, `tab_focus_receipts`, and the
  missing/extra/reordered/skipped/trapped Tab-target condition no longer bind.
  Pointer Inspect/Collapse and the complete ten-tile native Enter/Escape receipt
  still bind.
- Every later rewrite instruction that requires a sentinel, a native Tab send,
  `tab_focus_*`, or exactly one Tab call is spent history and does not bind this
  correction.

Nothing in this map waives the exact ontology, 13-object/15-cable, pointer,
Enter/Escape, reopen, failure, timeout, cleanup, receipt, or Atlas assertions.

### Exact correction

1. In `collab-electron/src/windows/shell/src/tile-manager.js`, remove only the
   ineffective `wv.tabIndex = -1` line. Preserve the existing click path and
   `focusCanvasTile` call to `dom.webview.focus()` byte-for-byte. In
   `tile-manager-layout.test.ts`, remove only the superseded third test and
   retain the two original layout tests byte-identically; the file reports
   exactly 2 pass / 0 fail. The focused R16 contract must also read
   `tile-manager.js` and fail while the literal `wv.tabIndex = -1` assignment
   remains; otherwise this required product deletion is not accepted.
2. In `qa/gates/research-world-visible.ts`, delete the gate-owned Tab sentinel,
   global Tab plan/observation/comparison, `waitForSentinelDeparture`, all
   `tab_focus_*` receipts, and every native Tab send. Retain direct shell focus
   of each of the ten research-object tiles: select the exact
   `.canvas-tile[data-qf-world-type]` by independent expected type/id, call that
   tile element's native `focus()`, and require `document.activeElement` to be
   that same tile before and after each key. Follow it with the unchanged native
   Enter-expand and Escape-collapse assertions. Retain exactly
   `keyboard_tiles=10 enter=10 escape=10 focus_retained=20`.
3. In the focused gate contract, delete only the diagnostic Tab-observation
   test and the three sentinel-settle tests. Update the existing native-key
   contract test to require the Enter/Escape receipt, reject `tab_focus_`,
   reject sentinel creation, reject any `pressNativeKey(endpoint, "Tab")`, and
   confirm the product renderer's research-world key handler contains no
   `event.key === "Tab"` and no Tab `preventDefault`. It also confirms terminal
   `focusCanvasTile` still contains `dom.webview.focus()`. The file reports
   exactly 13 pass / 0 fail.
4. [Debt #38](../DEBT.md) is the durable release-precondition receipt. No R16
   report may claim full keyboard accessibility. It may claim only mouse-first
   canvas interaction; pointer Inspect/Collapse; tile Enter/Escape parity when
   focused; and that this correction leaves normal text/terminal keyboard paths
   unchanged and introduces no Tab interception. Those last two claims mean
   exactly: `focusCanvasTile` retains its byte-identical
   `dom.webview.focus()` path, the research-world renderer has no Tab handler or
   Tab `preventDefault`, and the only product-code diff in this correction is
   removal of `wv.tabIndex = -1`. R16 does not claim a new positive end-to-end
   terminal-typing or global no-trap proof; Debt #38 owns that broader release
   proof.

Every ontology assertion, independent Oracle, exact 13 objects and 15 cables,
all displayed fields, pointer Inspect/Collapse, Enter/Escape, duplicate reveal,
layout collision, Mission/Task activation, close/reopen equality, four real
Electron launches, failure/timeout cases, 60-second ceiling, process cleanup,
root cleanup, primary/cleanup receipt precedence, and Atlas control remains
unchanged.

### Builder and verification

Allowed changes only:

- `collab-electron/src/windows/shell/src/tile-manager.js`;
- `collab-electron/src/windows/shell/src/tile-manager-layout.test.ts`;
- `qa/gates/research-world-visible.ts`;
- `qa/gates/research-world-visible.test.ts`;
- `docs/orders/WO-R16.md`, `docs/orders/NEXT.md`, and `docs/DEBT.md`, Router
  edits only;
- `docs/orders/evidence/r16/BUILD-REPORT.md`; and
- `docs/orders/evidence/r16/VERIFICATION.md`, Verifier only; and
- generated `qf-atlas/ATLAS.md`, `qf-atlas/atlas.html`, and
  `qf-atlas/atlas.json` only.

A fresh Builder starts from the exact clean local/remote SHA supplied after a
fresh Reader returns YES/YES. It runs Atlas preflight, the 2-test tile-manager
file, and the 13-test R16 contract, then exactly one live
`bun qa/run.ts research-world-visible`. Any red stops with exact root/primary/
cleanup receipts. Green runs the exact short matrix already specified by
TERMINAL TAB-ORDER REPAIR. Its cheap falsifier is replaced by: temporarily
delete the `keyboard_tiles=10 enter=10 escape=10 focus_retained=20` contract
string, require the 13-test contract to go red, restore to zero diff, and
require 13/0 green. No second invocation of
`bun qa/run.ts research-world-visible` is allowed during that Builder or
Verifier pass; the one invocation still performs the inherited normal,
close/reopen, forced-failure, and forced-timeout sequence and therefore retains
all four real Electron launches.

BUILD-REPORT retains every previously required field except `tab_focus_*` and
records instead: founder mouse-first authorization; Debt #38; pointer receipt;
exact Enter/Escape receipt; normal terminal focus seam unchanged; no Tab handler
or Tab preventDefault in research-world product code; all live world/reopen/
cleanup receipts; matrix exits; falsifier red/restored-green; Atlas summary;
and immutable measured candidate SHA. That SHA means the Builder commit supplied
to the Verifier containing the complete product, gate, focused-test,
BUILD-REPORT, and generated-Atlas changes. The Verifier records that candidate
SHA before and after measurement. Any later verification-evidence/Atlas commit
is a distinct final evidence HEAD and must record both itself and the unchanged
measured candidate; it must never be described as the product SHA. The fresh
different-model Verifier reruns the same bounded matrix and one live gate, and
writes `docs/orders/evidence/r16/VERIFICATION.md` only on full PASS.

No composite focus widget, custom Tab router, focus trap, Main/preload/key
allowlist change, Kernel/fixture change, timeout increase, package, installer,
release, worktree, wrapper, or helper framework. Plain meaning: prove the
founder-visible research world with mouse plus retained tile activation keys,
leave terminal typing alone, and defer honest full keyboard parity to Debt #38.

## NATIVE ENTER/ESCAPE SETTLE REPAIR - distinguish delivery lag from failure

The mouse-first Builder WIP is preserved at
`6cb2a7733b582ff10b06eb32ac31b1dbd4f8c403`; it is evidence, not a
candidate. Its tile-manager contract passed 2/2 and its focused R16 contract
passed 13/13. Its only live invocation reached the exact native keyboard proof
and stopped on:

`native Enter did not expand hypothesis:<nonce> with focus retained`

Cleanup was fully green: `roots_created=3 roots_remaining=0 retried=0
leaked=[]` and `cleanup_failures=[]`. The Main proof method queues Electron
`keyDown` and `keyUp`, then immediately acknowledges `{ key, sent: true }`;
the gate currently samples renderer state in the next RPC with no settle. That
sample cannot distinguish a rejected key from queued delivery that completes
after the sample. The retained assertion must become temporally honest without
sending the key twice.

This repair inherits the entire `FOUNDER MOUSE-FIRST CORRECTION` above and
changes only the post-send observation timing and its failure receipt:

1. In `qa/gates/research-world-visible.ts`, each research tile is still selected
   by independent expected type/id and directly focused exactly once. Send
   native Enter exactly once, then poll only renderer state for at most 250 ms,
   in at most 25 ten-millisecond pauses, until the exact target tile is expanded
   and `document.activeElement` is that same tile. Send native Escape exactly
   once, then use the same bound until the target is collapsed with focus still
   on that tile. A poll never calls `app.ui.pressKey` or any input sender.
2. Each observation reports the target tile's type/id and details-hidden state
   separately from the active element's tag/id/world type/world id. Exhausting
   either bound is red and prints one
   `keyboard_state_failure=<JSON>` containing key, expected type/id and state,
   attempts, elapsed milliseconds, and the final actual target/focus state. A
   moved focus, missing tile/details body, wrong expanded/collapsed state, or
   second send remains red. The success receipt remains exactly
   `keyboard_tiles=10 enter=10 escape=10 focus_retained=20`.
3. Keep `qa/gates/research-world-visible.test.ts` at exactly 13 tests. Extend
   the existing native-key contract test rather than adding a test: exercise
   the exported bounded settle helper with delayed-success and never-success
   observations; prove the ten-millisecond pause, 250-millisecond/25-pause
   ceiling, and final actual receipt; source-check exactly one Enter call and
   one Escape call in the per-tile loop; and prove the settle helper contains no
   `pressNativeKey`, `app.ui.pressKey`, or other input sender.

Allowed Builder changes are now only
`qa/gates/research-world-visible.ts`,
`qa/gates/research-world-visible.test.ts`,
`docs/orders/evidence/r16/BUILD-REPORT.md`, and the three generated Atlas
projections named above. Router-only authority edits and the Verifier-only
evidence path remain as already named. The product renderer, tile manager,
Main, preload, Kernel, fixture, timeout, and every assertion are frozen at WIP
`6cb2a77`.

A fresh Reader must return YES/YES before a fresh Builder starts. That Builder
runs Atlas preflight, requires tile-manager 2/0 and R16 contract 13/0, then runs
exactly one `bun qa/run.ts research-world-visible`. Any red stops with the new
exact keyboard failure plus primary/root/cleanup receipts. Green continues with
the inherited short matrix, falsifier, report, Atlas refresh, immutable
candidate commit, and push. The different-model Verifier later receives the
same one-live-gate budget. No second input send, live-gate invocation, timeout
increase, product workaround, helper framework, package, installer, release,
worktree, R17 work, or accessibility claim is authorized.

### Reader-defect closure - exact settle algorithm and frozen proof surface

The first Reader correctly rejected the preceding wording. These requirements
close its defects and are part of the same repair:

1. Before each Enter send, observe and require the exact target tile present,
   its details body present and collapsed, and that exact tile focused. Before
   each Escape send, require the same target present, its details body present
   and expanded, and that exact tile focused. The transition itself is therefore
   required; an already-satisfied state cannot make a missing key green.
2. Before each send, install one gate-owned `focusout` latch on the exact target
   tile. Every observation reads that latch. Any focus departure, even if focus
   later returns before a poll, is red. In `finally`, remove the exact listener
   and all temporary probe state. The gate must leave no DOM attribute, global,
   listener, or other renderer state behind.
3. The settle clock is `performance.now()`. Capture `startedAt` immediately
   before the first observation and `deadlineAt = startedAt + 250`. Observation
   attempt 1 is immediate. After an unmet observation, check the deadline, then
   make at most 25 pauses of `min(10, deadlineAt - now())` milliseconds; never
   start or finish an intentional pause past the deadline. Each pause is
   followed by at most one observation, so the absolute ceiling is 26 reads.
   Time spent inside a read counts against the same deadline. Each renderer RPC
   receives a timeout of the positive remaining settle milliseconds; a rejected
   or timed-out read becomes the same exact red receipt rather than hanging.
4. `keyboard_state_failure` has one exact schema:
   `{ key, expected: { type, id, details_hidden, focused: true }, before,
   attempts, pauses, elapsed_ms, observation_error, actual }`.
   Both `before` and `actual` are DOM observations with exactly
   `{ target_present, target_world_type, target_world_id, details_present,
   details_hidden, active_tag, active_id, active_class, active_world_type,
   active_world_id, active_control, active_accessible_name,
   focus_lost_latched }`. Missing values are empty strings or `null`, never the
   expected value copied into an actual field. `elapsed_ms` is the clamped
   monotonic elapsed value at the final observation/error. The target fields
   come from the selected DOM element's dataset; active fields come from
   `document.activeElement` and its closest research tile.
5. `pressNativeKey` remains byte-identical to WIP `6cb2a77`. The focused native
   contract extracts its body and requires exactly one
   `rpcCall(endpoint, "app.ui.pressKey", ...)`. It extracts the per-tile loop and
   requires exactly one `pressNativeKey(endpoint, "Enter")` and one
   `pressNativeKey(endpoint, "Escape")`. It extracts the settle helper and
   rejects `pressNativeKey`, `app.ui.pressKey`, `rpcCall`, `sendInputEvent`, or
   any input sender there. This makes a duplicated idempotent Escape red.
6. The same existing native-key test, changed to async, exercises the settle
   helper without increasing the 13-test count. A delayed-success fixture proves
   the immediate read, ten-millisecond pauses, final DOM-shaped actual, and
   successful transition. A never-success fixture proves exactly 25 pauses, no
   more than 26 reads, the 250-millisecond monotonic ceiling, and the final
   actual. A never-resolving observation must be bounded by its supplied
   remaining-time timeout and return the exact observation-error result. A
   focus-lost latch fixture stays red even when later state/focus appear correct.
7. The candidate diff against WIP `6cb2a77` is itself an acceptance gate. In
   `research-world-visible.ts`, `pressNativeKey`, all content before it, and all
   content from `async function observeWorld` onward must be byte-identical to
   WIP; only new settle types/helpers between those markers and
   `exerciseNativeKeyboard` may change. In the focused test, only its import list
   and the existing native-key contract test may differ; the other 12 test
   bodies remain byte-identical to WIP. Builder and Verifier each record and
   inspect `git diff 6cb2a77 --` for those exact regions. Any other changed line
   is red. This freezes the retained ontology, 13-object/15-cable, pointer,
   reopen, failure/timeout, 60-second, cleanup, receipt-precedence, and Atlas
   assertions rather than trusting the 13-test count alone.

The Reader rereads this closure and the preceding repair together. Every other
bound, allowed path, one-live-invocation rule, matrix, falsifier, report, and
Verifier requirement remains unchanged.

### Second Reader-defect closure - sender ownership, hard read timeout, cleanup proof

The second Reader found three remaining escape hatches. Close them as follows;
this subsection overrides only the corresponding helper/test mechanics above:

1. One exported `exerciseKeyTransition` helper owns the complete lifecycle for
   one Enter or Escape transition: install probe, capture/validate `before`, call
   its supplied `send` callback exactly once, settle, return or throw the exact
   receipt, and remove the probe in `finally`. The per-tile loop calls this
   helper once for Enter with `() => pressNativeKey(endpoint, "Enter")` and once
   for Escape with `() => pressNativeKey(endpoint, "Escape")`; it has no other
   transport or input call. The focused contract extracts the loop and requires
   exactly two total `pressNativeKey` occurrences, each equal to one of those
   two literal callbacks. It rejects any additional occurrence or any
   `rpcCall`, `app.ui.pressKey`, `sendInputEvent`, `executeJavaScript`,
   `postMessage`, `.send(`, `.emit(`, `.dispatch`, `.bind(`, `.call(`,
   `.apply(`, or assignment/alias of `pressNativeKey` in that loop. The helper's
   behavioral fixtures count the supplied `send` calls and require exactly one
   on delayed success, timeout, and focus-loss failure. `pressNativeKey` itself
   retains the separate exact-one-`rpcCall` source check.
2. Supplying a remaining-time value to `observe` is not the timeout. Every
   observation is independently wrapped in `Promise.race` against a gate-owned
   timer for the positive remaining settle milliseconds. The timer is cleared
   in `finally`; the losing observation promise is ignored and cannot trigger a
   second send or a second receipt. The never-resolving fixture supplies an
   observation promise that never settles and must still return the exact
   `observation_error` failure by the 250-millisecond outer bound. This fixture
   uses the real monotonic clock for that case; it may not rely on the callback
   honoring a timeout parameter.
3. Probe cleanup is behavioral, not source-only. The transition helper receives
   `installProbe` and `removeProbe` seams used by the real renderer expressions.
   In each delayed-success, never-success, never-resolving, send-rejection, and
   latched-focus-loss fixture, the existing native-key test requires: install
   once, remove once in `finally`, listener count zero, temporary probe state
   absent, and send count either exactly one or, for a `before`-state rejection,
   exactly zero. The real cleanup expression removes the named `focusout`
   listener from the exact target and deletes the one gate-owned probe key. The
   focused contract evaluates install/cleanup against a minimal fake target and
   fails unless both the listener and probe key are absent afterward.

No new test is added: all of these fixtures remain inside the one existing
native-key contract test, keeping the file at 13/0. The diff-freeze rule and all
other acceptance requirements remain unchanged.

## FOUNDER POINTER-FIRST CLOSURE - stop keyboard proof cycles

Founder authorization, 2026-08-21:

> R16 is mouse-first. Do not spend further R16 cycles proving Enter/Escape tile
> parity or global keyboard navigation. Record those as later
> accessibility/product debt. R16 may close when the production app proves by
> real pointer interaction that the full 13-object/15-cable research world is
> visible and inspectable, Hermes terminals remain usable for mouse-focus plus
> keyboard typing, close/reopen preserves the world, and cleanup is clean. After
> independent verification, stop before R17 and run the normal application
> through Computer Use as a consumer working-build check.

This is the final R16 authority. Every `NATIVE ENTER/ESCAPE SETTLE REPAIR`
section above is spent history and authorizes no implementation. Global Tab
navigation and research-tile Enter/Escape parity are both deferred to
[Debt #38](../DEBT.md). Removing them removes no ontology, visibility, field,
cable, pointer, reopen, failure/timeout, process/root cleanup, 60-second, Atlas,
or truth-boundary assertion.

### Exact machine proof

Starting from WIP `6cb2a7733b582ff10b06eb32ac31b1dbd4f8c403`:

1. In `qa/gates/research-world-visible.ts`, delete `pressNativeKey`,
   `exerciseNativeKeyboard`, every native Enter/Escape send, every
   `keyboard_*` receipt, and the `exerciseKeyboard` option. Do not add a
   replacement keyboard helper, sender, wait, probe, receipt, or proof bridge.
   The existing Main proof method is outside scope and remains untouched.
2. Replace the one-Mission pointer sample with an exact ten-object pointer
   receipt. For every independent expected object whose type is not
   `agent_session`, select the exact visible tile by expected type/id, require
   one enabled visible `.qf-world-inspect` control and one details body, click
   Inspect once, require that exact target's details visible, click Collapse
   once, and require that exact target's details hidden. Any missing/extra tile,
   missing/disabled/hidden control, wrong target, wrong transition, duplicate
   click, or focus/keyboard substitution is red. Emit exactly
   `pointer_tiles=10 inspect=10 collapse=10` only after all ten pass.
3. The live gate still proves the independent exact 13-object manifest,
   including the Director, executor, and critic Hermes `agent_session` tiles;
   every displayed field/hash; the exact 15 cable kinds/endpoints with no extra
   cable; Mission-root and Task-root activation; zero duplicate reveal; exact
   layout/non-overlap; identical full close/reopen object/field/position/
   inspector/cable manifest; the isolated saved-state allowlist; renderer/
   Oracle separation; normal, forced-failure, and forced-timeout cases; all four
   Electron launches; the existing 60-second outer ceiling; primary/cleanup
   receipt precedence; and zero owned process/root residue.
4. Keep `qa/gates/research-world-visible.test.ts` at exactly 13 tests. Replace
   only the existing native-key contract test with a pointer-first contract that
   requires the exact pointer receipt, requires iteration over all independent
   non-session objects by type/id, requires exactly one `.click()` for Inspect
   and one for Collapse per iteration, and rejects `app.ui.pressKey`,
   `pressNativeKey`, `sendInputEvent`, `keyboard_`, `tab_focus_`, a sentinel,
   and any keyboard/input sender in the live gate. The other 12 test bodies are
   byte-identical to WIP `6cb2a77`.
5. The candidate diff against WIP `6cb2a77` is an acceptance gate. In the live
   gate only deletion of the spent keyboard functions/options and replacement
   of the pointer interaction block may differ. In the focused test only its
   import list and the one replaced contract test may differ. Every other gate
   and test line, and every product file, is byte-identical to WIP. Builder and
   Verifier each inspect and record `git diff 6cb2a77 --`; any broader change is
   red.

The Builder runs Atlas preflight, tile-manager 2/0, focused R16 13/0, then
exactly one `bun qa/run.ts research-world-visible`. Any red stops with the exact
pointer/primary/root/cleanup receipts. Green runs the inherited short matrix.
The cheap falsifier now temporarily deletes the exact
`pointer_tiles=10 inspect=10 collapse=10` contract string, requires the focused
contract red, restores to zero diff, and requires 13/0 green; it never launches
the app. The BUILD-REPORT records the founder decision, Debt #38, exact pointer
receipt, 13/15 world/reopen/cleanup receipts, matrix and falsifier exits, Atlas
summary, WIP diff-freeze receipt, and immutable measured candidate SHA. It makes
no Tab or Enter/Escape parity claim.

### Independent verification and normal-app consumer check

A fresh different-model Verifier records the immutable candidate SHA before
and after, independently runs the same bounded matrix and exactly one live gate,
inspects the WIP diff freeze, and writes
`docs/orders/evidence/r16/VERIFICATION.md` only on full PASS. No package,
installer, release gate, second live invocation, worktree, clone, wrapper, or
helper framework is authorized.

Only after that independent PASS, the Router uses Computer Use against the
normal founder application—not `QF_UI_PROOF`, not the isolated gate fixture,
and not a proof-mode build—as a consumer working-build check. With ordinary
mouse input it opens or focuses the real research world, confirms the visible
13-object/15-cable desk and opens/closes representative research inspectors.
It mouse-focuses a real Hermes terminal, types a unique harmless canary without
submitting it, observes that text in the terminal, and erases it without
executing a command. It records screenshots and exact observations in
`docs/orders/evidence/r16/CONSUMER-CHECK.md`; no credential, prompt content, or
founder state is copied into the report. If the normal app lacks a real complete
world, any pointer control fails, typing is not visible/erasable, or the app is
not the measured candidate, R16 remains open with that exact consumer defect.
The check does not seed SQLite, call the proof bridge, mutate ontology truth, or
approve R17. After a consumer PASS, the Router closes R16 and stops before R17.

Allowed Builder changes are only `qa/gates/research-world-visible.ts`,
`qa/gates/research-world-visible.test.ts`,
`docs/orders/evidence/r16/BUILD-REPORT.md`, and the three generated Atlas
projections. Router-only authority/debt/consumer evidence and Verifier-only
verification evidence remain separate. No product change, keyboard repair,
timeout change, fixture change, assertion weakening, R17 work, or broader
accessibility claim is authorized.

### Pointer-first Reader-defect closure - machine clicks versus real mouse

The first Reader correctly found that DOM `.click()` is not a physical pointer
event and that the consumer check was underspecified. Close those defects as
follows:

1. The machine gate's ten-object loop is named the **DOM click-handler proof**.
   It proves the production renderer's ten exact Inspect/Collapse handlers
   against the independent manifest, but it does not claim real pointer input.
   The post-Verifier Computer Use check below is the real-mouse proof. No new
   Main/preload pointer bridge or synthetic native-input method is added.
2. The live gate contains exactly one literal
   `console.log("pointer_tiles=10 inspect=10 collapse=10")`, after the ten-loop
   count assertions and nowhere else. The focused contract requires exactly one
   occurrence in gate source. Builder and Verifier each require the live
   transcript to contain exactly one exact receipt line; zero, two, a partial
   count, or a receipt printed before all assertions is red. The BUILD-REPORT
   and VERIFICATION record the transcript line and occurrence count.
3. The normal-app Computer Use check uses real mouse input on **all ten**
   research-object tiles, in independent-manifest order. For each exact visible
   type/id it clicks Inspect once, captures the opened inspector with that same
   type/id and its displayed fields, clicks Collapse once, and observes it
   closed. Missing or duplicated tiles, an unreachable/off-screen control that
   cannot be reached by ordinary pan/scroll/Tidy, a click affecting the wrong
   tile, or any failed open/close is red. The three `agent_session` tiles remain
   visible but are tested as terminals, not as research inspectors.
4. The terminal consumer proof covers the Director, executor, and critic—three
   terminals, not a sample. For each one, Computer Use:
   - clicks the visible terminal input area with the real mouse;
   - types exactly `qf-r16-typing-check-<candidate7>` with no Enter, submit,
     newline, paste, or command execution;
   - captures the visible exact canary in that same terminal;
   - erases it using ordinary terminal editing (`Ctrl+U`, or `Ctrl+A` then
     Backspace only if the first is visibly ineffective) and captures the empty
     input line;
   - clicks the canvas background and then one named research tile, and observes
     terminal focus styling depart / canvas tile focus styling return.
   Any absent echo, wrong terminal, required submit, failed erase, or inability
   to return by mouse is red. Never type a character after leaving the terminal
   merely to test where it would land.
5. The normal app must display a build-identity/masthead SHA whose full value is
   the immutable measured candidate, or an existing documented production
   identity receipt that maps exactly to it; capture that receipt before any
   interaction. A stale/unknown build is red. The check uses normal founder
   state and existing authentication only. It must not request, enter, reveal,
   copy, inspect, refresh, or alter any credential, token, auth file, or sign-in
   state. Encountering an auth prompt is red and stops the check; existing
   authenticated behavior is not credential handling.
6. `CONSUMER-CHECK.md` records: measured candidate SHA and visible identity;
   normal non-proof launch command/mode; before/after screenshots; ten exact
   research type/id pointer receipts; three exact session-role typing/erase/
   return receipts; visible 13-object/15-cable count observation; no-submit and
   no-credential attestation; and final app/process state. Screenshots may show
   only product UI and the harmless canary—no terminal history, prompt content,
   secret, or unrelated desktop content. A screenshot is evidence of the named
   observation, not a substitute for the exact receipt list.

R16 closes only when the independent machine Verifier PASS and this real-mouse
normal-app consumer PASS both exist. The Router then records the final evidence
HEAD, updates the authority/status surfaces, and stops before R17.

## POINTER REOPEN SCHEDULING - keep four launches inside sixty seconds

Pointer-first WIP `fac9b8d89abbae14d6d883cb1fbad1fdf236d126`
is evidence, not a candidate. Its pre-live checks passed tile-manager 2/0 and
focused R16 13/0. Its only live invocation proved:

- exactly one `pointer_tiles=10 inspect=10 collapse=10`;
- `oracle_tiles=13 oracle_cables=15 dom_tiles=13 dom_cables=15`;
- first-launch, forced-failure, and forced-timeout owned processes all zero;
- `roots_created=3 roots_remaining=0` and `cleanup_failures=[]`.

The first world used 31,931 ms. Only then did the gate start the normal reopen,
forced-failure, and forced-timeout Electron launches together. Both forced cases
became ready and completed, while the production reopen lost the shared
functional deadline with `production Electron readiness timed out`. This is a
gate scheduling defect: three cold launches contend during the only window in
which one must restore and compare the full world.

The repair changes scheduling only. It does not change a timeout, launch count,
product file, fixture, pointer proof, world assertion, or cleanup assertion:

1. Rename the generic `schedulePostFirstCases` helper to
   `scheduleAfterBarrierCases`; its semantics remain: await one supplied barrier,
   invoke every supplied callback before awaiting any result, report each
   post-spawn start, and return results in callback order. Its two existing
   focused tests change only the helper name/wording and still prove concurrent
   start plus zero callback invocation when the barrier rejects.
2. `runFirstWorldStage` receives one `onFirstLaunchReady` callback and invokes
   it exactly once immediately after the first production Electron launch has
   passed readiness, before fixture construction, specialist spawn, or pointer
   proof. If the first stage fails before that callback, its same failure rejects
   the readiness barrier so no early callback waits forever.
3. At that first-launch-ready barrier, start only the forced-failure and
   forced-timeout launches through `scheduleAfterBarrierCases`. Require their
   post-spawn start spread at most 2,000 ms. They may run concurrently with the
   first world's fixture, model-session, projection, and pointer work because
   they use separate registered roots and perform no world mutation.
4. The normal reopen remains forbidden until all three facts are true: the first
   world is fully proved and its first launch is shut down with zero owned
   processes; the forced-failure case is complete and clean; and the
   forced-timeout case is complete and clean. Then start the normal reopen as
   the only live Electron launch, restore the same app root, and run the
   unchanged exact world/reopen/saved-state comparison. Emit exactly
   `forced_cases_clean_before_reopen=true` immediately before its spawn and
   retain `reopen_equal=true pointer=true duplicate_reveal=false` after PASS.
5. All four real launches remain: first world, forced failure, forced timeout,
   normal reopen. `RESEARCH_WORLD_VISIBLE_DEADLINE_MS=60000` and
   `CLEANUP_RESERVE_MS=8000` remain byte-identical. Every case keeps its existing
   functional deadline, hard cleanup deadline, process ownership tracker, root,
   failure vocabulary, and primary/cleanup precedence. No case is skipped,
   syntheticized, merged, or allowed to borrow cleanup reserve.
6. The focused R16 file remains exactly 13 tests. Only imports, the two existing
   scheduling tests, and the pointer-first contract test may differ from WIP
   `fac9b8d8`; all other ten test bodies are byte-identical. The contract test
   requires the two exact scheduling receipts, four launch functions, unchanged
   60,000/8,000 constants, early forced callbacks only, and the normal reopen
   after both early results. In the gate, only the scheduling helper,
   first-world ready seam, and `runResearchWorldVisibleGate` orchestration may
   differ from WIP; all product/pointer/world/reopen/cleanup bodies are
   byte-identical. Builder and Verifier inspect and record
   `git diff fac9b8d8 --`; any broader change is red.

A fresh Reader must return YES/YES before a fresh Builder starts. That Builder
runs Atlas preflight, tile-manager 2/0, focused R16 13/0, and exactly one live
`bun qa/run.ts research-world-visible`. Any red stops with scheduling,
pointer/world, primary, root, and cleanup receipts. Green continues with the
already-authorized short matrix, pointer falsifier, BUILD-REPORT, Atlas refresh,
candidate commit, and push. The fresh different-model Verifier later receives
the same matrix and one-live budget. The post-Verifier normal-app Computer Use
check and stop-before-R17 rule remain unchanged.

Allowed Builder paths are only `qa/gates/research-world-visible.ts`,
`qa/gates/research-world-visible.test.ts`,
`docs/orders/evidence/r16/BUILD-REPORT.md`, and the three generated Atlas
projections. No product change, timeout/reserve change, assertion weakening,
extra launch, second live run, package/installer/release gate, worktree, wrapper,
helper framework, keyboard work, or R17 work is authorized.

## SEQUENTIAL COLD-START CLOSURE - no concurrent dev launches

The preceding early-concurrency repair was implemented only in the working tree
opened at `fd8e2a2f74dfaa67b5a71273fda6eab4bc8bd02c`; it was not committed and
has been removed. Its one live run proved the approach invalid: starting the two
forced Electron dev launches while the first world recruited specialists closed
the normal app's RPC during `qf.dock.spawn`. Cleanup still returned every process
and root to zero. Together with WIP `fac9b8d8`—where three post-first ready
launches contended and only reopen timed out—the measurement is decisive:
concurrent `bun run dev` launches interfere even with isolated product roots.

This final scheduling authority forbids concurrent launches. It retains the
founder pointer-first product bar and proves cleanup cheaply without making a
failure-only case wait for full product readiness:

1. Split the existing launch seam, without changing its environment or process
   ownership logic:
   - `spawnOwnedLaunch` creates the isolated directories/environment, snapshots
     processes, spawns the existing `bun run dev`, creates the same ownership
     tracker, and returns the same `LiveCase` with an empty endpoint immediately
     after a child PID exists.
   - `awaitLaunchReadiness` performs the current socket-path, ping,
     `app.readiness.canvas`, tracker, and owned-PID checks against a supplied
     spawned `LiveCase`, fills its endpoint, and returns it.
   - `launchReady` is only `awaitLaunchReadiness(await spawnOwnedLaunch(...))`.
     The environment variables, spawn command, readiness predicate, functional
     deadline, tracker, and cleanup code remain byte-identical in substance.
2. Replace `schedulePostFirstCases` with a tiny exported
   `runSequentialCases`. It awaits each callback before invoking the next,
   returns results in callback order, and stops without invoking later callbacks
   if one rejects. Its two existing focused tests are replaced in place and
   prove exact order, maximum active callback count one, result order, and stop
   on rejection. No `Promise.all`, `Promise.allSettled`, unawaited callback, or
   background launch promise may appear in the live orchestration.
3. Run four launch attempts in this exact serial order:
   - forced failure: `spawnOwnedLaunch`, require a tracked child PID, emit the
     existing marker plus `forced_failure_phase=spawned_not_ready`, then use the
     unchanged cleanup path; never call readiness or a product RPC;
   - forced timeout: `spawnOwnedLaunch`, require a tracked child PID, run the
     unchanged 500 ms never-settling watchdog, emit the existing marker plus
     `forced_timeout_phase=spawned_not_ready`, then use unchanged cleanup; never
     call readiness or a product RPC;
   - first world: `launchReady`, then the unchanged fixture, specialist,
     independent Oracle, exact 13/15 projection, all-ten pointer proof, saved
     state, and clean first shutdown from WIP `fac9b8d8`;
   - normal reopen: only after the first world is complete and clean,
     `launchReady` on the same normal app root, then the unchanged exact
     world/reopen/saved-state comparison and clean shutdown.
4. Track launch activity at runtime. Increment only after
   `spawnOwnedLaunch` returns a child PID and decrement in the exact cleanup
   `finally` for that launch. A new spawn asserts active count zero first. The
   final receipt is exactly `launch_attempts=4 ready_launches=2
   max_concurrent_launches=1`; any count mismatch, overlap, missing cleanup
   decrement, or launch without owned PIDs is red. The two ready launches are
   the complete product first-world and reopen cases. The two half-born launch
   attempts are deliberately cleanup cases, not product-behavior substitutes.
5. The exact two failure/timeout cases still have separate roots, owned process
   snapshots, markers, 500 ms timeout floor, cleanup errors, and primary/cleanup
   precedence. Testing them before readiness is stronger for half-born cleanup
   and removes no ready-app cleanup proof: both successful ready product launches
   also shut down and require zero owned processes. All three allocated roots
   are still removed and rechecked. No product truth or founder state is used.
6. `RESEARCH_WORLD_VISIBLE_DEADLINE_MS=60000` and
   `CLEANUP_RESERVE_MS=8000` remain exact. Every functional step must finish
   before the existing functional deadline and every cleanup before the hard
   deadline. No launch or case may borrow the cleanup reserve. If the two
   uncontested ready launches cannot complete in that budget, the gate is red
   and R16 stops; no timeout increase is authorized.
7. The focused file remains 13 tests. Only imports, the two scheduling tests,
   and the existing pointer-first contract test may differ from WIP `fac9b8d8`;
   the other ten test bodies remain byte-identical. The pointer contract also
   source-checks: exact serial case order; forced cases call spawn-only and never
   readiness/RPC; product cases call readiness; runtime-derived four/2/1 receipt
   print site exactly once; unchanged 60,000/8,000 constants; no concurrent promise combinator in
   orchestration; and the exact pointer receipt once. In the gate, only the
   launch split, serial helper, forced-case launch calls, activity tracking, and
   top-level orchestration may differ from WIP. All pointer/world/reopen/cleanup
   assertions and all product files are frozen. Builder and Verifier inspect
   and record `git diff fac9b8d8 --`; any broader code/test change is red.

A fresh Reader must return YES/YES before a fresh Builder starts. The Builder
runs Atlas preflight, tile-manager 2/0, focused R16 13/0, and exactly one live
gate. Green requires the exact four/2/1 launch receipt, both forced markers and
phases, pointer receipt once, exact 13/15 world, reopen equality, zero processes,
zero roots, and no cleanup failure. Only then run the existing short matrix,
pointer falsifier, BUILD-REPORT, Atlas refresh, candidate commit, and push. A
fresh different-model Verifier gets the same bounded matrix and one live gate;
then the Router performs the already-specified normal-app Computer Use check and
stops before R17.

Allowed Builder paths remain only the two R16 gate files, BUILD-REPORT, and the
three generated Atlas projections. No product, fixture, pointer, keyboard,
timeout/reserve, package/installer/release, worktree, wrapper, helper framework,
second live run, or R17 change is authorized.

### Sequential Reader-defect closure - derived activity and half-born cleanup

The first Reader correctly found two remaining escape hatches. Close them as
part of the same sequential repair:

1. Add one exported pure `createLaunchActivity` tracker with runtime fields
   `attempts`, `ready`, `active`, and `maxActive`. `begin(live)` is called inside
   `spawnOwnedLaunch` immediately after the child PID, ownership tracker, and
   `LiveCase` exist; it first asserts `active === 0`, then increments attempts
   and active, updates max, and marks that exact `LiveCase.activityOpen=true`.
   `markReady(live)` is called only after socket, ping, canvas readiness, and
   owned-PID checks pass; it asserts the activity is open and not previously
   ready, marks that exact live case ready, and increments `ready`.
   `end(live)` asserts the activity is open, clears the flag, and decrements
   active exactly once. Negative active, duplicate begin/ready/end, or readiness
   on an unknown/closed live case is red.
2. `spawnOwnedLaunch` wraps every step after `spawn` in a catch. Once a child PID
   exists, it constructs and assigns the `LiveCase` before any activity call. If
   anything then rejects before normal return, the thrown `LaunchFailure.live`
   carries that same case with its open activity lease. Every case already
   recovers `attachedLive(error)` and enters cleanup; no child-bearing rejection
   may bypass cleanup or the activity decrement.
3. `cleanupProcessSet` retains the existing exact guard
   `if (live.endpoint && live.child.exitCode === null)` around `app.shutdown`.
   Spawn-only forced cases keep `endpoint === ""`; the focused contract extracts
   this cleanup body and requires the guard, and extracts both forced-case bodies
   to reject `awaitLaunchReadiness`, `launchReady`, `rpcCall`, `app.shutdown`,
   or any endpoint assignment/read. They therefore never attempt a product RPC.
   The unchanged owned-process wait/terminate/poll path still runs. Put
   `activity.end(live)` in the cleanup function's outer `finally`, so it runs
   after success or cleanup rejection; a missing or duplicate decrement is red.
4. The final assertions are runtime-derived:
   `activity.attempts === 4`, `activity.ready === 2`,
   `activity.active === 0`, and `activity.maxActive === 1`. Only after those
   assertions, print using those fields—not a fixed full string:
   ``console.log(`launch_attempts=${activity.attempts} ready_launches=${activity.ready} max_concurrent_launches=${activity.maxActive}`)``.
   The focused contract rejects a literal full `4/2/1` log, requires those three
   interpolations and the four assertions, and requires exactly one print site.
   The live transcript must still equal the exact `4/2/1` line once.
5. Without adding a 14th test, the first sequential focused test also exercises
   the pure activity tracker: four serial begin/end pairs, exactly two
   `markReady` calls, expected 4/2/0/1 result, plus concrete red cases for overlap,
   duplicate ready, and duplicate end. The stop-on-rejection test creates an open
   activity lease, simulates a child-bearing failure, runs the cleanup/finally
   seam, and proves active returns to zero while the later callback remains
   uninvoked. This is the falsifier for a hard-coded receipt or missing failure
   decrement.

The Reader rereads this closure with `SEQUENTIAL COLD-START CLOSURE`. Every
other scope, proof, deadline, one-live budget, Verifier, Computer Use, and
stop-before-R17 requirement remains unchanged.

## VOLATILE SESSION-STATUS CLOSURE - diagnose before changing comparison

Sequential WIP `330fbc8e757b32441f384f1d742a7189952f2c9c` is evidence,
not a candidate. Its focused contract passed 13/0. Its single live run proved
both spawn-only cases and the normal first launch cleaned to zero processes,
all three roots cleaned to zero, all ten research inspectors opened and closed
by pointer, and the full world reached the DOM. The first-world comparison then
reported only `displayed fields differ for agent_session:<id>`. Because the
independent SQLite manifest is sampled before the renderer requests its world,
an `agent_session.status` lifecycle transition can make exact whole-record
equality compare two legitimate observations from different instants.

This authority diagnoses that named red before changing its meaning:

1. In the two existing R16 gate files only, make the displayed-field comparison
   emit one deterministic JSON receipt on mismatch containing the object type,
   object id, expected field map, actual field map, and sorted differing field
   names. Preserve the existing assertion immediately after the receipt. Add a
   focused falsifier that proves a label or id mismatch remains visible and red.
   Run the focused 13-test file and exactly one live diagnostic gate.
2. If any mismatch is outside `agent_session`, changes `id` or `label`, omits a
   displayed field, contains more than the single field `status`, or uses a
   status outside the schema enum `starting|running|blocked|cancelled|failed|closed`,
   stop. Do not repair or rerun. Report the exact receipt for Router decision.
3. Only if the diagnostic proves a status-only temporal delta, correct the gate
   to test the product's actual contract:
   - every agent-session tile still exposes exactly `id`, `status`, and `label`;
   - `id` and `label` remain exact against the independent Oracle;
   - the displayed status and independently sampled status are each members of
     the exact schema enum;
   - first-launch to reopen status movement must be either identical or a valid
     transition from `qf-kernel-schema/src/transitions.ts`; the same object ids,
     labels, remaining object fields, cables, positions, and inspector state
     remain byte-exact across reopen.
   Emit one derived receipt listing the three session ids and their first/reopen
   statuses. No status value may be hard-coded as the expected happy path.
4. The focused file stays exactly 13 tests by extending the existing pointer
   contract test. It must falsify: missing session field, invalid status, id or
   label drift, invalid reopen transition, and a non-session field mismatch.
   All prior scheduling, activity, pointer, 13/15, failure precedence, timeout,
   saved-state, and cleanup assertions remain present and unchanged.
5. After the status-only repair, run focused 13/0 and exactly one live gate. Any
   red stops. Full green continues with the already-authorized short matrix,
   pointer falsifier, Atlas refresh/ratchet, BUILD-REPORT, candidate commit, and
   push. A fresh different-model Verifier then measures the immutable candidate
   once. The Router performs the normal-app real-mouse Computer Use check after
   Verifier PASS and stops before R17.

This is a temporal-consistency correction, not permission to weaken world
inspection. No product, fixture, timeout/reserve, launch scheduling, pointer,
keyboard, package/installer/release, wrapper, helper framework, worktree, or R17
change is authorized. Allowed Builder paths remain the two R16 gate files,
BUILD-REPORT, and the three generated Atlas projections.

### Volatile-status Reader-defect closure - exact runtime receipts and comparisons

The first fresh Reader returned NO/NO because seven clauses above admitted more
than one implementation or an unfalsifiable receipt. These exact replacements
close those defects and supersede only the ambiguous wording above:

1. On a displayed-field mismatch, print exactly one line before rejecting:
   `displayed_fields_mismatch={"type":...,"id":...,"expected":...,"actual":...,"differing_fields":[...]}`.
   Preserve that top-level key order; lexically sort the keys in both field maps
   and sort `differing_fields`. The expected map comes from the frozen
   independent SQLite Oracle and the actual map comes from the live DOM. The
   existing focused test parses and compares the complete runtime-derived
   receipt; a literal receipt is red.
2. Within that same existing focused test, use separate label-only and id-only
   mismatch cases. Each invokes the real comparison, rejects, reports exactly
   `["label"]` or `["id"]`, and then restores the input and proves the same
   comparison green. This does not add a fourteenth test.
3. The diagnostic may enter the repair path only when `differing_fields` is
   exactly `["status"]`; both maps contain exactly the three keys `id`, `label`,
   and `status`; `id` and `label` are byte-equal; and both status values belong
   to the exact six-value schema enum. Any missing key, extra key, other delta,
   or invalid value stops without repair or rerun.
4. For each session on reopen, `first` and `reopen` mean the two displayed DOM
   status strings. Accept only `first === reopen` or a direct edge where
   `reopen` is a member of `transitions.agent_session[first]` in
   `qf-kernel-schema/src/transitions.ts`. Reverse, transitive-only, unknown, and
   merely enum-valid movements are red.
5. Across reopen, compare every field of every non-session object byte-exactly.
   For agent-session objects, compare `id` and `label` byte-exactly; only
   `status` uses the direct-transition rule in item 4. Object ids, accessible
   names, cables, positions, and inspector state remain byte-exact. No other
   value is exempt.
6. After every status and reopen assertion passes, print exactly once:
   `agent_session_statuses=[{"id":"...","first":"...","reopen":"..."},...]`.
   Entries are sorted by session id and all three values come from the two live
   DOM observations. The focused test rejects a literal/hard-coded receipt and
   a direct-transition violation.
7. Against WIP `330fbc8e757b32441f384f1d742a7189952f2c9c`, only the
   diagnostic receipt, status comparison, derived status receipt, and their
   assertions inside the existing focused test may differ in the two R16 gate
   files. All other lines remain byte-identical. Builder and Verifier record and
   inspect `git diff 330fbc8e757b32441f384f1d742a7189952f2c9c --
   qa/gates/research-world-visible.ts
   qa/gates/research-world-visible.test.ts`; any broader change is red.

The Reader rereads this closure together with `VOLATILE SESSION-STATUS CLOSURE`
and answers the same two questions again. Only final YES/YES opens the Builder.

## SESSION RECEIPT COMPOSITION REPAIR - task refresh must not erase ontology

Diagnostic WIP `521a83b1b8db19a7aa23a65f9cd2ad6b80964396` is
evidence, not a candidate. Its focused contract passed 13/0. Its one live run
printed the exact runtime-derived receipt:

`displayed_fields_mismatch={"type":"agent_session","id":"762afa79-bcf0-44d5-9e92-1266a097ffa5","expected":{"id":"762afa79-bcf0-44d5-9e92-1266a097ffa5","label":"hermes-research-director","status":"running"},"actual":{},"differing_fields":["id","label","status"]}`

The source seam names the defect. `research-world.js` appends one
`.qf-world-session-receipt` to a live session tile's `taskFoot`.
`task-composition.js::renderTaskFoot` later calls `foot.replaceChildren()` on
that same projection surface during normal task refresh, erasing the ontology
receipt. The tile identity remains, so the DOM reports the agent session while
all three inspectable fields are gone. This is a product composition defect;
the gate stays strict.

The repair is finite:

1. In `task-composition.js::renderTaskFoot`, before its existing
   `replaceChildren`, inspect only the current direct children and retain the
   first child whose class list contains exactly
   `qf-world-session-receipt`. Pass that same node object into
   `replaceChildren`; discard any duplicate receipt children. Then render the
   existing task facts, history, controls, preserved form, and error behavior
   unchanged. When no receipt exists, output is byte-equivalent to the current
   behavior. Never create, clone, rewrite, or source receipt fields here;
   `research-world.js` remains their sole renderer.
2. Extend `task-composition.test.ts` with one focused test. Seed one direct
   receipt node containing distinct id/status/label child facts plus one
   duplicate receipt, call the real `renderTaskFoot` twice with two different
   task projections, and require: the original receipt object survives exactly
   once; the duplicate is gone; its three child object identities and text are
   unchanged; and the task fact changes on the second refresh. Run this test
   red against `521a83b` before product repair and green afterward.
3. Preserve the exact diagnostic receipt and its 13/0 falsifiers from
   `521a83b`. Run `task-composition.test.ts`, `research-world.test.ts`, and
   `research-world-visible.test.ts` before live proof. Then run exactly one live
   `bun qa/run.ts research-world-visible`.
4. A green live run must include one pointer 10/10 receipt, exact 13/15 Oracle
   and DOM counts, four launch attempts/two ready/maximum one, reopen equality,
   zero owned processes, zero roots, and no cleanup failure. If the only red is
   the previously Reader-approved exact `["status"]` temporal delta, the same
   Builder may implement the bounded volatile-status comparison and run one
   final live gate. Any missing/extra field, id/label delta, invalid status, or
   other red stops without another repair or run.
5. Full green continues with the existing short matrix, pointer falsifier,
   Atlas generate/check/ratchet, BUILD-REPORT, candidate commit, and push. A
   fresh different-model Verifier measures the immutable candidate once; then
   the Router performs the normal-app Computer Use consumer check and stops
   before R17.

Allowed product paths are only
`collab-electron/src/windows/shell/src/task-composition.js` and
`collab-electron/src/windows/shell/src/task-composition.test.ts`. Existing gate
paths, BUILD-REPORT, and three Atlas projections remain allowed evidence paths.
No change to `research-world.js`, the Kernel/projection, fixture, ontology,
timeout/reserve, launch scheduling, pointer behavior, keyboard behavior,
package/installer/release, wrapper/helper, worktree, or R17 is authorized.

A fresh Reader answers the same two questions over this section before a fresh
Builder opens. This section supersedes only the status-only assumption; all
strict field, world, reopen, cleanup, and mouse-first assertions remain active.

### Session-composition Reader-defect closure - exact two-path product proof

The first fresh Reader returned NO/NO with eight finite defects. These clauses
replace the ambiguous phrases in `SESSION RECEIPT COMPOSITION REPAIR`:

1. A qualifying receipt is a direct `taskFoot` child whose
   `classList.length === 1` and whose sole class is exactly
   `qf-world-session-receipt`. Retain the first qualifying child, remove later
   qualifying direct children, and do not qualify a nested node or a child with
   any additional class. After the existing task projection finishes rendering,
   append the retained original node object exactly once as the final direct
   child, after task facts, history, controls, restored form, and restored error.
2. The one new third test in `task-composition.test.ts` contains two independent
   subcases without mutating either DOM between a real `renderTaskFoot` call and
   its assertions:
   - Receipt subcase: seed one qualifying direct receipt with exactly three row
     objects keyed `id`, `status`, and `label`; each contains one
     `.qf-world-field-value` with distinct text. Also seed one later qualifying
     direct duplicate, one nested receipt, and one direct node with the receipt
     class plus an extra class. Reuse the same `foot` and session tile for two
     renders whose assigned task titles are exactly `task-a` and `task-b`.
     Require the first receipt node and its exact three row/value node identities
     and texts to survive; exactly one qualifying direct receipt remains as the
     final direct child; the later qualifying duplicate is gone; neither
     distractor is treated as the retained receipt; and the visible task title
     changes from `task-a` to `task-b`.
   - No-receipt subcase: use a fresh foot with no qualifying receipt and the
     same real renderer. Require no `.qf-world-session-receipt`,
     `[data-qf-world-field]`, or `.qf-world-field-value` node to be created.
     For identical inputs, assert the WIP `521a83b` output exactly: direct-child
     order, element names, classes, text, attributes, dataset values, control
     state, form values, history, and error text. The test also source-checks
     that `task-composition.js` contains no receipt-field construction or
     rendering path; it may only retain/reappend an opaque existing node.
3. Pre-live proof is exactly these native commands and counts, with full output
   and exit recorded; any nonzero exit or other count stops:
   - `bun test collab-electron/src/windows/shell/src/task-composition.test.ts`
     => 3 pass, 0 fail;
   - `bun test collab-electron/src/windows/shell/src/research-world.test.ts`
     => 6 pass, 0 fail;
   - `bun test qa/gates/research-world-visible.test.ts`
     => 13 pass, 0 fail.
4. If and only if the sole live primary failure is the exact status-only delta
   authorized above, apply that bounded status repair, rerun the focused R16
   test and require 13/0, then run exactly one final live gate. Any other delta
   stops without repair or rerun.
5. Reopen comparison is exact: every non-session field and every session
   `id`/`label`, accessible name, cable, position, and inspector state are
   byte-equal. A session status is equal or follows one direct edge in
   `transitions.agent_session[first]`; enum validity alone, a reverse edge, or a
   transitive-only path is red.

No-receipt behavior is therefore measured, opaque-node preservation is the
only new product behavior, the receipt remains solely owned by
`research-world.js`, and the existing task projection remains measurable rather
than covered by the live gate alone. The same Reader rereads this closure with
the parent section; only final YES/YES opens the Builder.

## BUILD-ONCE PREVIEW CLOSURE - stop recompiling on every launch

Product WIP `6e3e502c7eecd5411a6a2927fab56918568ed2e3` is evidence,
not a candidate. Its exact pre-live gates passed 3/0, 6/0, and 13/0. Its one
live run proved the product repair: all ten pointer inspectors opened/closed and
the DOM matched the independent 13-object/15-cable Oracle. Both forced cases and
the first ready app cleaned to zero, and all roots cleaned to zero. The first
world consumed 43,858 ms; the second `bun run dev` invocation then had too
little of the unchanged functional window to rebuild Electron and reach reopen
readiness. The red was `production Electron readiness timed out`, with no
product, field, pointer, root, or cleanup mismatch.

The gate is paying build cost four times. Compile the candidate once and launch
that same compiled output for every isolated case:

1. Add one small `prepareCandidateBuild` seam in
   `qa/gates/research-world-visible.ts`. Before starting the existing 60,000 ms
   product/cleanup clock or allocating any roots, run exactly one
   `bun run build` with cwd `collab-electron`, inherited non-proof build
   environment, hidden window, and captured native exit. Nonzero exit, signal,
   spawn error, or missing `collab-electron/out/main/index.js` is red and creates
   no root or launch. Print once from runtime values:
   `build_once_ms=<integer> build_exit=0`.
2. In `spawnOwnedLaunch`, change only the child command from
   `bun run dev` to `bun run preview`. Preserve cwd, isolated runtime
   environment, QF proof variables, stdio handling, PID ownership snapshot and
   tracker, activity lease, readiness RPC, and cleanup byte-exact in substance.
   `preview` must consume the output made by item 1; it may not compile, watch,
   package, install, or use a stale/alternate tree.
3. Keep all four serial launch attempts and their exact semantics: forced
   failure spawn-only, forced timeout spawn-only with 500 ms watchdog, first
   world ready with pointer 10/10 and exact 13/15, then same-root normal reopen
   ready with exact saved-world comparison. Keep the 60,000/8,000 product and
   cleanup clock unchanged; build time is reported separately because it is the
   one candidate compilation, not a product launch. No case may start before a
   successful build or run concurrently.
4. Without adding a fourteenth focused R16 test, extend its existing launch
   contract to require: exactly one build invocation; build appears before the
   product clock and root allocation in source order; exactly one runtime-derived
   build receipt; every launch uses preview and no launch uses dev; the preview
   package script still resolves to `electron-vite preview`; and the existing
   four/2/1, pointer, 13/15, reopen, root, cleanup, timeout, and failure
   assertions remain present. It rejects a hard-coded build receipt, a second
   build call, `dev`, `package`, or a watcher.
5. Builder pre-live is exactly task-composition 3/0, research-world 6/0, and
   R16 focused 13/0, plus Atlas preflight. Then exactly one live gate. Green
   requires build exit 0, four/2/1, both forced phases/markers, pointer 10/10,
   exact 13/15, `reopen_equal=true`, zero processes, zero roots, and empty
   cleanup failures. Any red stops; no timeout increase or second live run.
   Full green continues with the existing short matrix, pointer falsifier,
   Atlas refresh/ratchet, BUILD-REPORT, candidate commit, and push.

Allowed implementation paths are only the two R16 gate files. The two preserved
task-composition product files, BUILD-REPORT, and three Atlas projections remain
allowed candidate/evidence paths. No change to product behavior, fixture,
Kernel/projection, research-world.js, package scripts, timeout/reserve, launch
count/order, pointer, keyboard, installer/release, wrapper/helper framework,
worktree, Computer Use, or R17 is authorized. A fresh Reader answers the two
questions before a fresh Builder. After independent Verifier PASS, the Router
uses the normal app through Computer Use and closes R16 only on that consumer
PASS.

### Build-once Reader-defect closure - preview must skip its implicit build

WIP `88cdaaf3d6f5bba04f060fa941e1ca253e1e2eaf` is evidence,
not a candidate. The one candidate build passed in 72,720 ms. Both forced
spawn-only cases then cleaned to zero, but the first normal launch timed out
before readiness. Source inspection names the defect: electron-vite 5's
`preview()` calls `build()` unless its CLI receives `--skipBuild`. The ordered
`bun run preview` command therefore rebuilt on every launch, exactly the work
this closure intended to remove.

Replace only the launch arguments with exact
`bun run preview -- --skipBuild`. Do not change the package script. The focused
13th test requires all of the following:

1. `prepareCandidateBuild` remains the sole `bun run build` call and still runs
   once before the product clock and roots.
2. Every launch uses the exact argument vector
   `["run", "preview", "--", "--skipBuild"]`; the test rejects a missing or
   duplicated `--skipBuild`, plain preview, dev, build, package, or watch in the
   launch seam.
3. The committed electron-vite preview implementation still contains the
   conditional `if (!options.skipBuild) await build(...)`, so this flag is the
   measured no-rebuild boundary rather than a name-based assumption.
4. Build freshness/output checks, the runtime-derived build receipt, existing
   60,000/8,000 clock, four serial attempts, four/2/1 receipt, pointer 10/10,
   exact 13/15, reopen, failure/timeout, roots, and cleanup remain unchanged.

Run exact pre-live 3/0, 6/0, and 13/0 plus Atlas, then exactly one live gate.
Any red stops with no second run or timeout change. Full green follows the same
short matrix, evidence, candidate, independent Verifier, Computer Use consumer
check, and stop-before-R17 path. Allowed files and every prohibition in the
parent closure remain unchanged. The same fresh Reader rereads this exact
defect closure; final YES/YES reopens the Builder.

## CLEANUP PREFLIGHT CLOCK - reserve product window for product work

Skip-build WIP `b4cd054a7900b5525955b3ae606d9dcfaceefdc8` is
evidence, not a candidate. Its build passed once in 79,517 ms. Both forced
spawn-only cases cleaned to zero. The compiled first world then passed pointer
10/10, exact independent 13/15, and clean shutdown. Its
`first_world_stage_ms=50717` still included the two already-completed forced
cleanup cases, leaving roughly one second of the 52-second functional window
for compiled reopen readiness. Reopen timed out; all roots/processes remained
clean. The product clock currently begins before failure-only preflight work.

Keep all proof and make the clocks describe what they measure:

1. Keep `prepareCandidateBuild` and exact preview `-- --skipBuild` unchanged.
   After build, create the activity tracker and the two forced roots. Run forced
   failure and forced timeout serially under a new exact named
   `CLEANUP_PREFLIGHT_DEADLINE_MS=15000`, measured from immediately before their
   first spawn. They retain their markers, spawn-only behavior, 500 ms watchdog,
   ownership tracker, primary/cleanup precedence, and zero-process assertions.
2. Remove and recheck both forced roots inside that same preflight deadline.
   Any functional error, cleanup error, remaining process, remaining root, or
   elapsed preflight at/over 15,000 ms is red and no product root/clock/launch is
   created. Print once from runtime values after every preflight assertion:
   `cleanup_preflight_ms=<integer> forced_roots_remaining=0`.
3. Only after the forced preflight is fully green, set `startedAt`,
   `hardDeadlineAt=startedAt+60000`, and
   `functionalDeadlineAt=hardDeadlineAt-8000`, then allocate the one normal root.
   Run first world and same-root reopen serially and unchanged. Their product
   timing, pointer 10/10, exact 13/15, saved state, reopen equality, and two
   ready-launch cleanup assertions remain inside the existing 60,000/8,000
   clock. This is not a timeout increase: failure-only cleanup has its own
   smaller preflight deadline and product behavior keeps its exact clock.
4. Final accounting still derives exactly four launch attempts, two ready
   launches, zero active, and maximum one. It still reports three roots created,
   zero remaining, and no cleanup failure. Forced roots removed during preflight
   remain registered in the final leak set and removal receipts; final cleanup
   must recheck them without recreating them.
5. Without a fourteenth R16 test, extend the existing launch contract to require
   the exact 15,000 constant, build -> forced preflight -> product-clock -> normal
   root -> first world -> reopen source order, the runtime-derived preflight
   receipt exactly once, and stop-before-product behavior on every preflight red.
   Reject any relocation of first-world/reopen outside the 60,000/8,000 clock,
   any concurrency, timeout increase, hard-coded receipt, skipped case, or root
   removed from final leak accounting.

Run exact pre-live task-composition 3/0, research-world 6/0, R16 focused 13/0,
and Atlas, then exactly one live gate. Green requires build exit 0, preflight
under 15 seconds and clean, four/2/1, pointer 10/10, exact 13/15, reopen equal,
all processes/roots zero, and empty cleanup failures. Any red stops; full green
continues to the existing short matrix, falsifier, Atlas/report, candidate,
independent Verifier, Computer Use consumer check, and stop-before-R17.

Allowed implementation paths remain the two R16 gate files; preserved product,
report, and Atlas paths remain candidate/evidence paths. No product, fixture,
Kernel/projection, package script, build/preview command, 60,000/8,000 clock,
pointer, keyboard, installer/release, wrapper/helper, worktree, Computer Use, or
R17 change is authorized. A fresh Reader answers the two questions before the
Builder resumes.

## CONSUMER-OWNED REOPEN - prove restart in the normal product

The cleanup-preflight WIP at base `63ffb8049535eca7deb6e1d8cc704d5a44dcd1a5`
is evidence, not a candidate. Its one live run built once in 61,085 ms, passed
both forced cleanup cases in 12,179 ms with zero forced roots, opened the first
compiled research world, passed pointer 10/10 and exact independent 13/15, and
shut down cleanly. The second proof-only preview did not become ready inside the
unchanged product clock. Final cleanup again left zero processes and zero roots.

The founder's mouse-first ruling already makes the normal application consumer
check the authority for close/reopen. Stop asking a second proof-mode preview to
stand in for that consumer behavior. Keep the restart requirement; move its one
and only proof to Computer Use against the immutable normal application:

This section supersedes every earlier R16 requirement for
`runNormalReopenCase`, `reopen_equal`, `forced_cases_clean_before_reopen`, a
fourth launch, two ready launches, or the four/2/1 activity receipt. Those are
history and authorize nothing. It does not supersede any first-world, ontology,
pointer, displayed-field, forced-case, deadline, root, process, or cleanup
assertion.

1. Preserve build-once, exact preview `-- --skipBuild`, the 15,000 ms forced
   cleanup preflight, both forced markers, the unchanged 60,000/8,000 product
   clock, first-world pointer 10/10, exact 13 objects/15 cables including every
   displayed field, and all process/root/cleanup assertions.
2. The live machine gate performs exactly three serial launch attempts: forced
   failure, forced timeout, then one ready first-world launch. It requires
   `launch_attempts=3 ready_launches=1 active_launches=0 max_concurrent_launches=1`.
   It allocates and accounts for exactly three roots and leaves zero. Remove the
   proof-mode normal-reopen launch, its helper if now unused, and only the
   assertions/receipts that claimed that second preview was the restart proof.
3. Extend the existing 13th contract test; do not add a fourteenth. It must fail
   if a second normal preview returns, if first-world pointer/world/field checks
   move outside the unchanged product clock, if any forced case or cleanup check
   disappears, or if the three/1/1 activity receipt is hard-coded.
4. Pre-live remains exact task-composition 3/0, research-world 6/0, R16 focused
   13/0, and Atlas green. Run exactly one live gate. Any red stops. Full green
   continues through the existing short matrix, pointer falsifier, Atlas,
   BUILD-REPORT, immutable candidate commit, and push.
5. A fresh different-model Verifier independently repeats the same bounded
   matrix at the immutable candidate SHA. It does not use Computer Use and does
   not write product code. Any red stops R16.
6. Only after independent PASS, the router launches the normal non-proof
   QuantFlow application at that exact candidate and uses Computer Use as a
   consumer. Real pointer interaction must expose the full 13-object/15-cable
   world and open/close all ten research-object inspectors. Each of the three
   Hermes terminals receives only a bounded smoke check: after mouse focus it
   must accept and erase a harmless candidate-bound typing canary without
   submission, and mouse interaction must return focus to the canvas. This is
   not global keyboard or accessibility proof; full parity remains Debt #38.
   Before closing, record a canonical visible inventory containing all 13 exact
   object identities, types, labels, displayed fields, and positions plus all 15
   exact cable identities/endpoints. Inspector expanded/collapsed state is a
   transient UI choice and is not part of persisted-world equality. Close the
   normal app through its ordinary window control, reopen it with the same exact
   normal launch command and candidate identity, record the same canonical
   inventory again, and require exact equality with
   `consumer_reopen_equal=true`. A missing, additional, or changed item is red.
   Track the launched normal app and descendants by Windows PID ancestry before
   interaction; after final ordinary shutdown require and record
   `consumer_processes_remaining=0`. These receipts land in
   `docs/orders/evidence/r16/CONSUMER-CHECK.md`; safe screenshots may accompany
   them. Any mismatch is red and R16 remains open.

The user's explicit 2026-08-21 Computer Use instruction makes a complete green
consumer check the founder-visible R16 acceptance act. After its PASS and the
evidence/status commit, the Router may close R16 without another human prompt
and must stop before R17. Any Computer red or inability to make the finite
comparison stops for the founder instead.

Allowed Builder implementation remains only the two R16 gate files plus the
preserved product/report/Atlas candidate paths. This correction changes neither
product semantics nor the restart requirement; it assigns restart to the
founder-authorized real consumer surface. No timeout increase, assertion
weakening outside the removed proof-mode duplicate, fixture/Kernel/package
change, helper framework, worktree, installer/release work, or R17 work is
authorized. A fresh Reader answers the two protocol questions before the
Builder resumes from the preserved clean-base WIP.

## FOUNDER KERNEL UPGRADE COMPATIBILITY - open the real normal app

The independent Verifier proved every focused/static/Atlas check and the exact
pointer falsifier at product candidate
`7f03d8e586e504fbe947614f56b60b9a91c0b60d`. Its one live process ran and
cleaned up, but the execution channel returned neither exit code nor stdout, so
that run is unreceipted and is not called PASS. Do not repeat it.

The subsequent founder-authorized Computer consumer launch of the normal built
app never produced a window. Its main process failed before IPC registration:

`KernelUpgradeShapeError (agent-profile-identity): database shape is not an
exact supported predecessor or current authority`.

Read-only measurement of `C:\Users\rybow\.quantflow\kernel.db` names one exact
classifier defect. The live database has the complete post-task-composition,
pre-task-steering/pre-governed-review shape. Against current authority its only
governed differences are:

- `artifact` lacks later `evaluation_findings`;
- `evaluation` lacks the later governed-review columns;
- `links` lacks later `belongs_to`;
- `schema_meta` lacks `belongs_to`, the six task-steering actions, and
  `governed_review_task`.

The current `expectedTaskSteering()` predecessor already strips the governed-
review table columns and six steering actions, but incorrectly retains the
later `belongs_to` link/meta entry and `governed_review_task` meta entry. A real
database created before those two upgrades therefore classifies `partial` and
cannot reach the generated upgrade chain.

Repair only that exact compatibility boundary:

1. In `packages/qf-kernel/src/upgrade.ts`, make the exact post-composition
   predecessor remove `belongs_to` from link kinds and schema meta and remove
   `governed_review_task` from schema meta, in addition to its existing removals.
   Do not broaden partial-shape acceptance, weaken exact snapshot equality, or
   add a best-effort/warn/write path.
2. Add a regression test built from pinned schema/upgrade SQL—not from the
   classifier's own expected snapshot—that constructs the legitimate
   post-composition predecessor, requires classification as `task_steering`,
   upgrades through writable `attachKernel()` to exact `current`, and proves
   representative ontology rows, links, events, and hashes survive. A fixture
   missing or adding any other governed shape remains `partial` and throws
   before mutation.
3. Builder diagnostic may copy the founder Kernel to a temporary isolated path,
   hash both files before, run the candidate upgrade only on the copy, and prove
   the source hash is unchanged, the copy reaches `current`, row/link/event
   counts do not decrease, and representative IDs/content hashes survive. It
   must never open the real founder Kernel writable or launch the normal app.
4. Run the focused upgrade tests, `dock-profile-identity`, `kernel-drift`,
   `kernel-sole-writer`, the R16 focused 13/0 contract, Atlas check/ratchet, and
   `git diff --check`. No R16 live proof-mode gate is repeated. Full green writes
   an appended BUILD-REPORT receipt, commits, and pushes one immutable repair
   candidate.
5. A fresh different-model Verifier repeats the focused/static matrix and the
   upgrade-on-copy proof. It verifies source founder DB hash unchanged and does
   not run the R16 live proof gate. Any red stops; full green writes and pushes
   verification evidence.
6. Only after independent PASS, the Router creates one byte-for-byte backup of
   the real founder Kernel beside it, recording path, size, and SHA-256. It then
   launches the exact normal candidate and resumes the unchanged Computer
   consumer contract above. The product's existing transactional upgrade may
   mutate the real Kernel; no wipe, replacement, reseed, or manual SQL is
   allowed. A crash, lost row, changed durable identity, missing 13/15 world, or
   missing backup is red. Final PASS records the post-upgrade hash and retains
   the backup for recovery.

Allowed Builder product paths are only `packages/qf-kernel/src/upgrade.ts` and
the nearest existing upgrade-chain test file, plus R16 report/generated Atlas
evidence. No schema/golden SQL, command/action behavior, Electron renderer/main,
gate assertion, timeout, helper framework, release/installer, worktree, real
founder database write, or R17 change is authorized. A fresh Reader answers the
two protocol questions before construction.

Builder observation: the focused compatibility implementation and regression
are green, but the required matrix exposed two delivery-instrument defects.
`qa/gates/dock-profile-identity/run.ts` still enumerates only upgrades 0001-0009
while production `db.ts` has loaded 0001-0012 since the completed R14/R15 work;
its static comparison is therefore stale. Synchronize only that gate's
`PRODUCTION_UPGRADE_FILES` and ordered `PRE_D1_REQUIRED_UPGRADES` to add exact
0010 task-composition, 0011 task-steering, and 0012 governed-review. This is a
tightening to the existing production authority, not an assertion relaxation.
No other gate edit is authorized.

The subsequent `kernel-drift` invocation hit Windows `EPERM` while copying the
local file dependency after the prior gate rebuilt it. With no matching process
remaining, rerun that unchanged gate once after the exact dock gate repair. An
assertion red stops; a repeated `EPERM` stops as an environment defect. The
Builder may then complete the original matrix, upgrade-on-copy proof, report,
candidate commit, and push. No live app/gate or founder database write occurs.

The unchanged kernel-drift retry repeated EPERM even after its exact generated
dependency destination was recoverably moved aside. Diagnosis: its cold
launcher calls raw `bun install --frozen-lockfile`, while the already-green dock
launcher uses the repository's existing `runFrozenPackageInstall()` Windows
seam in `qa/package-install.ts` (stale direct-file destination cleanup plus
copyfile/isolated backend, no retry). In `qa/gates/kernel-drift.ts`, replace only
the raw install spawn in `executeInstallPlan()` with that existing helper for
each unchanged plan entry. Preserve plan order/validation, falsifiers, one
install attempt per entry, failure propagation, and every gate assertion. No
new helper or retry is authorized. Run kernel-drift once; red stops, green
resumes the matrix.

The synchronized dock gate then advanced past its stale file list and failed its
real pre-D1 upgrade control: 0001 did not classify as exact D1. This is the same
bounded derivation defect at earlier rungs. Every historical snapshot derived
from current authority must omit later `belongs_to`, six task-steering actions,
and `governed_review_task` until their owning upgrade boundary; current code
omits them only from the post-composition predecessor. Repair the shared
subtractive helpers in `upgrade.ts` so every exact pre-current state removes
those later table/link/meta additions in addition to its existing state-specific
removals. Keep `current` unchanged. Do not add aliases, tolerances, partial-shape
fallbacks, or name-only acceptance.

The generated 0011/0012 SQL predates the R16-only `belongs_to` and
`governed_review_task` additions. The runtime chain may materialize those two
missing additions only from the generated current migration snapshot already
used as authority in `upgrade.ts`, inside the existing transaction, after
0011/0012 and before exact-current classification. It must preserve every link
row and use the authoritative current schema/meta values; no duplicated schema
literal, backfill, or golden/schema edit is allowed.

Rerun the synchronized dock gate once after this exact repair. It must exercise
the real pre-D1 chain through all twelve upgrades. Red stops. Green continues to
the previously authorized unchanged kernel-drift retry and remaining matrix.

That rerun advanced cleanly through 0001-0003 and stopped at 0004 because
`expectedCapabilityGrants()` alone still retained the later governed-review
artifact/evaluation columns. Compose the existing `tablesWithoutGovernedReview`
into that one snapshot alongside the already-authorized late-addition removal.
No new helper, state, tolerance, or other file change is authorized. Rerun the
synchronized dock gate once; red stops, green resumes the matrix.

The chain then reached exact current and the dock gate stopped on its legacy-row
oracle. `snapshotLegacyData()` discovers table names independently before and
after upgrade, so legitimately created `qf_review_*` tables make the two JSON
snapshots differ even when every pre-existing row is byte-identical. Correct
only this oracle: capture the ordered pre-upgrade table-name set once, snapshot
those tables before, and snapshot that same set after. Current-shape proof owns
new-table creation; the legacy oracle continues to compare every column that
existed before upgrade, excluding only its already-named later columns. No table
name exclusion, row relaxation, or production change is authorized. Rerun the
dock gate once; red stops, green resumes the matrix.

The reused table set still failed because the oracle recomputes each table's
column list after upgrade, thereby adding legitimate later columns such as
`display_name` and governed-review fields only to the after snapshot. Capture
the ordered pre-upgrade column names for every captured table together with the
table set, and query those exact table/column projections both before and after.
This replaces the incomplete hard-coded later-column exclusions; it does not
exclude any predecessor column or relax any value comparison. Rerun dock once;
red stops, green resumes the matrix.

The dock chain and legacy projection then passed. Its readonly drift control
named the final exact defect: `db.ts`'s ordered `upgradeOrder` ends at
`TASK_STEERING_UPGRADE` although the writable chain already loads and applies
`GOVERNED_REVIEW_UPGRADE` as 0012. Add that existing constant as the final
readonly diagnostic entry; keep every completed-by-shape index unchanged. This
changes no writable behavior and authorizes only `packages/qf-kernel/src/db.ts`
for that one list entry. Rerun dock once; red stops, green resumes the matrix.

Exact named defect/authority receipt: `qa/gates/kernel-drift/run.ts` `gateG1`
creates the canary read-only handle inline at
`readRegistrySets(new Database(canaryPath, { readonly: true }))` and never
closes it. On Windows this leaves the temp DB busy and the finally `rmSync`
throws `EBUSY` after G1/G6. Repair only this handle lifecycle: assign the
read-only canary DB, read its sets, close it before proceeding. Do not add
retry/scaffolding or weaken the gate.

Exact named stale-G2-control defect/authority receipt: `qa/gates/kernel-drift/run.ts`
uses `publish_artifact` kind `report` without `evaluation_id`, invalid since
governed review. Change only that healthy control artifact kind to the valid
non-governed `result_set` (the existing published bytes/storage_ref remain;
no semantic/gate weakening). Ensure `FIXTURE_ENV` and the mem DB are cleaned
in a `finally` so any future assertion cannot leak state, but do not add
retry/scaffolding.

## NORMAL CONSUMER ACTION-SCHEMA REPAIR - exact R16 founder red

Independent founder-Kernel compatibility verification passed at product
candidate `b8e7d57c04288e1315bbe658a4665a57b4d5f3e7`; verification evidence is
`21b8c0b7f1803bb5401a04b86b80a615e9ef3d4d`. Before the first normal launch,
the Router retained the byte-identical backup
`C:\Users\rybow\.quantflow\kernel.db.pre-r16-20260822-005409.bak` (299008
bytes; SHA-256
`c29fd79a328d1006eedfc425a5f55ca5a60fdc5a07b89db861a7cad128369bdf`).
The freshly built normal app then opened successfully at the exact candidate,
reported `schema_meta=84`, and displayed the candidate identity. This closes
the earlier `KernelUpgradeShapeError` red.

The founder-authorized Computer consumer check then exposed one later, exact
product red. `TRY GUIDED RESEARCH` created a durable Mission and launched the
real Hermes Research Director, but the Director's calls to
`qf_create_agent_session` arrived with an empty arguments object. It retried,
named the missing required fields, created no specialist session or assigned
Task, and therefore could not produce the normal 13-object/15-cable world.
Ordinary window close left `consumer_processes_remaining=0`.

The defect is finite: `kernelListOntologyReadTools()` in
`collab-electron/src/main/kernel.ts` publishes every capability-group action
with `inputSchema: { type: "object", properties: {}, additionalProperties:
true }`, even though the existing schema authority already exports
`actionToolForAction()` from `qf-kernel-schema/mcp` and that helper derives the
named required/optional fields and descriptions from each action's Zod input.
The model is being asked to populate fields that its MCP discovery surface does
not name.

Repair only this exact normal-consumer boundary:

1. In `collab-electron/src/main/kernel.ts`, reuse the existing
   `actionToolForAction()` authority for every `schema.actions` entry with a
   `capabilityGroup`, instead of constructing an empty open-properties schema.
   Preserve the existing capability-group filter, role grants, `EXPOSED_ACTIONS`,
   gateway validation, Kernel actions, and action semantics. Do not add an
   adapter, fallback arguments, prompt-specific special case, or duplicated
   schema.
2. Extend exactly `collab-electron/src/main/ontology-gateway.test.ts` with one
   runtime test of the production `qf.ontology.list_tools` handler. Invoke it
   with an admitted `desk.orchestrate` seat and inspect the returned `tools`
   array; the stdio MCP `tools/list` bridge forwards this array unchanged. The
   test must fail if `qf_create_agent_session` is absent, and must compare its
   complete `inputSchema` to the schema-authority definition for the declared
   action. Its property keys are exactly
   `session_id`, `agent_definition_id`, and `label`, and its required array is
   exactly `session_id`, `agent_definition_id` in that order. The test must
   also obtain the served list for a `market.read` seat and compare the complete
   `qf_venue_get` definition to the existing generated read definition. These
   are runtime comparisons, not source-text or hard-coded-schema assertions.
3. The exact Builder matrix is:

   ```text
   bun test collab-electron/src/main/ontology-gateway.test.ts
   bun test collab-electron/src/main/mission-activation.test.ts
   bun test collab-electron/src/main/native-tui-orchestration.test.ts
   bun qa/run.ts dock-profile-identity
   bun qa/run.ts kernel-sole-writer
   bun test qa/gates/research-world-visible.test.ts
   bun qa/run.ts typecheck
   bun qf-atlas/generate.mjs --check
   bun qf-atlas/ratchet.mjs
   git diff --check
   ```

   Expected results are, respectively, `5 pass / 0 fail`, `2 pass / 0 fail`,
   `8 pass / 0 fail`, native exit 0 with `PASS dock-profile-identity`, native
   exit 0 with `PASS kernel-sole-writer`, `13 pass / 0 fail`, native exit 0 with
   `PASS  typecheck`, and native exit 0 for each remaining command. Any other
   count or nonzero exit is red. Before the candidate report, temporarily
   restore the old empty action schema in `kernel.ts` without changing the test
   or schema authority; the ontology-gateway test must exit nonzero naming the
   missing action fields. Restore the exact candidate bytes and rerun it to
   `5 pass / 0 fail`. Record both native exits and the restoration-zero-diff in
   `docs/orders/evidence/r16/BUILD-REPORT.md`. No proof-mode live R16 gate,
   installer, release suite, schema/golden edit, timeout change, helper
   framework, or R17 work is authorized.
4. Full green means the exact matrix and the restored-green falsifier above.
   The Builder records one immutable product candidate SHA, clean status,
   changed paths, unedited command output, and the red/restored-green receipt
   in `docs/orders/evidence/r16/BUILD-REPORT.md`. A fresh different-model
   Verifier reruns that same non-live matrix against that candidate SHA and
   invokes the served `qf.ontology.list_tools` path to prove the action schema;
   a generator-only or source-only check is insufficient. Any red stops with
   the exact command and native receipt; no repair occurs in the Verifier.
5. Only after independent PASS, rebuild and launch the normal candidate. The
   Router uses Computer Use to run `TRY GUIDED RESEARCH` once. Before calling
   the action, the Router records the actual served discovery receipt showing
   `qf_create_agent_session` with exactly the three properties and two required
   fields above. The real Hermes Director must then use that discovered surface
   to create and start the selected `hermes-worker`, create and assign the
   durable Task, and continue the normal governed flow. Missing discovery,
   empty/absent required arguments, no worker, no durable Task assignment, or
   any retry caused by an empty schema is red. The unchanged consumer bar
   remains real pointer-visible 13 objects/15 cables, all ten inspectors
   open/collapse, three Hermes terminals accepting and erasing an unsubmitted
   candidate canary after mouse focus, exact close/reopen inventory equality,
   and zero descendant processes. A machine-only green does not close R16.

Plain meaning: the Director must be shown the fields needed to hire a worker,
then guided research must create a real worker and durable task instead of
retrying an empty call.

Allowed Builder product paths are only `collab-electron/src/main/kernel.ts`
and the nearest existing gateway/tool-surface test, plus the R16 BUILD-REPORT
and generated Atlas projections. The real founder database and retained backup
are not Builder inputs and must not be opened or changed. A fresh Reader must
answer the protocol's exact two questions before construction.

Verifier tooling receipt: candidate `94c4ee61` passed the required product and
focused gates through R16 13/0, but the first `bun qa/run.ts typecheck` attempt
reported Windows `EBUSY` while Electron postinstall removed the generated
`collab-electron/node_modules/.bun/node-pty@1.1.0/node_modules/node-pty/build`
directory. The verifier's supervising shell and typecheck/tsc descendants then
finished and all four were observed absent; no QuantFlow app, founder database,
product file, assertion, or source artifact was touched. The same Verifier may
rerun only the unchanged typecheck command once now that the owning processes
are gone, then continue the still-unrun Atlas check/ratchet and diff check. A
nonzero assertion/type error or repeated `EBUSY` stops. Green completes the
original independent verification; no implementation or cleanup helper is
authorized.

That unchanged continuation was unmeasured rather than red: the command runner
returned while its Bun/Node rebuild descendants were still alive, emitted no
native exit or `PASS  typecheck`, and those descendants later exited. No product
or founder state changed. This is a verification-transport defect, so it does
not authorize another product lap. One fresh Verifier may measure only the
unchanged tail using a single direct background PowerShell process with durable
stdout/stderr and native-exit files under `C:\tmp`; no script, manifest, event
stream, retry, cleanup framework, or source edit. It must wait for that exact
process to end (maximum five minutes), require exit file `0` and the gate's
canonical log text `PASS  typecheck` (two spaces), then run Atlas check/ratchet
and `git diff --check` directly.
Missing durable files, timeout, nonzero exit, or absent PASS is red. Combined
with the prior independent green focused receipts at the same immutable SHA,
that bounded tail may write the action-schema Verification PASS.

## NORMAL CONSUMER HYPOTHESIS BINDING REPAIR — exact R16 founder red

The action-schema candidate `94c4ee61e9b64fca56d0101557eeb64cb5f4c534`
opened the normal founder application at `schema_meta=84`. Computer Use clicked
`TRY GUIDED RESEARCH` once. The real Hermes Research Director selected
`hermes-worker`, created and started `session-7bae5fa1-worker-0001`, and assigned
durable Task `task-d5b21e26-4ad6-42f6-94e0-3d07db91c693`. The worker completed
that Task and published result Artifact
`c183207fdc494582e27a74c423cca02e97b6157bce6cf739b04923226c87a6d0`
with seven Kernel-receipted reads. This proves the preceding action-schema repair
in the normal product.

The same run then stopped before deterministic execution or independent review.
The native stderr receipt is exact:

```text
research continuation failed Error: research result has no exact Hypothesis binding for 7fb6d36b-a9b7-4e07-ab92-d8a50921feb3
```

Read-only Kernel measurement after the run found `run=0`, `evaluation=0`, no
report Artifact, the completed source Task, and the durable worker result. The
normal window closed through its ordinary Close control and the process receipt
was `consumer_processes_remaining=0`.

The defect is one duplicated production boundary. The JSON-RPC
`qf.research.submit_question` path records
`researchHypothesisBySession.set(result.sessionId, hypothesisId)` after admission.
The renderer's normal `qf:research:submit` IPC path performs the same Mission,
Hypothesis, and Director admission but returns without recording that binding.
The shared collaboration result callback therefore cannot call the already-
implemented `kernelRunGuidedResearch()`, critic admission, governed evaluation,
and report publication path.

Repair only this exact normal-consumer boundary:

1. Replace the file-local `researchHypothesisBySession` map in
   `collab-electron/src/main/index.ts` with one exact process-local context
   module at `collab-electron/src/main/research-context.ts`. That module owns
   only the Director-session-id to Hypothesis-id binding and exports exactly
   four operations: bind one non-empty pair, read one session, clear one
   session, and clear all bindings for test/process teardown. It is not Kernel
   truth and writes no file or database.
2. Both production question front doors — renderer IPC
   `qf:research:submit` in `collab-electron/src/main/ipc-kernel.ts` and
   JSON-RPC `qf.research.submit_question` in
   `collab-electron/src/main/index.ts` — call the
   same bind operation with their exact returned `result.sessionId` and exact
   created `hypothesisId` before returning success. The collaboration result
   continuation reads through the module. `closeAdmittedSession(sessionId)`
   clears that session's Hypothesis binding together with its existing Mission
   binding. Do not change Kernel rows, Mission or Hypothesis creation, Dataset
   contents, action semantics, prompts, model behavior, review policy, or any
   proof-only path.
3. Add exactly
   `collab-electron/src/main/research-context.test.ts`. Its runtime tests import
   the real module, not source text. They prove: binding `session-a` to
   `hypothesis-a` returns that exact id while an unbound session returns
   `undefined`; clearing `session-a` makes it unaddressable without clearing an
   independently bound `session-b`; empty session or Hypothesis ids throw
   before mutation; and clear-all leaves both sessions unaddressable. The final
   normal Computer consumer run is the integration oracle that the renderer
   IPC front door actually called this module; a source-text-only assertion is
   forbidden.
4. Builder gates are exactly:

   ```text
   bun test collab-electron/src/main/research-context.test.ts
   bun test collab-electron/src/main/mission-activation.test.ts
   bun test collab-electron/src/main/native-tui-orchestration.test.ts
   bun qa/run.ts kernel-sole-writer
   bun qf-atlas/generate.mjs --check
   bun qf-atlas/ratchet.mjs
   git diff --check
   ```

   Expected focused counts are `4 pass / 0 fail`, `2 pass / 0 fail`, and
   `8 pass / 0 fail`; every remaining command exits zero and the named static
   gate prints PASS. The Builder must falsify the bind condition once by making
   the module's bind operation a no-op while the test is unchanged, and must
   separately falsify the clear-one condition once by making that operation a
   no-op. Each test run must exit nonzero naming its missing condition. Restore
   exact candidate bytes after each falsifier and finish at `4 pass / 0 fail`
   with zero diff from the candidate. No source-text test counts.

   Then run `bun qf-atlas/generate.mjs`, repeat Atlas `--check` and ratchet,
   inspect `bun qf-atlas/generate.mjs --diff 94c4ee61e9b64fca56d0101557eeb64cb5f4c534`,
   and finish with `git diff --check`. Record unedited output in exactly
   `docs/orders/evidence/r16/BUILD-REPORT.md`; generated Atlas projections may
   change only as a consequence of these product paths.

   Builder scope excludes live model runs, the proof-mode R16 gate, installer,
   release matrix, typecheck rebuild, timeout changes, helper frameworks,
   worktrees, and R17 edits.
5. A fresh different-model Verifier re-runs the exact short matrix above against
   one immutable product candidate, including the post-generation Atlas checks
   and base diff, and records SHA before/after. It does not edit. It does not
   repeat the Builder's mutation falsifiers.
6. Only after independent PASS, rebuild once and repeat the normal Computer
   consumer check. The real guided sample must retain the already-proven
   Director, worker, durable Task, and result Artifact; then create a
   deterministic Run, admit a real `hermes-critic`, record an Evaluation with
   verdict exactly `supports`, publish the gated report Artifact, and expose the
   complete durable research world by pointer. A different verdict or absent
   report is red for this fixed deterministic sample, not an alternate passing
   branch. The unchanged 13-object/15-cable, inspector, terminal typing,
   close/reopen equality, and zero-process bar still applies. Any missing exact
   binding, continuation exception, absent critic, or incomplete world is red
   and names the next finite defect.

No other gate, test, evidence output, or result branch is implied.

The Builder must not use the broader phrase `R16 evidence`: its only authored
report is `docs/orders/evidence/r16/BUILD-REPORT.md` plus generated Atlas
projections allowed above.

The focused regression is deliberately a runtime lifecycle test while the
normal Computer run is deliberately the renderer-IPC integration test. Neither
may be substituted for the other.

Plain meaning: both front doors must remember which Hypothesis belongs to the
Director they started, so the completed worker result can continue into the
already-built deterministic and independent-review pipeline.

Allowed Builder paths are only `collab-electron/src/main/index.ts`,
`collab-electron/src/main/ipc-kernel.ts`,
`collab-electron/src/main/research-context.ts`,
`collab-electron/src/main/research-context.test.ts`,
`docs/orders/evidence/r16/BUILD-REPORT.md`, and generated Atlas projections. A
fresh Reader answers the protocol's exact two questions before construction.

Independent verification receipt: fresh Terra task
`01a028b0-9f3b-7093-a903-2bfb87328f1c` returned PASS at immutable product
candidate `f8f085b3e87639f598e6973dca92ebfb2a781b57`, with Builder evidence
`184dffa41b760e736be4f513dc34f8cac968139f`. Runtime counts were exactly `4/0`,
`2/0`, and `8/0`; `kernel-sole-writer` printed PASS; Atlas check/ratchet were
green and the base diff verdict was UNCHANGED; `git diff --check` exited zero;
HEAD and Router-owned document bytes were identical before/after. The durable
receipt is `docs/orders/evidence/r16/HYPOTHESIS-BINDING-VERIFICATION.md`.

Current door: rebuild `f8f085b3` once and repeat the normal-app Computer
consumer contract. No R17 authority exists until that consumer bar passes and
R16 is closed in the repository.

## NORMAL CONSUMER GOVERNED-WORLD AND SHUTDOWN REPAIR — exact R16 founder red

The normal Computer consumer run at product candidate
`f8f085b3e87639f598e6973dca92ebfb2a781b57` proved the preceding repair and
advanced through the whole real-model chain. It created Mission
`mission-ddbf1b6a-f76f-486b-ba82-05781d422e9a`, Research Director
`e2506576-c6fe-4026-a641-3b43794ff2c8`, worker
`acp-9c4e2f7a-1b3d-4e5f-8a6c-2d7e9f1b4c8a`, source Task
`task-53b85fd9-afee-44a9-9817-c32fc36ce773`, deterministic Run
`run-fe590303-de63-4882-a1fe-4c232914e487`, critic
`critic-022171f8-49f5-4c10-ae60-f1ad4fdac934`, Evaluation
`888950fe-11ac-43f3-81b2-bab216790ca7` with verdict `supports` and confidence
`0.9`, and published Report Artifact
`4e55875cdea6299e7d6b912d87ead4b6ccdd7b0d1058e0af5aa264987b7af25b`.
That is a real Director, worker, critic, Evaluation, and governed publication
receipt, not a synthetic fixture.

Two later product assertions were red.

1. Computer Use clicked the completed Mission's visible `Show research world`
   control by pointer. The normal app retained only the Mission tile: no exact
   13-object/15-cable world appeared. Read-only Kernel inspection found no
   `qf_review_source_work` table or source-work row and no governed review Task.
   Source inspection confirms that the normal collaboration-result continuation
   calls `kernelRunGuidedResearch()` and manually creates the critic, but never
   calls the already-shipped `kernelBindSourceWork()`,
   `kernelRequestGovernedReview()`, or `kernelMarkGovernedDelivery()` boundary.
   The R16 synthetic fixture does call those boundaries, which is why its
   13/15 proof could pass while the founder path stayed incomplete.
2. The normal app closed through its ordinary Close control. All Windows app,
   Electron, Hermes, and collaboration MCP processes exited, but one WSL
   ontology MCP child remained for more than eight minutes:
   `node .../qf-ontology-mcp.mjs`, WSL PID `1198`, parent `/init` PID 1. It was
   terminated only after this red was recorded. Source inspection identifies
   the lifecycle race: `closeAgentSessionRow()` removes a native-TUI entry from
   the live map and starts `tearDownNativeTui()` without awaiting or retaining
   its Promise; shutdown later cannot await that already-detached teardown.

Repair only these two exact normal-consumer defects:

1. The completed worker result must enter the existing R15 governed-review
   boundary before the critic starts. Bind exactly one immutable source-work
   record for the existing source Task, exact Hypothesis, deterministic Run,
   result Artifact, and actual worker/executor session; request exactly one
   governed review for that source Task and precreated critic; start the critic
   with the exact governed review Task/source work; then record delivery through
   the existing boundary. Do not create a second truth store, duplicate the R15
   tables, synthesize a review Task in renderer code, or change the critic's
   verdict/publication rules. A failure before delivery must retain the existing
   failure vocabulary and must not leave a falsely delivered review.
2. The normal founder path must use the worker session as the executor identity
   for the deterministic Run/source-work chain. The Director remains the
   delegator and the critic remains independent. The completed world therefore
   has exactly the required three session objects: Director, worker/executor,
   and critic.
3. Native-TUI teardown started by `closeAgentSessionRow()` must remain owned
   until it settles. App shutdown must await every such in-flight teardown as
   well as entries still in the live map. Each teardown runs at most once;
   a settled Promise is removed from tracking; errors remain bounded to the
   existing cleanup policy. Do not scan or kill unrelated WSL processes and do
   not add a broad `wsl --shutdown` fallback.
4. Add focused runtime tests that can fail independently for: missing normal
   source-work binding; missing governed review Task/delivery; wrong executor
   identity; missing 13-object/15-cable projection after the normal sequence;
   shutdown returning before an already-detached native-TUI teardown settles;
   and duplicate teardown. Tests must exercise production functions, not search
   source text or inject product rows directly. Retain the existing R16
   `13 pass / 0 fail` contract and Atlas ratchet unchanged.
5. Builder verification is the smallest focused matrix covering those new
   runtime tests, existing governed-review tests, existing research-world tests,
   existing native-TUI lifecycle tests, `bun qa/run.ts kernel-sole-writer`,
   `bun qf-atlas/generate.mjs --check`, `bun qf-atlas/ratchet.mjs`, and
   `git diff --check`. No live model run, proof-mode R16 gate, installer,
   release suite, typecheck rebuild, timeout increase, helper framework,
   worktree, or R17 work is authorized. The Builder records exact commands,
   counts, changed paths, and one immutable candidate in the existing R16
   BUILD-REPORT, regenerating Atlas projections only when required by product
   changes.
6. A fresh different-model Verifier reruns the exact short matrix at the
   immutable candidate and records SHA before/after. It does not edit. Only an
   independent PASS reopens the final normal Computer consumer check.
7. The Router then rebuilds once and runs one normal guided Mission. PASS still
   requires real Director/worker/critic completion, `supports`, published
   Report, pointer-visible exact 13 objects/15 cables, all ten inspectors
   open/collapse, all three Hermes terminal canaries accepted and erased
   without submission, exact ordinary close/reopen inventory equality, and
   final `consumer_processes_remaining=0` across Windows and WSL. Any missing
   world object/cable, direct non-governed review, orphaned MCP process, or
   changed assertion is red.

Allowed Builder product paths are only the existing normal continuation and
governed-review adapter surfaces in `collab-electron/src/main/index.ts` and
`collab-electron/src/main/kernel.ts`, native-TUI ownership in
`collab-electron/src/main/agent-host.ts`, and the exact existing focused test
files named in the Reader defect closure below. No new focused test file or
other product path is authorized. The existing R16 BUILD-REPORT and generated
Atlas projections remain allowed. A fresh Reader must answer the protocol's
exact two questions before construction. Every Reader defect lands in this
order; chat-only guidance is not authority.

Plain meaning: the founder path must use the same governed review truth that
the verified fixture used, and closing QuantFlow must actually close every
process QuantFlow started.

### Reader defect closure — exact governed-world/shutdown contract

The fresh Reader at pushed head `3d1578e` returned `NO/NO`. The defects were
that “the smallest focused matrix” was not a matrix, the new runtime checks had
no required red/restored-green proof, and “those new runtime tests,” “inventory
equality,” and “changed assertion” did not identify one fixed contract. This
subsection is binding clarification of the appended repair; it supersedes those
ambiguous phrases without changing the product objective.

#### One meaning per deliverable

1. **Normal governed continuation.** For the one completed worker result, the
   existing normal continuation calls the existing `kernelBindSourceWork()`,
   `kernelRequestGovernedReview()`, and `kernelMarkGovernedDelivery()` helpers,
   in that order and exactly once each. The source-work tuple is exactly
   `(source Task id, Hypothesis id, deterministic Run id, result Artifact id,
   worker session id)`. `kernelRequestGovernedReview()` receives that source
   Task and the already-created critic session, returns the one governed review
   Task id. The critic is started with that review Task plus the same source
   work, and the existing delivery boundary is called immediately after that
   one delivery attempt with exactly `delivered` when the live critic accepted
   the instruction or `failed` when it did not. Delivery is not a verdict or
   publication receipt: the critic result, Evaluation, and publication checks
   remain later unchanged boundaries. A failed delivery cannot proceed to a
   passing Evaluation. No renderer-owned row creation, second review Task,
   second source-work record, or alternate failure vocabulary is allowed.
2. **Executor identity.** The source-work `executor_session_id`, Run executor,
   and `assigned_to` executor link are all the worker session id. The Director
   appears only as delegator and the critic only as independent reviewer. The
   successful world has exactly three session objects: Director, worker/executor,
   and critic.
3. **Native-TUI ownership.** `closeAgentSessionRow()` transfers each started
   teardown Promise into one process-owned in-flight set before removing its
   live-map entry. Shutdown awaits both live-map teardowns and every in-flight
   teardown with the existing bounded error policy; settlement removes the
   Promise, a repeated close cannot start a second teardown, and no unrelated
   WSL process is inspected or killed.
4. **Focused runtime tests.** Add assertions to exactly these existing runtime
   test files: `collab-electron/src/main/governed-review.test.ts` covers source
   binding, governed review Task, governed delivery, and worker executor identity;
   `collab-electron/src/main/research-world.test.ts` and
   `collab-electron/src/windows/shell/src/research-world.test.ts` cover the exact
   13-object / 15-cable projection after the normal sequence; and
   `collab-electron/src/main/native-tui-orchestration.test.ts` plus
   `collab-electron/src/main/precreated-native-tui.test.ts` cover awaiting an
   already-detached teardown and at-most-once teardown. Each named condition has
   its own assertion and can fail while the other conditions remain green. No
   new focused test file is authorized by this repair.
5. **Builder evidence.** The existing R16 `BUILD-REPORT.md` contains one
   unedited row for every command below, native exit/count output, changed-path
   list, candidate SHA, and one row for each falsifier F1–F7 below. It is command
   evidence, not a new framework. After the focused product tests and before
   the matrix, the Builder always runs `bun qf-atlas/generate.mjs` and
   `bun qf-atlas/generate.mjs --diff <immutable base SHA recorded before the
   first source edit>`, commits only projections generated by the allowed
   product paths, and records both outputs. The Verifier never regenerates or
   edits Atlas; it runs only the exact matrix below against the candidate.
6. **Verifier evidence.** A fresh different-model Verifier runs the same command
   list at the unchanged candidate SHA, records SHA and clean-status receipts
   before and after, and does not edit the candidate. Its independent PASS is
   the only door to the Router check.
7. **Consumer evidence.** “Inventory equality” means equality of the selected
   root’s complete world snapshot: the 13 exact object type/id pairs, all
   displayed fields and hashes, all 15 cable kind/from/to triples, saved
   positions, and inspector collapsed/expanded states before close and after
   reopen. It excludes unrelated Dock/application inventory. “All ten
   inspectors” means the ten research-object tiles in the fixed manifest, not
   the three session tiles. The three terminal canaries target Director,
   worker, and critic sessions; each is typed after mouse focus, observed, and
   erased without submission. `consumer_processes_remaining=0` means zero
   QuantFlow-owned Windows and WSL processes and zero owned roots; unrelated
   system processes are out of scope. “Changed assertion” means any weakening,
   deletion, or expected-value change in the fixed R16 gate, focused contracts,
   or consumer checks; a candidate with one is red.

#### Exact Builder and Verifier matrix

The phrase “smallest focused matrix” means exactly these commands, with no
substitution, wrapper, retry, or omitted command:

```text
bun test collab-electron/src/main/governed-review.test.ts
bun test collab-electron/src/main/research-world.test.ts
bun test collab-electron/src/windows/shell/src/research-world.test.ts
bun test collab-electron/src/windows/shell/src/task-composition.test.ts
bun test collab-electron/src/main/native-tui-orchestration.test.ts
bun test collab-electron/src/main/precreated-native-tui.test.ts
bun test packages/qf-kernel/src/r15-governed-review.test.ts
bun test packages/qf-kernel/src/r16-visible-world.test.ts
bun test qa/gates/governed-review.test.ts
bun test qa/gates/research-world-visible.test.ts
bun qa/run.ts kernel-sole-writer
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
```

The first ten commands must print a native `N pass / 0 fail` count with `N > 0`
and exit 0; zero discovered tests is red. The named static gate must print
`PASS`; every remaining command must exit 0.
The Builder and Verifier each retain unedited output for every line. A missing
test file or command is red; a count is not inferred from another command.

#### Required independent falsifiers

Before the final green matrix, the Builder temporarily applies each mutation
below to the named production seam, leaves all tests, expected manifests, and
gate files byte-identical, runs the owning focused command, and requires a
native nonzero exit whose message names the missing condition. The Builder then
restores the exact candidate bytes, records zero diff for the mutated path, and
reruns that command to native zero. These are focused tests only; no live app is
launched.

```text
F1  make the normal continuation's kernelBindSourceWork call a no-op;
    governed-review.test.ts must go red on missing source-work binding.
F2  make kernelRequestGovernedReview return no review Task;
    governed-review.test.ts must go red on missing governed review Task.
F3  make kernelMarkGovernedDelivery a no-op;
    governed-review.test.ts must go red on missing governed delivery.
F4  substitute the Director session for the worker in the source-work/Run
    executor field; governed-review.test.ts must go red on executor identity.
F5  in the existing Main projection handoff, omit one object or one cable
    without changing the independent expected manifest;
    the Main and shell research-world tests must go red on the 13-object/15-cable
    contract.
F6  start detached native-TUI teardown without retaining it for shutdown;
    native-tui-orchestration.test.ts must go red because shutdown returns early.
F7  remove the at-most-once tracking guard and close the same session twice;
    native-tui-orchestration.test.ts must go red on duplicate teardown.
```

F1–F7 are separate rows in `BUILD-REPORT.md`; each restored-green run is
required. A focused test that remains green under its named mutation is an
acceptance failure, not permission to weaken the assertion. The Verifier reruns
the unchanged matrix and may inspect these rows but does not repeat mutations.

The Router’s single post-Verification rebuild means exactly one
`bun run --cwd collab-electron build`, followed by one ordinary non-proof launch
and one guided Mission; no second build, fixture launch, retry, or proof-mode
run is part of this acceptance. The Router records that exact command and its
native exit. Exit zero alone is insufficient: stdout must include the invoked
`electron-vite build` script and successful Main, preload, and renderer build
completions, and the three corresponding `collab-electron/out` products must
have modification times at or after the recorded build start. Bun usage/help
text or unchanged output products are red. For each of the ten research-object tiles it clicks Inspect once,
then Collapse once, and records `inspect=10 collapse=10`; a duplicate, skipped,
or wrong tile is red. Any failure in the seven consumer evidence fields above
is red, and only the exact governed source-work/review/delivery receipts can
turn that field green.

### FINAL READER CLOSURE — executable lifecycle seams and consumer restart meaning

The preceding closure still left the named mutations partly non-executable and
left two consumer phrases with different meanings. This subsection is binding
and supersedes only those mechanics; it does not weaken any product,
ontology, receipt, or consumer assertion.

In the parent repair's phrase “start the critic with that review Task plus the
same source work,” **start** now means the instruction delivery after review
admission. The runtime start is the no-instruction pre-start required below;
the parent phrase does not authorize requesting review against a `starting`
critic or sending the instruction before review admission.

#### One callable normal-continuation seam

The normal result callback must extract its governed sequence into exactly one
exported production helper in `collab-electron/src/main/kernel.ts` named
`kernelContinueGovernedResearchResult`. The normal collaboration callback in
`index.ts` calls that helper; the helper is not a test double and does not write
any new store. Its input is exactly one record containing
`source_task_id`, `hypothesis_id`, `run_id`, `result_artifact_id`,
`executor_session_id`, `critic_session_id`, and one non-empty `attempt_id`,
plus one non-empty `deliver(review_task_id, source_work)` callback. The
callback returns `Promise<void>`; resolving is the one accepted delivery
attempt and rejecting is the one failed delivery attempt. The helper returns
the admitted `review_task_id`, the frozen `source_work`, and the recorded
outcome, or rethrows the original delivery error after recording failure.

The helper's exact runtime order is:

1. construct the one source-work tuple from the input;
2. call `kernelBindSourceWork` once with that tuple;
3. call `kernelRequestGovernedReview` once with that source Task, the one
   `attempt_id`, and the already-created, running critic session;
4. require an admitted result whose review Task and critic ids equal the
   returned values, then call `deliver` exactly once with the returned review
   Task id and returned frozen source work;
5. in a `finally` immediately after that one attempt, call
   `kernelMarkGovernedDelivery` exactly once with `delivered` when `deliver`
   resolves or `failed` when it rejects; and
6. allow no Evaluation, publication, or governed tool receipt before step 5.

The normal callback therefore runs `kernelRunGuidedResearch` with the worker
session as executor, creates exactly one `hermes-critic` Kernel session row in
`starting` state, and invokes the existing `startPrecreatedSessionWithTile`
once **without** an instruction so that the precreated critic becomes
`running`. Only then does it invoke the helper. Its `deliver` callback calls
the existing `deliverToAgentSession` once, using the actual returned
`review_task_id` and the exact returned `source_work` in the critic
instruction; a false return becomes a rejected delivery attempt. It may not
derive a review id from the Run id, send an instruction during pre-start, or
request review against a `starting` critic. A thrown or false instruction
attempt is still one attempt, is recorded as `failed`, and cannot be retried or
reach Evaluation.

After a `delivered` receipt, the already-running critic may emit governed tool
receipts only through the existing `kernelRecordGovernedToolReceipt` gateway
boundary. Every such receipt names the exact review Task and critic session,
has a strictly increasing broker sequence beginning at 1, and is ordered after
the initial delivery event. The required Hypothesis/Run/Artifact read receipts
must exist before `qf_record_evaluation`; that existing action's own pending
invocation receipt is updated by its Evaluation transaction. Evaluation is the
next boundary, and publication is the existing supports-only transition inside
that Evaluation path. The later existing completion receipt is not the initial
delivery-attempt receipt and may not substitute for
`kernelMarkGovernedDelivery`. A failed delivery has no governed tool receipts,
Evaluation, findings Artifact, or Report.

The normal continuation test in
`collab-electron/src/main/governed-review.test.ts` must invoke
`kernelContinueGovernedResearchResult` against a real Kernel fixture and a
real production Kernel session setup, with only the delivery callback supplied
by the test. It must assert the source-work row, one review Task, the initial
delivery outcome, bound broker receipts, Evaluation ordering, and supports
publication through production functions. This is the concrete runtime seam
for F1–F4; source-text scans and direct SQL row injection are forbidden.

#### F1–F7 mutation execution

The Builder applies each mutation to the named production seam, leaving the
focused tests, expected values, and gate files byte-identical. Each mutation
has a native nonzero red run, exact-path zero-diff restoration, and native zero
restored-green run:

- **F1:** make the `kernelBindSourceWork` call inside
  `kernelContinueGovernedResearchResult` a no-op. The governed-review runtime
  test must fail because review admission cannot produce the required bound
  source work.
- **F2:** make that helper's `kernelRequestGovernedReview` result non-admitted
  or omit its review Task. The same test must fail before delivery because the
  exact review Task is missing.
- **F3:** make that helper's `kernelMarkGovernedDelivery` call a no-op. The
  same test must fail on the pending review Task / absent initial delivery
  receipt and on the inability to record the subsequent governed receipts.
- **F4:** pass the Director session as `executor_session_id` in the normal
  continuation's source-work/Run tuple. The same test must fail the immutable
  executor and assigned-link contract.
- **F5:** make two separate temporary mutations to the named
  `getResearchWorldProjection` production handoff, one omitting one expected
  object and one omitting one expected link. The Main research-world test uses
  an independent fixed 13-object/15-link manifest and must fail each red; the
  shell research-world test then restores and proves the same 13/15 endpoint
  mapping. Both red/green sub-runs are one BUILD-REPORT F5 row.
- **F6:** remove retention of a detached teardown from the production
  `closeAgentSessionRow` path. The native-TUI runtime test must hold the
  teardown Promise unresolved, invoke the production shutdown/disposal seam,
  and fail if shutdown resolves before that Promise settles.
- **F7:** remove the production at-most-once guard and close the same native-TUI
  session twice. The native-TUI runtime test must observe two teardown calls
  and fail; the restored run must observe exactly one.

For F6/F7, `agent-host.ts` must use one module-owned
`createNativeTuiTeardownRegistry` seam with exactly `begin(sessionId, entry)`,
`awaitAll()`, and settled-entry removal. `begin` returns the existing Promise
for a repeated session id, retains every detached Promise before the live-map
entry is removed, and marks it settled exactly once. `disposeAgentOs` awaits
both live-map teardowns and `awaitAll()` using the existing bounded
`Promise.allSettled` cleanup policy. The two named native-TUI tests invoke this
production registry through the same close/dispose path; they do not merely
test a copied fake and do not insert Kernel rows directly. This is one local
lifecycle seam, not a new framework or truth store.

#### Consumer restart and inspector state

The earlier sentence in `CONSUMER-OWNED REOPEN` saying that inspector state is
excluded from persisted-world equality is spent history. For this final
consumer acceptance, the Router records the ten exact research-tile
`expanded` booleans after the ten Inspect/Collapse checks and before close,
records them again after the second normal launch, and requires byte-equal
`type`, `id`, fields/hashes, cables, positions, and inspector states. The
canonical receipt prints those ten states; `consumer_reopen_equal=true` is
runtime-derived from the complete comparison. This compares transient UI state
for the consumer check and does not authorize persisting inspector state as
Kernel truth.

The earlier phrase “one ordinary non-proof launch” is also superseded for this
consumer check. The Router performs exactly one build, then exactly two
ordinary non-proof app launches using the same candidate identity: the first
launch runs one guided Mission and the second launch is the same-root reopen.
There is no second build, second guided Mission, proof-mode launch, fixture
launch, or retry. The final process/root receipt covers both launches.

The first Router invocation after Verification used the spent, invalid syntax
`bun --cwd collab-electron run build`. Installed Bun exited `0` after printing
usage/help and did not invoke Electron Vite or change the output products. That
is an order-command falsifier receipt, not a build attempt or passing gate. The
corrected command and output/timestamp assertions above are now the only build
authority. That one actual build then completed at candidate `34c4bd2` with the
receipt recorded below and is spent. After a repair candidate passes fresh
independent verification, this final subsection authorizes exactly one new
actual build for its two-launch normal consumer check; no other build is
authorized.

## FINAL COMPUTER RED — delivered text was never submitted to Hermes

The first ordinary normal-app launch of the built immutable product candidate
`34c4bd254165901b8e2d8df72e717c76a171c341` displayed that exact masthead SHA
and packaged timestamp `2026-08-22T09:53:50.3974172Z`. Computer Use clicked
`TRY GUIDED RESEARCH` once. Production created Mission
`mission-0ecd27fd-a454-478d-94ab-b223bc20c3d3`, Director
`4fdbb9b1-111a-438a-86cd-bf7043228017`, executor
`7c9e2a14-3f6b-4a8d-b1e5-9d2c4f6a8e01`, source Task
`task-a1d5590c-918b-49b0-a33c-481651c31803`, deterministic Run
`run-fba0063c-f840-4c8d-8089-eb964d93b481`, critic
`critic-78b29468-e803-4152-8c1c-53c225cc7518`, frozen
`qf_review_source_work`, review Task
`review-task-c772cafe-b2b8-4617-99a0-8cff5af4cda0`, one admitted review
attempt, and one initial `delivery_receipt` whose outcome was `delivered`.

That delivered receipt was false in the product sense. The normal continuation
called `deliverToAgentSession(criticSessionId, criticInstruction)` once. That
function writes bytes to the PTY and returns; unlike the existing Hermes
`activateMission` boundary, it does not wait and send the separate carriage
return that submits the input. After fourteen minutes the critic and Director
were still `running`, `qf_review_invocation` had zero rows, Evaluation count was
unchanged, `qf_review_publication` had zero rows, and the review Task remained
`running` with no terminal receipt. Ordinary window Close then produced
`consumer_windows_processes_remaining=0` and
`consumer_wsl_processes_remaining=0`. This is an exact normal-product delivery
defect, not a provider-speed assumption and not authority to synthesize a
critic result.

The same launch proved the exact unsubmitted candidate canary on the Director
and critic terminals, but Computer Use reached the executor only after its
one-shot process had closed. The missing executor receipt is a measurement-
ordering red, not evidence of a terminal product defect. On the next consumer
attempt, click `TIDY` as soon as the executor tile appears and complete that
terminal's canary before waiting for its result. Then do the Director and
critic canaries while each is live. Do not type into a terminal until its
activation/task instruction has visibly left the input line.

### Authorized narrow repair

1. Preserve the already-proven order: create and start the critic to `running`,
   admit the governed review, freeze source work, and record exactly one
   delivery attempt. Do not start the critic with an instruction and do not
   move admission back onto a `starting` critic.
2. Make that one delivery attempt perform one semantic Hermes submission:
   write the exact critic instruction once, wait the existing bounded 400 ms
   input-settle interval, then write exactly one `\r`. Both PTY writes belong
   to the same delivery attempt. If either write cannot target the same live
   critic, reject that attempt and let the existing `finally` record `failed`.
   Do not retry, synthesize an Evaluation, or weaken the source-work/read/
   evaluation/publication ordering.
3. Prefer one narrow production helper in `agent-host.ts`, used by the normal
   continuation in `index.ts`, so the meaning is explicit: submitting an
   app-authored Hermes instruction is not the same operation as writing raw
   terminal bytes. Do not change unrelated peer delivery or the existing
   founder-Submit activation path.
4. Extend the existing normal-continuation runtime test to capture the real
   production delivery seam and assert instruction-write, 400 ms settle,
   one-carriage-return submission, one initial delivery receipt, then the
   unchanged four governed tool receipts, Evaluation, and publication. No
   direct Kernel shortcut or copied helper is allowed.
5. Falsify by suppressing the carriage-return write while keeping the
   instruction write successful. The focused test must go red because no
   critic action can follow an unsubmitted instruction; restoration must return
   green with byte-zero diff. Retain the full previously verified short matrix,
   Atlas hard-red zero, and clean diff.

A fresh Reader answers the standard two questions on this subsection before
one Builder implements it. A fresh independent Verifier repeats the bounded
matrix at the immutable repair candidate. Only then may the Router perform a
fresh one-build/two-launch normal Computer consumer check. The failed launch
above is a recorded diagnostic attempt and does not waive any three-terminal,
13-object/15-cable, ten-inspector, reopen-equality, or cleanup assertion. R17
remains closed.

### FINAL COMPUTER RED — Reader findings and binding closure

The fresh adversarial read of the preceding subsection is **NO/NO**. These are
finite order defects, not permission to improvise:

1. **The production delivery seam is optional and unnamed.** Item 3 says to
   “prefer” a helper, while item 4 only says to capture a “real production
   delivery seam.” The existing normal-continuation test supplies its own
   callback and then manually records the four governed receipts, so a Builder
   could add a passing helper/test path while the normal `index.ts` callback
   still calls the old write-only `deliverToAgentSession` path. The gate would
   not fail on that integration defect. Plain meaning: the normal app could
   keep using the broken send path while the new test passes beside it.
2. **The first PTY write has two possible meanings.**
   `buildMissionActivationInstruction()` returns the critic instruction with
   one terminal `\r`; “write the exact critic instruction once, then write
   exactly one `\r`” therefore permits a first write that already submits and a
   second carriage return. The required protocol is one text write with that
   one terminal `\r` removed, then one separate `\r` after 400 ms. Plain
   meaning: the message must be typed first and submitted once afterward, not
   submitted twice.
3. **“Same live critic” is not an acceptance contract.** The current
   `deliverToAgentSession()` resolves one live entry and `writeToSession()` can
   silently do nothing when its PTY has disappeared, while still returning a
   successful delivery result. The order does not say which session/PTY
   identity is captured, when it is rechecked, or what makes either write a
   failure. Plain meaning: the receipt could say the critic received the work
   even when one of the two writes went nowhere or went to a changed seat.
4. **The carriage-return falsifier is not executable proof of the claimed
   downstream condition.** It names no exact production mutation, command,
   native red receipt, restoration-zero-diff check, or runtime observation that
   prevents the current test from manually injecting the four later receipts.
   “No critic action can follow” is consequently asserted, not measured. Plain
   meaning: removing the submit key must make the focused check visibly fail at
   the missing second write, rather than letting a test manufacture a successful
   critic afterward.

This closure supersedes only the mechanics of the preceding subsection. Before
any Builder door opens, the repair must bind all four points as follows:

1. Add exactly one exported production helper named
   `submitAgentSessionInstruction` in `collab-electron/src/main/agent-host.ts`
   with input `(sessionId, instruction)` and a `Promise<void>` result. The
   normal continuation's `deliver` callback in `index.ts` must call this helper
   exactly once; it may not call `deliverToAgentSession` directly. The existing
   `kernelContinueGovernedResearchResult` ordering and its one delivery receipt
   remain unchanged. The focused runtime test must exercise this same exported
   helper through a production-owned write seam; it may control only the PTY
   observation/wait seam needed to measure the two writes and may not copy the
   helper or inject the four governed receipts as proof of submission.
2. The helper must accept the exact string returned by
   `buildMissionActivationInstruction()` for the critic, remove exactly its one
   terminal `\r` from the first write, write that text once, await exactly the
   existing 400 ms bounded interval, and write exactly one separate `\r`.
   The focused assertion must compare the first write byte-for-byte with the
   returned instruction minus that one terminal `\r`, and the second write
   byte-for-byte with `"\r"`; no burst, embedded terminal key, or extra write
   complies.
3. At the start of one attempt, the helper must capture the exact live native-
   TUI `sessionId` and non-empty `ptySessionId` for the critic. Immediately
   before the second write it must re-read the live entry and require the same
   session id, native-TUI kind, and identical PTY id. A missing entry, changed
   kind/id, or failed write rejects the Promise; both writes must use that one
   captured PTY target. The focused test must cover the changed-target and
   missing-target red paths without changing Kernel receipts.
4. The exact falsifier is a temporary no-op of only the second
   `writeToSession(capturedPtySessionId, "\r")` in
   `submitAgentSessionInstruction`. Run exactly
   `bun test collab-electron/src/main/governed-review.test.ts`; the unchanged
   test must exit nonzero naming the missing submit write, restore the exact
   helper bytes, require zero diff for that path, and rerun the same command to
   its native green count. The test retains the parent matrix's source-work,
   review, four governed-receipt, Evaluation, and supports-publication
   assertions. Those later assertions are not evidence that the carriage
   return was submitted: the CR-specific red/green proof is the production
   helper's two-write sequence and delivery outcome, while the existing parent
   production-boundary assertions remain independently required.

The existing parent matrix, Atlas controls, source-work/review/delivery
ordering, three-terminal consumer check, 13-object/15-cable bar,
reopen-equality, and cleanup requirements remain binding. A fresh Reader must
reread this closure and return YES/YES before a Builder is authorized; no
Builder, rebuild, consumer launch, or R17 work is authorized before that
receipt.

Fresh Reader reread receipt: at pushed docs head
`e97613035545aa0fee307b33a77dc0e84d3b56cb`, this closure is **YES/YES**.
The Builder is authorized only for the exact critic-submit repair above; no
consumer launch or R17 work is authorized by this receipt.

### CRITIC SUBMIT VERIFIER RED — silent PTY write still reports delivery

The fresh independent Verifier stopped before running the matrix at immutable
product candidate `d77dfff0e027229ad19a5205802ae7374dae2c52`.
`submitAgentSessionInstruction()` rechecks the retained live-map entry before
and after each write, but `writeToSession()` still returns `void` and silently
returns when neither a data socket nor PTY session exists. A critic can
therefore retain the same live `sessionId` and `ptySessionId` while either
instruction write is dropped; the helper then resolves and the existing
delivery boundary records `delivered`. This is the Reader's named failed-write
condition, not a new product requirement. No Verifier matrix command, product
change, evidence commit, rebuild, consumer launch, or founder-state change
occurred.

The only authorized correction is finite:

1. In `collab-electron/src/main/pty.ts`, change the existing
   `writeToSession(sessionId, data)` result from `void` to `boolean` without
   changing its write routing. Return `true` when bytes are accepted by either
   the live non-destroyed data socket or the retained PTY session; return
   `false` only when neither target exists. A socket's native backpressure
   boolean is not a delivery failure and must not leak into this contract.
   Existing raw-terminal callers may continue to ignore the result.
2. In `submitAgentSessionInstruction()` only, require `true` from both the text
   write and the separate carriage-return write. A `false` result rejects the
   same one delivery attempt immediately. Preserve the captured PTY identity,
   400 ms settle, exact payloads, and every pre/post live-target check.
3. Extend the existing focused production-seam test so a retained unchanged
   live entry with a missing underlying PTY makes the helper reject for the
   first write, and separately for the carriage-return write. Neither case may
   reach a delivered receipt or downstream governed action. Restore the real
   write target and retain the existing exact two-write green assertion.
4. Add one temporary falsifier that makes the first or second production
   `writeToSession()` result `false` while leaving the live entry unchanged.
   `bun test collab-electron/src/main/governed-review.test.ts` must exit nonzero
   naming the rejected write; restore exact bytes, prove zero diff for the
   mutated path, and rerun to the native green count. The preceding missing-CR
   falsifier and full bounded matrix remain binding.

Allowed product/test paths for this correction are only
`collab-electron/src/main/pty.ts`,
`collab-electron/src/main/agent-host.ts`, and
`collab-electron/src/main/governed-review.test.ts`, plus generated Atlas
projections and the existing R16 BUILD-REPORT. `index.ts`, Kernel semantics,
timings, payloads, assertions, peer delivery, founder Submit, and all other
files are frozen. A fresh Reader must return YES/YES on this subsection before
one fresh Builder rework. No rebuild, consumer launch, or R17 work is
authorized before fresh independent PASS.

### CRITIC SUBMIT VERIFIER RED — Reader findings and binding closure

The fresh adversarial Reader checked the preceding red against the immediately
preceding binding closure and the current candidate code. The result is
**NO/NO**. Four finite proof defects remain:

1. **The requested falsifier cannot reach the named production return.**
   `governed-review.test.ts` mocks `./pty` before importing the production
   helper, so a temporary change to the real `pty.ts` `writeToSession()` body
   is bypassed by the focused command. The order does not name a mutation in
   the production helper or a controlled dependency seam that makes the
   imported production call return `false`. Plain meaning: the test can stay
   green while the real write-status check is broken.
2. **A false result has no exact rejection meaning.** Item 2 says the helper
   rejects, but names neither the first-write error nor the carriage-return
   error. Item 4 therefore cannot require a native red receipt that identifies
   which write was rejected. Plain meaning: two different failures could look
   like the same successful handoff or an uncheckable generic error.
3. **The two missing-PTY cases are not bound to the governed continuation.**
   Item 3 asks for a helper rejection, but does not require each case to run
   `kernelContinueGovernedResearchResult` and assert the exact failed delivery
   receipt, zero delivered receipts, and zero downstream invocation,
   Evaluation, or publication rows. A direct helper call could pass while the
   real continuation still records or permits downstream work. Plain meaning:
   the small test could pass even if the normal app still says the work was
   delivered.
4. **The test seam and restoration target have two meanings.** “Missing
   underlying PTY,” “restore the real write target,” and “the existing exact
   two-write green assertion” do not say whether the mocked hook returns
   `false`, whether the live entry must remain byte-identical, or which write
   count/payload is expected in each case. The current hook is typed as
   returning nothing, so the new boolean contract is otherwise untestable.
   Plain meaning: two competent Builders could build different red tests and
   both claim compliance.

This closure supersedes only the mechanics of the preceding verifier-red
subsection. Before a Builder door opens, the correction is bound exactly as
follows:

1. In `collab-electron/src/main/pty.ts`, `writeToSession(sessionId, data)`
   returns `boolean`. If `dataSockets.get(sessionId)` exists and is not
   destroyed, it calls `dataSock.write(data)` exactly as before and returns
   `true`, ignoring that socket API's backpressure boolean. Otherwise, if
   `sessions.get(sessionId)` exists, it calls `session.pty.write(data)` exactly
   as before and returns `true`. If neither target exists, it returns `false`.
   A write exception propagates; it is not converted into a success or a
   missing-target result. No routing, caller, or raw-terminal behavior changes.
2. In `submitAgentSessionInstruction()` only, capture the boolean from the
   first `writeToSession(capturedPtySessionId, text)` call and from the second
   `writeToSession(capturedPtySessionId, "\r")` call. Preserve the existing
   pre-write and post-write live-target checks, exact text payload, one
   400-ms wait, captured PTY id, and no-retry rule. After the post-write check,
   a false first result rejects with exactly
   `governed review critic instruction write was not accepted`; a false second
   result rejects with exactly
   `governed review critic submit write was not accepted`. A true result is
   required from both writes. These are delivery attempt errors, not new
   receipt kinds.
3. Make the existing `governed-review.test.ts` PTY mock an explicit boolean
   observation seam: its hook type returns `boolean`, the mock
   `writeToSession()` returns that hook result, defaulting to `true` when no
   hook is installed, and every hook that keeps the target stable returns
   `true` unless it is the named false-result case. The test must retain the
   production import of
   `submitAgentSessionInstruction`; it may control only this write
   observation/wait seam. A retained unchanged live entry is used in both red
   cases. “Missing underlying PTY” means the seam returns `false` while the
   exact live entry, `sessionId`, `kind`, and `ptySessionId` remain unchanged;
   the test must not delete or replace that entry for either case.
4. The same test must exercise each red case through a real production
   `kernelContinueGovernedResearchResult` continuation with only its delivery
   callback supplied. In the first case the text-write observation returns
   `false`; the second carriage-return write is not attempted. In the second
   case the text write returns `true` and the carriage-return observation
   returns `false`. Each continuation must reject with the exact error from
   item 2, produce exactly one `failed` initial delivery receipt and zero
   `delivered` initial delivery receipts, and leave
   `qf_review_invocation`, Evaluation, findings Artifact, and publication counts
   at zero for that review Task. Each red case uses one fresh isolated Kernel
   fixture, so the earlier green path cannot satisfy a red assertion. The test
   records the
   attempted payloads and
   proves the green path still has exactly two writes: the instruction with
   its one terminal `\r` removed, then exactly `"\r"` after the bounded wait.
   No test path may insert governed receipts, Evaluation, publication, or a
   fake PTY result directly as proof of submission. The existing changed-target
   and missing-live-entry red cases remain required.
5. The temporary boolean falsifier is exact and executable despite the PTY
   mock: in `agent-host.ts`, on the first green-path assignment only, change
   the production result expression from
   `const textAccepted = writeToSession(capturedPtySessionId, text)` to
   `const textAccepted = writeToSession(capturedPtySessionId, text) && false`.
   Run exactly `bun test collab-electron/src/main/governed-review.test.ts` and
   require a native nonzero exit whose output names
   `governed review critic instruction write was not accepted`. Restore the
   exact original expression, require zero diff for `agent-host.ts`, and rerun
   the same command to its native green count. This is one additional
   write-status falsifier; the preceding missing-carriage-return falsifier and
   the full bounded matrix remain binding. No `pty.ts` mutation is substituted
   for this falsifier, because the focused test mocks that module.

The allowed paths, parent matrix, Atlas controls, source-work/review/delivery
ordering, three-terminal consumer check, 13-object/15-cable bar,
reopen-equality, cleanup requirements, no-rebuild rule, and R17 closure remain
unchanged. A fresh Reader must reread this closure and return YES/YES before
one fresh Builder rework; no Builder, consumer launch, or R17 work is
authorized before that receipt.

Fresh Reader reread receipt: at pushed docs head `332970b0d8c04b41dad23adc64231c0b7f0a95fc`,
the appended binding closure is **YES/YES**. The Builder is authorized only
for the exact critic-submit write-status correction above; no rebuild, consumer
launch, or R17 work is authorized by this receipt.

Fresh Reader final reread receipt: at pushed docs head `3b8b9bb63762315234dff464b4004a9f5dbe772b`,
the corrected binding closure remains **YES/YES**. The Builder is authorized
only for the exact critic-submit write-status correction; no rebuild, consumer
launch, or R17 work is authorized.

Final Reader reread receipt: at pushed docs head
`a368eb5139784d66b82cbb12b0c72c3673362eb8`, the exact closure is **YES/YES**.
Builder authorization remains limited to the critic-submit write-status repair;
no rebuild, consumer launch, or R17 work is authorized.

### WRITE-STATUS MATRIX RED — stale app sole-writer test allowlist

The write-status candidate `e824ae10f50336a1640afeecd802ed7141bbeeb7`
passed its focused tests, both write-result falsifiers, the governed-review
gate, the ordinary Kernel sole-writer gate, Atlas currentness/ratchet, and all
other parent commands. The unchanged required command
`bun qa/run.ts kernel-sole-writer-app` exited `1` on four focused test files:

- `collab-electron/src/main/governed-review.test.ts` (`node:sqlite`)
- `collab-electron/src/main/native-tui-orchestration.test.ts` (`node:sqlite`)
- `collab-electron/src/main/ontology-gateway.test.ts` (`qf-kernel`)
- `collab-electron/src/main/precreated-native-tui.test.ts` (`node:sqlite`)

All four imports predate the write-status correction and exist only to build
isolated focused Kernel/Electron fixtures. None is an application runtime
writer. The gate's `KERNEL_ALLOWED` already exempts two focused test files
(`research-world.test.ts` and `task-steering.test.ts`) for this exact reason,
but its enumeration was not synchronized when these four tests landed. This
is a stale finite gate inventory, not authority to move a runtime write or
exempt a directory or pattern.

The only authorized correction is to add those four exact file strings to the
existing `KERNEL_ALLOWED` set in
`qa/gates/kernel-sole-writer-app.ts`, beside the existing focused-test entries,
with one comment stating they are isolated fixture/oracle tests and add no app
runtime writer. No wildcard, suffix rule, directory exception, SQL-pattern
change, scan-root change, or other allowlist entry is permitted.

The gate-only Builder runs `bun qa/run.ts kernel-sole-writer-app` and requires
native exit `0`. It then temporarily removes only the new
`governed-review.test.ts` entry, reruns the unchanged command, and requires
native nonzero naming exactly that file; it restores the gate byte-for-byte,
proves zero diff for the path, and reruns to native exit `0`. It finally reruns
the unchanged parent short matrix, Atlas currentness/ratchet, and both diff
checks. Any other red stops. The immutable product files at `e824ae10` remain
byte-identical; only this gate and existing R16 evidence may change.

A fresh Reader must return YES/YES before this one gate-only correction. A
fresh independent Verifier then owns the complete bounded matrix against
product candidate `e824ae10` plus the exact gate commit. No Electron rebuild,
consumer launch, founder-state change, or R17 work is authorized before PASS.

### WRITE-STATUS MATRIX READER CLOSURE — exact gate-only handoff

The preceding matrix had one factual defect and two underspecified receipts.
The factual defect was the claim that three focused test files were already
allowlisted; the live gate source has two. The underspecified receipts were
“existing R16 evidence,” “the unchanged parent short matrix,” and “both diff
checks.” A Builder could otherwise choose a different evidence path or command
set and still claim compliance.

The exact deliverables are now:

1. In `qa/gates/kernel-sole-writer-app.ts`, add exactly these four literal
   strings to `KERNEL_ALLOWED`, alongside the two existing focused-test
   entries:

   ```text
   collab-electron/src/main/governed-review.test.ts
   collab-electron/src/main/native-tui-orchestration.test.ts
   collab-electron/src/main/ontology-gateway.test.ts
   collab-electron/src/main/precreated-native-tui.test.ts
   ```

   Use one adjacent comment with exactly this meaning: these are isolated
   fixture/oracle tests and add no application runtime writer. No wildcard,
   suffix rule, directory exception, SQL-pattern change, scan-root change, or
   other allowlist entry is permitted.
2. In `docs/orders/evidence/r16/BUILD-REPORT.md`, record the gate-only
   command, its falsifier, restoration hash/zero-diff receipt, and restored
   green command. No other evidence file is in scope.

The gate-only Builder's acceptance sequence is exact:

1. Run `bun qa/run.ts kernel-sole-writer-app`; native exit `0` is required.
2. Remove only the new `governed-review.test.ts` literal from the candidate
   gate file. Run the same command; native nonzero is required and its output
   must name exactly
   `collab-electron/src/main/governed-review.test.ts (node:sqlite)`.
3. Restore the candidate gate bytes exactly, prove the restored file hash
   equals the pre-falsifier candidate hash, and run the same command to native
   exit `0`.
4. Run the unchanged parent short matrix in this order: the commands at
   lines 504–519 of this file, including its own `kernel-sole-writer-app`
   invocation. Its three `bun test` commands require native `N pass / 0 fail`
   with `N > 0`; each `qa/run.ts` gate must print `PASS`; both `git diff
   --check` commands must exit `0`. Retain unedited output for each command.
5. Run the exact Atlas currentness/ratchet pair
   `bun qf-atlas/generate.mjs --check` and `bun qf-atlas/ratchet.mjs`, then the
   two exact diff checks `git diff --check` and
   `git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD`; every
   command must exit `0`.

Every acceptance gate can fail: the allowlist gate has the governed-review
entry-removal falsifier; the inherited test/gate commands fail on a red test,
missing `PASS`, or nonzero exit; Atlas fails on stale or regressed projections;
and either diff check fails on whitespace errors. Every deliverable has one
meaning: one finite four-file allowlist correction and one named R16 evidence
file, with no product, test, generated-Atlas, consumer, or R17 change.

Fresh adversarial Reader result for this exact closure: **YES/YES**. The
gate-only Builder is authorized for the two deliverables and acceptance
sequence above. No product edit, test edit, build, launch, founder-state
change, or R17 work is authorized.

### NORMAL REOPEN RED — governed-review support tables misclassified as objects

Independent verification passed at immutable product candidate
`e824ae10f50336a1640afeecd802ed7141bbeeb7`, exact gate candidate
`ed9de40fc801340aa5a299821c3b322183a547f3`, and evidence commit
`4cde791f5b02d06b030624860da4d85cd590dce5`. The Router then performed the one
authorized build, starting `2026-08-22T11:02:02.4840960Z`, with exact product
identity `e824ae10`; Main, preload, and renderer completed, their output
products postdated the start, and the Main bundle contained that exact identity.

The first ordinary normal launch produced no window. Writable `attachKernel()`
threw `KernelRegistryDriftError` with `missing=[]`, `retired=[]`, and
`inconsistent=[qf_review_attempt,qf_review_invocation,qf_review_publication,
qf_review_receipt,qf_review_source_work,qf_review_task]`. The launched PID tree
was then cleaned to `launched_processes_remaining=0`. The founder database was
measured read-only only: `schema_meta=84`; the six exact tables exist; current
row counts are source-work `1`, review-task `1`, invocation `0`, attempt `1`,
receipt `1`, publication `0`.

Root cause is bounded. `ensureGovernedReviewSchema()` explicitly creates these
six durable R15 support tables and states they are Kernel tables, not ontology
object types. `detectObjectTypeRegistryDrift()` currently exempts only
`events`, `links`, `schema_meta`, and `sqlite_sequence`, so a fresh process can
create the support tables after its initial attach and then fail its next
attach because those non-object tables lack `schema_meta kind='object'` rows.
The app must preserve them, not register them as ontology objects and not drop
or recreate founder state.

The only authorized repair is:

1. Add the six exact governed-review table names above to the finite
   `INFRA_TABLES` set in `packages/qf-kernel/src/registry-drift.ts`, with a
   comment that they are R15 durable support tables rather than ontology object
   types. No prefix/wildcard exemption and no other table is allowed.
2. Extend `packages/qf-kernel/src/registry-drift.test.ts` to prove all six exact
   names are ignored as infrastructure while a seventh ordinary orphan table
   remains `inconsistent`.
3. Extend `packages/qf-kernel/src/attach-kernel-drift.test.ts` with the exact
   process-lifecycle regression: attach a fresh isolated writable Kernel,
   create the six tables through real `ensureGovernedReviewSchema()`, close it,
   reopen the same file through writable `attachKernel()`, and require no drift
   plus byte-preserved review rows. No direct founder DB, copied detector, or
   manual `schema_meta` insertion is proof.
4. Falsify by temporarily removing only `qf_review_task` from `INFRA_TABLES`.
   The unchanged attach regression must exit nonzero naming
   `qf_review_task`; restore exact bytes, prove zero diff for the mutated path,
   and rerun to native green. Then run the existing registry/attach tests,
   R15 governed-review tests, the complete bounded R16 parent matrix, Atlas
   currentness/ratchet, and both diff checks. Any other red stops.

Allowed product/test paths are only the three files named above, generated
Atlas projections, and existing R16 BUILD-REPORT. Upgrade classification,
schema authority, review semantics, founder data, and every other product/gate
file are frozen. The spent `e824ae10` build is a recorded diagnostic. After a
fresh Reader YES/YES, Builder repair, and independent PASS, exactly one new
actual build is authorized for the still-required two-launch Computer consumer
check. No consumer launch or R17 work is authorized before that PASS.

### NORMAL REOPEN READER DEFECT CLOSURE — exact lifecycle fixture and matrix

The preceding subsection had four finite order defects. “Existing registry/attach
tests,” “complete bounded R16 parent matrix,” and “byte-preserved review rows”
were not executable meanings, and the report receipt did not bind one exact
command/output row per required check. The following closure supersedes only
those mechanics; the six-table infrastructure boundary and every product,
schema, founder-database, build, consumer, and R17 prohibition remain unchanged.

Plain meaning: the repair must prove that all six review-support tables survive
a real close-and-reopen, while an unrelated table still fails the drift check,
and the Builder must show every red and restored-green result in one receipt.

#### Exact deliverables

1. In `packages/qf-kernel/src/registry-drift.ts`, add exactly these six table
   names to the existing finite `INFRA_TABLES` set:

   ```text
   qf_review_source_work
   qf_review_task
   qf_review_invocation
   qf_review_attempt
   qf_review_receipt
   qf_review_publication
   ```

   Keep the set finite. Add this exact adjacent comment:
   `// R15 durable governed-review support tables, not ontology object types.`
   No prefix, wildcard, substring, schema-meta insertion, or other exemption
   is a valid implementation.

2. In `packages/qf-kernel/src/registry-drift.test.ts`, append one runtime test
   named `ignores exactly six governed-review support tables but rejects a
   seventh orphan`. It supplies all six exact names plus one seventh table
   named `qf_review_orphan`. It must require `{ ok: false }`, empty `missing`
   and `retired`, and `inconsistent === ["qf_review_orphan"]`. Thus omission
   of any one allowed name or a broad `qf_review_*` exemption is red. The
   existing tests remain unchanged.

3. In `packages/qf-kernel/src/attach-kernel-drift.test.ts`, append one runtime
   lifecycle test named `reopens governed-review schema with support rows
   intact`, with this exact sequence:

   - create one file-backed isolated path under the test's existing temporary
     directory helper and open it with the real writable `openKernel(path,
     { create: true })`;
   - call the real exported `ensureGovernedReviewSchema(db)` exactly once;
   - insert exactly one deterministic non-empty fixture row into each of the
     six support tables, using only the table columns created by that real
     schema function. Every row uses the exact timestamp
     `2026-08-22T00:00:00.000Z` and the exact source-work JSON
     `{"source_task_id":"source-task","hypothesis_id":"hypothesis","run_id":"run","result_artifact_id":"result-artifact","executor_session_id":"executor"}`.
     The six exact row tuples, in table/column order, are:

     ```text
     qf_review_source_work:
       (source-task, SOURCE_WORK, 2026-08-22T00:00:00.000Z)
     qf_review_task:
       (review-task, review, source-task, SOURCE_WORK, critic, critic,
        attempt-1, NULL, pending, NULL, 2026-08-22T00:00:00.000Z)
     qf_review_invocation:
       (invocation-1, critic, review-task, qf_hypothesis_get,
        {"id":"hypothesis"}, {"ok":true}, 1, 1,
        2026-08-22T00:00:00.000Z)
     qf_review_attempt:
       (request_review, source-task, SOURCE_WORK, NULL, attempt-1, admitted,
        {"kind":"admitted","attempt_id":"attempt-1"},
        2026-08-22T00:00:00.000Z)
     qf_review_receipt:
       (receipt-1, delivery_receipt, review-task,
        {"outcome":"delivered","task_id":"review-task"},
        2026-08-22T00:00:00.000Z)
     qf_review_publication:
       (source-task\0hypothesis\0run\0result-artifact\0executor,
        report-artifact, evaluation, 2026-08-22T00:00:00.000Z)
     ```

     Here `SOURCE_WORK` is the exact JSON string above, JSON values are stored
     without whitespace, and `NULL` is SQL NULL. Direct fixture-row insertion
     is allowed only for these six support tables; no `schema_meta` row or
     ontology row may be inserted by hand.
   - snapshot each table's complete ordered row set with `SELECT * ... ORDER BY
     rowid`, close the first handle with the real `closeKernel`, reopen the same
     path with writable `openKernel(path)`, and require no throw and no
     `getKernelDrift` report;
   - snapshot the same six ordered row sets again and require byte-for-byte
     equality with the first snapshots. The test must name the six tables from
     one literal list and may use identifier interpolation only from that list.

   The test is red if `ensureGovernedReviewSchema` is skipped, any row differs
   from these exact tuples, the second open
   uses a different path or a copied detector, any support table is missing,
   any row changes, or registry drift is reported. It must not open the founder
   database.

4. The falsifier is one temporary source mutation only: remove the literal
   `qf_review_task` entry from `INFRA_TABLES`, leaving the test and all other
   files byte-identical. Run the unchanged attach test; native nonzero output
   must name `qf_review_task` in the `KernelRegistryDriftError`. Restore the
   exact candidate bytes, require zero diff for
   `packages/qf-kernel/src/registry-drift.ts`, and rerun the same test to its
   native green count. A green mutation run is an acceptance failure.

#### Exact acceptance commands and receipts

The focused commands, in this order, are exactly:

```text
bun test packages/qf-kernel/src/registry-drift.test.ts
bun test packages/qf-kernel/src/attach-kernel-drift.test.ts
bun test packages/qf-kernel/src/r15-governed-review.test.ts
```

The first two must report `7 pass / 0 fail` and `6 pass / 0 fail`
respectively. The R15 command must report a native `N pass / 0 fail` with
`N > 0`. Any other count or native nonzero exit is red.

The complete bounded R16 parent matrix is this exact list, with no wrapper,
retry, substitution, or omission:

```text
bun test collab-electron/src/main/governed-review.test.ts
bun test collab-electron/src/main/research-world.test.ts
bun test collab-electron/src/windows/shell/src/research-world.test.ts
bun test collab-electron/src/windows/shell/src/task-composition.test.ts
bun test collab-electron/src/main/native-tui-orchestration.test.ts
bun test collab-electron/src/main/precreated-native-tui.test.ts
bun test packages/qf-kernel/src/r15-governed-review.test.ts
bun test packages/qf-kernel/src/r16-visible-world.test.ts
bun test qa/gates/governed-review.test.ts
bun test qa/gates/research-world-visible.test.ts
bun qa/run.ts kernel-sole-writer
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
```

The first ten commands must each print native `N pass / 0 fail` with `N > 0`
and exit zero. The named static gate must print `PASS`; the remaining commands
must exit zero. The Builder and independent Verifier retain one unedited output
row for every invocation above. The R15 focused command is run once before the
parent matrix, and the parent matrix runs its separately listed R15 command
once; both rows are retained.

The Builder report is exactly
`docs/orders/evidence/r16/BUILD-REPORT.md`. It contains, in command order, one
row for each focused command, one row for each parent-matrix command, the Atlas
outputs, both diff checks, the mutation's native red output and named error,
the restoration-zero-diff hash, and the restored-green output. It also records
the immutable candidate SHA, changed paths, and clean status. No other evidence
file or product/test path is authorized by this closure; no build or launch is
authorized before independent PASS.

Every acceptance gate can fail: the registry test fails when an exact support
name is omitted or an orphan is exempted; the attach test fails when the real
schema creation, same-path reopen, row preservation, or drift-free result is
broken; the falsifier must fail on the removed `qf_review_task` exemption; the
R15 and parent commands fail on any regression or missing PASS; Atlas fails on
stale or regressed projections; and `git diff --check` fails on whitespace.
Every deliverable has exactly one meaning: one finite six-name infrastructure
allowlist, one runtime registry regression, one same-file support-row reopen
regression, one executable falsifier, and one named evidence report. No
product semantics, schema authority, founder state, build, consumer launch,
or R17 work is implied.

A fresh Reader must reread the original subsection and this closure and answer
the two protocol questions exactly. Only final YES/YES opens the bounded
Builder door; until then this Reader makes no product/test edit, gate run,
build, launch, founder-database access, or R17 change.

## NORMAL CONSUMER RED — shared result Artifact leaks historical Missions

### Measured defect

The independently verified candidate and its governed-review reopen repair were
built once as the normal founder application. The visible masthead was exact
product SHA `5445578508e3b76f107e5c3ed40eafefd0e18319`. Computer Use started one
guided Mission, which completed a real Director → executor → independent critic
flow and published a Report. The exact Mission is
`mission-235c12f6-459d-4f45-9094-8adba252e839`.

The consumer then clicked that Mission's exact accessible button
`Show research world mission mission-235c12f6-459d-4f45-9094-8adba252e839`.
The normal projection did not yield the promised Mission-local 13-object,
15-cable desk. Because this Run and older guided Runs reuse the same immutable
result Artifact, the undirected closure in
`collab-electron/src/main/research-world-projection.ts` crossed the shared
Artifact's unrelated `produces` and `evaluated_by` edges into earlier Missions,
Tasks, Runs, Evaluations, Reports, and sessions. The visible canvas/navigator
contained 52 tiles. Repeated ordinary pointer activation could not isolate the
current world. This is a product red, not a consumer-tooling red: one Mission
does not reveal one understandable research world.

The same consumer run proved the repaired critic submission path: review Task
`review-task-e5eaca15-a692-4e70-8717-12ff79b2538c` completed after six governed
invocations, Evaluation `b48d228a-f15a-4c1c-ad9f-6bf713595a0e` was recorded,
and Report `7b546d5f84717b2429e52bfa3151fe249657746c782350e2d9ce50502ab88539`
was published. Standalone normal Hermes Director, worker, and critic terminals
also accepted visible harmless text, erased it with `Ctrl+U`, and returned
focus to the canvas without submission. Those are progress receipts, not a
consumer PASS. The exact order canary must still be repeated on the final
candidate as `qf-r16-typing-check-<candidate7>`.

### Authorized correction

This is one bounded R16 product-fix lap. No R17 work, new ontology type, new
durable table, fixture seed, proof bridge, package gate, installer gate,
release gate, worktree, clone, or second checkout is authorized.

1. Replace the broad undirected connected-component walk with a Mission/source-
   Task-local projection. For an eligible Mission or source Task, select only
   the exact root Mission, source Task, its one R15 source-work Hypothesis, Run,
   result Artifact, Dataset, executor, the one governed review Task for that
   source work, its one Evaluation, findings Artifact, published Report,
   Director, and critic. Emit only the 15 semantic links among those selected
   objects. Reuse of the same Dataset or result Artifact by any unrelated Run,
   Evaluation, Task, or Mission must not import that unrelated world.
2. Preserve every existing missing-lineage and ineligibility meaning. Multiple
   source Tasks for one Mission, duplicate source-work bindings, absent review
   completion, rejected/inconclusive publication behavior, Task-root behavior,
   Artifact receipt integrity, exact displayed fields, and the existing
   isolated 13/15 case must retain their current assertions.
3. Add a real relational regression to
   `collab-electron/src/main/research-world.test.ts`: create an older decoy
   Mission with its own source Task, Hypothesis, Run, review Task, Evaluation,
   Report, Director, executor, and critic, but deliberately reuse the target
   world's exact Dataset and result Artifact. Project the target Mission and
   require exactly its 13 objects and 15 links; require every decoy-only id
   absent. Then project the decoy Mission and require its own exact 13/15 world
   with every target-only id absent. The test is red against the current broad
   closure and green only when root isolation is real.
4. Add no heuristic based on timestamps, id prefixes, canvas state, current
   session state, or object count. The boundary is the selected source-work and
   governed-review identities already held by the Kernel.

Allowed Builder paths are exactly:

```text
collab-electron/src/main/research-world-projection.ts
collab-electron/src/main/research-world.test.ts
docs/orders/evidence/r16/BUILD-REPORT.md
qf-atlas/atlas.json
qf-atlas/atlas.md
qf-atlas/atlas.html
```

The focused acceptance command is:

```text
bun test collab-electron/src/main/research-world.test.ts
```

It must print native `N pass / 0 fail`, `N > 0`, and include the two-direction
shared-Artifact isolation regression. The Builder then runs the unchanged R16
parent matrix already listed in this order, Atlas current/ratchet, and both
diff checks. One executable falsifier temporarily restores the current broad
reverse traversal across a selected shared Artifact; the new regression must
exit nonzero and name a decoy-only id or wrong object/link count. Restore exact
candidate bytes, require zero diff for the product file, and rerun focused
green. Every command row and falsifier/restoration receipt is appended to the
existing `BUILD-REPORT.md`.

A fresh independent Verifier freezes the product SHA, reruns the focused test,
the complete unchanged parent matrix, the executable shared-Artifact
falsifier/restoration, Atlas, and both diff checks, and appends its receipt to
`docs/orders/evidence/r16/VERIFICATION.md` only on full PASS. Product and test
bytes must remain unchanged during verification.

After independent PASS, the Router performs one replacement exact build and a
normal two-launch Computer Use check. It runs exactly one guided Mission total
for that replacement check, clicks the exact Mission-local reveal, observes
exactly 13 world members and 15 cables with no historical Mission member,
clicks Inspect then Collapse on all ten research-object tiles, repeats exact
`qf-r16-typing-check-<candidate7>` typing/erase/mouse-return on normal Hermes
Director, worker, and critic terminals without Enter, closes normally, reopens
without creating a Mission, and proves the same Mission-local objects, links,
positions, and inspector booleans. Ordinary close must leave zero owned Windows
and WSL product processes. Any extra historical object/cable, missing pointer
control, wrong canary, submission, reopen delta, or cleanup residue is red.

Every gate can fail: the shared-Artifact regression fails on current bytes in
both root directions; the falsifier must reintroduce leakage; existing tests
retain prior lineage and receipt reds; Atlas and diff checks retain their
native failure meanings; the normal consumer check fails on any visible extra
world member. Every deliverable has one meaning: root-local identity selection,
one two-direction collision regression, one executable regression falsifier,
one independent PASS, and one normal consumer PASS. A fresh Reader must answer
exactly: can each gate actually fail, and does each deliverable have exactly
one meaning. Only final YES/YES opens the Builder door.

### NORMAL CONSUMER READER DEFECT CLOSURE — executable collision falsifier and exact consumer receipt

The preceding subsection had finite Reader defects: `candidate7` was not
defined; the shared-Artifact falsifier did not bind a source mutation, command,
or restoration proof; the decoy fixture did not require the two shared
identities or an exact Kernel-action construction; “parent matrix” and “both
diff checks” could refer to multiple earlier lists; the replacement build had
no exact command; the normal consumer check had no named receipt or exact
13-object/15-link manifest; and the focused test did not protect its three
existing assertions from deletion or replacement. This closure supersedes only
those mechanics. It does not widen product scope, alter the ontology, permit a
durable fixture, or authorize a consumer launch before independent PASS.

Plain meaning: the repair must isolate two real Missions that share data, prove
the old leakage comes back when the repair is removed, and leave a receipt that
shows the exact world Ryan saw after reopening it.

#### Exact Builder and test contract

The Builder starts from clean product base
`5445578508e3b76f107e5c3ed40eafefd0e18319` plus this docs-only Reader closure.
The in-memory relational fixture below is allowed; no durable seed, founder
database, proof bridge, or product fixture is allowed.

1. Append exactly one test to
   `collab-electron/src/main/research-world.test.ts`, named
   `isolates two Missions that share Dataset and result Artifact in both root directions`.
   The three existing tests and all their assertions remain present and
   unchanged. The new test uses the real Kernel actions and existing governed
   helpers, not direct ontology/link insertion: create an older decoy Mission
   and a complete decoy source Task/Hypothesis/Run/review Task/Evaluation/
   findings Artifact/Report/Director/executor/critic, then a complete target
   Mission with its own corresponding objects. Use the same Dataset and the
   same deterministic strategy and parameters so both Runs produce the exact
   same result Artifact. Bind each source Task through the real R15 source-work
   path and complete each governed review through the existing admission,
   delivery, receipt, and evaluation paths.
2. The test must assert the target and decoy Dataset ids are equal and their
   result Artifact ids are equal, while every other named object id is
   distinct. It must project each root in turn, require exactly 13 objects and
   exactly 15 links, require the exact 15 expected `(kind, from_id, to_id)`
   triples for that root, and require every decoy-only id absent from the
   target projection and every target-only id absent from the decoy projection.
   Existing missing-lineage, duplicate-binding, ineligible-publication,
   Task-root, receipt, displayed-field, and isolated 13/15 assertions remain
   covered by the unchanged parent tests.
3. The focused command is exactly:

   ```text
   bun test collab-electron/src/main/research-world.test.ts
   ```

   It must report exactly `4 pass / 0 fail`: the three existing tests plus the
   one two-direction shared-identity test. Any other count or native nonzero
   exit is red.

#### Exact matrix and falsifier

“The unchanged R16 parent matrix” means only the 15-command fenced block under
`NORMAL REOPEN READER DEFECT CLOSURE — exact lifecycle fixture and matrix`,
starting with `bun test collab-electron/src/main/governed-review.test.ts` and
ending with `git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD`.
The Builder and Verifier each run those 15 rows once, in that order, with no
wrapper, retry, substitution, or omission. The Atlas current/ratchet checks and
the two `git diff --check` rows are already those matrix rows; “both diff
checks” means exactly those two rows, not an earlier matrix or a second run.

The executable falsifier is exact. After the candidate commit, record the
candidate SHA and the SHA-256 of both allowed product/test files. Temporarily
replace only
`collab-electron/src/main/research-world-projection.ts` with that file's bytes
from candidate base `5445578508e3b76f107e5c3ed40eafefd0e18319`; leave the new
test and every other path byte-identical. Run the focused command above. The
native exit must be nonzero and its output must name a decoy-only id or a wrong
object/link count. A green mutation run is an acceptance failure. Restore the
candidate's exact projection bytes, require zero diff for the projection and
zero diff for the test, rerun the focused command to exactly `4 pass / 0 fail`,
and retain the mutation exit, restoration hashes, and restored-green output in
`docs/orders/evidence/r16/BUILD-REPORT.md`. The Verifier repeats this same
mutation and restoration against the frozen candidate; product and test bytes
are unchanged during its normal matrix.

#### Exact build, consumer gate, and meanings

After independent PASS, the Router runs exactly one replacement build with:

```text
bun run --cwd collab-electron build
```

The receipt records the build start time and native exit; stdout must include
the invoked `electron-vite build` plus successful Main, preload, and renderer
completion. The three corresponding `collab-electron/out` products must
postdate the start, and the Main bundle must contain the full immutable
candidate SHA. Bun usage/help or unchanged outputs is red. Define
`candidate7` as the first seven lowercase hexadecimal characters of that full
candidate SHA, so the only terminal canary is exactly
`qf-r16-typing-check-<candidate7>`.

The Router writes exactly one normal consumer receipt to
`docs/orders/evidence/r16/CONSUMER-CHECK.md`. It records the measured candidate
and visible identity, the exact build command and output, the normal non-proof
two-launch mode, the exact 13 visible `(type, id)` members, all 15 visible
`(kind, from_id, to_id)` cables, ten real-mouse Inspect/Collapse receipts, the
three Director/executor/critic canary type/erase/mouse-return receipts with no
Enter or submission, first/second-launch equality of objects, links, positions,
and inspector booleans, and zero owned Windows and WSL product processes after
close. The visible manifest must equal the Kernel projection's exact 13/15
manifest; counts alone do not pass. The check uses normal founder state without
reading or changing credentials, seeding SQLite, calling the proof bridge, or
creating a Mission on reopen. Any extra or wrong member/cable, wrong canary,
submission, reopen delta, stale build, or cleanup residue is red.

The deliverables therefore have one meaning each: one Mission-local selector,
one two-direction shared-identity regression, one exact executable falsifier,
one immutable independent-verification receipt, and one exact normal-consumer
receipt. A fresh Reader must reread the final subsection and this closure and
answer exactly the two protocol questions. Only final YES/YES opens the
bounded Builder door.

## NORMAL CONSUMER RED — governed critic cannot inspect result Artifact bytes

The immutable shared-world candidate
`7dda122435dce47adbc650e5d5b9d933db249263` passed its fresh independent
Verifier at evidence commit `eaa3dee652e30ca27aad555efba88a34a2dc050f`.
The Router built that exact candidate once with the valid command and used the
normal application through Computer Use. The startup compatibility repair,
mouse interaction, three normal Hermes terminal canaries, deterministic Run,
governed review admission, broker read sequence, rejection enforcement, and
ordinary shutdown all worked. The exact RED receipt is
`docs/orders/evidence/r16/CONSUMER-CHECK.md`.

The consumer check exposed one later product defect. Governed critic
`e213c9db-fe51-4b89-8286-b1a2ba468233` called the required
`qf_hypothesis_get`, `qf_run_get`, and `qf_artifact_get` tools. The Artifact
read returned only its Kernel row metadata. It did not return the hash-verified
immutable JSON payload already exposed by R16's existing `artifactReceipt()`
projection boundary. The stored result Artifact contains ROI `1.000000` and
net profit `100.000000`, but the critic could not inspect those facts. It
honestly recorded Evaluation `36fa58e5-6fc5-498a-823a-b19207d1c09e` as
`rejects`, so publication was correctly blocked. The source Task projection is
therefore exactly 12 objects/14 links: the intended positive 13/15 world minus
the Report and its publication link.

This section supersedes only the next repair and replacement-consumer
mechanics. Every ontology, 13-object/15-cable, pointer interaction, terminal
typing, reopen, and cleanup assertion remains unchanged. A positive verdict may
not be manufactured, the critic may not receive filesystem/path access, and
publication gating may not be weakened.

### Bounded product repair

Repair only the governed Artifact read boundary:

1. Export and reuse the existing R16 `artifactReceipt()` implementation from
   `collab-electron/src/main/research-world-projection.ts`. Do not create a
   second byte reader or a second receipt meaning.
2. For an admitted governed critic's exact `qf_artifact_get` call,
   `callOntologyReadTool()` must return the safe Artifact metadata (`id`,
   `created_at`, `kind`, and `content_hash`) plus a `receipt` produced by that
   shared implementation; it must omit `storage_ref`. The same enriched result
   must be recorded in `qf_review_invocation`; the critic's review trajectory
   and the later audit must observe identical evidence.
3. The receipt retains the already-accepted R16 meanings: it verifies the
   content hash before exposing a bounded UTF-8 preview; missing, tampered,
   oversized, or invalid-UTF-8 content exposes no unverified bytes and retains
   its exact unavailable/failure receipt. No raw path or credential is exposed.
4. Non-Artifact reads and non-governed callers retain their current behavior.
   Task, Evaluation, publication, ontology, and Kernel write semantics do not
   change.

Allowed Builder paths are exactly:

```text
collab-electron/src/main/research-world-projection.ts
collab-electron/src/main/ontology-gateway.ts
collab-electron/src/main/ontology-gateway.test.ts
collab-electron/src/main/governed-review.test.ts
docs/orders/evidence/r16/BUILD-REPORT.md
qf-atlas/atlas.json
qf-atlas/atlas.md
qf-atlas/atlas.html
```

`governed-review.test.ts` may change only if the existing focused gateway seam
cannot prove that the exact enriched result is durably recorded. No other
product, test, order, evidence, founder-state, build-output, package, or R17
path is authorized.

### Exact acceptance and falsifier

Run these commands once each, in order, with native exits:

```text
bun test collab-electron/src/main/ontology-gateway.test.ts
bun test collab-electron/src/main/research-world.test.ts
bun test collab-electron/src/main/governed-review.test.ts
bun qa/run.ts kernel-sole-writer-app
bun qf-atlas/generate.mjs
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
```

All native exits must be zero. The focused gateway test must prove all of the
following with explicit assertions:

- a hash-valid small JSON Artifact gives an admitted governed critic the exact
  verified receipt preview;
- the corresponding `qf_review_invocation.result` is exactly that enriched
  result, not the old metadata-only row;
- missing, tampered, oversized, and invalid-UTF-8 Artifact bytes never surface
  unverified payload content and retain the shared R16 receipt meanings; and
- the Hypothesis and Run governed reads and a non-governed Artifact read remain
  unchanged.

The executable falsifier is exact. After committing the candidate and recording
the SHA-256 hashes of the three allowed product/test files, temporarily replace
only `collab-electron/src/main/ontology-gateway.ts` with that file's bytes from
base `7dda122435dce47adbc650e5d5b9d933db249263`. Run only:

```text
bun test collab-electron/src/main/ontology-gateway.test.ts
```

It must exit nonzero and name the absent Artifact receipt or unequal recorded
broker result. Restore the exact candidate file, require zero diff for all
three product/test paths against the candidate, and rerun the focused gateway
test green. A green mutation run, a test-count reduction, an assertion change,
or any unverified payload exposure is red.

A fresh independent Verifier freezes the product candidate, reruns the exact
nine-command matrix and falsifier/restoration, and writes a PASS only if
product/test bytes remain unchanged. Atlas must remain current with HARD RED 0.
No build or normal application launch occurs before that PASS.

### Replacement normal consumer check

After independent PASS, the Router performs exactly one fresh build with
`bun run --cwd collab-electron build`, verifies the output identity, and runs a
fresh normal two-launch Computer Use check. The failed `7dda122` build and
consumer attempt do not count as either launch for the replacement candidate.

The first launch creates exactly one guided Mission total. The real critic must
use the three governed reads and its Artifact read must visibly contain the
same verified payload/preview recorded in its broker receipt. For the guided
settled-results sample, its rationale must be grounded in the actual metrics.
If that real critic still rejects or is inconclusive after seeing the exact
payload, stop and record its reason—do not override it. A supporting Evaluation
must publish through the unchanged gate and reveal the exact Mission-local
13-object/15-cable world. The existing ten pointer Inspect/Collapse receipts,
three terminal canaries, no-submission rule, close/reopen equality, and zero
Windows/WSL cleanup bar remain exact.

Every gate can fail: the focused test fails on absent or dishonest receipt
content, the base-file falsifier must restore the metadata-only defect, the
unchanged world/review tests retain their native reds, Atlas/diff checks retain
their native failure meanings, and the real consumer check fails on an
unsupported verdict, absent Report, wrong world, reopen delta, or cleanup
residue. Every deliverable has one meaning: one shared verified Artifact
receipt, one governed critic response and identical broker record, one bounded
falsifier/restoration, one independent PASS, and one replacement consumer PASS.
A fresh Reader must answer exactly: can each acceptance gate actually fail,
and does each deliverable have exactly one meaning. Only final YES/YES opens
this bounded Builder door.

### GOVERNED ARTIFACT READ READER DEFECT CLOSURE — immutable verification and exact consumer evidence

The fresh adversarial Reader task
`01a02976-5b02-7961-9329-bd3d8b151fb6` answered `NO/NO` at inspected docs
head `62160083480ad494f1335b654713b628f21970e7`. It found six finite order
defects: the Builder's mutating Atlas generation was also assigned to the
immutable Verifier; the required Atlas base diff was absent; the falsifier
counted three product/test files although the optional test makes four; the
focused test could replace existing assertions or derive its expected result
from the production helper; build identity was not finite; and the replacement
consumer proof did not bind a durable receipt, exact evidence equality, or the
single real critic verdict. This closure supersedes only those mechanics.

#### Preserved tests and independent expected values

The five existing test blocks and every assertion inside them in
`collab-electron/src/main/ontology-gateway.test.ts` remain textually unchanged;
the file changes only by appending exactly one test named:

```text
an admitted governed critic receives and records the verified Artifact receipt
```

The focused command must report exactly `6 pass / 0 fail`. The new test invokes
the production gateway and real governed-review persistence. It must not import
or call `artifactReceipt()` to compute its oracle. Its expected values are
literal fixture values independently fixed in the test: exact Artifact id,
kind, content hash, `durable_bytes_available`, and JSON preview; exact
unavailable meanings for missing, tampered, oversized, and invalid-UTF-8
fixtures. It deep-compares the governed Artifact gateway result and the parsed
`qf_review_invocation.result` to the same literal expected enriched result.
It separately proves the Hypothesis/Run reads and a non-governed Artifact read
retain their pre-repair exact shapes. No returned or recorded result may expose
`storage_ref`, a filesystem path, credential, or unverified payload bytes; this
last prohibition applies to the governed Artifact result, while the separately
asserted non-governed result remains unchanged.

#### Exact Builder and Verifier matrices

The Builder runs exactly these ten commands in order:

```text
bun test collab-electron/src/main/ontology-gateway.test.ts
bun test collab-electron/src/main/research-world.test.ts
bun test collab-electron/src/main/governed-review.test.ts
bun qa/run.ts kernel-sole-writer-app
bun qf-atlas/generate.mjs
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930
git diff --check
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
```

The Builder records the Atlas base-diff classification in `BUILD-REPORT.md`.
Any HARD RED, unexplained coverage, undecided finding without blocker, stale
generated Atlas, or native nonzero exit is red.

The immutable Verifier runs exactly these nine commands in order:

```text
bun test collab-electron/src/main/ontology-gateway.test.ts
bun test collab-electron/src/main/research-world.test.ts
bun test collab-electron/src/main/governed-review.test.ts
bun qa/run.ts kernel-sole-writer-app
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qf-atlas/generate.mjs --diff fef713c06f091dc8df13f7bde07be859d3b04930
git diff --check
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
```

The Verifier never runs mutating `bun qf-atlas/generate.mjs`, edits the
candidate, or commits product/generated-Atlas bytes. Its only permitted write
after every measurement and restoration check is green is the R16 verification
evidence append.

Before mutation, both Builder and Verifier record SHA-256 hashes for exactly
these four paths, whether changed or unchanged:

```text
collab-electron/src/main/research-world-projection.ts
collab-electron/src/main/ontology-gateway.ts
collab-electron/src/main/ontology-gateway.test.ts
collab-electron/src/main/governed-review.test.ts
```

The falsifier still replaces only `ontology-gateway.ts` with its exact
`7dda122435dce47adbc650e5d5b9d933db249263` bytes and requires the focused
gateway test to fail. After restoration, all four hashes must exactly equal
their frozen candidate hashes, all four paths must have zero diff against the
candidate, and the focused command must return exactly `6 pass / 0 fail`.

#### Exact replacement build and consumer receipt

The replacement build receipt records the full immutable candidate SHA, build
start time, native exit, the invoked `electron-vite build` output, successful
Main/preload/renderer completion, post-start mtimes for their corresponding
`collab-electron/out` products, and the full candidate SHA in the Main bundle.
Bun usage/help, missing phase output, unchanged/pre-start products, or a stale
bundle identity is red.

The Router appends exactly one `Attempt 2` section to
`docs/orders/evidence/r16/CONSUMER-CHECK.md`; it preserves Attempt 1 byte for
byte. Attempt 2 records:

1. candidate/build identity and the exact normal two-launch commands;
2. the exact `qf_hypothesis_get`, `qf_run_get`, and `qf_artifact_get` results
   returned to the sole admitted critic, plus the corresponding three
   `qf_review_invocation.result` values; each returned/recorded pair must be
   structurally identical;
3. independently parsed result-receipt JSON with
   `metrics.roi === "1.000000"`,
   `metrics.net_profit === "100.000000"`,
   `metrics.hit_rate === "1.000000"`, and
   `metrics.selected_count === 1`; the persisted Evaluation's `metrics` must
   deep-equal that parsed result's `metrics`, its `source_work` must name the
   exact reviewed Hypothesis/Run/result Artifact/source Task/executor, and its
   rationale must be nonempty;
4. the exact 13 visible `(type,id)` members and all 15 visible
   `(kind,from_id,to_id)` cable triples, each equal to the selected Kernel
   projection, plus the ten pointer inspector receipts and three terminal
   canary receipts;
5. exact first/second-launch equality of objects, links, positions, and
   inspector booleans; and
6. zero owned Windows and WSL product processes after each ordinary close.

There is exactly one admitted critic and one governed Evaluation for this
source work in Attempt 2. If that sole verdict is not the existing positive
`supports` verdict, the Router records the exact verdict and reason and the
consumer gate is RED; it creates no alternate Evaluation or Report. If the
verdict is `supports`, that same Evaluation is the supporting Evaluation and
must publish through the unchanged gate. No retry critic, verdict override,
manual Report, or second Mission is allowed.

The six deliverables now have one meaning each: one shared receipt
implementation; one six-test independent-oracle gateway contract; one
ten-row Builder/nine-row immutable-Verifier matrix; one four-file
falsifier/restoration; one exact fresh build identity; and one append-only
Attempt 2 consumer receipt from a sole critic and Mission. Every gate has a
named red. The same fresh Reader must reread this closure and answer the exact
two protocol questions before the Builder door opens.

### BUILDER MATRIX RED — Router consumer-receipt whitespace

The authorized Builder reached the exact focused `6 pass / 0 fail` and passed
matrix rows 1 through 9 unchanged. Row 10,
`git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD`, correctly stopped on
seven trailing-space lines in the Router-owned, already committed
`docs/orders/evidence/r16/CONSUMER-CHECK.md`. Those spaces came from Markdown
hard-break formatting in Attempt 1; they predate and are outside the Builder's
product scope. The Router removed only those seven line-ending spaces and
committed that docs-only correction while leaving every uncommitted Builder
product/generated-Atlas byte untouched.

This is a prerequisite-receipt correction, not a product rework or assertion
change. The same Builder is authorized to continue from matrix row 10 only,
then perform the exact four-file falsifier/restoration, append the complete
Builder report including rows 1–9 and this row-10 continuation, commit, and
push. Rows 1–9 are not rerun. Any row-10 red after the Router correction, any
falsifier/restoration red, or any additional scope change stops the repair.

### REPLACEMENT BUILD IDENTITY RED — explicit accepted build inputs

After independent PASS, the Router ran the prescribed
`bun run --cwd collab-electron build` once from docs head
`6d117ce824c55b162ba4f55db289d254dd1b20e1`. The native build exited 0 in
about 53 seconds and Main, preload, and renderer outputs all postdated
`2026-08-22T13:03:29.9813782Z`, but the Main bundle embedded the docs head
instead of immutable product candidate
`99188c6b3e039821c5c615c621a45d5c3f484ab9`. It also retained the default
`development` timestamp. No application was launched.

This is a build-input defect, not a product or build failure. The existing
`collab-electron/electron.vite.config.ts` already defines the accepted seams:
`QF_BUILD_COMMIT_SHA` overrides `git rev-parse HEAD`, and
`QF_BUILD_TIMESTAMP` overrides `development`. The failed identity output is
not the replacement candidate and does not count as the one accepted build.

The Router is authorized for exactly one corrected build. In one PowerShell
process, set `QF_BUILD_COMMIT_SHA` to the full immutable product candidate, set
`QF_BUILD_TIMESTAMP` to the UTC build-start receipt selected immediately
before invocation, then run the unchanged build command:

```powershell
$env:QF_BUILD_COMMIT_SHA='99188c6b3e039821c5c615c621a45d5c3f484ab9'
$env:QF_BUILD_TIMESTAMP='<exact UTC build start>'
bun run --cwd collab-electron build
```

Acceptance remains exact: native exit 0; invoked `electron-vite build`;
successful Main/preload/renderer phases; all three output products postdate the
same bound UTC start; and the Main bundle contains both the full candidate SHA
and exact timestamp. The docs HEAD may not substitute for the product
candidate. Any red stops R16; no further build or app launch is authorized.

### NORMAL CONSUMER ATTEMPT 2 RED — exact numeric rubric discovery

The corrected replacement build passed every identity requirement at immutable
product candidate `99188c6b3e039821c5c615c621a45d5c3f484ab9`, using build
timestamp `2026-08-22T13:05:28.3041800Z`. The Router then ran the normal app
through Computer Use. The append-only exact receipt is
`docs/orders/evidence/r16/CONSUMER-CHECK.md`, Attempt 2.

The one new guided Mission completed Director delegation, deterministic
execution, and the exact three governed critic reads. The repaired
`qf_artifact_get` returned the hash-verified payload receipt and its broker row
recorded the identical result. The critic correctly reasoned toward `supports`
at confidence `0.9`, but five `qf_record_evaluation` calls failed: the tool
interface supplied the four rubric scores as comma strings twice and numeric
strings three times. No Evaluation or Report exists for that review Task. The
normal app and all owned Windows/WSL processes then closed cleanly.

The finite defect is in action discovery. The authoritative
`record_evaluation` Zod action declares `rubric` as generic `jsonObject`, so
generated MCP JSON advertises an untyped object with
`additionalProperties: {}`. The production Kernel intentionally requires an
exact four-key object whose values are finite numbers in `[0,1]`. The live
Hermes critic was not given that shape.

#### Bounded repair

Replace only the `record_evaluation` action input's generic rubric declaration
with one strict named Zod object containing exactly these required numeric
properties, each bounded from 0 through 1:

```text
faithfulness
answer_relevancy
context_precision
context_recall
```

Keep the rubric property optional at the shared schema level for the existing
legacy path. Do not coerce strings, change Kernel validation, change verdict
derivation, relax the four-key rule, alter findings/source-work/publication
semantics, or add a runtime retry. The generated MCP schema must expose the
four named properties as `type: number`, required inside `rubric`, with no
additional properties. The production critic tool served through
`qf.ontology.list_tools` must equal that generated authority.

Allowed Builder paths are exactly:

```text
qf-kernel-schema/src/ontology/research.ts
qf-kernel-schema/src/generate.test.ts
qf-kernel-schema/golden/tools.json
qf-kernel-schema/golden/ONTOLOGY.md
qf-kernel-schema/golden/migration.sql
collab-electron/src/main/ontology-gateway.test.ts
docs/orders/evidence/r16/BUILD-REPORT.md
qf-atlas/atlas.json
qf-atlas/atlas.md
qf-atlas/atlas.html
```

Generated files may change only as a direct result of `bun run generate` from
the one source-schema repair; unchanged generated files remain byte-identical.
No application renderer, gateway implementation, Kernel implementation,
fixture, order, consumer evidence, package, credential, founder-state, build
output, or R17 path is in Builder scope.

#### Exact acceptance and falsifier

The Builder runs, in order:

```text
bun run --cwd qf-kernel-schema generate
bun test --cwd qf-kernel-schema
bun test collab-electron/src/main/ontology-gateway.test.ts
bun test collab-electron/src/main/governed-review.test.ts
bun qa/run.ts governed-review
bun qa/run.ts kernel-sole-writer-app
bun qf-atlas/generate.mjs
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
```

All native exits must be zero. Append exactly one schema test named
`record_evaluation publishes an exact numeric rubric object`; the schema suite
must report exactly `178 pass / 0 fail`. Extend only the existing production
tool-discovery test in `ontology-gateway.test.ts` with an independent literal
oracle for the same four properties, required list, `[0,1]` bounds, and closed
object shape; that focused suite remains exactly `6 pass / 0 fail`. Every
pre-existing test and assertion remains textually present.

After committing the candidate and hashing every changed product/test/generated
file, temporarily restore only
`qf-kernel-schema/src/ontology/research.ts` from base
`99188c6b3e039821c5c615c621a45d5c3f484ab9`, regenerate, then run the focused
schema and gateway tests. At least one must exit nonzero and name the generic or
missing numeric rubric shape. Restore every changed file to the candidate
hashes, require zero candidate diff, and rerun both focused commands green.
The mutation may not touch product/founder state.

A fresh independent Verifier freezes the candidate and runs exactly these nine
non-mutating rows in order; it omits both generator rows from the Builder block
(`bun run --cwd qf-kernel-schema generate` and
`bun qf-atlas/generate.mjs`):

```text
bun test --cwd qf-kernel-schema
bun test collab-electron/src/main/ontology-gateway.test.ts
bun test collab-electron/src/main/governed-review.test.ts
bun qa/run.ts governed-review
bun qa/run.ts kernel-sole-writer-app
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
```

The Verifier repeats the falsifier/restoration only after that matrix, writes
exactly one PASS section for this repair to
`docs/orders/evidence/r16/VERIFICATION.md`, and records the exact restoration
hashes and Atlas `HARD RED: 0`. It never regenerates, edits, or commits the
candidate during the normal matrix. No build or app launch occurs before this
PASS.

After PASS, the Router makes one exact identity-bound build and one new normal
Computer Use consumer attempt. Because Attempt 2 is already the recorded red
attempt, the Router appends exactly one `Attempt 3` section to
`docs/orders/evidence/r16/CONSUMER-CHECK.md` and preserves Attempt 1 and Attempt
2 byte-for-byte. Attempt 3 records the immutable candidate/build identity, the
exact two-launch commands, the exact numeric rubric schema received by the
sole critic, the successful Evaluation and unchanged publication receipt, the
exact 13-object/15-cable world, ten pointer inspector receipts, three terminal
canary receipts, first/second-launch equality, and zero owned Windows/WSL
processes after each ordinary close. Immediately after the executor (worker)
tile appears, its existing type/erase/mouse-return canary is recorded before
waiting for completion; the Director and critic canaries remain required.
The sole critic must complete one successful Evaluation and publish through the
unchanged gate. No second Mission, retry critic, alternate Evaluation, or
verdict override is allowed.

Every gate has a native red: stale generation, generic rubric shape, production
tool mismatch, governed-review regression, writer/Atlas regression, base-schema
mutation staying green, missing or duplicated Attempt 3 evidence, live critic
or Evaluation failure, missing Report/world, pointer or reopen mismatch, or
cleanup residue. The deliverables are six named outcomes with one meaning
each: (1) one strict `record_evaluation` rubric authority; (2) one generated
MCP projection identical to that authority; (3) one six-test focused contract,
made of the appended schema test plus the extended existing gateway discovery
test; (4) one source-only falsifier/restoration; (5) one independent Verifier
PASS in the named verification receipt; and (6) one append-only Attempt 3
normal-consumer PASS from the sole critic and Mission. A fresh Reader must
answer exactly whether every gate can fail and whether every deliverable has
exactly one meaning before Builder work.

### NORMAL CONSUMER ATTEMPT 3 RED — selected endpoints leak a sixteenth cable

The independently verified numeric-rubric candidate
`e94e544b1275958d22b3826dfec43bbfcae71c3f` was built once with exact identity
and used through the normal application. One real Mission completed Director,
executor, independent critic, numeric Evaluation, and gated Report publication.
The exact immutable identities and live receipts are append-only in
`docs/orders/evidence/r16/CONSUMER-CHECK.md` Attempt 3.

The Mission-local read-only projection had the correct 13 objects and
`missing_lineage=[]`, but emitted 16 links. The extra link was the real
Director-to-critic `delegates_to` relation. It is not one of R16's exact 15
semantic world cables. `research-world-projection.ts` currently emits every
allowed-kind link whose endpoints happen to be selected, so an unrelated
relationship between two legitimate world members becomes an extra canvas
cable. This is a bounded projection defect, not an ontology-write defect and
not grounds to change the 13/15 contract.

Attempt 3 also lacks one required measurement receipt: the worker and critic
terminal canaries were visibly captured, erased, and returned by pointer, but
the Director terminal moved while the canary was typed and closed before the
exact text became visible. No Director receipt is claimed. That is an operator
sequencing red, not a product-code defect. The next consumer check measures the
Director immediately after Mission creation, the worker immediately after its
tile appears, and the critic immediately after its tile appears.

#### Authorized bounded repair

One fresh Reader must answer the protocol's exact two questions on this section
before one fresh Builder. The Builder may change only:

```text
collab-electron/src/main/research-world-projection.ts
collab-electron/src/main/research-world.test.ts
docs/orders/evidence/r16/BUILD-REPORT.md
qf-atlas/atlas.json
qf-atlas/atlas.md
qf-atlas/atlas.html
```

Construct `world.links` from the exact 15 selected semantic relationships
already named by this order, rather than by retaining every allowed-kind link
between selected endpoints. Preserve all object selection, missing-lineage,
ineligibility, shared-Artifact isolation, field display, Artifact integrity,
and pointer behavior. Do not delete or alter the underlying Director-to-critic
link in the Kernel.

Extend the existing complete-world relational test with the additional durable
Director-to-critic `delegates_to` link before projection. The test must remain
exactly 13 objects and the exact existing 15-link list, proving the sixteenth
link is excluded. Add the symmetric falsifier: temporarily restore only the
projection source from base `e94e544b1275958d22b3826dfec43bbfcae71c3f`, run
that focused test and require nonzero with the 16-versus-15 mismatch, then
restore the candidate hashes and require green with zero diff.

Builder and fresh independent Verifier each run:

```text
bun test collab-electron/src/main/research-world.test.ts
bun qa/run.ts research-world-visible
bun qa/run.ts kernel-sole-writer-app
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
git diff --check
git diff --check fef713c06f091dc8df13f7bde07be859d3b04930 HEAD
```

All native exits must be zero, the focused unit case must prove the deliberate
extra durable relationship is absent from the projection, the existing live
gate retains every 13/15, ten-pointer, reopen, and cleanup assertion, and Atlas
must remain `HARD RED: 0`. The Verifier freezes product/test/generated-Atlas
bytes and independently repeats the falsifier/restoration before writing PASS.

After that PASS, the Router makes one exact identity-bound build and exactly
one normal Computer Use `Attempt 4`. It creates one new Mission and no retry
Mission or replacement critic. Attempt 4 appends to the existing consumer file,
records the three terminal canaries in Director/worker/critic appearance order,
the sole successful governed Evaluation and Report, exact 13 objects and the
exact 15 cable tuples, ten pointer Inspect/Collapse receipts, first/second
launch equality without a Mission on reopen, and zero owned Windows/WSL
processes after each ordinary close. Any extra or missing cable, canary,
inspector, object, reopen item, or cleanup receipt is red. No R17 authority is
created by this section.
