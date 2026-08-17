# How QuantFlow runs

> Generated from `atlas-generator @ e2f7658` on 2026-08-17 by
> `qf-atlas/generate.mjs`. **A projection of the code** — not Kernel truth, not the
> running app, not a place to store anything. The Kernel still owns Missions, Tasks,
> Runs, Artifacts and Evaluations. Do not hand-edit; run the generator.

## Where this repo stands

**51 of 51 findings have not been looked at.**

That is the number to drive to zero — not the number of findings. Some gaps cannot be
parsed without a compiler, and some debt is deliberate, so zero findings is not
reachable. Zero *unlooked-at* is. Record a verdict in `qf-atlas/decisions.json` and a
finding stops being undecided. Add debt and the number goes back up.

| Verdict | Count |
|---|---:|
| `undecided` | 51 |
| `repair` | 0 |
| `remove` | 0 |
| `keep` | 0 |
| `accepted` | 0 |

**Not all clear.** 51 findings still need a decision.

## The four hops

QuantFlow is an Electron research console. Every operator action crosses four hops,
and it can die or cheat at any one of them:

```
1 renderer      a window surface calls a bridge method       shellApi.createTask()
2 preload       the contextBridge forwards a named channel   ipcRenderer.invoke("qf:tasks:create")
3 main          a handler receives it                        ipcMain.handle("qf:tasks:create")
4 Kernel        the handler reaches the write door           execute(db, "create_task", …)
```

Hops 1–3 answer *can the work get there*. **Hop 4 answers whether it is governed**,
and it is the one that matters: `START_HERE §1` says the Kernel owns truth, so a
handler that mutates state without `execute()` is cheating even when it works.

| At hop 4 the handler… | | Count |
|---|---|---:|
| `write-door` | reaches `execute()`, the sole sanctioned mutation path | 15 |
| `cheats` | reaches SQL that never passes through `execute()` | 6 |
| `writes-disk` | writes a file; never reaches the Kernel at all | 9 |
| `unknown` | handler file not fully read; not claimed read-only | 0 |
| `read-only` | no mutation seen | 98 |

## The jobs an operator actually does

4 of 8 loops are healthy.
A loop is only as good as its worst wire. **The loop names are authored product intent;
every status below is derived from the code.**

**What loop health means.** A red loop means a channel on that job reaches SQL the hop-4
walker flags outside `execute()` — reachability, not severity. It does **not** mean the
job is four broken product features when four loops read unhealthy. Idempotent `CREATE TABLE`
on review bookkeeping tables can mark *Create a Task* or *Show the research world* as cheating
at the Kernel even when no domain table is written on that path. For severity, read the
confirmed-violations table below; for wiring, read the loop table.

**What green does not mean.** A healthy loop proves the wiring exists and reaches `execute()`
on every channel in the loop — not that the job produces the right outcome. Read the score as
**"the plumbing is connected"**, not **"the product works"**. Behaviour is what gates and rungs
are for.

| Loop | Health | What it is |
|---|---|---|
| **Ask a research question** | ✅ ok | The front door. A founder question becomes a Mission and a Task for the Research Director. |
| **Create a Task** | 🔴 **broken** 1/1 | A Task is written to the Kernel and shown on the canvas. |
| **Assign and reassign** | ✅ ok | Move a Task to a seat. The agent path notifies the seat; the human path is where delivery has failed before. |
| **Spawn a seat** | ✅ ok | Start a runtime the operator can watch: a PTY, then an agent session on top of it. |
| **Steer and cancel** | ✅ ok | Interrupt work in flight without losing the record of it. |
| **Review and publish** | 🔴 **broken** 4/4 | The governed critic path. R15 shipped on this, and R16 renders it. |
| **Show the research world** | 🟠 degraded 1/6 | Everything R16 must reveal on the canvas: the ledger, the task surface, artifacts, events and cables. |
| **Close the app** | 🟠 degraded 4/6 | Quit must stop every worker it started. This loop is made of lifetime wires, not IPC. |

### 🔴 Create a Task

A Task is written to the Kernel and shown on the canvas.

- `qf:tasks:create` — **cheats**
  - breaks at **kernel**: raw SQL via ensureGovernedReviewSchema (packages/qf-kernel/src/governed-review.ts)

### 🔴 Review and publish

The governed critic path. R15 shipped on this, and R16 renders it.

- `qf:review:request` — **cheats**
  - breaks at **kernel**: raw SQL via markGovernedDelivery (packages/qf-kernel/src/governed-review.ts)
- `qf:review:revision` — **cheats**
  - breaks at **kernel**: raw SQL via ensureGovernedReviewSchema (packages/qf-kernel/src/governed-review.ts)
- `qf:review:secondCritic` — **cheats**
  - breaks at **kernel**: raw SQL via markGovernedDelivery (packages/qf-kernel/src/governed-review.ts)
- `qf:review:projection` — **unused**, and cheats at the Kernel
  - breaks at **renderer**: getGovernedReviewProjection()
  - breaks at **kernel**: raw SQL via ensureGovernedReviewSchema (packages/qf-kernel/src/governed-review.ts)

### 🟠 Show the research world

Everything R16 must reveal on the canvas: the ledger, the task surface, artifacts, events and cables.

- `qf:tasks:surface` — **cheats**
  - breaks at **kernel**: raw SQL via ensureGovernedReviewSchema (packages/qf-kernel/src/governed-review.ts)

### 🟠 Close the app

Quit must stop every worker it started. This loop is made of lifetime wires, not IPC.

- `acp-agent.ts` — **unreaped**
  - breaks at **quit**: collab-electron/src/main/index.ts never stops it
  - This module starts 1 process and the quit path never stops it. A closed seat can outlive the app.
- `sidecar/server.ts` — **unreaped**
  - breaks at **quit**: collab-electron/src/main/index.ts never stops it
  - This module starts 1 process and the quit path never stops it. A closed seat can outlive the app.
- `tmux.ts` — **unreaped**
  - breaks at **quit**: collab-electron/src/main/index.ts never stops it
  - This module starts 1 process and the quit path never stops it. A closed seat can outlive the app.
- `pty.ts` — **partial**
  - Stopped by setShuttingDown, killAllAndWait, but shutdownSidecarIfIdle is conditional — that resource survives a close while busy.

## What is actually part of the product

Every other section describes what a file *does*. This one asks whether the file is
still yours. Imports are walked from the app's real entrypoints — main, both preloads,
and each window's own script — so this is a file-level graph, not a call graph.

| | Files | Meaning |
|---|---:|---|
| `entrypoint` | 15 | the app starts here |
| `reachable` | 148 | imported from an entrypoint |
| `process-entry` | 3 | launched by path, not imported (workers) |
| `package-entry` | 1 | named in a workspace package's exports |
| `test-only` | 0 | reached only from tests |
| **`unreachable`** | **9** | **nothing imports it — start here** |

### Unreachable (9)

Nothing in the product imports these. That is evidence, not a verdict: check package
inclusion and dynamic loading before deleting anything.

- `collab-electron/src/main/sidecar/entry.ts`
- `collab-electron/src/main/sidecar/log.ts`
- `collab-electron/src/main/sidecar/ring-buffer.ts`
- `collab-electron/src/main/sidecar/server.ts`
- `collab-electron/src/windows/shared/flow-cube/cube3d.js`
- `packages/qf-kernel/src/db-bun.ts`
- `packages/qf-kernel/src/fixtures.ts`
- `packages/qf-kernel/src/insert.ts`
- `packages/qf-kernel/src/task-governance.ts`

Launched by path rather than imported, so "nobody imports it" is expected:
`git-replay-worker.ts`, `image-worker.ts`, `watcher-worker.ts`.

## What to remove

Three buckets, because they call for three different actions. **Do not treat these as
one list.**

### Broken now — fix or remove (0)

_these fail at runtime today_

None.

### Removal candidate — static evidence only (5)

_registered in main, no static caller found; needs package + dynamic-caller proof before deletion_

- `app:commit-sha` — collab-electron/src/main/ipc-workspace.ts:236
- `pty:foreground-process` — collab-electron/src/main/index.ts:842
- `qf:a2a:dispatch` — collab-electron/src/main/ipc-kernel.ts:778
- `qf:a2a:setDelivery` — collab-electron/src/main/ipc-kernel.ts:815
- `qf:a2a:spawnSeats` — collab-electron/src/main/ipc-kernel.ts:753

### Maybe later — do NOT delete on sight (13)

_works end to end, but nothing calls it yet_

> `qf:review:projection` is in this bucket and is exactly what R16 needs to render
> the Evaluation tile. Deleting this bucket wholesale would remove the next rung.

- `agentKill() → agent:kill` — collab-electron/src/preload/universal.ts:695
- `openFolder() → dialog:open-folder` — collab-electron/src/preload/universal.ts:454
- `openImageDialog() → dialog:open-image` — collab-electron/src/preload/universal.ts:317
- `countFiles() → fs:count-files` — collab-electron/src/preload/universal.ts:270
- `getHomePath() → get-home-path` — collab-electron/src/preload/shell.ts:311
- `deleteConnectionsForTile() → qf:connections:deleteForTile` — collab-electron/src/preload/shell.ts:122
- `getGovernedReviewProjection() → qf:review:projection` — collab-electron/src/preload/shell.ts:85
- `permissionDecision() → qf:sessions:permissionDecision` — collab-electron/src/preload/universal.ts:167
- `openSettings() → settings:open` — collab-electron/src/preload/shell.ts:212
- `openExternal() → shell:open-external` — collab-electron/src/preload/shell.ts:305
- `runInTerminal() → viewer:run-in-terminal` — collab-electron/src/preload/universal.ts:290
- `workspaceRemove() → workspace:remove` — collab-electron/src/preload/shell.ts:256
- `updateFrontmatter() → workspace:update-frontmatter` — collab-electron/src/preload/universal.ts:326

## Write-door violations

The declared write door is `execute.ts`, `create.ts`, `insert.ts`, `events.ts`,
`db.ts`, `upgrade.ts`, plus generated schema SQL. Any other file holding SQL appears
here automatically, so a new one cannot arrive quietly.

The question is not "does this file contain INSERT". It is **can production domain
state reach this SQL without first entering a governed action?** Domain tables come
from the generated schema; reachability follows call sites and the Kernel command table.

**15 confirmed**, 3 unknown (gray — not counted as debt).

| File | Table | Verb | Kind | Reach | Confidence |
|---|---|---|---|---|---|
| `packages/qf-kernel/src/governed-review.ts` | `links` | INSERT INTO | domain-truth | bypass | high |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_attempt` | CREATE TABLE | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_attempt` | INSERT INTO | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_invocation` | CREATE TABLE | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_invocation` | INSERT INTO | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_publication` | CREATE TABLE | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_receipt` | CREATE TABLE | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_receipt` | INSERT INTO | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_source_work` | CREATE TABLE | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_source_work` | INSERT INTO | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_task` | CREATE TABLE | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_task` | INSERT INTO | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `qf_review_task` | UPDATE | non-domain-store | bypass | medium |
| `packages/qf-kernel/src/governed-review.ts` | `task` | INSERT INTO | domain-truth | bypass | high |
| `packages/qf-kernel/src/governed-review.ts` | `task` | UPDATE | domain-truth | bypass | high |

### Before you edit these

Everything that imports the file, directly or transitively. This is what breaks if the
change is wrong.

`packages/qf-kernel/src/governed-review.ts` — **14 files depend on it**

```
  packages/qf-kernel/src/portable.ts
  packages/qf-kernel/src/create.ts
  collab-electron/src/main/kernel.ts
  packages/qf-kernel/src/execute.ts
  collab-electron/src/main/index.ts
  collab-electron/src/main/ipc.ts
  collab-electron/src/main/ontology-gateway.ts
  collab-electron/src/main/host-native-tui.ts
  collab-electron/src/main/agent-host.ts
  collab-electron/src/main/connections-ipc.ts
  …4 more
```

Deliberately **not** violations, and each was reported as one before the classifier
learned the difference: transport bookkeeping (tables created by the peer-bus DDL,
which are not in the golden schema),
Kernel command implementations dispatched by `execute()`, schema migrations,
generated SQL, and QA fixture seeding.

## What the analyzer could not read (27)

**Absence of a finding is not proof of compliance.** These files hold SQL the function
indexer could not resolve, so governance analysis never saw it. They are gray, and they
prevent a clean architectural result.

| File | Coverage | SQL in text | SQL resolved |
|---|---|---:|---:|
| `packages/qf-kernel/src/upgrade.ts` | partial | 1 | 3 |
| `tools/qf-peer-bus/src/bus.ts` | partial | 4 | 0 |
| `collab-electron/src/main/kernel.ts` | partial | 7 | 6 |
| `packages/qf-kernel/src/db.ts` | partial | 1 | 0 |
| `collab-electron/src/main/env.d.ts` | unindexed | 0 | 0 |
| `collab-electron/src/main/host-acp-bridge.ts` | unindexed | 0 | 0 |
| `collab-electron/src/main/peer-role-registry.ts` | unindexed | 0 | 0 |
| `collab-electron/src/main/qf-execute-allowlist.ts` | unindexed | 0 | 0 |
| `collab-electron/src/main/sidecar/client.ts` | unindexed | 0 | 0 |
| `collab-electron/src/main/sidecar/ring-buffer.ts` | unindexed | 0 | 0 |
| `collab-electron/src/main/updater/index.ts` | unindexed | 0 | 0 |
| `collab-electron/src/main/vite-raw.d.ts` | unindexed | 0 | 0 |
| `packages/qf-kernel/src/errors.ts` | unindexed | 0 | 0 |
| `packages/qf-kernel/src/index.ts` | unindexed | 0 | 0 |
| `packages/qf-kernel/src/portable.ts` | unindexed | 0 | 0 |
| …12 more | | | see `atlas.json` |

> `governed-review.ts` is in this table. The confirmed-violation count above is
> therefore a **floor**, not a total — it was computed from a partial read of the very
> file the finding concerns.

## Protocol variants (2)

Electron runs two protocols on one channel name: `ipcMain.on` receives
`ipcRenderer.send`, `ipcMain.handle` answers `ipcRenderer.invoke`. They do not
overwrite each other, so registering both is **not** duplicate ownership.

| Channel | Registered | Called via | Unused variant | Disposition |
|---|---|---|---|---|
| `pty:write` | invoke + send | send | invoke | **investigate** |
| `pty:send-raw-keys` | invoke + send | send | invoke | **investigate** |

`investigate` is not `delete`: a packaged or dynamically-loaded caller must be ruled
out before the unused variant can be removed.

## Process lifetime

"Close does not kill the worker" never looks like a missing handler, so it needs its
own kind of wire: **spawn → reap**. A module that starts a long-lived process and is
not stopped by the quit path leaves that process running after the app closes.

| Module | Long-lived spawns | Reaped by quit |
|---|---:|---|
| `acp-agent.ts` | 1 | **no** |
| `sidecar/server.ts` | 1 | **no** |
| `tmux.ts` | 1 | **no** |
| `pty.ts` | 2 | **partial** — pty.setShuttingDown(), pty.killAllAndWait(), pty.shutdownSidecarIfIdle() |
| `git-replay.ts` | 1 | yes |
| `watcher.ts` | 1 | yes |

- `acp-agent.ts` — This module starts 1 process and the quit path never stops it. A closed seat can outlive the app.
- `sidecar/server.ts` — This module starts 1 process and the quit path never stops it. A closed seat can outlive the app.
- `tmux.ts` — This module starts 1 process and the quit path never stops it. A closed seat can outlive the app.
- `pty.ts` — Stopped by setShuttingDown, killAllAndWait, but shutdownSidecarIfIdle is conditional — that resource survives a close while busy.

## Staying true

```bash
bun qf-atlas/generate.mjs           # rewrite the map from source
bun qf-atlas/generate.mjs --check   # exit 1 if the committed map is stale
```

`--check` compares a fingerprint of the model with `branch`, `commit` and
`generatedAt` excluded, so a plain commit does not trip it but moved code does.
**The map cannot drift from its generator for longer than one commit.** Generator
correctness is a separate question, protected by the falsifiers and by independent
verification. `--check` proves the outputs match the generator; it never proves the
generator is right — this branch shipped fingerprint-current outputs that were still
reporting a disproved violation count.
