# How QuantFlow runs

> Generated from `atlas-generator @ 298e9ed` on 2026-08-17 by
> `qf-atlas/generate.mjs`. **A projection of the code** — not Kernel truth, not the
> running app, not a place to store anything. The Kernel still owns Missions, Tasks,
> Runs, Artifacts and Evaluations. Do not hand-edit; run the generator.

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
| `write-door` | reaches `execute()`, the sole sanctioned mutation path | 9 |
| `cheats` | reaches SQL that never passes through `execute()` | 4 |
| `writes-disk` | writes a file; never reaches the Kernel at all | 9 |
| `read-only` | mutates nothing | 106 |

## The jobs an operator actually does

6 of 8 loops are healthy.
A loop is only as good as its worst wire. **The loop names are authored product intent;
every status below is derived from the code.**

**What green does not mean.** A healthy loop proves the wiring exists and is governed —
the channel is reachable, a handler answers it, and it reaches `execute()`. It does not
prove the job produces the right outcome. *Assign* is green because the IPC path is
intact; nothing here checks whether the human path actually notifies the seat, which is
where it has failed before. Read the score as **"the plumbing is connected"**, not
**"the product works"**. Behaviour is what gates and rungs are for.

| Loop | Health | What it is |
|---|---|---|
| **Ask a research question** | ✅ ok | The front door. A founder question becomes a Mission and a Task for the Research Director. |
| **Create a Task** | ✅ ok | A Task is written to the Kernel and shown on the canvas. |
| **Assign and reassign** | ✅ ok | Move a Task to a seat. The agent path notifies the seat; the human path is where delivery has failed before. |
| **Spawn a seat** | ✅ ok | Start a runtime the operator can watch: a PTY, then an agent session on top of it. |
| **Steer and cancel** | ✅ ok | Interrupt work in flight without losing the record of it. |
| **Review and publish** | 🔴 **broken** 4/4 | The governed critic path. R15 shipped on this, and R16 renders it. |
| **Show the research world** | ✅ ok | Everything R16 must reveal on the canvas: the ledger, the task surface, artifacts, events and cables. |
| **Close the app** | 🟠 degraded 4/6 | Quit must stop every worker it started. This loop is made of lifetime wires, not IPC. |

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

## What to remove

Three buckets, because they call for three different actions. **Do not treat these as
one list.**

### Broken now — fix or remove (0)

_these fail at runtime today_

None.

### Safe leftover — delete (5)

_registered in main, unreachable from anywhere_

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

**9 in product code**, 8 in QA harnesses (a gate seeding its own fixture is expected).

| File | Statements |
|---|---:|
| `collab-electron/src/main/kernel.ts` | 6+ |
| `packages/qf-kernel/src/governed-review.ts` | 6+ |
| `packages/qf-kernel/src/deterministic-execution.ts` | 4 |
| `tools/qf-peer-bus/src/bus.ts` | 4 |
| `collab-electron/src/main/peer-delivery.ts` | 2 |
| `packages/qf-kernel/src/fixtures.ts` | 2 |
| `packages/qf-kernel/src/market-context.ts` | 2 |
| `packages/qf-kernel/src/market-ingest.ts` | 2 |
| `packages/qf-kernel/src/links.ts` | 1 |

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
**The map cannot lie for longer than one commit.**
