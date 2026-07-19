# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-006b — Kernel in the app (Law D)**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-006b.md`](WO-006b.md) exactly.

- Work on a new branch named `wo-006b`, cut from current `origin/QuantFlow`.
- Stay strictly inside the order's Deliverables; its Out-of-scope list is binding.
- Run the **builder-run** gates only and paste full, unedited output in the order's Report-back format. **Never `bun qa/run.ts --all`, never delete `node_modules`.**
- Commit to your branch and push. **Do not merge.**
- If anything is ambiguous or unbuildable as written, **stop and say so** — that is a fast path, not a failure.

This is the first order whose acceptance the **founder** verifies hands-on: publish an Artifact, kill the app, relaunch, and the tile must show the same Artifact served from `kernel.db` (`docs/demos/law-d.md` is part of the deliverables).

> **Note to the founder:** WO-006b was written by the verifier against measured app code, but has **not** had a pre-build reviewer read. The five-minute two-question read from `PROTOCOL.md` (can each gate fail? one meaning per deliverable?) caught D1 on WO-006a before it was built — worth repeating here before handing this out.

## Parallel-eligible

Nothing. WO-006c (agent path from canvas) is blocked on this order; the verifier writes it while WO-006b builds.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
