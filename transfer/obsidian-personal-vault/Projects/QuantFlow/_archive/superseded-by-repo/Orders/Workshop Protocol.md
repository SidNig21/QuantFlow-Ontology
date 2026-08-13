---
tags: [quantflow, workshop, process]
created: 2026-07-17
---

# Workshop protocol — how QuantFlow gets built

Solves the real constraint: **founder usage limits**. Fable (this assistant, premium usage) is scarce; builder agents (Codex, Cursor, second Claude account) are plentiful. So Fable never writes bulk code — Fable architects, orders, and verifies.

## Roles

| Role | Who | Does | Never does |
| --- | --- | --- | --- |
| **Architect/Verifier** | Fable (main account) | Writes work orders · makes design calls · re-runs gates independently · inspects contracts/seams · maintains vault + roadmap | Bulk code generation |
| **Builders** | Codex · Cursor · Claude #2 | Execute one work order on one branch · run gates before submitting · report in the required format | Self-certify · touch schema semantics without an order · exceed order scope |
| **Machine verifier** | qa gates + GitHub Actions CI | Runs on every push, forever | Sleep |

**Founder = PM.** Verifies outcomes (demos, gate boards, this order log) — never diffs. Trust flows from receipts (blueprint discipline #7).

## The loop

```
Fable writes WO-NNN (self-contained file, no chat context needed)
  → Founder pastes/points builder at the WO file
  → Builder works a branch: build → run gates → commit with evidence → report
  → Founder brings the report back (or Fable reads the branch)
  → Fable verifies: re-run gates + inspect seams → PASS (merge) or REWORK (numbered defects appended to WO)
```

Cheap-verification rule: every order's acceptance is **runnable commands**, so Fable's verification burns minutes, not budget. If verifying something requires reading all the code, the order was written wrong.

## Work order format (template)

```markdown
# WO-NNN — <title>
status: open | building | verifying | rework | done
assignee: builder | fable
depends: WO-MMM

## Objective — one sentence.
## Context pack — links/files the builder must read first (keep short).
## Deliverables — concrete files/behaviors.
## Contract — constraints that may not be violated (types, naming, laws).
## Acceptance gates — exact runnable commands + expected results.
## Out of scope — explicit, to stop helpful drift.
## Report back — the exact format the builder must return.
```

## Order board

- [[WO-000 - Cut the fork]] — status: **done** (2026-07-17) — repo live at ~/QuantFlow-Ontology; founder: rename on GitHub + push
- [[WO-001 - Codegen spike]] — status: **open** — assignee: builder — *no dependency; can start immediately as a standalone package*

## Resource inclusion — the three gates

The research library is a just-in-time lookup table, never a backlog. A resource enters the build only when a work order pulls it through all three gates:

1. **Need gate** — an open or next WO needs this exact capability. No WO → stays in the library.
2. **Law gate** — it respects Kernel-owns-truth and the seam laws. Anything that wants to *be* authoritative state is reference-only, never a dependency.
3. **Role gate** — name it honestly: **dependency** (installed, maintained — highest bar), **pattern to steal** (copy the idea, no dependency — most library value), or **reading**.

Plus: **one per slot.** Per need, pick one tool. Six model providers = one decision deferred, not six inclusions.
