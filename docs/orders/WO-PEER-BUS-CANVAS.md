# WO-PEER-BUS-CANVAS — peer-bus visual PASS on the QuantFlow desk

status: open — active track (park ignored for this PASS)
assignee: builder / founder acceptance
depends: WO-PEER-BUS (cold plane PASS) · WO-008d (native TUI tiles)
created: 2026-07-20
plan: `docs/plans/2026-07-20-001-req-peer-bus-canvas-pass-plan.md`

## Thesis

Two Hermes faces on the canvas — Orchestrator and Worker — each a real
`hermes -p <profile> --tui` term tile. Collaboration over `qf-peer-bus` MCP
(Kernel-recorded trajectories). **No PTY puppetry / no Run A2A movie.**

## Builder cold gates (CI)

1. `cd tools/qf-peer-bus && bun install && bun run typecheck && bun run harness`
2. `cd species/hermes && bun run seat-argv-smoke`
3. Static gates (PROTOCOL) + `cd collab-electron && bun run build`
4. `cd tools/qf-peer-bus && bun run setup-seats:dry` (prints intended MCP rewrite)

## Founder preflight (once per machine)

1. Profiles exist: `qf-orchestrator`, `qf-worker` (clone from working `default`).
2. Blank Slate for bundled skills; SOUL states seat role + peer-bus tools.
3. Working model credentials on both profiles.
4. From this checkout:

```sh
cd tools/qf-peer-bus && bun install && bun run setup-seats
```

Expect `hermes -p qf-orchestrator mcp test qf-peer-bus` (and worker) to discover
`list_peers`, `send_to_peer`, `read_inbox`.

## Founder canvas acceptance checklist (AE1–AE3)

Live model turns — founder only; never a CI gate.

1. Open QuantFlow from this branch (`feat/peer-bus-canvas`).
2. Dock → **Spawn Hermes Orchestrator** → one native term tile (chrome /
   session label: Hermes Orchestrator).
3. Dock → **Spawn Hermes Worker** → second independent tile (Hermes Worker).
4. Confirm there is **no** product **Run A2A** movie button driving collab.
5. In the **Orchestrator** TUI, ask (natural language) to message the worker
   via `send_to_peer` with a short TASK.
6. In the **Worker** TUI, ask to `read_inbox` — message + matching Kernel
   artifact id appear (AE1).
7. Worker replies via `send_to_peer`; Orchestrator inbox shows RESULT; second
   trajectory artifact in `~/.qf-peer-bus/kernel.db` (AE2).
8. Neither tile's TUI was rewritten by QuantFlow host scripts to fake the
   exchange (AE3).

Query example:

```sh
sqlite3 ~/.qf-peer-bus/kernel.db "SELECT id, kind FROM artifact ORDER BY created_at"
```

## Out of scope

Canvas cable UI · permissions on the bus · more roles · Hermes Kanban ·
skill packs · AIP/Foundry as truth backend for this PASS.
