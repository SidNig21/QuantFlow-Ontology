# WO-101 G2 Cold-Read Protocol

This fixture tests description clarity, not data availability.

## Inputs

Provide a cold agent only these files:

- `qf-kernel-schema/src/ontology/research.ts`
- `qf-kernel-schema/src/ontology/market.ts`
- `qf-kernel-schema/src/ontology/agent.ts`

No database rows and no additional docs are allowed.

## Question 1

Using only these type definitions: I want to know which runs testing a given hypothesis produced a supporting evaluation, and which published artifact those evaluations gated. Name the exact types, the exact links, and the exact field and value that means "supporting". If anything needed is missing from these files, say what.

### Pass criteria

- Names types: `hypothesis`, `run`, `evaluation`, `artifact`
- Names links: `tests`, `produces`, `evaluated_by`
- Names predicate: `evaluation.verdict === "supports"`
- Does not confuse `confidence` with the gate predicate

> **Corrected at verification, 2026-07-25.** This list originally also required
> `derived_from`. `WO-101.md` struck that requirement after the build; this file was not
> updated with it, so the runnable fixture kept a criterion its own order had retired.
> Two independent cold readers omitted `derived_from` and gave the same reason — the edge
> is not on the path the question describes — which is the measurement that settles it.

## Question 2 (scored separately)

Using only these files: can you express which evaluation authorized a specific published report? If not, name exactly what is missing.

### Pass criteria

- Answers no
- Identifies that `evaluation` has no outbound link
- Identifies that `evaluated_by` points at `evaluation` rather than from it
- Notes that `derived_from` cannot prove which report a verdict authorized

## Scoring note

If Question 1 fails, treat it as a description defect and revise descriptions.

If Question 2 fails by claiming expressibility, treat it as a schema finding: there is no edge that marks which evaluation authorized publication.
