# G9 semantic Reader acceptance — NO / NO amendment

status: **NO / NO — FIVE FINITE DEFECTS; BUILDER CLOSED**
order: `docs/orders/WO-GOLDEN-G9.md`
reader-task: `01a0489e-04ea-71a1-8b6a-d0e151621103`
reader-authority: `d6ab5ed66a18c9de23db047a4b41584acaaeec0e`
reader-tree: `8f94bf63b16bd74e5ef17461cc4f0d15477efc4f`
reader-verdict: **NO / NO**
review-mode: fresh read-only semantic review; no repository mutation
starting-authority: `754606932dfb23bd0a6e6f432937b1c2bc436739`
starting-product-candidate: `61abfa5b23553f86a5c2d95facdf0473310fc44`
starting-product-tree: `94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013`
starting-evidence-tree: `b04a991ca98da1d57b8637a7fcd0738a4e41bd21`
accepted-trajectory-prerequisite: `4a12b948746c108bae3143d5982decd50a6957e9`
candidate-after-reader: **none — Reader returned NO / NO; Builder is closed**
evidence-after-reader: **this documentation amendment is not a product candidate**

## Plain-language review target

The Reader decided that the next work is not yet ready to make one independently
reviewed answer authoritative without losing older answers or inventing a second
store. The amendment below is bounded to the five finite omissions.

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
accepted ordinary trajectory writer is inherited, read-only context, and not
reopened.

The exact source paths are `packages/qf-kernel/src/governed-review.ts`,
`packages/qf-kernel/src/create.ts`, `collab-electron/src/main/kernel.ts`,
`collab-electron/src/main/index.ts`,
`collab-electron/src/main/research-world-projection.ts`,
`collab-electron/src/windows/shell/src/research-world.js`,
`qa/gates/hermes-research.ts`, `qa/gates/report-authority.ts`, and
`qa/run.ts`, plus focused tests, generated Atlas projections, legacy publication
upgrade fixtures, and this evidence directory. The accepted trajectory files
are read-only census inputs.

## Five finite defects requiring the bounded amendment

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

## Exactly two Reader questions

1. **Can every G9 normal gate and falsifier fail on the duplicate publisher,
   worker-evidence cardinality, volatile-only restart binding, missing
   independent lineage, current/history and legacy-upgrade invariants,
   same-version/different-strategy context crossing, projection/finalizer-id
   agreement, replay, and stale-profile defects, then restore green without a
   hard-coded success path?**
2. **Does every G9 deliverable have one finite meaning while preserving the
   G8 close, accepted trajectory prerequisite, G10 Canvas/runtime boundary,
   G11 history/docs boundary, G12 Windows/package boundary, and R18 freeze?**

## Reader result

Question 1: **NO — five finite defects recorded above**

Question 2: **NO — the packet was incomplete, boundaries remain preserved**

Verdict: **NO / NO — Builder remains closed; the same Reader must review the
bounded amendment before NEXT.md can rotate.**
