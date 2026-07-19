# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-006b — rework round 1 (D1 only)**

The branch is **built, verified, and one gate short of merge.** Ten of eleven gates are green; `bun qa/run.ts --all` exits 1 on `no-canvas-domain-writes`, so CI would reject it.

**Before anything else:** `git fetch origin && git merge origin/QuantFlow` into `wo-006b` — the rework record is on `QuantFlow`, not on your branch. Then read **"Verification round 1 — REWORK"** at the bottom of [`docs/orders/WO-006b.md`](WO-006b.md).

- **Fix D1 only.** Everything else is accepted; changing anything else is out of scope.
- The code is Law B compliant — canvas stores a tile-type discriminator, an `artifactId` reference, and layout. **Zero domain fields.** The gate simply cannot tell a reference from a truth-store.
- **Make the gate precise, not permissive.** Flag domain *field* names (`content_hash`, `storage_ref`, `kind`, `status`, `grade`, …); permit tile-type discriminators and `<domainType>Id` reference fields. **Do not allowlist the string `artifact`** — that retires a real protection.
- Falsify both directions and paste four outputs: `content_hash` added to a canvas tile interface → **red**; removed → green; `artifactId` + `type: "artifact"` stay **green**; `git diff` empty.
- Same branch `wo-006b`. Do not merge.

### Founder acceptance — **Law D PASSED** (2026-07-19)

Publish → force-kill → relaunch → `artifacts=1 → 2`, both artifact tiles restored with metadata re-fetched from `kernel.db` via `qf:artifacts:list`, not from canvas JSON. The verifier independently recomputed both content hashes against the real files — **exact match**, so content-addressing is measured, not claimed. The `artifact.published` event row carries the same id.

**One deliverable remains unexercised:** the demo lever (File → Publish Artifact) was driven via the `qf:execute` IPC in a headless agent environment, not clicked. Same seam, so Law D's substance holds — but the GUI affordance itself is unverified. A single menu-driven publish closes it.

## Parallel-eligible

Nothing. WO-006c (agent path from canvas) is blocked on this order and will be written against the **swappable ACP seam** (`BLUEPRINT.md` §open-host), not against `ToolLoopAgent` — so a later Hermes swap is a package change, not a rework.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
