# NEXT — R13 Windows v1 release

status: R13 IN PROGRESS — `WO-V2-1` ONLY
authorized-by: founder
authorized-at: 2026-08-12
baseline: R0–R12 complete on `wo-r9-research-integrity`
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) · R13
active-order: [`WO-V2-1.md`](WO-V2-1.md)
scope source: [`../proposals/V2-SCOPE.md`](../proposals/V2-SCOPE.md) — approved 2026-08-12

## Active outcome

Produce an installable Windows build of the current source, opened from a desktop
shortcut like any other application, containing everything through R12. The Dock
must list production profiles only, `hermes-critic` must be launchable, a spawned
seat must report `5 tools · 0 skills`, and closing the app must leave no processes.

## Why this is first

Measured 2026-08-12 by driving the installed application: the installed build is
dated 2026-08-04 and predates all of R9–R12. It has no critic seat, no Research
Ledger, and hands Hermes 31 tools and 82 skills. **You cannot accept a product you
cannot install**, so every founder judgement below this rung is unreachable until
packaging works. This replaced the previous first slice, which repaired the gate
board — that work is folded into this order because the same red gates block it.

## Boundary

Only `WO-V2-1.md` is authorized. Do not diagnose or change Hermes behaviour, the
first-action stall, prompts, native-TUI behaviour, consumer UI, task creation,
cables, or research-object projections. Do not obtain a signing certificate — the
artifact states its signing status honestly. No R14–R18. Never place bets or trades.

Before a builder edits code, a reviewer who did not author the order must answer
the two `PROTOCOL.md` questions: can every gate fail, and does every deliverable
have exactly one meaning? **`WO-V2-1` has not had this read** — it was authored by
the same session that scoped it, so that seat is spent. This is the lead session's
first action, per [`AUTONOMY.md`](AUTONOMY.md).

Unattended operation is governed by [`AUTONOMY.md`](AUTONOMY.md). Note that this
order ends in a founder acceptance step and therefore cannot complete without the
founder present — that is the intended stopping point, not a defect.

## Current evidence

- Installed app 2026-08-04 vs source 2026-08-12 — verified by running both.
- `kernel`, `typecheck`, `dock-profile-identity`, `kernel-one-path` fail with the
  same Bun `EPERM` copy failure for `qf-kernel-schema`.
- `kernel-sole-writer-app` is red on `collab-electron/src/main/r13-consumer-workflow.check.ts`.
- `claude-code-ungranted`, a negative test fixture, ships in the production Dock.
- Electron Builder stalls traversing the Bun dependency tree.
- ADD works today: one Dock click produced a governed session, one tile, and a
  `RUNNING` ledger row in under 15 seconds, with clean shutdown after.
- [`evidence/r13/PROGRESS.md`](evidence/r13/PROGRESS.md) remains the consumer-workflow record.

After independent verification of `WO-V2-1`, rewrite this file to authorize
`WO-V2-2` only — measure the first Hermes turn, synthetically before live.
