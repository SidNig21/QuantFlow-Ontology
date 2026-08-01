# NEXT — the current order (rotated 2026-07-31 after WO-107b PASS)

> **Builder: this file is your complete entry point.** It always points at the single unblocked
> order. Do not choose another order or proceed past it.
> **Founder:** give a fresh builder this file: *“Follow `docs/orders/NEXT.md`.”*

## Current order: **[WO-107c](WO-107c.md) — market context completes the ingest graph**

Read `START_HERE.md`, this file, WO-107c, and `PROTOCOL.md` in the required order. Branch from the
verified WO-107b merge on `main`, use an isolated worktree, build the full context/link/upgrade
slice as one batch, run its focused acceptance once, and stop for independent verification.

**In plain terms:** QuantFlow can now load prices safely; connect each price to Bovada and its real
football event before live network data is allowed into the app.

## Build priority

1. Add trusted-only, replay-safe `register_venue` and `schedule_market_event` commands through
   `execute()`, with forced scheduled state and source provenance.
2. Extend the existing market batch with one venue identity and optional per-instrument event
   identity; derive `lists`, `offered_on`, and `quotes` under the same transaction.
3. Generate `0003`, preserve all three predecessor shapes, and require it in the real package.
4. Keep the agent-served MCP set byte-identical at 92 and close the slice with `market-context`.
5. Build the complete chunk before focused acceptance; then run the four named baits.

## Hard boundaries

- Never place, execute, or automate a bet or trade; never handle credentials.
- No real Bovada football/network fetch, parser fixture, timer/cron, live model, or Dock demo yet.
- Context actions are trusted-only and must not enter the agent MCP surface.
- No second ingest command, no writes outside `execute()`, and no silent event/venue updates.
- Do not add dependencies or weaken an existing gate.

## Behind WO-107c

WO-107 connects one public unauthenticated Bovada football capture to this now-complete graph, adds the
bounded schedule, and proves a real seat can answer a cross-object question. WO-109 then runs the
collaborative lower loop over real Kernel evidence.

---

*The order log in [README.md](README.md) wins on status. The verifier rotates both this builder door
and [VERIFYING.md](VERIFYING.md) in the same passing merge.*
