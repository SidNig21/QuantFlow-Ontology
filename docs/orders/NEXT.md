# NEXT — the current order (rotated 2026-07-25: WO-101 passed, P1 rung 1 is done)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## There is no builder order right now — and that is the honest state

**WO-101 is done** (verified + merged 2026-07-25; record at the bottom of [`WO-101.md`](WO-101.md)). The next rung is **WO-102 — market plane reframe**, and **its order file has not been written yet.**

`docs/orders/SCOPES.md` claimed WO-102 was written. It was not, and never was; the claim was corrected during WO-101's verification. What exists for WO-102 is a **scope contract** — objective, boundaries, and a gate — not an order. A contract names *what* a rung is for. An order names exact files, exact predicates, exact commands, and *"here is what the last rung actually produced."*

**Do not start from the contract.** `START_HERE.md` §5.1 and the `PROTOCOL.md` loop both say it: no order, no work. A builder who starts from a scope contract is improvising the half of the order that isn't written, which is where this repo's defects have historically been born.

## What has to happen next: an architect sitting, not a builder one

Someone in the architect seat writes `docs/orders/WO-102.md` from the contract in [`SCOPES.md`](SCOPES.md#wo-102--market-plane-reframe), which already carries the hard parts:

- **The rename is not schema-only.** `event` is a **stateful** type — it owns a transition table (`scheduled → live → settled | void`) and three commands (`start_event` / `settle_event` / `void_event`). Renaming it to `market_event` moves a transition table, three commands, and every generated conformance test that names them. SCOPES says plainly: estimate this rung as larger than it reads.
- **This rung invalidates every existing `kernel.db`.** The generated migration is bare `CREATE TABLE` applied only to fresh databases; there is no `ALTER` story and no migration runner. The order must say so out loud, and the builder must confirm a fresh `kernel.db` opens clean afterward. Silently breaking the founder's local data would be found at the worst possible moment.
- **`pipelineFed` has zero occurrences in the codebase.** It is doctrine vocabulary, not a mechanism. The order builds it or drops it — and either way says which.
- **Two `ticket` defects land here** (doctrine A6): the description WO-101 wrote points away from the founder's primary use case, and the state machine has no entry point for a slip that arrives already settled. The second one has to be coordinated with WO-103, which owns creation.

**And one thing WO-101 just proved the new order must not copy:** its G3 gate said *"the suite must grow — new types generate new rows in the golden docs."* That is false. Conformance tests are generated from `transitions`, so the three stateless types WO-101 added produced **zero** new tests. The gate went green for an unrelated reason. Any gate in WO-102 that leans on a count must name the mechanism that actually produces the count, and be checked against it.

## Queued behind (do not start)

**WO-103 — the write path.** Of 22 object types only 3 can be created, 9 defined actions throw `Unknown command` at `execute()`, and **no link is writable** — the `links` table is generated with zero reads and zero writes repo-wide. Until this rung lands, read tools would read empty tables and the closing proof is a traversal over edges that cannot exist. WO-101's verification added six more findings to its brief; they are recorded in [`WO-101.md`](WO-101.md).

Then P3 (WO-104/105/106, the generated tool plane), P4 (markets), P5 (the loop, the critic, the proof). Eleven rungs — see [`SCOPES.md`](SCOPES.md).

## Parked / parallel

**Visual pass** (WO-006d one-skin + dock redesign) — founder-gated, off the critical path. **WO-009** — absorbed into WO-106's market pick. **Durable execution** — ROADMAP debt #17, trigger-gated. **Promotion authority + the freeze-lint bypass** — ROADMAP debt #19, triggered by the first proposal to promote any type to `active`; nothing is close to that.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
