# WO-PRE-R18-COHERENCE — Make the accepted R17 world tell one honest story

status: DRAFT — semantic Reader pending; no implementation authority
kind: bounded non-rung correction
branch: `wo-pre-r18-coherence`
base: accepted R17 closure `4d25fa3df91964fc90223a135d8969ebd61c5374`
product-baseline: accepted R17 candidate `83cb58501670ec5e5551ed9a45b5f54aa038261a`
depends: [R17 final acceptance](evidence/r17/FINAL-ACCEPTANCE.md)
baseline-receipt: [accepted product byte equivalence](evidence/pre-r18-coherence/BASELINE-BYTE-EQUIVALENCE.md)
cleanup-receipt: [exact audit-residue cleanup](evidence/pre-r18-coherence/AUDIT-RESIDUE-CLEANUP.md)
authorization: founder command on 2026-08-23; implementation begins only after Reader `YES/YES` and temporary `NEXT.md` rotation
rework-budget: one bounded repair after the naive-user check; the same semantic assertion failing twice is a founder stop

## In plain terms

The accepted R17 product already contains the research world. This correction
makes that world understandable without an architecture briefing. A durable
Mission appears immediately; Dock and Canvas describe each participant with the
same honest state; and raw evidence, independent judgment, the current published
conclusion, and historical work cannot be mistaken for one another.

This order does not redesign QuantFlow. It corrects three comprehension defects
in the existing shell and records two stale Atlas statements plus the accepted
mouse-first product authority. R18 remains pending.

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

**Session state** is `active | closed` and comes from the existing AgentSession
projection.

**Runtime state** is `starting | running | stopped | unavailable` and is derived
from existing launch/session/runtime facts. It is not a new persisted state.

**Work state** is `unassigned | working | waiting | blocked | completed` and is
derived from existing Mission, Task, assignment, and completion facts. During a
durable Mission's startup, a Director with no assigned Task is truthfully
`planning` in presentation copy; the persisted work axis remains `unassigned`.

**Recovery state** is `restartable | not restartable` and comes from existing
profile/runtime availability and session facts.

**Raw Artifact** is inspectable participant output that has not itself become an
accepted conclusion.

**Evaluation** is independent judgment over an exact Artifact.

**Published Report** is the current governed conclusion for its Mission.

**Historical** means durable prior or superseded work. Historical objects remain
inspectable but may not look current.

## Deliverables

### A — Correct current product authority and Atlas status in one docs-only commit

Change only these authority surfaces plus a compact receipt:

- `qf-atlas/AGENT_BOOT.md`: replace the stale statement that Atlas v1 acceptance
  and its verification/baseline receipts are pending with the accepted current
  status. Do not change Atlas capability or policy.
- `qf-atlas/OPERATING_MANUAL.md`: make the same bounded current-status correction.
- `docs/PRODUCT.md`: replace global pointer/keyboard parity as a current product
  claim with the accepted mouse-first contract. Normal text and terminal input
  must work after mouse focus, and focus may not become trapped. Full global
  keyboard-navigation parity remains pre-release debt already recorded as
  `docs/DEBT.md` item 38.
- `docs/orders/evidence/pre-r18-coherence/DOCUMENTATION-CORRECTION.md`:
  identify the exact old claims, new claims, and authority receipts.

This commit contains no product code, generated Atlas model, baseline mutation,
or unrelated documentation cleanup.

### B — Reveal the durable Mission immediately through the existing world projection

After the normal Research Director submission boundary returns a durable Mission
id, reveal that Mission through the existing `researchWorldController.reveal`
path. The Canvas must leave the unexplained landing state without waiting for a
worker, Artifact, ledger click, or refresh.

The revealed world uses only Kernel-owned Mission, Task, participant, object, and
link facts. Do not add a UI truth store, synthetic Mission, optimistic domain row,
new ontology type, or direct renderer write. A failed submission leaves the
previous Canvas intact and shows the existing error path.

Close/reopen must reconstruct the same durable Mission world through the existing
hydrate/projection boundary; no replay-only browser state is accepted.

### C — Use one honest participant projection in Dock and Canvas

Create or reuse one pure derived participant view consumed by both Dock session
rows and Canvas participant tiles. It must expose, from existing facts:

- role first and runtime second;
- recruiter or creation reason when that fact exists;
- owned Task, or truthful Mission-startup copy when the Director is planning;
- distinct session, runtime, work, and recovery axes;
- produced Artifact/output when linked;
- only the interventions the current participant supports.

Dock and Canvas must render the same values for the same participant id. A live
session cannot render `stopped` on one surface. A closed runtime may still render
completed work and `restartable`; those are different axes. Unknown or absent
facts are labeled honestly, never inferred from CSS, elapsed time, terminal text,
or display position.

Keep one identity across AgentSession, Dock row, participant tile, Task ownership,
terminal, and ledger. No duplicate display participant is permitted.

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

Cancel, close, restart, and similarly dangerous session actions must be explicit,
labeled targets. Clicking participant identity or whitespace may select/inspect;
it may not execute a destructive action.

### F — Clarify only existing semantic cables

Existing research-world links may gain readable semantic labels, direction, and
selection emphasis. Inactive/background and historical cables may be visually
subordinate only where current projection truth supports that distinction.

Do not add or rename link kinds, alter stored direction, replace the Canvas engine,
or create a second relationship model.

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

The gate must be able to fail independently on at least these conditions:

1. durable Mission does not replace the landing state;
2. Director startup renders unexplained `No task`;
3. Dock and Canvas disagree on any of the four participant axes;
4. raw Artifact is presented as the current governed conclusion;
5. Evaluation or published Report lacks its authority marker;
6. historical work is presented as current;
7. multiple full Dock responsibilities are expanded together;
8. a session-row identity/whitespace click triggers a destructive action;
9. terminal focus prevents returning to the Canvas by mouse;
10. close/reopen does not restore the same Mission-local world.

The gate prints one named receipt per condition plus the tested commit, Mission id,
participant id, object ids, and `cleanup=clean`. One process boot is preferred;
proof scaffolding may not take longer than the correction it protects.

## Exact file boundary

Product edits are limited to the existing shell and its focused proof surfaces:

- `collab-electron/src/windows/shell/index.html`;
- `collab-electron/src/windows/shell/src/dock.js`;
- `collab-electron/src/windows/shell/src/research-world.js`;
- `collab-electron/src/windows/shell/src/tile-renderer.js`;
- `collab-electron/src/windows/shell/src/task-composition.js`;
- `collab-electron/src/windows/shell/src/renderer.js` only for existing controller wiring;
- `collab-electron/src/windows/shell/src/shell.css`;
- an adjacent pure participant-projection helper and focused unit test if sharing
  the derivation cannot be done honestly inside the listed modules;
- one focused `qa/gates/pre-r18-coherence.ts` gate and its registry/allowlist entry;
- `docs/DESIGN.md` only for the bounded current-state visual contract;
- optimized `docs/orders/evidence/pre-r18-coherence/` screenshots and receipts.

Any need to change Kernel actions, schema, ontology/link vocabulary, preload/Main
contracts beyond invoking the existing submission/reveal boundaries, runtime
adapters, Dock inventory, or another product window is a founder stop.

## Builder proof

Run the smallest focused checks while building. Before handoff, run exactly:

```powershell
bun qa/run.ts pre-r18-coherence
bun qa/run.ts research-world-visible
bun qa/run.ts team-composition-ui
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts kernel-sole-writer
bun qa/run.ts one-skin
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
bun qa/run.ts doc-links
git diff --check 4d25fa3df91964fc90223a135d8969ebd61c5374..HEAD
git diff --check
```

No release, installer, packaged-app, broad accessibility, soak, or full-suite gate
is authorized. A mechanical gate defect that does not change product or acceptance
meaning stays inside this build cycle.

Builder writes
`docs/orders/evidence/pre-r18-coherence/BUILDER-EVIDENCE.md` with commands, exits,
named receipts, candidate SHA, changed files by defect, screenshot manifest, and
clean-shutdown result. The tree is clean and the candidate is immutable before
verification.

## Independent verification

One fresh Verifier receives this order, `PROTOCOL.md`, the immutable candidate SHA,
and the Builder evidence—not Builder chat reasoning. It reruns the exact matrix,
checks the ten falsifiable conditions against the normal product path, verifies
the commit boundaries, and confirms the worktree starts and ends on the same SHA.

Any red receipt stops verification and returns the named defect to the same bounded
order. If the same semantic assertion fails again after one repair, stop for Ryan.

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
central correction is red. At most one bounded repair is allowed for a wrong action,
false belief, missing approved projection, or visual interference directly mapped
to the three owned defects. All other visual polish becomes debt and cannot delay
R18.

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

On `ACCEPT`, write
`docs/orders/evidence/pre-r18-coherence/FINAL-ACCEPTANCE.md`, mark this non-rung
order complete, rotate `NEXT.md` and the documented ladder to R18 Compose, preserve
the existing recall draft as draft-only R19 material where still valid, and then
open only the bounded R18 order/Reader loop. R19–R21 receive route-level outcomes,
not build authority.

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
