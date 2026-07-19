# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-007 — Dock v1** *(rung 1 of 3 to the founder checkpoint)*

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-007.md`](WO-007.md) exactly.

- Work on a new branch named `wo-007`, cut from current `origin/QuantFlow`.
- The dock contract in `ROADMAP.md` is binding: species from `agent_definition` rows, dock stores nothing, no hardcoded species strings in renderer source.
- Deliverable 1's schema amendment is authorized **verbatim and only as written**.
- Run builder gates; paste every red/green falsification pair. **Never `bun qa/run.ts --all`, never delete `node_modules`.**
- Commit and push. **Do not merge.** Stop and report anything ambiguous.

> **Founder — pre-build read recommended:** the verifier wrote WO-007 and the verifier's eyes are spent on it. Same two questions as always; the last two pre-reads caught eight findings and two blockers between them.

## Founder acceptance checkpoint (founder decision, 2026-07-19)

The founder demos **once, at the milestone that matters**: skin (WO-006d) -> dock (WO-007) -> Hermes wrapped as an AgentOS species in a tile (WO-008), with A2A following. `docs/demos/agent-path.md` remains valid and runs then, alongside the dock's own cold-reopen test. v0.1 is machine-verified and merged; its human half is folded into that checkpoint deliberately, not skipped.

## Parallel-eligible

Nothing — WO-006d touches all of `windows/`, so a parallel order would collide. WO-007 (dock) follows it.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
