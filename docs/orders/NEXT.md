# NEXT — R18 — GOLDEN BASELINE HOLD / PHASE 2 G1

status: G1 READER YES/YES; BUILDER AUTHORIZED
rotated-at: 2026-08-24
rotated-by: Router under founder Golden-Baseline disposition
active-order: [WO-GOLDEN-G1-R2](WO-GOLDEN-G1-R2.md)
builder-authority: YES — execute only WO-GOLDEN-G1-R2 on wo-golden-g1
program-decision: [ADR-0004](../adr/0004-repository-golden-baseline.md)
phase-1-audited-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
phase-1-independent-pass: `000BA6BE7DE6227FF850F61EE2DB35E3F72AB49DECAC670893F774ECB3E8CC38`
phase-2-active-group: G1 exact generated and local authority residue
order-candidate: `f0992b6`
order-content-sha256: `0A50A17E75869667B653188F4D9028689C15E068B4CEF906FED40266F9E2C4B1`
reader-receipt: [G1 semantic Reader YES/YES](evidence/golden-baseline/g1/READER-ACCEPTANCE.md)
reader-task: `01a036e6-9de8-7362-bbc6-cde1e77584aa`
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

G1 is the only authorized non-rung order. The Builder first pulls
`origin/wo-golden-g1`, requires a clean worktree, records that exact HEAD as
BUILD_BASE_SHA, and verifies that `f0992b6` is its ancestor. It then executes
only `WO-GOLDEN-G1-R2.md`.

The Builder may remove only the 14 tracked and three ignored literal targets in
the order, add only its exact evidence allowlist, commit once, push, and stop.
It may not merge, rotate this file, begin G2, touch product code, or run R18.

After the immutable candidate exists, the Router creates a separate independent
Verifier task. Any red stops G1; no repair lap is pre-authorized.
