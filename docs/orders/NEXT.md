# NEXT — R18 — GOLDEN BASELINE HOLD / PHASE 2 G2

status: G2 AUTHORIZED / BUILDER OPEN
rotated-at: 2026-08-24
rotated-by: Router under founder Golden-Baseline disposition
active-order: [WO-GOLDEN-G2](WO-GOLDEN-G2.md)
builder-authority: YES — execute only the accepted G2 order
program-decision: [ADR-0004](../adr/0004-repository-golden-baseline.md)
phase-1-audited-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase-1-independent-pass: `000BA6BE7DE6227FF850F61EE2DB35E3F72AB49DECAC670893F774ECB3E8CC38`
phase-2-active-group: G2 — unbuilt and superseded residue
order-candidate: `e8de7dc0d9af3a1367a6bb7547719b6303a23379`
order-content-sha256: `2927F9AB1ACECB6787D2D9104A980F23C9E2F242B6A1F4DC734E584898905C1E`
reader-receipt: [G2 semantic Reader YES/YES](evidence/golden-baseline/g2/READER-ACCEPTANCE.md)
reader-task: `01a0371d-ab6a-7f72-b6a4-a680a64e5fcc`
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

G1 is closed and independently accepted. G2's corrected order has fresh
semantic Reader YES/YES and is now the only authorized implementation group.
Its scope is the exact eleven unbuilt/superseded targets and the bounded proof
retargeting named in the active order.

One fresh Builder may execute G2 from a clean pull of this branch and produce
one immutable candidate. A separate fresh Verifier must bind to that candidate.
Nothing may merge to `main`, begin R18, absorb G3+, or skip the Phase-2 group
boundary.
