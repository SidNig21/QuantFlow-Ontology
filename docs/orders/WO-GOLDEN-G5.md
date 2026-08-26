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

Round 1 at `f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806`: **NO / NO**. The amendment below is binding. A fresh semantic reread must return `YES / YES` before Builder authority opens.

## Required amendment after Reader Round 1

### Exact semantic disposition

Agent Chat is removable legacy UI. Its dev shim and `acp-agent.test.ts` are QA-only. No current shell opener or supported saved Canvas/window state restores it.

Standalone Terminal is removable legacy UI. The current `nav:open-in-terminal` path opens a Canvas `term` tile and is protected. The stale `viewer:run-in-terminal`, `agent:focus-session`, `cd-to`, `run-in-terminal`, and `focus-tab` paths are standalone-Terminal-only and must be removed as one bounded protocol closure. `ptyForegroundProcess` must not be implemented.

Host ACP is current supported product runtime with QA coverage. Retain:

- `collab-electron/src/main/host-acp-bridge.ts`
- `collab-electron/src/main/host-acp-permission.ts`
- `collab-electron/src/main/host-acp-turn.ts`
- host-ACP portions of `agent-host.ts`
- `species/hermes/host-acp-client.ts`
- `species/hermes/host-acp-policy.ts`
- `species/hermes/host-admit-kernel.ts`
- Hermes host-ACP package/profile definitions and QA selectors

The shared `resolveHostAcpCommand` consumer used by native TUI is protected and may not be deleted.

Hermes `launch.json` and packed metadata mean current production `native_tui`. `agent-package/agentos-package.json` means the supported host-ACP package/profile route. These are separate meanings and must not be collapsed.

### Exact authorized product disposition

Deletion is authorized only for:

- `collab-electron/src/windows/agent-chat/**`
- `collab-electron/src/windows/terminal/**`
- `collab-electron/src/main/acp-agent.ts`
- `collab-electron/src/main/acp-agent.test.ts`
- `collab-electron/src/main/acp-fs-root.ts`
- `collab-electron/src/main/acp-fs-root.test.ts`
- `qa/gates/acp-fs-confine.ts`, if its final consumer census is zero
- the frozen ACP exception for `acp-agent.ts` and its test in `qa/gates/kernel-sole-writer-app.ts`

Edits are limited to:

- remove `terminal` and `agent-chat` Vite inputs;
- remove their `shell:get-view-config` entries;
- remove `registerAgentIpc`;
- remove only legacy ACP methods/events from universal preload, shell preload, and `window-api.d.ts`;
- remove only standalone-Terminal forwarding from `ipc-misc.ts`;
- remove only the dead `agentWebview` branch from shell renderer;
- remove the listed direct dependencies and only their unreachable lockfile closure.

Do not delete or weaken Canvas, Dock, Files/viewer, PTY, native TUI, terminal-tile, session-tile, package identity, or host-ACP files.

### Finite predecessor universe

The supported predecessor universe is exactly:

1. current production `QF_APP_DIR` config and `window_state`;
2. current `canvas-state.json`;
3. current Kernel state and current production package/profile references;
4. `.collaborator` to `.quantflow` migrations actually performed by the current app;
5. current tracked production staging and package metadata.

Historical branches, old receipts, audit copies, external packages, stale build output, and QA-only disposable roots do not create compatibility.

Legacy ACP preferences and `agent-messages.json`, if present, are preserved as ignored residue: no migration, deletion, read, or write.

### Required runnable selectors

The Builder must add:

- `bun qa/run.ts golden-g5-consumer-census`
- `bun qa/run.ts golden-g5-saved-state`

The smallest focused matrix is:

- `bun qa/run.ts golden-g5-consumer-census`
- `bun qa/run.ts golden-g5-saved-state`
- `bun qa/run.ts golden-g4-retired-route`
- `bun qa/run.ts dock-definition-launch`
- `bun qa/run.ts hermes-launch-policy`
- `bun qa/run.ts hermes-first-turn-synthetic`
- `bun qa/run.ts kernel-sole-writer-app`
- `bun run --cwd collab-electron build`

Installer/release traversal remains G12/Phase 3 unless G5 changes installer operations, signing, resource staging rules, or release metadata beyond removal of the listed dead renderer/dependency closure.

### Fail-capable falsifiers

Each new G5 selector must run isolated and exit nonzero for:

- one stale Agent Chat or standalone-Terminal opener/build/package reference;
- deletion of a protected terminal-tile, session-tile, Files/viewer, Dock, PTY, or native-TUI consumer;
- loss of any current saved tile/window predecessor;
- unannounced obsolete-record fallback;
- removal of one retained host-ACP adapter/profile/permission/cleanup consumer;
- one removed dependency still reachable through source, dynamic import, build input, package staging, QA, or lockfile closure.

A falsifier that unexpectedly exits zero is itself a gate failure. Restore the fixture before the next case.

### Saved-state acceptance

The saved-state selector must prove restoration of `term`, `note`, `code`, `image`, `graph`, `browser`, `pdf`, `artifact`, `session`, and `research`, plus main `WindowState`.

It must prove live terminal PTYs reconnect; stopped session tiles remain visibly stopped; Files/viewer and Dock remain reachable; obsolete Agent Chat/standalone Terminal records are ignored without fallback; and legacy ACP preference/cache files are neither deleted nor migrated.

### Inherited-red ownership

G5 records but does not absorb G8 Kernel/migration reds, G9 `researchEvidenceByRunId`/Report duplication, G10 Canvas/Mission/runtime coherence, or G12 Bovada Windows EPERM/package/typecheck/operations/release reds.

### Rollback and Atlas ordering

The product candidate must be reversible to `f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806`. No user data may be deleted. Any changed path outside the authorized disposition, current lockfile closure, or explicitly regenerated Atlas output is red. Evidence changes remain separate.

Record baseline Atlas identity; implement and run the focused matrix; generate Atlas only from the green product candidate; run Atlas check and ratchet; then run the independent falsifier. Atlas cannot establish product support or compatibility by itself.

### G5 receipt schema

The final receipt must contain exactly:

- `verdict`, `starting_sha`, `candidate_sha`, `branch`, `upstream`
- `clean_start`, `clean_end`, `authorized_path_disposition`
- `agent_chat_classification`, `standalone_terminal_classification`, `host_acp_classification`
- `saved_state_universe`, `legacy_state_disposition`, `dependency_closure`
- `matrix_commands`, `matrix_results`, `falsifier_commands`, `falsifier_results`
- `protected_current_product_results`, `inherited_red_owners`
- `atlas_identity_before`, `atlas_identity_after`
- `rollback_boundary`, `user_data_deletion`, `independent_verifier`

No Builder authority opens until this amendment is landed and a fresh Reader returns `YES / YES`.

## Required amendment after Reader Round 2

This binding contract supersedes the earlier `Required runnable selectors`, `Fail-capable falsifiers`, and `G5 receipt schema` subsections where they differ.

### Exact gate deliverables

The Builder must add exactly:

- `qa/gates/golden-g5-consumer-census.ts`
- `qa/gates/golden-g5-saved-state.ts`
- one `qa/run.ts` registration named exactly `golden-g5-consumer-census`
- one `qa/run.ts` registration named exactly `golden-g5-saved-state`

A selector exits `0` only when its normal assertions pass and exits nonzero whenever any required falsifier is active.

### Exact Builder matrix

From repository root, the Builder runs and records unedited output for:

```text
bun qa/run.ts golden-g5-consumer-census
bun qa/run.ts golden-g5-saved-state
bun qa/run.ts golden-g4-retired-route
bun qa/run.ts dock-definition-launch
bun qa/run.ts hermes-launch-policy
bun qa/run.ts hermes-first-turn-synthetic
bun qa/run.ts kernel-sole-writer-app
bun run --cwd collab-electron build
```

Every normal command must exit `0`.

The Builder runs these falsifiers in isolated temporary fixtures. Each must exit nonzero; after every case the fixture is restored and the corresponding normal selector reruns at exit `0`.

```text
$env:QF_G5_FALSIFY="stale-opener"; bun qa/run.ts golden-g5-consumer-census
$env:QF_G5_FALSIFY="protected-consumer"; bun qa/run.ts golden-g5-consumer-census
$env:QF_G5_FALSIFY="host-acp"; bun qa/run.ts golden-g5-consumer-census
$env:QF_G5_FALSIFY="dependency-closure"; bun qa/run.ts golden-g5-consumer-census
$env:QF_G5_FALSIFY="saved-state-loss"; bun qa/run.ts golden-g5-saved-state
$env:QF_G5_FALSIFY="obsolete-fallback"; bun qa/run.ts golden-g5-saved-state
```

For each falsifier, the gate prints the named defect, exits nonzero, restores the fixture, and then the same selector prints PASS and exits `0`. An unexpectedly green falsifier is a gate failure.

### Exact command ownership

The Builder runs the normal matrix and every falsifier above.

The independent Verifier reruns the same normal matrix and inspects the unedited falsifier outputs at the immutable candidate SHA. The Verifier does not regenerate, edit, or repair the candidate.

G5 does not run `bun qa/verify-release.ts` or the Windows installer matrix. Those remain G12/Phase 3 unless the candidate changes installer operations, signing, production resource-staging rules, or release metadata. Such a change is out of G5 scope and stops the candidate.

### Exact evidence files

After Reader acceptance and only after product changes exist, create exactly:

- `docs/orders/evidence/golden-baseline/g5/BEFORE.md`
- `docs/orders/evidence/golden-baseline/g5/COMMANDS.tsv`
- `docs/orders/evidence/golden-baseline/g5/FALSIFIERS.tsv`
- `docs/orders/evidence/golden-baseline/g5/AFTER.md`
- `docs/orders/evidence/golden-baseline/g5/READER-ACCEPTANCE.md`
- `docs/orders/evidence/golden-baseline/g5/VERIFIER-ACCEPTANCE.md`
- `docs/orders/evidence/golden-baseline/g5/GROUP-ACCEPTANCE.md`

`COMMANDS.tsv` columns are exactly:

```text
id	role	command	expected_exit	actual_exit	output_path
```

`FALSIFIERS.tsv` columns are exactly:

```text
id	selector	falsifier	expected_exit	actual_exit	restored	normal_rerun_exit	output_path
```

`READER-ACCEPTANCE.md` is the semantic receipt. `VERIFIER-ACCEPTANCE.md` is the independent verification receipt. `GROUP-ACCEPTANCE.md` records final group closure only.

### Exact receipt fields

`READER-ACCEPTANCE.md` must contain exactly these named fields:

```text
verdict
starting_sha
candidate_sha
branch
upstream
clean_start
clean_end
authorized_path_disposition
agent_chat_classification
standalone_terminal_classification
host_acp_classification
saved_state_universe
legacy_state_disposition
dependency_closure
matrix_commands
matrix_results
falsifier_commands
falsifier_results
protected_current_product_results
inherited_red_owners
atlas_identity_before
atlas_identity_after
rollback_boundary
user_data_deletion
independent_verifier
```

No Builder authority opens until this exact amendment is committed and a fresh semantic Reader returns `YES / YES`.
