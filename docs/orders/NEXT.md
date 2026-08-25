# NEXT — R18 — GOLDEN BASELINE HOLD / PHASE 2 G1

status: G1 CLOSED / ACCEPTED; G2 NOT AUTHORIZED
rotated-at: 2026-08-24
rotated-by: Router under founder Golden-Baseline disposition
active-order: [WO-GOLDEN-G1-R2](WO-GOLDEN-G1-R2.md)
builder-authority: NO — G1 closed; G2 requires Reader YES/YES and NEXT rotation
program-decision: [ADR-0004](../adr/0004-repository-golden-baseline.md)
phase-1-audited-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase-1-independent-pass: `000BA6BE7DE6227FF850F61EE2DB35E3F72AB49DECAC670893F774ECB3E8CC38`
phase-2-active-group: none — G1 accepted; G2 semantic draft is next
order-candidate: `f0992b6`
order-content-sha256: `0A50A17E75869667B653188F4D9028689C15E068B4CEF906FED40266F9E2C4B1`
reader-receipt: [G1 semantic Reader YES/YES](evidence/golden-baseline/g1/READER-ACCEPTANCE.md)
reader-task: `01a036e6-9de8-7362-bbc6-cde1e77584aa`
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

G1 is closed and independently accepted. The 14 tracked fake-staging artifacts
and three ignored stale residues are absent; no product bytes changed; focused
verification is green; Atlas and production Dock inventory are unchanged.

No Builder is authorized. The Router may draft G2 from the accepted G1 evidence
and send that draft to one fresh semantic Reader. G2 implementation remains
forbidden until that Reader returns `YES/YES` and this file is rotated to the
accepted G2 order. Nothing may merge to `main`, begin R18, or skip the Phase-2
group boundary without founder authority.
