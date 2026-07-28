# NEXT — the current order (rotated 2026-07-27: WO-V1 PASS; ladder awaits WO-K3)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **none cuttable — architect must write [WO-K3](SCOPES.md)**

There is **no builder order** right now. Off-ladder **[WO-V1](WO-V1.md) PASS** 2026-07-27 at
`eaa5fa6` (vault projector merged). The identity ladder is blocked on an architect duty.

**When WO-K3 is cut** (pre-build read first), this file will point at it. Until then: do not
pick a parallel order; do not start WO-N1 or WO-107b.

## The ladder

**[WO-K1](WO-K1.md) PASS** · **[WO-K2](WO-K2.md) PASS** · **[WO-V1](WO-V1.md) PASS** (off-ladder).

**[WO-K3](SCOPES.md) — contract only** (bytes follow truth; drift refuses writes). Unblocked by
K2; **order file not written.** Behind it: **WO-N1** (product identity), **WO-107b** (bulk
ingest), then Bovada.

**Identity rungs: 2 of 3 done.** Market data still waits on K3 → WO-107b.

## Standing traps

- Never pipe the gate runner · do not run the suite while another agent is active · `.wo008-home`
  is not yours · platform Kernel is `~/.quantflow/kernel.db` · sandboxed `agent-path` false red
  (debt #23).
- After K2: Law E **and** `kernel-one-path` both have allowlists — a new fixture that says
  `kernel.db` must be spelled on both (or avoid the patterns).

## Standing seat constraint

Builder seats: **`composer-2.5` or `cursor-grok-4.5-high` only**.

## Parked / parallel

**WO-N1** — product identity after K3 ([`WO-N1.md`](WO-N1.md), debt #30).
Design overhaul · debt #20 · #17 · #19 · #22 · #26 — unchanged triggers.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
