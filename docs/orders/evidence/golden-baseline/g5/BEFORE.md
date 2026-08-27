# G5 baseline — before product edits

This is the frozen G5 baseline recorded before any product-file mutation.

## Identity and cleanliness

- authority SHA: `de3361b91224d82e6470c02295c26c6fd7dade0c`
- frozen product starting SHA: `f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806`
- branch: `wo-golden-g2`
- upstream: `origin/wo-golden-g2`
- clean start: `YES` (`git status --porcelain=v1 --untracked-files=all` was empty)
- baseline matrix root: `C:\tmp\qf-g5-baseline-cd0a240`
- baseline Atlas commands: `bun qf-atlas/generate.mjs --check`; `bun qf-atlas/ratchet.mjs`
- baseline Atlas result: `qf-atlas: current — 417 files, 126 channels, 13 strip candidates`; `baseline: 3 entries · HARD RED: 0 · unexplained coverage: 0 · undecided w/o blocker: 0 · AMBER (visible, non-blocking): 20 · undecided: 39`

## Plain-language meaning

The obsolete chat and separate terminal windows are removed while the one current Canvas terminal and the Research Dock remain usable; if this boundary is wrong, a saved workspace or the founder’s current research path would disappear or stop opening.

## Baseline classifications

### Agent Chat — removable legacy UI

- source: `collab-electron/src/windows/agent-chat/**` is the isolated renderer island; `collab-electron/src/main/acp-agent.ts` and `acp-agent.test.ts` are its legacy ACP bridge/test.
- build/package: `electron.vite.config.ts` has an `agent-chat` renderer input; `main/index.ts` returns `agentChat` in `shell:get-view-config`; Electron directly declares `@agentclientprotocol/claude-agent-acp`, `@agentclientprotocol/sdk`, `@assistant-ui/react`, `@assistant-ui/react-markdown`, `@assistant-ui/store` override, and `lucide-react`.
- runtime: `main/index.ts` imports/registers `registerAgentIpc` and exposes the `agentChat` view config, but the shell’s Agent panel is the current Research Dock and no current shell opener creates the Agent Chat renderer.
- compatibility: no current production `QF_APP_DIR`/`window_state`, `canvas-state.json`, Kernel state, package/profile reference, or current migration restores Agent Chat. Legacy ACP preferences and `agent-messages.json`, if present, are ignored residue.
- QA: `acp-agent.test.ts`, `qa/gates/acp-fs-confine.ts`, and the frozen ACP exception in `qa/gates/kernel-sole-writer-app.ts` are legacy/QA-only consumers authorized for removal when their final census reaches zero.
- future: later approved route does not require ACP Agent Chat now; future usefulness is not a current consumer because recreation later is cheaper.
- disposition: delete the exact Agent Chat island, `acp-agent.ts`, its test, `acp-fs-root.ts` and test, and `qa/gates/acp-fs-confine.ts` only with the zero-consumer closure; remove only the related build/view/preload/config surfaces.

### Standalone Terminal — removable legacy UI

- source: `collab-electron/src/windows/terminal/**` is the standalone renderer island; its `ptyForegroundProcess` call is a measured broken bridge call.
- build/package: `electron.vite.config.ts` has the standalone `terminal` renderer input and `main/index.ts` returns its `terminal` view config; these are separate from protected `terminal-tile`.
- runtime: `nav:open-in-terminal` is current and opens a Canvas `term` tile through `open-terminal`; it must remain. `viewer:run-in-terminal`, `agent:focus-session`, `cd-to`, `run-in-terminal`, and `focus-tab` are the standalone-Terminal-only forwarding closure.
- compatibility: no supported saved state restores the standalone Terminal window. Current canvas state restores `term`, `note`, `code`, `image`, `graph`, `browser`, `pdf`, `artifact`, `session`, and `research` records through the shell; obsolete standalone records are ignored without fallback.
- QA/future: current terminal behavior is covered by terminal-tile/native-TUI/PTY paths and the G5 saved-state/consumer selectors; no approved future route requires the standalone window.
- disposition: delete the exact standalone Terminal island; remove its Vite/view-config entry and only its stale forwarding/preload/API closure; do not implement `ptyForegroundProcess` and do not delete protected PTY/native-TUI/terminal-tile/session-tile code.

### Host ACP — retained current product runtime

- classification: `RETAIN`.
- retained adapter/contract: `collab-electron/src/main/host-acp-bridge.ts`, `host-acp-permission.ts`, `host-acp-turn.ts`, host-ACP portions of `agent-host.ts`, `species/hermes/host-acp-client.ts`, `host-acp-policy.ts`, and `host-admit-kernel.ts`.
- retained package/profile: `species/hermes/package.json` and `bun.lock` keep `@agentclientprotocol/sdk`; `species/hermes/launch.json`, packed metadata, and `agent-package/agentos-package.json` retain their separate `native_tui` and supported host-ACP package/profile meanings.
- protected shared consumer: `resolveHostAcpCommand` is used by native TUI and cannot be removed.
- QA: Hermes host-ACP policy/launch and Kernel sole-writer coverage remain required.

## Protected current product

The baseline preserves ordinary Canvas, `term` terminal tiles, `session` tiles, Files/viewer, Dock recruitment, Kernel AgentDefinition/AgentSession truth, native-TUI spawn/input/output/resize/cancel/close/reopen/cleanup, PTY, Hermes role/profile/package identity, and package identity.

## Saved-state predecessor universe

Exactly these current supported predecessors are in scope: current production `QF_APP_DIR` config and `window_state`; current `canvas-state.json`; current Kernel state and production package/profile references; `.collaborator` to `.quantflow` migrations actually performed by the current app; and current tracked production staging/package metadata. Historical branches, old receipts, audit copies, external packages, stale output, and disposable QA roots create no compatibility obligation.

Required accepted behavior: restore `term`, `note`, `code`, `image`, `graph`, `browser`, `pdf`, `artifact`, `session`, `research`, and main `WindowState`; reconnect live terminal PTYs; show stopped session tiles as stopped; keep Files/viewer and Dock reachable; ignore obsolete Agent Chat/standalone Terminal records without fallback; and preserve legacy ACP preference/cache files without reading, migrating, deleting, or writing them.

## Dependency and rollback boundary

- known zero-consumer direct dependencies after the exact authorized deletion: Electron’s `@agentclientprotocol/claude-agent-acp`, Electron’s `@agentclientprotocol/sdk`, `@assistant-ui/react`, `@assistant-ui/react-markdown`, `@assistant-ui/store` override, and `lucide-react`, plus only the lockfile closure proven unreachable after edits.
- uncertain extra dependencies are deliberately not removed here; they remain for G7.
- rollback boundary: revert to `f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806`.
- user-data deletion: `NONE`; product code may only ignore obsolete records and must not delete user files or state.

## Known inherited reds

- `hermes-first-turn-synthetic`: pre-existing harness red because `qa/gates/hermes-research.ts` names retired `hermes-orchestrator` in its readiness assertion while production authority is `hermes-research-director`; authorized mechanical repair is limited to that assertion, with old-red/new-green proof.
- G8 owns the frozen `kernel-market-lineage` red.
- G9 owns `researchEvidenceByRunId`/Report duplication.
- G10 owns Canvas/Mission/runtime coherence.
- G12 owns Bovada Windows EPERM, package/typecheck, operations, and release reds.
