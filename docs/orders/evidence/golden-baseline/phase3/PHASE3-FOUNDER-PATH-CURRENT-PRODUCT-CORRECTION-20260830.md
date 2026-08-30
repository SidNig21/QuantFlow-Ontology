# Phase 3 current-product founder-path correction authority

status: **FRESH SEMANTIC READER REQUIRED / PRODUCT BUILDER CLOSED**

## Objective

Make the exact current packaged QuantFlow product truthful and operable along the founder path already required by P14-B: real Dock admission, a real Hermes Director tile, one durable Task, semantic inspection, terminal input, close/reopen, and process-zero shutdown.

## In plain terms

Ryan can open the real app, start the Research Director, give it durable work, inspect what was created, type into Hermes, close the app, and reopen it without the screen claiming a dead process is still running.

## Exact current product measured

- source SHA: `6f890b22a8bc392ffae7807becdb438a80c8800f`
- package: `collab-electron/dist/win-unpacked/QuantFlow.exe`
- executable SHA-256: `5DCBB3FF656CC9C00ED398164689100785541741FFC34B5E056F03478D5C80CF`
- packaged `app.asar` SHA-256: `033AF692917B358C11E49E4690CA5CC7E2869349FAB39F5828E329F9775395B3`
- isolated run root: `C:\tmp\qf-stage-a-max-20260830-124441`
- isolated Kernel: `C:\tmp\qf-stage-a-max-20260830-124441\stores\kernel.db`
- provider calls submitted: **zero**
- final owned processes: `QuantFlow=0 electron=0 hermes=0`

Every user-semantic action below was performed by Router-owned Computer Use through the visible packaged application. Internal data was read only after the visible interaction.

## Current-byte observations

### F01 — dead runtime remains live when it owns an open Task

Computer Use visibly spawned `hermes-research-director`, then created Task `task-5a2069b2-88b6-4c39-b638-0dc0a2821d8a` and closed QuantFlow normally through the window control. No QuantFlow, Electron, or Hermes process remained. The durable Kernel still contained:

```text
agent_session f644910c-3318-4d86-a7e8-6846f56987c2 status=running
task task-5a2069b2-88b6-4c39-b638-0dc0a2821d8a status=open
delegated_by task -> f644910c-3318-4d86-a7e8-6846f56987c2
assigned_to task -> f644910c-3318-4d86-a7e8-6846f56987c2
```

`reconcileStaleSessions()` currently skips every open-Task owner before reconciling active statuses. A cold reopen therefore has no path to correct this exact row before Dock projection. The exact required transition is one existing `fail_agent_session` command with `reason=app_terminated`, leaving `agent_session.status=failed`. Do not call `close_agent_session`. Preserve the exact open Task and both `delegated_by` and `assigned_to` links; the existing projection must then make the Task unavailable/reassignable and show the participant failed/stopped after cold reopen. Cancelled, closed, or generic UI-only non-live state does not satisfy this correction.

### F02 — successful Create Task leaves the creation form obstructively open

The visible Task creation succeeded and the correct Task and links existed in the Kernel, but the empty title/description/assignee form remained under the newly created Task. This consumes the participant surface and makes a completed action look unfinished. On successful refresh the form must return to the single `Create Task` affordance. On failure, the populated form and error must remain available.

### F03 — a same-seat handoff card covers the terminal input

Assigning the Director's Task to the same Director renders a zero-length `ORCHESTRATOR -> ORCHESTRATOR` handoff card at the seat center. On the measured tile it covered the live Hermes prompt. A same-session delegation has no meaningful between-seat cable. Keep the durable Task, assignment links, Task row, controls, and all cross-seat handoff projections, but omit only the zero-length same-session overlay.

### F04 — the visible Task cannot select its semantic object

Clicking the visible Task projection did not select the Task. Dock Inspect remained pinned to the participant. The Task row must call an explicit `onSelectTask(taskId)` callback. `renderer.js` forwards that ID to the Dock controller; Dock resolves it only against the latest `listTaskSurface()` assignment projection, then Inspect shows that Task identity, status, description, delegator, assignee, and relationship meaning. This is an ephemeral selection projection only. It may not persist state, accept an embedded Task payload as authority, or construct a second graph. Pointer click and normal button activation must use the same route; wrong or stale IDs must clear/refuse rather than inspect another Task. Existing participant selection remains unchanged.

### F05 — runtime presentation contradicts itself

The real tile exposed the Hermes native TUI and its participant receipt said `Native TUI`, while Dock Inspect displayed the unexplained runtime value `default`. Preserve the profile identity, but present it with the real runtime observation (for example `Native TUI · profile default`) so the two surfaces cannot imply different runtimes.

### F06 — terminal capability exists but resize is undiscoverable

The participant tile already has real edge/corner resize controls. Dragging its south-east handle exposed the complete Hermes Agent 0.14.0 TUI, Kimi K3 identity, both QuantFlow MCP servers, and the live prompt. Computer Use typed `QF_STAGE_A_INPUT_CHECK` into the real prompt and erased it without submitting. The capability is real; the normal UI gives no visible resize affordance. Add only a restrained visible south-east resize cue. Do not redesign the tile or terminal.

### F07 — History invents a Mission context

With no Mission recorded, Dock History displayed `No historical research for this Mission.` Use wording that does not invent a Mission, while preserving all History filtering and data behavior.

## Authorized product boundary

The Builder may change only the smallest subset of these existing surfaces needed to close F01–F07:

- `collab-electron/src/main/agent-host.ts`
- `collab-electron/src/main/agent-host-lifecycle.test.ts`
- `collab-electron/src/windows/shell/src/participant-projection.js`
- `collab-electron/src/windows/shell/src/participant-projection.test.ts`
- `collab-electron/src/windows/shell/src/task-composition.js`
- `collab-electron/src/windows/shell/src/task-composition.test.ts`
- `collab-electron/src/windows/shell/src/handoff-layer.js`
- `collab-electron/src/windows/shell/src/handoff-layer.test.js`
- `collab-electron/src/windows/shell/src/dock.js`
- `collab-electron/src/windows/shell/src/dock.test.ts`
- `collab-electron/src/windows/shell/src/renderer.js`
- `collab-electron/src/windows/shell/src/shell.css`
- `collab-electron/src/windows/shell/index.html`
- `qa/gates/hermes-production-inference.ts` and `qa/gates/hermes-production-inference.test.ts` only for already-authorized credential-safe failure preservation and the later visible P14-B inference receipt; they may not implement or substitute the product corrections
- `qa/gates/pre-r18-coherence.ts` only to rerun its unchanged C14/current-product acceptance after the product repair; its assertions, fixtures, timings, and meaning are immutable
- `docs/orders/evidence/golden-baseline/phase3/PHASE3-FOUNDER-PATH-CURRENT-PRODUCT-READER-ACCEPTANCE-20260830.md`
- `docs/orders/evidence/golden-baseline/phase3/PHASE3-FOUNDER-PATH-CURRENT-PRODUCT-BUILD-RECEIPT-20260830.md`
- `docs/orders/evidence/golden-baseline/phase3/PHASE3-FOUNDER-PATH-COMPUTER-USE-RECEIPT-20260830.md`
- generated Atlas outputs after product changes

If a required implementation file is absent from this list, stop and return the exact reason before changing it.

## Hard invariants

1. The Kernel remains the only durable truth. No UI state, sidecar, new table, cache, or parallel graph may be added.
2. Task status, assignment, delegation, steering, close refusal, and result-delivery semantics do not change.
3. A stale seat with an open Task receives exactly one `fail_agent_session(reason=app_terminated)` transition and remains `failed`; it is not cancelled or closed. The Task and lineage remain durable and available for founder intervention.
4. Only a same-session zero-length handoff overlay may be suppressed. Every real cross-session handoff and semantic link remains visible and unchanged.
5. Task Inspect reads the existing projected Kernel Task/links. Selection itself is process-local and disposable.
6. No provider/model, Hermes launcher, credential, Bovada, R18, schema, ontology type/link, Canvas engine, Dock inventory, premium redesign, release, installer, or roadmap change.
7. No assertion, timeout, cleanup condition, or existing acceptance meaning may be weakened.
8. The current P14-B proof-integrity work remains intact. No provider prompt is submitted until provider-free UI acceptance is green.

## Focused acceptance

### Deterministic tests and falsifiers

- An active session with an open assigned Task and no runtime must RED when projected/reopened as live; GREEN requires exactly one `fail_agent_session(reason=app_terminated)`, durable `status=failed`, no `close_agent_session`, intact Task/links, and an unavailable/reassignable Task projection. Running, cancelled, closed, missing fail receipt, and duplicate fail receipt each RED.
- A successful Create Task must RED if the blank creation form remains; GREEN restores the one-button affordance. A rejected create must retain the form values and error.
- A same-session handoff must RED if it creates a card/line; a cross-session handoff must still render exactly once.
- Clicking or activating the projected Task must call `onSelectTask(taskId)`; renderer must forward that ID to Dock; Dock must resolve only the exact latest Kernel-derived Task projection. Wrong/stale Task identity, embedded-payload authority, and participant-selection regression must RED.
- Runtime profile `default` plus a live native-TUI observation must not render as bare `default`; absence of a runtime observation must not invent one.
- The resize cue must correspond to the existing south-east resize handle and must not cover terminal content or become a new control path.
- History-without-Mission wording must not claim a Mission exists.

### Current packaged founder path

Build/package the corrected exact SHA, then Router-owned Computer Use repeats:

```text
visible packaged app
-> Dock Catalog click
-> Research Director click
-> one participant tile
-> real Hermes TUI ready
-> resize through the visible cue
-> harmless type and erase without submit
-> create one bounded Task through the tile
-> Task and links verified in Kernel
-> Task selected through the rendered UI
-> Dock Inspect shows that exact Task
-> no same-seat overlay blocks the terminal
-> normal close
-> process zero
-> cold reopen same Kernel
-> no absent runtime is shown live
-> Task/lineage remain intact and operable
-> final normal close and process zero
```

Any consumer action above performed through RPC, renderer evaluation, direct PTY input, direct Hermes invocation, synthetic substitution, or fabricated Kernel rows does not satisfy this proof. Read-only Kernel/log queries afterward are allowed.

### Phase 3 continuation

Only after the provider-free current-package path is green:

1. preserve credential-safe failure diagnostics outside disposable roots;
2. execute exactly one real current-package Hermes -> OpenCode Go -> configured Kimi K3 nonce inference through the same visible UI path;
3. finish the remaining Phase-3 matrix, Atlas HARD RED 0, reopen, cleanup zero, immutable candidate, and one fresh independent Verifier;
4. designate Golden only after independent PASS;
5. stop before R18.

## Stop conditions

- Reader is not `YES / YES`.
- The same semantic assertion is red twice after a repair.
- A new truth store, schema change, ontology change, provider change, or file outside the boundary is required.
- A real provider call would be spent before the provider-free path is green.
- Any final Phase-3 or independent-Verifier red remains.
