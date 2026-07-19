# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-004a — rework round 1**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then `docs/orders/WO-004a.md` — including the **verification record appended at the bottom**, which is your actual task.

- Continue on the existing branch `wo-004a`.
- **Fix defect D1 only.** Everything else in WO-004a is verified and accepted; do not touch it.
- Prove the new assertion can fail: make `listSessions` report a different ID, show P1 red, restore, show green. Paste both outputs.
- Commit and push. **Do not merge.**

D1 in one line: `proof.ts:96` looks up the session *by* the expected ID and then returns that same ID, so the P1 assertion is a tautology. It is not a coverage hole — the `throw` on line 97 does catch a genuinely wrong `listSessions` — but a decorative assertion cannot stand in the one order whose entire subject is assertions that claim more than they measure.

## Parallel-eligible (second builder only, never the same builder)

**WO-006a — creation commands** ([`WO-006a.md`](WO-006a.md)) is unblocked now and touches only `packages/qf-kernel/`, `qf-kernel-schema/src/commands.ts`, and `qa/` — no overlap with `tools/runtime-proof/`, where WO-004a's rework is live. A second builder may take it immediately.

It exists because writing WO-006 surfaced that its Law D path was not buildable: the Kernel's `execute()` handles state transitions only, object creation bypasses the event log entirely, and the `artifact` table has no status column. WO-006a gives the Kernel a creation-command path, makes `publish_artifact` the first one with content-addressing that is computed rather than claimed, and carries **debt #0** (the doc↔code action-surface gate). **WO-006b** — the canvas slice and the Law D cold-reopen demo — is blocked on it and its order file is not yet written.

## Standing rule for every builder (added 2026-07-18)

**Never run `bun qa/run.ts --all`, and never delete `node_modules`.** You are working in the founder's shared tree, which holds ~1.9 GB of installed dependencies. The cold run belongs to the verifier, in a throwaway worktree. Run your order's package-level gates plus its falsification proof, then report — and say that you deferred the cold run. Two builders have already had to route around this instruction; it is now fixed in `PROTOCOL.md` rather than left for the third to discover.

## Reviewer (standing role, `PROTOCOL.md`)

A **third** agent — neither the builder nor the verifier of the work in question — may be handed either job at any time:

- **Pre-build read of an order** (five minutes, two questions): *can each acceptance gate actually fail?* and *does each deliverable have exactly one meaning?* This is where four of five order defects were born, so it is the higher-leverage trigger. **WO-006a has not had one** — the verifier wrote it, so the verifier's eyes are spent on it.
- **Post-merge adversarial read** every two or three merged orders. Findings only, no edits.

Decorrelation is the point: correlated cognition masks defects exactly as correlated environments do. Reviews are testimony — they get verified before they are acted on, like any other claim.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
