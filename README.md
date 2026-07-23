# QuantFlow

**An AI-native quantitative research platform: heterogeneous AI agents collaborating on a spatial canvas, over a governed ontology.**

QuantFlow doesn't compete with agent frameworks — it's the surface they land on. Claude Code, Codex, Hermes, a scraper, an RL worker: anything with a CLI is a *candidate species* that spawns as a seat on the canvas, collaborates with its peers over an MCP bus, and acts on a shared, governed world model (the Kernel). New agent tools shipping across the ecosystem aren't competition here — they're inventory.

> **It plugs into your world; it doesn't become your world.**

Built solo, in the open, on Linux first. Early-stage and honest about it — see [Status](#status).

---

## What works today (verified, not aspirational)

Every claim below is backed by a falsified `qa/` gate or a recorded proof in the Kernel. If it's not on this list, it doesn't exist yet.

- **The Kernel** — a sole-writer SQLite system of record. Append-only event log, content-addressed artifacts, schema-generated code (`qf-kernel-schema`). All mutation goes through Kernel commands; a gate (`qa/gates/kernel-sole-writer*`) fails the build if any other code path writes to it — and the gate has been bait-tested red before being trusted green.
- **The canvas + dock** — an infinite pan/zoom surface (Electron) where agent seats spawn as terminal tiles. The dock renders one spawn button per registered seat, driven by the seat registry, not hardcoded.
- **Agent seats** — named Hermes seats (`orchestrator`, `worker`, `worker2`), each a real TUI process in its own PTY session with its own profile and tool grants.
- **The peer bus** (`tools/qf-peer-bus`) — a stdio MCP server exposing `send_to_peer` / `read_inbox` / `list_peers`. Every peer message is recorded to the Kernel as a content-addressed `trajectory` artifact (which doubles as a finetuning trace store). Transport routing lives in its own SQLite db, separate from the Kernel.
- **Live delivery** — a host-side watcher pushes incoming peer messages into the recipient's *live TUI* as a real conversation turn. Proven end-to-end: an orchestrator message injected into a worker's native TUI was auto-processed and answered via `send_to_peer`, with both legs recorded as Kernel artifacts.
- **Verification culture** — changes land through work orders verified in cold git worktrees; gates are falsified (bait → red → restore → green) before they count; artifact hashes are recomputed, not trusted.

## The end goal: a real ontology

The destination is a **Palantir-grade ontology built with tools anyone can install** — object types, properties, links, and actions over the Kernel, with the agents' tool surface *generated from* the schema rather than hand-written. The doctrine (borrowed from Palantir's own published talks, built on none of their platform):

1. **One governed system of record.** The Kernel is the sole writer. Retrieval, scraping, and agent chatter never become truth without passing through a Kernel command.
2. **Tools follow the ontology.** Model the object/link/action graph correctly and CRUD + action tools fall out of codegen for free — that's what lets agents one-shot cross-object work instead of being hand-held verb by verb.
3. **Names and descriptions are load-bearing.** Agents reason over the schema. Every object type and property carries a mandatory description, enforced by lint, or it doesn't merge.

The ontology has three planes:

- **Research plane** (invariant, market-agnostic): `Hypothesis → Dataset → Run → Artifact → Evaluation → Report`. Identical whether the instrument is a game line, a perp contract, or an equity.
- **Market plane** (pluggable, pipeline-fed): `Venue / Instrument / Quote / MarketEvent`. A new market adds *rows*, never new object types.
- **Agent plane** (largely live already): `AgentDefinition / AgentSession` + trajectory artifacts.

**The proof standard** — the day this repo gets to call itself an ontology: an orchestrator seat answers *"What did the last Run on Hypothesis X show, which Evaluation gated it, and should we re-run against the newer Dataset?"* in one pass, using only tools generated from the schema, with every step recorded to the Kernel.

## Status

| Phase | Scope | Status |
|---|---|---|
| 0 | Substrate: Kernel, canvas/dock, seats, peer bus, live TUI delivery | ✅ Done, verified |
| 1 | Ontology charter as code (~14 described object types, lint-enforced governance) | 🔜 Next |
| 2 | Tool plane generated from the charter (MCP read + action tools via codegen) | Planned |
| 3 | First market pipeline (`Instrument`/`Quote`/`MarketEvent` via Kernel commands) | Planned |
| 4 | Defining research loop run end-to-end by agents — the one-shot proof | Planned |
| 5 | Recall layer (FTS5 + sqlite-vec hybrid retrieval) + trust boundaries | Later |
| 6 | Evaluation-history-driven optimization | Later |

No claim in this README runs ahead of this table.

## Architecture

```
┌───────────────────────────────────────────────────────┐
│  CANVAS + DOCK (Electron)          the surface        │
│  seat spawn rail · terminal tiles · live PTY sessions │
├───────────────────────────────────────────────────────┤
│  COLLABORATION PLANE               agent ↔ agent      │
│  qf-peer-bus (stdio MCP) · host push into live TUIs   │
├───────────────────────────────────────────────────────┤
│  WORLD MODEL                       agent ↔ world      │
│  SQLite Kernel · sole writer · append-only event log  │
│  content-addressed artifacts · schema-generated code  │
└───────────────────────────────────────────────────────┘
```

Runtime split worth knowing: the Electron main process is Node (`node:sqlite`); Bun code (tools, tests, gates) uses `bun:sqlite`. The Kernel is opened through a single driver seam — only one file in the app may import it, and a gate enforces that.

## Repo layout

| Path | What it is |
|---|---|
| `collab-electron/` | The desktop app — canvas, dock, seat spawning, peer delivery watcher |
| `qf-kernel-schema/` | Schema → generated Kernel code (the codegen seam the ontology charter will extend) |
| `tools/qf-peer-bus/` | The MCP peer bus: server, transport db, Kernel recording, cold-harness proofs |
| `species/` | Agent definitions |
| `qa/` | Gates. Falsifiable by construction — if a gate can't go red, it isn't a gate |
| `docs/orders/` | Work orders + verification records (the build's audit trail) |

## Development

Prerequisites: **Node.js 24+**, **Bun**, **tmux** (Linux-first; macOS/Windows carried by upstream but untested here).

```sh
git clone <this repo>
cd QuantFlow-Ontology/collab-electron
bun install
bun run dev     # Electron app with hot reload
bun test        # tests
bun run build   # production build
```

Gates run from `qa/` and are wired into CI. Agent seats require a local [Hermes](https://github.com/NousResearch/hermes-agent) install with per-seat profiles; the peer bus MCP block is written into each profile by `tools/qf-peer-bus/scripts/setup-founder-seats.ts`.

## Doctrine (the rules this repo is built under)

- **Stop building engines.** The substrate is done. New effort goes into the world model and the loop that runs over it.
- **Kernel is the sole writer.** Everything else asks.
- **One canonical type per real-world entity.** `Run` with a `kind` property — never `BacktestRun`/`ScreenerRun` clones. Extension via new linked types, not mutation of shipped ones.
- **Pipeline-shaped data gets pipelines, not actions.** Quotes and events flow in through ingest scripts with provenance; no manual write verbs for them.
- **Descriptions are enforced, not encouraged.** The schema is agent context.
- **Measurements beat prose.** Nothing is "done" by narrative — gates go red or the claim doesn't exist.

## Lineage

QuantFlow is a fork of [Collaborator](https://github.com/collaborator-ai/collab-public) (`collab-electron`), whose canvas, tile system, and terminal architecture form the surface layer — see `LICENSE.md` and `NOTICE.md`. The Kernel, peer bus, seats, gates, and the ontology direction are QuantFlow's own.

## License

See [LICENSE.md](LICENSE.md).
