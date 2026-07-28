# WO-V1 — REWORK ROUND 2 build report

> **In plain terms:** the cold board was failing because a vault test file builds temporary
> database paths named `kernel.db`, and the one-path gate had never been told that file is
> allowed. One allowlist line fixes it. Round 1 substance was not touched.

| | |
|---|---|
| Branch | `wo-V1` |
| Round | REWORK ROUND 2 |
| Status | **awaiting independent verification** |

## Fix

Added `tools/qf-vault-projection/src/gate.ts` to `ALLOW_PREFIXES` in
`qa/gates/kernel-one-path.ts` (fixture gate constructing temp Kernel paths). Grep hit only
that file (`join(dir, "kernel.db")` at lines 122 and 715) — no other vault-projection paths
added. See `kernel-db-grep.txt`.

## Red → green

Transcript: `bait-kernel-one-path.txt`.

```
=== BREAK ===
kernel-one-path G1: offenders outside allowlist:
  - tools/qf-vault-projection/src/gate.ts (kernel.db path construction/literal)
FAIL  kernel-one-path
RED_EXIT=1

=== RESTORE ===
PASS  kernel-one-path
GREEN_EXIT=0
```

## Cold suite

Detached worktree `/tmp/verify-V1-r2` at the fix commit, zero root `node_modules`, unpiped.
Full board summary recorded in `cold-all.txt` / footer `GATE_RUNNER_EXIT=0`.

Round 1 skip / bodies / wikilinks not re-litigated.
