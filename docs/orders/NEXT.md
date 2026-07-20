# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-008a — Permission bridge + tool policy (Hermes live turn)**

Read `docs/orders/WO-008a.md`. WO-008c host ACP handshake is **merged** — this order unlocks `runTurn` + founder-visible permissions.

- New branch from `QuantFlow` (e.g. `wo-008a`).
- Deny-by-default permission bridge on the shared host ACP client; lift `runTurn` forbid for `host_acp`.
- Per-species tool allowlist at the host seam; falsify unlisted → denied.
- Fix sole-writer ACP perimeter (deliverable 4) so the real SDK import is gated.
- Extract-first: shell JS must not grow; keep `agent-host.ts` under 1k.
- Static gates + build green; commit and push. **Do not merge.**

## Parallel / blocked

**WO-009** — when its order file exists (parallel-eligible per ROADMAP).
---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
