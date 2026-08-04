# NEXT — R3 the orchestrator hires

status: ACTIVE
authorized-by: founder
authorized-at: 2026-08-03
baseline: R2 complete on `act-i-ladder` (capability grants)
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) — R3

> Execute R3 only as the active rung of the continuous Act I walk (`SPRINT.md`).

## Objective

An orchestrator seat reads the Dock catalog, creates and starts a session through the ontology
gateway, and a canvas tile appears because the Kernel says so.

## In plain terms

You should see a tile appear that you did not click — the canvas read the Kernel.

## Deliverables

1. `qf_agent_definition_query`, `qf_create_agent_session`, `qf_start_agent_session` callable through
   R1 gateway, scoped by R2 grants.
2. Canvas renders a tile for any `agent_session` it did not create itself.
3. Every hired session carries `spawned_from` to its definition.
4. Gate with falsification; evidence under `docs/orders/evidence/r3/`; `FOUNDER-REVIEW.md` queued.

## Acceptance

- Orchestrator catalogs real `agent_definition` rows.
- Create + start via gateway → Kernel row + `spawned_from` + queried canvas tile bound to session id.
- Direct Kernel insert while app runs still produces a tile.
- Falsify: drop `spawned_from` → red; UI-state tile → `no-canvas-domain-writes` red.

## Out of scope

Orchestrator judgment about whom to hire. Task assignment (R5).

## Stop conditions

Any SPRINT hard stop.
