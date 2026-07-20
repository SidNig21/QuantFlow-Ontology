# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-008 — rework round 1** *(quality fixes; the plug result stands)*

Read `docs/orders/WO-008.md`, bottom verification record. Outcome B and both admitting commits are **accepted** — touch nothing but D1–D3.

- Continue on branch `wo-008`. First: `git fetch origin && git merge origin/QuantFlow`.
- **D1:** Outcome B becomes a positive assertion (host binary exists ∧ createSession failed ∧ typed shim stderr); unknown failures say UNKNOWN. Re-run; paste the B output.
- **D2:** delete `species/critic-mock/scripts/wo008-dock-proof.mjs`; keep PNG + README evidence.
- **D3:** critic-mock's `agentInfo.name` says `critic-mock`.
- Static gates green; commit and push. **Do not merge.**

## Parallel-eligible

**WO-007b — host seams** ([`WO-007b.md`](WO-007b.md)) is parallel-eligible **now**: zero file overlap with WO-008 (`species/**` vs host files; the order forbids each lane from touching the other's). A second builder may take it immediately with the standard script, branch `wo-007b`. Its pre-build read is recommended (verifier-authored).
---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
