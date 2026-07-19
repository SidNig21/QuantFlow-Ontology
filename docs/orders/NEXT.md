# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-006a — rework round 1**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then `docs/orders/WO-006a.md` — including the **verification record appended at the bottom**, which is your actual task.

- Continue on the existing branch `wo-006a`.
- **Fix defects D1–D4 only.** Everything else in WO-006a is verified and accepted; do not touch it.
- Each defect's record states its fix and its falsification proof. Paste every red/green pair.
- Run the builder-run gates (both packages' `bun test` + `tsc --noEmit`). **Never run `bun qa/run.ts --all`, never delete `node_modules`** — the cold run belongs to the verifier.
- Commit and push. **Do not merge.**

The four in one line each:
- **D1** — republishing the same bytes with a different `kind`/`storage_ref` silently returns the first publish's row; it must reject with a typed error instead.
- **D2** — `replayArtifactAndAssert` sets `rebuilt.id` from its own argument; rebuild it from the event payload's `content_hash` so the identity rule is actually asserted.
- **D3** — the creation catalog and the handler `if` are two registries with no join; one dispatch table plus a test that every catalog entry has a handler.
- **D4** — three copies of the event-append INSERT; one exported `appendEvent`, one occurrence of `INSERT INTO events` in the Kernel source.

## Parallel-eligible

Nothing. WO-006b is blocked on WO-006a; the verifier drafts it while the rework runs.

## Reviewer (standing role, `PROTOCOL.md`)

The pre-merge review of WO-006a earned its keep: it caught D1 — an architect underspecification — before merge, the first time that has happened before collision with reality. Reviews remain testimony: every finding was re-measured by the verifier before becoming a defect, and one was found overstated. The next scheduled touchpoint is a post-merge read after WO-006a lands.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
