# NEXT — the current order (rotated 2026-07-28 after WO-CI1 PASS)

> **Builder: this file is your complete entry point.** It always points at the single order that is
> currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder:** feed this same file to every fresh builder window: *"Follow `docs/orders/NEXT.md`."*

## Current order: **[WO-K3](WO-K3.md) — bytes follow truth, and drift refuses writes**

**Read the order top to bottom before touching anything.** It is identity rung 3 of 3.

Branch state: existing `wo-k3` builder commit `ec51c34`, originally based at `9de0249`. Bring it
forward onto the current verified `main` without force-pushing shared history, then perform only the
documented rework. Do not treat its existing builder report as verification.

**In plain terms:** most of K3 may be sound, but its artifact gate created the file itself and then
claimed the app created it. Rebuild that proof around the real production byte-writer, then re-run
the entire canonical shipped-app verifier from the integrated branch.

## Rework priority

1. Preserve and re-verify D1–D4 and D6–D7; do not rewrite working drift/root behavior speculatively.
2. Implement corrected D5 exactly: absent file → real app helper writes bytes → `execute()` indexes
   them → file, root, row, and content hash agree.
3. Falsify the production helper, not a copied gate implementation: no-op or legacy-root mutation
   must make D5 red, then restore green.
4. Run `bun qa/verify-release.ts`. A green `bun qa/run.ts --all` without the Electron production
   build is not verification.

## Why WO-CI1 is no longer blocking

WO-CI1 independently passed and merged on 2026-07-28. CI, `AGENTS.md`, and the verifier handbook now
use `bun qa/verify-release.ts`: frozen install → unit → production build → every QA gate. Package
resolution uses the installed `qf-kernel*` export maps directly; private aliases are forbidden.

## Hard boundaries

- Never place, execute, or automate a real bet or trade; never handle credentials.
- No migration runner, product rename, Node transaction repair, socket authentication, Hermes
  profile redesign, live ingest, or WO-N1 work in K3.
- Do not delete operator data, preserved Kernels, legacy artifact bytes, or `.wo008-home`.
- Work in a short-lived worktree branch. Builder reports evidence and stops; another seat verifies.

## Behind K3

Do not promote another implementation order yet. The architect will re-measure the shipped Node
session seam and Hermes profile identity after K3 evidence is honest, then cut only the next
Cursor-sized order. WO-N1 and WO-107b remain blocked on K3.

---

*The order log in [`README.md`](README.md) wins on status. The verifier rotates this file atomically
with the merge, verification record, and roadmap/log updates.*
