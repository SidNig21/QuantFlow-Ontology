# WO-g5a — Kernel write path for connection

status: BUILT — evidence in docs/orders/evidence/wo-g5a/ (founder gate review)
branch: `wo-g5a-connection-actions`
program: GLACIER · Kernel precursor to WO-g5
ladder: **non-ladder.** Does not touch R0–R9, does not edit `NEXT.md` / `GOLDEN-RUN.md`.

> Adds `create_connection` / `delete_connection` experimental actions so canvas cables
> can persist through the Kernel command path only. Table DDL for `connection` is unchanged.
> Lifecycle stays `experimental` (no promotion).

Depends on: nothing (empty dep set). Must merge before WO-g5 UI.

## Deliverables

1. Schema actions + AGENTS.md descriptions; wire into `schema.actions` and `creationCommands`.
2. Kernel handlers INSERT/DELETE via `execute()` only.
3. Regenerate `qf-kernel-schema/golden/`; update kernel-drift fixtures deliberately; report the diff.
4. Evidence under `docs/orders/evidence/wo-g5a/`.

## Gates

`kernel-drift`, `schema`, `schema-bundle-aliases`, `kernel-one-path`, `kernel-sole-writer`,
`kernel-sole-writer-app`, `typecheck`, `rung-ladder`.
