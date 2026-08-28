# Final G9 repair Builder report

The G9 repair now has a frozen, runnable candidate for an independent Verifier; one real packaged-app shutdown survivor remains explicitly assigned to G12.

## Immutable identities

| item | value |
| --- | --- |
| authorized parent | `10aedeb438214dd641e4293b139d5f4d93566a2c` |
| authorized parent Git tree | `38b650b1c0e7850eae2ea5e66a6634bbe2e2f00d` |
| product candidate | `8cc5cd824f11f244f63dd65f5c3f8757acc6ee91` |
| product candidate Git tree | `76d0947a8a35f78b213f4d74487fb399c9ef9eb2` |
| preceding evidence commit | `4dedba86` (full SHA is recorded by the final Git receipt) |

The candidate commit contains exactly 17 changed paths: the bounded G9
semantic/production/gate surfaces and regenerated Atlas projections. It does
not contain evidence receipts, shutdown changes, G10 work, or unrelated
groups.

## What is delivered

The candidate binds completion to the exact frozen worker `result_artifact_id`
and Run identity, rejects a wrong artifact before the completion write, uses
the actual Electron `qf.research.run_kernel_falsifiers` executor with the
exact stale-agent error, routes F02/F14 through the production finalizer, and
preserves the complete F12 five-field partition and deterministic winner.

The focused semantic proof matrix is green. See
`FINAL-REPAIR-BUILDER-MATRIX.md` for commands and counts, and
`FINAL-REPAIR-BUILDER-CHANGED-MANIFEST.md` for every committed blob digest.

## Explicit G12 boundary

The final executable gate reached the required falsifier receipts but remained
red at shutdown. The one census recorded:

- launcher PID `30512`: exited with code `0`;
- packaged `QuantFlow.exe` PID `17316`: still alive, parent `30512`;
- descendant Node PIDs `30836`, `20836`, and `30096`: still alive;
- temp roots: `roots_remaining=0`, `leaked=[]`.

Therefore this is a genuine packaged process survivor, not stale child-event
observation. Shutdown was not repaired. G12 owns the red; it is outside the
bounded G9 semantic candidate.

## Judgment and handoff

The order was silent on whether a proven out-of-group red should block freezing
the bounded semantic candidate. Standing Golden throughput authority resolves
that in favor of freezing the candidate while preserving the red exactly. The
independent Verifier must decide G9 acceptance; this Builder does not mark it
accepted. The candidate is ready for that review, with G12 remaining open.
