# Order 002 — Director → Codex question / answer after Critic

**Parent:** WO-W2-02 Deliverables 1–2 (app orchestration)  
**Depends:** Order 001 merged in candidate  
**Priority:** P0

## Problem

Governed review and revision exist (`collab-electron/src/main/kernel.ts:1310` — `request_revision`; `governed-review` gate PASS), but there is **no** app path that:

1. Preserves first Critic Evaluation,
2. Creates a **question** Task bound to a comparison row,
3. Delivers to Codex once,
4. Records `qf.question-answer.v1`,
5. Enters revision and fresh second Critic round.

W2-01 proved `send_task` / `send_result` handoff only ([acceptance](../../orders/evidence/WO-W2-01/ACCEPTANCE.md)).

## Why it matters

This is the “argue and improve” step in the vision. Without it, QuantFlow is a single-shot researcher, not a desk.

## Scope

**May change:**

- `collab-electron/src/main/kernel.ts`, `collaboration-gateway.ts`, `ipc-kernel.ts`
- `collab-electron/src/main/research-world-projection.ts` (surface labels: Question, Waiting, Answered)
- `collab-electron/src/windows/shell/src/` — investigation / participant projection (no new workspace)
- `species/` prompts only if needed for tool discovery (no new dependencies)
- Tests adjacent to touched files

**Must not:**

- Add Message/Conversation types
- Codex-only revision shortcut (W2-02 §Deliverable 2)
- Pre-seeded or synthetic question/answer for acceptance

## Done means

1. Focused tests green:

```text
bun qa/run.ts governed-review
bun qa/run.ts research-director-delegation
bun qa/run.ts typecheck
```

2. **Integrated harness** (may be sub-step before Order 004 gate): programmatic path proving:
   - Critic Evaluation exists before question Task creation
   - Question Task has `asks_about` to source Task, result Artifact, Evaluation, Dataset, Run, Quote, and `selection_ref`
   - Wrong same-role session cannot answer (W2-02 falsifier 2)
   - Revision uses existing `request_revision`; new result Artifact; old Evaluation cannot authorize new Report (falsifier 3)

3. No second truth store; all durable steps via `execute()`.

## Report

Include sequence diagram or numbered Kernel object ids from one run. Verifier will check Evaluation precedes question and revision Evaluation is distinct.
