# QuantFlow ontology schema — v0.2

> **FROZEN 2026-07-18 as `experimental` (WO-002); amended to v0.2 same day (WO-002b: state machines — transition tables, command/event split, fork boundary).** All types below carry lifecycle `experimental`: they may be refined by work order during the codegen era, but drift without an order is a defect. Promotion to `active` closes a type for modification (extension via links/kinds only) and happens by the `promote_type` action, per order.
> Scope: **research-only v1** (no order execution), **sports betting first** (Bovada: UFC, tennis, football), with a market-agnostic core so other markets later arrive as new `kind` values — never as clone types.

**Design laws applied:** domain first, data last · one canonical type per real thing · lifecycle `experimental → active`, closed for modification once active · every object/property/action described, because agents reason over this schema.

---

## Storage split (Kitchen Sink defense)

The Kernel holds **identity and lineage** — things with names that link to other things. Bulk time-series (odds ticks, feature matrices) live in **content-hashed Parquet files queried via DuckDB**; the Kernel holds the *pointer objects* (Dataset, OddsSeries) with hashes. An odds quote is a data row, not a Kernel object.

---

## Objects — Domain plane (what the research is about)

### `competitor`
A participant that can be bet on: fighter, player, or team.
- `kind` — `ufc_fighter | tennis_player | team` (extensible enum; a team's sport comes from its events)
- `name` — canonical display name; aliases handled via `alias_of` self-link to keep one identity per real competitor
- `external_refs` — source-system IDs (Bovada participant id, dataset keys) for entity resolution

### `event`
A scheduled real-world contest: a UFC bout, a tennis match, a football game.
- `sport` — `ufc | tennis | football` (extensible)
- `starts_at` — scheduled start (UTC); the **point-in-time fence**: no data timestamped after `starts_at` may inform a pre-event decision (Critic enforces)
- `status` — `scheduled | live | settled | void`
- `competition` — free-text tournament/league context (UFC 320, Wimbledon R16, NFL Week 3)

### `market`
One bettable proposition offered on an Event. **One canonical type** — moneyline, spread, total, and props are `kind` values with `params`, never separate types.
- `kind` — `moneyline | spread | total | prop`
- `params` — kind-specific structure. **Props are first-class, not a stringly-typed corner** (the founder's edge lives here): `prop_category` vocabulary per sport — UFC: `method (ko_tko | submission | decision) | round | round_group | itd | fighter_method combo`; tennis: `set_betting | total_games | handicap`; football: player/team props typed as adopted. Untyped props may exist only as `experimental`.
- `sides` — the named outcomes offered (e.g. `["Jones", "Miocic"]`, `["over", "under"]`)
- `correlation_group` — markets on the same Event sharing outcome dependence (fighter ML ⟷ fighter-by-KO) carry a shared group key; parlay evaluation and the Critic's correlation checks traverse this

### `odds_series`
The recorded price history of one Market at one book. Pointer object: `data_ref` → hashed Parquet segment(s) of timestamped quotes.
- `book` — `bovada | pinnacle | ...` — Pinnacle series serve as the sharp CLV benchmark
- `data_ref` — content hash + path of the Parquet data
- `coverage` — first/last captured timestamps, quote count (so agents can judge sufficiency without opening the file)

### `result`
The settled truth of an Event and the grading of its Markets.
- `outcome` — structured result (winner, score/method, per-market grading `win | loss | push | void`)
- `settled_at` — when truth became known; also point-in-time fenced

---

## Objects — Research plane (the scientific machine)

### `hypothesis`
A falsifiable research claim; the root of every lineage chain. Kills "untracked ideas."
- `claim` — the statement under test ("same-event UFC method props are priced near-independently, leaving +EV correlated parlays")
- `success_criteria` — what evaluation outcome would support it (e.g. per-leg CLV > 0 at n ≥ 200, risk_of_ruin < 5%, OOS-consistent)
- `sources` — citations grounding the claim (arXiv IDs, papers, articles); Researcher agents cite what they build on, and lineage extends *outside* the system
- `status` — `open | supported | rejected | inconclusive` (only an Evaluation-backed action may set the last three)

### `strategy`
A versioned, parameterized betting rule set under test.
- `spec_ref` — Artifact link to the code/rules that define it (the Strategy object is identity; the Artifact is content)
- `version` — monotonic; new versions are new objects `DERIVED_FROM` the old (extend, don't mutate)
- `stake_model` — `flat | fractional_kelly | custom` — how positions are sized in backtests

### `ticket`
**The atomic unit of the founder's betting style.** A proposed wager: one leg or a parlay of legs. Strategies emit Tickets; backtests grade them; Evaluations aggregate them. One canonical type — a single bet is a one-leg Ticket, never a separate object.
- `kind` — `single | parlay`
- `legs` — structured list: each leg = Market ref + side + price-at-selection (american/decimal) + captured_at (point-in-time fenced: the price must have been *available* then — the Critic's line-availability check)
- `combined_price` — the parlay's total odds as offered/computed
- `stake` — simulated stake under the Strategy's stake model
- `correlation_note` — declared dependence structure among legs (same-event legs must reference their `correlation_group`s); naive independence-multiplied pricing vs correlation-aware fair value is exactly where mispricing hunting happens
- `grade` — `pending | win | loss | push | void` + per-leg grades once Results settle

### `dataset`
A versioned, content-hashed, point-in-time-correct data snapshot. Kills "garbage in."
- `kind` — `odds_history | results | features | mixed`
- `content_hash` — hash over the underlying Parquet set; identical hash = identical data, byte-for-byte
- `as_of` — the point-in-time boundary this dataset respects
- `coverage` — sports, date range, event count (agent-readable sufficiency summary)

### `run`
**One canonical execution type.** An ingestion pull, a feature build, a backtest, and an analysis are `kind` values — never `BacktestRun`/`ScraperRun` clones (Silo defense).
- `kind` — `ingestion | feature_build | backtest | analysis`
- `status` — `queued | running | succeeded | failed | cancelled`
- `params` — full invocation parameters (reproducibility contract)
- `trace_id` — root of this run's span tree in L5

### `artifact`
An immutable, content-addressed published output. Kills "can't reproduce it." Reports are artifacts, not a separate type.
- `kind` — `strategy_spec | code | result_set | report | trajectory`
- `content_hash` / `storage_ref` — hash + durable location (exported **before** any sandbox dies)

### `evaluation`
A structured verdict on an Artifact/Run against a Hypothesis. Kills "it worked once." Metrics are parlay-aware: longshot styles have low hit rates and spiky ROI by design, so the honest lens is per-leg edge + simulated bankroll survival, not raw win percentage.
- `metrics` — typed metric set:
  - per-leg: `clv_avg` (vs sharp close — the north star), `leg_hit_rate`, `price_beat_rate`
  - per-ticket: `roi`, `hit_rate`, `avg_combined_price`, `sample_size`
  - **bankroll simulation (v1):** Monte Carlo over the graded ticket population — `risk_of_ruin`, `expected_max_drawdown`, `longest_expected_losing_streak`, `p5/p50/p95 bankroll trajectories`, `kelly_growth`. For a longshot-parlay style this is the difference between "proven system" and "survivorship story."
  - `oos_consistency` — out-of-sample agreement across time splits
- `critic_findings_ref` — link to the triaged Critic artifact weighed in this verdict
- `verdict` — `supports | rejects | inconclusive` + confidence + rationale text

---

## Objects — Operations plane (quant-agnostic)

`workspace` (one canvas of work) · `agent_definition` (a spawnable species: Researcher, Ingestion-Collector, Backtester, Critic) · `agent_session` (one durable live instance; L1 ledger identity) · `task` (a unit of assigned work) · `tool` (a capability exposed via MCP; generated from this schema) · `execution_environment` (`local_process | local_python | cloudflare_sandbox`) · `connection` (a typed cable between tiles).

Properties drafted at codegen time under the same laws (see ROADMAP WO-003/WO-005).

---

## Links (all traversable by agents; that's why they're links, not properties)

| Link | From → To | Serves |
|---|---|---|
| `participates_in` | competitor → event | roster/matchup traversal |
| `offered_on` | market → event | market discovery per event |
| `quotes` | odds_series → market | price history lookup |
| `settles` | result → event | truth attachment |
| `tests` | run/strategy → hypothesis | why does this run exist |
| `has_leg` | ticket → market | which tickets touch this market; correlation traversal |
| `uses` | run → dataset/strategy/tool | full input manifest |
| `executes_in` | run → execution_environment | where computation happened |
| `produces` | run/agent_session → dataset/artifact | output provenance (ingestion included) |
| `derived_from` | dataset/artifact/strategy → same | version & transformation lineage |
| `evaluated_by` | artifact/run → evaluation | verdict attachment |
| `assigned_to` / `delegates_to` | task → agent_session / session → session | work routing on canvas |

## Actions (initial command surface — MCP tools generate from these)

`create_hypothesis` · `register_dataset_version` · `start_run` / `cancel_run` / `retry_run` / `close_run` · `publish_artifact` · `record_evaluation` · `resolve_hypothesis` (Evaluation-gated) · `request_approval` / `approve` / `deny` (pending-context-item gate, L2) · `promote_type` (`experimental → active`, schema governance itself as an action)

---

## State machines (v0.2 amendment)

**Every stateful type carries a legal-transition table, not a flat enum.** The Kernel must answer: *what state is this in, and what transitions are legal from here?* Illegal transitions are rejected at the command layer. The tables live beside the Zod types and **generate the conformance tests** — for every state, every illegal transition gets an auto-generated rejection test (lands via WO-003).

```
run:            queued → running → (succeeded | failed | cancelled); terminal → ∅
hypothesis:     open → (supported | rejected | inconclusive), only via record_evaluation-backed action; resolved → ∅
ticket:         pending → (win | loss | push | void), only via result settlement; graded → ∅
event:          scheduled → live → settled; scheduled → void; settled/void → ∅
agent_session:  starting → running ⇄ blocked; running|blocked → (cancelled | failed) → closed; running → closed; closed → ∅
dataset / artifact / strategy: immutable once registered — new versions are new objects via DERIVED_FROM (no machine needed)
```

**Command vs event — the split that makes the ledger real.** A **command** is an intent that can be *rejected* (`start_run`, `submit_ticket`). An **event** is a fact that already happened and can be *replayed* (`run.started`, `ticket.graded`). Flow: command in → validate against transition table → emit event → commit → project. Actors **report** state; the Kernel **decides** it. **There is no separate Receipt type — the append-only event log is the receipt log.** A parallel receipt object would be a duplicate-truth Silo.

**Two-level boundary (Law F, `docs/BLUEPRINT.md`).** The Kernel models *operational* states only (`run: queued → running`). Actor-internal states (`THINKING → TOOL_CALLING → WAITING`) are the runtime's private business, visible only as L5 trace spans — never as ontology types.

**Fork boundary.** Actor state is forkable **up to the first side effect**. Ingestion runs (external fetches) and artifact publication are hard boundaries forking never crosses — an API call cannot be un-sent. Research-only v1 keeps the side-effect surface small, which is what makes forked counterfactual trajectories (the RL-v2 substrate) viable.

**Distilled-artifact obligation (recall-layer seed).** `trajectory` and `report` artifacts are stored **distilled** (question / approach / resolution / systems touched) — never as raw transcripts — so the future recall layer inherits an embed-ready corpus. Iron rule reserved with it: retrieval results are evidence, never state; corpus content enters the Kernel only through a command.

---

## Anti-pattern checklist

| Anti-pattern | Defense in this schema |
|---|---|
| God Object | event ≠ market ≠ result — three real things, three types |
| Kitchen Sink | Bulk quotes stay in Parquet; Kernel holds pointer objects only |
| Silos | One `run`, one `market`, one `artifact` — `kind` discriminates, links extend |
| Action Sprawl | One action per state transition; no per-sport action variants |
| Golden Hammer | Odds/results arrive via ingestion Runs (pipeline), not hand-edit actions |
| Misnomer | Every name is the domain word a bettor/researcher would say; all described |

## Future extensions (reserved, deliberately unbuilt)

- **RL strategy discovery (PufferLib):** gym = `execution_environment` kind `rl_gym`; training = `run` kind `rl_training`; a learned policy = a `strategy` version whose `spec_ref` artifact is a checkpoint; rewards built from `evaluation` metrics. Every noun RL needs already exists — the extension is new `kind` values, zero new object types. Parked until the defining workflow runs end to end.
- **Research corpus / recall layer ("L5.5"):** arXiv papers live as `hypothesis.sources` citations for now; a future retrieval layer (distill-then-embed, FTS5 + sqlite-vec hybrid) treats retrieval results as **evidence, never state** — nothing becomes authoritative without passing through a Kernel command.
