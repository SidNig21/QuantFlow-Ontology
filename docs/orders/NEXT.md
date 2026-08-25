# NEXT — R18 — GOLDEN BASELINE HOLD / PHASE 2 G2

status: G2 REWRITE 2 AUTHORIZED / BUILDER RESUME
rotated-at: 2026-08-24
rotated-by: Router under founder Golden-Baseline disposition
active-order: [WO-GOLDEN-G2](WO-GOLDEN-G2.md)
builder-authority: YES — same Builder resumes preserved G2 diff under accepted Rewrite 2 Outcome A
program-decision: [ADR-0004](../adr/0004-repository-golden-baseline.md)
phase-1-audited-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase-1-independent-pass: `000BA6BE7DE6227FF850F61EE2DB35E3F72AB49DECAC670893F774ECB3E8CC38`
phase-2-active-group: G2 — unbuilt and superseded residue
order-candidate: `4ce2fd021b4a821d597cf91d1542c63c30a8517b`
order-content-sha256: `763DA8ECDCB8DD2245E038A49D579C7E45088A625FE1CE8181BC4B39F9D651C2`
reader-receipt: [G2 initial semantic Reader YES/YES](evidence/golden-baseline/g2/READER-ACCEPTANCE.md)
amendment-reader: [G2 Rework 1 Reader YES/YES](evidence/golden-baseline/g2/REWORK-1-READER-ACCEPTANCE.md)
rewrite-2-reader: [G2 Rewrite 2 Outcome A YES/YES](evidence/golden-baseline/g2/REWRITE-2-READER-ACCEPTANCE.md)
rewrite-2-reader-task: 01a0377a-970f-7c41-88be-bc76ac949cfe
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

The fresh Rewrite 2 Reader proved Outcome A from accepted authority and source:
front-door completion guarantees exactly one Director while later worker
recruitment is genuinely asynchronous. The same Builder may now replace only
the race-prone total count with the accepted finite per-role/link topology,
retain the green cleanup correction, rerun focused item 2 once, and proceed to
the full matrix only if green. Nothing may merge to main, begin R18, absorb G3+,
or skip the Phase-2 group boundary.
