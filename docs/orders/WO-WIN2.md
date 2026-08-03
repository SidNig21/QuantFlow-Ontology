# WO-WIN2 — Normal-Dock collaboration proof

status: **verified 2026-08-02**
assignee: Codex lead
depends: WO-WIN1 verified
blocks: canvas/Dock polish beyond proof-critical tissue and the parked market ladder

## Objective

Prove that two independent, package-owned agents launched from the normal QuantFlow Dock can
exchange one task and one result through product-owned collaboration transport while the Kernel
records both sessions and the canvas shows both seats.

## Verification result

The native Windows package passed the permanent `windows-dock-collaboration` gate from separate
builder and verifier process boundaries. Delivery-off and collapsed-session baits went red, the
restored path went green, 44 focused tests and TypeScript passed, and normal shutdown left both
Kernel sessions closed with no owned process. Founder-visible Computer Use evidence and the
matching Kernel/peer-bus receipt are recorded in
`docs/orders/evidence/wo-win2/COMPUTER-USE-2026-08-02.md`.

## In plain terms

The founder opens the native Windows app, clicks Spawn for an orchestrator and a worker, sees two
distinct live tiles, watches the orchestrator send a nonce-bearing task, watches the worker return
an acknowledgement, and sees `COLLAB PASS` in the orchestrator tile. No host script paints the
result and no test movie stands in for the product.

## Proof profiles

Add two package-owned deterministic definitions to the normal Dock:

- `qf-proof-orchestrator` — label `DETERMINISTIC PROOF AGENT`, model `none`, credentials `none`;
- `qf-proof-worker` — label `DETERMINISTIC PROOF AGENT`, model `none`, credentials `none`.

They are proof instruments, not claims of model intelligence. They use the normal definition,
session, process, terminal-tile, Kernel, and peer-bus paths that later model-backed profiles use.

## Required product path

1. The Dock starts each definition through the normal spawn action.
2. QuantFlow creates two distinct Kernel agent sessions with `spawned_from` definition links.
3. Each child receives its real `QF_AGENT_SESSION_ID` and the package-owned `QF_PEER_BUS_DB`.
4. The orchestrator sends a nonce-bearing task through peer-bus MCP.
5. The worker pulls that task, prints receipt in its own terminal tile, and returns an ACK containing
   the same nonce.
6. The orchestrator pulls the result and prints `COLLAB PASS <nonce>` in its own tile.
7. QuantFlow records both trajectories, both peer-bus directions, and session lineage in the Kernel.
8. Normal app shutdown closes both agent processes and the app with no owned-process leak.

## Proof-critical tissue allowed in this order

- Surface Dock spawn failures and a bounded `Starting` state instead of silent no-ops.
- Preserve definition ID and Kernel session ID through IPC into renderer tile chrome.
- Auto-place spawned terminal tiles so the two seats cannot overlap exactly.
- Show compact role/session badges sufficient to distinguish orchestrator from worker.
- Pass `QF_AGENT_SESSION_ID` and honor `QF_PEER_BUS_DB` in package-owned children.
- Fix Windows-native path admission only where it blocks these two package-owned profiles.

## Hard boundaries

- Native Windows package only; dev server, WSL, Linux, and source-tree harnesses do not pass.
- No A2A four-tile movie, host-injected canvas text, fake second tile, or direct Kernel row seeding.
- No credentials, network model, AgentOS sidecar, Bovada capture, betting execution, or ontology
  expansion.
- AgentOS remains a capability boundary. This proof must not pretend `qf-toolloop` works on Windows.
- Do not touch or clean the founder's live `.quantflow` tree. Use isolated roots for every proof run.

## Permanent falsifiable gate

Add `windows-dock-collaboration` to `qa/run.ts`. It launches the real package, uses the normal Dock
spawn route, verifies the two process/session identities, waits for the nonce round trip, checks the
two trajectory artifacts and bidirectional peer-bus evidence, requests clean shutdown, and detects
owned-process leaks or founder-state mutation.

Required baits:

- block task delivery: no `COLLAB PASS`, gate red;
- restore delivery: same bytes, gate green;
- collapse both session IDs to one: identity/isolation assertion red.

## Founder-visible Computer evidence

Capture the same packaged run at these states:

1. normal Dock with both deterministic proof definitions;
2. two distinct role/session-badged tiles;
3. worker tile showing the nonce task receipt;
4. orchestrator tile showing `COLLAB PASS <nonce>`;
5. clean app close with zero owned processes.

## Acceptance

Builder and independent verifier each run the Windows collaboration gate from separate process
boundaries. Computer evidence must agree with the Kernel/session receipt. Passing this order proves
one collaboration primitive; it does not yet certify the full Dock catalog, visual quality, or
model-backed Hermes/Toolloop behavior.
