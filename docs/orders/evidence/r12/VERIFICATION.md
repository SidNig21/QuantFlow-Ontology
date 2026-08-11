# R12 — independent critic and report approval

QuantFlow now ships a `hermes-critic` Dock profile with the dedicated
`research.evaluate` capability. A critic task starts through the normal Hermes
WSL launcher and is instructed to call the generated `qf_record_evaluation`
action exactly once.

The Kernel accepts that action only when:

- the caller is a running admitted critic seat;
- the critic differs from the session that executed the Run;
- the Run succeeded and produced the exact named R11b result Artifact;
- the result bytes still match their content hash and contain `qf.metrics.v1`;
  and
- the Kernel can atomically store critic findings and bind `performed_by`,
  Run, result, and Hypothesis lineage.

A Report now requires that complete independent lineage in addition to the R9
supporting verdict. The proof deliberately rejected an orchestrator pretending
to be a critic, self-review, and a rejecting verdict used as report approval.

Focused native-Windows proof:

```text
bun test src/r12-independent-critic.test.ts ... src/market-ingest.test.ts
45 pass, 0 fail, 191 expect() calls

bun test cli/qf-hermes-launch.test.ts src/main/dock-profiles.test.ts src/main/ontology-gateway.test.ts
17 pass, 0 fail, 81 expect() calls

bun test
171 pass, 0 fail, 600 expect() calls
```

This proves identity separation, durable findings, metric derivation, and
Report authorization. It does not claim that a model’s judgment is objectively
good, and it does not place bets or trades. The paid live-Hermes and visible
close/reopen consumer demonstration is intentionally combined with the single
R13 Windows release proof rather than run again here.
