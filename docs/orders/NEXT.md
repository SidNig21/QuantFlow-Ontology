# NEXT — the current order (rotated 2026-07-25: WO-103 verified + merged, WO-H1 opens)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **[WO-H1](WO-H1.md) — debt register audit and sweep**

WO-103 is done (verified + merged 2026-07-25). **WO-103b is contracted but not yet written** — the architect writes it before it can be cut, so it is not available to a builder today. WO-H1 is off-ladder, cuttable now, and has just become more valuable than when it was queued.

0. Read `AGENTS.md` at repo root — the cold-start briefing, the commands, the `golden/` ritual.
1. Read `START_HERE.md` in full (note §5.8, the substrate-triage rule).
2. Read `docs/orders/WO-H1.md` — the complete order, end to end, before any edit.
3. Branch `wo-h1` from current `main`. **Commit from a worktree, never the shared tree.**
4. Run every gate and paste full unedited output. Report per `PROTOCOL.md`; the verifier runs the cold `bun qa/run.ts --all`.

### What WO-103 changed about this order

- **Debt #21's trigger has fired.** It reads *"the next order touching the schema doc surface — WO-103 at the latest."* WO-103 edited exactly one line of `docs/ONTOLOGY_SCHEMA.md` (its `## Actions` list, authorized by amendment so `doc-action-surface` could stay green) and left the rest untouched. So #21 is **due, not stale** — audit it as live, and route the body of the work to WO-103b rather than doing it here.
- **Debt #19's second half moved.** It records that `promote_type` "cannot execute today" as one of the nine actions with no command. WO-103 wired three of the nine; `promote_type` was **not** among them and remains dead. Confirm before editing — the entry is still true, but the surrounding count is not.
- **A new entry is expected and is not yours to write.** The founder has flagged an intended debt **#22** covering the residual on arrival-settled objects: nothing prevents an agent calling `observe_ticket` for a slip it produced itself, and only caller identity in `TraceContext` would close it. **Do not add it yourself** — it needs the founder's wording and trigger. Leave the number free and say in your report that you did.
- **Counting discipline, learned the expensive way on WO-103.** A capability that exists but cannot be reached is not a capability (doctrine A5). WO-103's first report claimed "15 writable link kinds"; 7 were writable end to end. When you audit an entry that claims something works, check it is *reachable*, not just present.

### The standing trap in this order

WO-H1 audits claims written by other agents, which makes it unusually easy to launder a stale claim into a fresh one by rewording it. **An entry you cannot attach a file, line, or command to is not corrected — it is unverified, and says so.** The order's value is entirely in which entries you can prove; a tidier register that is equally unmeasured is worth less than the messy one.

## Queued behind (do not start)

**WO-103b** — the write path's policy half; contract in [`SCOPES.md`](SCOPES.md), **needs writing by the architect before it can be cut.** Its inbox, recorded by two builder rounds and not acted on: the six remaining dead actions (`retry_run`, `close_run`, `request_approval`, `approve`, `deny`, `promote_type`) · `connection` carrying `kind`/`from_ref`/`to_ref`, a link stored as an object, duplicating the `links` table · the market-plane ingest seam for `pipelineFed` types · the full `ONTOLOGY_SCHEMA.md` reconciliation (debt #21) · the `QF_EXECUTE_ALLOWLIST` decision.

Then **WO-104/105** (the generated tool plane — WO-104 is flagged as the fattest rung and will likely split), **WO-107** (the first market, **Bovada sportsbook only**, doctrine A7), then the loop, the critic, and the one-shot proof.

## Parked / parallel

**Market-abstraction test** — ROADMAP debt #20, trigger: the first bet shape that is not one-bounded-event-with-selections. **Visual pass** (WO-006d one-skin + dock redesign, and the cable design system) — founder-gated, off the critical path; the cable principle is recorded in `SCOPES.md` under WO-109. **Durable execution** — debt #17, trigger-gated. **Promotion authority + freeze-lint bypass** — debt #19, triggered by the first `active` promotion proposal.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies. Until then, NEXT stays as written.*
