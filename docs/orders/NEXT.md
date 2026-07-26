# NEXT — the current order (rotated 2026-07-25: WO-102 passed, P1 is complete)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## There is no builder order right now — and that is the honest state

**WO-102 is done** (verified + merged 2026-07-25; record at the bottom of [`WO-102.md`](WO-102.md)). The market plane is `venue` / `instrument` / `quote` / `market_event` (+ `competitor` and `result`, kept and argued), `pipelineFed` has teeth at both enforcement sites, and the G3 fixture proves the schema holds the two bet shapes the founder actually places. **P1 — the charter — is complete.**

The next rung is **WO-103 — the write path**, and **its order file has not been written yet.** What exists is the scope contract in [`SCOPES.md`](SCOPES.md). A contract names *what* a rung is for; an order names exact files, exact predicates, exact commands, and *"here is what the last rung actually produced."* **Do not start from the contract** — no order, no work (`START_HERE.md` §5.1).

## What has to happen next: an architect sitting, not a builder one

Someone in the architect seat writes `docs/orders/WO-103.md`. Its brief is unusually well-stocked, because two rungs of verification wrote it already:

- **The core measurements (2026-07-25, re-verified at WO-102):** of 23 object types only **3 are creatable**, **9 defined actions** throw `Unknown command` at `execute()`, and **no link is writable** — the `links` table is generated, CHECK-constrained over all 14 kinds, with zero reads and zero writes repo-wide. The defining loop cannot run until this rung lands.
- **The link-property brief, measured from real slips** — WO-102's G3 enumeration: per-leg **price at selection**, per-leg **outcome** (including `void` inside a losing ticket), per-leg **quote id**, and **leg sequencing** all live in the opaque `legs` blob because `has_leg` is a property-less edge. Findings 1–4 in [`WO-102.md`](WO-102.md) (link properties · `legs`/`has_leg` dual truth · leg state space · arrival-settled ticket creation), plus findings 1–10 in [`WO-101.md`](WO-101.md).
- **The design decision the order must make:** how edges are written — a generic `link` command validated against the schema's declared endpoints, fields on creation input in the same transaction, or the layered both (creation input accepting link fields, implemented by one generic endpoint-validated writer — generatable at WO-104). Argued in `SCOPES.md`; decide it in the order, not in chat.
- **Evaluation is a pure sink** (zero outbound links) — the WO-110 publication gate cannot express "which evaluation gated which artifact" until a link or reference exists. Route or build here; do not rediscover at WO-110.
- **Routed to WO-103 at the latest — ROADMAP debt #21:** `docs/ONTOLOGY_SCHEMA.md` describes the pre-rename schema (`event` ×12, zero `market_event`). Regenerate-and-gate the object surface, or demote the file to design prose in `DOC_AUTHORITY_MAP.md`. Edit-by-order-only.
- **Routed to WO-104's author, not this one:** whether `start_event` / `settle_event` / `void_event` rename to match `market_event` — that decision belongs where actions become agent-facing tool vocabulary, and `doc-action-surface` will force the doc update in the same commit.

## Queued behind (do not start)

**WO-104/105** — the generated tool plane (P2's remaining rungs). **WO-106/107** — the first market, **Bovada sportsbook only** per doctrine A7. Then the loop, the critic, the one-shot proof. See [`SCOPES.md`](SCOPES.md).

## Parked / parallel

**Market-abstraction test** — ROADMAP debt #20, trigger: the first bet shape that is not one-bounded-event-with-selections. **Visual pass** (WO-006d one-skin + dock redesign) — founder-gated, off the critical path. **Durable execution** — debt #17, trigger-gated. **Promotion authority + freeze-lint bypass** — debt #19, triggered by the first `active` promotion proposal.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies. Until then, NEXT stays as written.*
