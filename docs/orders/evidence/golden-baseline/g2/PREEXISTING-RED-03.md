# G2 Matrix Item 3 — Pre-existing Red Adjudication

date: 2026-08-24
group: G2
assigned-owner: G8 — Kernel/schema and proof-integrity repair
starting-sha: 34ce9156cd6da2a54b4fdb39fb9074ed2df0b6bd
command: bun qa/run.ts kernel-market-lineage
exit: 1
log: logs/21-matrix-03-kernel-market-lineage.txt
log-sha256: A0F354EF168BABEA467A740789B8ADE86F02ACED867A2C9ADC7AFE6FA9BA76F0
classification: pre-existing proof-integrity defect, outside G2 semantic ownership

## Exact red

The gate fails before its market-lineage assertions because its
record_evaluation input supplies findings as a string while the current
canonical schema requires a non-empty ordered array.

Fingerprint:

- code: invalid_type
- path: findings
- expected: array
- received: string

## Starting-SHA non-regression proof

The complete relevant path is unchanged from the frozen G2 starting SHA:

- relevant tree diff exit: 0
- qa/gates/kernel-market-lineage.ts:
  d9bb667464479960d4d76be906af4c73d5fd54fb
- packages/qf-kernel/src/create.ts:
  abd3b7d6d81579fbee639e407333feb9238cd66e
- packages/qf-kernel/src/governed-review.ts:
  69b4836d00d0898c81087f952bbacac9c9b6a873
- qf-kernel-schema/src/ontology/research.ts:
  6fbf9c86f4b02454d9a94b3964fe6bddd905922f
- qa/run.ts:
  e4ae7013cd29893199d8f343505a686fc0532880

For every listed file, the starting-SHA blob equals the working-tree blob.
package/lock inputs and the full qf-kernel/qf-kernel-schema trees also have no
diff from the starting SHA. No G2 target or proof edit intersects this execution
path.

The baseline source itself contains the contradiction: the gate sends a string
at its findings field while the same starting SHA declares findings as an array.

## Disposition

Per ADR-0004 section 9, G2 does not absorb this defect. G8 owns the gate/schema
proof-integrity repair. G2 non-regression for this item is the exact relevant-
byte equality plus reproduction of this exact fingerprint. A different failure,
a changed relevant blob, or a green caused by bypass remains red for G2.

This receipt does not declare kernel-market-lineage healthy and may not be used
as a Phase-3 green. G8 and mandatory Phase 3 must make the current gate execute
its real lineage assertions and pass.