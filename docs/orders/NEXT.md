# NEXT — R2 capability grants and operating instructions

status: ACTIVE
authorized-by: founder
authorized-at: 2026-08-03
baseline: R1 complete on `act-i-ladder` (ontology gateway)
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) — R2

> Execute R2 only as the active rung of the continuous Act I walk (`SPRINT.md`).

## Objective

The Kernel decides which tool groups a role receives, and seats get written operating
instructions. Capability groups only — never hand-listed tool names.

## In plain terms

An orchestrator may use desk tools; a worker may not. Each seat knows what it is for because its
profile points at written instructions.

## Deliverables

1. Schema field `capability_groups` on `agent_definition` (experimental; do not promote).
2. Schema-side `capabilityGroup` tags so tools inherit groups from object/action definitions.
3. Gateway enforces grants from Kernel definition rows.
4. Non-null `system_prompt_ref` on Dock profiles with committed prompt files.
5. Gate with falsification (worker spawn/desk tool refused); evidence under `docs/orders/evidence/r2/`.

## Acceptance

- Orchestrator receives desk tools; worker does not.
- Worker attempting a desk/spawn tool is refused.
- Add a new tagged object type → regenerate → group picks it up with no hand roster edit.
- Stay experimental; propose promotion only in the report.

## Out of scope

Schema promotion to `active`. Full orchestrator hire/canvas (R3). Second species (R4).

## Stop conditions

Any SPRINT hard stop, especially schema promotion.
