# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-006d — one skin** *(first order after v0.1 closed)*

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-006d.md`](WO-006d.md) exactly.

- Work on a new branch named `wo-006d`, cut from current `origin/QuantFlow`.
- **Restyle only** — the order's contract forbids behavior, layout, and dependency changes.
- Run the builder-run gates; paste unedited output including the one-skin bait red/green pair, and include the screenshots — the founder personally judges the look.
- Commit and push. **Do not merge.**
- Anything ambiguous or unmappable: stop and say so.

## Founder acceptance checkpoint (founder decision, 2026-07-19)

The founder demos **once, at the milestone that matters**: skin (WO-006d) -> dock (WO-007) -> Hermes wrapped as an AgentOS species in a tile (WO-008), with A2A following. `docs/demos/agent-path.md` remains valid and runs then, alongside the dock's own cold-reopen test. v0.1 is machine-verified and merged; its human half is folded into that checkpoint deliberately, not skipped.

## Parallel-eligible

Nothing — WO-006d touches all of `windows/`, so a parallel order would collide. WO-007 (dock) follows it.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
