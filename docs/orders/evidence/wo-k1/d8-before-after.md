# WO-K1 D8 — pins and args before/after (2026-07-27)

## BEFORE

| File | QF_KERNEL_DB pin | args server path |
|---|---|---|
| `~/.hermes/config.yaml` | `~/.collaborator/dev/worktree-ada48d49dc49/kernel.db` | `/home/sidnig21/QuantFlow-Ontology/tools/qf-read-tools/src/server.ts` |
| `~/.hermes/profiles/qf-orchestrator/config.yaml` | `~/.qf-peer-bus/kernel.db` | `/tmp/claude-1000/…/scratchpad/scope-w2/tools/qf-peer-bus/src/server.ts` (MISSING) |
| `~/.hermes/profiles/qf-worker/config.yaml` | `~/.qf-peer-bus/kernel.db` | same scratchpad (MISSING) |
| `~/.hermes/profiles/qf-worker-2/config.yaml` | `~/.qf-peer-bus/kernel.db` | same scratchpad (MISSING) |

## AFTER (`bun run setup-seats` from `qf-worktrees/wo-k1`)

| File | QF_KERNEL_DB pin | args server path |
|---|---|---|
| `~/.hermes/config.yaml` | **removed** | unchanged (real checkout) |
| `~/.hermes/profiles/qf-orchestrator/config.yaml` | **removed** | `/home/sidnig21/qf-worktrees/wo-k1/tools/qf-peer-bus/src/server.ts` |
| `~/.hermes/profiles/qf-worker/config.yaml` | **removed** | same worktree server.ts |
| `~/.hermes/profiles/qf-worker-2/config.yaml` | **removed** | same worktree server.ts |

`hermes -p <profile> mcp test qf-peer-bus` → Connected, 3 tools, for all three profiles.

Generator no longer emits `QF_KERNEL_DB`. `QF_PEER_BUS_DB` retained. `SERVER_TS` must resolve inside a git work tree.
