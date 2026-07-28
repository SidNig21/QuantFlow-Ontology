# WO-V1 — final verification (PASS)

> **In plain terms:** notes in Obsidian can now be regenerated from the ledger without
> ever writing back to it; older ledgers skip missing tables instead of crashing; and
> the cold gate board is green.

| | |
|---|---|
| Tip | `eaa5fa6` (allowlist fix `5408f71` + evidence) |
| Verdict | **PASS** |
| Cold board | `/tmp/verify-V1-r2v` @ `eaa5fa6` → **`GATE_RUNNER_EXIT=0`** (22 PASS) |
| Thermo | PASS — [review](95744dfd-b55b-4c1b-aab8-96ec6a3db407); no merge blockers |

## Re-derived

- **kernel-one-path bait:** remove vault `gate.ts` allowlist → red on `kernel.db` literal;
  restore → green (`RED_EXIT=1` / `GREEN_EXIT=0`).
- Round 1 substance already re-derived in
  [`VERIFICATION-ROUND-2.md`](VERIFICATION-ROUND-2.md) (skip bait; 5 hash-matched bodies).

## Carry-forward (not a fail)

Thermo F1: relocate `tools/qf-vault-projection/src/gate.ts` under `qa/gates/vault-projection/`
before the next vault WO — deletes the tools→qa import and shrinks Law E / one-path
allowlist sprawl on `tools/`. `gate.ts` is 826 lines (under 1k); do not grow it further
in place.
