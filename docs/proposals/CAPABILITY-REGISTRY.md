# CAPABILITY-REGISTRY.md — external systems, classified

status: **NON-AUTHORITATIVE** — dated research inventory; authorizes no installation or build
swept: 2026-08-12; product-facing reclassification: 2026-09-28
companion to: archived `docs/history/proposals/V2-SCOPE.md`

> **Relevant to QuantFlow never means Dock item.** The current accepted paths are in §4. The
> job-to-equipment map in §5 is an end-state hypothesis, not a card, dependency, licence, or order.
> The August sweep below it is historical research. Only `NEXT.md` opens a bounded work order.

---

## 1. Historical 2026-08-12 sweep — not current coverage

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

## 2. Useful classification inside the research — not repository authority

`Projects\QuantFlow\Research\library-inventory\DOCTRINE-LIBRARY-CORRELATIONS.md`
(2026-07-22) already maps tools to doctrine phases with explicit traps. It is a
better classification than anything re-derived from a keyword sweep, and this
registry uses it as a research lead. Current repository authority and source/acceptance evidence
supersede any old Vault plan. Its useful screening rule was:

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

## 4. CURRENT — accepted bounded product paths

| System | Owns | QuantFlow retains | Cert |
|---|---|---|---|
| Hermes (`NousResearch/hermes-agent`) | Director, Researcher, and Critic runtime on accepted UFC path | Role, Task, evidence, evaluation, history | [W1-03](../orders/evidence/w1-03/ACCEPTANCE.md) |
| Codex CLI | Market Researcher runtime for a bounded Director-led UFC inquiry | Same role/grants/Task/Artifact ownership; Codex-specific launch stays adapter work | [W2-01](../orders/evidence/WO-W2-01/ACCEPTANCE.md); full dialogue remains W2-02 |
| Bovada Live Markets | Current public UFC market observations | Quote identity, timing, availability, and permitted role use | W1-03 and W2-01 accepted paths |
| UFC Historical Evidence · Research Lab | Bounded official history and transparent descriptive calculation | Dataset/Run/Artifact lineage; no matchup probability claim | [W1-03](../orders/evidence/w1-03/ACCEPTANCE.md) |
| MCP (`@modelcontextprotocol/sdk`) | Authorized tool transport | Generated surface; Kernel validates | In use on accepted paths |
| Electron · Bun · SQLite · Monaco · xterm | Implementation substrate | Kernel truth and Canvas projections | Not Dock items |

**Rule:** an external CLI, model, or library is not a Participant merely because it runs. The
deterministic `qf-proof` participant is QA-only and never receives a production Dock card. A current
entry here proves only the exact job in its acceptance receipt.

## 5. Candidate Dock jobs — the full personal analytics desk

These are concrete consumers for the [approved roadmap](../plans/OFFICIAL-ROADMAP.md#6-critical-path).
Names after the dash are **possible implementations to re-check at admission**, not required packages.
The user-facing Dock entry leads with its job; underlying libraries remain inspectable provenance.

| Job / prospective entry | Dock class and candidate equipment | What Ryan or a participant would use it for | Earliest proof before admission |
|---|---|---|---|
| Shared Evidence Table and scientific Research Lab | Tool; existing Lab plus a fitted grid such as Perspective and bulk query with DuckDB/Polars | Inspect exact rows, then change a real population/assumption and get a new governed Run | W2-02 shared row first; later compare old/new Run and invalidate prior review correctly. Bulk query bytes never become a second truth store. |
| Outcome Review | Tool/Data; exact official result, settlement, and qualifying price capture | Link a frozen forecast or PASS to what later happened; inspect the whole screened cohort | One prospective claim, missing/void/corrected cases, score versus original cutoff; no hindsight rewrite. |
| Prediction Bench | Tool/Method; simple statistical baseline with scikit-learn or statsmodels, then PyMC/MAPIE/other challenger if justified | Estimate one precisely defined UFC or NFL prop probability with uncertainty | Permitted point-in-time rows, time-ordered holdout, calibration/error against simple comparators, then forward cases. |
| Football Evidence | Data; permitted Bovada NFL markets plus source-timed nflverse or other rights-cleared statistics | Analyze one real player-prop family | Verify player/game/market/settlement identity, timing, coverage, rights, and later outcome. PFF is rights-gated, not an automatic source. |
| Scenario and Combination Lab | Tool/Method; transparent simulation and simple search before OR-Tools or learned search | Vary supported conditions; research up to four correlated selections using actual eligibility and combined terms | Single-leg forecasts first, tested joint assumptions, current quoted terms, explicit unpriced/unknown outcome, no stake control. |
| Film and Transcript Evidence | Data/Tool; source-linked media/transcript; Whisper, then CVAT/FiftyOne labels and RF-DETR/ByteTrack only for measured extraction jobs | Check a disputed moment or derive a declared feature | Legal source, exact time reference, manual/reference labels, measured extraction error; a detector does not prove player identity or game truth. |
| Document Research | Data/Tool; Docling for permitted documents and OpenAlex/Crossref/Zotero as discovery/reference candidates | Find a relevant method or cited passage without mistaking it for pre-event game evidence | Exact source/page/version, permitted use, role grant, source-fitness label, no instruction uptake from external text. |
| Local specialist | Participant runtime or Tool according to the actual job; Unsloth is a candidate for narrow adaptation | Improve a defined extraction, procedure, or critique task | Held-out comparison versus untuned assistant/simple rule, no source leakage, reversible version. Fine-tuning does not create a calibrated prop predictor. |
| Research policy / RL | Method/Tool; simple scripted/random/search baselines, PufferLib only if the environment earns it | Choose the next permitted research action or rank/reject candidates under a budget | Trustworthy replay environment and reward, held-out/forward comparison, proxy-gaming check; never wager or size stakes. |
| Bounded compute and later participants | Compute/Participant; local resources first, remote provider or Claude adapter only on a proven job | Run an expensive method or recruit another independent runtime | Measured capacity need, rights/cost/cleanup/unknown-job reconciliation; same Task/Artifact/Evaluation contract. |

Jev/TypeSafe remains an **outside advisory experiment** for comparing QuantFlow build alternatives. It
is not a current Dock entry or a substitute for a measured sports model. No candidate above is admitted
by listing it here; the order must name its consumer and prove the real app path.

Source checks before a football-data order matter: [nflverse's participation loader](https://github.com/nflverse/nflreadr/blob/main/R/load_participation.R)
describes timing and coverage that may be unsuitable for a weekly pre-game feature, while
[PFF's current terms](https://www.pff.com/terms) restrict extraction and AI-model use even for a
personal subscriber. Recheck the actual intended use and obtain suitable rights before admission.
For prediction evaluation, use a time-respecting split and calibration check such as those documented
by [scikit-learn](https://scikit-learn.org/stable/modules/calibration.html); a library name alone does
not make a forecast well calibrated.

## 6. Historical August candidates — research leads, not current selections

The table below is retained from the 2026-08-12 research sweep. Its old phase labels and triggers are
**not the current build sequence or adoption gates**. Re-evaluate any entry against the current
roadmap, data rights, and live consumer before proposing it in an order.

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

### Old RL shelf — historical Phase 6 label

`OpenPipe/ART` · `THUDM/slime` · `meta-pytorch/OpenEnv` · `kiankyars/rlvrbook` ·
Unsloth LoRA · `NVIDIA-NeMo/ProRL-Agent-Server` · PufferLib ·
`continual-learning-bench` · Zyphra plasticity work.

R13/Phase 6 are historical route labels, not current gates. The current route is the
[research-policy lane](../plans/OFFICIAL-ROADMAP.md#613-richer-evidence-specialists-research-policies-and-compute):
a defined environment, simple baselines, held-out/forward evaluation, and a useful job precede
any RL implementation. **"RL is an ontology problem before it is an ML problem"** remains a useful
warning about objective and outcome lineage, not an installation instruction.

## 7. REFERENCE — borrow the idea, never install

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

## 8. REJECTED — named traps

Straight from the correlations document's anti-pattern table. These are recorded
so they are not re-proposed as new ideas.

| Trap | Systems |
|---|---|
| **Silos** — invent a parallel `Run` type | `TradeMaster-NTU/TradeMaster` · `marketcalls/openalgo` as chassis |
| **Rebuild engines** — replace peer bus + Hermes | `statecraft-protocol/envoy` · Flue · Eve as host · Omnigent · AgentGrid · Pentagon |
| **God Object** — second world model beside the charter | `meta-pytorch/OpenEnv` or `bytedance/UI-TARS-desktop` pulled in wholesale |
| **Golden Hammer** — write-actions for pipeline-fed data | Anything wanting write actions on quotes or market events |
| Training frameworks as market plane | `scalarfield.io` · `mni-ml/framework` |

## 9. Historical decisions — founder 2026-08-12

**Modal — rejected in the 2026-08-12 vendor choice.** Cloudflare was the preferred
execution-provider direction at that time. No remote compute is currently admitted; measured capacity,
rights, cost, and a fresh order are required before any provider is selected. This preserves the old
founder decision without silently converting it into a current implementation mandate.

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

## 10. INVENTORY — catalogued, not evaluated in the old sweep

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

## 11. Standing rules

1. A registry entry is not permission. `NEXT.md` authorizes; this file does not.
2. Providers own narrow runtime, execution, retrieval, tracing, or training
   responsibilities. QuantFlow keeps the governed world, identities, tasks,
   objects, links, actions, refusals, artifacts, evaluations, and lineage.
3. No entry becomes a Dock card without a real job, admitted role/grants, capability contract, and
   normal-app acceptance; a historical ladder label does not substitute for those proofs.
4. When an entry is adopted, update §4 and record what it owns and what QuantFlow retained in the
   same change. Keep a model/library behind its capability unless it truly holds a Participant seat.
