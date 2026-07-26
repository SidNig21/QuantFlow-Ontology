## Short answer

No — not as authorization. You can express that an evaluation **judged** a report, but not that one **authorized its publication**, and you can't tell those two apart.

What works today: a report is an `artifact` with `kind: "report"` (deliberately not its own type, per the description on `artifact`), and `evaluated_by` accepts `artifact` as a source, so `report → evaluated_by → evaluation` is a legal edge.

```317:323:research.ts
export const evaluated_by = defineLink({
  name: "evaluated_by",
  description: "Verdict attachment: which evaluation judged an artifact or run.",
  lifecycle: "experimental",
  from: [artifact, run],
  to: evaluation,
});
```

So "list the evaluations attached to this report" is answerable. "Which evaluation authorized this report to be published" is not.

## What's missing, specifically

**1. No edge that means authorization.** `evaluated_by` is described as "judged." The same edge covers an evaluation of the evidence that gated publication and an evaluation critiquing the report after the fact. Nothing discriminates them, and no link in these files carries properties — every `defineLink` call uses only `name`/`description`/`lifecycle`/`from`/`to` — so you can't tag the edge either. You need a separate link (an `authorized_by` / `gated_by`) or edge attributes.

**2. No way to pick the decisive one.** Multiple evaluations can attach to one report with no ordering, no "current" marker, and no `supersedes` link between evaluations.

**3. No time on either end.** Neither `artifact` nor `evaluation` has a created-at or decided-at field. The schema times other things carefully (`dataset.as_of`, `event.starts_at`, `result.settled_at`), but here you can't establish that the verdict preceded the publication — which is the minimum evidence for a causal claim like "authorized."

**4. `publish_artifact` has no gate and no slot for the verdict.** Its input is only `kind`, `content_hash`, `storage_ref`. Compare `resolve_hypothesis`, which is explicitly documented as "evaluation-gated at the Kernel." Publication carries no equivalent gate, so whatever writes the evaluation edge does so out of band, through a path these files don't define.

**5. No approval object at all.** `request_approval` takes `subject_ref: string` and `approve`/`deny` take `request_id: string`, but no `approval_request` or `approval` object — and no link to one — exists in any of the three files. Operator/L2 authorization is therefore entirely absent from the graph; it survives only as action arguments pointing at ids that no object type backs.

**6. Evaluation can't reach the hypothesis it was judged against.** `record_evaluation` claims to record a verdict "against a hypothesis lineage," but `tests` runs from `[run, strategy] → hypothesis` only. When an evaluation hangs off a report artifact rather than a run, there is no traversal to the hypothesis or its `success_criteria`, so you cannot check the verdict against the bar it was supposed to clear.

**7. "Published" isn't a state.** `artifact` has no status field, so a published report is indistinguishable from a registered one; publication is inferred from the row existing.

Minor supporting gap: `evaluation.critic_findings_ref` is a plain string rather than a link (as are `spec_ref`, `contract_ref`, `system_prompt_ref`), so the critic evidence behind a verdict isn't traversable either.

One caveat on scope: `../define.ts` isn't in this directory, so I read link semantics from usage across the three files rather than from the helper's own contract. If `defineLink` supports cardinality constraints or edge properties, point 1 and 2 soften from "impossible" to "unused."
