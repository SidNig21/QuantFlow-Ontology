# NEXT — the current order (rotated 2026-07-27: WO-K1 verified PASS; ladder awaits WO-K2 order)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **[WO-V1](WO-V1.md) — the reading vault, REWORK ROUND 1**

**Read the order top to bottom, then the `REWORK ROUND 1` section at its end — that section is the
round.** The branch is `wo-V1` at `52c435a`; nothing is merged.

This is off-ladder and it is currently the **only cuttable builder work** — see *the ladder is
blocked on an architect duty* below. It blocks nothing and is blocked by nothing.

**Scope of the round, in priority order:**

1. **The two deliverables nobody has ever watched against real data** — artifact-body rendering and
   wikilink emission. Both pass the suite against synthetic fixtures; neither has been observed
   against the founder's Kernel, because round 1's crash meant no real run ever completed. **This is
   the substance of the round.**
2. **The missing-type ruling, as robustness.** Skip a declared type with no table, name every skipped
   type in the run summary, never drop `readonly: true` to force a migration. Full ruling in the
   order.

**What changed since round 1 — do not scope this as a broken projector.** The crash was a symptom of
database drift, not a defect in the projector. Both live Kernels were rebuilt 2026-07-27 01:18 and
**WO-K1 then unified them onto `~/.quantflow/kernel.db`.** The platform Kernel now has **26 tables,
7/7 formerly-missing types present**. The crash **is no longer reproducible on the Kernel now on
disk.** It is robustness, not a blocker. Measure against `~/.quantflow/kernel.db` (or a deliberately
incomplete fixture for the missing-type gate — see below).

**The gate got harder, and that is the point.** Round 1 said "today's real Kernel is a valid fixture —
7 of 23 missing." **That fixture no longer exists.** You must construct a deliberately incomplete
database, and construct it from a source that is **not** the live schema — otherwise the gate inherits
the exact blindness it exists to catch.

## The ladder is blocked on an architect duty, not a builder one

**[WO-K1](WO-K1.md) verified PASS** 2026-07-27 at `20488f8`, zero rework rounds, 21 gates cold,
`GATE_RUNNER_EXIT=0`. One Kernel path, WAL turn-taking, pins stripped, seats start. **Debt #29
half-closed** (path); bytes/orphan remain for WO-K3.

**The next ladder rung, WO-K2, has no order file.** `SCOPES.md` §"The identity rungs" carries it as a
*contract only* (the gate can see who opens the Kernel; readers hold readonly handles; typo stops
minting empty worlds). A contract is not an order. **No builder can take the ladder until that order
is written** — an architect duty.

Behind it: **WO-K3** (bytes follow truth; drift refuses writes), then **WO-107b** (market-plane bulk
ingest — also contract-only until written), **WO-107** (first market — **Bovada sportsbook only**,
doctrine A7; **its order may not be written until the external-surface probe runs**), **WO-108**,
then **WO-109/110/111** — the loop, the critic, and the one-shot proof.

**Identity rung 1 of 3 done.** Market data still waits on K2 → K3 → WO-107b. That ordering is the
protection: fixtures from here come from someone else.

## Read this before you write a gate — it cost the project a full verification round

Round 1 of WO-V1 crashed on the founder's real Kernel: the schema declared **23** object types, the
database had **16**, and roughly a quarter of served MCP tools threw `no such table`. **Every gate
stayed green throughout**, because gates build their fixture database from the same schema they are
checking — both sides of every check came from one source and could never disagree. Reality was the
only thing capable of disagreeing and nothing was watching it.

This is the **third** time this exact shape has been found here: WO-103's arrival-settled rule (the
gate that existed to catch it had passed), WO-106's boot-path gate (it *modelled* the boot path
instead of watching it, and the real edit passed all 19 gates), and now this. **A check whose two
sides come from one source is not a check.** If you can satisfy your own gate by construction, it is
decoration.

There is **no migration runner** — `SCOPES.md:105` makes wipe-and-recreate the ritual for a rung that
renames types, with no `ALTER` story. Every future rename recreates this condition silently.

## Four standing traps, all measured and logged

- **`agent-path` gives a false FAIL in a sandboxed shell** (debt #23) — its self-install exits 0 but
  leaves no `node_modules`. Pre-install before any before/after measurement.
- **Never pipe the gate runner.** It has cost two seats: one read `tail`'s exit 0 while the gate had
  failed. Unpiped, `$?` on its own line, every time.
- **Do not run the suite while another agent is running** (WO-106) — a concurrent Cursor session makes
  `runtime-proof` fail on foreign sockets. Run quiet, or you will chase a phantom red.
- **A third Kernel exists and is not yours** (2026-07-27). A long-running Electron dev instance holds
  a database at `QuantFlow-Ontology/.wo008-home/…`, a leftover from WO-008 testing that overrode
  `HOME`. It was **not** rebuilt, was **not** touched by WO-K1, and is still at the old shape. Leave
  it alone; do not measure against it and do not treat it as evidence of drift.
- **Platform Kernel is now `~/.quantflow/kernel.db`** (WO-K1). Do not look under
  `~/.collaborator/dev/worktree-*/` for truth anymore.

## The standard this sequence set — match it

WO-106's builder **falsified every gate it wrote by editing shipping code**, not by flipping a fixture
switch. WO-106b took **eight pre-build findings, three High** and built with **zero rework rounds**.
WO-K1 took **three DO-NOT-CUT reads plus a live SDK probe** and built with **zero rework rounds**.
That is the bar.

## Standing seat constraint (founder, 2026-07-26)

Builder seats run **`composer-2.5` or `cursor-grok-4.5-high` only** — an API-cost decision, not a trust
one. One model builds, a different one verifies; no model checks its own work.

## Parked / parallel

**Design overhaul** — founder-run, off the critical path; returns as a brief with measured scope and
falsifiable gates, and must fit `one-skin`. **Market-abstraction test** — debt #20, trigger-gated.
**Durable execution** — debt #17, trigger-gated. **Promotion authority + freeze-lint bypass** — debt
#19 (`promote_type` deleted by WO-103b; its fixing order re-adds the action). **Caller identity** —
debt #22; WO-105 narrowed the served surface but the lock is still unbuilt. **Nested-key smuggling** —
debt #26; owned by whichever of WO-107b or WO-109/110 arrives first.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
