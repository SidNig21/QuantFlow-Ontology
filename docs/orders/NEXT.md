# NEXT — R0 packaged Windows collaboration baseline

status: ACTIVE
authorized-by: founder
authorized-at: 2026-08-03
baseline: `wo-windows-return@e75d110`, merged to `main` 2026-08-03
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) — R0 is the floor of Act I

> **Named R0, not L1 (renamed 2026-08-03).** This order was authored as "L1" against a private ladder
> that duplicated the route in `GOLDEN-RUN.md` under different letters. Two ladders naming the same
> rung is the exact rot the 2026-08-03 restructure removed, so the L-names are retired. Evidence
> files and commits written before the rename still say L1; they mean this order.

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
- **Merged to `main` on 2026-08-03**, on the founder's instruction, after `bun qa/verify-release.ts`
  passed end to end on the merged result. The bridge is packaged and the branch is no longer the
  baseline of record. What remains unproven is the *installed-application* acceptance below, not the
  code.
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
9. ~~Commit completed work locally; do not push or merge until the founder reviews the final
   report.~~ **Discharged 2026-08-03** — the founder instructed the merge after the release verifier
   passed on the merged result.
10. **Add an automated gate for deliverable 2.** Deliverable 6 already requires a before/after
    SHA-256 of the global Hermes configuration, but that is captured *by hand* during acceptance.
    No gate in `qa/` reads `~/.hermes` — `windows-cold-boot` photographs `~/.quantflow` on the
    Windows side only. Until a gate covers it, "founder Hermes state untouched" is an acceptance
    step, not a measurement, and no verification record may describe it as *proven*.

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
- [x] `bun qa/verify-release.ts` passes on the merged result — **done 2026-08-03, exit 0**, all nine
      stages green including the packaged cold boot.
- [ ] A gate covers the founder-Hermes-state claim (deliverable 10), or the claim is downgraded to
      "checked by hand during acceptance" everywhere it appears.

## Stop conditions

Stop immediately and report exact evidence if any of these occur:

- any founder-state mutation;
- the installed app cannot complete the real collaboration receipt;
- founder manual tile input queues or truncates;
- packaging requires CI expansion, AgentOS redesign, broad refactoring, or unrelated
  infrastructure work;
- installed acceptance requires copying, exposing, rewriting, or packaging credentials;
- the isolated runtime cannot be proven distinct from founder state.

## Carried debt this rung knowingly ships with

**Debt #32 — the seat launcher writes a Linux-only symlink into Windows app state.**
`collab-electron/cli/qf-hermes-launch.sh` runs inside WSL and links the founder's `auth.json` into a
Windows path, producing an `IO_REPARSE_TAG_LX_SYMLINK` reparse point that no Windows process can
read. The intent is right — never copy the token — but the placement is wrong, and it crashed
`windows-cold-boot` until that gate was hardened on 2026-08-03. It does not block boot now. Fix
shape: move the per-seat profile root into the WSL filesystem, where the link is native and no
Windows process walks it. Close it on this rung if it is cheap; otherwise it stays recorded in
[`DEBT.md`](../DEBT.md) and does not gate acceptance.

## Do not touch

- L2 evidence-integrity guards;
- ontology tool integration or role/capability grants;
- datasets, research rows, backtesting, orchestration, or critic/report implementation;
- Codex CLI or Claude Code adapters;
- AgentOS architecture;
- broad UI redesign;
- schema migration or unrelated Linux porting;
- CI/GitHub Actions.

## What comes after — not authorized work

**The ladder lives in one place: [`GOLDEN-RUN.md`](GOLDEN-RUN.md).** The duplicate L0–L9 table that
stood here was deleted on 2026-08-03. It named the same rungs as the route document under different
letters, and a second ladder is how a builder ends up authorized by whichever list it read first.

Next after R0 is **R1 — the ontology gateway**: a Dock seat calling generated ontology tools through
an app-owned gateway. Every rung in Act I depends on R1 existing. Read the route for the rest; read
nothing there as authorization.

## Durable rulings

- Windows/Hermes adapter boundary: [`docs/adr/0001-windows-first-product.md`](../adr/0001-windows-first-product.md)
- Report storage and founder experience: [`docs/DOCTRINE.md` A5/A6](../DOCTRINE.md)
