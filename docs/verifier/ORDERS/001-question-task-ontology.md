# Order 001 — Question Task ontology and kernel actions

**Parent:** [WO-W2-02](../../orders/active/WO-W2-02-REAL-COLLABORATIVE-INQUIRY.md) Deliverable 1 (ontology slice)  
**Priority:** P0 — blocks all other W2-02 work

## Problem

W2-02 requires question Tasks, typed links, and answer artifacts (`WO-W2-02:73-94`). The live schema has no `task_kind`, `asks_about`, `create_question_task`, or `qf.question-answer.v1`. Search across the repo shows **only** the order document mentions these symbols.

**Evidence:** `grep -r create_question_task` → no matches under `qf-kernel-schema/` or `packages/qf-kernel/`.

## Why it matters

Without Kernel-recorded questions and answers, Director–Codex dialogue stays terminal fiction. The Critic cannot bind objections to exact rows, and the verifier cannot falsify cross-seat confusion.

## Scope

**May change:**

- `qf-kernel-schema/src/ontology/*.ts` (Task fields, links, actions)
- `qf-kernel-schema/golden/*` via `bun run generate` only
- `packages/qf-kernel/src/` — implement `create_question_task`, answer completion, refusal paths
- Focused tests in `packages/qf-kernel/src/` and `qf-kernel-schema/`
- `qf-atlas/` regenerate if IPC/actions added

**Must not change:**

- `docs/orders/NEXT.md`, `START_HERE.md`, `PROTOCOL.md`, `DOCTRINE.md`
- Unrelated Canvas features, NFL tools, new dependencies
- General chat/message ontology (forbidden by W2-02 §Contract)

Implement exactly what W2-02 specifies: `task_kind = assignment | question`, `selection_ref`, `asks_about`, `answers`, `qf.comparison-row.v1` canonical JSON, `qf.question-answer.v1` artifact contract.

## Done means

1. Commands pass:

```text
cd qf-kernel-schema && bun test && bun run generate && cd ..
bun qa/run.ts schema
bun qa/run.ts typecheck
cd packages/qf-kernel && bun test
```

2. **Behavior (kernel harness, not UI):**
   - `create_question_task` writes Task + `asks_about` + event via `execute()` only; replay with same `attempt_id` is idempotent; changed payload refuses.
   - Completing an answer writes `answers` link atomically with `qf.question-answer.v1` artifact.
   - Falsifier: `answered` without matching Dataset `coverage`/`as_of` refuses (per W2-02 §Deliverable 5).

3. Golden byte-stable except for intentional schema expansion (generator diff in commit).

## Report

Evidence per `AGENTS.md` — commands, output, falsifier + control, one paragraph on judgment.
