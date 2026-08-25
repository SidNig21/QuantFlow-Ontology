# G1 evidence adjudication

- BUILD_BASE_SHA: 57fc4ff711848bbb7f668f608e7478d407dc14f4
- CANDIDATE_SHA: 767717760858c8a0dc77d61e95535faca3c316a0
- The deletion candidate is immutable. It is not amended or changed by this evidence head.
- This docs-only evidence head is separate from the deletion candidate.

## Comparator disposition

The failed prefix comparator is discarded scaffolding. It expected truncated log prefixes such as 01- instead of the full allowed filenames; it is not committed and is not evidence.

The corrected read-only comparison used the full literal filenames from the order and passed:

- candidate diff rows: 36
- expected rows: 36
- unexpected rows: 0
- missing rows: 0

The candidate diff rows are only:

1. the 14 exact tracked deletions in the order; and
2. docs/orders/evidence/golden-baseline/g1/BEFORE.md plus logs/01-preflight.log through logs/21-direct-absence.log.

No product/source file, deletion target outside the denominator, or post-candidate evidence file is in the candidate diff. The complete raw receipt is logs/22-allowed-diff.log.

## Separate evidence head

The post-candidate receipts logs/22-allowed-diff.log through logs/25-process-zero.log, AFTER.md, COMMANDS.tsv, and this file are the only additions in this separate docs-only evidence head.

No product command was rerun after the prior acceptance matrix; commands 06 through 19 remain represented by their original durable logs.