# WO-PRE-R18-COHERENCE — Make the accepted R17 world tell one honest story

status: REWORK — independent Round 1 red; single global repair commit now in use
kind: bounded non-rung correction
branch: `wo-pre-r18-coherence`
base: accepted R17 closure `4d25fa3df91964fc90223a135d8969ebd61c5374`
product-baseline: accepted R17 candidate `83cb58501670ec5e5551ed9a45b5f54aa038261a`
depends: [R17 final acceptance](evidence/r17/FINAL-ACCEPTANCE.md)
baseline-receipt: [accepted product byte equivalence](evidence/pre-r18-coherence/BASELINE-BYTE-EQUIVALENCE.md)
cleanup-receipt: [exact audit-residue cleanup](evidence/pre-r18-coherence/AUDIT-RESIDUE-CLEANUP.md)
authorization: founder command on 2026-08-23; implementation begins only after Reader `YES/YES` and temporary `NEXT.md` rotation
reader-receipt: [YES/YES at `afe9b36`](evidence/pre-r18-coherence/READER-ACCEPTANCE.md)
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

At the locked 1600×1000 viewport and 100% zoom, the populated Mission view must:

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

The populated fixture is exactly the accepted R17 literal oracle
`qa/oracles/r17-technique-outcome.json` at SHA-256
`038a68c2508d3d671a60a1ab3d562d8d387e70ed08e582a4cca2e7fbf0519fa7`:
all 16 resolved object records and all 20 resolved link records, with no count-only
substitute. `Usable Canvas` means the research Canvas element's measured
`clientWidth` and `clientHeight`. A `vertical band` is any closed x interval whose
width equals the median rendered tile width; the gate computes the maximum object-
center occupancy over every such interval. A cable `anchor` is the existing
`portPosition` source or target point used by the Glacier cable renderer, in Canvas
CSS pixels.

Selecting each of the 16 objects in turn must make `INSPECT` show its full id and
the complete set of incoming/outgoing `kind, from_id, to_id` triples from the
resolved 20-link oracle. Selecting each of the 20 links must show its kind,
direction, source label/id, and target label/id. The selected cable's painted
geometry may not intersect the interior of an unrelated tile and its painted
bounding height must remain below 90% of usable Canvas height.

These requirements may adjust only the current layout calculation, tile anatomy,
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

The gate supports `QF_PRE_R18_COHERENCE_FALSIFY=C01` through `C14`. The unmodified
control exits zero. Each falsifier corrupts only its named condition and must exit
nonzero with that condition's name. Builder evidence includes the control output
and all fourteen red outputs; unconditional receipt printing is a gate defect.

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
14. at 1600×1000 and 100% zoom, the resolved world differs from any of the literal
    oracle's 16 object or 20 link records; tile-center span is below 45% on either
    measured Canvas axis; more than 60% of centers occupy one median-width vertical
    band; any pair of tile rectangles intersects; Dock text escapes/intersects its
    row or action rectangle; any required tile/relationship label is absent;
    `INSPECT` omits or invents any incoming/outgoing triple for any object or any
    kind/direction/source/target detail for any link; an SVG endpoint lies more than
    12 CSS pixels from its existing `portPosition` anchor; the selected painted
    stroke or label intersects an unrelated tile interior; or the selected stroke's
    painted bounding height is at least 90% of measured Canvas height.

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
the documentation semantic-check output, the control plus C01–C14 red outputs,
named production-boundary receipts, Atlas before/after/diff results, candidate SHA,
changed files by defect, screenshot manifest, and clean-shutdown result. The tree
is clean and the candidate is immutable before verification.

## Independent verification

One fresh Verifier receives this order, `PROTOCOL.md`, the immutable candidate SHA,
and the Builder evidence—not Builder chat reasoning. It reruns the exact matrix,
checks the fourteen falsifiable conditions against the normal product path, verifies
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
2. Select all 16 objects and all 20 links in the live DOM and compare every
   required `INSPECT` field/triple. Measure C14 from actual DOM/SVG rectangles,
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
