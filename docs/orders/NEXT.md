# NEXT — the current order (rotated 2026-07-25: WO-103 written, P2 opens)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-103 — The write path: creation, edges, and a broken Kernel**

P1 is complete (WO-101 and WO-102 both verified and merged 2026-07-25). **WO-103 is the rung the whole ladder was missing.** Today the system describes 23 object types but can create only **3**, and **zero** of its 14 link types are writable — the `links` table has existed since WO-001 with zero reads and zero writes. Until this lands, every rung above it builds tools that read empty tables and a loop that cannot record itself.

0. Read `AGENTS.md` at repo root — the cold-start briefing, the commands, the `golden/` ritual.
1. Read `START_HERE.md` in full (note §5.8, the substrate-triage rule).
2. Read `docs/orders/WO-103.md` — the complete order, end to end, before any edit.
3. Branch `wo-103` from current `main`. **Commit from a worktree, never the shared tree.**
4. Run every gate and paste full unedited output. Report per `PROTOCOL.md`; the verifier runs the cold `bun qa/run.ts --all`.

### Five things about this rung specifically

- **Deliverable 0 is a live regression — fix it first, in its own commit.** WO-102's rename left `event` hardcoded at `execute.ts:13` and `:21`, so `market_event` is missing from both lookup maps and all three market commands throw at runtime: `Command "start_event" requires undefined`. Reproduced on a fresh database. It is revertable on its own, so it commits on its own.
- **Nothing typechecks, and that is why it survived.** `packages/qf-kernel/package.json` declares a `typecheck` script that **no gate has ever run**. Run by hand, `bunx tsc --noEmit` names both broken lines exactly. This order adds that gate — expect **13 gates**, not 12.
- **The link writer is the centrepiece, and its design is already ruled.** Creation input accepts optional link fields, implemented by **one generic writer** that validates every edge against the schema's declared endpoints. The **endpoint validator is the deliverable**; the convenience is not. Do not relitigate it — the reasoning is in the order.
- **The arrival-settled rule is the sharpest call you will make.** A real betting slip arrives already won. Today the only path fabricates a `pending → win` transition into the event log — a false fact in the ledger the design exists to keep honest. The constraint: *an externally-observed fact may arrive in any state; a system-produced object may not*, enforced structurally, not by comment.
- **This rung is half of its contract.** Six dead actions, `docs/ONTOLOGY_SCHEMA.md`, the market ingest seam, `connection`, and the IPC allowlist are all **WO-103b's** — record what you notice, act on none of it. The seam is forced by a gate: wiring an action trips nothing, deleting one drags the doc surface in.

## Also cuttable right now, off-ladder

**[WO-H1](WO-H1.md) — debt register audit and sweep.** `qa/` and the `ROADMAP.md` debt table only; zero schema, zero Kernel. Audits all 18 open debt entries against real code, corrects the stale ones (one is already half-done and nobody noticed), sweeps the two that are genuinely small. **Parallel-eligible with WO-103** — they share only `docs/ROADMAP.md`; merge WO-H1 first if both are open, it is much the smaller diff.

## Queued behind (do not start)

**WO-103b** — the write path's policy half; contract in [`SCOPES.md`](SCOPES.md), written after WO-103 reports. Then **WO-104/105** (the generated tool plane — WO-104 is flagged as the fattest rung and will likely split), **WO-107** (the first market, **Bovada sportsbook only**, doctrine A7), then the loop, the critic, and the one-shot proof.

## Parked / parallel

**Market-abstraction test** — ROADMAP debt #20, trigger: the first bet shape that is not one-bounded-event-with-selections. **Visual pass** (WO-006d one-skin + dock redesign, and the cable design system) — founder-gated, off the critical path; the cable principle is recorded in `SCOPES.md` under WO-109. **Durable execution** — debt #17, trigger-gated. **Promotion authority + freeze-lint bypass** — debt #19, triggered by the first `active` promotion proposal.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies. Until then, NEXT stays as written.*
