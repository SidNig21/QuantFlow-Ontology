# R11b — hand-calculated metric correctness

Every deterministic execution result now contains a versioned `qf.metrics.v1`
payload. Its durable bytes state the definitions, eligible rows, missing-value
policy, denominator policy, and six-decimal half-up rounding rule.

The focused fixture was calculated independently by hand:

- profit: `+100 - 50 = 50`;
- stake: `100 + 50 + 50 = 200` (void excluded);
- ROI: `50 / 200 = 0.250000`;
- hit rate: `1 / (1 + 1) = 0.500000`; and
- per-row CLV: `0.25, 0, 0`, mean `0.083333`.

QuantFlow produced those exact values while also counting one push, one void,
and one selected row with missing settlement data.

Focused native-Windows proof:

```text
bun test src/r11b-metric-correctness.test.ts src/r11a-deterministic-execution.test.ts
5 pass, 0 fail, 29 expect() calls

bunx tsc --noEmit
exit 0
```

The negative proof supplied money as a JavaScript number instead of an exact
decimal string. QuantFlow refused it and created no Run or Run event rather
than silently accepting floating-point ambiguity.

This proves ROI, decisive-result hit rate, and closing-line value under the
recorded v1 definitions. It does not claim calibration, Monte Carlo bankroll
risk, critic independence, Report approval, betting, or trading.
