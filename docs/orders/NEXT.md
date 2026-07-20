# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-008b — Hermes reachability**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-008b.md`](WO-008b.md) exactly.

- Work on a new branch named `wo-008b`, cut from current `origin/QuantFlow`.
- **Probe first (deliverable 0):** measure whether typed `AgentOs.create({ mounts })` can expose the host Hermes path into the guest. Paste evidence. Then implement **mount** or **bundle** — do not invent a third channel.
- Goal: `species/hermes` `d0-smoke` → **Outcome A** (handshake). **No prompt to Hermes** (WO-008a's lane).
- Dock may **admit** Hermes (handshake-only after WO-007b); do not Run turn on Hermes.
- Prefer generic host plumbing over `if (species === "hermes")`.
- Run every static gate; paste unedited. Commit and push. **Do not merge.**

## Parallel / blocked

**WO-008a** (permissions) — deps satisfied, but **do not start** until WO-008b lands if you only have one builder (Hermes live needs reachability first). Order file not yet written.

**WO-009** — still parallel-eligible once its order file exists.
---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
