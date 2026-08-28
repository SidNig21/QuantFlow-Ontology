# G8 Reader baseline — Kernel, schema, Law-B, and proof-integrity contract

status: **FRESH SEMANTIC READER PENDING / BUILDER CLOSED**
order: `docs/orders/WO-GOLDEN-G8.md`
starting_authority: `8f13495b24e995e69f43deadeeec72ff644e111a`
starting_evidence_tree: `39fcc664b03717dcbf9b9abdf4951152dc44bf93`
starting_product_candidate: `ba2b489b7378426fab976267a58eaadc5ffdaf91`
starting_product_tree: `6de625faeb677ce0e18b38825f1f4e843e0a545a`
g7_parent_authority: `b422df42229bcd8c9510608ce60684e69b6021bd`
g7_verifier_task: `01a046fc-0548-7001-86be-78adaff82ce4`
g7_verifier_verdict: **PASS WITH INHERITED REDS**
phase_1_source_sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase_1_historical_denominators: `1,150 tracked files; 153 direct dependency declarations; 19 Electron package declarations/hooks; 40 bounded operational roots`
current_g8_denominator: `13 named kernel-one-path offenders; 89 experimental lifecycle declarations; 1 inherited packaged result-observation failure shape; 1 Law-B write-path invariant`
reader_authority: **OPEN FOR FRESH SEMANTIC READER ONLY**
builder_authority: **CLOSED**
g9_order: **UNCHANGED — full G9 remains after G8**
r18_authority: **FROZEN**

## Finite distinction

The Phase-1 counts above are historical provenance. G8 gates evaluate the
current finite set: the exact 13 offender paths, the 89 still-experimental
lifecycle declarations, the single inherited packaged proof-integrity failure
shape, and the one Law-B write-path invariant. A historical count cannot be
used as a substitute for a current path, byte, or assertion receipt.

## Exact inherited offender set

```text
packages/qf-kernel/src/r11a-deterministic-execution.test.ts
qa/gates/dev-dock-readiness.ts
qa/gates/founder-steering.ts
qa/gates/kernel-sole-writer-app.ts
qa/gates/pre-r18-coherence.ts
qa/gates/r17-founder-kernel-compatibility.ts
qa/gates/r17-guided-technique-consumer.ts
qa/gates/research-director-delegation.ts
qa/gates/research-director-front-door.ts
qa/gates/research-world-visible.ts
qa/gates/team-composition-ui.ts
qa/gates/team-composition.ts
qa/gates/technique-outcome-loop.ts
```

At the G7 candidate, the real `bun qa/run.ts kernel-one-path` gate exits `1`
and names exactly these 13 paths. G8 must make that same gate report zero
offenders without broadening its allowlist or hiding a path.

## Proof-integrity boundary

The inherited packaged shape reaches Director, worker, durable Run/Artifact,
critic launch/activation, and tool discovery, but does not produce the concrete
Director result observation before `result_return`. Worker `turn=complete` is
intermediate. G8 must preserve the existing activation grammar, distinguish the
Director receipt from worker completion, and prove the existing Evaluation/Report
boundary without taking ownership of G9 Report semantics.

## Reader questions

1. Can every G8 normal gate and falsifier fail on the exact defect it names?
2. Does every deliverable have one finite meaning with G9/G10/G11/G12/R18
   boundaries preserved?

No Builder authority opens until a fresh Reader records `YES / YES` and
`NEXT.md` names the G8 Builder door.
