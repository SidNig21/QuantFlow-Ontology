# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-006a — creation commands**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-006a.md`](WO-006a.md) exactly.

- Work on a new branch named `wo-006a`.
- Stay strictly inside the order's scope: `packages/qf-kernel/`, `qf-kernel-schema/src/commands.ts`, and `qa/`. Anything not listed in Deliverables is out.
- Run the order's **builder-run gates** and paste full, unedited output in your report, using the order's Report-back format.
- Commit to your branch and push. **Do not merge.**
- If anything in the order is ambiguous, stop and say so instead of improvising — a builder question is an order defect, and the fix lands in the WO file.

Why this order exists: the Kernel's `execute()` handles state transitions only; object creation currently bypasses the event log entirely, and the `artifact` table has no status column. WO-006a gives the Kernel a creation-command path — `publish_artifact` first, with content-addressing *computed by the Kernel*, never accepted on faith — and carries **debt #0** (the doc↔code action-surface gate). **WO-006b** (canvas slice + the Law D cold-reopen demo, the v0.1 phase gate) is blocked on it; its order file is not yet written.

> **Note to the founder:** WO-006a was written by the verifier and has **not** had a pre-build reviewer read. Before handing it to a builder, consider giving a third agent (e.g. Codex) the five-minute read from `PROTOCOL.md`: *can each acceptance gate actually fail?* and *does each deliverable have exactly one meaning?* Five of five order-defects so far were architect-authored — this is the cheap insurance against the sixth.

## Parallel-eligible

Nothing. WO-006b is blocked on WO-006a and unwritten; the verifier writes it while WO-006a builds.

## Standing rule for every builder (added 2026-07-18)

**Never run `bun qa/run.ts --all`, and never delete `node_modules`.** You are working in the founder's shared tree, which holds ~1.9 GB of installed dependencies. The cold run belongs to the verifier, in a throwaway worktree. Run your order's package-level gates plus its falsification proof, then report — and say that you deferred the cold run.

## Reviewer (standing role, `PROTOCOL.md`)

A **third** agent — neither the builder nor the verifier of the work in question — may be handed either job at any time:

- **Pre-build read of an order** (five minutes, two questions): *can each acceptance gate actually fail?* and *does each deliverable have exactly one meaning?* Orders are where the defects are born — this is the higher-leverage trigger, and WO-006a is the standing candidate (see the note above).
- **Post-merge adversarial read** every two or three merged orders. Six orders have now merged (WO-001…WO-005, WO-004a); a post-merge read is due when convenient.

Decorrelation is the point: correlated cognition masks defects exactly as correlated environments do. Reviews are testimony — they get verified before they are acted on, like any other claim.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
