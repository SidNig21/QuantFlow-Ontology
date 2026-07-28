# NEXT — the current order (rotated 2026-07-27: WO-K2 cuttable after pre-build read)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **[WO-K2](WO-K2.md) — the gate can see the door, and readers are readers**

**Read the order top to bottom before touching anything — every ruling was paid for.**
Branch: `wo-k2`.

**In plain terms:** the test that is supposed to stop programs from opening the database the wrong
way cannot see the real front door, so code walks through and the test stays green. Also, pointing
a tool at a typo quietly creates a new empty database. This order makes the test see the door,
makes create opt-in, and proves a read-only handle cannot write.

**How this order was hardened:** one adversarial pre-build read returned **DO NOT CUT** (two
Critical, composition class). All ten findings fixed in the order text before cut — especially:
per-claim allowlists (never skip whole file), G1b open∩¬write bait, falsify through the real
scanner (no bare `exit(1)`), and G3b so production servers never get `create: true`.
Record: [`evidence/wo-k2/prebuild-read.md`](evidence/wo-k2/prebuild-read.md).

**Depends on WO-K1** — already merged (`61ce90d`). Closes debt #28. Hard prerequisite for WO-K3's
readonly carve-out API (production projection readers still arrive with WO-V1 — see RULING 3).

## Parallel-eligible: **[WO-V1](WO-V1.md) — the reading vault, REWORK ROUND 1**

Off-ladder, independent of WO-K2 (no shared files once K1 landed), branch `wo-V1` at `52c435a`.
A second builder may take this **only if** they do not run the QA suite while the WO-K2 builder is
active (standing trap). Read the order + `REWORK ROUND 1` section.

## Where the ladder stands

**WO-K1 PASS** · **WO-K2 open (this order)** · **WO-K3** contract only · then **WO-107b** (also
contract-only until written) · **WO-107** Bovada (external-surface probe first) · **WO-108…111**.

Market data still waits on K2 → K3 → WO-107b. That ordering is the protection.

## Read this before you write a gate

**A check whose two sides come from one source is not a check.** WO-K2's own pre-build read caught
the next instance: an open allowlist that skipped the whole file would have blessed openers while
gutting the SQL scan — each half correct, composition recreates the defect. Per-claim allowlists
and G1b exist because of that. Match the standard: falsify by editing shipping behaviour or planting
real bait, not by forging an exit code.

## Four standing traps

- **`agent-path` false FAIL in a sandboxed shell** (debt #23) — pre-install before measuring.
- **Never pipe the gate runner.** Unpiped, `$?` on its own line.
- **Do not run the suite while another agent is running.**
- **`.wo008-home` Kernel is not yours** — stale, held open, untouched by K1/K2. Leave it alone.
- **Platform Kernel is `~/.quantflow/kernel.db`** (WO-K1).

## Standing seat constraint (founder, 2026-07-26)

Builder seats: **`composer-2.5` or `cursor-grok-4.5-high` only**. One model builds, a different one
verifies.

## Parked / parallel

**WO-N1 — product identity** — parked until **after WO-K3**. Draft at [`WO-N1.md`](WO-N1.md). Fixes
window name, appId, release target, and `~/.collaborator` → `~/.quantflow/app`. **Does not** rename
`collab-electron/` or the `upstream` remote (fork seam). Debt #30.

**Design overhaul** — founder-run, off the critical path; returns as a brief with measured scope and
falsifiable gates, and must fit `one-skin`. **Market-abstraction test** — debt #20, trigger-gated.
**Durable execution** — debt #17, trigger-gated. **Promotion authority + freeze-lint bypass** — debt
#19 (`promote_type` deleted by WO-103b; its fixing order re-adds the action). **Caller identity** —
debt #22; WO-105 narrowed the served surface but the lock is still unbuilt. **Nested-key smuggling** —
debt #26; owned by whichever of WO-107b or WO-109/110 arrives first.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
