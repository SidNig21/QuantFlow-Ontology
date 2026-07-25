## The answer

The first half of your question is fully expressible. The second half is not — there is no "gating" relationship in these files, only a judgment-attachment one.

### Runs testing a hypothesis that got a supporting evaluation

Three types and two links, all in `research.ts`:

- `run` (object) --[`tests`]--> `hypothesis` (object)
- `run` (object) --[`evaluated_by`]--> `evaluation` (object)

```269:275:research.ts
export const tests = defineLink({
  name: "tests",
  description: "Why this run or strategy exists — it tests a named hypothesis.",
  lifecycle: "experimental",
  from: [run, strategy],
  to: hypothesis,
});
```

```317:323:research.ts
export const evaluated_by = defineLink({
  name: "evaluated_by",
  description: "Verdict attachment: which evaluation judged an artifact or run.",
  lifecycle: "experimental",
  from: [artifact, run],
  to: evaluation,
});
```

The field and value that mean "supporting" are `evaluation.verdict === "supports"`, from the enum `["supports", "rejects", "inconclusive"]`. Its own describe text makes it the gating field and explicitly demotes `confidence`:

```251:260:research.ts
    verdict: z
      .enum(["supports", "rejects", "inconclusive"])
      .describe(
        "Disposition of the evidence against the hypothesis. This field carries gating semantics; confidence does not override it.",
      ),
    confidence: z
      .number()
```

Two precision notes. First, `confidence` is a number with no threshold declared anywhere, so it must not be used to filter for "supporting". Second, do not confuse this with `hypothesis.status === "supported"`, which is a resolution state on a different object written by `resolve_hypothesis`; nothing in these files links the two or keeps them consistent.

Also, a run does not "produce" an evaluation. `produces` targets only `[dataset, artifact]` — `evaluation` is not in that union, so the only run-to-evaluation relationship available is the inbound-judgment one, `evaluated_by`.

### Which published artifact those evaluations gated

This is where it breaks. The only direct edge between an `artifact` and an `evaluation` is the same `evaluated_by` link, traversed in reverse: `artifact` --[`evaluated_by`]--> `evaluation`. So the closest expressible query is:

```
hypothesis H
  <-[tests]- run R
  -[evaluated_by]-> evaluation E  where E.verdict == "supports"
  <-[evaluated_by]- artifact A
```

That says "evaluation E judged both run R and artifact A." It does not say E gated A's publication. The alternative reading, `run R -[produces]-> artifact A`, says only that R emitted A — it never touches E at all. Neither path carries gate semantics.

## What is missing

**A gating link.** `evaluated_by` is defined as "which evaluation judged an artifact or run." Judging is not gating. There is no `gates`, `gated_by`, `approves`, or `blocks` link anywhere in the three files, so "this evaluation was the precondition for publishing that artifact" is unrepresentable. Note that `resolve_hypothesis` describes itself as "evaluation-gated at the Kernel" and `verdict` says it "carries gating semantics" — the gate is asserted in prose in two places and modeled in zero.

**A link from `evaluation` to `hypothesis`.** An evaluation's hypothesis is only knowable transitively, by hopping back through the run's `tests` edge. So an evaluation attached to an `artifact` rather than a `run` has no path to any hypothesis at all, and your query silently cannot see it. Relatedly, `record_evaluation` claims to record a verdict "against a hypothesis lineage" but its input is only `{metrics, verdict, confidence, rationale, critic_findings_ref}` — no `hypothesis_id`, `run_id`, or `artifact_id`. The action cannot create any of the edges the query depends on.

**A published state on `artifact`.** The object has `kind`, `content_hash`, and `storage_ref`, and nothing else. There is no `published_at`, no status enum. You can filter `kind === "report"` for reports, but "published" is not a filterable property; you would have to assume every artifact row is published because `publish_artifact` is the only way one gets created.

**Timestamps for ordering.** For a gate claim to hold, the evaluation must precede the publication. Neither `evaluation`, nor `artifact`, nor `run` carries any timestamp field (`dataset.as_of` and the market-plane fences exist, but nothing on this path). Precedence is unprovable from the data.

**Cardinality and traversal semantics.** `define.ts` is imported by all three files but is not among them. Whether one `evaluation` may be the target of `evaluated_by` from both a run and an artifact simultaneously — which is exactly what the closest-available query above requires — is undeclared, as is whether reverse traversal is supported at all.

The minimum additions to make your question answerable as asked: a directed link such as `gated_by` from `artifact` to `evaluation` (or `gates` in the reverse direction), a direct `evaluation` → `hypothesis` link, and subject references plus a timestamp on `record_evaluation`.
