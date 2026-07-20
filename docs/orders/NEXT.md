# NEXT — the current order (updated only by the verifier)

> **Builder: this file is your complete entry point.** It always points at the single order that is currently unblocked. Do not choose your own order; do not proceed past this one.
> **Founder: feed this same file to every fresh builder window.** One line is enough: *"Follow the instructions in `docs/orders/NEXT.md`."*

## Current order: **WO-007 — rework round 1**

Read `docs/orders/WO-007.md`, bottom verification record. Everything except D1 is verified and accepted — touch nothing else.

- Continue on the existing branch `wo-007`. First: `git fetch origin && git merge origin/QuantFlow`.
- **Fix D1 only:** `agent-host.ts` must not import `qf-kernel` — route `getAgentDefinition` / `listAgentDefinitions` / `resolveSpeciesPackage` through `kernel.ts` re-exports; delete the direct import.
- **Proof:** `bun qa/gates/kernel-sole-writer-app.ts` → green; plus **every static gate** (new standing rule in `PROTOCOL.md`): repo-shape, lockfile-committed, kernel-sole-writer, no-canvas-domain-writes, kernel-sole-writer-app, doc-action-surface, one-skin — paste all.
- Commit and push. **Do not merge.**

## Founder acceptance checkpoint (founder decision, 2026-07-19)

The founder demos **once, at the milestone that matters**: skin (WO-006d) -> dock (WO-007) -> Hermes in a tile (WO-008) -> **A2A working end-to-end** (the order after WO-008: second species + host binding, two agents collaborating live). The founder demos once, at A2A, and it includes everything beneath it. `docs/demos/agent-path.md` remains valid and runs then, alongside the dock's own cold-reopen test. v0.1 is machine-verified and merged; its human half is folded into that checkpoint deliberately, not skipped.

## Parallel-eligible

Nothing — WO-007 touches shell, host, schema, and gates; WO-008 (Hermes) is blocked on it and its order is being drafted by the verifier.

---

*Rotation rule: when the verifier passes the current order, the same verification commit flips the log status in `README.md` and rewrites this file to the next unblocked rung. If this file and the order log disagree, the log wins — report the discrepancy instead of building.*
