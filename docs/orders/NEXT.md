# NEXT — L1 packaged Windows collaboration baseline

status: ACTIVE
authorized-by: founder
authorized-at: 2026-08-03
baseline: `wo-windows-return@e75d110`

> Execute L1 only. Stop when its proof checklist passes or a stop condition fires. Do not select
> work from later rungs.

## Objective

Ship the locally proven real-Hermes collaboration path as an honest installed Windows capability
without touching founder state or making Hermes a QuantFlow boot dependency.

## In plain terms

The installed Windows app must open normally, clearly explain when Hermes is unavailable, and —
when the founder's WSL/Hermes prerequisites are ready — launch two real Hermes seats that exchange
one visible, durable task and result without modifying personal data or leaving processes behind.

## Current floor

- Native Windows shell, Kernel, canvas, Dock, PTY lifecycle, and shutdown are verified on `main`.
- `wo-windows-return@e75d110` adds the locally proven Windows/WSL Hermes launch, visual crossover,
  launch-scoped collaboration MCP, real two-Hermes task/result exchange, durable canvas receipt,
  and honest stopped-seat recovery.
- The latest collaboration bridge is development-proven but not yet packaged, installed, merged,
  or pushed.
- Founder manual keyboard input remains the authority for terminal-input usability; automated PTY
  injection proves transport only.

## Deliverables

1. Package the QuantFlow collaboration MCP and Hermes WSL launch wrapper as installed-app
   resources, with correct development and packaged path resolution.
2. Preserve launch-scoped Hermes configuration. Never copy, rewrite, display, or package
   credentials or mutate global Hermes configuration.
3. Make WSL2, Ubuntu, Hermes, and Hermes authentication adapter prerequisites rather than app-boot
   prerequisites. Keep the Dock visible and show clear unavailable diagnostics.
4. Contain the inherited ACP auto-approval surface: disable it when unused or require an actual
   founder decision. No request may be silently approved.
5. Run the installed application against explicit isolated app, Kernel, artifact, cache, temp, and
   profile paths.
6. Capture founder-state manifests before and after acceptance:
   - `kernel.db`, `kernel.db-wal`, and `kernel.db-shm`: presence, size, timestamp, and SHA-256 where
     applicable;
   - global Hermes configuration: SHA-256 only, without displaying contents.
7. Produce founder-visible acceptance evidence with Computer Use: Dock visibility, two real Hermes
   seats, collaboration MCP availability, real task/result handoff, completed canvas receipt,
   normal cancellation/close/reopen, honest stopped recovery, and no owned orphan processes.
8. Label automated PTY prompt injection as transport evidence only. Record the founder's manual
   keyboard-input verdict separately before L1 may pass.
9. Commit completed L1 work locally. Do not push or merge until the founder reviews the final
   report.

## Acceptance proof

- [ ] Installed QuantFlow opens with isolated state and the normal product Dock.
- [ ] Missing WSL/Ubuntu/Hermes/authentication never blocks app boot and produces actionable Dock
      diagnostics.
- [ ] Two real Hermes seats launch from the installed app when prerequisites are available.
- [ ] Each seat receives the launch-scoped QuantFlow collaboration MCP without global config
      mutation.
- [ ] One real task and one real result cross the MCP path and produce a visible completed canvas
      receipt with sender, recipient, status, and Kernel identity.
- [ ] Computer Use proves visible spawn, receipt, cancel, close, reopen, and stopped recovery.
- [ ] Founder manual typing into a native-TUI tile neither queues nor truncates.
- [ ] Normal shutdown leaves no QuantFlow-owned Electron, sidecar, WSL, or Hermes processes.
- [ ] Founder Kernel manifests and global Hermes configuration hashes match before versus after.
- [ ] Typecheck, focused tests, build/package verification, and diff checks pass.
- [ ] Work remains local and unmerged pending founder review.

## Stop conditions

Stop immediately and report exact evidence if any of these occur:

- any founder-state mutation;
- the installed app cannot complete the real collaboration receipt;
- founder manual tile input queues or truncates;
- packaging requires CI expansion, AgentOS redesign, broad refactoring, or unrelated
  infrastructure work;
- installed acceptance requires copying, exposing, rewriting, or packaging credentials;
- the isolated runtime cannot be proven distinct from founder state.

## Do not touch

- L2 evidence-integrity guards;
- ontology tool integration or role/capability grants;
- datasets, research rows, backtesting, orchestration, or critic/report implementation;
- Codex CLI or Claude Code adapters;
- AgentOS architecture;
- broad UI redesign;
- schema migration or unrelated Linux porting;
- CI/GitHub Actions;
- push or merge.

## Directional ladder — not authorized work

| Rung | State | Directional outcome |
|---|---|---|
| L0 | DONE LOCALLY | Real Windows/Hermes collaboration in the development app |
| L1 | **ACTIVE** | Installed, isolated, founder-reviewed collaboration baseline |
| L2 | NEXT | Evidence integrity: refuse ungated Reports and unsupported Hypothesis resolution |
| L3A | DIRECTION ONLY | Kernel authority for Dock-role/generated-tool capabilities |
| L3B | DIRECTION ONLY | Real agent reads captured market data through generated tools |
| L4 | DIRECTION ONLY | Immutable point-in-time Dataset builder with leakage protection |
| L5A–C | DIRECTION ONLY | Correct deterministic execution, production backtest, durable Run artifacts |
| L6A–C | DIRECTION ONLY | Durable collaborative workflow, governed specialist spawning, second CLI adapter |
| L7A–B | DIRECTION ONLY | Independent critic, Evaluation, and gated Report production |
| L8A–C | DIRECTION ONLY | Domain projections, recovery, onboarding, diagnostics, and release |
| L9 | LATER | Recall and optimization after real Evaluation history exists |

## Durable rulings

- Windows/Hermes adapter boundary: [`docs/adr/0001-windows-first-product.md`](../adr/0001-windows-first-product.md)
- Report storage and founder experience: [`docs/DOCTRINE.md` A5/A6](../DOCTRINE.md)
