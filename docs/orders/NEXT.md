# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-009 — Datasets I: bootstrap ingestion**

Read `docs/orders/WO-009.md`. Hermes host path (WO-008a) is **merged** — data lane opens.

- New branch from `QuantFlow` (e.g. `wo-009`).
- Measure/implement `register_dataset_version` if missing; one bootstrap ingestion → Parquet + Kernel `dataset` pointer.
- Hash falsify + DuckDB read + failure honesty (no partial Kernel rows); no bulk facts in SQLite.
- Prefer fixture for cold CI; no credentials. Static gates green; commit and push. **Do not merge.**

## Parallel / blocked

**WO-012** (agent contracts) — unblocked by WO-008a; order not yet written. **WO-010** — after WO-009.
---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
