# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-007b — host seams**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-007b.md`](WO-007b.md) exactly.

- Work on a new branch named `wo-007b`, cut from current `origin/QuantFlow`.
- **Do not touch `species/**`** — WO-008's admitting lane is closed; that tree is out of bounds here.
- Probe first (deliverable 0): verify-or-reject manifest env defaults before inventing a channel.
- Split `spawnAgentSession` into `admitAndStartSession` + `runTurn`; dock spawn must not prompt.
- Extract-first: `renderer.js` / `tile-manager.js` may not grow (paste before/after line counts).
- Run the builder gates including **every static gate** (PROTOCOL standing rule); paste unedited.
- Commit and push. **Do not merge.** Stop on anything ambiguous.

## Parallel-eligible

**WO-009 — Datasets I** is parallel-eligible (independent of 007/008). A second builder may take it with the standard script once its order file exists and the log says open.

**Blocked (do not start):** WO-008a (needs WO-007b) · WO-008b (needs WO-007b; order not yet written).
---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
