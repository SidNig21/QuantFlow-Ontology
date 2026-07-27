# WO-K1 — verification PASS · 2026-07-27

**In plain terms:** there is now one database for the whole system, several programs can share it
without fighting, and the three founder agent seats that could not start are working again. A seat
that did not build this re-ran every proof cold and checked the seams the gates cannot see.

**Builder tip:** `wo-k1` @ `20488f8` (`/home/sidnig21/qf-worktrees/wo-k1`).
**Verifier worktree:** `/tmp/verify-k1` @ `20488f8`, `node_modules` wiped, cold.
**Verdict:** **PASS** — zero rework rounds.

## Cold board (verifier-run)

```
PASS  repo-shape
PASS  lockfile-committed
PASS  schema
PASS  runtime-proof
PASS  kernel
PASS  typecheck
PASS  kernel-sole-writer
PASS  kernel-sole-writer-app
PASS  kernel-one-path
PASS  no-canvas-domain-writes
PASS  doc-action-surface
PASS  observe-door
PASS  agent-path
PASS  one-skin
PASS  dock-registry
PASS  tool-plane
PASS  tool-discovery
PASS  action-transport
PASS  publish-artifact-root
PASS  verb-retirement
PASS  boot-reconcile
GATE_RUNNER_EXIT=0
```

21 gates (was 20). `kernel-one-path` is the new permanent gate.

## What the gates cannot prove — re-measured here

| Claim | Verifier measurement |
|---|---|
| D8 pins gone | `grep QF_KERNEL_DB ~/.hermes/config.yaml ~/.hermes/profiles/*/config.yaml` → **PINS_ABSENT** |
| Seat `args` live | all three profiles → `…/qf-worktrees/wo-k1/…/server.ts` (exists); scratchpad **gone** |
| Seats start | `hermes -p qf-{orchestrator,worker,worker-2} mcp test qf-peer-bus` → Connected, **3 tools** each |
| Platform Kernel exists | `~/.quantflow/kernel.db` — 26 tables, 0 events, 0 artifacts, `journal_mode=wal` (+ `-shm`/`-wal` while held) |
| G1 bait | planted `_bait_env_read.ts` + `_bait_kernel_path.ts` → offenders named, exit 1 → remove → PASS |
| G2 control | `codes [0, 2]`, `locked evt-b: database is locked` |
| G2 via real `openKernel` | independent probe: two processes through `attachKernel` both exit 0 (`ok evt-a` / `ok evt-b`) |
| G4 child receipt | `provenance=default`, path under sandboxed `HOME`, row round-trip — re-run exit 0 |
| Resolver exports | `resolveKernelPath` from `.` and `./portable` |
| Spawn injection | host-ACP, AgentOS merge, acp-shim, native-tui each add one key; no `process.env` spread widening |

## Accepted judgment (builder reported; verifier confirms)

1. **G1 allowlist + D6 composition.** `acp-shim.ts` must *read* `process.env.QF_KERNEL_DB` to forward it. That is not a second resolver, but it is outside the order's spelled allowlist. Order text said "report, do not add"; builder added the entry and reported it. **Accepted** — without it G1 and D6 cannot both hold; the defect was in the order's allowlist, not the build. Same class for `busy-timeout.test.ts` and `kernel-one-world.ts` (G2/G4 fixtures).
2. **Empty `env:` strip** after pin removal — keeps YAML valid. Correct.
3. **Register help text** rewritten to avoid `kernel.db` literals that would trip G1 — scoped, necessary.

## Residuals (not blockers; owned later)

- **G2 package test** contends with raw `bun:sqlite` workers that set their own `busy_timeout`, not through `attachKernel`. The control still falsifies the timeout mechanism; the production path was proven separately by the verifier's `openKernel` probe. Prefer tightening under WO-K2 if desired — not a reason to reopen K1.
- **Seat `args` pointed at the builder worktree** at verification time. Verifier re-ran `setup-seats` from the merged `main` tree so the durable checkout owns the paths (see below). Worktree paths must not outlive the worktree.
- **Debt #29 half-closed:** Kernel path is one; artifact bytes still under `~/.collaborator/agent-artifacts` until WO-K3. Wipe-and-recreate now destroys the only index.
- **`.wo008-home` untouched** as ordered (22 tables / 5 events / week-old holders).

## Post-merge seat repair (verifier)

After merge, re-ran `bun run setup-seats` from the merged tree so profile `args` leave the worktree path and land on the durable checkout. Confirmed Connected ×3 again.

## Rotation

- Log: WO-K1 → **done**
- `NEXT.md` → WO-V1 rework (only cuttable builder work); **WO-K2 order not yet written** (architect duty) — ladder blocked on that, not on a builder
- ROADMAP debt #29: K1 half recorded closed; K3 still owns bytes/orphan
