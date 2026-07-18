# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-001**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute `docs/orders/WO-001.md` exactly.

- Work on a new branch named `wo-001`.
- Stay strictly inside the order's scope — anything not listed in its Deliverables is out.
- Run every acceptance gate and paste the full, unedited output in your report, using the order's Report-back format.
- Commit to your branch and push it. **Do not merge.**
- If anything in the order is ambiguous, stop and say so instead of improvising.

## Parallel-eligible (second builder only, never the same builder)

*none — WO-004 becomes parallel-eligible once its order file is detailed.*

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked order. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
