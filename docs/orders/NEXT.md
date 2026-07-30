# NEXT — the current order (rotated 2026-07-30 after WO-K3b PASS)

> **Builder: this file is your complete entry point.** It always points at the single unblocked
> order. Do not choose another order or proceed past it.
> **Founder:** give a fresh builder this file: *“Follow `docs/orders/NEXT.md`.”*

## Current order: **[WO-N1](WO-N1.md) — product identity: QuantFlow, not Collaborator**

Read `START_HERE.md`, this file, WO-N1, and `PROTOCOL.md` in the required order. Branch from the
verified WO-K3b merge on `main`, use an isolated worktree, implement the complete identity/migration
slice as one batch, run its focused acceptance once, and stop for independent verification.

**In plain terms:** the runtime and artifact foundations are now honest; make the shipped app,
installer, release target, and local app folders say QuantFlow without making the founder's existing
canvas, browser, or workspace state disappear.

## Build priority

1. Implement the pinned QuantFlow identity across package, executable, update metadata, release
   tooling, installer, CLI chrome, and current UI—while preserving `collab-electron/`, the upstream
   remote, internal lineage, and compatibility seams.
2. Introduce global `QF_APP_ROOT` plus worktree-isolated `QF_APP_DIR`; atomically stage and copy
   persistent legacy state without following symlinks or copying Kernel/artifact/PID/socket files.
3. Move Electron `userData` and existing/new workspace metadata through the same retry-safe migration
   boundary before any consumer creates the new destination.
4. Couple source identity, real boot delegation, the migration matrix, and shipped Linux identity to
   permanent gates. Update the official README with the final three-root layout.
5. Run unit/build and focused gates once after the full batch, then the three required production
   baits. Never run the credential-reading release command.

## Hard boundaries

- Never place, execute, or automate a bet or trade; never handle credentials.
- Never delete or move `~/.collaborator`; never mutate legacy Kernel artifact references.
- Do not rename `collab-electron/`, change the `upstream` remote, erase attribution/history, move the
  Kernel/artifact roots, or pull Bovada/browser/RL feature work into this order.

## Behind WO-N1

The doctrine ladder resumes toward real market ingest and the founder's collaborative research
workflow. Caller-bound per-profile grants still close before unscripted WO-109 collaboration; the
order after N1 is promoted only after this shipped identity/migration proof passes.

---

*The order log in [README.md](README.md) wins on status. The verifier rotates both this builder door
and [VERIFYING.md](VERIFYING.md) in the same passing merge.*
