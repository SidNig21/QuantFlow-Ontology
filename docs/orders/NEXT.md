# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-006c — rework round 1**

Read `docs/orders/WO-006c.md`, bottom verification record ("Verification — round 1"). Everything except D1 is verified and accepted — do not touch it.

- Continue on the existing branch `wo-006c`. First: `git fetch origin && git merge origin/QuantFlow`.
- **Fix D1 only:** make the `agent-path` gate cold-safe — its own installable dependency closure (own `package.json`, `file:` deps, install step per the existing package-gate pattern in `qa/run.ts`), heavy imports loaded only after install so a missing dependency fails the gate, never the runner.
- **Proof:** simulate cold in a throwaway `git worktree` of your own (allowed for this one proof — never delete `node_modules` in the shared tree): fresh worktree, `bun qa/run.ts --all` → 10/10 green from zero installs. Paste the header and the `agent-path OK` line. If you cannot, defer the cold proof to the verifier and paste your wiring diff instead.
- Commit and push. **Do not merge.**

## Parallel-eligible

Nothing — this is the last v0.1 rung. When it merges, the v0.5 ladder opens **two lanes that run at once** (`ROADMAP.md`): dock/agent (WO-007 → 008 → 012) and data (WO-009 → 010/011).

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
