# NEXT — the current order (rotated 2026-07-30 after WO-N1 PASS)

> **Builder: this file is your complete entry point.** It always points at the single unblocked
> order. Do not choose another order or proceed past it.
> **Founder:** give a fresh builder this file: *“Follow `docs/orders/NEXT.md`.”*

## Current order: **[WO-107b](WO-107b.md) — market-plane bulk ingest**

Read `START_HERE.md`, this file, WO-107b, and `PROTOCOL.md` in the required order. Branch from the
verified WO-N1 merge on `main`, use an isolated worktree, implement the complete ingest mechanism as
one batch, run its focused acceptance once, and stop for independent verification.

**In plain terms:** QuantFlow now ships under its own name; give it one trustworthy door for loading
market rows so the next order can connect real Bovada data instead of inventing another write path.

## Build priority

1. Close the public raw-write exports, then add the schema-owned `pipelineOnly` command family and
   one `ingest_market_batch` action without exposing it to agent MCP tools.
2. Ship the generated `0002` upgrade and prove fresh, pre-D1, and D1 databases converge without
   losing existing data.
3. Atomically ingest strict instrument/quote batches with source Artifact provenance, stable row
   digests, derived `quotes` links, replay no-op, and typed conflict rollback.
4. Prove `has_leg` becomes reachable without interpreting `ticket.legs`; keep venue/event links out.
5. Build the whole slice before running focused acceptance once, then run four falsification baits.

## Hard boundaries

- Never place, execute, or automate a bet or trade; never handle credentials.
- No real Bovada/network fetch, cron, Dock UI, venue/event creation, or nested market interpretation.
- No per-type creation verbs for `pipelineFed` objects and no writes outside `execute()`.
- Do not add dependencies, silently upsert prices, or weaken an existing gate.

## Behind WO-107b

WO-107 connects real Bovada data to this mechanism. WO-109 then runs the collaborative Dock loop
over real Kernel evidence; only the next verified order is promoted after WO-107b passes.

---

*The order log in [README.md](README.md) wins on status. The verifier rotates both this builder door
and [VERIFYING.md](VERIFYING.md) in the same passing merge.*
