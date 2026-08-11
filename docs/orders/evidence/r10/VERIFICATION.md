# R10 — immutable point-in-time Datasets

Dataset registration now consumes an existing immutable `result_set` Artifact,
re-reads and hashes its durable bytes, validates the `qf.dataset.v1` observation
contract, and rejects any observation after the declared `as_of` time.

The Kernel gives the Dataset a stable identity distinct from the Artifact and
writes the Dataset-to-Artifact `derived_from` link itself. It also records the
verified record count and latest observation time in coverage.

Native Windows product proof:

```text
bun test src/r10-dataset-integrity.test.ts src/kernel.test.ts
34 pass, 0 fail

bunx tsc --noEmit
exit 0

bun test src/generate.test.ts
20 pass, 0 fail
```

The focused proof rejects a false hash, future observation, and post-publication
byte tampering before any Dataset or event is written.
