# NEXT — R18 GOLDEN BASELINE HOLD / G5 SEMANTIC PREREQUISITE READ

status: G4 CLOSED / G5 FINAL CLOSURE ADJUDICATION — READER YES / YES
rotated-at: 2026-08-26
rotated-by: Router after G5 Reader YES/YES and frozen starting matrix
active-order: [WO-GOLDEN-G5](WO-GOLDEN-G5.md)
builder-authority: **EVIDENCE-ONLY FINALIZATION AUTHORIZED — PENDING INDEPENDENT VERIFIER**
g5-reader-order-sha: `cd0a2405af9c7e97a9740b1df065b6ec98eaeeac`
g5-starting-product-sha: `f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806`
g5-reader-verdict: **YES / YES**
g5-finite-reread-after: `5248031`
g5-finite-reread-task: `01a04034-6afb-73a3-9f0e-6419fa5f76ec`
g5-finite-reread-verdict: **NO / NO — AUTHORITY 5248031; superseded by final fresh finite Reader below**
g5-final-finite-reader-verdict: **YES / YES**
program-decision: [ADR-0004](../adr/0004-repository-golden-baseline.md)
phase-1-audited-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
g5-final-closure-reader-task: 01a0420e-ba89-7111-8832-4fa1928e23b9
g5-final-closure-reader-authority: 5a3c02e3c35feaf9901606de0faba030bcb87f14
g5-final-closure-reader-verdict: **YES / YES**
phase-2-active-group: G5 — Legacy ACP and unconsumed renderers
g4-accepted-candidate: `2d491f20a030b9ac0b476846535f2ecc71239af1`
g4-acceptance: [G4 CLOSED / ACCEPTED](evidence/golden-baseline/g4/GROUP-ACCEPTANCE.md)
g3-accepted-candidate: `01f3a3257d2cbd7e9d5e11219520013b957a6801`
g3-acceptance: [G3 CLOSED / ACCEPTED](evidence/golden-baseline/g3/GROUP-ACCEPTANCE.md)
g2-acceptance: [G2 CLOSED / ACCEPTED](evidence/golden-baseline/g2/GROUP-ACCEPTANCE.md)
g1-acceptance: [G1 CLOSED / ACCEPTED](evidence/golden-baseline/g1/GROUP-ACCEPTANCE.md)
full-g9-authority: PARKED AFTER G8
r18-authority: FROZEN UNTIL PHASE 2 + PHASE 3 GOLDEN PASS
protected-main: `5882ab2febf00f2c15a94c868c191420ed561bb4`

## Checkpoint

R0–R17 and Pre-R18 remain **CLOSED / ACCEPTED**. G1–G4 are independently accepted. Full G9 remains after G8. G8 owns the frozen `kernel-market-lineage` red; G12 owns the frozen Electron `userData`, Windows package/typecheck, and operations reds.

G4 closed at `2d491f20a030b9ac0b476846535f2ecc71239af1`. The G5 semantic Reader accepted the amended order at `cd0a2405af9c7e97a9740b1df065b6ec98eaeeac`. The order-only commits after `f29dc3603ee969e9c6573f0a91ce0a4bc0f5b806` leave product/config bytes unchanged.

The frozen starting matrix records both new G5 selectors as absent/red; G4 retired-route, Dock launch, Hermes launch-policy, Kernel sole-writer, and the real Electron build are green. `hermes-first-turn-synthetic` is pre-existing red because its readiness assertion still names retired `hermes-orchestrator` while production authority requires `hermes-research-director`. This is an authorized mechanical stale-selector repair: change only that readiness assertion, prove old red/new green, and do not rewrite later synthetic fixture identifiers without separate evidence.

The fresh semantic Reader task `01a04034-6afb-73a3-9f0e-6419fa5f76ec` returned `NO / NO` against authority `5248031` with finite defects. The accepted G5 deletion diff remains preserved but is not a candidate. The final fresh semantic Reader now returns **YES / YES** on the finite result-delivery contract in [WO-GOLDEN-G5](WO-GOLDEN-G5.md#final-fresh-reader-result-delivery-contract): `closeAgentSessionRow` currently admits native-TUI teardown after `complete_task` without checking undelivered addressed results; the fixed trace is orchestrator PTY registration sequence 2, explicit teardown unregister sequence 7, exact result queue/lookup sequence 8 with `pushed_at=NULL`, then non-causal PTY exit. The later Builder may edit only `collab-electron/src/main/agent-host.ts` teardown admission and `collab-electron/src/main/agent-host-lifecycle.test.ts`. The invariant is that a native-TUI recipient is not unregistered or killed while an addressed delegated result remains undelivered; teardown is allowed after durable `pushed_at` acknowledgment or with no outstanding result. The proof is old-red/new-green lifecycle falsifier, normal `bun qa/run.ts hermes-first-turn-synthetic`, unchanged G5 matrix, trace-disabled inertness, and `processes=0 roots_remaining=0 leaked=[]`. The actual Director receipt must precede `result_return`; worker `turn=complete` remains intermediate only. No fallback, fake completion, resurrection, timeout/cleanup weakening, G8/G9 reorder, or other G5 scope change is open.

## Finite G8 prerequisite amendment

This amendment supersedes only the named result-delivery file boundary for one finite G8 Kernel/schema proof-integrity prerequisite. It authorizes editing exactly `collab-electron/src/main/kernel.ts`, `qa/gates/hermes-research.ts`, and G5 evidence files. In `kernelRunGuidedResearch`, remove only the duplicate nested `params.strategy_id` field. Retain the existing top-level `strategy_id` action field unchanged. Do not modify the Kernel callee, generated schema, governed-review implementation, Report publication, runtime identity, or any G5 deletion path.

Add one focused old-red/new-green falsifier: with the duplicate nested field restored, the focused path must fail before Run creation with `params rejects fields: strategy_id`; with only that duplicate removed, the unchanged `hermes-first-turn-synthetic` gate must prove the complete Run -> independent critic -> Evaluation -> canonical `qf.research.report.v2` chain. All existing assertions, falsifiers, timeouts, cleanup rules, and the full G5 matrix remain unchanged.

Full G8 remains in its original order; full G9 remains after G8. This amendment does not reorder or open either group.

The final packaged synthetic rerun reaches Director, recruited worker, durable Run/Artifact, critic launch, activation, and exact four-tool discovery, then records no critic read/Evaluation/Report. Source adjudication assigns this unchanged failure shape to G8 proof integrity rather than G5 deletion or lifecycle behavior. Under the founder's standing Golden throughput clarification, [the final G5 closure adjudication](WO-GOLDEN-G5.md#final-closure-adjudication-after-the-g8-owned-packaged-red) may close G5 only after one fresh semantic Reader returns `YES / YES` and one fresh independent Verifier proves the exact bounded non-regression contract. Fresh semantic Reader task `01a0420e-ba89-7111-8832-4fa1928e23b9` returned `YES / YES` against authority `5a3c02e3c35feaf9901606de0faba030bcb87f14` with no defects. Builder authority is now limited to evidence-only finalization; no product or gate repair is open.
