# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-006a — rework round 2 (final lap)**

Read `docs/orders/WO-006a.md`, bottom verification record ("round 2"). D1–D4 are **fixed and accepted** — do not touch them.

- Continue on the existing branch `wo-006a`. First: `git fetch origin && git merge origin/QuantFlow`.
- **Fix D5 only:** delete the `QF_PROOF_SKIP_ARTIFACT_META_CHECK` env check in `packages/qf-kernel/src/create.ts` so the two metadata comparisons run unconditionally. Touch nothing else.
- **Proof:** temporarily comment out the metadata comparison, show the D1 test red; restore; show green; show `git diff` empty. Paste all three.
- Run builder gates (`bun test` in `packages/qf-kernel`, `tsc --noEmit`). **Never `bun qa/run.ts --all`, never delete `node_modules`.**
- Commit and push. **Do not merge.**

Why: an env flag that disables a Kernel integrity check is a runtime bypass seam. Proof plumbing lives in proof harnesses; the Kernel carries none. Per `PROTOCOL.md` this is the second and final rework lap — if it comes back wrong, the order stops for a rewrite.

## Parallel-eligible

Nothing. WO-006b is blocked on WO-006a; the verifier drafts it while this lap runs.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
