# WO-GOLDEN-G10 — Current Canvas/Mission/runtime coherence

status: READER ROUND-2 AMENDMENT REQUIRED — minimum route/allowlist amendment after Reader NO / NO; no Builder authority
kind: Golden Baseline Phase 2 bounded current-product coherence group
owner: Router
depends: G9 CLOSED / PASS WITH G12 INHERITED RED
build-authority: **NO — the same Reader must reread this amended order and return YES / YES before one bounded G10 Builder may start**
reader-task: `01a04a11-0b55-79b3-b6c0-55285177dd55`
reader-authority: `43e0c779e4b255624eefd021716d2afe5245020e`
reader-verdict: **NO / NO — six finite amendments required; no Builder authority**
reader-reread: **REQUIRED — the same Reader must reread this amended order and NEXT.md and return YES / YES; no substitute Reader or Builder is authorized**
reader-round-2-authority: `f7c1457ddcaab927a146293a3744f252ccd37fd4`
reader-round-2-verdict: **NO / NO — exact gate-registration file, live snapshot route, and consumer/allowlist boundary still required**
reader-round-2-reread: **REQUIRED — the same Reader must reread this Round-2 amendment and NEXT.md and return YES / YES; no Builder authority**
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
