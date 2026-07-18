# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-004**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute `docs/orders/WO-004.md` exactly.

- Work on a new branch named `wo-004`.
- Stay strictly inside the order's scope — anything not listed in its Deliverables is out.
- Run every acceptance gate and paste the full, unedited output in your report, using the order's Report-back format.
- Commit to your branch and push it. **Do not merge.**
- If anything in the order is ambiguous, stop and say so instead of improvising.

WO-004 is a **proof order**, not a feature order: it tests whether AgentOS → ACP → `ToolLoopAgent` can hold one session ID with one server process. A clean, well-evidenced failure is a successful outcome and is what the order asks for if the chain doesn't hold — do not force a pass.

## Parallel-eligible (second builder only, never the same builder)

**WO-005 — Kernel v0** (SQLite from the generated migrations + trace context + ledger table + Law E gates) is unblocked: its dependencies WO-001 and WO-003 are both `done`. Its order file is written on request — ask the architect for it before starting a second builder. Do not begin WO-005 from the roadmap line alone; no order file, no work.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked order. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
