# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-008e — A2A 4-tile proof**

Read `docs/orders/WO-008e.md`. Founder 2026-07-20: **orchestrator → Workers A+B (simultaneous) → Reviewer → talk-back to orchestrator.** Datasets stay parked.

- New branch from `QuantFlow` (e.g. `wo-008e`).
- Four Hermes term tiles; Kernel-mediated fan-out / fan-in / talk-back; falsify side-channel.
- Extract-first; static gates + build green; commit and push. **Do not merge.**

## Parallel / blocked

**WO-009** — parked until WO-008e holds. **WO-012** — after multi-agent seam exists.
---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
