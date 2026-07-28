# WO-K2 builder report

**Plain language:** Pointing a tool at a typo no longer invents an empty database; programs
that only read get a handle that cannot write; and the test that guards the database door
can finally see the real front door — and still catch raw SQL on files that are allowed to
open.

Branch: `wo-k2` @ worktree `/home/sidnig21/qf-worktrees/wo-k2` (base `b5f2e9a`).
**Builder does not PASS.** Evidence only.

## 1. Census — file:line · role · opts · reason

| file:line | role | opts | reason |
|---|---|---|---|
| `tools/qf-read-tools/src/server.ts:30` | writer | neither | opens existing platform/path Kernel; actions via register→execute; must never create |
| `tools/qf-read-tools/src/register.ts` | write path only | n/a | no openKernel; execute only |
| `tools/qf-peer-bus/src/bus.ts:102` | writer | neither | opens existing; execute for publish; harness pre-creates |
| `tools/qf-peer-bus/scripts/setup-founder-seats.ts:220` | creator | `{ create: true }` | first file-backed create for seats |
| `species/hermes/register.ts:42` | writer | neither | opens existing CLI `--db` (exists check first) |
| `species/critic-mock/register.ts:36` | writer | neither | same |
| `species/hermes/host-admit-kernel.ts:50` | writer | `:memory:` | in-memory; create N/A |
| `species/hermes/a2a-4tile-smoke.ts:214` | writer | `:memory:` | in-memory |
| `qa/gates/{dock-registry,boot-reconcile,agent-path}/run.ts` | writer | `:memory:` | in-memory |
| `tools/qf-read-tools/src/harness.ts:281` | creator | `{ create: true }` | first create for tool-plane workdir |
| `tools/qf-read-tools/src/harness.ts:130,154,193,247` | writer | neither | reopen existing; seed/execute |
| `tools/qf-read-tools/src/harness.ts:222,265` | reader | `{ readonly: true }` | query-only event/status checks |
| `tools/qf-read-tools/src/gates/tool-discovery.ts:189` | creator | `{ create: true }` | first create before MCP child |
| `tools/qf-read-tools/src/gates/action-transport.ts:50` | creator | `{ create: true }` | create + execute seed |
| `tools/qf-read-tools/src/gates/action-transport.ts:75` | reader | `{ readonly: true }` | post-call query |
| `tools/qf-read-tools/src/gates/publish-artifact-root.ts:339` | creator | `{ create: true }` | first create |
| `tools/qf-read-tools/src/gates/publish-artifact-root.ts:113,136,226,269` | reader | `{ readonly: true }` | query-only before/after |
| `tools/qf-read-tools/src/gates/kernel-one-world.ts:32` | creator | `{ create: true, provenance }` | parent writer for G4 |
| `tools/qf-peer-bus/src/harness.ts:132` | creator | `{ create: true }` | **F10** pre-create before spawn |
| `tools/qf-peer-bus/src/harness.ts:186,274` | reader | `{ readonly: true }` | independent re-query |
| `packages/qf-kernel/src/busy-timeout.test.ts:21,76` | creator | `{ create: true }` | file-backed fixture setup |

Production `{ readonly: true }` openKernel sites remain **zero** (honest; WO-V1 brings projection readers).

## 2. G1 + G1b + Control 2

**Control 1** unmodified → exit 0.

**Control 2** temp `bun:sqlite`+`INSERT INTO` under `tools/_wo-k2-g1-bait/` → exit 1:
```
[driver/sql] tools/_wo-k2-g1-bait/control2-sql.ts (bun:sqlite)
```
Restore → exit 0; tree clean of bait.

**Bait A** `openKernel`+`execute` outside allowlists → exit 1:
```
[open] tools/_wo-k2-g1-bait/bait-a.ts (openKernel()
[write] tools/_wo-k2-g1-bait/bait-a.ts (execute-call)
```
Restore → exit 0.

**G1b** append real `execute(` to `tool-discovery.ts` (open✓ write✗) → exit 1:
```
[write] tools/qf-read-tools/src/gates/tool-discovery.ts (execute-call)
```
Restore → exit 0. Write claim only (no open claim).

## 3. G2 falsify (offender lines, not bare exit)

```
QF_KERNEL_SOLE_WRITER_FALSIFY_OPEN=1 → exit 1
  - [open] tools/_qf-k2-sole-writer-bait/falsify-open.ts (openKernel()

QF_KERNEL_SOLE_WRITER_FALSIFY_WRITE=1 → exit 1
  - [write] tools/_qf-k2-sole-writer-bait/falsify-write.ts (execute-call)
```
Unset → exit 0; bait dir removed; `git status` clean of bait.

## 4. G3 create fail-closed

Package tests (`bun test src/open-kernel-create.test.ts`): missing path throws
`KernelMissingFileError`, file absent; `{ create: true }` creates; `:memory:` ok;
`create`+`readonly` → `OpenKernelOptionsError`.

## 5. G3b production create ban

Bait `create: true` into `server.ts` → exit 1:
```
[create-ban] tools/qf-read-tools/src/server.ts (create: true forbidden on production opener)
```
Restore → exit 0. Grep: `server.ts`, `bus.ts`, `species/*/register.ts` have no `create:\s*true`.

## 6. G4 readonly cannot write

Same package test: create → close → reopen `{ readonly: true }` → `exec` INSERT and
`execute` throw; reopen without readonly → `create_hypothesis` succeeds.

## 7. Allowlists as shipped

Open and write allowlists match the order text exactly — **no silent additions**.
Driver/SQL allowlist unchanged (claim-scoped; `bus.ts` transport exemption stays
driver/SQL-only).

**D7 F1:** `INSERT INTO` planted on open-allowlisted `tool-discovery.ts` →
`[driver/sql] ... (INSERT INTO)` — open membership does not skip SQL.

## 8. Peer-bus F10 sequencing

`tools/qf-peer-bus/src/harness.ts` calls `openKernel(path, { create: true })` then
`closeKernel` **before** spawning bus children. `bus.ts` opens without `create`.
Harness run: exit 0 (round-trip + delivery falsify).

## 9. Builder-run gates (not cold `--all`)

All exit 0: `repo-shape`, `lockfile-committed`, `kernel-sole-writer`,
`kernel-sole-writer-app`, `no-canvas-domain-writes`, `doc-action-surface`, `one-skin`,
`kernel` (44 pass), `kernel-one-path`, `publish-artifact-root`, `tool-discovery`,
`action-transport`, `tool-plane`, peer-bus harness.

Full cold `bun qa/run.ts --all` / `GATE_RUNNER_EXIT=0` is **verifier** work per PROTOCOL
(cold-run-is-verifier-only).

## Judgment

- Query-only reopens classified **reader** with `{ readonly: true }` to exercise the API;
  writer-shaped reopen (neither flag) was also allowed by RULING 3 — I chose reader where
  the site never executes.
- G3b implemented as a fourth claim (`create-ban`) inside `kernel-sole-writer` rather than
  a separate gate file, so the bait path shares the same runner.
- `OpenKernelOptions` / errors exported from `qf-kernel` (`.`) only; portable untouched.
