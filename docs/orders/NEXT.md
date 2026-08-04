# NEXT — R5 durable delegation

status: ACTIVE
authorized-by: founder
authorized-at: 2026-08-03
baseline: R4 complete on `act-i-ladder` (Claude Code species)
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) — R5

> Execute R5 only as the active rung of the continuous Act I walk (`SPRINT.md`).

## Objective

Task creation and assignment live as Kernel objects and links — not peer-bus messages — so work
survives close and reopen.

## In plain terms

Kill the seats mid-task, reopen, and the assignment is still there.

## Deliverables

1. `create_task` / assign / complete transitions via `execute()`; `assigned_to` link required.
2. Gateway exposes desk task actions under R2 grants.
3. Peer-bus may notify only; meaning is Kernel.
4. Gate with bus-only bait + illegal transition bait; evidence under `docs/orders/evidence/r5/`.

## Acceptance

Create + assign → link exists; worker → done → event log; close/reopen → task/link/state intact.

## Out of scope

Scheduling, retries, priorities, deadlines.

## Stop conditions

Any SPRINT hard stop. Stay experimental — no schema promotion.
