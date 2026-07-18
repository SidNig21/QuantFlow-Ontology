# Workshop protocol — how QuantFlow gets built

Solves the real constraint: **founder usage limits**. The architect (Fable, premium usage) is scarce; builder agents (Codex, Cursor, second Claude) are plentiful. So the architect never writes bulk code — it architects, orders, and verifies.

## Roles

| Role | Who | Does | Never does |
|---|---|---|---|
| **Architect/Verifier** | Fable (main account) | Writes work orders · makes design calls · re-runs gates independently · inspects contracts/seams · maintains roadmap | Bulk code generation |
| **Builders** | Codex · Cursor · Claude #2 | Execute one work order on one branch · run gates before submitting · report in the required format | Self-certify · touch schema semantics without an order · exceed order scope |
| **Machine verifier** | qa gates + GitHub Actions CI | Runs on every push, forever | Sleep |

**Founder = PM.** Verifies outcomes (demos, gate boards, the order log) — never diffs. Trust flows from receipts.

## The loop

```
Architect writes WO-NNN (self-contained file, no chat context needed)
  → Founder points a builder at the WO file
  → Builder works a branch: build → run gates → commit with evidence → report
  → Founder brings the report back (or architect reads the branch)
  → Architect verifies: re-run gates + inspect seams → PASS (merge) or REWORK (numbered defects appended to WO)
```

**Cheap-verification rule:** every order's acceptance is **runnable commands**, so verification burns minutes, not budget. If verifying something requires reading all the code, the order was written wrong.

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
