# NEXT — the current order (rotated 2026-07-27: WO-K3 cut after WO-V1 PASS)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **[WO-K3](WO-K3.md) — bytes follow truth, and drift refuses writes**

**Read the order top to bottom before touching anything — every ruling was paid for.**
Branch: `wo-k3` off current `main`.

**In plain terms:** artifact files must live next to the platform Kernel under `~/.quantflow/`,
and an obsolete database must refuse writes (warn on readonly tools). This is identity rung **3 of 3**.

**Pre-build read:** recommended but not yet run — builder or architect may adversarial-read before
cut if the tree moved since draft.

**Depends on:** WO-K1 + WO-K2 + WO-V1 (all PASS on `main`). Readonly carve-out must stay working.

**Scope in priority order:**

1. **`resolveArtifactRoot()`** — default `~/.quantflow/artifacts/`; stop writing to
   `~/.collaborator/agent-artifacts` in production.
2. **Object-type registry drift detector** — pure function + `attachKernel`; throw writable /
   warn readonly.
3. **Migration skip guard** — no longer trust `schema_meta` name alone (canary incomplete DB).
4. **Cold gate** — dirty fixture from **pinned prior schema snapshot**, not live `schema.ts`.
5. **WO-106b six shapes** re-run on relocated root.

## The ladder after K3

**Done:** WO-K1 · WO-K2 · WO-V1 (off-ladder) · P3 tool plane (WO-104–106b).

**Behind K3:** **WO-N1** (product identity) → **WO-107b** (bulk ingest) → **WO-107…111** (markets →
Bovada one-shot proof).

**Identity rungs: 2 of 3 done** until this verifies.

## Standing traps

- Never pipe the gate runner · do not run the suite while another agent is active · `.wo008-home`
  is not yours · platform Kernel is `~/.quantflow/kernel.db` · sandboxed `agent-path` false red
  (debt #23).
- Law E **and** `kernel-one-path` both have allowlists — new fixture paths must be spelled on both.
- Drift gate fixture **must not** import today's live `golden/migration.sql` as the dirty side.

## Standing seat constraint

Builder seats: **`composer-2.5` or `cursor-grok-4.5-high` only**.

## Parked / parallel

**WO-N1** — after K3 ([`WO-N1.md`](WO-N1.md), debt #30).
Design overhaul · debt #20 · #17 · #19 · #22 · #26 — unchanged triggers.

---

*Rotation rule unchanged: the verifier rotates this file when the current order verifies, and the log ([`README.md`](README.md)) wins if the two ever disagree.*
