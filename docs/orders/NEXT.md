# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-008c — Hermes host-bridged ACP**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-008c.md`](WO-008c.md) exactly.

- Work on a new branch named `wo-008c`, cut from current `origin/QuantFlow`.
- **Hermes runs on the host** (`hermes acp` stdio) — do **not** try to exec it inside AgentOS guest (WO-008b measured that dead end).
- Dock **Spawn** → session **tile** (handshake only). **No prompt / Run turn** on Hermes (WO-008a).
- Keep AgentOS path green for toolloop / critic-mock.
- Prefer a data-driven `host_acp` launch route over scattered Hermes special cases.
- Static gates + build; paste unedited. Commit and push. **Do not merge.**

## Parallel / blocked

**WO-008a** — after this order. **WO-009** — when its order file exists.
---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
