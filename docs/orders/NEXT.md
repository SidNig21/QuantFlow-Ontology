# NEXT — R18 — GOLDEN BASELINE HOLD / PHASE 2 G2

status: G2 STOPPED / G9 REPORT-AUTHORITY PREREQUISITE DECISION
rotated-at: 2026-08-24
rotated-by: Router under founder Golden-Baseline disposition
active-order: [WO-GOLDEN-G2](WO-GOLDEN-G2.md)
builder-authority: NO — preserve G2 diff; no mutating group opens pending founder route decision
program-decision: [ADR-0004](../adr/0004-repository-golden-baseline.md)
phase-1-audited-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase-1-independent-pass: `000BA6BE7DE6227FF850F61EE2DB35E3F72AB49DECAC670893F774ECB3E8CC38`
phase-2-active-group: G2 — unbuilt and superseded residue
order-candidate: `fe25c418d54c1fbbf3cd6a3805c25f81e8f4560c`
order-content-sha256: `BD69149FBE636495580DD8DD2EC2A3E1922A658482A24F3CC943A6DF1E796CFA`
reader-receipt: [G2 initial semantic Reader YES/YES](evidence/golden-baseline/g2/READER-ACCEPTANCE.md)
amendment-reader: [G2 Rework 1 Reader YES/YES](evidence/golden-baseline/g2/REWORK-1-READER-ACCEPTANCE.md)
rewrite-2-reader: [G2 Rewrite 2 Outcome A YES/YES](evidence/golden-baseline/g2/REWRITE-2-READER-ACCEPTANCE.md)
rewrite-2-reader-task: 01a0377a-970f-7c41-88be-bc76ac949cfe
pre-existing-red-03: [kernel-market-lineage assigned to G8](evidence/golden-baseline/g2/PREEXISTING-RED-03.md)
mechanical-red-06: [artifact-root launcher retarget](evidence/golden-baseline/g2/PREEXISTING-RED-06.md)
semantic-blocker-reader: [G2 pauses for G9 Report authority](evidence/golden-baseline/g2/REPORT-AUTHORITY-BLOCKER-READER.md)
semantic-blocker-reader-task: `01a0379c-af16-7fc0-b059-0667babd2d16`
reader-task: `01a0374e-e3cd-77e1-a05c-838010b0770c`
g1-build-base: `57fc4ff711848bbb7f668f608e7478d407dc14f4`
g1-accepted-candidate: `767717760858c8a0dc77d61e95535faca3c316a0`
g1-evidence-head: `c3a01f6781bb26e6a47d06928a01babcd57895fb`
g1-verifier-task: `01a0370a-9d7b-78f2-aca5-40d4f93f5b7d`
g1-acceptance: [G1 CLOSED / ACCEPTED](evidence/golden-baseline/g1/GROUP-ACCEPTANCE.md)
r18-authority: FROZEN UNTIL PHASE 2 + PHASE 3 GOLDEN PASS
r18-order-candidate: `10bad8c24f7665d11b8fb8550fd62b017382e790`
r18-reader-receipt: [R18 semantic Reader YES/YES](evidence/r18/READER-ACCEPTANCE.md)
accepted-product-candidate: `eecb2457eef6a71d888129c0bb353129956478d1`
accepted-closure: `333987dbdc1ca603fb03df4f485f88f1ad4bf458`
closure-receipt: [Pre-R18 final acceptance](evidence/pre-r18-coherence/FINAL-ACCEPTANCE.md)

## Checkpoint

R0-R17 and Pre-R18 remain **CLOSED / ACCEPTED**. R18 remains the route's active
rung but is frozen by ADR-0004 until Phase 2 and the whole-product Phase 3
requalification pass.

G1 is closed and independently accepted. G2 Round 1 exposed one pre-existing
stale heading assertion. Rework 1 then exposed two valid-looking observation
states around asynchronous worker recruitment. Cleanup is now green, but the
session topology may not change until a fresh Reader derives the completion
contract from current accepted authority and source.

Rewrite 2's accepted finite topology and cleanup are green. Matrix item 3 then
reproduced a starting-SHA proof-integrity red: kernel-market-lineage passes a
string where the unchanged canonical schema requires an array. Exact relevant
blobs are unchanged and G2 has no path intersection, so ADR-0004 assigns this
pre-existing red to G8. Items 4-5 are green. The mechanical item-6 launcher
correction passed its helper test and reached the real semantic body, which then
proved a current production defect: ordinary agent completion is mislabeled as
a governed Report and the Kernel correctly refuses it without Evaluation
lineage. Fresh semantic Reader task `01a0379c-af16-7fc0-b059-0667babd2d16`
assigns that defect to G9 and rules that G2 cannot honestly prove non-regression
without the product repair. G2 is stopped with its working diff preserved. No
Builder or other mutating group opens until the founder chooses whether to
advance the bounded G9 prerequisite before resuming G2. Item 3 remains assigned
to G8. Nothing may merge to main, begin R18, or combine surgical groups.
