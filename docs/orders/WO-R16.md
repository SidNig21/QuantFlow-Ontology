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
