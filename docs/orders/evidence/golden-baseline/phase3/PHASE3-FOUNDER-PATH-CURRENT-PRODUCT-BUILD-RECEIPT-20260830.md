# Phase 3 founder-path current-product Builder receipt

The current QuantFlow product now keeps a durable founder Task operable after its runtime disappears, makes that Task inspectable, and removes the measured UI contradictions without changing research semantics.

status: **BUILDER COMPLETE / INDEPENDENT VERIFICATION REQUIRED**

## Authority and source

- accepted authority: `79456a01c8321ab4084b30dc97e50e5bd87046f2`
- frozen Reader verdict: `YES / YES`
- build parent: `c469f89e8d531ca588a1fbecd32f04093c67c6f9`
- branch: `wo-golden-g2`
- provider prompts submitted: **zero**

## Delivered behavior

- F01: cold reconciliation issues exactly one existing `fail_agent_session` with `reason=app_terminated` for an absent active runtime that owns an open Task. It does not close that session, Task, or assignment/delegation lineage.
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
