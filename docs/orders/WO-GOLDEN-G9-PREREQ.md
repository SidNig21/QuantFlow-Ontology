# WO-GOLDEN-G9-PREREQ — Ordinary completion is evidence, not a Report

status: DRAFT / SEMANTIC READER REQUIRED
kind: Golden Baseline dependency prerequisite (does not close or reorder G9)
owner: Router
build-authority: NO until fresh Reader YES/YES and `NEXT.md` rotation
starting-authority: `f3250531c3ec1a7110ea45ba7863b0faf62dad18`

## Plain-language outcome

When an ordinary agent session completes, QuantFlow preserves its exact output as
a `trajectory` Artifact produced by that session. It does not claim that the
unevaluated output is a governed Report. Report publication without an
independently supporting Evaluation remains refused.

## Why this prerequisite exists

Paused G2 reached the live production artifact writer. That writer currently
hard-codes `kind: "report"` without `evaluation_id`, and the Kernel correctly
refuses it. G2 cannot prove the retained artifact writer/root/hash boundary until
the writer uses the already-supported ordinary-evidence contract.

Fresh dependency adjudication task
`01a037ab-2506-78d0-a969-42c5d78f3446` answered:

1. full G9 depends on unresolved G8 write-law work — **YES**;
2. full G9 would invalidate at least the frozen G8 baseline — **YES**;
3. the minimum prerequisite is inseparable from full G9 — **NO**.

Therefore full G9 remains parked in its original order. This prerequisite owns
only the ordinary-completion trajectory boundary.

## Fixed semantic contract

For one completing ordinary agent session:

- exactly one Artifact row is published with `kind = "trajectory"`;
- its bytes, SHA-256, storage reference, and artifact-root confinement remain
  exact;
- exactly one `produces` link connects the completing `AgentSession` to that
  Artifact through the existing creation envelope;
- no `evaluation_id` is fabricated or supplied;
- zero `report` Artifacts are created by ordinary completion;
- a direct attempt to publish `kind = "report"` without an independently
  supporting Evaluation continues to fail with the existing Kernel refusal.

This derives from existing Kernel truth. It adds no ontology type, action, link,
truth store, support table, compatibility path, or UI state.

## Deliverables

### A — Rename the ordinary completion writer

Replace Report-specific naming in the ordinary completion writer and its live
call site with trajectory/evidence naming. The writer must call the existing
`publish_artifact` action with `kind: "trajectory"`, exact bytes/hash/root, and
one creation-envelope `produces` link from the completing session.

### B — Preserve governed Report refusal

Do not change Report schema, Evaluation requirements, governed-review support
tables, or Report publication logic. The focused proof must show that
`kind: "report"` without independent Evaluation lineage remains refused.

### C — Focused falsifiable proof

The retained artifact-root semantic gate must fail independently when any of
these breaks are introduced:

1. change the ordinary Artifact kind back to `report`;
2. omit or duplicate the `produces` link;
3. connect the link from the wrong session;
4. alter the stored bytes, hash, reference, or root;
5. allow an unevaluated Report to publish.

Its green receipt must name the trajectory Artifact id, producing session id,
link count, root, hash, byte count, ordinary Report count zero, and unevaluated
Report refusal.

## Candidate allowlist

Product:

- `collab-electron/src/main/agent-artifact-writer.ts`
- `collab-electron/src/main/agent-host.ts`

Focused proof only:

- `qa/gates/artifact-root/run.ts`
- an existing directly coupled unit test for the writer, only if source proves
  it is required
- generated Atlas outputs caused solely by the allowed product rename
- `docs/orders/evidence/golden-baseline/g9-prereq/**`

No other source, schema, support table, projection, UI, package, dependency,
Golden group, or G2 deletion target is in scope.

## Starting-SHA acceptance matrix

Before Builder mutation, freeze against the clean prerequisite starting SHA:

1. focused writer/unit proof, if present;
2. `bun qa/run.ts artifact-root`;
3. `bun qa/run.ts governed-review`;
4. `bun qa/run.ts kernel-one-path`;
5. `bun qa/run.ts kernel-sole-writer`;
6. Atlas generation/ratchet for the touched product paths;
7. `git diff --check` for the candidate range.

Record every pre-existing red before mutation and assign it to its named Golden
owner. A candidate-introduced red stops.

## Independent verification

A fresh Verifier receives only this order, authority docs, immutable candidate
SHA, starting-SHA matrix receipt, and candidate evidence. It reruns the focused
matrix, inspects the complete candidate diff, and proves each falsifier can turn
the relevant assertion red without weakening it.

## Stop conditions

Stop if:

- ordinary completion is proven to require Report semantics;
- trajectory publication requires a new schema/support-table contract;
- any change to `packages/qf-kernel/src/governed-review.ts`, Kernel schema,
  `research-world-projection.ts`, or Electron Report finalization is required;
- the same semantic assertion remains red twice after a repair;
- any unknown/duplicate Artifact or producer link appears;
- Report-without-Evaluation refusal weakens;
- the paused G2 diff cannot be restored byte-for-byte after prerequisite
  acceptance.

## After acceptance

Resume G2 on top of the accepted prerequisite, restore its preserved diff
byte-for-byte, refresh only stale exact-SHA receipts, and complete G2. Full G9
remains parked after G8 in the original Golden sequence.
