# WO-K2 — verification PASS · 2026-07-27

**In plain terms:** a wrong database path now refuses instead of inventing an empty world;
read-only opens cannot write; and the Law E gate can see the real front door without
losing its raw-SQL teeth.

**Builder tip:** `wo-k2` @ `c9c3bf0` (`/home/sidnig21/qf-worktrees/wo-k2`, base `b5f2e9a`).
**Verifier worktree:** `/tmp/verify-k2` @ `c9c3bf0`, `node_modules` wiped, cold.
**Verdict:** **PASS** — zero rework rounds.

## Cold board (verifier-run)

```
PASS  repo-shape … boot-reconcile  (21 gates)
PASS  kernel-sole-writer
PASS  kernel-one-path
GATE_RUNNER_EXIT=0
```

## Baits re-run here (not from the report)

| Gate | Verifier result |
|---|---|
| Control 1 | exit 0 |
| Control 2 raw SQL | `[driver/sql] … (bun:sqlite)` exit 1 → restore 0 |
| Bait A open+execute | `[open]` + `[write]` exit 1 → restore 0 |
| G1b open∩¬write | `[write]` only on tool-discovery exit 1 → restore 0 |
| Falsify OPEN / WRITE | offender lines via scanner; bait dir cleaned |
| G3b create on server.ts | `[create-ban]` exit 1 → restore 0 |
| D7 F1 INSERT on open-allowlisted file | `[driver/sql] … (INSERT INTO)` — open membership does not skip SQL |
| Package create/readonly tests | 6 pass (missing throw, create, memory, mutual exclusion, readonly write fail) |

## Seam inspection

- `openKernel` fail-closed before `new Database`; `KernelMissingFileError` / `OpenKernelOptionsError` named.
- Three allowlists independent — no whole-file skip on open/write membership.
- Production `server.ts` / `bus.ts` / species registers: no `create: true`.
- Peer-bus harness F10: `create: true` then close **before** spawn; bus opens without create.
- Query-only reopens as `{ readonly: true }` — accepted judgment (order allowed either shape).
- G3b as `create-ban` claim inside same gate — accepted; bait shares the runner.
- Allowlists match order text — no silent additions (verified by reading the gate file).

## Residuals

- Zero **production** readonly openers still (honest; WO-V1 brings projection readers).
- Debt #28 **closed**. WO-K3 may now be ordered (readonly carve-out API is live).

## Rotation

- Log: WO-K2 → **done**
- Debt #28 → closed
- `NEXT.md` → WO-V1 rework (only cuttable builder work until WO-K3 order is written)
