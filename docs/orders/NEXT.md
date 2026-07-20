# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-008c — rework round 1** *(science stands; structure fixes)*

Read `docs/orders/WO-008c.md`, bottom verification record. Outcome A host handshake and AgentOS toolloop path are **accepted** — touch D1–D2 only.

- Continue on branch `wo-008c`. First: `git fetch origin && git merge origin/QuantFlow`.
- **D1:** `launch: host_acp` must survive pack / be resolved without relying on unpackaged `agent-package/` source. Falsify: source manifest absent → still host_acp from packed (or documented host config). Paste packed `agentos-package.json`.
- **D2:** one shared host-ACP client — delete the duplicate deny/spawn/handshake in `d0-smoke.ts` and `host-admit-kernel.ts`.
- Static gates + Outcome A + host-admit green; commit and push. **Do not merge.**

## Parallel / blocked

**WO-008a** — after WO-008c passes. **WO-009** — when its order file exists.
---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
