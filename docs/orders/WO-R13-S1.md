# WO-R13-S1 — restore the Windows gate board

status: open
assignee: builder
depends: R12 complete

## Objective

Restore the local Windows gate board so the remaining R13 consumer work can be measured and verified without false reds.

## In plain terms

Make the check-engine light trustworthy before diagnosing the stalled Hermes turn. This order does not change the consumer workflow.

## Context pack

- `START_HERE.md`
- `docs/orders/PROTOCOL.md`
- `docs/orders/NEXT.md`
- `docs/orders/evidence/r13/PROGRESS.md`
- `qa/run.ts`
- `collab-electron/src/main/r13-consumer-workflow.check.ts`

## Deliverables

1. Move the R13 consumer diagnostic out of `collab-electron/src/main/` and into the QA/diagnostic surface so `kernel-sole-writer-app` evaluates product code only. Do not add an allowlist exception for it.
2. Reproduce and name the shared Windows Bun `EPERM` failure in exactly these three gates: `kernel`, `dock-profile-identity`, and `kernel-one-path`.
3. Apply the smallest supported install/toolchain repair shared by those gates. Do not delete broad caches, weaken assertions, skip installs, or replace frozen installs with mutable installs.
4. Record the unedited red and green transcripts in `docs/orders/evidence/r13-s1/VERIFICATION.md`.

## Contract

- Windows is canonical.
- Kernel remains the sole writer and no new truth store is introduced.
- A gate may be repaired, but no gate, assertion, or production-file boundary may be weakened.
- Do not change Hermes, prompts, native-TUI admission, model routing, R14, or RL.
- No credentials are read, copied, printed, or modified.

## Acceptance gates

The builder runs on native Windows:

```powershell
bun qa/run.ts kernel-sole-writer-app
bun qa/run.ts kernel
bun qa/run.ts dock-profile-identity
bun qa/run.ts kernel-one-path
bun qa/run.ts schema
bun qa/run.ts repo-shape
bun qa/run.ts lockfile-committed
bun qa/run.ts kernel-sole-writer
bun qa/run.ts no-canvas-domain-writes
bun qa/run.ts one-skin
git diff --check
```

All must pass. The verifier repeats the same commands from a fresh detached worktree. The existing three `EPERM` failures and the current `kernel-sole-writer-app` offender are the required red side of the falsification transcript; the repair must turn those exact failures green.

## Out of scope

First-turn diagnosis, consumer-flow fixes, UI redesign, package signing, installer finalization, R14, RL, live betting, and trading.

## Report back

Return the commit SHA, exact failing cause, exact repair, every command result, and any remaining red gate. Stop after this order; do not begin S2 automatically.
