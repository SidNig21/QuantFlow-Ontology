# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-008d — Hermes tile = real TUI**

Read `docs/orders/WO-008d.md`. Founder decision 2026-07-20: **embed the real native TUI always** — for Hermes now, for every future interactive agent that has one. ACP session-tile “Run turn” is not the Hermes UX.

- New branch from `QuantFlow` (e.g. `wo-008d`).
- Dock Spawn Hermes → term tile running `hermes --tui` (measured argv); Kernel session + orphan hygiene.
- Data-driven `surface: native_tui` (or equivalent) — no Hermes-only renderer hacks.
- Keep host ACP code; default path is TUI. Extract-first on shell JS.
- Static gates + build green; screenshot; commit and push. **Do not merge.**

## Parallel / blocked

**WO-009** — parked until Hermes desk UX is acceptable. **WO-012** — after 008d / as written.
---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
