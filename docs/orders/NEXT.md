# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-008 — the plug test** *(rung 2 of 3; the first real agent)*

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-008.md`](WO-008.md) exactly.

- Work on a new branch named `wo-008`, cut from current `origin/QuantFlow`.
- **Founder prerequisites are satisfied** (measured: Hermes v0.18.2 on PATH at `~/.local/bin/hermes`). You still never touch credentials — deliverable 0 stops at the ACP handshake; no prompt is sent by you or any gate.
- **The admitting commit is the gate:** the final commit contains only `species/hermes/**`. Needing to touch dock/host/kernel/gates to admit Hermes is a WO-007 defect to report, not to patch.
- Run the builder gates including **every static gate** (PROTOCOL standing rule); paste unedited.
- Commit and push. **Do not merge.** Stop on anything ambiguous — especially any deviation of `hermes acp` from the proven ACP shape.

> **Founder — pre-build read strongly recommended for this one:** attach the Hermes docs (hermes-agent.nousresearch.com/docs) and AgentOS indexes to a third agent for the two-question read plus the external-surface check. This is the most vendor-dependent order on the ladder; the last three pre-reads caught 8, 2, and 8 findings.

## Founder acceptance checkpoint (founder decision, 2026-07-19)

The founder demos **once, at the milestone that matters**: skin (WO-006d) -> dock (WO-007) -> Hermes in a tile (WO-008) -> **A2A working end-to-end** (the order after WO-008: second species + host binding, two agents collaborating live). The founder demos once, at A2A, and it includes everything beneath it. `docs/demos/agent-path.md` remains valid and runs then, alongside the dock's own cold-reopen test. v0.1 is machine-verified and merged; its human half is folded into that checkpoint deliberately, not skipped.

## Parallel-eligible

Nothing — WO-007 touches shell, host, schema, and gates; WO-008 (Hermes) is blocked on it and its order is being drafted by the verifier.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
