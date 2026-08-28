# G9 independent Verifier acceptance — finite fail

Plain language: the first G9 implementation was not accepted because eight specific proof and identity defects remain; one narrowly bounded repair is now open.

status: **FINITE FAIL — exactly eight defects; same-order repair Builder open**
order: `docs/orders/WO-GOLDEN-G9.md`
verifier-task: `01a048fb-7a31-7880-b64b-98275789a38d`
verdict: **FINITE FAIL**
candidate: `4ef49077b2b423601c02b043de82b34d231bb7f5`
candidate-tree: `bdba7c9540122288866bed6fb4aa57952c6f025e`
evidence-head: `f7e841ff3e075bd49ed70bf8da79c2409ca5c899`
evidence-tree: `69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`
reader-authority: `8d78fb714998cc52d50538d6f9ea9a3323f75535`
reader-tree: `9af6ae1714c49fc9caa8e59915d0bc88b11a9b35`
reader-recheck: **not required — accepted meaning, scope, and dependency order are unchanged**
repair-builder: **open exactly one same-order G9 repair Builder**

## Decision boundary

The Verifier inspected the immutable candidate and its evidence. This is an
implementation/evidence **FINITE FAIL**, not a semantic Reader rejection. The
final Reader's seven-cure YES / YES remains binding. No G9 meaning, scope,
G8 closure, or G10–G12/R18 boundary is reopened.

## Exactly eight defects

| # | finite defect | required repair proof |
| ---: | --- | --- |
| 1 | The Builder report was bound to the wrong evidence head. | Bind the report and every acceptance receipt to `f7e841ff3e075bd49ed70bf8da79c2409ca5c899` / tree `69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`; do not substitute the earlier `4f7753b9ccbaf71f65f7657f4c939f4fcec7519f` receipt. |
| 2 | The starting manifest omitted `packages/qf-kernel/src/index.ts` and `packages/qf-kernel/src/portable.ts`. | Add both literal paths with exact starting Git-tree-byte SHA-256 values and dispositions. |
| 3 | Four recorded parent hashes were wrong. | Recompute exactly those four hashes from immutable Git-tree bytes at the repair start; never use checkout bytes. |
| 4 | Five candidate hashes were CRLF checkout-byte hashes. | Recompute all candidate hashes from committed Git-tree bytes and record the exact byte basis. |
| 5 | F01–F14 used source-pattern checks and dummy cleanup rather than executable isolated red/green behavior. | Use real isolated Kernel/Artifact fixtures and deliberate executable breaks; each named red must fail for its named defect, restore, and pass, with actual owned process/root cleanup evidence. |
| 6 | Focused tests omitted zero/multiple/mismatch evidence, restart, exact retry, refusals, and current/historical finalizer cases. | Add executable fail-capable coverage for every omitted case, including exact `work.run_id`, close/reopen, current/history IDs, refusal paths, and no-duplicate retries. |
| 7 | Worker evidence was not bound to exact `work.run_id` across `governed-review.ts`, `execute.ts`, and `kernel.ts`. | Persist and enforce exact Run identity in the existing durable completion/evidence relation; another Run's trajectory must hard-red before any Report/publication/projection write. |
| 8 | Top-level `authority_context` violated the canonical packaged Report shape. | Keep the five-field lineage in the existing canonical payload/metadata shape; do not add or weaken a top-level contract, and make the gate assert that truthful packaged shape. |

## Atlas and inherited boundaries

The Verifier recorded Atlas diff **WORSE**: governed-review coverage changed
`indexed → partial`, with three expected persistence sites. The repair must
remove that coverage regression. `bun qf-atlas/ratchet.mjs` remained
`HARD RED 0`; that status must stay green.

The inherited G12 Windows/package/operations reds remain outside G9 and are not
relabelled as acceptance. G8 remains closed. G10, G11, G12, and R18 remain
closed/frozen.

## Repair handoff

The repair Builder starts from product candidate
`4ef49077b2b423601c02b043de82b34d231bb7f5` / tree
`bdba7c9540122288866bed6fb4aa57952c6f025e` and treats evidence head
`f7e841ff3e075bd49ed70bf8da79c2409ca5c899` / tree
`69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f` as read-only. It may address only
the eight defects above under the same `WO-GOLDEN-G9` order. A fresh
independent Verifier must decide the repaired candidate.
