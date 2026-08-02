# QuantFlow Ontology

**An AI-native quantitative research platform: heterogeneous AI agents collaborating on a spatial canvas, over a governed ontology.**

QuantFlow doesn't compete with agent frameworks — it's the surface they land on. Claude Code, Codex, Hermes, a scraper, an RL worker: any controllable CLI can become a Dock runtime through an adapter package, then appear as one or more founder-visible profiles on the canvas. Profiles keep their own identity while sharing reusable runtime code, collaborate over an MCP bus, and act on a shared, governed world model (the Kernel). New agent tools shipping across the ecosystem aren't competition here — they're inventory.

> **It plugs into your world; it doesn't become your world.**

Built solo, in the open, for native Windows first. Early-stage and honest about it — see [Status](#status).

---

## What works today (verified, not aspirational)

Every claim below is backed by a falsified `qa/` gate or a recorded proof in the Kernel. If it's not on this list, it doesn't exist yet.

- **The Kernel** — a sole-writer SQLite system of record. Append-only event log, content-addressed artifacts, schema-generated code (`qf-kernel-schema`). All mutation goes through Kernel commands; a gate (`qa/gates/kernel-sole-writer*`) fails the build if any other code path writes to it — and the gate has been bait-tested red before being trusted green.
- **The canvas + dock** — an infinite pan/zoom surface (Electron) where every agent card launches by exact Kernel definition id. The old hardcoded Peer Seats catalogue and its separate spawn IPC are gone: qf-toolloop and three Hermes profiles all use the same Dock path, and each session links back to the definition the founder clicked.
- **Agent seats** — the packaged Dock contains `qf-toolloop`, three distinct Hermes profiles, and two clearly labeled deterministic proof profiles. The proof orchestrator/worker are verified end to end on Windows; the model-backed ToolLoop/Hermes profiles are present with distinct Kernel identities but are not yet certified as everyday Windows workflows.
- **The peer bus** (`tools/qf-peer-bus`) — a stdio MCP server exposing `send_to_peer` / `read_inbox` / `list_peers`. Every peer message is recorded to the Kernel as a content-addressed `trajectory` artifact (which doubles as a finetuning trace store). Transport routing lives in its own SQLite db, separate from the Kernel.
- **Live delivery** — package metadata binds a selected Kernel role to its live PTY and pushes peer messages into the TUI. WO-WIN2 proves the current Windows path with two normal-Dock-launched deterministic seats, distinct sessions, visible task/ACK output, and both legs recorded as Kernel trajectory artifacts. This is a collaboration-transport proof, not a claim that a live model completed research.
- **Verification culture** — changes land through work orders verified in cold git worktrees; gates are falsified (bait → red → restore → green) before they count; artifact hashes are recomputed, not trusted.

## The end goal: a real ontology

The destination is a **Palantir-grade ontology built with tools anyone can install** — object types, properties, links, and actions over the Kernel, with the agents' tool surface *generated from* the schema rather than hand-written. The doctrine (borrowed from Palantir's own published talks, built on none of their platform):

1. **One governed system of record.** The Kernel is the sole writer. Retrieval, scraping, and agent chatter never become truth without passing through a Kernel command.
2. **Tools follow the ontology.** Model the object/link/action graph correctly and CRUD + action tools fall out of codegen for free — that's what lets agents one-shot cross-object work instead of being hand-held verb by verb.
3. **Names and descriptions are load-bearing.** Agents reason over the schema. Every object type and property carries a mandatory description, enforced by lint, or it doesn't merge.

The ontology has three planes:

- **Research plane** (invariant, market-agnostic): `Hypothesis → Dataset → Run → Artifact → Evaluation → Report`. Identical whether the instrument is a game line, a perp contract, or an equity.
- **Market plane** (pluggable, pipeline-fed): `Venue / Instrument / Quote / MarketEvent`. A new market adds *rows*, never new object types.
- **Agent plane** (largely live already): `AgentDefinition` (Dock profile) → `AgentSession` through `spawned_from`, plus trajectory artifacts. Several definitions may share one runtime package without collapsing identity.

**The proof standard** — the day this repo gets to call itself an ontology: an orchestrator seat answers *"What did the last Run on Hypothesis X show, which Evaluation gated it, and should we re-run against the newer Dataset?"* in one pass, using only tools generated from the schema, with every step recorded to the Kernel.

## Status

| Phase | Scope | Status |
|---|---|---|
| WIN | Native Windows package: boot, Kernel, canvas, Dock, clean shutdown | ✅ Verified — WO-WIN1 |
| 0 | Substrate components: Kernel, canvas/dock, seats, peer bus, collaboration transport | ✅ Windows floor and deterministic two-seat proof verified — WO-WIN2 |
| 1 | Ontology charter as code (23 described object types, lint-enforced governance) | ✅ Done, verified |
| 2 | Generated MCP read + action plane with governed hidden actions | ✅ Done, verified |
| 3 | First market pipeline: trusted context and atomic ingest, then real Bovada football | Parked — requires a new founder-authorized Windows order |
| 4 | Defining research loop run end-to-end by agents — the one-shot proof | Planned |
| 5 | Recall layer (FTS5 + sqlite-vec hybrid retrieval) + trust boundaries | Later |
| 6 | Evaluation-history-driven optimization | Later |

No claim in this README runs ahead of this table.

**Measured 2026-08-01.** The generated authority now contains 23 objects, 28 actions, and 97
complete tools. Agents receive exactly 92: observation, registration, and market-ingest actions stay
on trusted/operator or pipeline boundaries. The research graph has governed creation/link paths, and
the market plane can atomically store replay-safe Venue, MarketEvent, Instrument, and Quote rows with
source provenance and `lists` / `offered_on` / `quotes` links. The production Linux package contains
the Kernel's complete three-step upgrade history plus qf-toolloop and the three Hermes-backed Dock
profiles.

The Windows product floor is now real and founder-visible. The honest boundary is narrower than a
finished product: deterministic collaboration is proven, while live model-backed seats, the parked
Bovada workflow, and the defining multi-agent research loop still require later orders. For the
single current status page, including what is usable and what is not, read
[`docs/orders/NEXT.md`](docs/orders/NEXT.md).

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
| `species/` | Runtime/adapter packages and agent fixtures; durable Dock profile identity lives in the Kernel |
| `qa/` | Gates. Falsifiable by construction — if a gate can't go red, it isn't a gate |
| `docs/orders/` | Work orders + verification records (the build's audit trail) |

## Development

Prerequisites: **Windows 11**, **Node.js 24+**, and **Bun**. Native Windows packaging and runtime are the release floor; WSL/Linux are secondary compatibility targets.

```sh
git clone <this repo>
cd QuantFlow-Ontology/collab-electron
bun install
bun run dev     # Electron app with hot reload
bun test        # tests
bun run build   # production build
```

On Windows, `bun run package:unsigned` creates the unsigned package under `collab-electron/dist/`.
The canonical readiness check is run from the repository root with `bun qa/verify-release.ts`.
While the app is running, `qf-canvas` is the command-line control surface for arranging and
inspecting canvas tiles.

### Local data layout

QuantFlow keeps domain truth, durable artifact bytes, and app-local projection state in three
deliberately separate locations:

```text
~/.quantflow/kernel.db
~/.quantflow/artifacts/
~/.quantflow/app/
```

The Kernel is the sole source of domain truth. Artifact bytes live beside it under the canonical
artifact root, while canvas, browser, configuration, logs, sockets, and other app-local state live
under `app/` (development launches are isolated below `app/dev/worktree-<id>/`). On first launch,
QuantFlow copies eligible state from the legacy Collaborator locations without deleting the source;
if both roots exist, the QuantFlow root wins unchanged.

Gates run from `qa/` and are wired into CI. The Dock definitions bootstrap automatically from packaged manifests, but real Hermes turns still require the founder's local [Hermes](https://github.com/NousResearch/hermes-agent) install and matching `qf-orchestrator`, `qf-worker`, and `qf-worker-2` runtime profiles. The founder-only peer-bus helper is `tools/qf-peer-bus/scripts/setup-founder-seats.ts`.

**Current collaboration limit:** D2 proves one catalogue, exact profile selection, session lineage,
safe native-TUI cleanup, and metadata-authorized PTY delivery. It does not create Hermes profiles,
handle credentials, enforce caller-bound QuantFlow tool grants, or prove an unscripted real-model
research collaboration; those remain later rungs.

## Doctrine (the rules this repo is built under)

- **Stop building engines.** The substrate is done. New effort goes into the world model and the loop that runs over it.
- **Kernel is the sole writer.** Everything else asks.
- **One canonical type per real-world entity.** `Run` with a `kind` property — never `BacktestRun`/`ScreenerRun` clones. Extension via new linked types, not mutation of shipped ones.
- **Pipeline-shaped data has no per-type or manual agent write verbs.** Trusted bulk-ingest commands still pass through the Kernel's single `execute()` door, carrying provenance and atomic retry rules, while Dock agents receive read access rather than a second write surface.
- **Descriptions are enforced, not encouraged.** The schema is agent context.
- **Measurements beat prose.** Nothing is "done" by narrative — gates go red or the claim doesn't exist.

## Lineage

QuantFlow is a fork of [Collaborator](https://github.com/collaborator-ai/collab-public) (`collab-electron`), whose canvas, tile system, and terminal architecture form the surface layer — see `LICENSE.md` and `NOTICE.md`. The Kernel, peer bus, seats, gates, and the ontology direction are QuantFlow's own.

## License

See [LICENSE.md](LICENSE.md).
