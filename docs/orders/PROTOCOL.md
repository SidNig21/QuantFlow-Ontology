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

## The shared-truth rule (binding on every agent, including the architect)

**The repo is the shared memory. Agent memories, chat transcripts, and vault notes are private caches — useful, never authoritative.** A decision, law, schema change, or order that is not committed to this repo does not exist, no matter which agent "remembers" it. If two sources disagree, the repo wins; if the repo is missing something an agent believes, the fix is a commit through an order — never "it's logged in my session." This is the same rule the product enforces at the tile seam, applied to the process that builds it: *an agent that remembers is a bug; the repo is the Kernel of the build.*

## Handing an order to a builder (the founder's script)

Hand out **one order at a time**, and only one whose `depends` are all `done` in the log. Fresh builder chat per order — the WO file is the entire context by design. Paste this, changing only the order number:

> Read `START_HERE.md`, then `docs/orders/PROTOCOL.md`, then execute `docs/orders/WO-NNN.md` exactly. Work on a new branch named `wo-NNN`. Stay strictly inside the order's scope — anything not listed in Deliverables is out. Run every acceptance gate and paste the full, unedited output in your report, using the order's Report-back format. Commit to your branch and push it. Do not merge. If anything in the order is ambiguous, stop and say so instead of improvising.

Rules of the loop: builders work on branches and never merge; status in the order log flips only when the verifier re-runs the gates and passes the work; a builder question is an order defect — the answer lands as an edit to the WO file, never as chat-only guidance; two failed rework cycles stop the order for a rewrite, never a third lap.
