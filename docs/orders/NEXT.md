# NEXT — the current order (rotated 2026-07-24: the doctrine ladder begins)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-101 — Research + Agent plane charter**

The Ontology Doctrine (`docs/DOCTRINE.md`, currently v1.3 — **read its amendments section, it carries founder direction**) is the plan of record; `docs/orders/SCOPES.md` is the rung-by-rung ladder; WO-101 is its first rung.

0. Read `AGENTS.md` at repo root — the cold-start briefing, including the commands and the `golden/` ritual.
1. Read `START_HERE.md` in full (note §5.8, the substrate-triage rule).
2. Read `docs/orders/WO-101.md` — the complete order. **Read its revision note first**: this order was cut down on 2026-07-25 after measurement disproved three of its assumptions.
3. Branch `wo-101` from current `main`. Commit from a worktree, never the shared tree.
4. **Commit deliverable 1 alone, first.** Its proof is destroyed if bundled with the rest.
5. Report back per `PROTOCOL.md`; the verifier runs G2 and the cold suite.

**WO-101 is schema-only.** Zero `packages/qf-kernel` changes, zero new actions, zero link work. If you find yourself editing `commands.ts` or `execute.ts`, you have left scope — stop and report.

## Queued behind (do not start)

**WO-102** — Market plane reframe (schema-only; larger than it reads — `event` is a stateful type, so the rename moves a transition table and three commands).

**WO-103 — the write path.** Added 2026-07-25 after measurement: of 19 object types only 3 can be created, 9 defined actions throw `Unknown command`, and **no link in this repo is writable** — the `links` table is generated but has zero reads and zero writes. Until this rung lands, read tools would read empty tables and the closing proof is a traversal over edges that cannot exist. Full reasoning in `docs/orders/SCOPES.md`.

Then P3 (WO-104/105/106, the generated tool plane), P4 (markets), P5 (the loop, the critic, the proof). Eleven rungs, not ten — see SCOPES.md for why.

## Parked / parallel

**Visual pass** (WO-006d one-skin + dock redesign) — founder-gated, off the critical path. **WO-009** — absorbed into WO-106's market pick. **Durable execution** — ROADMAP debt #17, trigger-gated. The old peer-bus PASS notes are history, not routes — peer delivery is merged to main (`a17ea16`…`7a20f0c`), with AE3 carried as labeled debt in that commit, and the `origin/QuantFlow` park record is superseded.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies. Until then, NEXT stays WO-101.*
