# Order 003 — Interactive evidence table tile

**Parent:** WO-W2-02 Deliverable 3  
**Depends:** Orders 001–002 (selection_ref must exist)  
**Priority:** P0

## Problem

Ryan cannot sort, filter, select, or ask about **the same comparison row** participants see. `research-world-projection.ts` renders mission/task worlds but there is **no** `qf.comparison-row.v1` binding and no presentation-only table tile (`grep qf.comparison-row` → empty in `*.ts`).

## Why it matters

Game-day use requires inspecting evidence, not reading terminal summaries. W2-02 explicitly forbids presentation controls from mutating Kernel scientific inputs (§Deliverable 3).

## Scope

**May change:**

- New or extended Canvas capability tile under `collab-electron/src/windows/shell/src/`
- Projection read paths already used by ontology tools (same Dataset/Run/Artifact/Quote/index)
- IPC for “ask about selected row” → dispatches `create_question_task` (Order 001)
- Unit tests for row identity (index + artifact hash, not list position)

**Must not:**

- Apply/Adopt controls that change population or calculation (W2-02 out of scope)
- Create Kernel objects on sort/filter (falsifier 5)
- New page/mode/workspace

Row key format per order: `qf.comparison-row.v1:{dataset_id,run_id,result_artifact_id,quote_id,comparison_index}`.

## Done means

1. `bun qa/run.ts typecheck` PASS  
2. `bun qa/run.ts no-canvas-domain-writes` PASS  
3. **Demonstration:**
   - Tile renders rows from one result Artifact only
   - Selection produces stable `selection_ref` matching participant prompt
   - Falsifier: changing sort order does not change Kernel row counts (snapshot before/after)
   - Falsifier: question from tile uses same `selection_ref` as participant path (Order 002)

4. Fits existing tile grammar (`one-canvas` tests remain green).

## Report

Screenshots or gate capture paths; cite `comparison_index` and `result_artifact_id` in receipt.
