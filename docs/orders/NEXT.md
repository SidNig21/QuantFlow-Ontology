# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-004a**

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute `docs/orders/WO-004a.md` exactly.

- Work on a new branch named `wo-004a`.
- Stay strictly inside the order's scope — anything not listed in its Deliverables is out.
- Run every acceptance gate and paste the full, unedited output in your report, using the order's Report-back format.
- Commit to your branch and push it. **Do not merge.**
- If anything in the order is ambiguous, stop and say so instead of improvising.

**The Kernel exists (WO-005, merged).** WO-004a is a correction order: WO-004's P1 asserted a value against itself, and this replaces the overstated assertions with measured ones. It requires you to **prove your own gate can fail** — neuter the cancel path, show red, restore, show green.

## Parallel-eligible (second builder only, never the same builder)

*none right now.* **WO-006 — one agent path end-to-end** is unblocked by the Kernel but **its order file is not yet written** (architect owes it). It is the v0.1 phase gate: spawn from canvas, stream into a tile, publish one Artifact, and satisfy **Law D** — create an Artifact, kill and relaunch the app, the tile shows it from the Kernel. Do not start it from the roadmap line; no order file, no work.

## Reviewer (standing role, `PROTOCOL.md`)

A **third** agent — neither the builder nor the verifier of the work in question — may be handed either job at any time:

- **Pre-build read of an order** (five minutes, two questions): *can each acceptance gate actually fail?* and *does each deliverable have exactly one meaning?* This is where three of four order defects were born, so it is the higher-leverage trigger.
- **Post-merge adversarial read** every two or three merged orders. Findings only, no edits.

Decorrelation is the point: correlated cognition masks defects exactly as correlated environments do. Reviews are testimony — they get verified before they are acted on, like any other claim.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked order. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
