# G9 semantic Reader acceptance — final YES / YES

status: **YES / YES — ALL SEVEN CUMULATIVE DEFECTS CURED; EXACTLY ONE BUILDER OPEN**
order: `docs/orders/WO-GOLDEN-G9.md`
reader-task: `01a0489e-04ea-71a1-8b6a-d0e151621103`
reader-round: FINAL
reader-authority: `8d78fb714998cc52d50538d6f9ea9a3323f75535`
reader-tree: `9af6ae1714c49fc9caa8e59915d0bc88b11a9b35`
reader-verdict: **YES / YES — all seven cumulative defects cured; no new ambiguity or scope expansion**
reader-round-1-authority: `d6ab5ed66a18c9de23db047a4b41584acaaeec0e`
reader-round-1-tree: `8f94bf63b16bd74e5ef17461cc4f0d15477efc4f`
reader-round-2-authority: `d6c0d7e91d726d8b5a33050f403efec87a3f1cd4`
reader-round-2-tree: `54ecefe7cd2f979c0e3864a5d7c4cd6aff31f182`
review-mode: fresh read-only semantic review; no repository mutation
starting-authority: `754606932dfb23bd0a6e6f432937b1c2bc436739`
starting-product-candidate: `61abfa5b23553f86a5c2d95facdf0473310fc44`
starting-product-tree: `94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013`
starting-evidence-tree: `b04a991ca98da1d57b8637a7fcd0738a4e41bd21`
accepted-trajectory-prerequisite: `4a12b948746c108bae3143d5982decd50a6957e9`
candidate-after-reader: **none — Builder has not run; this Reader verdict opens exactly one bounded Builder**
evidence-after-reader: **this Router documentation record is receipt-only and not a product candidate**
builder-starting-authority: `8d78fb714998cc52d50538d6f9ea9a3323f75535`
builder-starting-tree: `9af6ae1714c49fc9caa8e59915d0bc88b11a9b35`
builder-status: **OPEN — exactly one bounded G9 Builder under WO-GOLDEN-G9**

## Plain-language review target

The final Reader accepted the bounded contract needed to make one independently
reviewed answer authoritative without losing older answers or inventing a
second store. All seven cumulative defects are cured; exactly one bounded G9
Builder may now implement this contract from the recorded starting identity.

## Inputs the Reader must bind

- `START_HERE.md`, `docs/orders/PROTOCOL.md`, and `docs/adr/0004-repository-golden-baseline.md`;
- the G8 [group acceptance](../g8/GROUP-ACCEPTANCE.md) and [final Verifier receipt](../g8/VERIFIER-ACCEPTANCE.md);
- the accepted trajectory [prerequisite acceptance](../g9-prereq/PREREQUISITE-ACCEPTANCE.md) and [independent PASS](../g9-prereq/VERIFIER-PASS.md);
- the G8/G9 [dependency adjudication](../g2/G8-G9-DEPENDENCY-ADJUDICATION.md) and [Report-authority blocker ruling](../g2/REPORT-AUTHORITY-BLOCKER-READER.md); and
- the exact G9 source/consumer/write/publication inventory and starting matrix in the order.

## Frozen inventory for review

The bounded denominator is: two production-shaped Report publication paths;
one process-local Run-to-evidence map with one write and one read; one existing
durable worker-evidence relation (`task.completed` event payload
`input.result_artifact_id` plus `assigned_to`/`produces`/`derived_from` and
read-receipt links); two production finalizer call sites; one durable
`qf_review_publication` sink with no current/history fields; one projection
selector that infers current by publication order; one generic Kernel Report
guard; and one inherited stale `hermes-orchestrator` report-boundary red. The
Round 2 refinement requires partition-before-fold legacy handling and distinct
current/historical finalizer IDs. The accepted ordinary trajectory writer is
inherited, read-only context, and not reopened.

The exact source paths are `packages/qf-kernel/src/governed-review.ts`,
`packages/qf-kernel/src/create.ts`, `collab-electron/src/main/kernel.ts`,
`collab-electron/src/main/index.ts`,
`collab-electron/src/main/research-world-projection.ts`,
`collab-electron/src/windows/shell/src/research-world.js`,
`qa/gates/hermes-research.ts`, `qa/gates/report-authority.ts`, and
`qa/run.ts`, plus focused tests, generated Atlas projections, legacy publication
upgrade fixtures, and this evidence directory. The accepted trajectory files
are read-only census inputs.

The Builder must preserve the order's exact source-manifest requirement: before
mutation, record one sorted literal full-path manifest covering every inventoried
source/consumer/write/publication path, focused test/fixture, generated Atlas
projection, and receipt-only evidence path, with parent blob SHA-256 and an
explicit read-only/editable/generated/receipt disposition. After mutation,
record every changed and untracked path with post-candidate SHA-256; an
unlisted path, changed read-only path, omitted source, or candidate-to-evidence
non-receipt is hard red. The manifest is evidence only, not runtime truth.

## Round 1 — five finite defects preserved and amended

1. `strategy_id` must be named separately from Technique/Strategy version, with
   a same-version/different-`strategy_id` red and restored-green cross-context
   proof.
2. The existing durable worker-evidence relation must require exactly one
   matching completed-task trajectory; zero, multiple, non-trajectory, or
   mismatched candidates are hard red.
3. F09 must reintroduce map-only lookup or remove durable binding in an isolated
   fixture, restart, and observe the exact missing-binding failure before its
   restored-green run.
4. Legacy publication upgrade must use `created_at ASC, source_work_key ASC`,
   seed multiple rows, prove current/superseded history, and abort atomically on
   an unresolvable row with no partial migration.
5. The finalizer must return the persisted Report id and prove publication,
   Evaluation/gates, projection, close/reopen, and retry agreement with no
   duplicate publication.

## Round 2 — exactly two finite ambiguities

The same Reader task
`01a0489e-04ea-71a1-8b6a-d0e151621103` returned Round 2 **NO / NO** against
amendment `d6c0d7e91d726d8b5a33050f403efec87a3f1cd4` (tree
`54ecefe7cd2f979c0e3864a5d7c4cd6aff31f182`). Only these two ambiguities remain:

1. Legacy publication rows must be partitioned by the complete canonical
   five-field authority key before applying `created_at ASC,
   source_work_key ASC`; F12 cross-key seeded rows must vary Mission,
   `strategy_id`, Technique version, Dataset, and research/as-of state and prove
   that no fold occurs across any partition.
2. A historical/superseded Evaluation must return its own persisted historical
   Report id. Only the current supported Evaluation must agree with
   `current_report_id`/current projection; F14 must make current-vs-historical
   ID agreement cases and idempotent retries for each fail-capable.

## Final Reader result — YES / YES

The same Reader task `01a0489e-04ea-71a1-8b6a-d0e151621103` returned
**YES / YES** against final amendment authority
`8d78fb714998cc52d50538d6f9ea9a3323f75535` (tree
`9af6ae1714c49fc9caa8e59915d0bc88b11a9b35`). The Reader confirmed all seven
cumulative cures with no new ambiguity or scope expansion:

1. separate `strategy_id` authority-key component and same-version/different-
   strategy cross-context red/green proof;
2. exact one-match durable `task.completed` worker-evidence binding;
3. restart-specific F09 missing-binding red and restored durable-binding green;
4. deterministic legacy ordering and all-row atomic failure;
5. persisted finalizer Report identity and publication/gates/projection/retry
   agreement;
6. complete five-field partition-before-fold legacy isolation; and
7. distinct current/historical finalizer ids with fail-capable agreement and
   retry cases for each.

This is semantic acceptance only. It opens exactly one bounded G9 Builder under
`WO-GOLDEN-G9.md`; no candidate or Builder evidence exists yet, and the
independent Verifier remains the authority for implementation acceptance.

## Exactly two Reader questions

1. **Can every G9 normal gate and falsifier fail on the duplicate publisher,
   worker-evidence cardinality, volatile-only restart binding, missing
   independent lineage, current/history and legacy-upgrade invariants,
   partition-before-fold cross-key isolation, same-version/different-strategy
   context crossing, current-vs-historical projection/finalizer-id agreement,
   replay, and stale-profile defects, then restore green without a hard-coded
   success path?**
2. **Does every G9 deliverable have one finite meaning while preserving the
   G8 close, accepted trajectory prerequisite, G10 Canvas/runtime boundary,
   G11 history/docs boundary, G12 Windows/package boundary, and R18 freeze?**

## Reader result

Question 1: **YES — all seven cumulative defects have finite fail-capable red/green obligations**

Question 2: **YES — G8 is closed, the accepted trajectory prerequisite is preserved, and G10–G12/R18 boundaries remain closed/frozen**

Verdict: **YES / YES — final amendment accepted; exactly one bounded G9 Builder
is open; no new ambiguity or scope expansion.**
