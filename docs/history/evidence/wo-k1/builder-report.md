# WO-K1 builder report

See chat report for the plain-language open and full gate transcripts.
This file holds the durable receipts the order asked for.

## G1 bait

```
kernel-one-path G1: offenders outside allowlist:
  - tools/qf-read-tools/src/_bait_env_read.ts (process.env.QF_KERNEL_DB read)
  - tools/qf-read-tools/src/_bait_kernel_path.ts (kernel.db path construction/literal)
FAIL  kernel-one-path
GATE_RUNNER_EXIT=1
```

Restore → `PASS  kernel-one-path` / `GATE_RUNNER_EXIT=0` / `git status` clean of bait files.

## G2 control

```
G2 control: codes [ 0, 2 ] stderr locked evt-b: database is locked
```

Passing run: both writers exit 0 with `busy_timeout = 5000`.

## G4 child receipt (from inside the child)

```
kernel: path=/tmp/qf-g4-home-…/.quantflow/kernel.db provenance=default journal=wal sync=1 QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY=1 schema_meta=63
```

`provenance=default` ⇒ no `QF_KERNEL_DB` reached the child. Path is under the sandboxed `HOME`.

## Timing (WAL + synchronous=FULL)

- create: 9915 ms
- per write: 103.9 ms

(RULING 2 table row 2 on this machine was 8287 / 87.5 — same order of magnitude; FULL durability retained.)

## D8

See `d8-before-after.md`. All three peer-bus seats: `hermes mcp test` Connected, 3 tools.
