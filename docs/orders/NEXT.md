# NEXT — R18 — GOLDEN BASELINE HOLD / G2 RESUMED

status: G2 PRESERVATION INTEGRATION AUTHORIZED
rotated-at: 2026-08-25
rotated-by: Router under founder Golden-Baseline disposition
active-order: [WO-GOLDEN-G2-INTEGRATION](WO-GOLDEN-G2-INTEGRATION.md)
builder-authority: YES — bounded recovery/integration followed by the complete G2 matrix
program-decision: [ADR-0004](../adr/0004-repository-golden-baseline.md)
phase-1-audited-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase-1-independent-pass: `000BA6BE7DE6227FF850F61EE2DB35E3F72AB49DECAC670893F774ECB3E8CC38`
phase-2-active-group: G2 resumed over accepted minimum prerequisite; full G9 remains after G8
integration-reader: [G2 preservation integration Reader YES/YES](evidence/golden-baseline/g2/INTEGRATION-READER-ACCEPTANCE.md)
integration-reader-task: `01a0380f-defb-76a0-a367-1e9564847225`
restoration-check: [Exact patch check and five-file overlap](evidence/golden-baseline/g2/PREREQUISITE-RESTORATION-CHECK.md)
prerequisite-acceptance: [Minimum Report-authority prerequisite CLOSED](evidence/golden-baseline/g9-prereq/PREREQUISITE-ACCEPTANCE.md)
prerequisite-order-accepted-sha: `dc4ece31a3cc8473cb603d6e6e6fef6d2a16a4ee`
prerequisite-reader: [G9 prerequisite semantic Reader YES/YES](evidence/golden-baseline/g9-prereq/READER-ACCEPTANCE.md)
prerequisite-reader-task: `01a037b5-93c0-7fc2-8eec-63319089f2e3`
dependency-adjudication: [G8/G9 dependency adjudication](evidence/golden-baseline/g2/G8-G9-DEPENDENCY-ADJUDICATION.md)
g2-order: [WO-GOLDEN-G2](WO-GOLDEN-G2.md)
g2-rewrite-2-reader: [G2 Rewrite 2 Outcome A YES/YES](evidence/golden-baseline/g2/REWRITE-2-READER-ACCEPTANCE.md)
g2-rewrite-2-reader-task: `01a0377a-970f-7c41-88be-bc76ac949cfe`
g2-pre-existing-red-03: [kernel-market-lineage assigned to G8](evidence/golden-baseline/g2/PREEXISTING-RED-03.md)
g2-mechanical-red-06: [artifact-root launcher retarget](evidence/golden-baseline/g2/PREEXISTING-RED-06.md)
g2-semantic-blocker-reader: [G2 pauses for G9 Report authority](evidence/golden-baseline/g2/REPORT-AUTHORITY-BLOCKER-READER.md)
g2-semantic-blocker-reader-task: `01a0379c-af16-7fc0-b059-0667babd2d16`
g1-accepted-candidate: `767717760858c8a0dc77d61e95535faca3c316a0`
g1-verifier-task: `01a0370a-9d7b-78f2-aca5-40d4f93f5b7d`
g1-acceptance: [G1 CLOSED / ACCEPTED](evidence/golden-baseline/g1/GROUP-ACCEPTANCE.md)
r18-authority: FROZEN UNTIL PHASE 2 + PHASE 3 GOLDEN PASS
accepted-product-candidate: `eecb2457eef6a71d888129c0bb353129956478d1`
accepted-closure: `333987dbdc1ca603fb03df4f485f88f1ad4bf458`
closure-receipt: [Pre-R18 final acceptance](evidence/pre-r18-coherence/FINAL-ACCEPTANCE.md)

## Checkpoint

R0–R17 and Pre-R18 remain **CLOSED / ACCEPTED**. R18 remains frozen by
ADR-0004 until Phase 2 and whole-product Phase 3 requalification pass.

G1 is closed and independently accepted. G2's accepted finite session topology
and cleanup are green. Its item-3 proof-integrity red remains assigned to G8.
Item 6 reached a real product defect: ordinary AgentOS completion is mislabeled
as a governed Report, which the Kernel correctly refuses without Evaluation.

Fresh dependency adjudication proved full G9 cannot move ahead of G8: it crosses
G8 write-law ownership and would stale the G8 baseline. It also proved the
ordinary-completion trajectory repair is separable. The minimum prerequisite
has fresh semantic Reader YES/YES and is temporarily active.

Before its Builder opens, the Router must hash/stash the complete paused G2 diff
and freeze the clean starting matrix. After independent prerequisite acceptance,
restore G2 byte-for-byte and complete it. Full G9 remains after G8. Nothing may
merge to main, begin R18, or combine surgical groups.
