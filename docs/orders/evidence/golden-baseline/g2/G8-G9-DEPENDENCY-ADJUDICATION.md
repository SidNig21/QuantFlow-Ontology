# G8/G9 dependency adjudication

- task: `01a037ab-2506-78d0-a969-42c5d78f3446`
- authority SHA: `f3250531c3ec1a7110ea45ba7863b0faf62dad18`
- mode: fresh read-only source/authority adjudication
- repository mutation: none

## Answers

1. **YES** — full G9 crosses unresolved G8 ownership for `qf_review_*`
   support writes and publication-table semantics.
2. **YES** — full G9 changes `packages/qf-kernel/src/governed-review.ts`, whose
   exact bytes are part of the frozen G8 pre-existing-red baseline.
3. **NO** — the minimum prerequisite is separable: ordinary completion can use
   the existing `trajectory` Artifact plus existing `produces` creation envelope
   without Report authority/history/schema work.

## Route

`B — MINIMUM G9 PREREQUISITE ONLY`

The prerequisite may change only the ordinary completion writer, live call
site, and directly coupled artifact-root proof. It must preserve exact bytes,
hash, root, one producer link, zero ordinary Reports, and the existing refusal
of Report publication without independent Evaluation lineage.

Full G9 remains after G8. G2 remains paused until this prerequisite is
independently accepted.
