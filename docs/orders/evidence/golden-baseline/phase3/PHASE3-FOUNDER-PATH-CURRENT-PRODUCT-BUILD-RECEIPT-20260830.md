# Phase 3 founder-path current-product Builder receipt

The current QuantFlow product now keeps a durable founder Task operable after its runtime disappears, makes that Task inspectable, and removes the measured UI contradictions without changing research semantics.

status: **FINAL FOUNDER-PATH PROJECTION REPAIR BUILDER COMPLETE / INDEPENDENT VERIFICATION REQUIRED / UNRELATED RESEARCH-DIRECTOR GATE RED RECORDED**

## Authority and source

- accepted authority: `79456a01c8321ab4084b30dc97e50e5bd87046f2`
- frozen Reader verdict: `YES / YES`
- build parent: `c469f89e8d531ca588a1fbecd32f04093c67c6f9`
- F01 amendment authority: `ec6b326a1d7832af17902fff2e291c214a25ea65`
- F01 repair parent: `1723d60089e16992c62f216a7e748a597973e925`
- branch: `wo-golden-g2`
- provider prompts submitted: **zero**

## Delivered behavior

- F01: cold reconciliation issues exactly one existing `fail_agent_session` with `reason=app_terminated` for an absent active runtime that owns an open Task. It does not close that session, Task, or assignment/delegation lineage.
- F01 projection amendment: an exact open Task is `assigned` only while its exact assignee `agent_session` exists and is `running`. Missing or non-running assignees project `unavailable` with exactly that assignee ID while retaining the exact delegator, assignee, and display-name lineage. Done/cancelled Tasks retain exact historical assignment regardless of later session availability.
- F02: a successful Task creation collapses back to one `Create Task` affordance. A refused creation retains the entered fields and visible error.
- F03: only a same-session, zero-length handoff overlay is suppressed; real cross-session handoffs remain projected once.
- F04: the rendered Task is a real button that forwards only its Task ID. Dock refreshes its latest Kernel-derived task surface, refuses stale/wrong IDs, and shows Task identity, status, description, delegator, assignee, and relationship meaning.
- F05: a live native terminal now reads `Native TUI · profile <profile>` instead of contradicting the terminal with a bare profile value. No live observation means no invented native-TUI claim.
- F06: the existing south-east resize handle has a restrained visible cue. It adds no new control path and does not intercept input.
- F07: empty History now says `No research history yet.` and does not invent a Mission.

## Builder-owned paths

- `collab-electron/src/main/agent-host.ts`
- `collab-electron/src/main/agent-host-lifecycle.test.ts`
- `collab-electron/src/windows/shell/index.html`
- `collab-electron/src/windows/shell/src/dock.js`
- `collab-electron/src/windows/shell/src/dock.test.ts`
- `collab-electron/src/windows/shell/src/handoff-layer.js`
- `collab-electron/src/windows/shell/src/handoff-layer.test.js`
- `collab-electron/src/windows/shell/src/participant-projection.js`
- `collab-electron/src/windows/shell/src/participant-projection.test.ts`
- `collab-electron/src/windows/shell/src/renderer.js`
- `collab-electron/src/windows/shell/src/shell.css`
- `collab-electron/src/windows/shell/src/task-composition.js`
- `collab-electron/src/windows/shell/src/task-composition.test.ts`
- generated `qf-atlas/ATLAS.md`, `qf-atlas/atlas.html`, and `qf-atlas/atlas.json`
- this receipt

Reader and Router-owned Computer Use receipts were not edited. `qa/gates/pre-r18-coherence.ts`, schema, ontology, provider/model, credentials, P14-B, and R18 were not edited.

## Falsification transcript

The seven repaired seams were temporarily neutered together, without changing their tests:

```text
bun test <five focused founder-path suites>
28 pass
7 fail
165 expect() calls

RED failures:
- stale open-Task owner became closed instead of failed
- same-session handoff remained visible
- cross-session/same-session filter admitted two projections
- native TUI rendered as bare default
- resize cue and no-Mission History assertions failed
- Task activation forwarded the wrong ID
- successful Create Task retained the form
```

The exact product bytes were restored and the same command was rerun:

```text
35 pass
0 fail
180 expect() calls
Ran 35 tests across 5 files.
```

## Product and invariant proof

```text
bun run build
main: 306 modules transformed
preload: 2 modules transformed
renderer: 7783 modules transformed
exit 0
```

The first sandboxed build invocation failed before compilation because esbuild could not read the parent project directory. The identical command outside that filesystem sandbox completed green; this was an execution-environment failure, not a product red.

```text
bun qa/run.ts pre-r18-coherence
C01..C14=PASS
objects=17 links=21
roots_remaining=0 leaked=[]
PASS pre-r18-coherence
```

Static invariant gates:

```text
repo-shape=PASS
lockfile-committed=PASS
kernel-sole-writer=PASS
kernel-sole-writer-app=PASS
no-canvas-domain-writes=PASS
doc-action-surface=PASS
one-skin=PASS
```

An exploratory aggregate `bun test collab-electron/src/windows/shell/src` invocation was not used as acceptance: unrelated suites share incompatible DOM/global mocks when aggregated and reported 169 pass / 29 fail / 1 loader error. Every changed-surface suite passes in the focused matrix above, and the production Electron build plus the canonical existing C14 product gate both pass.

## Atlas

```text
bun qf-atlas/generate.mjs
412 files · 99 subsystems · 113 IPC channels

bun qf-atlas/generate.mjs --check
current — 412 files, 113 channels, 4 strip candidates

bun qf-atlas/ratchet.mjs
HARD RED 0 · unexplained coverage 0 · undecided without blocker 0

bun qf-atlas/generate.mjs --diff c469f89e
VERDICT: UNCHANGED — no architectural change
added 0 · newly-detected 0 · resolved 0 · regressed 0
```

## Judgment exercised

Task selection refreshes Dock's existing `listTaskSurface()` projection before resolving the ID, rather than trusting the tile's rendered payload or adding UI memory. The same-seat handoff is filtered at the shared projection seam, leaving durable Kernel lineage untouched. These choices keep the correction inside the one-truth-store rule while making the measured founder path operable.

## F01 projection-amendment evidence

The accepted F01 test cases were first added while the prior projection decision remained intact:

```text
bun test collab-electron/src/main/task-delegation-projection.test.ts
7 pass
1 fail
16 expect() calls

RED: an open non-running assignee still projected assigned with no unavailable ID
```

After the bounded projection repair, the same suite proved every named runtime state and historical exception:

```text
8 pass
0 fail
22 expect() calls

open starting/blocked/cancelled/failed/closed/missing -> unavailable
open running -> assigned
done/cancelled with closed or missing historical session -> assigned with exact lineage
```

The complete founder-path focused matrix remained green, including every frozen F02-F07 surface:

```text
43 pass
0 fail
202 expect() calls
Ran 43 tests across 6 files.
```

`git diff --exit-code 295fa47d -- <all F02-F07 product/UI paths>` exited 0. Those product/UI blobs are byte-identical to the independently checked candidate.

Exact affected gate results:

```text
bun qa/run.ts team-composition
PASS

bun -e "import { runResearchDirectorDelegationFocusedFalsifiers } ..."
all assignment-cardinality, delegator-lineage, and renderer-local falsifiers/restorations PASS
```

Two complete `bun qa/run.ts research-director-delegation` runs each passed every projection-owned focused falsifier, then failed at the existing real-path assertion:

```text
research-director-delegation: FAIL wrong definition falsifier did not select hermes-worker-2
owned_process_tree_remaining=0 electron_processes_remaining=0 hermes_processes_remaining=0 roots_remaining=0
repository_tree_unchanged=true
```

This is not an F01 projection assertion, and repairing or weakening that pre-existing wrong-definition product/gate meaning is outside the accepted amendment. The Builder made no such change and does not call the complete gate green.

The remaining bounded evidence is green:

```text
bun run build
main 306 / preload 2 / renderer 7783 modules; exit 0

bun qa/run.ts pre-r18-coherence
C01-C14 PASS; objects=17; links=21; roots_remaining=0; leaked=[]

seven static gates
all PASS

Atlas
current 412 files / 113 channels / 4 strip candidates
HARD RED 0 / unexplained 0 / undecided without blocker 0
VERDICT UNCHANGED versus repair parent
```

The projection repair reads one more existing Kernel object (`agent_session`) and derives availability without writing or persisting UI state. Structural/link/delegator exactness is decided before runtime availability, so a stopped runtime cannot erase durable lineage and a malformed lineage cannot become an assignment merely because a session runs.

## Final participant/runtime projection repair

- repair parent: `3e31b9945a08e44614590f374063315419c5b78e`
- provider calls submitted: **zero**
- Computer Use performed by Builder: **no**

Two fail-capable tests were added before the projection implementation changed:

```text
bun test kernel-lifecycle.test.ts participant-projection.test.ts
8 pass
2 fail

RED 1: task-surface session omitted exact configured runtime_profile=default
RED 2: exact unavailable open Task projected work=unassigned and Task=Not recorded
```

After the bounded repair, the identical pair was green:

```text
10 pass
0 fail
53 expect() calls
```

The green proof requires the exact unavailable Task to retain its ID, title, and description only on its exact participant and to project `work=blocked`; wrong-session and malformed/missing-lineage rows retain no Task identity. The closed participant remains `session=closed`, `runtimeState=stopped`, and `recovery=restartable`. Its exact configured profile may render as `default`, but no absent runtime observation may invent `Native TUI`.

The compatible existing founder-path batch remained green:

```text
44 pass
0 fail
206 expect() calls
```

`kernel-lifecycle.test.ts` is intentionally run separately from `agent-host-lifecycle.test.ts`: the latter module-mocks `./kernel`, so aggregating those files replaces the former's real Kernel exports and is not a valid product test. The separate real-Kernel suite is green `3 pass / 0 fail`; the six-suite founder-path batch is green as shown above.

Current-product-safe verification:

```text
seven static gates: PASS
team-composition: PASS
bun run build: PASS (306 main / 2 preload / 7783 renderer modules)
bun qa/run.ts pre-r18-coherence: C01-C14 PASS; objects=17; links=21; cleanup clean
```

The implementation adds only `runtime_profile` from the already exact one-link `spawned_from` AgentDefinition resolution in `kernelListTaskSurface()` and extends the shared participant projection to consume an exact unavailable assignment. It adds no action, mutation, schema, link, Dock state, or alternate truth.
