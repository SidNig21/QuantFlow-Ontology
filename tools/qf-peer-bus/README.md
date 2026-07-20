# qf-peer-bus

The peer plane from `docs/orders/WO-PEER-BUS.md`: a standalone MCP stdio
server + a two-client harness that proves two independent agent
*processes* can collaborate over a real MCP socket, with every message
recorded to the Kernel as an immutable, content-addressed `trajectory`
artifact.

Two concerns, kept deliberately apart:

- **The Kernel records WHAT was said** (domain truth) — `packages/qf-kernel`,
  via `execute(db, "publish_artifact", { kind: "trajectory", ... })`.
  Unconditional, every send, regardless of delivery.
- **The bus handles routing** (transport bookkeeping) — its own SQLite file
  (`peer-bus.db`), never touches `kernel.db`. Delivery can be switched off
  per-process (`QF_PEER_DELIVERY=off`) without the Kernel record changing at
  all — that separation is what `src/harness.ts` falsifies.

## Cold proof (no credentials — this is what gets verified)

```sh
cd tools/qf-peer-bus
bun install
bun run harness
```

`bun install` also runs a `postinstall` step that installs
`packages/qf-kernel`'s own dependencies (see "Deviations" below — this is
required for `qf-kernel`'s nested `qf-kernel-schema` dependency to resolve
when `qf-kernel` itself is consumed as a `file:` dependency from here).

`bun run harness` spawns two real MCP client processes (`orchestrator`,
`worker`), each launching its own `src/server.ts` subprocess over stdio,
sharing one `peer-bus.db` and one `kernel.db` in a fresh temp directory. It
runs a full task/result round trip, re-opens `kernel.db` from a third,
independent handle to verify both messages landed as `trajectory` artifacts
with `content_hash` equal to `contentHash()` of the message bytes, then
falsifies delivery (`QF_PEER_DELIVERY=off` → inbox stays empty, but the
Kernel still records the artifact) and restores it. No live model calls, no
mocked transport, no mocked Kernel — real subprocess stdio MCP, real
`qf-kernel` `execute()` calls.

```sh
bun run typecheck   # tsc --noEmit
```

## Canvas seat spawn (QuantFlow desk)

On branch `feat/peer-bus-canvas`, the dock lists **Spawn Hermes Orchestrator**
and **Spawn Hermes Worker**. Each button admits `hermes -p <profile> --tui`
into its own native term tile. Collaboration is over this MCP plane — not
PTY-injected A2A movie hops. Cable UI is deferred.

## Founder-live proof (two Hermes seats — founder runs this, not a builder)

This layer needs credentials that belong to the founder alone. It is
documented here, not run by whoever builds this package, and it is never a
gate.

### One-command MCP rewrite + Kernel init

Profiles `qf-orchestrator` / `qf-worker` must already exist (one-time clone
from a working `default` + Blank Slate / SOUL — see
`docs/orders/WO-PEER-BUS-CANVAS.md`). Then, from this checkout:

```sh
cd tools/qf-peer-bus
bun install
bun run setup-seats          # rewrite MCP + openKernel ~/.qf-peer-bus/kernel.db
# bun run setup-seats:dry    # CI-safe: print intended config only
```

The helper is idempotent: it upserts `mcp_servers.qf-peer-bus` in each
profile's `config.yaml` (non-interactive — `hermes mcp add` is TTY-gated),
pointing at **this checkout's** `tools/qf-peer-bus/src/server.ts` and shared
absolute dbs under `~/.qf-peer-bus/`. Then it runs
`hermes -p <profile> mcp test qf-peer-bus`.

### Manual recipe (same shape the helper applies)

```sh
mkdir -p ~/.qf-peer-bus
# Kernel schema must exist before live sends:
#   bun -e 'import { openKernel, closeKernel } from "qf-kernel"; const d=openKernel(process.env.HOME+"/.qf-peer-bus/kernel.db"); closeKernel(d)'
```

**Orchestrator profile** (`QF_PEER_ROLE=orchestrator`):

```sh
hermes -p qf-orchestrator mcp remove qf-peer-bus   # ok if missing
hermes -p qf-orchestrator mcp add qf-peer-bus \
  --command bun \
  --env QF_PEER_ROLE=orchestrator \
        QF_KERNEL_DB=$HOME/.qf-peer-bus/kernel.db \
        QF_PEER_BUS_DB=$HOME/.qf-peer-bus/peer-bus.db \
  --args /absolute/path/to/QuantFlow-Ontology/tools/qf-peer-bus/src/server.ts
```

**Worker profile** — same with `qf-worker` / `QF_PEER_ROLE=worker`.

### Live turns (founder)

In QuantFlow: spawn both seat tiles. In each TUI (plain language — the model
decides when to call the tool):

- **Orchestrator:** ask it to `send_to_peer` the worker a short TASK.
- **Worker:** ask it to `read_inbox`, then `send_to_peer` a RESULT back.
- Query `~/.qf-peer-bus/kernel.db` for both `trajectory` artifacts.

Full checklist: `docs/orders/WO-PEER-BUS-CANVAS.md`.

## Honest scope line

**Cold proof = this harness.** Two real MCP client processes, zero
credentials, zero live model turns, fully re-runnable by anyone with `bun`.
**Live proof = two real Hermes seats.** Model-driven, the founder's
credentials, run live by the founder — never scripted, never touched by a
builder, never a gate.

## Deviations from the order as written

- **`postinstall` script added to `package.json`.** `packages/qf-kernel`
  depends on `packages/qf-kernel-schema` via its own `file:../../qf-kernel-schema`
  dependency. When `qf-kernel` is itself consumed as a `file:` dependency
  from a *third* location (here), a single `bun install` in that third
  location does not populate `packages/qf-kernel/node_modules` — Bun
  registers the nested `qf-kernel-schema` link in the lockfile but never
  materializes it on disk unless `bun install` is also run with
  `packages/qf-kernel` as the working directory. Verified empirically
  (probed, not assumed): a clean single-directory install reproducibly
  fails at runtime with `Cannot find module 'qf-kernel-schema/commands'
  from '.../packages/qf-kernel/src/create.ts'`; running `bun install`
  inside `packages/qf-kernel` as well fixes it every time. The
  `postinstall` script (`cd ../../packages/qf-kernel && bun install`) makes
  this happen automatically as part of the one documented `bun install` —
  it only populates `packages/qf-kernel`'s own (gitignored) `node_modules`
  from its own already-tracked `package.json`/`bun.lock`; it does not
  modify any file outside `tools/qf-peer-bus/`.
- Everything else — the `PeerBus` API, the three MCP tools, the harness
  sequence, the Kernel recording recipe — matches the order as given.
