# NEXT — R18 GOLDEN BASELINE HOLD / G5 READER ONLY

status: G4 CLOSED / G5 READER ONLY
rotated-at: 2026-08-26
rotated-by: Router after independent G4 semantic PASS and mechanical close repair
active-order: [WO-GOLDEN-G5](WO-GOLDEN-G5.md)
builder-authority: **NO — READER ONLY**
program-decision: [ADR-0004](../adr/0004-repository-golden-baseline.md)
phase-1-audited-sha: `5882ab2febf00f2c15a94c868c191420ed561bb4`
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

G4 closed at `2d491f20a030b9ac0b476846535f2ecc71239af1`. G5 is open only for one fresh semantic Reader to adjudicate saved-state compatibility, current openers/restore/package consumers, host-ACP support, and dependency reachability. Mechanical same-meaning harness repairs use the Golden fast path; compatibility, runtime support, product behavior, scope/order, or PASS-meaning changes require semantic Reader adjudication.

No G5 Builder, G6 authority, main merge, full G9, or R18 implementation is open. `NEXT.md` rotates again only after the G5 Reader returns `YES/YES` and its defects are landed in the order.
