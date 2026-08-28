# G9 repair evidence-head final receipt

Plain language: this final receipt points to the already frozen repair evidence without pretending to hash itself before it exists.

scope: `WO-GOLDEN-G9`
product-candidate: `2167a5e6085095c12d4b844987f3ceaeaa78a135`
product-tree: `15bbd9e3bcba80c4b35e6f32722dd9afc6390ab5`
candidate-parent: `314616a16b7ffc84ca4025ed4e958a3db0e1f4d4`
candidate-parent-tree: `5744136e2fa5813c0c81a00a48dd9baf675da2c3`
read-only-evidence-authority: `f7e841ff3e075bd49ed70bf8da79c2409ca5c899`
read-only-evidence-tree: `69ffb780e692ae5cdbd532bbc3dba5b6b4006e6f`

## Immutable evidence body

The report, starting manifest, and starting matrix are the receipt-only
evidence body at:

- evidence-body head: `628fb4372ed35c55118b80fd1181a4bc99fa11cb`
- evidence-body tree: `4b4e4d8c7fc3d85b88480f71d8ba2ffbc59a9b7b`
- candidate-to-body changed paths: exactly the three files named below

| evidence-body path | SHA-256 of exact Git-tree blob bytes |
| --- | --- |
| `docs/orders/evidence/golden-baseline/g9/REPAIR-BUILDER-REPORT.md` | `5cd1110fcc17685d78d098bab451d6f4b0c1247e646ca75d3106a2a206a7275f` |
| `docs/orders/evidence/golden-baseline/g9/REPAIR-BUILDER-STARTING-MANIFEST.md` | `39b4f845729f0c13a5244443d0e7e8acd7a9f9872d1bbb211620bc9f3a213441` |
| `docs/orders/evidence/golden-baseline/g9/REPAIR-BUILDER-STARTING-MATRIX.md` | `a9451dc0ace493514ff2a9d4dac79010e7a25494abc9db1fce821753ed3ebf73` |

Hash command basis: `git ls-tree` plus `git cat-file blob` at the evidence
body head, then SHA-256 over the returned bytes. No checkout-byte hash is
used.

## Self-binding strategy

This file is a later receipt-only append. It records the evidence-body head
above; it does not claim that its own blob is contained in that earlier tree.
That separation is intentional and avoids a circular claim about the final
receipt's own hash. The current append is receipt-only and does not alter the
product candidate, its Atlas projections, or the evidence body it records.

The independent Verifier should inspect the evidence-body head and this
append as separate immutable commits, then decide the repaired candidate.
