# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-008 — the plug test** *(rung 2 of 3; the first real agent)*

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-008.md`](WO-008.md) exactly.

- Work on a new branch named `wo-008`, cut from current `origin/QuantFlow`.
- **The order was rewritten after the pre-build review** — re-read it fully even if you saw an earlier version. Deliverable 0 is fact-finding with named outcomes A/B/C; stopping at 0 with a precise finding is a success. No prompt is ever sent; credentials never touched.
- **The admitting commit is the gate:** the final commit contains only `species/hermes/**`. Needing to touch dock/host/kernel/gates to admit Hermes is a WO-007 defect to report, not to patch.
- Run the builder gates including **every static gate** (PROTOCOL standing rule); paste unedited.
- Commit and push. **Do not merge.** Stop on anything ambiguous — especially any deviation of `hermes acp` from the proven ACP shape.

> **Pre-build read: done 2026-07-19** — 9 findings; the blocker (host-PATH shim vs. caller-supplied guest env) was confirmed by measurement in the SDK and the order rewritten around it. Ladder note: **WO-008a (permission bridge + tool policy)** now sits between this order and the A2A order; the founder checkpoint remains at A2A.

## Founder acceptance checkpoint (founder decision, 2026-07-19)

The founder demos **once, at the milestone that matters**: skin (WO-006d) -> dock (WO-007) -> Hermes in a tile (WO-008) -> **A2A working end-to-end** (the order after WO-008: second species + host binding, two agents collaborating live). The founder demos once, at A2A, and it includes everything beneath it. `docs/demos/agent-path.md` remains valid and runs then, alongside the dock's own cold-reopen test. v0.1 is machine-verified and merged; its human half is folded into that checkpoint deliberately, not skipped.

## Parallel-eligible

Nothing — WO-007 touches shell, host, schema, and gates; WO-008 (Hermes) is blocked on it and its order is being drafted by the verifier.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
