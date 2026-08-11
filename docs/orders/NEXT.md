# NEXT — R11a deterministic execution

status: R11a AUTHORIZED
authorized-by: founder
authorized-at: 2026-08-10
baseline: R0–R10 complete on `act-i-ladder`
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) · R11a

## Active outcome

The same strategy bytes, Dataset bytes, parameters, and execution version must
produce the same result bytes and result hash. The Kernel must preserve that full
input/output provenance and reject a claimed repeat whose result differs.

## Boundary

Build one deterministic local research execution path. Do not add distributed
execution, retries, metric correctness claims, critic behavior, release packaging,
R11b–R14, or live betting/trading.
