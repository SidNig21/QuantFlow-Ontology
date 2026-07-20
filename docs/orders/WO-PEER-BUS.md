# WO-PEER-BUS — the peer plane: agents collaborate beside the TUI, not through it

status: building
assignee: sonnet-subagent (build) · fable (verify)
created: 2026-07-20

## The thing that broke, and the fix

The platform's thesis was **agent collaboration between any model, in its native face.** It broke because collaboration was routed *through the terminal TUI* — a display surface you can write into but cannot read structured output back out of, and one that has no concept of a peer speaking vs. a human typing. So every A2A "hop" had to be host-scripted. That is not collaboration; it is puppetry.

**The fix (grounded, probed 2026-07-20):** every serious CLI agent ships a protocol server *beside* its TUI. Measured on this machine:
- `hermes mcp serve` — "Run Hermes as an MCP server (expose conversations to other agents)."
- `hermes mcp add <name> --command <cmd> --args … --env K=V` — point Hermes at ANY stdio MCP server; its model gets those tools.

So: each agent runs its **native TUI for the human** and connects to a shared **MCP peer plane** for its colleagues. The **Kernel brokers and records** the peer plane. The TUI is never the wire — it stays honest and unfaked because it was never the transport. **Model-agnostic by construction:** anything that speaks MCP (Hermes, Claude Code, Codex, …) plugs into the same socket.

## Scope (this order): prove the plane, cold. Founder proves it live.

**Cold-verifiable core (no credentials, this order builds + fable verifies):** a standalone `tools/qf-peer-bus/` MCP server + a two-client harness that demonstrates two independent agent *processes* exchanging messages over real MCP, every message recorded to the Kernel as a content-addressed `trajectory` artifact (which doubles as the finetuning trace-store the founder asked for). Delivery is falsifiable.

**Founder-live layer (documented, founder runs — credentials are the founder's alone):** `hermes mcp add qf-peer-bus …` on two Hermes seats; ask one to message the other; watch real model-driven collaboration land as artifacts. Never in a gate, never touched by a builder.

## Design (Law-clean)

- **Kernel records WHAT was said** (domain truth): each peer message → `execute(db, "publish_artifact", { kind: "trajectory", … })` → a real `artifact.published` event. Immutable, content-addressed, queryable. This is the receipt AND the finetuning corpus. No writes around the event log (Law B holds; `kernel-sole-writer` stays green).
- **The bus handles routing** (transport, its own concern — like Hermes's `~/.hermes` is Hermes's): a small SQLite file `peer-bus.db` the bus owns, with a `messages(id, from_role, to_role, artifact_id, body, created_at, delivered)` table. Shared across server processes via the file, so two agents' server instances see one inbox. This is explicitly transport bookkeeping, not domain truth — it never touches `kernel.db`.

## Deliverables (`tools/qf-peer-bus/`)

1. `package.json` — Bun; deps `@modelcontextprotocol/sdk`, `file:../../packages/qf-kernel`. Scripts: `harness`, `typecheck`.
2. `src/bus.ts` — `PeerBus` over `peer-bus.db` + a `kernel.db` handle. `send(from, to, body)`: publish trajectory artifact to the Kernel, insert a `messages` row, return `{ artifactId, messageId }`. `readInbox(role)`: return + mark delivered undelivered rows for `role`. `listPeers()`. A `deliveryEnabled` flag (env `QF_PEER_DELIVERY=off` disables enqueue → falsification). Both db paths from env (`QF_KERNEL_DB`, `QF_PEER_BUS_DB`).
3. `src/server.ts` — MCP **stdio** server (`@modelcontextprotocol/sdk`). Role from env `QF_PEER_ROLE`. Tools: `list_peers()`, `send_to_peer({ to, message })`, `read_inbox()`. Wraps one shared `PeerBus`.
4. `src/harness.ts` — cold proof, **no credentials**: launch two real MCP **clients** over stdio (`Client` + `StdioClientTransport`), roles `orchestrator` and `worker`, both pointing at the same `peer-bus.db` + a temp `kernel.db`. Orchestrator `send_to_peer(worker, "TASK: …")` → worker `read_inbox()` sees it → worker `send_to_peer(orchestrator, "RESULT: …")` → orchestrator `read_inbox()` sees it. Then **assert both messages exist as trajectory artifacts in kernel.db** (query the artifact table; content hashes match the message bodies). **Falsify:** relaunch worker's server with `QF_PEER_DELIVERY=off` → orchestrator's send lands as an artifact but worker inbox is EMPTY → print RED; restore → GREEN. Print both.
5. `README.md` — the founder-live `hermes mcp add` recipe for two seats + the honest scope line ("cold proof = harness; live proof = two Hermes").

## Acceptance (fable verifies cold)

- `cd tools/qf-peer-bus && bun install && bun run harness` → round-trip shown, both messages recorded as artifacts (IDs printed and re-queried), falsification RED then GREEN.
- `bun run typecheck` (`tsc --noEmit`) exit 0.
- Independent check: the harness's kernel.db, opened fresh, returns exactly the two trajectory artifacts with content hashes equal to `contentHash(message bytes)` — provenance is real, not echoed.

## Out of scope

Electron/canvas wiring (a later order visualizes the plane as cables) · schema amendments · live model turns in any gate · permissions/allowlists on the bus (deny-by-default policy is a follow-up) · more than two peers.

---

## Verification — 2026-07-20 · PASS (Sonnet built, Fable verified — decorrelated)

Verified cold in the build worktree, re-running everything from a genuinely clean install (nuked `node_modules` in the package AND in `packages/qf-kernel` + `qf-kernel-schema`):

- **`bun install` → exit 0; `bun run harness` → exit 0**, fresh content-addressed artifact ids each run (not cached).
- **The MCP transport is real cross-process:** `harness.ts` launches two separate `bun src/server.ts` subprocesses via `StdioClientTransport`, one per role, both handed the *same* `QF_PEER_BUS_DB` + `QF_KERNEL_DB`. Orchestrator's `send_to_peer` is read by the worker's *separate process* via the shared bus db — genuine machine-to-machine delivery, not an in-process call. `server.ts` uses real `McpServer` + `StdioServerTransport` + `registerTool`. No stub/mock/fake anywhere (grep-confirmed).
- **Kernel recording is real and provenance-checked:** each message is `execute(db, "publish_artifact", { kind:"trajectory", … })` → a real `artifact.published` event. The harness re-opens `kernel.db` on a *third* handle and asserts each stored `content_hash === contentHash(bytes)` and `id === hash` — the value is recomputed, never echoed.
- **Falsification is honest, both poles:** `QF_PEER_DELIVERY=off` → the specific message is absent from the worker's inbox (RED); restored → present (GREEN). And the suppressed message is *still* recorded to the Kernel — proving the bus suppressed **routing** while the Kernel never suppressed the **record** (Law B clean; the transport db never touches `kernel.db`).
- **Scope clean:** only `tools/qf-peer-bus/**` + this doc; `tsc --noEmit` exit 0.
- One accepted builder deviation (documented in `harness.ts:215`): the delivery flag is checked in the *sender's* process, so the RED leg relaunches the orchestrator's server with the flag, not the worker's — mechanically correct and matches the doc's own cause/effect.

**What this proves:** two independent agent processes collaborating over a real MCP socket, brokered and recorded by the Kernel, with the transport wholly separate from any TUI. This is the thing that broke — built right. The founder-live layer (`README.md`) is two Hermes seats via `hermes mcp add`; run it with real model turns whenever.
