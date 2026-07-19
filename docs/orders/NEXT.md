# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-006d — one skin** *(first order after v0.1 closed)*

Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute [`docs/orders/WO-006d.md`](WO-006d.md) exactly.

- Work on a new branch named `wo-006d`, cut from current `origin/QuantFlow`.
- **Restyle only** — the order's contract forbids behavior, layout, and dependency changes.
- Run the builder-run gates; paste unedited output including the one-skin bait red/green pair, and include the screenshots — the founder personally judges the look.
- Commit and push. **Do not merge.**
- Anything ambiguous or unmappable: stop and say so.

## Founder ceremony available now

**v0.1 is code-complete and merged.** The phase-closing demo is yours to run: `docs/demos/agent-path.md` — spawn from the UI, watch the stream, cancel one session, force-kill mid-run, relaunch, see honest terminal states and the artifact intact. Report the verdict and it goes in the log.

## Parallel-eligible

Nothing — WO-006d touches all of `windows/`, so a parallel order would collide. WO-007 (dock) follows it.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
