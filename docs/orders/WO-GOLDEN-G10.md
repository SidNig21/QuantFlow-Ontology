# WO-GOLDEN-G10 — Current Canvas/Mission/runtime coherence

status: DIAGNOSTIC-ONLY GATE MEASUREMENT AUTHORIZED — same Reader YES / YES at 8c6c2df; one bounded diagnostic edit/run; one independent Verifier remains required afterward
kind: Golden Baseline Phase 2 bounded current-product coherence group
owner: Router
depends: G9 CLOSED / PASS WITH G12 INHERITED RED
build-authority: **YES — exactly one diagnostic-only edit/run is authorized in `qa/gates/golden-g10-canvas-runtime.ts`; no new semantic Reader, no product/semantic repair, no scope expansion, and one fresh independent Verifier must follow**
reader-task: `01a04a11-0b55-79b3-b6c0-55285177dd55`
reader-authority: `43e0c779e4b255624eefd021716d2afe5245020e`
reader-verdict: **NO / NO — six finite amendments required; no Builder authority**
reader-reread: **SATISFIED IN ROUND 3 — the same Reader reread this order and NEXT.md and returned YES / YES; no substitute Reader is authorized**
reader-round-2-authority: `f7c1457ddcaab927a146293a3744f252ccd37fd4`
reader-round-2-verdict: **NO / NO — exact gate-registration file, live snapshot route, and consumer/allowlist boundary still required**
reader-round-2-reread: **SATISFIED IN ROUND 3 — the same Reader reread this Round-2 amendment and NEXT.md and returned YES / YES; no substitute Reader is authorized**
reader-round-3-task: `01a04a11-0b55-79b3-b6c0-55285177dd55`
reader-round-3-authority: `4ec9301ad2c6eec169c6dbfbc93c29b880ca7a64`
reader-round-3-verdict: **YES / YES — all prior amendments remain intact; exactly one bounded G10 Builder is authorized and one independent Verifier must follow**
reader-round-3-reread: **SATISFIED — same Reader reread this order and NEXT.md at the Round-3 authority above**
adjudication-task: `01a04b3c-4db1-7a93-b618-21890b79bb26`
adjudication-authority: `222af07635e4566eb66b802cbcc3750be828d001`
adjudication-result: **C + D — fixture/driver sequencing plus cleanup mechanics; not a product or Kernel regression**
adjudication-failed-twice: **the same R16 "Kernel-owned director-to-executor delegation link" assertion failed twice**
repair-authority: **HISTORICAL — one same-meaning fixture/driver-only repair was authorized by C + D; superseded by the B-primary lineage amendment below; Builder now closed pending Reader YES / YES**
repair-surface: **HISTORICAL — existing G10 fixture/driver and directly caused evidence only; the current product-helper surface is named below**
lineage-adjudication-task: `01a04b63-f4c6-7fd3-b6a8-f429f0e6aed1`
lineage-adjudication-authority: `9886a1225f2cf2c5ee713c6d2329fda0ac2ef9d2`
lineage-adjudication-result: **B primary with D/C secondary — retained accepted R16 helper artifact-lineage defect; helper precondition misuse and G10 fixture/driver selection are secondary; not a G10 product/Kernel regression**
lineage-repair-authority: **OPEN — exactly one bounded product-helper repair Builder for the accepted two-artifact/pre-admission lineage contract, with one fresh independent Verifier afterward; no second Builder or scope expansion**
lineage-repair-surface: **only `collab-electron/src/main/kernel.ts` helper, existing `qa/gates/golden-g10-canvas-runtime.ts`, and `collab-electron/src/main/research-world.test.ts` only if the smallest focused test is needed; directly caused G10 evidence only**
lineage-reader-task: `01a04b77-cb43-7792-a225-2a7d57ef068c`
lineage-reader-authority: `db30a28d912f2e49e39802340993e17c62132f87`
lineage-reader-verdict: **HISTORICAL NO / NO — exact completed source-Task event/receipt lineage was not required to refuse before review Task/Evaluation/Report mutation; superseded by the same Reader's accepted reread below**
lineage-reader-reread-authority: `45cffba08f9990ef90c4273daa59ea5c4107ec61`
lineage-reader-reread-verdict: **YES / YES — the same Reader reread this amendment and NEXT.md; one meaning and fail-capable pre-admission acceptance remain intact**
lineage-reader-reread: **SATISFIED — same Reader reread at authority `45cffba08f9990ef90c4273daa59ea5c4107ec61`; exactly one bounded Builder reopened and one fresh independent Verifier is required afterward**
ordinary-adjudication-task: `01a04b99-46a1-7c00-a10d-b2d7b5c81dab`
ordinary-adjudication-authority: `f2ce7505ff53be883a78f4d463b0cb745c11aab1`
ordinary-adjudication-classification: **A primary — G10 cold-launch ordinary-Canvas product defect; D secondary — gate boundary-label ambiguity; accepted meaning unchanged**
ordinary-adjudication-result: **the app is internally ordinary but the DOM never publishes `ORDINARY_CANVAS` on cold launch because `hydrateSaved()` is conditional on saved state; the direct Main RPC does not invoke the Dock Mission reveal callback**
ordinary-repair-authority: **OPEN — same-order G10 Builder reopened for exactly one repair, with no new semantic Reader; one fresh independent Verifier afterward**
ordinary-repair-surface: **only `collab-electron/src/windows/shell/src/renderer.js` and `qa/gates/golden-g10-canvas-runtime.ts`; no other implementation, test, gate, or authority surface is authorized by this amendment**
browser-adjudication-task: `01a04baf-2dc7-7a70-95df-0e9405405048`
browser-adjudication-authority: `52a914206d9c4cb7d23dcc60ed31e50641cfaf6c`
browser-adjudication-classification: **C primary — fixture/setup defect; D secondary — diagnostic label only; no product defect or G10 meaning change**
browser-adjudication-result: **the gate used a blocked `data:` URL, so the DOM tile existed but no real browser webview or webContentsId was created; readiness is Main `!isLoading` or `did-finish-load`**
browser-repair-authority: **OPEN — same-order G10 Builder reopened for exactly one gate-only repair; one fresh independent Verifier afterward**
browser-repair-surface: **only `qa/gates/golden-g10-canvas-runtime.ts`; no timeout increase, blocked-URL policy change, source-only bait, weakened assertion, or other file is authorized**
mission-adjudication-task: `01a04bca-ad71-7b60-a475-5f014858cd5e`
mission-adjudication-authority: `58757be642f81d03c810449e9c8aebfa1d24bc02`
mission-adjudication-classification: **C primary — fixture/call/timing defect; D secondary — diagnostic label only; Mission/Kernel projection healthy and no meaning change**
mission-adjudication-result: **`openMission` returns `false` when the exact Mission control is not yet present; `waitFor()` treats only `null` as retry, so no click occurs and the gate reports a misleading CURRENT_MISSION timeout**
mission-repair-authority: **HISTORICAL/RETAINED — the exact `return null` gate correction remains binding; the current Builder step is held by the pending visible-HISTORY consumer-path amendment below**
mission-repair-surface: **only `qa/gates/golden-g10-canvas-runtime.ts`; change the missing-control branch to return `null` and preserve the exact missionId/button selector, click, state assertions, and timeouts**
barrier-adjudication-task: `01a04bdd-5dfb-70c2-aa6e-ac7e418e7c33`
barrier-adjudication-authority: `dcc4bad6f3e92870d9a9d1ee84a2548d48f21406`
barrier-adjudication-classification: **HISTORICAL/SUPERSEDED — prior C primary/D secondary renderer-initialization finding; its zero-row/button causal premise was falsified by the fresh live adjudication below**
barrier-adjudication-result: **SUPERSEDED — bypassing the pre-seed ordinary-render barrier while explicitly selecting visible `HISTORY` produced `exactMissionRows=1`, `exactMissionButtons=1`, and green cleanup; the barrier is not causal acceptance**
history-adjudication-task: `01a04c05-febe-7ca3-ac21-f364e0197768`
history-adjudication-authority: `444d5fab3a0f3b3b6b08eb2efc6e8342c6be5a59`
history-adjudication-classification: **C primary — visible consumer-path fixture/driver defect; D secondary — prior diagnostic boundary; Mission/Kernel projection healthy and accepted meaning unchanged**
history-adjudication-result: **the old global `openMission` path omitted visible `HISTORY` selection; after selecting the visible tab and pane, the bypass still yielded exactly one Mission row and one exact button with green cleanup**
history-reader-task: `01a04bf8-eaba-7e53-8563-95d85d0f078a`
history-reader-authority: `8c6c2df0910fa6c777df19cd15cd8dd245f10c66`
history-reader-verdict: **YES / YES — visible `HISTORY` red/green is proven; the later generic `RPC timeout: app.ui.evaluate` is D insufficient diagnostics, not a product defect; no new semantic Reader is required**
diagnostic-adjudication-task: `01a04c1c-ae43-7dd0-a773-4d6961fa9e4f`
diagnostic-adjudication-authority: `8c6c2df0910fa6c777df19cd15cd8dd245f10c66`
diagnostic-adjudication-classification: **D primary — insufficient diagnostics; C is only a conditional mechanical F11 hypothesis; A, B, and E are unsupported**
diagnostic-adjudication-result: **the generic `RPC timeout: app.ui.evaluate` does not identify the post-HISTORY phase and is not evidence of a product defect; add phase-specific receipts before any repair decision**
barrier-reader-task: `01a04a11-0b55-79b3-b6c0-55285177dd55`
barrier-reader-requirement: **SATISFIED — the same Reader task `01a04bf8-eaba-7e53-8563-95d85d0f078a` returned YES / YES at authority `8c6c2df0910fa6c777df19cd15cd8dd245f10c66`; this diagnostic-only amendment requires no new semantic Reader**
barrier-repair-authority: **HISTORICAL/SUPERSEDED — the visible-HISTORY consumer-path amendment is accepted; current authority is the one diagnostic-only phase/readiness measurement below, with any product/semantic red stopping work**
barrier-repair-surface: **only `qa/gates/golden-g10-canvas-runtime.ts`; diagnostic phase labels and existing browser identity/readiness receipts only; no timeout, product, selector, assertion, semantic, cleanup, or scope change**
phase-1-audited-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase-1-disposition: Current Canvas/Mission/runtime coherence group from the audited Phase-2 disposition
accepted-g9-candidate: `3c17e5d380fd267270cbacf851999cc98bf30638`
accepted-g9-product-tree: `d380c7b4655c53cd6e51de0c2112ae99885f0e3d`
accepted-g9-evidence-head: `83311bf0be15c0d18d102072e1528c4b5432cde2`
accepted-g9-evidence-tree: `0bba13e124565cfa5052aa79a0d47da2b4bc9c1f`
g9-acceptance: [G9 closed acceptance](evidence/golden-baseline/g9/GROUP-ACCEPTANCE.md)
evidence-directory: `docs/orders/evidence/golden-baseline/g10/`
rollback-boundary: accepted G9 candidate above; no shared-history reset or user-state deletion

## Plain-language outcome

Ryan can use the ordinary Canvas, deliberately open a Mission workflow or its
full lineage, return to the familiar terminal workspace, and understand which
participants are actually live. The Dock and Canvas describe the same
Kernel-owned Mission, Task, Dataset, Technique, producer, and Report facts;
missing facts remain honestly missing. Closing and reopening does not silently
hide the workspace or claim that a dead runtime is running.

This is a current-product health correction before R18. It is not a new rung,
new Canvas engine, new ontology type, new state store, new acquisition feature,
or package/operations qualification.

## Authority and ownership

The Phase-1 audited disposition identified the retained Canvas, Dock,
participant/session tile, terminal, Mission, and runtime surfaces as current
product with named health defects. The surgical Phase-2 plan assigns G10:

1. Mission/full-lineage projection as an explicit view inside the ordinary
   Canvas;
2. a real return to the familiar terminal/workspace view;
3. no automatic irreversible hiding on submission or reopen;
4. liveness from real runtime observation, with persisted session, work, and
   recovery axes kept distinct;
5. existing Mission/Task/Dataset/Technique/producer relations projected rather
   than rendered as `Not recorded`; and
6. deterministic current-workflow and full-lineage views of the same Kernel
   truth.

G7 also routed these five retained Canvas/browser rows to G10:
`browserEvaluate`, `browserInfo`, `browserScroll`, `browserWait`, and
`focusAgentSession`. G10 owns their current Canvas boundary proof; it does not
become a general protocol-contraction or browser-product order.

G9 is closed and owns Report publication/current-history semantics. G10 may
read and project the accepted `current_report_id` and Mission-local `report_ids`
but may not change publication, Evaluation, gates, Report lineage, or current /
historical selection. The exact packaged QuantFlow/Node shutdown survivor is an
open G12 red: launcher PID `30512` exited `0`; packaged `QuantFlow.exe` PID
`17316` and descendant Node PIDs `30836`, `20836`, and `30096` survived;
`roots_remaining=0` and `leaked=[]`. G10 must not repair or relabel it.

## Defects in scope

### A — Ordinary Canvas and explicit Mission view

The Canvas modes are finite and explicit. `ORDINARY_CANVAS` means the research
projection is inactive; every pre-existing non-research tile container remains
present, visually visible, not `aria-hidden="true"`, and pointer-enabled.
`CURRENT_MISSION` and `FULL_LINEAGE` are explicit projection modes.
`Back to world` restores `ORDINARY_CANVAS`; `DEFAULT` is not an alias for any of these
modes. F01–F03 must assert these exact DOM predicates before and after
submission and cold reopen.

The current path may call `researchWorldController.reveal` immediately after
submission and may make the Mission projection behave as an exclusive layer.
G10 must make the Mission/current-workflow and full-lineage projections explicit
Canvas views. Ordinary terminal and workspace tiles remain reachable. A clearly
labeled return action restores the ordinary workspace without deleting the
Mission or its saved objects. A failed submission leaves the prior Canvas and
uses the existing error path.

Submission may reveal a Mission view as an explicit result of the successful
submission boundary, but no renderer state may become domain truth. On cold
reopen, the app must not silently re-enter an exclusive Mission projection;
the durable Mission remains discoverable through the existing Canvas/Dock path.
The view state is ephemeral and may reset to the ordinary workspace.

### B — Truthful participant/runtime axes

Runtime liveness is a read-only Main-owned observation keyed by the exact
`agent_session.id`, backed by the live-session registry. Dock, Canvas, and
Inspect receive the same observation snapshot. `live=true` is the only
condition that may establish Runtime `running`; persisted status, terminal text,
and elapsed time never establish liveness. The proof covers both `native_tui`
and `host_acp`; if either is excluded, the order must name that exact exclusion
and render its runtime result exactly `Not recorded`.

The exact read-only snapshot route is Main `qf:sessions:runtime-snapshot` in
`collab-electron/src/main/ipc-kernel.ts` → the shell preload
`window.shellApi.qf.getRuntimeSnapshot()` in
`collab-electron/src/preload/shell.ts` → the shell Canvas renderer in
`collab-electron/src/windows/shell/src/renderer.js`. The Main handler reads the
existing `collab-electron/src/main/agent-host.ts` live registry and returns a
sorted `Array<{ sessionId: string; live: boolean }>` keyed by exact
`agent_session.id`; it is read-only and never derives `live` from persisted
status, terminal text, or elapsed time. The shared type is frozen in
`collab-electron/packages/shared/src/window-api.d.ts`. Dock, Canvas, and Inspect
must consume that one snapshot through `participant-projection.js`; no one of
the three may fetch or derive a separate liveness value.

Use the existing participant projection contract or one pure equivalent shared
by Dock, Canvas, and Inspect. `agent_session.status` supplies the persisted Session axis;
the current runtime observation supplies Runtime liveness; Task ownership and
review state supply Work; profile availability and process state supply
Recovery. A persisted `running` session without a live process must not render
Runtime `running`. A live process must render Runtime `running`; after exit it
must render `stopped`, `starting`, or `unavailable` according to the existing
source facts, never by elapsed time or terminal prose.

The four axes remain separately visible and stable across Dock, Canvas, and
inspect. An ordinary unassigned participant is not the submission Director;
missing facts render exactly the existing honest fallback, not an inferred
healthy value. The same `agent_session.id` remains the participant identity
across Dock, Canvas, Task, and terminal surfaces.

### C — Existing relation projection

`Technique` means ontology type `strategy`; producer/output relations mean exact
`produces` tuples. The G10 fixture freezes the sorted
`(kind, from_id, to_id)` relation set from an independent Kernel query, and F06
names the exact tuple removed for its deliberate break. Missing display text is
exactly `Not recorded`, including capitalization.

When the Kernel contains a Mission, Task, Dataset, Technique, producer, output,
or existing semantic link, the current Canvas/Dock/inspect projection must show
that fact and its identity. `Not recorded` remains valid only when the relevant
source fact is genuinely absent or unrecognized. No relation is reconstructed
from terminal text, display position, CSS, timing, or a second UI graph.

The accepted G9 Report hierarchy remains a read-only non-regression input:
current Report, historical Report, Evaluation, and raw Artifact keep their
existing semantic markers and exact ids. G10 only proves that the Canvas view
does not obscure or contradict the accepted projection.

### D — Five routed Canvas/browser calls

The exact G7-routed rows are the existing calls `browserEvaluate`,
`browserInfo`, `browserScroll`, `browserWait`, and `focusAgentSession`.
F07–F10 must traverse the full path
`canvas.browserX → Main canvas RPC → canvas:rpc-request → shell renderer → shell preload → browser:* Main IPC`, with operation-specific results: `evaluate`
returns a known value, `info` returns URL/title/loading, `scroll` changes
observable page scroll, and `wait` observes load completion or timeout.
`focusAgentSession(id)` must focus the existing terminal tile whose
`sessionId` equals `id`. It may not be removed in G10 unless a new G10 Reader
amendment also authorizes the paired G7-gate amendment and defines replacement
agent-node behavior. Static absence alone is not deletion proof; no unrelated
browser or protocol surface may be contracted here.

## Allowed surface

The exact product surface is limited to the current Canvas/Mission/runtime
behavior and directly caused proof. A Builder may edit only the following paths,
and only for a named defect above:

- `collab-electron/src/windows/shell/src/renderer.js`;
- `collab-electron/src/windows/shell/src/research-world.js`;
- `collab-electron/src/windows/shell/src/participant-projection.js`;
- `collab-electron/src/windows/shell/src/dock.js`;
- `collab-electron/src/windows/shell/src/canvas-rpc.js`;
- `collab-electron/packages/components/src/WorkspaceGraph/WorkspaceGraph.tsx` and
  its paired CSS/type files only for the routed `focusAgentSession` call;
- `collab-electron/src/windows/shell/src/shell.css` only for bounded visibility,
  label, or interaction corrections caused by A–D;
- `collab-electron/src/main/research-world-projection.ts`;
- `collab-electron/src/main/index.ts` only for the existing submission/reveal or
  focused Canvas/runtime callback boundary;
- `collab-electron/src/main/mission-context.ts` only for the existing Mission
  view binding/clear boundary;
- `collab-electron/src/main/runtime-adapter.ts` only for real runtime observation;
- `collab-electron/src/main/agent-host.ts` only for the read-only live-registry
  snapshot keyed by exact `agent_session.id`;
- `collab-electron/src/main/ipc-kernel.ts` only for the read-only
  `qf:sessions:runtime-snapshot` Main handler;
- `collab-electron/src/preload/shell.ts` only for the matching
  `window.shellApi.qf.getRuntimeSnapshot()` bridge;
- `collab-electron/packages/shared/src/window-api.d.ts` only for the matching
  `{ sessionId, live }` snapshot type;
- `collab-electron/src/main/ipc-browser.ts`,
  `collab-electron/src/main/canvas-rpc.ts`, and the paired preload/type surface
  only for the five routed calls;
- `qa/run.ts` only to register the exact
  `golden-g10-canvas-runtime` command;
- focused tests/fixtures for the named behavior;
- the named `golden-g10-canvas-runtime` QA gate at
  `qa/gates/golden-g10-canvas-runtime.ts`, invoked by
  `bun qa/run.ts golden-g10-canvas-runtime`, and its directly caused evidence; and
- generated Atlas projections caused solely by these edits.

The current routed `focusAgentSession` row is recorded at
`collab-electron/packages/components/src/WorkspaceGraph/WorkspaceGraph.tsx`.
The Builder must still freeze the literal path and byte identity in the starting
manifest; no guessed path or broad directory glob is an editable allowance.

## Explicitly out of scope

G10 must not edit `packages/qf-kernel`, schema or golden output, Report
publication/finalization, G8 tests/gates, G9 evidence/behavior, false runtime
identity, package staging, installer/build policy, sidecar shutdown, native
Windows qualification, history/docs compression, credentials, market data,
R18, or any real-world bet/trade execution. No new SQLite writer, renderer
domain write, Canvas state store, ontology object/link/action, Canvas engine,
inventory surface, or broad redesign is allowed.

The accepted Pre-R18 evidence is a non-regression reference, not permission to
reopen unrelated design decisions. Its existing current/full-lineage semantic
markers, ids, and Kernel comparison must remain intact while the named G10
navigation/runtime defects are corrected.

## Acceptance contract

The Builder must start with a clean checkout at the accepted G9 candidate,
freeze a sorted literal manifest of every editable, read-only, generated,
focused-test, and receipt-only path, and record the exact current runtime and
Canvas consumer census. No product mutation starts if the census finds a path
outside this order's allowlist or a new defect owner.

The focused gate must exercise the real renderer → preload → Main → read-only
Kernel projection path. It may use an isolated Kernel and Artifact root, but it
may not replace the Main/preload boundary with mocks or call `execute()` as a
shortcut around the UI path. The gate independently queries the isolated Kernel
and compares Mission, Task, participant, Dataset, Technique, Run, Artifact,
Evaluation, Report, and link ids to the production response and rendered DOM.
The gate is registered in `qa/run.ts` only under the exact name
`golden-g10-canvas-runtime` and is invoked by
`bun qa/run.ts golden-g10-canvas-runtime`; no other `qa/run.ts` change is in
scope.

The normal proof must show:

1. a naive operator starts in the ordinary Canvas and can deliberately open the
   Mission/current-workflow view and the full-lineage view;
2. a clear return action restores ordinary terminal/workspace tiles without
   deleting or rewriting Kernel facts;
3. successful submission, failed submission, close, and reopen preserve the
   durable Mission and do not force an exclusive world view;
4. Dock, Canvas, and Inspect consume the one `{ sessionId, live }` snapshot and
   agree on session, runtime, work, recovery, role, Task, output, and Mission
   binding;
5. live, starting, stopped, unavailable, closed, and unassigned cases are
   distinguished using real runtime observations and persisted facts;
6. existing Mission/Task/Dataset/Technique/producer links are shown and genuine
   missing facts alone produce exactly `Not recorded`;
7. current and full-lineage views preserve the accepted G9 Report hierarchy,
   current/historical markers, exact ids, and read-only Kernel agreement;
8. `browserEvaluate`, `browserInfo`, `browserScroll`, and `browserWait` each
   traverse the full renderer/preload/Main path with their named result;
   `focusAgentSession(id)` focuses the existing terminal tile whose
   `sessionId` equals `id`; no routed row is removed without a new G10 Reader
   amendment authorizing the paired G7 change and replacement behavior;
9. `no-canvas-domain-writes` and the relevant Kernel write-path checks stay
   green; and
10. the isolated G10 run ends with actual owned process/root cleanup at zero.

## Fail-capable falsifiers

Each falsifier runs in an isolated copy or fixture. The clean control must pass;
the deliberate break must exit nonzero with the named defect; exact bytes or
behavior must be restored; and the same assertion must exit zero. A source-only
pattern check, hard-coded DOM success, mocked IPC path, or cleanup assertion that
does not observe owned state is not acceptance.

| id | deliberate break | required red | restored green |
| --- | --- | --- | --- |
| F01 | re-enable exclusive Mission hiding after submit | under `ORDINARY_CANVAS`, a pre-existing non-research tile container is absent, visually hidden, `aria-hidden="true"`, or not pointer-enabled, or submission cannot return through the existing Canvas path | `CURRENT_MISSION` is explicit and the exact ordinary-container DOM predicates remain true after return |
| F02 | remove or neutralize the real `Back to world` action | the current Mission view cannot restore `ORDINARY_CANVAS` without a refresh or destructive write, or any exact ordinary-container DOM predicate is false | labeled `Back to world` restores `ORDINARY_CANVAS` with unchanged Kernel ids and the exact ordinary-container predicates |
| F03 | reintroduce latest-world auto-reveal during cold reopen | cold reopen does not start in `ORDINARY_CANVAS`, silently enters an exclusive Mission layer, or hides ordinary tiles | reopen starts in `ORDINARY_CANVAS`, the exact ordinary-container DOM predicates hold, and deliberate Mission navigation works |
| F04 | derive Runtime `running` from persisted session status while no process is live | a dead process is rendered `running`, or Dock, Canvas, and Inspect disagree for the exact `agent_session.id` | Runtime is `running` only for a live-session-registry observation and all three consumers receive the same snapshot |
| F05 | remove or corrupt one shared participant-projection input | the same participant gets contradictory Dock/Canvas/Inspect role, runtime, work, recovery, Task, output, or Mission binding | all three consumers show the same values for the same `agent_session.id` |
| F06 | drop the exact frozen `(kind, from_id, to_id)` `produces` tuple named by the independent-Kernel fixture from projection resolution | the tuple present in the isolated Kernel renders `Not recorded` or the wrong id | existing `strategy`/`produces` links project exactly; only absent facts use exactly `Not recorded` |
| F07 | break `browserEvaluate` at any link in its current Canvas boundary | `canvas.browserEvaluate` does not traverse the full named path or does not return the known value | the unchanged call traverses the full named path and returns the known value |
| F08 | break `browserInfo` at any link in its current Canvas boundary | `canvas.browserInfo` does not traverse the full named path or does not return URL/title/loading | the unchanged call traverses the full named path and returns URL/title/loading |
| F09 | break `browserScroll` at any link in its current Canvas boundary | `canvas.browserScroll` does not traverse the full named path or does not change observable page scroll | the unchanged call traverses the full named path and changes observable page scroll |
| F10 | break `browserWait` at any link in its current Canvas boundary | `canvas.browserWait` does not traverse the full named path or does not observe load completion or timeout | the unchanged call traverses the full named path and observes load completion or timeout |
| F11 | break `focusAgentSession` at its current Canvas boundary | `focusAgentSession(id)` cannot focus the existing terminal tile whose `sessionId` equals `id`, or reports success without doing so | the unchanged focus path focuses that exact terminal tile; removal requires the separately named G10 Reader amendment |
| F12a | add a renderer-side durable domain write in an isolated copy | `golden-g10-canvas-runtime` or `no-canvas-domain-writes` exits `1` on the added write | the write is removed, the same gate exits `0`, and the real projection path remains green |
| F12b | add a second durable Canvas/Mission store in an isolated copy | `golden-g10-canvas-runtime` exits `1` on the second store | the second store is removed, the same gate exits `0`, and the real projection path remains green |
| F13 | substitute a current Report/history id or marker in the view fixture | the read-only Kernel comparison catches disagreement with accepted G9 current/history truth | current/historical Report and Artifact markers match the persisted G9 projection |
| F14a | skip close/reopen or substitute a new id in the focused gate | close/reopen does not independently preserve the same durable Mission/session ids | close/reopen independently observes the same durable ids |
| F14b | fabricate runtime cleanup or count the inherited G12 survivor as G10-owned | the gate fails because the pre-run process/root census and G10-owned delta are not independently observed, or the inherited survivor is changed | only the G10-owned delta reaches `processes=0`, `roots_remaining=0`, and `leaked=[]`; inherited G12 PIDs `30512`, `17316`, `30836`, `20836`, and `30096` remain untouched and unchanged |

The F07–F11 cases must be individually named in the evidence; one aggregate
browser assertion is insufficient. F12a and F12b each require their own red and
restored-green transcript. F14a and F14b must separately prove identity and
owned-delta cleanup. F07–F10 green requires the full current call path and
operation-specific result; `focusAgentSession` green requires the exact terminal
tile. A routed-row removal requires the separate G10 Reader amendment stated in
section D.

## Evidence and close

The Builder report must open with one plain-language sentence and bind:

- accepted G9 starting candidate/tree and final G10 candidate/tree;
- literal starting and changed/untracked manifests with Git-tree-byte SHA-256;
- every normal command, output, and exit code;
- one red and one restored-green transcript for F01–F11, F12a, F12b, F13,
  F14a, and F14b;
- renderer, preload, Main, Kernel, DOM, and independent read-only comparison
  receipts;
- ordinary/mission/full-lineage navigation, close/reopen, runtime-axis, and
  five browser-boundary receipts;
- Atlas generate/check and ratchet result, with no unexplained hard red;
- actual owned process/root before/after cleanup; and
- explicit judgment calls and any inherited red left with its named owner.

The independent Verifier—not the Builder or Router—decides G10 PASS/FAIL. A
G10 PASS may close only G10's named Canvas/Mission/runtime defects. It may not
close the G12 packaged shutdown survivor, G11 history/docs work, or R18.

## Reader brief

The fresh Reader must read `START_HERE.md`, `docs/orders/NEXT.md`,
`docs/orders/PROTOCOL.md`, `docs/LAWS.md`, ADR-0004, this order, the Phase-1
audited disposition records, the accepted Pre-R18 evidence, the G7 routed-row
receipt, and the G9 closed acceptance/evidence above. The Reader makes no
repository edits.

Answer exactly these questions:

1. **Can every G10 deliverable and F01–F14 falsifier fail for its named
   Canvas/Mission/runtime/browser defect and return green after exact restore,
   using the real renderer/preload/Main/Kernel boundary and preserving
   Kernel-owned truth?**
2. **Does every deliverable have one finite meaning while preserving the
   accepted G9 current/history Report authority, the exact open G12 packaged
   QuantFlow/Node shutdown survivor, the G11 boundary, and the R18 freeze?**

The Reader returns **YES / YES** only if both answers are unambiguous. Any
ambiguity opens no Builder; it becomes a finite amendment to this order.

The Reader task `01a04a11-0b55-79b3-b6c0-55285177dd55` returned **NO / NO** at
authority `43e0c779e4b255624eefd021716d2afe5245020e` with the six finite
amendments now incorporated above. The same Reader must reread this amended
order and `NEXT.md` and return **YES / YES** before any G10 Builder starts.

The same Reader's Round-2 reread returned **NO / NO** against authority
`f7c1457ddcaab927a146293a3744f252ccd37fd4` because the exact gate-registration
file, read-only Main→preload→renderer `{sessionId, live}` route, and shared
Dock/Canvas/Inspect snapshot boundary were not yet frozen. This minimum
Round-2 amendment is now incorporated above. The same Reader must reread this
Round-2 amendment and `NEXT.md` and return **YES / YES** before any G10 Builder
starts.

The same Reader's Round-3 reread returned **YES / YES** against authority
`4ec9301ad2c6eec169c6dbfbc93c29b880ca7a64` and confirmed that all prior
amendments remain intact. Exactly one bounded G10 Builder is now authorized
under this accepted order. The Builder must preserve G9 Report authority, the
exact G12 survivor ownership, the G11 boundary, the R18 freeze, the Kernel
sole-writer law, and every frozen allowlist and falsifier contract. After that
one Builder, exactly one independent Verifier must rerun the accepted G10
gates and decide PASS/FAIL; Router is not the Verifier, and no second Builder
or scope expansion is authorized.

## Round-4 C + D adjudication — historical fixture/driver repair authority

The final read-only adjudication from task
`01a04b3c-4db1-7a93-b618-21890b79bb26`, against authority
`222af07635e4566eb66b802cbcc3750be828d001`, classified the same R16
`Kernel-owned director-to-executor delegation link` assertion failure, which
occurred twice, as **C + D**. **C** is fixture/driver sequencing: the driver
observes after Director runtime admission but before the Director-owned
recruitment completion receipt. **D** is an R16 setup/precondition violation:
the fixture pre-spawned worker and critic with actorless `qf.dock.spawn`, so
the chosen executor could not acquire a Director-owned delegation link. The
adjudication does not support a product or Kernel regression; the cleanup
finding is mechanical gate-owned temp-root handling.

Exactly one same-meaning fixture/driver-only repair Builder is authorized:

1. Wait for and select the exact executor created by a Director-owned trusted
   `create_agent_session` boundary with `actor_session_id` equal to the
   Director session id, and require durable `agent_session.created` plus
   `delegates_to` evidence. If deterministic synthetic mode cannot recruit,
   seed that exact executor through the existing trusted Kernel action with
   the Director actor. Do not accept an actorless or merely pre-spawned
   executor as the R16 executor.
2. Remove actorless `qf.dock.spawn` worker/critic prerequisite behavior from
   the R16 fixture path only. Do not change product `qf.dock.spawn` behavior
   or any other Main, preload, renderer, or Kernel path.
3. In `finally`, after the owned-process census, unconditionally remove only
   the literal G10-owned temp root created by this run, using a bounded retry.
   This cleanup is mechanical and must not target, relabel, or count the
   inherited G12 state.

This repair changes no product code, Kernel semantics, assertion, acceptance
meaning, G12 ownership, or other Golden group. It does not reopen G11 or R18,
does not add a new store or writer, and does not authorize any second Builder.
The existing dirty Builder diff is preserved as read-only context for this
Router amendment; this docs-only commit does not alter or stage it. A fresh
independent Verifier, not the repair Builder or Router, must decide G10 after
the one repair.

## Retained R16 lineage amendment — fresh semantic Reader required

The final read-only adjudication from task
`01a04b63-f4c6-7fd3-b6a8-f429f0e6aed1`, against the current authority
`9886a1225f2cf2c5ee713c6d2329fda0ac2ef9d2`, classified the repeated R16
review-precondition failure as **B primary with D/C secondary**. **B primary**
is a pre-existing accepted-product defect: the retained
`kernelSeedVisibleResearchWorld` helper conflates the Run's
`A_run_result_set` Artifact with the worker's `A_worker_trajectory` Artifact,
contradicting the accepted G9 review invariant. Production already uses these
two Artifacts correctly. **D/C secondary** records the accepted R16 helper's
precondition misuse and the G10 fixture/driver's selection/temporal-boundary
contribution; this is not a regression introduced by the G10 Canvas product
work.

The finite semantic boundary is before `requestGovernedReview`: the Kernel
must durably contain the exact `qf_review_source_work` row, succeeded Run and
separate `result_set` Artifact, exact Hypothesis and executor assignment,
executor-produced `trajectory` Artifact, durable
`produces(executor, trajectory)` link, and the exact completed Task result/
receipt lineage, including `task.completed.payload.input.result_artifact_id =
A_worker_trajectory`. The source-work `result_artifact_id` is
`A_worker_trajectory`, never the succeeded Run's separate
`A_run_result_set` Artifact. If existing R17 source-work IDs are reused, the
repair must freeze and reuse the exact existing `qf_review_source_work` row;
it may not reconstruct that row from the Run result Artifact.

Exactly one product-helper repair is authorized only after a fresh semantic
Reader returns **YES / YES**. Its only implementation surface is:

- `collab-electron/src/main/kernel.ts`, only the retained
  `kernelSeedVisibleResearchWorld` helper;
- the existing `qa/gates/golden-g10-canvas-runtime.ts`, only to exercise the
  repaired helper and preserve the accepted G10 proof; and
- `collab-electron/src/main/research-world.test.ts` only if the smallest
  focused test is needed, plus directly caused G10 evidence.

The helper repair must create or use a separate worker trajectory Artifact
(`kind=trajectory`), durably record `produces(executor, trajectory)`, complete
the exact Task with `task.completed.payload.input.result_artifact_id =
A_worker_trajectory` and its durable receipt lineage, and bind
`source_work.result_artifact_id` to that trajectory while preserving the
succeeded Run's separate `A_run_result_set` (`kind=result_set`). The G10 gate
must not pass R17 IDs to a fresh source-work reconstruction; when those IDs
are reused it must use the exact frozen existing source-work row.

The fail-capable falsifier must substitute the Run `result_set` for the worker
trajectory or remove `produces(executor, trajectory)`. Review admission must
refuse before creating the review Task, Evaluation, or Report. Restoring the
separate trajectory, exact Task/receipt lineage, and link must make the same
path admit. No assertion may be weakened or rewritten to make either result
green.

This amendment changes no G9 validator, schema or golden output, Report
publication/current-history authority, existing G10 assertion or acceptance
meaning, G12 ownership, or other Golden group. It does not authorize changes
to `packages/qf-kernel`, `qa/run.ts`, any other product path, or G11. The
previous fixture/driver-only C + D authority is superseded for current work.

### Fresh semantic Reader requirement — Builder closed

A fresh semantic Reader must answer exactly these two questions about this
lineage amendment:

1. **Does the repair have one finite meaning: the worker trajectory remains
   distinct from the succeeded Run's result-set output, with exact
   `produces(executor, trajectory)`, completed Task/receipt lineage, and
   `source_work.result_artifact_id` bound to the trajectory?**
2. **Does acceptance remain fail-capable: substituting the result-set Artifact
   for the trajectory or removing its `produces` link refuses before review
   Task/Evaluation/Report, while exact restoration admits?**

The amendment required the fresh semantic Reader to return **YES / YES** to
both questions before the one product-helper repair Builder could start. The
accepted reread below records that condition. Exactly one bounded Builder is
now reopened; after it, one fresh independent Verifier—not the Builder or
Router—must decide G10 PASS/FAIL.

## Completion/receipt lineage amendment — same Reader reread required

The fresh semantic Reader task
`01a04b77-cb43-7792-a225-2a7d57ef068c` returned **NO / NO** against authority
`db30a28d912f2e49e39802340993e17c62132f87` (short `db30a28d`) on the retained
R16 two-Artifact amendment. The finite defect is that the helper/fixture did
not explicitly validate, before `requestGovernedReview` creates any review
Task, the exact completed source Task event/receipt lineage for the same Task,
executor, worker trajectory Artifact, and accepted assignment/delegation
tuple. Missing, duplicate, or mismatched completion/receipt lineage must be a
pre-admission refusal, not a later Evaluation failure.

The same Reader's finite amendment now binds this exact repair contract:

1. Before `requestGovernedReview` creates any review Task, validate the exact
   completed source Task event and durable receipt lineage for the same task,
   executor, worker trajectory Artifact, and accepted assignment/delegation
   tuple. The completed Task result Artifact remains the worker trajectory,
   never the succeeded Run's separate `result_set` Artifact.
2. Missing, duplicate, or mismatched completion/receipt lineage must refuse
   before admission with zero review Task, Evaluation, or Report mutation.
   The valid path must retain the separate Run `result_set` versus worker
   trajectory distinction and the exact `produces(executor, trajectory)` link.

Add one independent fail-capable red/green falsifier: in an otherwise valid
isolated fixture, remove or mismatch that exact completed source-Task event or
receipt lineage, including its same-task, executor, trajectory, and accepted
assignment/delegation tuple. The pre-admission path must refuse and prove zero
review Task, Evaluation, or Report mutation. Restore the exact completion and
receipt lineage; the same path must admit. This falsifier must not weaken or
rewrite any existing G10 assertion or acceptance meaning.

This is a finite semantic amendment to the existing product-helper repair.
It preserves the separate Run `result_set` and worker `trajectory`, the G9
validator, schema, Report publication/current-history authority, all existing
G10 assertions and scope, G12 ownership, the R18 freeze, and every other
Golden group. The Builder remains closed pending the same Reader's reread.

### Same Reader reread — Builder reopened

The same Reader task
`01a04b77-cb43-7792-a225-2a7d57ef068c` reread this amendment and
`NEXT.md` at authority
`45cffba08f9990ef90c4273daa59ea5c4107ec61` (short `45cffba0`) and returned
**YES / YES** to these exact questions:

1. **Does the repair have one finite meaning: before review admission, the
   exact completed source Task event/receipt lineage matches the same Task,
   executor, worker trajectory Artifact, and accepted assignment/delegation
   tuple, while the Run `result_set` remains separate?**
2. **Does acceptance remain fail-capable: independently removing, duplicating,
   or mismatching that completion/receipt lineage refuses before review
   Task/Evaluation/Report mutation, while exact restoration admits?**

The same Reader's YES / YES closes the amendment Reader step. Exactly one
bounded G10 Builder is reopened for the accepted two-artifact/pre-admission
lineage repair plus the previously accepted G10 work. All existing G10
boundaries remain binding: no second Builder, no scope expansion, and no
change to G9 validator/schema/Report authority, G10 assertions, G12, R18, or
any other Golden group. One fresh independent Verifier—not the Builder or
Router—must follow and decide G10 PASS/FAIL.

## Final ordinary-Canvas adjudication — same Builder reopened; no new semantic Reader

The final read-only adjudication task
`01a04b99-46a1-7c00-a10d-b2d7b5c81dab`, against authority
`f2ce7505ff53be883a78f4d463b0cb745c11aab1` (short `f2ce7505`), classified the
twice-observed `ordinary Canvas after initial launch timed out` failure as
**A primary — G10 product defect**, with **D secondary — gate assertion
boundary-label ambiguity**. The accepted G10 meaning is unchanged.

The finite cause is cold-launch DOM initialization: the renderer's internal
mode is ordinary, but `hydrateSaved()` runs only when saved state exists, so
the DOM never publishes `ORDINARY_CANVAS` on a fresh launch. The direct Main
RPC path creates the Director terminal tile but does not invoke the Dock
form's deliberate Mission reveal callback. This is deterministic product
behavior, not executor timing or selection.

Authorize exactly one same-order Builder repair, limited to these two existing
G10 files and no others:

1. In `collab-electron/src/windows/shell/src/renderer.js`, initialize ordinary
   mode unconditionally on cold launch through the existing `hydrateSaved()`
   path. Do not add a state store or change the accepted Mission semantics.
2. In `qa/gates/golden-g10-canvas-runtime.ts`, rename and reposition the proof
   as ordinary Canvas **before deliberate Mission navigation**, and observe it
   at the first valid terminal-tile boundary. Retain a separate post-RPC
   ordinary assertion and every full ordinary predicate: `ORDINARY_CANVAS`,
   existing non-research tile containers present, visible, not
   `aria-hidden="true"`, and pointer-enabled. Preserve the subsequent
   deliberate Mission/current/full-lineage and `Back to world` proof.

Bind fail-capable red/green proof and cleanup: the red bait removes or guards
the cold-launch ordinary initialization and the registered
`golden-g10-canvas-runtime` command must fail with the ordinary-Canvas
timeout; restored initialization must observe the ordinary predicates, pass
the post-RPC ordinary assertion, and continue through the accepted G10
checks. Both red and green runs must perform the owned-process/root cleanup,
with `processes=0`, `roots_remaining=0`, and `leaked=[]`; inherited G12 state
remains untouched and excluded.

This repair is within the existing Reader-accepted G10 semantics and files;
no new semantic Reader is required. The same G10 Builder is reopened for
this exact repair only. All other G10/G9/G12/R18 boundaries, the two-Artifact
and pre-admission lineage contract, G9 validator/schema/Report authority,
existing assertions, F14a/F14b ownership, and every other Golden group remain
unchanged. One fresh independent Verifier—not the Builder or Router—must
follow this repair and decide G10 PASS/FAIL. No second Builder, scope
expansion, implementation outside the two named files, or G11 work is
authorized.

## Final browser-readiness adjudication — same Builder reopened; gate-only; no new semantic Reader

The final read-only adjudication task
`01a04baf-2dc7-7a70-95df-0e9405405048`, against authority
`52a914206d9c4cb7d23dcc60ed31e50641cfaf6c` (short `52a91420`), classified the
twice-observed `browser webview readiness timed out` failure as **C primary —
fixture/setup defect**, with **D secondary — diagnostic label only**. There
is no product defect and no G10 meaning change.

The gate created a Canvas tile and received its exact `tileId`, but used a
blocked `data:` URL. The DOM tile therefore existed without a real browser
`<webview>` or `webContentsId`; the browser RPC route was never reached.
Readiness is the existing Main observation `!isLoading` or the
`did-finish-load` event. `did-stop-loading` and `dom-ready` are not substitute
readiness events. Cleanup reaching `owned_processes_remaining=0` is separate
evidence and does not make the browser tile ready.

Authorize exactly one same-meaning, gate-only Builder repair in
`qa/gates/golden-g10-canvas-runtime.ts`:

1. Serve the fixture from an ephemeral loopback HTTP server and use
   `http://127.0.0.1:<port>/...`, then before F07–F10 assert the exact returned
   DOM tile id and type (`data-tile-id` and `data-tile-type="browser"`), a real
   `<webview>`, and a real `getWebContentsId()` value. Preserve the actual
   Main Canvas RPC → renderer → preload → browser Main IPC route.
2. Prove operation-specific executable red/green falsifiers: `evaluate` must
   return the known value; `info` must return the exact URL, title, and loading
   state; `scroll` must produce an observable scroll change; `wait` must prove
   completion and the timeout behavior on a delayed page; and
   `focusAgentSession(id)` must focus the exact existing terminal tile whose
   `sessionId` equals `id`.
3. Bind cleanup in both red and restored-green runs: the owned process/root
   census must finish at `processes=0`, `roots_remaining=0`, and `leaked=[]`,
   while inherited G12 state remains untouched and excluded.

The red bait must independently break each operation's actual response or
observable behavior and go nonzero; exact restoration must return green. A
source-only bait, assertion weakening, timeout increase, blocked-URL policy
change, mocked or skipped webview, or readiness substitution is invalid.
This repair is within the existing Reader-accepted G10 semantics/files, so no
new semantic Reader is required. The same G10 Builder is reopened for this
gate-only repair, followed by one fresh independent Verifier—not the Builder
or Router—to decide G10 PASS/FAIL. All other G10, G9, G12, and R18 boundaries,
the accepted ordinary Canvas/Mission/full-lineage meaning, prior lineage
contract, existing assertions, F14a/F14b ownership, and every other Golden
group remain unchanged. No other file, second Builder, scope expansion, or
G11 work is authorized.

## Final Mission-navigation adjudication — same Builder reopened; gate-only; no new semantic Reader

The final read-only adjudication task
`01a04bca-ad71-7b60-a475-5f014858cd5e`, against authority
`58757be642f81d03c810449e9c8aebfa1d24bc02` (short `58757be6`), classified the
twice-observed `CURRENT_MISSION after deliberate navigation timed out` failure
as **C primary — fixture/call/timing defect**, with **D secondary — diagnostic
label only**. The Mission and Kernel projection are healthy; there is no
product defect and no G10 meaning change.

The gate calls `openMission(first.endpoint, missionId)` and targets the exact
button selector `button.kl-reveal[aria-label="Show research world mission
${missionId}"]`. Its missing-control branch currently returns `false`, while
`waitFor()` treats only `null` as retry. That is a premature success: no click
occurs, the controller remains ordinary, and the gate reports a misleading
`CURRENT_MISSION` timeout. The exact Mission id exists and the projection
path is healthy.

Authorize exactly one same-meaning, gate-only Builder repair in
`qa/gates/golden-g10-canvas-runtime.ts`: change only the missing-control branch
of `openMission` from `return false` to `return null`, preserving the exact
`missionId`, button selector, `button.click()`, Mission state assertions, and
existing timeouts. No renderer, controller, preload, Main, Kernel, timeout,
or acceptance-semantic change is authorized.

Bind fail-capable red/green proof and cleanup: retain the red bait with
`return false` while delaying the exact Mission control; it must reproduce the
no-click `CURRENT_MISSION` failure. Restore `return null`; the gate must retry
until the exact button appears, click it, observe `CURRENT_MISSION`, then
complete the unchanged `FULL_LINEAGE` and `Back to world`/ordinary checks.
Both red and restored-green runs must retain the existing cleanup proof with
owned process/root state at zero and inherited G12 state untouched and
excluded.

This repair is within the existing Reader-accepted G10 semantics/files, so no
new semantic Reader is required. The same G10 Builder is reopened for this
exact gate-only correction, followed by one fresh independent Verifier—not
the Builder or Router—to decide G10 PASS/FAIL. All other G10, G9, G12, and R18
boundaries, ordinary/Mission/full-lineage meaning, browser-route contract,
two-Artifact/pre-admission lineage, existing assertions and timeouts, F14a/
F14b ownership, and every other Golden group remain unchanged. No assertion
weakening, product change, second Builder, scope expansion, other file, or
G11 work is authorized.

## Final visible-HISTORY consumer-path adjudication — same Reader accepted

The completed fresh read-only adjudication task
`01a04c05-febe-7ca3-ac21-f364e0197768`, against authority
`444d5fab3a0f3b3b6b08eb2efc6e8342c6be5a59`, found that the prior renderer-
initialization-barrier premise is empirically false. It classified the actual
failure as **C primary — visible consumer-path fixture/driver defect**, with
**D secondary — prior diagnostic boundary**. The Mission and Kernel projection
remain healthy; accepted product meaning is unchanged.

In the live isolated bypass, the gate deliberately omitted the pre-seed
ordinary-render barrier but then selected the visible `HISTORY` tab. The exact
Mission row count was `1`, the exact Mission button count was `1`, and cleanup
was green. Therefore the pre-seed ordinary-render barrier is not causal
acceptance, and the prior requirement that bypassing it yield zero rows/buttons
is revoked. The original global `openMission` failure omitted visible `HISTORY`
selection; the defect is consumer navigation, not a renderer timing race.

Authorize one finite, same-meaning, gate-only evidence amendment in
`qa/gates/golden-g10-canvas-runtime.ts`, pending the existing semantic Reader's
reread before further Builder work:

1. Revoke the pre-seed ordinary-render barrier as a causal acceptance
   requirement. Retain all unchanged ordinary Canvas assertions, including
   `ORDINARY_CANVAS`, existing non-research containers present and visible,
   not `aria-hidden="true"`, and pointer-enabled, plus the existing timeouts,
   selectors, and product behavior.
2. Retain the missing-control `return null` retry and require the real visible
   consumer path: select visible `HISTORY`, require its visible pane, require
   exact Mission row count `1`, require exact-Mission button count `1`, and
   click the exact Mission button for the durable `missionId`. Then require
   the unchanged sequence `CURRENT_MISSION → FULL_LINEAGE → Back to world`.
3. Add one fail-capable red/green falsifier in an otherwise valid isolated
   fixture: deliberately omit or neutralize visible `HISTORY` selection while
   leaving the durable Mission and ledger intact. The path must fail at the
   visible-`HISTORY` precondition or the existing deliberate-navigation
   timeout; it must not assert zero rows or buttons. Restore visible `HISTORY`
   selection and require the visible pane, exact row count `1`, exact button
   count `1`, exact click, unchanged state sequence, and zero-leak cleanup.

This amendment changes no renderer behavior, ledger filtering, product meaning,
timeout values, selector semantics, click semantics, state assertions, or
ordinary Canvas behavior. No timeout-only fix, direct controller shortcut,
invented control, assertion weakening, product change, or other file is
authorized. The same Reader task `01a04bf8-eaba-7e53-8563-95d85d0f078a`
reread this amendment and `NEXT.md` at authority
`8c6c2df0910fa6c777df19cd15cd8dd245f10c66` and returned **YES / YES**;
visible-HISTORY red/green is proven and no new semantic Reader is required.
The current Builder action is limited to the diagnostic-only phase/readiness
measurement below. One fresh independent Verifier—not the Builder or Router—
must decide G10 after the accepted proof and any same-meaning mechanical gate
repair. All prior G10/G9/G12/R18 boundaries, the accepted browser and Mission
routes, two-Artifact/pre-admission lineage, F14a/F14b ownership, and every
other Golden-group boundary remain unchanged. No product/semantic red may be
repaired under this authority.

## Final post-HISTORY diagnostic-only measurement — Builder open; no new semantic Reader

The fresh read-only adjudication task
`01a04c1c-ae43-7dd0-a773-4d6961fa9e4f`, against authority
`8c6c2df0910fa6c777df19cd15cd8dd245f10c66`, classified the later generic
`RPC timeout: app.ui.evaluate` as **D primary — insufficient diagnostics**.
The already-corrected visible-HISTORY red/green proof is accepted: omitted
selection reached the existing navigation timeout, and restored visible
HISTORY produced exact Mission row/button counts `1/1` with green cleanup.
The generic timeout does not identify which post-HISTORY phase failed and is
not evidence of a product defect. A stale browser webContents/session and
other product causes remain unsupported until a phase-specific receipt proves
one.

Under standing Golden mechanical-proof authority, authorize exactly one
diagnostic-only edit/run in `qa/gates/golden-g10-canvas-runtime.ts`:

1. Add phase labels and receipts for the post-HISTORY sequence:
   `openMission`, `currentMission`, `fullLineage`, `Back`, `F11 graph
   readiness`, and `F11 focus`.
2. At the F11 graph-readiness phase, record whether the graph webview is
   connected, its positive `webContentsId`, and its loading state.
3. After `Back`, record the existing `browserTileReceipt` and
   `canvas.browserInfo` result and their browser identity continuity.

This is mechanical diagnostics only. Do not change timeouts, product code,
selectors, assertions, semantics, cleanup, ownership, or scope; do not add a
shortcut, mock, or substitute readiness. Preserve the visible-HISTORY
red/green proof, real F07–F10 browser calls, exact F11 focus target,
`CURRENT_MISSION → FULL_LINEAGE → Back to world`, and zero-leak cleanup. No
new semantic Reader is required. If the measurement isolates a mechanical
gate defect, a same-meaning repair may proceed under standing Golden
mechanical-proof authority in this gate file; any product or semantic red
stops work and is not repairable under this authority. One fresh independent
Verifier—not the Builder or Router—must decide G10 afterward. No other file,
candidate/evidence commit, G11 work, or scope expansion is authorized.
