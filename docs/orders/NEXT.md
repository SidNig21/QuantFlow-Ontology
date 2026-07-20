# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-009 — Datasets I: bootstrap ingestion**

Read `docs/orders/WO-009.md`. Unparked after WO-008d (Hermes desk UX = real TUI term tile).

- New branch from `QuantFlow` (e.g. `wo-009`).
- `ingestion` Run → content-hashed Parquet + Kernel `dataset` pointer (`as_of` + `coverage`); DuckDB reads via pointer; **no bulk rows in SQLite**.
- Failure honesty: bad source → run `failed`, zero partial Kernel writes; lineage edges traversable.
- Static gates + build green; commit and push. **Do not merge.**

## Parallel / blocked

**WO-012** — after WO-008a (order not yet written). **WO-010** / **WO-011** wait on WO-009.
---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
