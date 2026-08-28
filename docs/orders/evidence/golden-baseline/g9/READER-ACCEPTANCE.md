# G9 semantic Reader acceptance — pending

status: **PENDING — NO BUILDER AUTHORITY**
order: `docs/orders/WO-GOLDEN-G9.md`
reader-task: **not assigned**
review-mode: fresh read-only semantic review; no repository mutation
starting-authority: `754606932dfb23bd0a6e6f432937b1c2bc436739`
starting-product-candidate: `61abfa5b23553f86a5c2d95facdf0473310fc44`
starting-product-tree: `94ef17e1876c68fcfb2713f4a2cf9f0d05a9d013`
starting-evidence-tree: `b04a991ca98da1d57b8637a7fcd0738a4e41bd21`
accepted-trajectory-prerequisite: `4a12b948746c108bae3143d5982decd50a6957e9`
candidate-after-reader: **none — Builder is closed**
evidence-after-reader: **none — this is a Reader scaffold only**

## Plain-language review target

The Reader decides whether the next work can make one independently reviewed
answer authoritative without losing older answers or inventing a second store.

## Inputs the Reader must bind

- `START_HERE.md`, `docs/orders/PROTOCOL.md`, and `docs/adr/0004-repository-golden-baseline.md`;
- the G8 [group acceptance](../g8/GROUP-ACCEPTANCE.md) and [final Verifier receipt](../g8/VERIFIER-ACCEPTANCE.md);
- the accepted trajectory [prerequisite acceptance](../g9-prereq/PREREQUISITE-ACCEPTANCE.md) and [independent PASS](../g9-prereq/VERIFIER-PASS.md);
- the G8/G9 [dependency adjudication](../g2/G8-G9-DEPENDENCY-ADJUDICATION.md) and [Report-authority blocker ruling](../g2/REPORT-AUTHORITY-BLOCKER-READER.md); and
- the exact G9 source/consumer/write/publication inventory and starting matrix in the order.

## Frozen inventory for review

The bounded denominator is: two production-shaped Report publication paths;
one process-local Run-to-evidence map with one write and one read; two
production finalizer call sites; one durable `qf_review_publication` sink with
no current/history fields; one projection selector that infers current by
publication order; one generic Kernel Report guard; and one inherited stale
`hermes-orchestrator` report-boundary red. The accepted ordinary trajectory
writer is inherited, read-only context, and not reopened.

The exact source paths are `packages/qf-kernel/src/governed-review.ts`,
`packages/qf-kernel/src/create.ts`, `collab-electron/src/main/kernel.ts`,
`collab-electron/src/main/index.ts`,
`collab-electron/src/main/research-world-projection.ts`,
`collab-electron/src/windows/shell/src/research-world.js`,
`qa/gates/hermes-research.ts`, `qa/gates/report-authority.ts`, and
`qa/run.ts`, plus focused tests, generated Atlas projections, and this evidence
directory. The accepted trajectory files are read-only census inputs.

## Exactly two Reader questions

1. **Can every G9 normal gate and falsifier fail on the duplicate publisher,
   volatile-only binding, missing independent lineage, current/history
   invariant, context-crossing, projection, restart, replay, and stale-profile
   defects, then restore green without a hard-coded success path?**
2. **Does every G9 deliverable have one finite meaning while preserving the
   G8 close, accepted trajectory prerequisite, G10 Canvas/runtime boundary,
   G11 history/docs boundary, G12 Windows/package boundary, and R18 freeze?**

## Reader result

Question 1: **PENDING**

Question 2: **PENDING**

Verdict: **PENDING — Builder remains closed; NEXT.md must be rotated separately
after a Reader YES/YES.**
