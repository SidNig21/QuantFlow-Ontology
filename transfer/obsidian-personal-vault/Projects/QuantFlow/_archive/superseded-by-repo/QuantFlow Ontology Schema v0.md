---
tags: [quantflow, ontology, schema, phase-0]
created: 2026-07-17
status: v0.2 — founder-reviewed, state machines folded in (2026-07-18); ready to freeze as `experimental`
---

# QuantFlow ontology schema — Phase 0 draft

The L0 foundation per [[QuantFlow Rebuild Blueprint]]. Scope: **research-only v1** (no order execution), **sports betting markets first** (Bovada: UFC, tennis, football), with a market-agnostic core so equities/crypto later arrive as new `kind` values and extensions — never as clone types.

**Design laws applied** (from [[09 - Ontology Governance]]): domain first, data last · one canonical type per real thing · lifecycle `experimental → active`, closed for modification once active · every object/property/action described, because agents reason over this schema.

---

## Storage split (Kitchen Sink defense)

The Kernel holds **identity and lineage** — things with names that link to other things. Bulk time-series (odds ticks, feature matrices) live in **content-hashed Parquet files queried via DuckDB**; the Kernel holds the *pointer objects* (Dataset, OddsSeries) with hashes. An odds quote is a data row, not a Kernel object.

---

## Objects — Domain plane (what the research is about)

### `Competitor`
A participant that can be bet on: fighter, player, or team.
- `kind` — `ufc_fighter | tennis_player | team` (extensible enum; a team's sport comes from its events)
- `name` — canonical display name; aliases handled via `alias_of` self-link to keep one identity per real competitor (DRY law)
- `external_refs` — source-system IDs (Bovada participant id, dataset keys) for entity resolution

### `Event`
A scheduled real-world contest: a UFC bout, a tennis match, a football game.
- `sport` — `ufc | tennis | football` (extensible)
- `starts_at` — scheduled start (UTC); the **point-in-time fence**: no data timestamped after `starts_at` may inform a pre-event decision (Critic enforces)
- `status` — `scheduled | live | settled | void`
- `competition` — free-text tournament/league context (UFC 320, Wimbledon R16, NFL Week 3)

### `Market`
One bettable proposition offered on an Event. **One canonical type** — moneyline, spread, total, and props are `kind` values with `params`, never separate types.
- `kind` — `moneyline | spread | total | prop`
- `params` — kind-specific structure. **Props are first-class, not a stringly-typed corner** (founder's edge lives here): `prop_category` vocabulary per sport — UFC: `method (ko_tko | submission | decision) | round | round_group | itd | fighter_method combo`; tennis: `set_betting | total_games | handicap`; football: player/team props typed as adopted. Untyped props may exist only as `experimental`.
- `sides` — the named outcomes offered (e.g. `["Jones", "Miocic"]`, `["over", "under"]`)
- `correlation_group` — markets on the same Event sharing outcome dependence (fighter ML ⟷ fighter-by-KO) carry a shared group key; parlay evaluation and the Critic's correlation checks traverse this

### `OddsSeries`
The recorded price history of one Market at one book. Pointer object: `data_ref` → hashed Parquet segment(s) of timestamped quotes.
- `book` — `bovada | pinnacle | ...` — Pinnacle series serve as the sharp CLV benchmark
- `data_ref` — content hash + path of the Parquet data
- `coverage` — first/last captured timestamps, quote count (so agents can judge sufficiency without opening the file)

### `Result`
The settled truth of an Event and the grading of its Markets.
- `outcome` — structured result (winner, score/method, per-market grading `win | loss | push | void`)
- `settled_at` — when truth became known; also point-in-time fenced

---

## Objects — Research plane (the scientific machine)

### `Hypothesis`
A falsifiable research claim; the root of every lineage chain. Kills "untracked ideas."
- `claim` — the statement under test ("same-event UFC method props are priced near-independently, leaving +EV correlated parlays")
- `success_criteria` — what evaluation outcome would support it (e.g. per-leg CLV > 0 at n ≥ 200, risk_of_ruin < 5%, OOS-consistent)
- `sources` — citations grounding the claim (arXiv IDs, papers, articles); Researcher agents cite what they build on, and lineage extends *outside* the system
- `status` — `open | supported | rejected | inconclusive` (only an Evaluation-backed action may set the last three)

### `Strategy`
A versioned, parameterized betting rule set under test.
- `spec_ref` — Artifact link to the code/rules that define it (the Strategy object is identity; the Artifact is content)
- `version` — monotonic; new versions are new objects `DERIVED_FROM` the old (extend, don't mutate)
- `stake_model` — `flat | fractional_kelly | custom` — how positions are sized in backtests

### `Ticket`
**The atomic unit of the founder's betting style.** A proposed wager: one leg or a parlay of legs. Strategies emit Tickets; backtests grade them; Evaluations aggregate them. One canonical type — a single bet is a one-leg Ticket, never a separate object.
- `kind` — `single | parlay`
- `legs` — structured list: each leg = Market ref + side + price-at-selection (american/decimal) + captured_at (point-in-time fenced: the price must have been *available* then — the Critic's line-availability check)
- `combined_price` — the parlay's total odds as offered/computed
- `stake` — simulated stake under the Strategy's stake model
- `correlation_note` — declared dependence structure among legs (same-event legs must reference their `correlation_group`s); naive independence-multiplied pricing vs correlation-aware fair value is exactly where mispricing hunting happens
- `grade` — `pending | win | loss | push | void` + per-leg grades once Results settle

### `Dataset`
A versioned, content-hashed, point-in-time-correct data snapshot. Kills "garbage in."
- `kind` — `odds_history | results | features | mixed`
- `content_hash` — hash over the underlying Parquet set; identical hash = identical data, byte-for-byte
- `as_of` — the point-in-time boundary this dataset respects
- `coverage` — sports, date range, event count (agent-readable sufficiency summary)

### `Run`
**One canonical execution type.** An ingestion pull, a feature build, a backtest, and an analysis are `kind` values — never `BacktestRun`/`ScraperRun` clones (Silo defense).
- `kind` — `ingestion | feature_build | backtest | analysis`
- `status` — `queued | running | succeeded | failed | cancelled`
- `params` — full invocation parameters (reproducibility contract)
- `trace_id` — root of this run's span tree in L5

### `Artifact`
An immutable, content-addressed published output. Kills "can't reproduce it." Reports are artifacts, not a separate type.
- `kind` — `strategy_spec | code | result_set | report | trajectory`
- `content_hash` / `storage_ref` — hash + durable location (exported **before** any sandbox dies)

### `Evaluation`
A structured verdict on an Artifact/Run against a Hypothesis. Kills "it worked once." Metrics are parlay-aware: longshot styles have low hit rates and spiky ROI by design, so the honest lens is per-leg edge + simulated bankroll survival, not raw win percentage.
- `metrics` — typed metric set:
  - per-leg: `clv_avg` (vs sharp close — the north star), `leg_hit_rate`, `price_beat_rate`
  - per-ticket: `roi`, `hit_rate`, `avg_combined_price`, `sample_size`
  - **bankroll simulation (v1, resolves founder Q1):** Monte Carlo over the graded ticket population — `risk_of_ruin`, `expected_max_drawdown`, `longest_expected_losing_streak`, `p5/p50/p95 bankroll trajectories`, `kelly_growth`. For a 100-1-parlay style this is the difference between "proven system" and "survivorship story": it shows whether the bankroll survives the losing streaks the math *guarantees* will come.
  - `oos_consistency` — out-of-sample agreement across time splits
- `critic_findings_ref` — link to the triaged Critic artifact weighed in this verdict
- `verdict` — `supports | rejects | inconclusive` + confidence + rationale text

---

## Objects — Operations plane (carried from the blueprint, quant-agnostic)

`Workspace` (one canvas of work) · `AgentDefinition` (a spawnable species: Researcher, Ingestion-Collector, Backtester, Critic) · `AgentSession` (one durable live instance; L1 ledger identity) · `Task` (a unit of assigned work) · `Tool` (a capability exposed via MCP; generated from this schema) · `ExecutionEnvironment` (`local_process | local_python | cloudflare_sandbox`) · `Connection` (a typed cable between tiles).

Definitions carry over from [[QuantFlow Rebuild Blueprint]] L2; properties drafted at codegen time under the same laws.

---

## Links (all traversable by agents; that's why they're links, not properties)

| Link | From → To | Serves |
| --- | --- | --- |
| `PARTICIPATES_IN` | Competitor → Event | roster/matchup traversal |
| `OFFERED_ON` | Market → Event | market discovery per event |
| `QUOTES` | OddsSeries → Market | price history lookup |
| `SETTLES` | Result → Event | truth attachment |
| `TESTS` | Run/Strategy → Hypothesis | why does this run exist |
| `HAS_LEG` | Ticket → Market | which tickets touch this market; correlation traversal |
| `USES` | Run → Dataset/Strategy/Tool | full input manifest |
| `EXECUTES_IN` | Run → ExecutionEnvironment | where computation happened |
| `PRODUCES` | Run/AgentSession → Dataset/Artifact | output provenance (ingestion included — no separate COLLECTED_BY) |
| `DERIVED_FROM` | Dataset/Artifact/Strategy → same | version & transformation lineage |
| `EVALUATED_BY` | Artifact/Run → Evaluation | verdict attachment |
| `ASSIGNED_TO` / `DELEGATES_TO` | Task → AgentSession / Session → Session | work routing on canvas |

## Actions (initial command surface — MCP tools generate from these)

`create_hypothesis` · `register_dataset_version` · `start_run` / `cancel_run` / `retry_run` / `close_run` · `publish_artifact` · `record_evaluation` · `resolve_hypothesis` (Evaluation-gated) · `request_approval` / `approve` / `deny` (pending-context-item gate, L2) · `promote_type` (`experimental → active`, schema governance itself as an action)

---

## State machines (folded in 2026-07-18, from the actor-system thread)

**Every stateful type ships a legal-transition table, not a flat enum.** The Kernel must answer: *what state is this in, and what transitions are legal from here?* Illegal transitions are rejected at the command layer. The tables live beside the Zod types and **generate the conformance tests** — for every state, every illegal transition gets an auto-generated rejection test.

```
Run:        queued → running → (succeeded | failed | cancelled); terminal states → ∅
Hypothesis: open → (supported | rejected | inconclusive); resolution only via record_evaluation-backed action; resolved → ∅
Ticket:     pending → (win | loss | push | void) via Result settlement only; graded → ∅
Event:      scheduled → live → settled; scheduled → void; settled/void → ∅
AgentSession: starting → running ⇄ blocked; running|blocked → (cancelled | failed) → closed; running → closed; closed → ∅
Dataset/Artifact/Strategy: immutable once registered — new versions are new objects via DERIVED_FROM (no status machine needed)
```

**Command vs event — the split that makes the ledger real.** A **command** is an intent that can be *rejected* (`start_run`, `submit_ticket`). An **event** is a fact that already happened and can be *replayed* (`run.started`, `ticket.graded`). Flow: command in → validate against transition table → emit event → commit → project. Actors **report** state; the Kernel **decides** it.

**No separate Receipt object.** The event log *is* the receipt log — append-only, replayable, queryable ("The Log is the Agent," arXiv 2605.21997). A parallel Receipt type would be a duplicate-truth Silo.

**Two-level boundary (Law F).** The Kernel knows *operational* states (`Run: queued → running`). It must never model *actor-internal* states (`THINKING → TOOL_CALLING → WAITING`) — those are the runtime's private business, visible only through L5 trace spans. Modeling agent internals in the ontology is the God Object path.

**Fork boundary.** Actor state is forkable **up to the first side effect**. Ingestion runs (external fetches) and artifact publication are hard boundaries forking never crosses — you cannot un-call an API. Research-only v1 keeps the side-effect surface tiny, which is what makes forked counterfactual trajectories (the RL-v2 substrate) viable here.

## Anti-pattern checklist (talk 09, applied)

| Anti-pattern | Defense in this schema |
| --- | --- |
| God Object | Event ≠ Market ≠ Result — three real things, three types |
| Kitchen Sink | Bulk quotes stay in Parquet; Kernel holds pointer objects only |
| Silos | One `Run`, one `Market`, one `Artifact` — `kind` discriminates, links extend |
| Action Sprawl | One action per state transition; no per-sport action variants |
| Golden Hammer | Odds/results arrive via ingestion Runs (pipeline), not hand-edit actions |
| Misnomer | Every name above is the domain word a bettor/researcher would say; all described |

## Founder review — RESOLVED (2026-07-17)

1. **Bankroll:** v1 gets **Monte Carlo bankroll simulation inside Evaluation** (risk of ruin, expected drawdown, losing-streak length, trajectory percentiles) — essential for the founder's longshot-parlay style, where survival math *is* the system test. A persistent live `Bankroll` ledger object is deferred to v2 (research-only scope holds).
2. **Multi-book:** yes — Bovada primary + best-available sharp reference (Pinnacle closes where obtainable) for CLV. Polymarket/prediction markets: **no pivot**; the schema's `book` field can absorb them later as just another source if ever wanted. Scope stays sportsbooks.
3. **Props:** promoted to **first-class priority** — typed prop vocabularies (UFC method/round/ITD first) land in v0.1, not later; props + correlation groups are where the founder's edge thesis lives. The new `Ticket` object (single|parlay with legs, correlation notes, per-leg grades) is the direct consequence.

## Future extensions (reserved, deliberately unbuilt)

The schema reserves naming space so these arrive as extensions, never as remodels — per the founder: *prove the ontology first*.

- **RL strategy discovery (PufferLib):** a gym environment is an `ExecutionEnvironment` of kind `rl_gym`; training is a `Run` of kind `rl_training`; a learned policy is a `Strategy` version whose `spec_ref` artifact is a checkpoint; reward functions are built from `Evaluation` metrics (CLV, risk-of-ruin-penalized growth); replay/training data are `Dataset`s. **Every noun RL needs already exists** — the extension is new `kind` values, zero new object types. Parked until the defining workflow runs end to end.
- **Research corpus / recall layer** (Cerebras doctrine, [[Cerebras Knowledge Base - Retrieval Layer Notes]]): arXiv papers live as `Hypothesis.sources` citations now; a `Source` object with ingestion runs arrives as an extension when paper-driven research becomes systematic. The v0.1 obligation is only this: **trajectory and report Artifacts are stored distilled** (question/approach/resolution/systems-touched — never raw transcripts), so the future recall layer inherits an embed-ready corpus for free. Iron rule reserved with it: retrieval results are evidence, never state — corpus → Kernel only through a command.

**Next:** freeze v0.1 as `experimental` → Zod codegen spike (schema → SQL migrations + MCP tools + docs, proving the L0→L3 pipeline).
