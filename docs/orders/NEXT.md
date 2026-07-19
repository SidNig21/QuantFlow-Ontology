# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-006c — one agent path end-to-end** *(closes v0.1; amended ×2 on 2026-07-19 — doc-index audit, then the pre-build reviewer read: all 8 findings measured and folded in. The order is cleared for build.)*

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-006c.md`](WO-006c.md) exactly.

- Work on a new branch named `wo-006c`, cut from current `origin/QuantFlow`.
- **Deliverable 0 first**: prove AgentOS runs inside Electron's main process before touching UI. If it does not, stop and report the exact error — that is a successful outcome for a proof step, and it redirects the order cheaply.
- Stay strictly inside the Deliverables; the Out-of-scope list is binding. The only schema-surface edits permitted are the ones deliverable 1 authorizes verbatim.
- Run the **builder-run** gates only; paste full unedited output, including every red/green falsification pair. **Never `bun qa/run.ts --all`, never delete `node_modules`.**
- Commit to your branch and push. **Do not merge.**
- If anything is ambiguous or unbuildable as written, **stop and say so.**

> **Pre-build read: done 2026-07-19** (third agent, doc indexes in hand) — 8 findings, 2 confirmed blockers (`starting→failed` transition gap; creation-catalog shape), all re-measured by the verifier and folded into the order. ~~Founder — before handing this to the builder: give the order a five-minute **pre-build read** by a *third* agent (neither the builder nor the verifier; two questions only: can each gate actually fail? does each deliverable have exactly one meaning?). The last two pre-build reads caught five and three architect defects respectively, and this is the phase gate.~~

## Parallel-eligible

Nothing — this is the last v0.1 rung. When it merges, the v0.5 ladder opens **two lanes that run at once** (`ROADMAP.md`): dock/agent (WO-007 → 008 → 012) and data (WO-009 → 010/011).

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
