# RESEARCH.md — the borrowed principles, and the shelf they came from

> The condensed keystone. QuantFlow is built on ideas taken deliberately from a 286-URL research library, ten DevCon6 talks, and a handful of papers. This file carries **what was borrowed and why**; the vault carries the depth.
>
> **Do not re-sweep the library.** All 203 non-search URLs were fetched, evidence-quoted, and tiered on 2026-07-17; correlated to doctrine phases on 2026-07-22. Two indexes already exist — start from them, never from the raw list.
>
> Source of truth for *direction* is [`DOCTRINE.md`](DOCTRINE.md). This file is reference: it explains where the doctrine's ideas came from and what is on the shelf for later phases.

## Where the depth lives

| Vault path (`~/Vaults/Personal/Projects/QuantFlow/Research/`) | What it is |
|---|---|
| `library-inventory/DOCTRINE-LIBRARY-CORRELATIONS.md` | **Start here.** Every relevant tool mapped to a doctrine phase, with anti-pattern traps |
| `Library Deep Dive/Full Sweep/Full Sweep Index.md` | All 203 URLs fetched + tiered; 25 honestly flagged low-confidence rather than fabricated |
| `Library Deep Dive/Batch A–C` + `Full Sweep/Batch_00–08` | Per-item detail with evidence quotes |
| `DevCon6/00–09` + hub | The ten Palantir talks, analyzed |
| `Why Agentic Systems Need Ontologies (Frank Coyle, AIE 2026).md` | The neurosymbolic argument for the two gates |
| `Cerebras Knowledge Base - Retrieval Layer Notes.md` | Record vs recall; distill-then-embed |
| `QUANTFLOW_RESEARCH_LIBRARY.md` | The raw 286-URL library. Reference of last resort |

## The borrowed principles (this is the actual keystone)

**From Palantir's DevCon6 talks — the ontology doctrine.** Four primitives (object types, properties, links, actions) plus three disciplines: one governed system of record, a tool surface *generated from* the schema, and names/descriptions treated as load-bearing agent context. *"These LLMs were not trained on your enterprise's data"* — the schema is the grounding an agent reasons over, which is why Misnomer is the worst anti-pattern. Also: DDD ordering (understand the domain → design the ontology → map source data, never the reverse), extend-don't-mutate with `experimental → active` lifecycle flags, and the six anti-patterns that became the lint table in `DOCTRINE.md` Part VI. **Verdict: borrow the doctrine, never build on the platform** — everything is Foundry-gated, there is nothing to install.

**From Frank Coyle (AIE 2026) — why the guardrail is structural, not optional.** *The agent proposes; the ontology permits.* A probabilistic loop needs a symbolic boundary, and it needs exactly two gates around every tool call: **Gate 1 · input** validates the call's shape (his Pydantic = our Zod), **Gate 2 · output** validates the result's coherence against the domain (his OWL = our transition tables, already built as WO-005's 118 conformance tests). His failure list — infinite loops, goal drift, token-cost blowups, *"a broken tool called 400 times in five minutes"* — is our proof bar. We take the doctrine, not the tooling: closed generated SQLite schema instead of RDFS/OWL/triple-store.

**From Cerebras — record vs recall.** Distill-then-embed; hybrid retrieval (FTS5 + sqlite-vec, RRF k=60, age decay). The iron rule: **retrieval results are evidence, never state.** Nothing becomes truth without a Kernel command. Our trajectory artifacts are already the distilled shape — never embed raw transcripts.

**From "The Log is the Agent" (arXiv 2605.21997).** Event-sourced, auditable, *forkable* agentic systems — our durable-ledger thesis as a paper. Read before any Run/ledger redesign.

**From the ecosystem generally — the rule that stops the loop.** Four substrate re-evaluations (agentOS, Rivet/Temporal/DuckDB, Restate/RivetKit, and counting) each produced a defensible answer and none advanced the charter. Hence the triage in `START_HERE.md` §5.8: dock item / underlayer / neither, classified on sight.

## The shelf, by phase

Only tools serving a **named** doctrine phase gate or charter action appear here. Everything else is background.

| Phase | On the shelf | Note |
|---|---|---|
| **0 · substrate** | — | **BANKED. Shopping this section is the gutter.** |
| **1 · charter** | `BuilderIO/agent-native` (one schema → many surfaces: steal the *shape*), skills repos (how to write descriptions agents act on), `konsistent` (lint charter/codegen shape) | Patterns only. Do not install hosts |
| **2 · tool plane** | `@modelcontextprotocol/sdk` (already in the repository stack), `agent0ai/dox` (regen `AGENTS.md` when the tool surface changes), `kontinuo` / `entireio/skills` (builder handoffs — desk tooling, not ontology truth) | Prefer extending `qf-kernel-schema` over any new framework |
| **3 · first market** | Databento↔LEAN as an *ingest pattern*, Hyperliquid or odds source as the data, Jesse indicators (compute in the Python sidecar → Artifact), DuckDB for bulk series | Rows, never new object types. No write-actions for pipeline-fed data |
| **4 · defining loop** | **Effect** (doctrine-named: typed retries on long Runs), **Ragas** + eve.dev eval patterns (Critic scores → `record_evaluation` → gates `publish_artifact` for `kind: "report"`), ArkSim (cold seat test of generated tools) | Skip meta-harness competitors entirely |
| **5 · recall** | Cerebras KB pattern on SQLite, WrenAI (NL query *through* generated tools), Citation-Network (papers → Artifacts) | Retrieval never becomes truth |
| **6–7 · evolve / RL** | See below | Gated on months of Evaluation history |

## The RL shelf

Scope expanded 2026-07-24 (founder). The doctrine's own Phase 6 already seeds it — *"the trajectory store is training data for your own next-gen agents"* — so this is an expansion, not a new direction. **The reading list is the most valuable part of the library.**

**Standing reference (founder, 2026-07-24):** the vault `Research/` folder is the RL source of record; the founder will hand-pick priorities from it, and this shelf is the distillation until then. Neither track decision blocks Phase 1 — both consume identical substrate (trajectories, Evaluations, fenced Datasets), and the charter seeds `Policy`/`Environment` as `experimental` either way.

**SPLIT 2026-08-12 (founder).** This shelf conflated two unrelated applications, which is why it read as one impossible topic. They share the ontology and almost nothing else.

**A · RL on the market — the priority.** Learning a betting or selection policy. Environment is the market; reward is profit, CLV, and calibration. **This is research, not platform work.** It runs as a `run.kind: "training"` Run executed by an RL worker seat hired from the Dock like any other specialist — a CLI-backed participant, PufferLib if they ship one. The seat is the Dock item; PufferLib, gym environments, and OpenEnv are the *workload* it imports inside its sandbox. This closes the triage gap recorded at `DOCTRINE.md` §351: the library was never the Dock item, the seat is. Shelf for A: environment synthesis (Gym-Anything 2604.06126, RLAnything 2602.02488, Verifiable Environment Synthesis 2605.14392), QTNet 2312.15730 for quant-RL architecture, PufferLib. First environment will be **football**; not yet specified.

**Reward signal, already built.** R11b computes `roi`, `hit_rate`, `net_profit`, and `average_clv` with push, void, and missing-settlement handled, proven against a hand-calculated fixture. Do not rebuild these for training.

**B · RL on the harness — secondary, parked.** Agents learning to use QuantFlow better. A genuine orchestrator use case, deliberately not the priority. The two tracks below belong to B.

**Two tracks within B, sharing the ontology but almost no other machinery. Which is first-class is an open founder call.**

- **Track A · the playbook improves.** Versioned skills, prompts and configs mined from trajectories, selected by Evaluation history. Bandit machinery; no gradients, no GPU. Shelf: `firstbatchxyz/watchmen`, SkillOpt (2605.23904), Neural Cheat Sheets, CEO-Bench (2606.18543). **The improvement lives in the Kernel, so it survives a species swap** — swap the brain, keep the desk's accumulated skill.
- **Track B · the weights improve.** LoRA/RL finetuning on trajectory data. Shelf: OpenPipe/ART, THUDM/slime, OpenEnv, `rlvrbook`, Unsloth LoRA + advanced-RL guides, NVIDIA ProRL-Agent-Server. **The improvement is locked inside one model** and dies with the species.

**Environment synthesis — the cluster that makes `Environment`-per-market real** rather than hand-built: Gym-Anything (2604.06126), RLAnything (2602.02488), Verifiable Environment Synthesis (2605.14392). Also QTNet (2312.15730) for quant-RL architecture, PufferLib as the long-parked gym candidate, and Zyphra's plasticity-loss work + `continual-learning-bench` for the characteristic continual-learning failure (a policy quietly forgetting last quarter's regime).

**RL is an ontology problem before it is an ML problem.** Every RL failure in markets is a provenance failure: leakage, unreproducible runs, a drifted reward, a policy nobody can trace to its training data. The Research plane is already most of an RL experiment tracker — which is why the charter comes first regardless of which track wins.

**Standing caution, stated in the open:** RL on financial markets has a brutal overfit record — non-stationarity and low signal-to-noise. That is an argument for building provenance first, not against the ambition. The ontology is what tells you whether a result is real.

## Worked example — agentOS, triaged per layer (probed 2026-07-24)

Probed at source: `agentos-sdk.dev/docs/architecture` (read in full — it 403s plain fetchers, use a browser), the v0.2 changelog on rivet.dev, and both GitHub repos via `gh`. The durable lesson: **triage runs per layer, never per brand name** — one product held all three buckets at once.

| Layer | Probed fact | Bucket |
|---|---|---|
| **Cargo agents** — Pi, plus "Claude Code, Codex, and OpenCode" (v0.2) | CLI agents wrapped by adapters (`@agentos-software/*`), sessions streamed as ACP events | **Dock items — with or without agentOS.** They are CLIs; QuantFlow can spawn them as native seats today. agentOS is evidence they speak ACP, not the thing that grants them |
| **Rivet Actor layer** (`@rivet-dev/agentos`) | Wraps the VM; workflows where each `ctx.step()` is "recorded, retried, and resumed independently"; cron; sleep/wake persistence | **Underlayer.** The durable-execution engine — ROADMAP debt #17. Trigger: the first orchestrator run that dies mid-flight and cannot resume |
| **VM + kernel layer** | Agents run in "fully virtualized Linux VMs" (userspace: WebAssembly + V8 isolates, not Docker/Firecracker); "no real host filesystem, no real host network socket, no real host process" | **Not a floor — a row.** It is an isolation boundary, not a spawner replacement. Absorbed, if ever needed, as an `execution_environment` kind |

Licensing probed at source via `gh repo view`: `rivet-dev/rivet` and `rivet-dev/agentos` are both **Apache-2.0**.

**The quarantine tier.** The dock-species doctrine ("anything with a CLI — adopt freely") has one real hole: spawning an *unvetted* CLI as a native process — your user, your real filesystem — is how a desk gets owned. The VM layer is the patch, taken as inventory rather than infrastructure: `execution_environment.kind = "host-pty"` for trusted species (Hermes, Claude Code, Codex), `"agentos-vm"` for strangers. Same dock, same canvas, same `execute()` front door; a species that earns trust graduates to a host PTY. The underlayer question dissolves into a row — the ontology absorbing a tool instead of standing on it.

**Honest unknowns:** whether Hermes runs end-to-end inside an agentOS VM (empirical, ~a day; only worth answering if the quarantine tier gets built) · "agentOS Apps" (described elsewhere as multi-tenant app hosting; unverified by this probe, and nothing turns on it).

## Anti-patterns, applied to the library itself

| Trap | What it looks like when shopping |
|---|---|
| **Silos** | A framework that invents its own parallel `Run` type (TradeMaster, OpenAlgo as chassis) |
| **Golden Hammer** | Any tool wanting write-actions for quotes and events — those are pipeline-fed |
| **God Object** | Pulling OpenEnv or UI-TARS in as a *second world model* beside the charter |
| **Rebuild engines** | Envoy / Flue / Omnigent / agentOS core as replacements for app-owned transport and seats |

---

*Condensed 2026-07-24 from two existing sweep passes. When a phase starts, read that phase's row here, then the matching section of `DOCTRINE-LIBRARY-CORRELATIONS.md`. Never the raw 286.*

## Triage — cli-printing-press (mvanhorn), classified 2026-07-26

Probed at source: GitHub README only, five minutes, per §5.8. MIT, 4.3k stars, active.
What it is: a generator — point it at an API spec, a website, or a HAR capture and it emits a
CLI tool + MCP server for that API, with a bundled SQLite data layer.

Per-layer, per the rule:

| Layer | What it is | Bucket |
|---|---|---|
| The generator itself | A CLI you invoke per task; depends on nothing of ours | **Dock item — inventory.** Adopt freely if/when a rung wants it |
| Each generated CLI/MCP server | A new standalone tool per API | **Dock item each, individually** — but see the flag below |
| The bundled SQLite data layer in its outputs | A per-tool local store | **Flag, not a bucket:** pointed at Kernel-domain data this is a second truth store on sight. Any adopted output's SQLite stays a cache/projection outside Kernel domain, or the output is not adoptable |

One line of forward relevance, logged not decided: its "browser-sniff gate" (launch a browser,
capture traffic, reverse-engineer the undocumented API) is exactly the shape of the **WO-107
external-surface probe** — the thing PROTOCOL requires before anyone may write an order asserting
how Bovada data arrives. Candidate probe instrument. Nothing turns on it until WO-107 is scoped.

## Horizon inventory — recorded, not authorized (2026-08-11)

These are inventory entries, not roadmap rungs, dependencies, or permission to build. Each stays parked until its named product failure is observed and `NEXT.md` authorizes a bounded work order.

| Item | Bucket | Trigger that would justify a work order |
|---|---|---|
| Parent-span trace tree | Underlayer | A real multi-seat failure cannot be reconstructed from current Kernel trajectories and mission/task links |
| Twelve-seat concurrency gate | Product gate | The supported consumer workflow intentionally rises above the current seat count and needs a measured finite bound |
| Data refinery | Product/data pipeline | A named Dataset or Run is blocked by raw captured data that cannot be normalized with the existing ingest path |
| Held-out evaluations | R22-R24 learning | R18-R21 have produced enough real, evaluated Missions to define a non-leaking holdout |
| Cloudflare Workflows | Underlayer candidate | The first long workflow dies mid-flight and cannot resume through existing Kernel state and app recovery |
| Cloudflare Browser/Computer | Execution-environment candidate | A named data or research task requires a remote browser/computer boundary the native Windows desk cannot safely provide |
| WebMCP | Dock/tool-surface candidate | A browser data source has a stable structured tool surface that is measurably better than the current generated-tool or capture path |
| OpenTelemetry | Underlayer candidate | Bounded local receipts cannot diagnose a repeated production failure across app, model, and tool boundaries |
| Object Timeline | UX/reference concept | The Research Ledger cannot answer a founder's concrete “what changed, when, and why?” question from Kernel history |
| Prime Agent | Neither yet | A concrete product/repository and one unmet QuantFlow gate are identified |
| AC2 | Neither yet | A concrete product/repository and one unmet QuantFlow gate are identified |
| Overeasy | Neither yet | A concrete product/repository and one unmet QuantFlow gate are identified |
| ~~Modal~~ | **REJECTED 2026-08-12 (founder)** | Cloudflare is the execution-provider answer. This trigger is withdrawn — on capacity pressure the question is which Cloudflare surface, not whether to add a second vendor |
| Voice operator | Dock/UI candidate | The founder requests hands-free operation after the keyboard/mouse R13 consumer workflow is accepted |
| Model routing | Product-policy candidate | Repeated measurements show a provider-specific latency, quality, availability, or cost failure across supported seats |

RL remains a founder priority and stays on the shelf above, not deleted. It
starts only through a fresh R22 authorization after grounded, composable, and
supervised Missions produce trustworthy trajectories, Evaluations, and fenced Datasets.

The full external classification — current, candidate, reference, rejected — lives in [`proposals/CAPABILITY-REGISTRY.md`](proposals/CAPABILITY-REGISTRY.md), swept from 413 notes on 2026-08-12. That file is inventory and confers no authority.
