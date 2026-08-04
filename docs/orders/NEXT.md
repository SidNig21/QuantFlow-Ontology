# NEXT — R1 the ontology gateway

status: ACTIVE
authorized-by: founder
authorized-at: 2026-08-03
baseline: R0 complete on `act-i-ladder` (hermes-founder-state gated)
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) — R1

> Execute R1 only as the active rung of the continuous Act I walk (`SPRINT.md`). Do not select
> work from later rungs until this one closes.

## Objective

Ship an app-owned MCP gateway so a Dock-spawned seat can call generated `qf_*` read tools and get
real Kernel data back — without the seat ever holding a database handle.

## In plain terms

Today agents get a mailbox and no world. After this rung, a seat can ask the Kernel a read question
through the app, and the answer matches what the Kernel itself knows.

## Deliverables

1. An app-owned MCP server exposing the generated tool surface (reads). Calls resolve inside the
   app; a seat never holds a database handle.
2. Stateless design — no session state on the server; caller identity carried per request.
3. Every tool call recorded as a trajectory artifact.
4. Launch wiring so a Dock Hermes seat receives this gateway (alongside collaboration MCP).
5. Packaged resource path resolution matching the collaboration bridge pattern.
6. A runnable gate registered in `qa/run.ts`, falsified (foreign DB refused), with evidence under
   `docs/orders/evidence/r1/`.

## Acceptance proof

- [ ] Spawn one seat. It calls a generated read tool.
- [ ] Returned object ids match a direct Kernel query.
- [ ] Falsify: point the seat at a database the app does not own — the call is refused, exactly as
      the peer-bus handler already refuses a foreign `busDb`.
- [ ] `bun qa/verify-release.ts` exits 0.
- [ ] Evidence states what was proven and what was not.

## Out of scope

Writes. Role scoping (R2). A second species (R4).

## Stop conditions

Stop immediately on any SPRINT hard stop (schema promotion, START_HERE/DOCTRINE/LAWS edit,
credentials, founder-data deletion, two failed rework cycles).

## Durable rulings

- Windows/Hermes adapter boundary: [`docs/adr/0001-windows-first-product.md`](../adr/0001-windows-first-product.md)
- Route contract: [`GOLDEN-RUN.md` Part IV R1](GOLDEN-RUN.md)
