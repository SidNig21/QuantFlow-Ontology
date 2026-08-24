# WO-PRE-R18-COHERENCE — Make the accepted R17 world tell one honest story

status: DONE — accepted; independent product/evidence/consumer verification PASS; docs-only closure recorded
kind: bounded non-rung correction
branch: `wo-pre-r18-coherence`
base: accepted R17 closure `4d25fa3df91964fc90223a135d8969ebd61c5374`
product-baseline: accepted R17 candidate `83cb58501670ec5e5551ed9a45b5f54aa038261a`
depends: [R17 final acceptance](evidence/r17/FINAL-ACCEPTANCE.md)
baseline-receipt: [accepted product byte equivalence](evidence/pre-r18-coherence/BASELINE-BYTE-EQUIVALENCE.md)
cleanup-receipt: [exact audit-residue cleanup](evidence/pre-r18-coherence/AUDIT-RESIDUE-CLEANUP.md)
authorization: founder command on 2026-08-23; implementation begins only after Reader `YES/YES` and temporary `NEXT.md` rotation
reader-receipt: [YES/YES at `afe9b36`](evidence/pre-r18-coherence/READER-ACCEPTANCE.md)
amendment-reader-receipt: fresh Reader `YES/YES` required for the 2026-08-23 Canvas correction; the prior receipt does not authorize the paused Builder to resume
rework-budget: exactly one product rework commit for the entire order; any later red receipt stops for Ryan

## In plain terms

The accepted R17 product already contains the research world. This correction
makes that world understandable without an architecture briefing. A durable
Mission appears immediately; Dock and Canvas describe each participant with the
same honest state; and raw evidence, independent judgment, the current published
conclusion, and historical work cannot be mistaken for one another.

This order does not redesign QuantFlow. It corrects three comprehension defects
in the existing shell and records two stale Atlas statements plus the accepted
mouse-first product authority. `GOLDEN-RUN.md` continues to label R18 the active
route target, but R18 has no build authority during this non-rung correction.

## The three owned defects

1. **Participant-state contradiction.** The Dock can say a participant is live
   while its Canvas tile says stopped, and a participant involved in Mission
   startup can show an unexplained `No task`.
2. **Invisible startup.** QuantFlow can persist a Mission while the Canvas still
   presents the landing logo instead of the new research world.
3. **Ambiguous provenance.** Raw participant output, its independent Evaluation,
   the current published Report, and historical work compete as if they carry
   equal authority.

Every product edit must repair one of these defects or remove screenshot-proven
visual interference that prevents the repair from being understood. Unmapped
beautification is forbidden.

## Fixed product vocabulary

The shared participant view applies this exact source/precedence table. A higher
row in one axis wins over a lower row in that same axis; one axis never overwrites
another.

| Axis | Derived value | Existing source and precedence |
|---|---|---|
| Session | `active` | `agent_session.status` is exactly `starting`, `running`, or `blocked` |
| Session | `closed` | `agent_session.status` is exactly `closed`, `cancelled`, or `failed` |
| Session | `Not recorded` | status is missing, `completed`, or any other value |
| Runtime | `running` | the current runtime observation identifies a live PTY/ACP/native process |
| Runtime | `starting` | the session is admitted/active but no live-process observation or terminal exit exists yet |
| Runtime | `unavailable` | no live process exists and the profile/runtime availability surface says the definition cannot launch |
| Runtime | `stopped` | a previously admitted session has no live process and is not `starting` or `unavailable` |
| Work | `completed` | the owned Task is in its existing terminal success state |
| Work | `blocked` | the owned Task or governed review surface records the existing blocked/refused state |
| Work | `waiting` | the owned Task is active but its existing state says waiting/review-pending rather than executing |
| Work | `working` | an active Task is assigned to this exact `agent_session.id` |
| Work | `unassigned` | no active Task is assigned to this exact `agent_session.id` |
| Recovery | `restartable` | the session is not live and the existing definition/profile availability says the same role/runtime can launch |
| Recovery | `not restartable` | the session is live, or its definition/profile is absent or unavailable |

Missing or unrecognized source facts render `Not recorded`; they never default to
healthy. `Planning mission` is presentation copy only for the exact Director
`sessionId` returned by the successful submission response while its durable
Mission has no Task. It is never a Work-axis value and may not be applied to other
unassigned participants.

**Raw Artifact** is inspectable participant output that has not itself become an
accepted conclusion.

**Evaluation** is independent judgment over an exact Artifact.

**Published Report** is the current governed conclusion for its Mission.

**Historical** means durable prior or superseded work. Historical objects remain
inspectable but may not look current.

**Participant identity** is always `agent_session.id`. A ledger entry retains its
own event id and may display a separate participant-session reference; an event id
is never a participant id.

## Deliverables

### A — Correct current product authority and Atlas status in one docs-only commit

Change only these authority surfaces plus a compact receipt:

- `qf-atlas/AGENT_BOOT.md`: replace the stale statement with exactly this status
  in the document's existing form: `Capability work: CLOSED; independent
  acceptance: PASS; founder acceptance: recorded in qf-atlas/verification.json;
  baseline: present; Atlas authorizes diagnosis and blast-radius analysis, not
  product repair or deletion.` Do not change Atlas capability or policy.
- `qf-atlas/OPERATING_MANUAL.md`: make the same exact current-status correction.
- `docs/PRODUCT.md`: replace global pointer/keyboard parity as a current product
  claim with the accepted mouse-first contract. Normal text and terminal input
  must work after mouse focus, and focus may not become trapped. Full global
  keyboard-navigation parity remains pre-release debt already recorded as
  `docs/DEBT.md` item 38.
- `docs/orders/evidence/pre-r18-coherence/DOCUMENTATION-CORRECTION.md`:
  identify the exact old claims, new claims, and authority receipts. Its focused
  check must assert that the old claims are absent, the exact new claims are
  present, `qf-atlas/verification.json` and `qf-atlas/baseline.json` exist,
  `docs/PRODUCT.md` points to Debt item 38, and no file outside these four named
  documentation paths changed in the docs-only commit.

This commit contains no product code, generated Atlas model, baseline mutation,
or unrelated documentation cleanup.

### B — Reveal the durable Mission immediately through the existing world projection

After the normal Research Director submission boundary returns a durable Mission
id, reveal that Mission through the existing `researchWorldController.reveal`
path. The Canvas must leave the unexplained landing state without waiting for a
worker, Artifact, ledger click, or refresh.

`Immediately` has one measurable meaning: after the submission IPC promise
resolves, the gate observes the matching Mission tile before any worker completion,
Artifact event, ledger interaction, explicit refresh call, or second submission.
A timeout is only the test limit; delayed polling or later activity is not the
behavior being accepted.

The revealed world uses only Kernel-owned Mission, Task, participant, object, and
link facts. Do not add a UI truth store, synthetic Mission, optimistic domain row,
new ontology type, or direct renderer write. A failed submission leaves the
previous Canvas intact and shows the existing error path.

The immediate Director may be associated with that Mission only by the exact
`sessionId` returned with the same successful submission. On cold reopen, a
participant may be called Mission-local only when an existing durable relation in
the Kernel proves it. If no such relation exists, the Builder stops: adding one is
outside this order's renderer/projection boundary.

Close/reopen means close and relaunch the normal app against the same isolated app,
Kernel, and Artifact directories, without refresh or injected browser state. The
relaunch must reconstruct the same Mission-local object ids, link triples,
participants proven Mission-local by durable Kernel relations, and saved
research-tile identities through the existing hydrate/projection boundary. The
same-submission planning Director is excluded from the reopen participant
comparison unless such a durable relation exists.

### C — Use one honest participant projection in Dock and Canvas

Create or reuse one pure derived participant view consumed by both Dock session
rows and Canvas participant tiles. Its inputs are the existing AgentSession,
`spawned_from` definition, runtime observation, Task assignment, durable Mission
binding, capability groups, and `produces` Artifact links. It must expose:

- role first and runtime second;
- recruiter or creation reason when that fact exists;
- owned Task; when and only when the participant is the exact Director `sessionId`
  returned by the successful submission and that Mission has no Task, its Task
  display is exactly `Planning mission` while its Work axis remains `unassigned`;
  every other participant without a Task displays exactly `Not recorded` for Task
  and `unassigned` for Work;
- distinct session, runtime, work, and recovery axes;
- produced Artifact/output when linked;
- only interventions present in the existing named capability/action mapping.

Missing recruiter/reason, Mission binding, Task, output, capability, or runtime
facts render `Not recorded`; they do not authorize inference. The helper may not
read terminal prose to manufacture a state.

Dock and Canvas must render the same values for the same participant id. A live
session cannot render `stopped` on one surface. A closed runtime may still render
completed work and `restartable`; those are different axes. Unknown or absent
facts are labeled honestly, never inferred from CSS, elapsed time, terminal text,
or display position.

Keep `agent_session.id` across the Dock row, participant tile, Task ownership, and
terminal. Ledger event ids remain event ids and may reference the participant
separately. No duplicate display participant is permitted.

Terminal input remains directly usable after mouse focus. Expanding or focusing
the terminal may not hide the participant's role, runtime, Task context, or work
state, and mouse focus can return to the Canvas without trapped keyboard input.

### D — Make evidence and time authority unmistakable

On existing research-object tiles and inspectors, render stable semantic markers
for:

- `RAW ARTIFACT` — inspectable participant output;
- `EVALUATION` — independent judgment over an exact Artifact;
- `PUBLISHED REPORT` — the current governed conclusion;
- `HISTORICAL` — durable prior or superseded work.

Determine these labels only from current object types, Mission locality, links,
publication state, and existing projection data. A raw Artifact remains visible
and inspectable but cannot visually compete with the current published Report as
an equivalent conclusion. Historical styling must not erase provenance or make a
historical Report appear current.

The read-only research-world projection exposes `current_report_id` and the full
Mission-local `report_ids` set from existing governed publication/source-work
truth. It creates no row and changes no publication semantics. For one Mission,
`PUBLISHED REPORT` means `object.id === current_report_id`. Every other id in
`report_ids` is `HISTORICAL`. A result Artifact may carry both `RAW ARTIFACT` and
`HISTORICAL`; the current published Report may not carry `HISTORICAL`; only the
current published Report carries the current-authority marker. An Evaluation marks
judgment over its exact linked Artifact and never becomes the published conclusion.

Long opaque ids may be shortened for display only if the full canonical id remains
available in the existing inspector or accessible title. Stored ids and link
semantics do not change.

### E — Separate the existing Dock responsibilities without adding inventory

Within the current right rail, provide five contextual modes using the existing
surfaces:

- `START`: Mission composer and Technique selector;
- `CATALOG`: existing launchable participant definitions;
- `ACTIVE`: current participants and owned work;
- `INSPECT`: the selected participant or ontology object;
- `HISTORY`: closed sessions and prior work.

Only the selected mode's primary responsibility is expanded. Counts and compact
context may remain visible, but the composer, full catalog, active monitor,
inspector, ledger, and session graveyard may not remain one uninterrupted panel.
Mode selection is ephemeral view state, not domain truth. Do not add a new Dock
participant, recipe, marketplace, capability, framework, or navigation system.

Modes are exactly one of `START | CATALOG | ACTIVE | INSPECT | HISTORY`. Initial
mode is `START`. One existing tablist selects them, exactly one tab has
`aria-selected="true"`, each primary pane carries `data-dock-primary`, exactly one
primary pane is expanded, and the other four primary panes are collapsed. Compact
counts may remain outside the panes; object details may appear only in `INSPECT`.

Cancel, close, restart, and similarly dangerous session actions must be explicit,
labeled buttons. Clicking participant identity or whitespace selects/inspects only
and produces no destructive IPC. When supported, accessible names are exactly
`Cancel session <id>`, `Close session <id>`, and `Restart session <id>`; activating
the explicit button invokes the matching existing action for that same session.

### F — Clarify only existing semantic cables

Every rendered research-world cable shows its existing semantic link kind and
direction. A selected cable receives explicit selection emphasis. Inactive/
background and historical cables may be visually subordinate only when the
projection fixture marks that exact cable inactive/background or historical.

Do not add or rename link kinds, alter stored direction, replace the Canvas engine,
or create a second relationship model.

### F1 — Correct the founder's populated-world readability failure

The founder supplied one normal QuantFlow screenshot on 2026-08-23, SHA-256
`6925fa5b7b5c85050e0441f318565b54388f027aa5a8fb35954743908f58c477`. It is a
bounded acceptance fixture for screenshot-proven interference, not design authority.
It shows four defects that directly prevent the approved truths from being used:

- research objects collapse into a near-single vertical column of tiny dark tiles;
- one selected cable becomes a full-height dominant line instead of explaining two
  endpoints;
- participant, Artifact, Evaluation, and Report tiles do not expose enough human
  context to understand their relationships;
- active-session ownership text overlaps in the Dock and becomes unreadable.

At the locked 1600×1000 viewport and 100% zoom, the populated Mission view in the
deliberate `Show full lineage` overview must:

1. distribute the visible Mission-local world in both axes: tile centers span at
   least 45% of usable Canvas width and 45% of usable Canvas height, and no more
   than 60% of tile centers fall within one median tile-width vertical band, while
   preserving the existing Canvas engine and saved positions;
2. keep tile rectangles and Dock row text/control rectangles non-overlapping;
3. show a readable human label, semantic type, current state/authority marker, and
   short id on every visible research-object tile;
4. make relationship context available without decoding ids: a participant shows
   owned Task/output; an Artifact shows producer and source Run/Task; an Evaluation
   shows critic, verdict, and target Artifact; a Report shows its gating Evaluation
   and current/historical authority;
5. terminate every visible cable at its actual tile endpoints, keep its label near
   the selected relationship, and prevent a selected stroke or label from obscuring
   unrelated tiles or dominating the full Canvas height;
6. preserve full canonical ids and complete relationship details in `INSPECT` even
   when Canvas labels use shortened display text.

The full-lineage fixture is exactly the accepted R17 literal oracle
`qa/oracles/r17-technique-outcome.json` at SHA-256
`038a68c2508d3d671a60a1ab3d562d8d387e70ed08e582a4cca2e7fbf0519fa7`:
all 16 resolved object records and all 20 resolved link records, with no count-only
substitute. `Usable Canvas` means the research Canvas element's measured
`clientWidth` and `clientHeight`. A `vertical band` is any closed x interval whose
width equals the median rendered tile width; the gate computes the maximum object-
center occupancy over every such interval. A cable `anchor` is the existing
`portPosition` source or target point used by the Glacier cable renderer, in Canvas
CSS pixels.

In that full-lineage state, selecting each of the 16 objects in turn must make `INSPECT` show its full id and
the complete set of incoming/outgoing `kind, from_id, to_id` triples from the
resolved 20-link oracle. Selecting each of the 20 links must show its kind,
direction, source label/id, and target label/id. The selected cable's painted
geometry may not intersect the interior of an unrelated tile and its painted
bounding height must remain below 90% of usable Canvas height.

These full-lineage requirements may adjust only the current layout calculation, tile anatomy,
bounded CSS, and existing link presentation. They do not authorize a new layout
engine, ontology field, link, inventory surface, or broad shell redesign.

### G — Land one bounded product candidate and focused proof

The product candidate contains only the projection helper or existing equivalent,
the current Dock/Canvas/tile/inspector surfaces, bounded shell CSS, a focused live
gate, optimized evidence, and a short `DESIGN.md` section that records these
existing visual semantics. Do not create a new design system.

The focused gate must exercise the real renderer → preload → Main → Kernel path
for consumer-visible claims. It may use an isolated Kernel fixture. It may not
replace Main/preload with mocks, write domain truth from the renderer, or call
`execute()` as a shortcut around the UI path. Mechanical view-state assertions
may inspect the rendered DOM after the real path has produced its facts.

`Direct renderer write` means renderer-side mutation of Kernel/domain truth.
Creating, positioning, selecting, expanding, or styling projection tiles and
changing ephemeral Dock mode state remain allowed.

The gate records distinct production receipts for renderer submission, preload
IPC, Main handler, read-only Kernel projection, and resulting DOM. It independently
queries the isolated Kernel read-only and compares the Mission, session, Task,
Artifact, Evaluation, Report, and link ids to the production response and DOM; a
printed receipt without that comparison is red.

The isolated fixture contains independent facts for all of these cases:

- the newly submitted planning Director returned by the submission boundary;
- a live worker assigned an active Task;
- an ordinary unassigned participant that must remain `unassigned`, not planning;
- a participant result Artifact, its exact Evaluation, the Mission's current
  published Report, and one superseded Report;
- one current cable and one historical/background cable carrying existing kinds
  and directions;
- the exact accepted R17 literal oracle named in F1 with all 16 objects and 20
  semantic cables, used as the representative density fixture rather than a
  re-proof of R17.

The gate supports `QF_PRE_R18_COHERENCE_FALSIFY=C01` through `C14`, plus the
named amended subcases `C14/model-complete`, `C14/default-projection`,
`C14/local-lineage`, `C14/full-lineage`, `C14/dock-isolation`,
`C14/back-to-world`, and `C14/history-authority`. The unmodified control exits
zero. Each falsifier corrupts only its named condition and must exit nonzero with
that condition's name. Builder evidence includes the control output, all C01–C13
red outputs, and one red output for every listed C14 subcase; unconditional receipt
printing is a gate defect.

The fourteen conditions are:

1. durable Mission does not replace the landing state;
2. the exact returned Director's Task display is not exactly `Planning mission`
   while the Mission has no Task, its Work axis is not `unassigned`, any other
   participant displays `Planning mission`, or another no-Task participant does
   not display Task `Not recorded` and Work `unassigned`;
3. either Dock or Canvas differs from the independently queried Kernel/runtime
   facts for any of the four participant axes;
4. the fixture's raw Artifact is presented as the current governed conclusion;
5. the exact Evaluation or current published Report lacks its required marker;
6. the superseded Report is presented as current, or more than the current Report
   carries current-authority status;
7. other than the selected `data-dock-primary` pane, any primary pane is expanded,
   or selected pane and `aria-selected` tab disagree while cycling all five modes;
8. identity/whitespace click produces destructive IPC, the explicit labeled action
   is absent, or that action does not invoke the correct existing session action;
9. mouse-focused live terminal cannot type and erase harmless text without submit,
   hides role/runtime/Task/work context, or mouse focus cannot return to Canvas;
10. normal-app close/relaunch against the same isolated roots does not restore the
    exact Mission-local object ids, link triples, durably Mission-local participant
    ids, and saved research-tile identities without refresh or injected state;
11. a submission refused before `create_mission` changes the previously visible
    Canvas or creates a Mission, Task, session, tile, or link;
12. either surface omits or invents role, runtime, recruiter/reason, Task ownership,
    produced output, or any of the four axes for the fixture participants, or fails
    to render `Not recorded` for the fixture's deliberately absent fact;
13. a rendered cable lacks its existing kind/direction, selected cable lacks
    selection emphasis, or the fixture's current and historical/background cables
    receive the wrong visual subordination;
14. any predicate in `Finite projection states and C14 observables` fails: the
    production projection is not the exact 16-object/20-link oracle; `FULL` does
    not paint/select/Inspect every object and link; `DEFAULT` paints a non-primary
    or historical record, lacks a readable primary tile, or has a primary cable
    crossing or obscuring an unrelated tile; `LOCAL` omits or adds a declared
    local-lineage item, fails the measured dim/normal-strength separation, leaves
    the selected subject out of `INSPECT`, or leaves a Canvas overlay in place;
    Dock isolation or `Back to world` is wrong; history carries current authority;
    or the older full-lineage
    density, span, rectangle, label, endpoint, selected-stroke, or 90%-height
    predicate fails in `FULL` at 1600×1000 and 100% zoom. `INSPECT` must still show
    the full id and complete incoming/outgoing triples for every object and the
    exact kind/direction/source/target detail for every link.

The gate prints one named receipt per condition plus the tested commit, Mission id,
participant ids, object ids, link triples, and `cleanup=clean`. One process boot is
preferred for C01–C09 and C11–C14; C10 owns the one explicit relaunch. Proof scaffolding may not
take longer than the correction it protects.

## Exact file boundary

Product edits are limited to the existing shell and its focused proof surfaces:

- `collab-electron/src/windows/shell/index.html`;
- `collab-electron/src/windows/shell/src/dock.js`;
- `collab-electron/src/windows/shell/src/research-world.js`;
- `collab-electron/src/windows/shell/src/tile-renderer.js`;
- `collab-electron/src/windows/shell/src/task-composition.js`;
- `collab-electron/src/windows/shell/src/renderer.js` only for existing controller wiring;
- `collab-electron/src/windows/shell/src/shell.css`;
- `collab-electron/src/main/research-world-projection.ts` and its focused test,
  only to expose read-only `current_report_id` and Mission-local `report_ids` from
  existing governed truth;
- an adjacent pure participant-projection helper and focused unit test if sharing
  the derivation cannot be done honestly inside the listed modules;
- one focused `qa/gates/pre-r18-coherence.ts` gate and its registry/allowlist entry;
- `docs/DESIGN.md` only for the bounded current-state visual contract;
- optimized `docs/orders/evidence/pre-r18-coherence/` screenshots and receipts.

Routine `qf-atlas/generate.mjs` output changed solely by the accepted product diff
may be committed with the product candidate as generated evidence. No Atlas parser,
decision, baseline, falsifier, policy, or capability edit is allowed.

Any need to change Kernel actions, schema, ontology/link vocabulary, preload/Main
contracts beyond invoking the existing submission/reveal boundaries, runtime
adapters, Dock inventory, or another product window is a founder stop.

## Temporary authority lifecycle

After this order records Reader `YES/YES`, the Router writes
`docs/orders/evidence/pre-r18-coherence/READER-ACCEPTANCE.md` containing the exact
order SHA, Reader task id, and both answers. The Router—not the Builder—then makes
one docs-only temporary `NEXT.md` rotation that:

- records the prior `NEXT.md` blob SHA;
- names this exact order and links that exact Reader receipt;
- says `PRE-R18 COHERENCE — BUILD AUTHORIZED`;
- preserves `GOLDEN-RUN.md` unchanged and preserves an `R18` token in the
  `NEXT.md` title; only the temporary `NEXT.md` status and active-order lines grant
  authority to this non-rung order, and no future-rung authority is granted.

No Builder starts while `NEXT.md` says `NO BUILD AUTHORITY`. The temporary door
remains pointed here through verification, naive-user check, and Ryan's decision.
The independent Verifier owns its final restoration/advance in the closure commit
after Ryan accepts; a rework decision leaves it pointed to this same bounded order.

## Builder proof

Before any product edit, read `qf-atlas/ATLAS.md`, then run:

```powershell
$ErrorActionPreference = 'Stop'
function Invoke-Qf([scriptblock]$Command) {
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "Command failed with exit $LASTEXITCODE: $Command" }
}
Invoke-Qf { bun qf-atlas/generate.mjs --check }
Invoke-Qf { bun qf-atlas/ratchet.mjs }
```

Run the smallest focused checks while building. The stale
`team-composition-ui` harness is forbidden here: Debt item 37 says it must be
repaired or retired before another order relies on it, and repairing that packaged
resource harness is outside this correction.

Before handoff, run exactly:

```powershell
$ErrorActionPreference = 'Stop'
function Invoke-Qf([scriptblock]$Command) {
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "Command failed with exit $LASTEXITCODE: $Command" }
}
Push-Location collab-electron
try {
  Invoke-Qf { bun install --frozen-lockfile }
  Invoke-Qf { bun test }
  Invoke-Qf { bunx tsc --noEmit }
} finally { Pop-Location }
Invoke-Qf { bun qa/run.ts pre-r18-coherence }
Invoke-Qf { bun qa/run.ts research-world-visible }
Invoke-Qf { bun qa/run.ts repo-shape }
Invoke-Qf { bun qa/run.ts lockfile-committed }
Invoke-Qf { bun qa/run.ts kernel-sole-writer }
Invoke-Qf { bun qa/run.ts no-canvas-domain-writes }
Invoke-Qf { bun qa/run.ts kernel-sole-writer-app }
Invoke-Qf { bun qa/run.ts doc-action-surface }
Invoke-Qf { bun qa/run.ts one-skin }
Invoke-Qf { bun qa/run.ts rung-ladder }
Invoke-Qf { bun qf-atlas/generate.mjs }
Invoke-Qf { bun qf-atlas/generate.mjs --check }
Invoke-Qf { bun qf-atlas/ratchet.mjs }
Invoke-Qf { bun qf-atlas/generate.mjs --diff 4d25fa3df91964fc90223a135d8969ebd61c5374 }
Invoke-Qf { bun qa/run.ts doc-links }
Invoke-Qf { git diff --check 4d25fa3df91964fc90223a135d8969ebd61c5374..HEAD }
Invoke-Qf { git diff --check }
```

No release, installer, packaged-app, broad accessibility, soak, or full-suite gate
is authorized. A mechanical gate defect that does not change product or acceptance
meaning stays inside this build cycle.

Builder writes
`docs/orders/evidence/pre-r18-coherence/BUILDER-EVIDENCE.md` with commands, exits,
the documentation semantic-check output, the control plus C01–C13 and every named
C14 subcase red output,
named production-boundary receipts, Atlas before/after/diff results, candidate SHA,
changed files by defect, screenshot manifest, and clean-shutdown result. The tree
is clean and the candidate is immutable before verification.

## Independent verification

One fresh Verifier receives this order, `PROTOCOL.md`, the immutable candidate SHA,
and the Builder evidence—not Builder chat reasoning. It reruns the exact matrix,
checks C01–C13 and every named C14 subcase against the normal product path, verifies
the commit boundaries, and confirms the worktree starts and ends on the same SHA.

Any red receipt stops verification and returns the named defect to the same bounded
order. Exactly one product rework commit is available globally. Any red receipt
after that commit—whether the same condition or a different one—stops for Ryan; no
third implementation attempt exists.

The Verifier writes
`docs/orders/evidence/pre-r18-coherence/VERIFICATION.md` and makes no product edit.

## Naive normal-app consumer check

After independent green, use the normal application through Computer Use with no
architecture briefing. The consumer must state from the product itself:

- that QuantFlow is a persistent research world, not primarily a terminal manager;
- what the Dock and Canvas do;
- who is working, why each participant exists, and who owns each Task;
- each visible participant's runtime and work state;
- which object is raw, independently evaluated, and currently published;
- which result is authoritative and which work is historical;
- what the visible cables mean and what to click next.

The check also uses one live terminal after mouse focus for harmless typing, erases
without submitting, and returns to the Canvas by mouse. It does not require global
keyboard navigation or separate canaries in every role.

If the primary description is `IDE`, `terminal manager`, or `agent launcher`, the
central correction is red. The one global rework commit may repair a wrong action,
false belief, missing approved projection, or visual interference directly mapped
to the three owned defects. If it was already spent, stop for Ryan. All other visual
polish becomes debt and cannot delay R18.

## Founder acceptance and closure

Ryan inspects the normal app's empty, starting, active, evidence, completed,
reopened, Dock, and cable-dense states. Acceptance asks:

- Does this feel like a live research organization?
- Is the Canvas the product's center?
- Is the terminal useful without dominating?
- Can every participant's purpose and ownership be understood?
- Is the current governed conclusion obvious?
- Does the Dock feel like useful inventory?
- Would Ryan willingly operate this workflow again?

Ryan records exactly `ACCEPT PRE-R18 COHERENCE <candidate-sha>` only after the
acceptance receipt records `YES` for all seven questions above. Any `NO` records
`REWORK PRE-R18 COHERENCE <exact-question>` and spends the one global repair if it
remains available. On `ACCEPT`, the Verifier writes
`docs/orders/evidence/pre-r18-coherence/FINAL-ACCEPTANCE.md`, marks only this
non-rung order complete, and rotates `NEXT.md` to `R18 COMPOSE ALIGNMENT — NO BUILD
AUTHORITY`, naming the forthcoming `WO-R18-COMPOSE.md`. That closure commit does
not edit the Golden Run rung table or authorize R18 implementation.

The Router then performs the separately founder-authorized route realignment:
R18 Compose, R19 Recall, R20 Market Learning, R21 System Learning. It preserves the
existing recall draft as draft-only R19 material where still valid, writes the exact
bounded `WO-R18-COMPOSE.md`, and sends it through a fresh Reader. Only that later
Reader `YES/YES` and another explicit `NEXT.md` rotation can authorize R18. If the
exact R18 order cannot be written without an unresolved product decision, stop
rather than inventing build authority.

## Explicit non-deliverables

- no Claude Design or GLACIER implementation;
- no broad visual redesign, rebrand, new Canvas engine, or component framework;
- no ontology object, link type, Kernel schema/action, or truth-store change;
- no new Dock inventory, Claude/Codex integration, recipe, or marketplace;
- no R18 Compose behavior, recall, market learning, or system learning;
- no Atlas capability expansion, repo-wide cleanup, release, installer, packaging,
  soak, or global keyboard-navigation parity;
- no reopening or deep re-proof of accepted R17 behavior.

## Reader contract

The fresh semantic Reader answers exactly:

1. Can every acceptance gate and named condition actually fail against an
   incorrect implementation?
2. Does every deliverable, state label, authority boundary, and stop condition
   have exactly one meaning?

Every defect must be landed in this order. Chat-only guidance cannot authorize a
Builder. Reader `YES/YES` plus the subsequent temporary `NEXT.md` rotation is the
only implementation door.

## Round 1 independent verification — REWORK

verifier-task: `01a02de8-530f-7091-b03d-668247fefc7a`
product-candidate: `d91eda86b1184fe2c381771e293fdd8a79bad98c`
evidence-head: `dd7ff76dc7ec4bd9d3d2cf6c354bbdfd2f86f642`
verdict: REWORK — the one global product repair is now consumed
record: [Round 1 verification](evidence/pre-r18-coherence/VERIFICATION-ROUND-1.md)

The product's focused 25-test suite, TypeScript, static gates, Atlas ratchet, and
the inherited live 13-object/15-cable R16 world were green with clean shutdown.
That did not satisfy this order. C14 was a false green: the new gate checked only
the R17 oracle file's hash/count and source strings while the live control still
exercised 13 objects, 15 cables, and ten inspectors, with no geometry assertion.
No optimized screenshot evidence existed.

The single repair owns exactly:

1. Leave `research-world-visible` and its inherited R16 13/15 contract unchanged.
   Make `pre-r18-coherence` exercise the accepted R17
   `qa/oracles/r17-technique-outcome.json` fixture through the real production path,
   resolving and comparing every one of its 16 object records and 20 link records.
2. In the deliberate `FULL` state, select all 16 objects and all 20 links in the
   live DOM and compare every required `INSPECT` field/triple. Measure C14 from
   the actual `DEFAULT`/`LOCAL`/`FULL` DOM/SVG states and rectangles,
   Canvas `clientWidth/clientHeight`, existing `portPosition` anchors, painted
   stroke bounds, and the exact thresholds in F1. A source-string or file-exists
   check may not satisfy any C14 predicate.
3. Capture the implemented versions of the same fourteen named baseline states at
   1600×1000 and 100% zoom: `01-empty-workspace`, `02-mission-starting`,
   `03-director-planning`, `04-active-participants`, `05-artifact-produced`,
   `06-evaluation-and-report`, `07-completed-world`, `08-reopened-world`,
   `09-dock-catalog`, `10-dock-active-sessions`, `11-selected-participant`,
   `12-selected-artifact`, `13-selected-evaluation`, and
   `14-most-cable-dense-region`. Track optimized PNG/WebP files at no more than
   1600×1000, target 600 KB each, total directory at most 25 MB, and write a
   manifest containing state, viewport, object/link counts, full SHA-256, file
   size, and the approved defect it demonstrates.

The repair may touch only the existing candidate files, the focused Pre-R18 gate/
tests/oracle glue, and optimized evidence/receipts. It may not change the literal
R17 oracle, weaken a threshold, replace the R16 oracle, repair unrelated package
failures, or add product capability. After this commit, any red condition—C14 or
otherwise—stops for Ryan with no second repair.

## Founder Canvas workflow correction — 2026-08-23

authority: founder-approved acceptance correction after the final visual FAIL
record: [Final verification](evidence/pre-r18-coherence/VERIFICATION-FINAL.md)
reader-revalidation: required before the paused Builder resumes

The final verification proved a distinction this order previously left
ambiguous. The Kernel ontology and its complete 16-object/20-link world were
mechanically present, while the default Canvas projection was a consumer-unusable
graph hairball. The default product view may not be a one-to-one, full-brightness
dump of every durable object, relationship, terminal, history row, and inspector.

The permanent product contract is:

```text
Kernel / Ontology
all durable objects and governed relationships

        ↓

Canvas projection
the readable current-Mission workflow

        ↓

Dock Inspect / local lineage / full lineage
detail and complete technical truth on deliberate request
```

This is one projection of existing Kernel truth. It is not a second truth store,
new ontology, new Canvas engine, parallel layout/workflow truth, or permission to
omit durable truth. Every state below derives from the same existing read-only
`world.objects`, `world.links`, `current_report_id`, and existing source-work
facts. No fixture-id stage map, hand-maintained workflow graph, duplicate
relationship list, or persisted UI workflow state is authorized.

### Default current-Mission workflow

The normal Canvas opens on one current Mission organized into readable stages:

```text
Mission + Inputs
→ Participants + owned Tasks
→ Run + raw Artifact
→ independent Evaluation
→ current published Report
```

Technique, Hypothesis, Dataset, Ticket, grade Artifact, and other Mission-local
objects remain first-class and inspectable. They may be grouped as inputs,
supporting evidence, or outcome detail instead of receiving equal default visual
weight. Participants sit beside the Tasks they own and expose role, runtime,
recruiter/reason, session state, work state, recovery, Task, and produced output.
Their terminal remains an expandable live view, not their complete identity.

The default projection paints only the primary workflow plus the ownership,
production, and review relationships needed to understand it. Unrelated and
secondary records remain present in the projection model but are not painted
in `DEFAULT`; they become available through `LOCAL` or `FULL`.
Historical work is absent from the current projection or unambiguously historical
through the existing `HISTORY` mode; it may not compete with current authority.

### Progressive disclosure and full truth

Selecting an object must reveal its exact local lineage and dim unrelated work.
For example, selecting an Artifact reveals its producer, owning Task, Run,
Evaluation, and downstream Report. Selecting a participant reveals its recruiter,
owned Task, produced outputs, and downstream reviewer where those relationships
exist.

An explicit `Show full lineage` action exposes all 16 R17 objects and all 20 exact
semantic links. The full-lineage view is an advanced overview and may use pan and
zoom. It is not required to keep every tile's detail simultaneously readable at
one fit-to-screen zoom. All 16 objects and 20 links must still be selectable,
inspectable, semantically exact, and reachable from the default view.

Overview and detail are separate normal product states:

```text
select object or relationship
→ focus and raise the exact subject
→ Dock switches to INSPECT
→ readable details and local lineage appear
→ Back to world returns to the prior overview
```

Object and relationship details belong in the real Dock `INSPECT` mode. A large
floating connection inspector may not obscure the operating surface. `START`,
`CATALOG`, `ACTIVE`, `INSPECT`, and `HISTORY` isolate their named responsibility;
inactive modes may not continue as one compressed panel beneath the active mode.

### Readability is a product invariant

The projection must maintain readable primary tile size and human labels. Pan,
scroll, and zoom are preferable to postage-stamp tiles. Background cables remain
subordinate to objects. Selected lineage is visibly stronger than unrelated
lineage, direction and semantic kind remain available, and no primary visible
cable, label, or inspector may obscure unrelated tile content.

The dense evidence state is now the deliberate full-lineage overview. The default
current-Mission screenshot is a separate consumer state and must visibly tell the
Mission → work → evidence → judgment story without requiring the user to decode
all 20 relationships.

### Finite projection states and C14 observables

The amendment has exactly three Canvas projection states. They are ephemeral view
state over the same read-only production projection; they are not Kernel rows,
ontology facts, or a second lineage model. The projection state, selected subject,
and saved overview token exist only in memory for the current window; close/reopen
reconstructs them from durable Mission facts and starts at `DEFAULT`.

| State | Entry and exact painted meaning | Dock and exit |
|---|---|---|
| `DEFAULT` | Normal Mission reveal, with no selected subject. Paint exactly the primary object/link set below; do not paint secondary, unrelated, or historical records. They remain in the complete projection model. A visible `Show full lineage` action is required. | The current non-`INSPECT` Dock mode is preserved. Selecting an object or relationship enters `LOCAL`; `Show full lineage` enters `FULL`. |
| `LOCAL` | Selecting one object or relationship sets that exact subject. Paint the complete current-Mission model; the exact local-lineage set for the subject is normal-strength and every other current-Mission record is visibly dim. History remains in `HISTORY`, not in the current-Mission set. | `INSPECT` is the only expanded Dock primary pane. `Back to world` clears the subject and all inspectors, performs no domain IPC, and restores the saved `DEFAULT` or `FULL` overview and the exact saved non-`INSPECT` Dock mode. |
| `FULL` | The explicit `Show full lineage` action paints all 16 oracle objects and all 20 exact oracle links, with every item selectable. No subject is selected and no item is hidden by a fit-to-screen rule; pan/zoom is allowed. A visible `Back to world` action is required. | Dock mode is otherwise unchanged. `Back to world` returns to the saved `DEFAULT` overview and performs no domain IPC. |

`DEFAULT`, `LOCAL`, and `FULL` are finitely distinguishable in the live DOM by
the projection state, selected-subject identity, painted object/link set, and
computed visual state. The gate must record those four facts; a screenshot or a
count alone is not a state proof.

For this order, `primary` is a derived presentation classification, not a new
field or a maintained id/kind list. The projection performs this deterministic
semantic walk over the existing objects and links: start at the root Mission;
place a Task beside the AgentSession reached by its existing assignment link;
from that Task's existing source-work facts, place the Run and every
Technique/Strategy, Dataset, or Hypothesis input reached by its existing input
links;
place the raw Artifact downstream of the Run's existing production link; place
the Evaluation after the Artifact from the existing judgment link; and place the
current Report last from the existing publication link and `current_report_id`.
The primary object set is the objects reached by that walk, and the primary
relationship set is the exact existing link records used by the walk. Existing
delegation, review, and output links may add the already-governed participant
context; they may not be copied into a second relationship list. Same-stage
siblings use stable `(type, id)` order only as a deterministic tie-breaker.
`secondary` is the complement of that set among current-Mission, non-history
records, such as supporting or outcome-detail objects. `history` is the union of an id in the
existing Mission-local `report_ids` set other than `current_report_id` and the
records surfaced by the existing `HISTORY` mode with an explicit existing
`HISTORICAL` marker or session state exactly `closed`, `cancelled`, or `failed`;
no age, position, or elapsed-time inference is allowed. It is shown only in
`HISTORY` or with that marker and can never carry current-authority styling. For
an object selection, `unrelated` is every painted
current-Mission object/link outside the selected subject's local-lineage set;
for a relationship selection, it is every painted object tile other than that
relationship's two endpoints. In `DEFAULT` this is the other painted primary
work; in `FULL` it is the other painted oracle work.

Local lineage is bounded, not graph reachability. For selected object subject
`s`, it is `{s}`, every endpoint of a link incident on `s`, and the non-null
values of
the existing context fields `mission_id`, `source_task_id`,
`assignee_session_id`, `delegator_session_id`, `executor_session_id`,
`result_artifact_id`, `publication_report_id`, `critic_session_id`, and
`review_task_id` on `s` and those one-hop records. For a selected relationship,
use the union of that rule for its two endpoint ids and include the selected
link itself. Its link set is the exact existing link triples whose endpoints
are in that object set. It does not
expand through a second link hop, Canvas proximity, or terminal text. This
bounded rule yields the Mission→Task/participant→Run→raw Artifact→Evaluation→
current Report context where those existing facts exist. The gate records the
exact object ids and `kind/from_id/to_id` triples in the set for each selected
oracle subject; an omitted or extra local item is red.

For C14, `readable` means every primary tile at 1600×1000/100% has a measured
width of at least 136 CSS pixels, and its human label, semantic type, current
state/authority marker, and short id each have non-empty, non-zero DOM text
rectangles fully inside that tile, with computed `display` not `none`, computed
`visibility` not `hidden`, and computed opacity greater than `0`. The role-specific context required by F1
(participant Task/output, Artifact producer/source Run/Task, Evaluation
critic/verdict/target Artifact, and Report gating Evaluation/current or
historical authority) must use the same visible, in-tile text test; an absent
source fact must be the exact `Not recorded` value. `dim` means the selected local-lineage
paint has computed opacity at least `0.80` and every unrelated current-Mission
paint has computed opacity at most `0.50`; absent records are not claimed to be
dim. `bounded endpoint tolerance` is the existing Euclidean distance of at most
12 CSS pixels from each SVG endpoint to its existing `portPosition` anchor.
These measurements use real DOM/SVG rectangles and computed styles.

Dock isolation means exactly one `data-dock-primary` pane is visible and
expanded, exactly one tab has `aria-selected="true"`, and no inactive primary
pane contributes visible detail content; compact counts outside primary panes
remain allowed. `Back to world` is only the ephemeral restoration operation
defined in the state table, never a session, Kernel, publication, or navigation
action. The `history-authority` receipt must show that the `HISTORY` primary pane
contains only the defined history set, contains neither the current Report nor
an active current participant as a history item, and leaves the current-Mission
Canvas authority unchanged.

### Split mechanical and consumer acceptance

The amended C14 and focused proof must independently establish both classes below.
Neither verdict may substitute for the other.

Mechanical ontology truth:

1. all 16 oracle objects exist through the production projection;
2. all 20 semantic links exist with exact endpoints, kind, and direction;
3. every object and link is selectable and inspectable;
4. `Show full lineage` reaches the complete world without inventing or dropping
   truth;
5. close/reopen preserves the same durable world.

Consumer projection:

1. the default view is the staged current-Mission workflow above;
2. primary tiles do not overlap and retain a measured readable scale;
3. primary visible cables do not cross or obscure unrelated tile bodies or labels,
   apart from bounded endpoint tolerance;
4. selecting a subject reveals the exact local lineage and measurably dims
   unrelated work;
5. Dock `INSPECT` presents the selected object or relationship without a Canvas
   overlay;
6. `Back to world` restores the overview;
7. history does not compete with the current Mission;
8. a naive consumer can identify Mission, ownership, Run, raw Artifact,
   Evaluation, current Report, and the next useful action within 30 seconds.

For the consumer predicate, the clock starts when the default current-Mission
Canvas is first visible after normal app readiness and stops when one naive
consumer, without architecture briefing, answers every listed identity,
authority, and next-action prompt. `CONSUMER=PASS` requires every answer to be
correct and complete within 30 seconds; a timeout, omission, or wrong primary
description is `CONSUMER=FAIL`. “Next useful action” means naming one visible
existing Inspect, `Show full lineage`, or Dock action and what it reveals or
advances.

The focused live gate must inspect real DOM/SVG geometry and computed styles for
these claims. Source strings, fixture ids, hidden test-only styling, capture-only
overrides, or merely counting objects cannot satisfy them. Existing mechanical
assertions may be split into named receipts, but no ontology, production-boundary,
cleanup, or persistence assertion may be weakened or removed.

### Evidence states

The fourteen existing evidence names remain. Their acceptance meaning is amended:

- default/starting/active/completed/reopened frames show the staged current-Mission
  projection;
- selected participant, Artifact, and Evaluation frames show readable focus plus
  the real Dock `INSPECT` state;
- `14-most-cable-dense-region` shows the deliberate full-lineage overview with all
  16 objects/20 links available, background lineage subordinate, no floating
  inspector, and a clear way back to the current workflow.

### Expedited proof discipline for this final lap

One writer owns the checkout. The Builder runs changed-surface unit/static checks
before an Electron journey, collects the complete related failure frontier before
making one coherent repair, batches C01–C13 and every named C14 early-exit falsifier between one clean
control and one final clean control, and does not rerun unrelated release/package
work. Reports carry four separate verdicts:

```text
PRODUCT
EVIDENCE
ATLAS
CONSUMER
```

Each verdict is independently `PASS` or `FAIL`; no verdict may inherit green from
another. `PRODUCT=PASS` requires the allowed product file boundary, the normal
renderer→preload→Main→Kernel path, the production-boundary receipts, and every
C01–C13 plus named C14 control predicate to pass.
`EVIDENCE=PASS` requires all fourteen named captures, their manifest fields and
budgets, the clean control, every C01–C13 and named C14 falsifier red receipt, the candidate
SHA, and clean shutdown. `ATLAS=PASS` requires `bun qf-atlas/generate.mjs`,
`bun qf-atlas/generate.mjs --check`, `bun qf-atlas/ratchet.mjs`, and the listed
build-base diff to pass with no unauthorized Atlas edit. `CONSUMER=PASS` is
the timed naive-consumer predicate above. A receipt is classified by the surface
that produced it: live behavior/boundary is PRODUCT, capture/manifest/falsifier
proof is EVIDENCE, Atlas output is ATLAS, and the timed human check is CONSUMER;
environment or external-runtime noise is recorded separately and never promoted
to any green verdict.

An evidence-only correction does not invalidate unchanged product bytes. A product
or acceptance-meaning change does. Every red receipt has exactly one verdict
surface (`PRODUCT`, `EVIDENCE`, `ATLAS`, or `CONSUMER`) and may additionally carry
one cause tag: `FIXTURE`, `ENVIRONMENT`, or `EXTERNAL RUNTIME`.

This amendment supersedes any earlier sentence that implies every cable must be
painted at full prominence in `DEFAULT`, that all 16 objects and 20 links must be
painted in `DEFAULT` or `LOCAL`, or that all tile details must fit one viewport.
The older F1 density/span/rectangle/endpoint requirements and the corresponding
C14 geometry receipts now apply to `FULL`; the amended `DEFAULT`/`LOCAL` and
`FULL` predicates above are additional consumer requirements, not replacements
for ontology, inspectability, production-boundary, reopen, Atlas, falsifier, or
cleanup requirements.

### Amended C14 and final-lap resume boundary

C14 remains one falsifier id, `C14`, but it emits separate named receipts for
`model-complete`, `default-projection`, `local-lineage`, `full-lineage`,
`dock-isolation`, `back-to-world`, and `history-authority`. The timed naive
consumer check is the separate `CONSUMER` verdict and is not disguised as a
machine-only C14 receipt.
The clean control must pass every receipt. The `C14` falsifier must corrupt each
named receipt in turn (with the other receipts controlled) and exit nonzero with
that receipt name; this is the required falsification proof for the amended
acceptance, not unconditional receipt printing. The mechanical `model-complete`
receipt compares all 16/20 records from the real production projection and then
repeats the exact selection/Inspect checks after `FULL`; it never infers ontology
truth from the smaller `DEFAULT` paint set.

The paused Builder has one implementation surface: the existing files in
`Exact file boundary`, the focused Pre-R18 gate and its focused tests, and the
fourteen evidence/receipt files already named there. The Builder may implement
only the three projection states, the existing Dock/Canvas presentation and
restoration behavior, and their real-path C14 receipts. Any need for a new
Kernel action/schema/link, a second truth store, a new Canvas engine, new Dock
inventory, unrelated redesign, or a release/package gate is an immediate founder
stop. After the single global repair is consumed, any `PRODUCT`, `EVIDENCE`,
`ATLAS`, or `CONSUMER` failure—or an unresolved product decision—means stop for
Ryan; no third implementation lap or authority expansion exists.

## Founder full consumer UI correction — 2026-08-23

authority: direct founder visual reds from the three 2026-08-23 supplied captures
resume-boundary: amendment-only Reader `YES/YES` is required before the paused
product writer resumes

This final section is founder authority for one coherent consumer treatment of
the **existing** QuantFlow shell, Research Dock, Canvas tiles, cables,
inspectors, and interaction states. It preserves Kernel/Ontology truth, Canvas,
Dock, deterministic `DEFAULT`/`LOCAL`/`FULL` projection, and the exact 16-object/
20-link mechanics. It authorizes no new product, engine, framework, truth store,
runtime, participant, R18 behavior, or rebrand. It supersedes the earlier
`no broad visual redesign` restriction only for these bounded existing surfaces
and only to make their existing product meaning consumer-readable. It is also
Ryan's one explicit post-stop authority for the paused writer to make this final
consumer treatment after the global repair was consumed; it does not replenish
that repair budget. It does not supersede any architecture, provenance,
product-meaning, file-boundary, or proof constraint, and every later red returns
to the existing Ryan stop.

### One consumer reading order and one default tile grammar

At 1600×1000 and 100% zoom, the first reading order is exactly **human Mission →
current workflow stage → participant/Task ownership → evidence → Evaluation →
current Report → technical detail**. Technical detail is deliberate disclosure
in Dock `INSPECT`, never the first visual hierarchy.

Every research-object or participant tile painted in `DEFAULT`, `LOCAL`, or
`FULL` uses the same anatomy: human title; exactly one semantic type badge;
exactly one primary status; zero, one, or two short workflow facts from the table
below; and one selected/unselected presentation state. A control is not a
workflow fact. A combined fact shown below counts as one fact and uses the exact
labelled values in the stated order. Rotated or full ids, duplicate type plus id,
vertical id rails, nested screen chrome, fixture/internal field copy, inline full
details, and repeated `Inspect` actions are forbidden. Full canonical ids and
exact incoming/outgoing `kind, from_id, to_id` triples live in Dock `INSPECT`.
Neither a short nor full id is painted inside the tile anatomy; accessible identity
may reference the canonical id without making it part of the visual hierarchy.

`Human title` has one fallback rule. Use the first non-empty source named below;
where the rule says `humanized kind`, replace `_` or `-` with spaces and title-case
the existing `kind`; if no named source exists, render exactly `Not recorded`.
Never fall back to any id. A referenced object's displayed value uses that same
title rule. `Primary status` uses the stated existing source or derived authority
marker and otherwise renders exactly `Not recorded`.

| Existing object | Human-title precedence | Type badge | Primary status | Workflow facts, in order |
|---|---|---|---|---|
| Mission | `objective`, then `name` unless it is exactly `Founder question` | `MISSION` | existing `status` | `Technique <title>` for the first primary Technique/Strategy in stable `(type, id)` order |
| Task | `title`, then `description` | `TASK` | existing `status` | `Owner <participant title>` from its exact `assigned_to` link |
| participant | shared participant-view `role` | `PARTICIPANT` | shared participant-view runtime | `Task <title>`; `Session <session> · Work <work> · Recovery <recovery>` |
| Run | `name`, `title`, `label`, then humanized `kind` | `RUN` | existing `status` | `Context <Mission title> · <Task title>` from the primary walk |
| Dataset | `name`, `title`, `label`, then humanized `kind` | `DATASET` | existing `status` | `Rows <coverage.record_count>`; `As of <as_of>` |
| raw Artifact | `name`, `title`, `label`, then humanized `kind` | `ARTIFACT` | exactly `RAW UNREVIEWED` | `Producer <title>`; `Source <Run title> · <Task title>` |
| grade or historical Artifact | `name`, `title`, `label`, then humanized `kind` | `ARTIFACT` | `HISTORICAL` when existing history truth applies, otherwise `GRADE ARTIFACT` when an existing `grades_*` link applies | `Producer <title>`; `Source <Run title> · <Task title>` |
| other supporting Artifact | `name`, `title`, `label`, then humanized `kind` | `ARTIFACT` | existing `status`, then the first existing semantic marker, otherwise `Not recorded` | `Producer <title>`; `Source <Run title> · <Task title>` |
| Evaluation | `name`, `title`, `label`, then exactly `Independent evaluation` | `EVALUATION` | existing `verdict` | `Critic <participant title>`; `Confidence <confidence> · Target <Artifact title>` |
| current Report | `name`, `title`, `label`, then exactly `Current report` | `REPORT` | exactly `PUBLISHED CURRENT` | `Gated by <Evaluation title>` |
| historical Report | `name`, `title`, `label`, then exactly `Historical report` | `REPORT` | exactly `HISTORICAL` | `Gated by <Evaluation title>` |
| Technique/Strategy | `family`, `name`, `title`, `label`, then humanized `kind` | `TECHNIQUE` | existing `status` | none |
| Hypothesis | `claim`, `name`, `title`, `label` | `HYPOTHESIS` | existing `status` | none |
| Ticket | `name`, `title`, `label`, `external_ref` | `TICKET` | existing `status`, then existing `grade` | none |

Every enumerated fact slot renders its labelled value; an absent source renders
exactly `Not recorded` in that slot. Labels, fixed fallback phrases, badges, and
derived authority statuses are presentation of existing facts, never new ontology
fields. For Canvas tile anatomy this table supersedes the older Deliverable D/F1
marker strings and the earlier C14 short-id/context-row rectangle predicates
wherever they differ: Canvas uses the exact badge/status text in this table, while
Dock `INSPECT` retains every full id, original semantic marker, and detail.

The Mission tile specifically may not show `missionmission`, a full/rotated id,
`FOCUS`, fixture/internal copy, the generic `Founder question`, or redundant
`Show research` plus `Inspect` actions. It shows the human Mission question,
Mission status, Technique, and `Open workspace`. Selecting the tile opens its
details through the normal `LOCAL` → Dock `INSPECT` behavior; no inline
`Inspect` control is added.

Tile selection has one meaning. Activating ordinary tile body selects that exact
object, enters `LOCAL`, visibly marks only that tile as selected, and opens that
same full-id object in Dock `INSPECT`; it performs no domain IPC. An embedded
control stops propagation and performs only its labelled action. Mission
`Open workspace` is the sole tile action: it reveals or restores that exact
Mission's derived `DEFAULT` workflow through the existing projection path and
performs no Kernel write. From `FULL`, selecting a tile still enters `LOCAL`, and
`Back to world` restores `FULL` as the earlier state table requires.
The selected tile alone carries `data-qf-selected="true"`; every other painted
tile carries `data-qf-selected="false"`, and at least one of its computed outline,
border color, or background color differs from the controlled unselected state.

### Research Dock is the unmistakable front door

The right rail is visibly titled **Research Dock**, with **Research Director**
as its front-door role. Exactly one `START | CATALOG | ACTIVE | INSPECT | HISTORY`
primary pane paints at a time, retaining the existing tab/ARIA isolation contract:

| Mode | Only owned responsibility |
|---|---|
| `START` | a labelled Mission composer, Technique selection, an available-team summary, an obvious `Browse catalog` action, and a useful empty-state next action to compose a Mission or browse the team |
| `CATALOG` | the existing launchable participant-definition inventory only |
| `ACTIVE` | current participants, owned Tasks, compact states, and existing interventions only |
| `INSPECT` | the selected participant/object/relationship, full ids, exact triples, and technical detail only |
| `HISTORY` | closed sessions and prior/historical work only |

`Browse catalog` changes only the Dock mode. START must make the available team
discoverable without first knowing that `CATALOG` exists. Destructive or dangerous
controls remain explicit, labelled, secondary to identity/work, and spatially
separated from selection and ordinary navigation; identity or whitespace never
invokes them.

In `START`, discovery is literal: visible text is exactly `Research Dock` and
`Research Director`; the composer has a visible `Mission` label; the Technique
selector has a visible `Technique` label; the summary reads
`Available team: <N> — <roles>`, where `<N>` equals the count of the same existing
launchable definitions painted by `CATALOG` and `<roles>` is the comma-separated
`display_name`, else `role`, else `Not recorded`, for every one of those
definitions in stable `(rendered name, id)` order (`None recorded` when `<N>` is
zero). A count-only string such as `0 live · 0 closed · 6 launchable` is not this
summary. A visible
button named exactly `Browse catalog` switches to `CATALOG` without domain IPC.
The summary has a non-empty rectangle fully inside `START`, computed font size at
least 12 CSS pixels, and no clipped role name. When no Mission is active, visible
empty-state copy is exactly
`Compose a Mission or browse the available team.` The role-name summary is not a
definition row and exposes no launch control; `CATALOG` retains inventory
ownership. All of these nodes live inside the one `START` `data-dock-primary`
pane, so satisfying discovery cannot weaken one-pane isolation.

The five tab controls remain simultaneously visible with exact text `START`,
`CATALOG`, `ACTIVE`, `INSPECT`, and `HISTORY`; each has a non-empty painted text
rectangle, computed font size at least 12 CSS pixels, no overlap or clipping, and
the one selected tab remains `aria-selected="true"`. Only that tab's primary pane
has painted descendants. Each inactive pane has `display:none` or `hidden`, a
zero-width/zero-height rectangle, no descendant with a non-zero painted rectangle,
and no pointer hit target.

### Five-stage Canvas, projection, and cable contract

`DEFAULT` lays out exactly five visible, left-to-right consumer stages:
**Mission**, **Work**, **Evidence**, **Evaluation**, and **Current Report**. This
stage assignment supersedes the earlier `Mission + Inputs` placement text and
the word `may` for delegation/review/output participant context; it resolves those
members exactly without changing the Kernel-link-derived walking rule:

1. `Mission` contains only the root Mission.
2. `Work` contains the source Task, the exact participant reached by its
   `assigned_to` link, its exact `delegated_by` Director when present, and the
   primary Evaluation's exact `performed_by` critic when present. When that
   Evaluation names a review Task, `Work` also contains that exact Task and its
   exact `assigned_to` participant and `delegated_by` Director; duplicate
   participant ids paint once. Each assigned participant immediately follows its
   owned Task in stable `(type, id)` vertical order; remaining participants follow
   those pairs in the same stable order.
3. `Evidence` contains the primary Run, every Technique/Strategy, Dataset, or
   Hypothesis reached from that Run by the existing `uses`/`tests` links, and the
   raw Artifact reached by its existing `produces` link.
4. `Evaluation` contains only the primary Evaluation reached from that raw
   Artifact by the existing `evaluated_by` link.
5. `Current Report` contains only `current_report_id`, reached from that
   Evaluation by the existing `gates` link.

A participant reached by the exact `Work` walk remains primary Canvas context
even when its session is `closed`, `cancelled`, or `failed`: the honest session,
runtime, work, and recovery values show that condition, and the same id may also
appear in Dock `HISTORY`. This final rule supersedes the earlier history-only
painting rule for those reached primary participants only. Any other closed
session remains outside `DEFAULT` and only in `HISTORY`.

The primary links are exactly these existing traversed records when both endpoints
exist: source Task `belongs_to` Mission, `assigned_to` executor, and
`delegated_by` Director; Director `delegates_to` executor; Run `tests` Hypothesis,
`uses` Dataset/Technique, and `produces` raw Artifact; raw Artifact
`evaluated_by` Evaluation; Evaluation `performed_by` critic and `gates` current
Report; and review Task `assigned_to` critic and `delegated_by` Director. No
same-stage proximity rule adds a link. Missing optional members render no
synthetic tile or cable. Same-stage siblings use stable `(type, id)` order. Every
tile center in an earlier stage has a smaller Canvas x coordinate than every tile
center in the next stage, so evidence-to-judgment order and the last position of
the current Report are measurable. Stage labels are presentation, not stored
truth.

In the populated R17 oracle's `DEFAULT` at 1600×1000, the width of the union
bounding rectangle of all primary tile rectangles divided by usable Canvas
`clientWidth` is in `[0.70, 0.85]`, and its height divided by usable Canvas
`clientHeight` is in `[0.45, 0.70]`. Primary tile rectangles do not overlap. The
empty, starting, and Mission-only states retain the same grammar but are not
required to fill those populated-world ratios. The existing empty Navigator may
collapse after Mission reveal. `Research projection active` means a durable Mission world is
revealed and the projection state is `DEFAULT`, `LOCAL`, or `FULL`. Throughout
that interval the legacy orchestration/handoff overlay and all of its controls
have `display:none` or `hidden`, zero painted rectangle, and no pointer hit target.

`DEFAULT` paints only its derived primary links. In `LOCAL`, every tile and cable
in the exact selected local-lineage set has computed opacity at least `0.80`, and
every unrelated painted current-Mission tile and cable has computed opacity at
most `0.50`. In unselected `FULL`, all exact 16 objects have computed opacity at
least `0.80`, and all exact 20 background cables have computed opacity at most
`0.50`; every object and cable remains pointer-selectable and Dock-inspectable.
Connection detail appears only in Dock `INSPECT`; the Canvas connection-detail
overlay is absent or `display:none`, has a zero painted rectangle, and has no
pointer hit target. Selecting each of the 20 cables from `FULL` remains subject to
F1: its stroke and label may not cross the interior of any unrelated readable
tile, its endpoints retain the 12-pixel tolerance, and its painted height remains
below 90% of usable Canvas height. The same unrelated-tile obstruction rule
applies to every selected cable in `DEFAULT` or `LOCAL`, not only a primary cable.

Human titles, statuses, facts, stage labels, Dock modes, and the visible
`Show full lineage`/`Back to world` controls must be readable at 100% zoom: title
text has computed font size at least 14 CSS pixels; badge, status, fact, stage,
Dock-mode, and control text has computed font size at least 12 CSS pixels; and
each required text rectangle is non-empty, non-overlapping, unclipped inside its
own painted container, and has the visibility/opacity properties already defined
by C14. The existing Glacier identity—dark field, restrained luminous color, and
spatial
Canvas character—remains; consumer hierarchy must no longer read as an IDE,
terminal, ontology debugger, or generic debug graph.

The three founder-capture defects have only these literal meanings:

1. **Tile/hierarchy red:** any painted tile violates the title/badge/status/fact
   table, Mission prohibition, selection behavior, or 14/12-pixel text floor.
2. **Dock/discovery red:** `START` lacks any exact heading, label, team-role
   summary, empty-state copy, or `Browse catalog` behavior above; any of the five
   mode controls is illegible; or an inactive primary pane contributes a painted
   descendant, non-zero rectangle, or pointer target.
3. **Canvas/workflow red:** `DEFAULT` violates the exact stage membership,
   left-to-right order, primary-link set, bounding ratios, non-overlap rule, or
   overlay suppression; `LOCAL` violates its exact set or tile/cable opacity; or
   `FULL` violates 16/20 completeness, background-cable opacity, selection,
   Inspect, endpoint, obstruction, or height rules.

`Bulky graph`, `flat hierarchy`, `tiny metadata`, `internal Mission copy/id
rails`, `duplicate actions`, `Canvas overlays`, `visually absent Dock/team
inventory`, and `reads as an IDE, terminal, ontology debugger, or debug graph`
are shorthand for one or more of those three reds, not an additional taste or
gestalt veto.

The existing named C14 receipts own the new mechanical predicates without adding
another falsifier id:

| Receipt | Required independent predicate keys |
|---|---|
| `default-projection` | `tile-title`, `tile-badge`, `tile-status`, `tile-facts`, `mission-action`, `text-size`, `stage-membership`, `stage-order`, `stage-bounds`, `tile-nonoverlap`, `primary-links`, `legacy-overlay`, `connection-overlay`, `selected-cable-obstruction` |
| `local-lineage` | `selected-subject`, `selected-tile`, `exact-local-set`, `local-tile-opacity`, `local-cable-opacity`, `unrelated-tile-opacity`, `unrelated-cable-opacity`, `control-no-propagation`, `inspect-match` |
| `full-lineage` | `objects-16`, `links-20`, `object-opacity`, `background-cable-opacity`, `object-select-inspect`, `link-select-inspect`, `endpoint-tolerance`, `unrelated-tile-obstruction`, `painted-height` |
| `dock-isolation` | `one-pane`, `inactive-zero-rects`, `mode-tabs`, `dock-title`, `director-role`, `mission-label`, `technique-label`, `team-count`, `team-roles`, `browse-catalog`, `empty-next-action`, `no-start-inventory-rows` |

`model-complete`, `back-to-world`, and `history-authority` keep their earlier
exact meanings. For each predicate key above, that named C14 falsifier invocation
must corrupt only that key, evaluate the whole production receipt, print
`C14/<receipt>/<key>=RED`, restore the controlled state, and continue through all
keys; it exits nonzero after the finite mutation set. A missing key output, a
green corrupted key, corruption of a different key, hidden test-only style, or
unconditional print is red. Thus one red transcript per existing C14 subcase may
contain its finite independent mutation matrix without creating new top-level
subcases. The clean control prints every key `PASS` from real DOM/SVG facts.
For `tile-title`, `tile-badge`, `tile-status`, and `tile-facts`, the matrix iterates
every applicable object row and every displayed/missing slot across the R17 oracle
and the isolated current/historical fixture, printing the object type and slot in
each red receipt. `selected-cable-obstruction` iterates every painted `DEFAULT`
primary cable, and the corresponding `FULL` keys iterate all exact 20 cables.

All fourteen named screenshots and their manifest must be regenerated from the
same final candidate bytes and demonstrate the applicable predicate keys; a
capture or manifest inherited from an earlier candidate makes `EVIDENCE=FAIL`.

### Final verdicts and immutable visual check

Reports carry exactly four independently green or red verdicts:

```text
PRODUCT
EVIDENCE
ATLAS
CONSUMER-READINESS
```

`CONSUMER-READINESS` is the final name for the earlier `CONSUMER` verdict; it does
not add a fifth verdict or weaken the existing timed check. From this amendment
forward, every earlier `CONSUMER` token—including evidence classification and stop
language—means this same `CONSUMER-READINESS` verdict, and reports print only the
final name. `CONSUMER-READINESS` is one normal-app check with two conjunctive
parts: all three literal founder-capture defect groups above are absent, and one
naive consumer answers this fixed union of the earlier prompts without an
architecture briefing: (1) QuantFlow is a persistent research world rather than
an IDE, terminal manager, or agent launcher; (2) the visible Mission question and
current one of the five stages; (3) the distinct jobs of Dock and Canvas; (4) for
each visible participant, role, reason, owned Task, runtime, and work state; (5)
the Run, raw Artifact, Evaluation critic/verdict/target, current published Report,
and any visible historical work; (6) the kind and direction of the selected
cable; and (7) one visible existing Inspect, `Show full lineage`, or Dock action
and what it reveals or advances. The 30-second clock and stopping rule remain the
ones already defined. Any omitted or wrong answer, elapsed time over 30 seconds,
or any literal capture red is `CONSUMER-READINESS=FAIL`; only completion of both
parts is `PASS`.

The final visual acceptance is a normal-app Computer Use check against an
immutable candidate SHA after mechanical proof is green. Record candidate SHA,
viewport, zoom, state, and result. If the Computer Use helper fails, restart the
helper and normal app once and retry the **same candidate bytes**, viewport, zoom,
and data roots. A helper/tool failure before the consumer check completes is
recorded as environment noise, not as evidence that the product passed or failed;
the first such attempt receives no verdict. There are at most two total attempts,
matching AUTONOMY's two-attempt stop. If the retry also cannot complete,
`CONSUMER-READINESS=FAIL cause=ENVIRONMENT` and the order stops for Ryan without
authorizing a product edit. A completed check with any wrong answer or literal
visual red is `CONSUMER-READINESS=FAIL` and the same stop applies. Any byte change
invalidates the attempt and requires a new candidate plus all applicable proof,
but because the global repair remains consumed, only a new explicit Ryan
amendment can authorize those changed bytes.

### Amendment-only Reader gate

Before the paused product writer resumes, a fresh independent Reader reads this
final section together with the still-governing order and answers exactly:

1. `YES` or `NO`: Is every authorized visual change confined to the existing
   shell, Research Dock, Canvas tiles/cables/inspectors, and interaction states,
   with Kernel/Ontology truth and the deterministic 16/20 projection preserved?
2. `YES` or `NO`: Are the tile facts, five Dock responsibilities, five-stage
   `DEFAULT`, `LOCAL`/`FULL` behavior, four verdicts, consumer red conditions, and
   immutable Computer Use retry boundary finite and one-meaning without adding
   product or R18 authority?

Only amendment-specific `YES/YES` recorded against the exact order SHA authorizes
the product writer to resume. Either `NO`, a stale receipt, or a receipt against
different bytes keeps the writer paused for Ryan; the writer may not self-read or
self-authorize. Once that exact receipt lands, the current `NEXT.md` authority is
sufficient for the same paused writer to implement this one founder-authorized
treatment by continuing from its five existing dirty product/proof files and
touching only the already authorized `Exact file boundary` and evidence paths. No
additional product decision, repair allocation, Builder replacement, or
`NEXT.md` rotation is required. The writer then produces one immutable candidate
and stops; it may not repair any subsequent `PRODUCT`, `EVIDENCE`, `ATLAS`, or
`CONSUMER-READINESS` red without new explicit Ryan authority.

## Closure receipt — 2026-08-23

Disposition: **DONE / ACCEPTED**. This non-rung correction is closed by the
founder-delegated closure authority in the current task; no product, Atlas,
test, oracle, screenshot, manifest, or future-rung implementation was changed
by this closure.

### Immutable receipts

- **PRODUCT — PASS:** independent Verifier accepted candidate
  `eecb2457eef6a71d888129c0bb353129956478d1`; exact DEFAULT `13/13`, LOCAL
  `9/dim7`, FULL `16/20`, C01–C14 PASS, focused `43 pass / 0 fail / 288`
  expectations, both named falsifiers red then green, Atlas HARD RED `0`.
- **EVIDENCE — PASS:** independent evidence receipt accepted exactly 16
  evidence-only files: 14 unique `1600×1000` screenshots totaling `651,912`
  bytes, all displaying `eecb245`; doc-links PASS `73`; cleanup zero; product
  and Atlas bytes unchanged.
- **CONSUMER-READINESS — PASS:** fresh normal-app consumer task
  `01a03155-e0d2-7421-80e0-cb9369f32775` understood the research-world
  hierarchy, Canvas/Dock split, participant and evidence authority, FULL
  LINEAGE/Back to world behavior, and all five Dock modes without contradiction
  or dangerous action.
- **CLEANUP — PASS:** final isolated cleanup stopped PID `29488` and its 15
  descendants; target processes `0`; isolated root absent; repository remained
  clean at `dcc85c3` with local equal to origin.
- **CLOSURE AUTHORITY — RECORDED:** the founder-delegated current task
  explicitly authorizes this documentation-only closure and requires R18 to
  remain pending and unauthorized until Ryan and Router regroup.

Closure receipt: [FINAL-ACCEPTANCE.md](evidence/pre-r18-coherence/FINAL-ACCEPTANCE.md).
