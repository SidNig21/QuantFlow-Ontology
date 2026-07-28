# NEXT — the current order (rotated 2026-07-27: WO-V1 REWORK ROUND 2)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **[WO-V1](WO-V1.md) — the reading vault, REWORK ROUND 2**

**Read the order top to bottom, then the `REWORK ROUND 2` section at its end — that section is the
round.** Continue on branch `wo-V1` (tip was `c2d69d2` at verification; Round 1 substance stays).
Nothing is merged.

This is off-ladder and currently the **only cuttable builder work** — see *the ladder is blocked on
an architect duty* below.

**Scope of the round (one defect):**

1. Allowlist `tools/qf-vault-projection/src/gate.ts` on `qa/gates/kernel-one-path.ts` so the cold
   board stops failing on fixture `kernel.db` path construction. Prove red → green, then cold
   `GATE_RUNNER_EXIT=0`.

**Already verified — do not redo:** missing-type skip + bait; real artifact-body / wikilink
observation against the pre-rebuild Kernel copy. Record:
[`evidence/wo-V1/VERIFICATION-ROUND-2.md`](evidence/wo-V1/VERIFICATION-ROUND-2.md).

**Kernel context:** platform Kernel is `~/.quantflow/kernel.db`. Create is opt-in; readonly opens
work.

## The ladder is blocked on an architect duty, not a builder one

**[WO-K1](WO-K1.md) PASS** · **[WO-K2](WO-K2.md) PASS** 2026-07-27 at `c9c3bf0`, zero rework,
`GATE_RUNNER_EXIT=0`, **debt #28 closed**. Readonly API live; Law E gate sees `openKernel`/`execute`.

**[WO-K3](SCOPES.md) has no order file yet** — contract only (bytes follow truth; drift refuses
writes). **No builder can take the ladder until that order is written.** Behind it: **WO-N1**
(product identity — parked until after K3), **WO-107b** (bulk ingest — contract only), then Bovada.

**Identity rungs: 2 of 3 done.** Market data still waits on K3 → WO-107b.

## Standing traps

- Never pipe the gate runner · do not run the suite while another agent is active · `.wo008-home`
  is not yours · platform Kernel is `~/.quantflow/kernel.db` · sandboxed `agent-path` false red
  (debt #23).
- After K2: Law E **and** `kernel-one-path` both have allowlists — a new fixture that says
  `kernel.db` must be spelled on **both** (or neither, if it avoids the patterns).

## Standing seat constraint

Builder seats: **`composer-2.5` or `cursor-grok-4.5-high` only**.

## Parked / parallel

**WO-N1** — product identity after K3 ([`WO-N1.md`](WO-N1.md), debt #30).
Design overhaul · debt #20 · #17 · #19 · #22 · #26 — unchanged triggers.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
