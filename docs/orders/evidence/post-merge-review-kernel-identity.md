# Post-merge review — Kernel identity and state locality

**Date:** 2026-07-27 · **Scope:** the Kernel as sole source of truth, not one work order
**Third seat:** `cursor-grok-4.5-high` (decorrelated — did not build or verify any of this)
**Re-measured by:** the architect seat, independently, every finding, each with a control

Run per `/thermo-review`. The review is **testimony**; everything recorded below was reproduced
here before it was written down. Where my re-measurement disagreed with the review, my number wins
and the disagreement is stated.

## Plain language first

The system keeps its records in one place and the files those records describe in another. Change
where you launch the app and the records move; the files do not. Separately, the rule that says
"only the Kernel may touch the database" is checked by a test that cannot see the Kernel's own
front door — so code can walk straight through it and the test stays green.

---

## How this review was run

```
cursor-agent --print --output-format text --model cursor-grok-4.5-high --trust --sandbox enabled
  "$(cat scratchpad/thermo-kernel-identity.md)"
```

The prompt named four already-confirmed facts and **forbade re-reporting them** (three Kernel files;
`COLLAB_DIR` = `sha256(cwd)[:12]`; `getKernelDbPath()` has zero callers; no sync code exists).
Everything below is outside that list.

**Recovery note.** The redirect returned 228 bytes — the model's final housekeeping message only.
The findings body was recovered from Cursor's own store at
`~/.cursor/chats/<hash>/<uuid>/store.db` (table `blobs`), copied to scratchpad before reading so no
live writer was touched. Recorded because this is the second time a `cursor-agent` run has looked
empty while holding a complete report.

---

## Finding 1 — Law E's gate cannot see the Kernel's own API · **HIGH** · CONFIRMED

`qa/gates/kernel-sole-writer.ts` states its property in its own docstring:

> only `packages/qf-kernel` may open SQLite or issue domain DDL/DML

It enforces this with `PATTERNS`, a list of seven regexes matching **driver import strings**
(`bun:sqlite`, `better-sqlite3`, `node:sqlite`) and **raw SQL keywords** (`CREATE TABLE`,
`INSERT INTO`, `UPDATE … SET`, `DELETE FROM`).

`openKernel` and `execute` appear in neither list. `openKernel` imports the driver on the caller's
behalf, so a caller never names it.

**Already false in the shipping tree.** Files outside `packages/qf-kernel` that open the Kernel:

```
tools/qf-read-tools/src/server.ts:32          tools/qf-read-tools/src/harness.ts (7x)
tools/qf-read-tools/src/gates/tool-discovery.ts   tools/qf-read-tools/src/gates/action-transport.ts
tools/qf-peer-bus/src/bus.ts                  tools/qf-peer-bus/src/harness.ts
tools/qf-peer-bus/scripts/setup-founder-seats.ts  species/hermes/host-admit-kernel.ts
```

Eight distinct files. The gate is green.

**Falsified with two controls** (both bait files written into `tools/thermo-bait/`, then removed;
`git status` clean after):

| | result |
|---|---|
| **Control 1** — unmodified tree | `ok=true`, 0 offenders — no confounder |
| **Control 2** — `bun:sqlite` + `INSERT INTO` | `ok=false`, caught `tools/thermo-bait/raw.ts (bun:sqlite)` — **the gate does work** |
| **Bait** — `openKernel(...)` + `execute(...)`, no driver string, no SQL keyword | **`ok=true`, 0 offenders — invisible** |

Control 2 is the load-bearing one. Without it, a green bait proves nothing — it could mean the gate
was broken. The gate is not broken. It is looking at the wrong surface.

**Second half of the finding:** the gate has **no bait / `QF_*_FALSIFY` path**, unlike
`dock-registry` and `agent-path`. The only occurrence of the word in the file is a comment about QA
fixtures. Under the falsification rule a gate with no durable red path is decoration.

**Failure scenario.** Add any file under `tools/` that does
`openKernel(process.env.QF_KERNEL_DB); execute(db, "observe_ticket", …)`. Domain rows change from
outside the Kernel package. `kernel-sole-writer` stays green; `kernel-sole-writer-app` never scans
`tools/`. Law E's named property is unproven, and has been since the wrapper API existed.

**Note, not alarm.** Calling `execute()` is the *sanctioned* write path, so a file doing so is not
automatically violating Law E's spirit. What is unambiguously violated is the docstring's own
weaker claim — *only `packages/qf-kernel` may open SQLite* — which is false today, eight times over.
The severity is that the gate cannot distinguish the two cases at all.

---

## Finding 2 — domain truth and the bytes it points at fork differently · **HIGH** · CONFIRMED

`COLLAB_DIR` (`collab-electron/src/main/paths.ts:24`) forks per launch directory. Nine subsystems
follow it: Kernel, canvas persistence, config, a2a bus, PTY logs, IPC sockets, terminals.

These do **not** follow it — they use `homedir()`/`$HOME` + `.collaborator` directly:

| Path | Written by |
|---|---|
| `~/.collaborator/agent-artifacts/` | `agent-host.ts:633` |
| `~/.collaborator/agentos-host-mounts.json` | `host-mounts.ts:42` |
| `~/.collaborator/socket-path` | `json-rpc-server.ts:20-21` |
| `~/.collaborator/canvas-plugin-offered` | `integrations.ts:138` |
| ACP message cache | `acp-agent.ts:37-42` |

`agent-host.ts:633` writes the artifact bytes to the **global** directory and then records that
absolute path as `storage_ref` in the **per-worktree** Kernel.

**Measured live:**

```
files in ~/.collaborator/agent-artifacts : 2
artifact rows in the app Kernel          : 0
```

Two files, no row pointing at either.

**Honest provenance:** I created this specific instance when I rebuilt both Kernels earlier today
(debt #27 remedy). That is the point, not a caveat — **the documented remedy for schema drift
orphans every artifact**, because `SCOPES.md:105` wipe-and-recreate destroys the index while the
bytes sit outside `COLLAB_DIR` and survive. Debt #27's fix and the storage layout disagree.

**Failure scenario.** Launch from `collab-electron/` → Kernel A. An agent turn publishes; Kernel A
points at `~/.collaborator/agent-artifacts/<id>.md`. Later launch from the repo root → Kernel B,
different hash: canvas, config and a2a are fresh and empty, but artifacts and host-mounts are still
the shared shelf. Remove worktree A and the rows are gone while the bytes remain, referenced by
nothing.

This is the WO-105 composition shape: per-worktree isolation is right, a stable artifact store is
right, and the pair splits truth from the bytes truth describes.

Smaller instance of the same class: `json-rpc-server.ts:20-21` writes `socket-path` to the bare
directory while the socket itself lives under `COLLAB_DIR`. Last writer wins for `collab-cli.mjs:9-10`.

---

## Finding 3 — a near-empty database silently skips migration · **MEDIUM** · CONFIRMED
*(sharpens debt #27 — new failure shape, not a re-report)*

Debt #27 records that `attachKernel` skips `migration.sql` when `schema_meta` **exists**. The
recorded instance was a *coherently obsolete* database: 19 real types, 19 real tables. This is
sharper — the guard trips on the table's **name alone**, with no content check.

**Measured, with control** (tmpfs, to avoid the 39 s fsync tax — same code path):

```
CONTROL  brand-new empty file      → after openKernel: 26 tables, artifact present
BAIT     file containing only
         CREATE TABLE schema_meta  → before: 1 table
                                     after openKernel: 2 tables, artifact ABSENT
                                     SELECT * FROM artifact → "no such table: artifact"
```

A database with one empty table named `schema_meta` and nothing else opens without error, reports
success, and every ontology read or write then fails at runtime.

**Failure scenario.** Any truncated, partially-restored, or canary database that happens to carry
that table name is accepted as an initialized Kernel. Gates cannot see it — they build fresh
databases from `migration.sql`, the same one-source-two-sides shape #27 already names.

**Also measured:** `openKernel` on a path whose parent directory does not exist throws
`SQLITE_CANTOPEN` (`db-bun.ts` does not `mkdir`; `openAppKernel` does, at `kernel.ts:54`). So tool
and MCP configs pointing at a missing directory **fail closed** — good — while the app path creates.

---

## Finding 4 — no lock timeout anywhere, and two writers is a supported configuration · **MEDIUM** · CONFIRMED

```
grep -rn "busy_timeout" --include=*.ts --include=*.mjs --include=*.sql .   → no matches
```

`packages/qf-kernel/src/db.ts:71` sets exactly one pragma, `foreign_keys = ON`. No `journal_mode`,
no `synchronous`, no `busy_timeout`. SQLite therefore runs at its defaults: rollback journal,
`synchronous = FULL`, **zero** busy timeout.

**Measured, with control:**

```
CONTROL  first writer BEGIN IMMEDIATE  → succeeds
BAIT     second writer BEGIN IMMEDIATE → "database is locked"   (immediate, no retry)
```

**Failure scenario.** Electron holds the app Kernel. `qf-read-tools` or `qf-peer-bus` is pointed at
the same file — easy, because nothing injects a Kernel path into agent environments (known finding
3, not re-litigated). The second writer fails instantly rather than waiting. Receipts diverge from
what the UI shows. Not theoretical once two read-write openers share a path, and
`tools/qf-read-tools/src/server.ts:32` opens read-write while serving only read tools.

---

## Finding 5 — creating a Kernel costs 39 seconds, and it is entirely fsync · **MEDIUM** · CONFIRMED

The review hit a 30 s timeout applying `migration.sql` to a file-backed database while the same SQL
succeeded in memory. Reproduced with a filesystem control that separates disk cost from SQL cost:

```
migration.sql = 37,402 bytes, 63 schema_meta rows

A. :memory:                          2 ms
B. /dev/shm  (real file, RAM-backed)  6 ms
C. on-disk file                  38,877 ms      <-- 6,480x slower than B
D. on-disk + WAL + synchronous=NORMAL 432 ms    <-- 90x faster than C
```

B is the control that matters: identical file API, identical SQL, identical driver. The 6 ms → 38.9 s
gap is **not** schema complexity. It is fsync on dm-crypt-over-SATA, one per statement, under the
default rollback journal.

This is the root of the WO-V1 handoff's "one gate run costs six minutes" finding, and of the
30-second timeout the third seat hit. It also means a mistyped `QF_KERNEL_DB` does not merely mint
an empty Kernel — it stalls the caller for ~39 seconds while doing so.

---

## What I checked and found sound

- Subsystems that **do** import `COLLAB_DIR` fork consistently with the cwd hash. That set is coherent;
  the defect is the set that never imports it.
- Domain row mutations in app and tool code still go through `execute()` / `kernelExecute`, not ad-hoc
  SQL. The write path is single in practice even though the gate cannot prove it.
- `kernel-sole-writer-app.ts` still fences raw `node:sqlite` and `qf-kernel` imports inside
  `collab-electron/src` to `kernel.ts` plus the transport exception. That gate holds.
- `openKernel` on a missing parent directory fails closed (Finding 3, second half).

## The review prompt's own blind spot

Stated by the third seat and I agree: the prompt asked whether **`COLLAB_DIR` consumers** split
partially. That framing presupposes the interesting state is reachable from `COLLAB_DIR`. The actual
miss is the state that **never imports it** — `agent-artifacts`, `agentos-host-mounts.json`,
`socket-path`, the ACP cache — which still participates in Kernel lineage. A search seeded from
`COLLAB_DIR` cannot find things defined by not using it.

My own blind spot, added: I asked for composition defects between *subsystems*, and got one. I did
not ask about composition between a **defect's remedy** and the layout — which is how Finding 2's
sharpest form (rebuild-orphans-artifacts) went unnamed by both of us until the measurement forced it.

## Process notes

- The third seat left `/tmp/thermo-*` canary databases and hung probe shells; it cleaned them up
  itself before exiting. Nothing was written inside the repo by the review.
- Two of my own bait files were written under `tools/thermo-bait/` and removed in a `finally` block.
  Working tree verified clean afterwards.
- I killed a probe with `pkill -f` and matched my own shell, exit 144 — the self-match trap already
  recorded in memory. Re-killed by PID.
