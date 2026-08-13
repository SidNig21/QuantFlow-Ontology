# CAPABILITY-REGISTRY.md — external systems, classified

status: **NON-AUTHORITATIVE** — inventory only, authorizes nothing
swept: 2026-08-12
companion to: `V2-SCOPE.md`

> **Relevant to QuantFlow never means Dock item.** This file exists so useful
> research is preserved without every release becoming architecture. An entry
> here is parked until its named trigger fires and `NEXT.md` authorizes a
> bounded work order.

---

## 1. What was swept

| Source | Notes | Role |
|---|---|---|
| `Obsidian\Personal` (transferred from Linux 2026-08-12) | 145 | The research library — 71 notes under `Projects\QuantFlow\Research` |
| `Obsidian\QuantFlow Vault` | 52 | Planning and conversation notes |
| repo `docs/` | 216 | Authority set, debt, prior horizon inventory |
| **Total** | **413** | 3,628,771 characters |

Extracted: **1,650 URLs · 173 distinct hosts · 70 GitHub repositories · 205 arXiv papers.**

**The prior sweep was wrong about the evidence base.** On 2026-08-12 I reported
that roughly twenty items in the scope assignment's seed list had no research
behind them. That was true of the Windows vault alone. With the Linux vault
transferred, the picture inverts: the research is large, tiered, and already
classified.

## 2. The authority inside the research

`Projects\QuantFlow\Research\library-inventory\DOCTRINE-LIBRARY-CORRELATIONS.md`
(2026-07-22) already maps tools to doctrine phases with explicit traps. It is a
better classification than anything re-derived from a keyword sweep, and this
registry treats it as the primary source. Its governing rule:

> Only list a library tool if it serves a **named doctrine use case**. No engine
> rebuilds. No competitor chassis.

Supporting indexes, all present:

- `Full Sweep\Full Sweep Index.md` — 203 URLs fetched, evidence-quoted, tiered
- `library-inventory\FULL-INVENTORY.md` (106 KB) — the complete inventory
- `QUANTFLOW_RESEARCH_LIBRARY.md` — the raw 286-URL library
- `Library Deep Dive\Batch A–C` — architecture, intelligence layer, dark horses
- `DevCon6\00–09` + `Attachments\QuantFlow\DevCon6` — the ten Palantir talks with captures
- `arxiv-leverage\` — per-paper deep reads

## 3. Decision vocabulary

```
CURRENT        in the product today
CANDIDATE      researched, has a named adoption trigger
REFERENCE      borrow the idea, never install the thing
INVENTORY      catalogued, not yet evaluated
REJECTED       named as a trap by the doctrine
```

---

## 4. CURRENT — in the product today

| System | Owns | QuantFlow retains | Cert |
|---|---|---|---|
| Hermes (`NousResearch/hermes-agent`) | Agent runtime, native TUI seat | Identity, capability scope, task, evidence | L0–L3; L4 blocked by first-action stall |
| Claude Code | Agent runtime, second species | Same contract as Hermes | L0–L3 via R4 |
| MCP (`@modelcontextprotocol/sdk`) | Tool transport | Tool surface generated from schema; Kernel validates | in use |
| Electron · Bun · SQLite · Monaco · xterm | Implementation substrate | — | not Dock items |

**Rule:** a CLI receives a production Dock card only at L3 or above.
`claude-code-ungranted` fails this today and belongs in the QA inventory.

## 5. CANDIDATE — researched, trigger named

Phase labels are from the correlations document; triggers are the adoption gates.

| System | Class | Trigger |
|---|---|---|
| **Effect** (`effect.website`) | Durable retries on long Runs | Doctrine-named for Phase 4. First Run that needs typed retry across a long horizon |
| **Ragas** (`docs.ragas.io`) | Critic scoring → `record_evaluation` | V2-4, when the critic needs a scoring rubric beyond verdict + rationale |
| **ArkSim / arklex.ai** | Synthetic multi-turn seat test | Cold-seat proof that generated tools are usable without live market risk |
| **Databento ↔ LEAN** | Vendor feed → Dataset pattern | First real market ingest. Pattern only — never LEAN as chassis |
| **Jesse indicators** | Indicator math in a Python sidecar | Results become Artifacts, never new ontology types |
| **DuckDB / MotherDuck** | Bulk series store | Kernel holds pointers only. No second truth store |
| **Cerebras KB method** | Distill-then-embed, hybrid retrieval | Phase 5 recall. Never embed raw transcripts |
| **RivetKit · Restate · Temporal · DBOS** | Durable execution | `DEBT.md` #17 — first orchestrator Run that dies mid-flight and cannot resume |
| **Cloudflare Workflows / Sandbox / Browser** | Execution provider | `RESEARCH.md` horizon inventory triggers |
| **OpenTelemetry** | Cross-boundary tracing | Bounded local receipts cannot diagnose a repeated production failure |
| **WebMCP** | Browser tool surface | A browser source with a stable tool surface beats the capture path |
| **`thellimist/clihub`** | Hot external MCP → static CLI | After the generated tool plane is stable and an external vendor MCP is hot |
| **`agent0ai/dox`** | Auto-regen `AGENTS.md` on tool-surface change | Tool surface churn starts breaking seat instructions |
| **`konsistent`** | Lint codegen output shape | Next generator change (relates to `DEBT.md` #3) |
| **`raindrop-ai/workshop`** | Local span/eval loop | Steal the UX; spans stay in SQLite, not their cloud |
| **`aauth.dev`** | Signed consent for external MCP calls | First seat calling a paid external vendor |
| **Modal** | Remote compute | A Run exceeds local Windows capacity. **See §8 conflict** |

### RL shelf — Phase 6, gated on Evaluation history

`OpenPipe/ART` · `THUDM/slime` · `meta-pytorch/OpenEnv` · `kiankyars/rlvrbook` ·
Unsloth LoRA · `NVIDIA-NeMo/ProRL-Agent-Server` · PufferLib ·
`continual-learning-bench` · Zyphra plasticity work.

Trigger unchanged: R13 accepted, RL authorized, and enough real Evaluation
history to define a non-leaking holdout. The doctrine's own line governs this
shelf — **"RL is an ontology problem before it is an ML problem."**

## 6. REFERENCE — borrow the idea, never install

| Source | What is borrowed |
|---|---|
| Palantir DevCon6 (10 talks, captured) | Four primitives; tools generated from schema; descriptions as agent context; DDD ordering; extend-don't-mutate |
| Palantir Ontology / OSDK / Object Timeline / SuperRepo | Doctrine reference only — Foundry-gated, nothing to install |
| Frank Coyle, AIE 2026 | The two gates: input shape, output coherence |
| `BuilderIO/agent-native` | One schema definition → many surfaces. The shape, not the host |
| `BuilderIO/skills`, `davidondrej/skills`, `dzhng/skills` | How to write load-bearing descriptions |
| `Vocs` | In-repo MDX playbooks for glossary and rubrics |
| "The Log is the Agent" (arXiv 2605.21997) | Event-sourced, forkable agentic systems |
| Bridgewater Pocket Analyst (LangChain Interrupt 26) | Triage discipline for feed relevance |
| Applied Compute | Complete task attempt over isolated turns; model/context/harness as separate levers |

## 7. REJECTED — named traps

Straight from the correlations document's anti-pattern table. These are recorded
so they are not re-proposed as new ideas.

| Trap | Systems |
|---|---|
| **Silos** — invent a parallel `Run` type | `TradeMaster-NTU/TradeMaster` · `marketcalls/openalgo` as chassis |
| **Rebuild engines** — replace peer bus + Hermes | `statecraft-protocol/envoy` · Flue · Eve as host · Omnigent · AgentGrid · Pentagon |
| **God Object** — second world model beside the charter | `meta-pytorch/OpenEnv` or `bytedance/UI-TARS-desktop` pulled in wholesale |
| **Golden Hammer** — write-actions for pipeline-fed data | Anything wanting write actions on quotes or market events |
| Training frameworks as market plane | `scalarfield.io` · `mni-ml/framework` |

## 8. Conflicts — ruled by the founder 2026-08-12

**Modal — REJECTED.** Cloudflare is the execution-provider answer. Modal is not
a candidate and should not be re-proposed on capacity pressure; that trigger is
withdrawn. If local Windows capacity is ever exceeded, the question is which
Cloudflare surface, not whether to add a second vendor. Supersedes the Modal row
in `RESEARCH.md`'s horizon inventory.

**Eve — PARKED.** Founder likes it; not in use and not scheduled. It stays in
the registry in its *reference* role only — the `defineEval` and session-scoped
state patterns. Eve as a host remains a rebuild-engine trap. No V2 slice depends
on it, and adopting it needs a fresh decision, not this entry.

**Hermes version — DELIBERATELY UNPINNED.** Founder ruling: Hermes moves fast
and tracking it is not worth the cost. QuantFlow therefore treats Hermes as a
moving upstream and must not assume any version-specific behaviour. Two
consequences the build has to respect: adapter certification claims are valid
only for the version measured on the day, and any Hermes-specific workaround
carries a comment saying it may evaporate on the next update. The 4,192-commits
-behind report is informational, not a defect.

## 9. INVENTORY — catalogued, not evaluated

The sweep found **173 distinct hosts**. Roughly 120 appear 5–6 times each,
which is the signature of a bulk link-list capture rather than a studied
candidate. They are already tiered inside `Full Sweep Index.md` (203 URLs, 25
honestly flagged low-confidence) and are not re-listed here.

Newly surfaced and worth a look when their area comes up:

- **`flashscore.com`, `tennis.com`** — live sports data sources. Nothing in any
  plan references them, and market-plane data quality is a repeatedly flagged gap.
- **`anomalyco/terminal-control`** — already in `DEBT.md` #8; the vault now
  supplies the source (`Executor + Terminal Control.md`, 11.5 KB).
- **`UsefulSoftwareCo/executor`, `RhysSullivan/executor`** — two different
  projects sharing a name; `DEBT.md` #8 does not say which it means.
- **`GiannoKlein9/HermesFusion`** — multi-model panel on a contested Artifact.
  Relevant to V2-4 if two critics ever disagree.
- **`shepherd-agents.ai`** — fork/revert a Run trajectory at the critic without
  re-ingesting the Dataset.
- **`microsoft/MarS`** — market simulation. Relevant to the calibration loop.
- **`ceobench.com`, `continual-learning-bench.com`** — evaluation benchmarks.

## 10. Standing rules

1. A registry entry is not permission. `NEXT.md` authorizes; this file does not.
2. Providers own narrow runtime, execution, retrieval, tracing, or training
   responsibilities. QuantFlow keeps the governed world, identities, tasks,
   objects, links, actions, refusals, artifacts, evaluations, and lineage.
3. No entry becomes a Dock card without passing the adapter ladder to L3.
4. When an entry is adopted, move it to CURRENT and record what it owns and what
   QuantFlow retained — in the same commit.
