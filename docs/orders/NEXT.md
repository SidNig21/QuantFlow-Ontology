# NEXT — R13-S1 Windows gate board

status: R13 IN PROGRESS — WO-R13-S1 ONLY
authorized-by: founder
authorized-at: 2026-08-11
baseline: R0–R12 complete on `wo-r9-research-integrity` at `e20e5d0`
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) · R13
active-order: [`WO-R13-S1.md`](WO-R13-S1.md)

## Active outcome

Restore the native-Windows gate board without weakening it: remove the R13 diagnostic from the app sole-writer scan and repair the shared Bun `EPERM` install failure blocking `kernel`, `dock-profile-identity`, and `kernel-one-path`.

## Why this is first

The planned first-turn measurement cannot close while a mandatory static gate is red. This is the only sequencing correction to the five-slice R13 plan: make the measuring instruments trustworthy, then measure Hermes, then scope the repair from that evidence.

## Boundary

Only `WO-R13-S1.md` is authorized. Do not diagnose or change Hermes behavior, prompts, native-TUI behavior, consumer UI, installer/signing, R14, or RL. Do not weaken or bypass a gate. Never place bets or trades.

Before a builder edits code, a separate reviewer must answer the two `PROTOCOL.md` questions for S1: can every gate fail, and does every deliverable have exactly one meaning?

## Current evidence

- `kernel-sole-writer-app` is red on `collab-electron/src/main/r13-consumer-workflow.check.ts`.
- `kernel`, `dock-profile-identity`, and `kernel-one-path` reproduce the same Windows Bun `EPERM` copy failure for `qf-kernel-schema`.
- `schema`, `repo-shape`, `rung-ladder`, and `one-skin` are green at the baseline.
- [`evidence/r13/PROGRESS.md`](evidence/r13/PROGRESS.md) remains the consumer-workflow progress record.

After independent verification of S1, rewrite this file to authorize `WO-R13-S2.md` only.
