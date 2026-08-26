# WO-GOLDEN-G5 — Retire legacy ACP and unconsumed renderers

status: **DRAFT / READER ONLY**
order-type: Golden Baseline Phase 2 non-rung group
branch: `wo-golden-g2`
founder-approved-route: G5 — Legacy ACP and unconsumed renderers
parent-group: G4 **CLOSED / ACCEPTED** at `2d491f20a030b9ac0b476846535f2ecc71239af1`
r18-authority: **FROZEN**
main-authority: **NONE**
builder-authority: **NONE UNTIL READER YES/YES + LATER NEXT.md ROTATION**

## Outcome and one meaning

G5 leaves QuantFlow with one current terminal implementation and no packaged screen, ACP bridge, compatibility package, renderer, preload/API surface, or direct dependency that lacks a current consumer or explicitly supported predecessor state.

G5 preserves the current Canvas terminal tile, session tile, Dock recruitment, viewer, native-TUI runtime, and package identity contract. It does not implement R19 or invent a replacement protocol.

## Authority and sequence

One fresh semantic Reader must answer exactly:

1. Can every acceptance gate actually fail on the defect it names?
2. Does every deliverable have exactly one meaning?

The Reader must adjudicate current compatibility from source, package output, saved-state shapes, and the accepted product path. `NEXT.md` is Reader-only. No mutation is authorized by this draft.

## Mandatory starting census

Before any disposition, enumerate with source, build, package, runtime, compatibility, QA, and named-future evidence:

- `collab-electron/src/windows/agent-chat/**`;
- standalone `collab-electron/src/windows/terminal/**`;
- `collab-electron/src/main/acp-agent.ts` and every IPC/preload/config/type consumer;
- the host-ACP adapter and Hermes host-ACP package/profile surfaces;
- `@agentclientprotocol/claude-agent-acp`, the app ACP SDK, assistant-ui, lucide, and any dependency made unreachable by the candidate removals;
- the broken `ptyForegroundProcess` call and every path that can reach it;
- every saved tile/window type in the finite supported user-state predecessor universe;
- every current shell opener, dynamic/webview consumer, menu/command, restore path, package entry, and QA fixture for those surfaces.

The supported predecessor universe is the current production application state and migrations that the current app actually restores. Historical evidence, disposable proof roots, old branches, and unsupported external packages do not create compatibility by existence alone.

Any production or supported saved-state consumer that cannot be migrated or deliberately preserved makes the Reader return `NO` with the exact required compatibility contract.

## Required semantic decisions

The Reader must decide separately:

1. Whether Agent Chat and standalone Terminal have any current opener, restore path, package consumer, or supported saved-state obligation.
2. Whether host-ACP is a current supported runtime or only legacy/QA compatibility after G4.
3. Whether the latest approved R18–R25 route requires ACP now. Future usefulness alone is insufficient when recreation later is cheaper.
4. Whether each direct dependency has a surviving current consumer after the proposed source disposition.
5. Whether saved obsolete tile/window records are safely ignored, explicitly migrated, or require bounded compatibility.

The decisions may not be collapsed into “old means delete” or “reachable means keep.”

## Authorized disposition after Reader acceptance

Only if the corresponding census is negative, one Builder may remove:

- `src/windows/agent-chat/**` and standalone `src/windows/terminal/**`;
- `acp-agent.ts` and only its now-unconsumed IPC/preload/config/type surfaces;
- host-ACP adapter and Hermes host-ACP package/profile surfaces only if current compatibility is disproved;
- direct dependencies whose complete static, dynamic, build, package, QA, compatibility, and future-route consumer census reaches zero;
- the broken `ptyForegroundProcess` call by deleting its dead Terminal consumer, not by manufacturing a fake implementation.

Shared Files, viewer, shell, Canvas, Dock, terminal-tile, session-tile, PTY/native-TUI, package, or preload files may not be deleted wholesale because they contain a legacy branch.

## Preserved current product

G5 must preserve:

- the ordinary Canvas and current terminal tile as the founder-operable terminal surface;
- current native-TUI spawn, input, output, resize, cancel, close, reopen, and cleanup behavior;
- Dock catalog/recruitment and Kernel AgentDefinition/AgentSession truth;
- Files/viewer behavior and current shell navigation;
- current Hermes role/profile/package identity and every route retained by G4;
- G6 Claude-identity ownership, G7 broader protocol/dependency contraction, G8 Kernel/law ownership, G9 Report authority, G10 Canvas coherence, G11 authority compression, and G12 package/operations ownership.

## Fail-capable proof contract

The Reader must define the smallest exact matrix that proves:

- a stale Agent Chat or standalone Terminal opener/restore/package entry turns red;
- deleting a current terminal-tile/session-tile/Files/viewer/Dock consumer turns red;
- every supported saved tile/window predecessor either restores intentionally or follows an explicit accepted compatibility disposition;
- host-ACP remains fully proved if retained, or has zero current/compatibility/package/QA/future consumers if removed;
- each removed dependency has zero direct/transitive current consumer and package closure remains exact;
- the current Hermes terminal journey supports spawn, focus/type, output, cancellation, close/reopen, and process cleanup;
- no fake ACP/Terminal replacement or silent fallback can satisfy the gate.

At minimum, the Reader must map existing selectors for current terminal tile, Dock recruitment, viewer, reopen, package build/inspection, and cleanup. Full installer/release traversal belongs only if G5 materially changes that boundary; otherwise G12 and Phase 3 retain it.

## Evidence and candidate

Create `docs/orders/evidence/golden-baseline/g5/` only after Reader acceptance. Freeze the starting SHA, exact file/dependency/saved-state census, pre-existing reds, and rollback boundary before mutation.

Product/config changes and evidence-only descendants remain separate. Atlas clean-tree ordering is precomputed. One independent final Verifier is mandatory. Mechanical same-meaning harness fixes use the Golden fast path; compatibility, runtime support, product behavior, group scope, or PASS-meaning changes require semantic Reader adjudication.

No G6 Builder, main merge, full G9, or R18 work is authorized.

## Reader acceptance

Pending fresh semantic Reader.
