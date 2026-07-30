# NEXT — the current order (rotated 2026-07-30 after WO-D1 PASS)

> **Builder: this file is your complete entry point.** It always points at the single unblocked
> order. Do not choose another order or proceed past it.
> **Founder:** give a fresh builder this file: *“Follow `docs/orders/NEXT.md`.”*

## Current order: **[WO-D2](WO-D2.md) — one Dock Catalog, one launch path**

Read `START_HERE.md`, this file, WO-D2, and `PROTOCOL.md` in the required order. Branch from the
verified WO-D1 merge on `main`, use an isolated worktree, and use Cursor CLI Composer 2.5 for the
implementation. The builder works in one implementation batch, runs each focused acceptance gate
once plus the required baits, reports evidence, and stops. It does not self-verify or merge.

**In plain terms:** the normal Dock and the hidden Peer Seats panel currently disagree about which
agent was launched. Remove the hidden catalogue and make every Dock card launch its exact Kernel
profile through the shared packaged CLI adapter.

## Build priority

1. Carry `definitionId`, packaged `adapterId`, and nullable `runtimeProfile` as separate values.
2. Let package metadata—not Electron host code—translate a runtime profile into argv tokens.
3. Bootstrap qf-toolloop and three Hermes defaults from package-owned manifests through `execute()`;
   after that, the Kernel is the only catalogue.
4. Delete `hermes-seats.ts`, `qf:seats:*`, its preload/UI branch, and the Peer Seats section.
5. Preserve live peer delivery by moving PTY registration to the generic successful launch path.
6. Compensate native-TUI children on Kernel create/start failures.
7. Prove the real shipped resources launch two shared-package profiles with distinct argv and exact
   session-to-definition links, using a credential-free fake executable and temporary HOME.

## Hard boundaries

- Never place, execute, or automate a bet or trade; never handle credentials.
- No schema, golden, or D1-upgrade change. Do not delete or rewrite existing Kernel rows.
- No renderer argv/env/package/profile/role input. It supplies only a definition id.
- No profile-home reads/writes, Hermes setup automation, real model turn, network call, or API key.
- No peer-bus redesign, grants, caller identity, typed delegation, A2A choreography, MCP migration,
  product rename, Bovada ingest, browser tile, RL, SDK replacement, betting, or trading.
- No dependency additions. Package manifests initialize missing defaults only; they never become a
  second runtime registry or overwrite operator truth.
- Update the root README and live Dock/Hermes docs when the hidden Peer Seats path disappears.

## Behind WO-D2

If D2 cannot factor honest cleanup across untouched ACP and AgentOS launchers, cut the measured D2b
cleanup order immediately; do not hide the residual. Then close the caller-bound per-profile grants
seam before unscripted WO-109 collaboration. WO-N1 product identity becomes unblocked only after D2.

---

*The order log in [README.md](README.md) wins on status. The verifier rotates both this builder door
and [VERIFYING.md](VERIFYING.md) in the same passing merge.*
