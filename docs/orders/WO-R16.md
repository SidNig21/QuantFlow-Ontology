# WO-R16 - Visible research world

status: scoped - adversarial Reader required before build
assignee: none until Reader YES/YES PASS
depends: R15 PASS at `5d8b2f42205220f466878b32f6b17b41b4732fa8`, evidence commit `38464dd39c0b78c711119ac2f67acb96c77119c5`
rung: R16 - visible research world
authorization: founder umbrella goal 2026-08-15; `NEXT.md` names this order
rework-cycle: 0 of 1 used
R16_BUILD_BASE_SHA: `38464dd39c0b78c711119ac2f67acb96c77119c5`

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

## Exact visible world

The production Main process returns one immutable read projection for the world
root. Renderer and preload never open SQLite. The projection contains only
Kernel rows, durable link rows, R15 source-work bindings, and bounded Artifact
bytes resolved through the existing app-owned Artifact boundary.

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
controls. Supporting state shows exactly one Report tile and `PUBLISHED`.

Every scalar above is shown in compact form when collapsed and in full when
expanded. Long ids may be visually abbreviated only if the full exact id is
available in the inspector and accessible name. Hashes always expose the full
value. Missing optional facts render `Not recorded`; zero, empty string, and
missing are never collapsed into one display state.

## Mission to Task truth

Add one canonical durable link kind, `belongs_to`, from `task` to `mission`.
`create_task` accepts exactly one trusted `mission_id` for Research Director
delegation and atomically writes that link with the Task. The R14 Director
delivery carries the exact Mission id already assigned by Main. A missing,
unknown, or caller-substituted Mission id refuses before Task creation. Manual
Tasks created outside a Mission remain valid and show `Mission not linked`; the
renderer must not infer membership from equal text, timestamps, or proximity.

The existing R14 flow must therefore produce exactly one `belongs_to` link. No
historical Task is backfilled by a guess. This is the only new domain relation in
R16.

## World traversal and cables

Traversal starts from the exact selected root and follows only these facts:

- `belongs_to` between Task and Mission;
- R15 source-work binding from source Task to Hypothesis, Run, result Artifact,
  and executor session;
- `tests`, `uses`, `produces`, `evaluated_by`, `performed_by`, `gates`,
  `assigned_to`, and `delegated_by` durable links;
- Evaluation fields that name findings Artifact, review Task, Report, and source
  work.

Source-work/Evaluation field references admit tiles but do not draw cables unless
a corresponding durable link exists. Required supporting-fixture cable labels
are `belongs_to`, `tests`, `uses`, `produces`, `evaluated_by`, `performed_by`,
`gates`, `assigned_to`, and `delegated_by`, each at its exact endpoints and
cardinality. A missing required link shows `Lineage incomplete: <kind>` on the
nearest owning tile and draws no substitute cable.

All semantic cables reuse the existing Glacier cable implementation and
`connection` write boundary. Their source is the current Kernel projection, not
canvas state. View positions may persist in app-local canvas state; object facts,
labels, endpoints, and lineage may not.

## Layout and interaction

`Show research world` appears on the selected Mission and eligible source Task.
It is disabled with an inline exact reason when the root cannot resolve a world.
Activation reveals or focuses the existing tiles; it never duplicates them.

First reveal uses deterministic lanes around the world root:

- intent: Mission, Task, Hypothesis;
- evidence: Dataset, Run, result and findings Artifacts;
- judgment: Evaluation and Report.

Existing user-moved positions win on later reveals. New tiles occupy the nearest
free slots in their lane and never cover the rotating cube, Dock, or another
tile. `Tidy` remains the operator's explicit global layout control.

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

Add and register exactly `research-world-visible`. Its total deadline is 90
seconds, including cleanup. It uses one prebuilt isolated supporting fixture,
launches production Electron, uses real preload/Main projection and renderer,
opens the world by visible click, exercises pointer and keyboard inspection,
fully closes, reopens the same root, and proves identical visible/domain facts.
It does not launch a real model, package the app, or run an installer.

## Product gate

Before the first launch, construct the supporting fixture only through Kernel
commands and exact R14/R15 production helpers. The fixture contains one Mission,
one source Task, one Hypothesis, one Dataset plus source Artifact, one succeeded
Run, one result Artifact, one supporting Evaluation, one findings Artifact, and
one Report. Freeze an independent expected manifest before Electron starts.

The gate must prove:

1. visible click reveals exactly one tile per expected object id/type;
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

A separate rejecting fixture in the focused renderer/Main tests proves no Report
tile, exact block code/message, and both R15 actions. It does not require another
Electron boot.

## Required falsifiers

Each mutation changes production code or fixture truth, never the gate,
assertions, expected manifest, timeout, or selector. The unchanged gate/test must
go red, then exact restoration must return green:

1a-i. omit each one of the nine required tile kinds;
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

## Literal Builder and Verifier matrix

Run every command once after final repair state. No package, installer,
`verify-release`, soak, or real-model command is authorized.

```text
cd collab-electron
bun test src/main/research-world.test.ts src/windows/shell/src/research-world.test.ts src/windows/shell/src/task-composition.test.ts
cd ..
bun test packages/qf-kernel/src/r16-visible-world.test.ts qf-kernel-schema/src/generate.test.ts
bun test qa/gates/research-world-visible.test.ts
bun qa/run.ts research-world-visible
bun qa/run.ts governed-review
bun qa/run.ts founder-steering
bun qa/run.ts research-director-delegation
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
git diff --check 38464dd39c0b78c711119ac2f67acb96c77119c5 HEAD
```

Every added or modified `*.test.ts` path reported by
`git diff --name-only 38464dd39c0b78c711119ac2f67acb96c77119c5 HEAD`
must appear literally in a `bun test` command. If implementation changes a
production contract outside files exercised by the listed tests, amend this
order before that change.

## Verifier acceptance

Builder and fresh different-model Verifier use the founder's single checkout on
branch `wo-R16`. Before and after the matrix, each records local HEAD, remote
`origin/wo-R16`, empty status, process baseline, and allocated-root baseline.
All commands use fresh candidate-specific per-command logs with captured native
exit codes. No whole-matrix wrapper or stale log may establish a result.

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
