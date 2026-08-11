# NEXT — R10 point-in-time datasets

status: R10 AUTHORIZED
authorized-by: founder
authorized-at: 2026-08-10
baseline: R0–R9 complete on `act-i-ladder`
route: [`GOLDEN-RUN.md`](GOLDEN-RUN.md) · R10

## Active outcome

A Dataset must be bound to real immutable bytes and an `as_of` time. QuantFlow
must reject registration when the declared hash does not match the bytes or when
the dataset contains observations from after its `as_of` fence.

## Boundary

Build R10 only. Keep Dataset truth in the Kernel and artifact storage; add no
second database or manifest store. Do not start backtest execution, metric
calculation, critic behavior, release packaging, R11–R14, or live betting/trading.
