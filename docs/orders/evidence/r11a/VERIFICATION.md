# R11a — deterministic execution

QuantFlow now has a real generated action, `qf_execute_deterministic_run`, that
executes a versioned declarative strategy against an immutable R10 Dataset.

The Kernel owns the execution version and records the complete manifest:
Dataset, strategy bytes, parameters, execution environment, and content-addressed
result Artifact. Two identical executions produced the same result bytes and
same Artifact id. Changing `limit` produced a different result hash.

Focused native-Windows proof:

```text
bun test src/r11a-deterministic-execution.test.ts
3 pass, 0 fail, 25 expect() calls

bun test src/market-ingest.test.ts src/r11a-deterministic-execution.test.ts
8 pass, 0 fail, 66 expect() calls

bun test
170 pass, 0 fail, 599 expect() calls

bunx tsc --noEmit
exit 0
```

The proof also deliberately falsified two claims before mutation:

- changed parameters presented as an identical repeat; and
- result bytes altered after their content hash was published.

Both were refused with no new Run or event. An existing R10 database was then
upgraded in place to the R11a action metadata and classified as current.

This does **not** claim that ROI, CLV, calibration, or any other metric is
correct. Metric definitions and hand-calculated correctness are R11b. It also
does not add a critic, publish a report, place a bet, or execute a trade.
