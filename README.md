# QuantFlow Ontology

**A Windows-first, single-user, ontology-centered environment for governed quantitative research.**

QuantFlow has one spatial Canvas where Ryan works with governed participants and capabilities over one shared institutional truth. A custom Hermes **Research Director** is the primary colleague and default coordinator. The Dock supplies Participants, Data, Tools, Methods, and Compute; Inspect reveals selected proof; the Kernel/Ontology owns durable truth. A Mission is internal scope, never another Canvas world.

QuantFlow is research and advisor software only. It never places a bet or executes a trade.

## Current status

**Golden Baseline accepted on 2026-08-31.** Phase 2 repository purification and Phase 3 whole-product requalification are closed. The accepted Golden product candidate is `7c26141f3ab365630b01e8570b395f8856603453`; the designation and independent verification are recorded in the [Golden evidence packet](docs/orders/evidence/golden-baseline/phase3/GOLDEN-DESIGNATION-20260831.md).

The Golden designation means the repository and current Windows product have a clean, reproducible, independently verified floor. It does **not** mean the complete real-market research product is finished.

| Surface | Verified state |
| --- | --- |
| Repository | Golden baseline on `main`; clean Phase 2/Phase 3 evidence and independent verification |
| Windows app | Builds, packages, installs, cold-boots, reconciles durable state, and shuts down cleanly |
| Kernel | Sole-writer SQLite truth with schema-generated objects, links, actions, tools, and conformance tests |
| Canvas + Dock | Running Electron surfaces for participants, market/evidence work, Inspect, cables, pan/zoom, and `TIDY`; the accepted baseline's alternate Mission/History/Lineage modes are now explicitly rejected by ADR-0005 and remain an in-flight product correction |
| Production Dock | Four Hermes profiles: Research Director, two Market Researchers, and Critic |
| Real model path | One founder-operated Hermes → OpenCode Go → Kimi K3 turn proven through the rendered packaged app |
| Real Ontology use | The Director used four governed Ontology tools to read one founder-created Task and its exact participant lineage |
| Persistence | Kernel work survives normal close/reopen and terminated runtime state is reconciled honestly; the new target cold-opens to only the Director and requires deliberate retrieval |
| Packaging | Unsigned Windows x64 NSIS installer; Authenticode reports `NotSigned` |
| Update channel | Not available for the internal build; the app honestly renders `Update failed — retry` after HTTP 406 |
| Wave 1 accepted | W1-01 opens real Bovada UFC markets; W1-02 adds official pre-cutoff UFC history and one transparent descriptive calculation |
| Current boundary | W1-03 is in flight: no independently accepted Critic-reviewed research assessment or CANDIDATE/WATCH/PASS result yet; no heterogeneous runtime collaboration yet |

`docs/orders/NEXT.md` is the sole build-authority pointer. It currently names W1-03; a roadmap or planning document is never permission to start different work.

## What works today

### Founder-operated Windows workflow

The Golden real-product walkthrough proved this exact path without internal RPC substitution or a synthetic responder. Its automatic same-world reopen and mode-oriented surface were valid proof of the old baseline, not the newly accepted product target:

```text
launch packaged QuantFlow
  → open the real Dock catalog
  → pointer-spawn Research Director
  → see the participant tile on the Canvas
  → create and inspect a durable Task
  → type into the real Hermes terminal and press Enter
  → Hermes calls governed Ontology tools through QuantFlow
  → OpenCode Go / Kimi K3 answers in the same tile
  → close and reopen durable Kernel work
  → see truthful Task and participant history after retrieval
  → shut down with zero owned processes
```

The credential-safe [founder walkthrough receipt](docs/orders/evidence/golden-baseline/phase3/FINAL-FOUNDER-ONTOLOGY-WALKTHROUGH-20260830.md) binds the rendered interaction to the exact Kernel rows, Artifact hashes, Hermes session, provider/model rows, response, reopen state, and cleanup results.

### Kernel and Ontology

The Kernel is the only shared source of durable product truth. Domain mutation passes through `execute()`; gates reject domain SQL and Canvas-domain persistence outside the sanctioned Kernel path.

The generated Ontology currently contains:

- 23 object types;
- 23 link types;
- 43 actions;
- 104 generated MCP tools.

The canonical generated surface is [`qf-kernel-schema/golden/ONTOLOGY.md`](qf-kernel-schema/golden/ONTOLOGY.md). SQL, generated tools, Ontology documentation, and conformance tests are derived from the schema and compared byte-for-byte. Generated files are never hand-edited.

The principal planes are:

- **Research:** `Hypothesis → Dataset → Run → Artifact → Evaluation → governed Report publication`.
- **Market:** `Venue / MarketEvent / Instrument / Quote / Result`.
- **Agent:** `AgentDefinition → AgentSession`, plus durable Task ownership, delegation, steering, and produced Artifacts.

Artifact bytes are content-addressed. Dataset time fences, deterministic execution, independent Evaluation, current-versus-historical Report authority, Task steering, session lifecycle, and lineage refusal paths have executable gates.

### Canvas and Dock

The currently accepted Electron baseline provides:

- an infinite pan/zoom Canvas;
- a file rail;
- a Research Dock and contextual Inspect surfaces;
- participant/terminal tiles with resize and focus behavior;
- Kernel-projected Tasks, Runs, Artifacts, Evaluations, Reports, sessions, and relationships;
- legacy Workspace, Current Mission, History, and Full Lineage projection modes, now rejected as a target product model by ADR-0005;
- semantic cables, selection emphasis, a minimap, and deterministic `TIDY` layout;
- mouse-first controls with normal keyboard text and terminal input.

These surfaces are functional and gated, but the interface remains early-stage. W1-03 owns the correction to one Canvas, deliberate working surfaces, clean cold-open, and no object-card flood. Golden proves truthful operation; it does not make the legacy projection grammar the product.

### Production participant inventory

The packaged production Dock contains exactly these Hermes-backed profiles:

| Definition | Display role | Kernel role | Capability group |
| --- | --- | --- | --- |
| `hermes-research-director` | Research Director | `orchestrator` | `desk.orchestrate` |
| `hermes-worker` | Market Researcher | `worker` | `market.read` |
| `hermes-worker-2` | Market Researcher | `worker2` | `market.read` |
| `hermes-critic` | Critic | `critic` | `research.evaluate` |

The deterministic `qf-proof-agent` is QA-only. It is not production Dock inventory. Claude Code, Codex, local models, scrapers, and learning workers are not certified built-in production adapters in the Golden product.

QuantFlow can boot without Hermes. Running a Hermes participant requires founder-owned WSL2, Ubuntu, Hermes, and authentication. QuantFlow owns Dock identity, admission, PTY lifecycle, launch-scoped MCP access, Kernel truth, and Canvas projection. Hermes owns its CLI/TUI process and private authentication. QuantFlow does not install, read, copy, or rewrite the founder's Hermes credentials.

### Generated tools and application bridges

The packaged app includes:

- the schema-generated Ontology MCP surface;
- an app-owned collaboration MCP surface;
- role/capability filtering;
- foreign-Kernel refusal;
- tool-call trajectory Artifacts;
- `qf-canvas`, the CLI control surface for inspecting and arranging Canvas tiles;
- governed Bovada capture used by the accepted live UFC market desk, with the earlier NFL path retained as regression coverage.

The Bovada component has strict origin, response-size, schema, selection, cancellation, replay, Artifact, and Kernel-ingest tests. W1-01 composes current UFC offers into the visible market desk; W1-02 composes official history and a transparent calculation. The independently reviewed conclusion remains W1-03 work.

## Honest product boundary

The Golden product proves a real desktop, real governed state, a real Hermes runtime, and one real model/Ontology Task interaction. It does not yet prove:

- a complete Critic-reviewed UFC inquiry using live point-in-time evidence;
- a validated betting Technique or predictive edge;
- accepted composition from acquisition through independent Evaluation to research assessment plus market actionability;
- a heterogeneous multi-model Dock;
- evaluated recall or learning;
- PufferLib training or Policy promotion;
- a signed public release, working update channel, backup/restore, or rollback;
- the accepted one-Canvas, clean-open, deliberate-surface consumer interface;
- multi-user, SaaS, marketplace, or commercial launch readiness.

Fixtures and synthetic responders are used to prove isolated mechanics. They are never reported as real research judgment. The real founder inference receipt is separately bound to trusted Hermes logs, exact Kernel state, immutable Ontology-call Artifacts, and rendered application behavior.

## Verification

The canonical native-Windows release door is:

```powershell
bun qa/verify-release.ts
```

It performs frozen installs, focused Windows units, package/resource verification, an unsigned installer build, installed and unpacked readiness/shutdown, packaged Hermes lifecycle proof, the real-founder inference receipt check, and the static Kernel/Canvas/schema laws.

Useful inspection commands:

```powershell
bun qa/run.ts --list
bun qa/run.ts schema
bun qf-atlas/generate.mjs --check
bun qf-atlas/ratchet.mjs
```

Atlas is a generated developer wiring map, not the running product or Kernel truth. At Golden designation it was current with HARD RED 0, while still retaining visible amber and undecided findings. Atlas can expose wiring and write-path risk; it cannot prove research usefulness or UI clarity.

## Architecture

```text
ONE CANVAS + DOCK + INSPECT (Electron)
  deliberately opened participants, capabilities, and useful outputs
        ↓ projections / governed actions
APPLICATION PLANE
  participant admission, PTY lifecycle, MCP bridges, peer delivery
        ↓ one sanctioned mutation door
KERNEL (SQLite)
  objects, links, actions, events, durable identity and lineage
        ↕
CONTENT-ADDRESSED ARTIFACTS
  raw evidence, trajectories, results, evaluations, reports
```

The Electron main process uses Node and `node:sqlite`; tools, tests, and gates use Bun and `bun:sqlite`. The Kernel is opened through one driver seam. Gates enforce both that app boundary and the sole-writer rule.

## Repository layout

| Path | Purpose |
| --- | --- |
| `collab-electron/` | Windows desktop application, Canvas, Dock, tiles, PTY/runtime hosting, MCP bridges, packaging |
| `packages/qf-kernel/` | Kernel execution, lifecycle, governed review, deterministic execution, SQLite drivers |
| `qf-kernel-schema/` | Canonical schema and generated SQL, tools, Ontology documentation, upgrades, conformance tests |
| `species/hermes/` | Hermes adapter package, production Dock profiles, prompts, launch/runtime controls |
| `tools/qf-bovada-football/` | Fixed public Bovada NFL capture and governed Kernel ingestion component |
| `qa/` | Registered falsifiable gates and canonical Windows release verifier |
| `qf-atlas/` | Generated developer wiring/coverage map and ratchet |
| `docs/orders/` | Current build authority, scoped orders, and immutable verification evidence |
| `docs/history/` | Superseded planning and decision history; never current authority |

## Development

Primary platform: **Windows 11**. Required development tools: **Node.js 24+** and **Bun**. Hermes-backed participant runs additionally require founder-owned WSL2, Ubuntu, Hermes, and authentication.

```powershell
git clone <this-repository>
cd QuantFlow-Ontology\collab-electron
bun install --frozen-lockfile
bun run dev
```

Build the unsigned Windows package:

```powershell
bun run package:unsigned
```

Local state is deliberately separated:

```text
~/.quantflow/kernel.db   canonical domain truth
~/.quantflow/artifacts/ content-addressed durable bytes
~/.quantflow/app/       application-local projection/config/log/socket state
```

Application-local state may support rendering and runtime operation, but it may not become a second domain truth store.

Agents entering this repository must read [`START_HERE.md`](START_HERE.md), [`CONTEXT.md`](CONTEXT.md), [`AGENTS.md`](AGENTS.md), and the order named by [`docs/orders/NEXT.md`](docs/orders/NEXT.md) before editing.

## Non-negotiable rules

- The Kernel owns truth; everything else is a projection or cache.
- Durable domain writes go through `execute()`.
- QuantFlow never places bets or executes trades.
- Raw evidence remains inspectable after Evaluation and publication.
- Independent Evaluation gates authoritative Report publication.
- Runtime identity never replaces durable Task or Artifact identity.
- Runtime participants keep separate private contexts and share bounded institutional truth through the Kernel.
- Credentials remain operator-owned and absent from repository evidence.
- Windows is the primary release and acceptance platform.
- A mock, fixture, synthetic responder, or markdown file is never presented as live capability.
- The agent that builds a change is not its verifier.

## Lineage and license

QuantFlow is a fork of [Collaborator](https://github.com/collaborator-ai/collab-public) (`collab-electron`), whose Canvas, tile system, and terminal architecture form the inherited surface layer. The Kernel, Ontology, governed participant plane, research workflows, and verification system are QuantFlow work.

License: [FSL-1.1-ALv2](LICENSE.md).

Approved planning: [Official Roadmap](docs/plans/OFFICIAL-ROADMAP.md) ·
[Institution Contracts](docs/plans/INSTITUTION-CONTRACTS.md) ·
[Product Surface](docs/plans/PRODUCT-SURFACE-AND-WORKFLOW-ARCHITECTURE.md) ·
[Demo Spec](docs/plans/DEMO-SPEC.md). Build authority remains NEXT.
