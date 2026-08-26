# Golden Baseline Phase 2 — G4 Acceptance

status: **CLOSED / ACCEPTED**
closed-at: 2026-08-26
group: G4 — AgentOS runtime fossil
accepted-candidate: `2d491f20a030b9ac0b476846535f2ecc71239af1`
product-config-candidate: `2f7ea77ebf3671e25a6c556b7afcd1c355877efe`
protected-main: `5882ab2febf00f2c15a94c868c191420ed561bb4`
reader-receipt: [G4-READER-ACCEPTANCE.md](G4-READER-ACCEPTANCE.md)
route-reader-receipt: [G4-ROUTE-TIMING-READER.md](G4-ROUTE-TIMING-READER.md)
verifier-receipt: [VERIFIER-ACCEPTANCE.md](VERIFIER-ACCEPTANCE.md)
builder-evidence: [AFTER.md](AFTER.md)
command-ledger: [MATRIX-AFTER.tsv](MATRIX-AFTER.tsv)

## What Ryan gains

QuantFlow no longer carries or executes the unsupported AgentOS guest runtime or its 28,317-file QA/toolchain fossil. Current Hermes, Claude, and qf-proof packages retain their package identities and supported native routes.

## What this closes

- `tools/runtime-proof` and qf-toolloop staging are absent from current tracked and generated product state.
- The app no longer imports or depends on `@rivet-dev/agentos-core`.
- Only `native_tui` and `host_acp` execute; retired and unknown routes fail through one exact post-resolution dispatcher before mutation.
- The precreated-session path uses that same authority while preserving identity, readiness, ownership, and handoff rules.
- Production Dock inventory, retained package staging, Hermes launch policy, typecheck, build, Atlas, and cleanup remain proved.
- Atlas remains current, fail-capable, and HARD RED 0.
- The inherited Windows package-verifier red remains honestly assigned to G12.

G4 is frozen. G5 may receive Reader-only authority. No G5 Builder opens before a fresh semantic Reader returns `YES/YES` and `NEXT.md` is rotated again.

`main` remains untouched. R18 remains frozen until G1–G12 and Phase 3 pass.
