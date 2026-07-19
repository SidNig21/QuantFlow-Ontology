# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-005**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute `docs/orders/WO-005.md` exactly.

- Work on a new branch named `wo-005`.
- Stay strictly inside the order's scope — anything not listed in its Deliverables is out.
- Run every acceptance gate and paste the full, unedited output in your report, using the order's Report-back format.
- Commit to your branch and push it. **Do not merge.**
- If anything in the order is ambiguous, stop and say so instead of improvising.

WO-005 builds the **Kernel** — the one place durable truth lives, and the direct expression of `START_HERE.md`'s One Rule. It consumes `qf-kernel-schema`'s generated migration and transition tables; it never hand-writes schema. Two of its gates enforce Law E: nothing outside the Kernel may own SQLite or persist a domain type.

## Parallel-eligible (second builder only, never the same builder)

**WO-004a — proof correction** ([`WO-004a.md`](WO-004a.md)) is unblocked and touches only `tools/runtime-proof/`, which WO-005 is forbidden to enter. A second builder may take it now.

An adversarial review found WO-004's P1 asserted a value against itself. WO-004a replaces the overstated assertions with measured ones and requires the builder to **prove its own gate can fail**. WO-006 remains blocked on the Kernel.

## Reviewer (standing role, `PROTOCOL.md`)

A **third** agent — neither the builder nor the verifier of the work in question — may be handed either job at any time:

- **Pre-build read of an order** (five minutes, two questions): *can each acceptance gate actually fail?* and *does each deliverable have exactly one meaning?* This is where three of four order defects were born, so it is the higher-leverage trigger.
- **Post-merge adversarial read** every two or three merged orders. Findings only, no edits.

Decorrelation is the point: correlated cognition masks defects exactly as correlated environments do. Reviews are testimony — they get verified before they are acted on, like any other claim.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked order. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
