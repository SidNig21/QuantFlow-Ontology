# NEXT — the current order (architect interruption 2026-07-28: restore verifier before WO-K3)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **[WO-CI1](WO-CI1.md) — restore the production build verifier**

**Read the order top to bottom before touching anything.**
Branch: `wo-ci1` off current `main`.

**In plain terms:** the release build currently stops before CI reaches the safety gates because a
private alias list fell behind the schema package. Repair that one verifier seam before trusting
another order.

**Pre-build read:** the acceptance gate must fail when production config stops consuming the
manifest-derived aliases; a unit test of the helper alone is insufficient.

**Depends on:** WO-K2 (PASS on `main`).

**Scope in priority order:**

1. Reproduce the clean production-build failure.
2. Derive all `qf-kernel-schema` aliases from its live `exports` map.
3. Add focused unit coverage and a falsifiable production-coupling gate.
4. Restore the existing Build → QA verifier chain; do not touch K3.

## The ladder after CI1

**Done:** WO-K1 · WO-K2 · WO-V1 (off-ladder) · P3 tool plane (WO-104–106b).

**Immediately behind CI1:** return to **WO-K3** (identity rung 3 of 3), with D5 narrowed before its
next builder round.

**Behind K3:** managed artifact publication → operator reality/runtime hardening → bounded audit →
WO-N1 → data/compute → WO-109…111.

## Standing traps

- Never pipe the gate runner · do not run the suite while another agent is active · `.wo008-home`
  is not yours · platform Kernel is `~/.quantflow/kernel.db` · sandboxed `agent-path` false red
  (debt #23).
- Law E **and** `kernel-one-path` both have allowlists — new fixture paths must be spelled on both.
- Do not repair K3, transactions, sockets, product identity, updater, or Bun pinning in CI1.

## Standing seat constraint

Builder seats: **`composer-2.5` or `cursor-grok-4.5-high` only**.

## Parked / parallel

**WO-K3** — resumes immediately after CI1 ([`WO-K3.md`](WO-K3.md), debts #27/#29).
**WO-N1** — after K3 and managed publication ([`WO-N1.md`](WO-N1.md), debt #30).
Design overhaul · debt #20 · #17 · #19 · #22 · #26 — unchanged triggers.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
