# WO-WIN1 — Native Windows product floor

status: **verified 2026-08-02**
assignee: Codex lead
depends: founder platform decision recorded 2026-08-02
blocks: WO-107 continuation and every later feature order

## Objective

Make native Windows 11 the canonical QuantFlow build and runtime, and prove the packaged app opens
to its real canvas and Kernel-backed Dock without touching the founder's live data.

## Verification result

The Windows-canonical `bun qa/verify-release.ts` passes end to end. External Computer verification
captured the real packaged shell, canvas/minimap, and all four Dock identities in
`docs/orders/evidence/wo-win1/windows-visible-shell.png`; the companion JSON receipt records RPC
readiness, a clean log, and zero owned processes after shutdown. The earlier failed manual launcher
did touch founder state and is recorded without cleanup in
`docs/orders/evidence/wo-win1/FOUNDER-STATE-INCIDENT.md`.

## In plain terms

The founder can launch the actual Windows app, see QuantFlow rather than a test harness, see the
canvas and expected Dock entries, and close it without leaked processes or damaged state.

## Context pack

Read `START_HERE.md`, `docs/adr/0001-windows-first-product.md`, this order, and
`docs/orders/PROTOCOL.md`. Treat the existing uncommitted WO-WIN1 edits on `codex/wo-win1` as an
unverified starting point, not accepted work.

## Deliverables

### D0 — authority and route

All binding entry points name native Windows 11 as the primary target. `NEXT.md` points only here.
WO-107 is parked intact and no Linux/WSL command is presented as the current acceptance route.

### D1 — package and boot

Build the real unpacked Windows package with all deploy-true Dock runtime resources. Launch
`QuantFlow.exe` under Electron/Node against isolated temporary `QF_KERNEL_DB`,
`QF_ARTIFACT_ROOT`, application-data, and temp roots. The app must reach Kernel and JSON-RPC
readiness; a source-tree runner, dev server, WSL process, or bare Electron substitute is invalid.

### D2 — visible product floor

The launched package must show the actual QuantFlow shell, an interactive canvas, and the
Kernel-backed Dock inventory for `qf-toolloop`, `hermes-orchestrator`, `hermes-worker`, and
`hermes-worker-2`. Record a screenshot plus machine-readable profile IDs from the same packaged
run. This is a presence/readiness proof, not yet a claim that live agent collaboration works.

### D3 — Windows ownership and cleanup

The package uses Windows-native paths, IPC, CLI installation behavior, PTY/process ownership, and
resource resolution. An RPC shutdown request closes the app; every process launched from the
package exits within the bounded timeout. The gate must never inspect, migrate, mutate, or delete
the founder's real `.quantflow` tree.

### D4 — permanent falsifiable gate

Register `windows-cold-boot` in `qa/run.ts`. It builds and launches the real Windows package with
isolated stores, checks RPC and Dock readiness, verifies required packaged resources, requests
clean shutdown, and detects process leaks or founder-state mutation. Show one deliberate packaged
resource/readiness sabotage red, exact restore, then green.

## Contract

- Native Windows 11 is the acceptance environment; WSL is not a substitute.
- Preserve all WO-107 product commits and evidence. Do not mix Bovada work into this order.
- Do not add a new runtime, sidecar, truth store, database, or dependency.
- Do not redesign the canvas or Dock in this order; prove the current product floor honestly.
- AgentOS is not a reason to block boot. Only packaged profiles that actually require it may touch
  it, and no AgentOS/Rivet architecture decision is in scope.
- Use isolated temporary roots. Never launch this gate against the founder's live Kernel, artifacts,
  application state, profiles, credentials, or transport database.
- Builder evidence is not verification. The founder must see the packaged UI proof before WIN1 is
  accepted, and a separate verification pass must re-run the gate.

## Acceptance gates

Builder, on native Windows from the repository root:

```powershell
bun qa/run.ts windows-cold-boot
bun qa/run.ts repo-shape
bun qa/run.ts lockfile-committed
bun qa/run.ts kernel-sole-writer
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts doc-action-surface
bun qa/run.ts one-skin
```

Verifier, from a clean native-Windows worktree, runs the Windows canonical release verifier defined
by this order (`bun qa/verify-release.ts`), repeats the cold-boot bait, and inspects the
screenshot/profile receipt from the same packaged run. Linux release evidence does not pass WIN1.

## Out of scope

Bovada/network capture · live Hermes or ToolLoop turn · peer-bus collaboration · canvas or Dock
redesign · ontology/schema expansion beyond a behavior-neutral Electron compatibility fix · WSL or
Linux packaging · installer signing/publishing · founder-state migration.

## Report back

Open with whether the founder can launch the native Windows app and see the canvas and Dock. Then
provide exact package path, isolated roots, readiness receipt, required Dock IDs, screenshot path,
shutdown/process-cleanup result, red/green bait transcript, changed files, and any judgment call.
