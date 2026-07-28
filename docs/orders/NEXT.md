# NEXT — the current order (rotated 2026-07-27: WO-K2 verified PASS; ladder awaits WO-K3 order)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **[WO-V1](WO-V1.md) — the reading vault, REWORK ROUND 1**

**Read the order top to bottom, then the `REWORK ROUND 1` section at its end — that section is the
round.** The branch is `wo-V1` at `52c435a`; nothing is merged.

This is off-ladder and currently the **only cuttable builder work** — see *the ladder is blocked on
an architect duty* below. It blocks nothing and is blocked by nothing.

**Scope of the round, in priority order:**

1. **Artifact-body rendering and wikilink emission** against real data (never observed — round 1
   crashed before a real run completed).
2. **Missing-type ruling as robustness** — skip declared types with no table, name them in the run
   summary, never drop `readonly: true` to force a migration.

**Kernel context after K1/K2:** platform Kernel is `~/.quantflow/kernel.db` (26 tables). Create is
opt-in; readonly opens work. Measure against that Kernel or a deliberately incomplete fixture built
from a source that is **not** the live schema.

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

## Standing seat constraint

Builder seats: **`composer-2.5` or `cursor-grok-4.5-high` only**.

## Parked / parallel

**WO-N1** — product identity after K3 ([`WO-N1.md`](WO-N1.md), debt #30).
Design overhaul · debt #20 · #17 · #19 · #22 · #26 — unchanged triggers.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
