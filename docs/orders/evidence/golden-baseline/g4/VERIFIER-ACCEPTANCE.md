# Golden Baseline Phase 2 — G4 Independent Verification

status: **SEMANTIC PASS / MECHANICAL CLOSE REPAIRED**
verified-at: 2026-08-26
final-candidate: `2d491f20a030b9ac0b476846535f2ecc71239af1`
verified-product-config-commit: `2f7ea77ebf3671e25a6c556b7afcd1c355877efe`
final-independent-verifier-task: `01a03fc3-6f33-7c51-a6f4-a1c92111310c`
first-independent-verifier-task: `01a03f9a-4c39-7502-af18-11aeb8e215c6`
repair-reader-task: `01a03fab-e8e3-7b62-bb2a-d728cbed87a3`

## Verdict

The first independent Verifier rejected candidate `564af3c096ac7ef64c39dfb3cfa19bc7964812a4` because the precreated native-TUI path retained a competing pre-dispatch route refusal. A fresh semantic Reader returned `YES/YES` for one bounded repair. Product commit `2f7ea77ebf3671e25a6c556b7afcd1c355877efe` removed that competing authority while preserving precreated identity, readiness, ownership, and existing-session handoff checks.

The final independent Verifier proved the repaired G4 semantics:

- parse and resolution retain arbitrary non-empty route metadata;
- `dispatchRuntimeRoute` is the sole production route-support/refusal authority on normal and precreated paths;
- `agentos` and an arbitrary unknown route produce the exact `UnsupportedRuntimeRouteError` before mutation or callbacks;
- `native_tui` and `host_acp` behavior remains supported;
- production Dock inventory, Dock admission/cleanup, Hermes launch policy, typecheck, and build remain green;
- Atlas is current and the ratchet reports HARD RED 0;
- the clean product commit carries the exact 98/98 Atlas falsifier receipt;
- tracked `tools/runtime-proof` is absent and no production AgentOS runtime/dependency survives.

The final Verifier reported two mechanical close defects only: a typecheck-created untracked fixture dependency directory and stale evidence counts/header. The Router removed the exact generated directory. Evidence-only commit `2d491f20a030b9ac0b476846535f2ecc71239af1` corrected those receipts without changing any product/config/source/test/gate byte. The final checkout is clean, equals origin, and has zero relevant processes or residue.

The Windows `package:verify: linux-only verification package command` red remains explicitly assigned to G12. It is not reported green and did not conceal a G4 regression: staged retained-package inspection and route/Dock non-regression completed independently.
