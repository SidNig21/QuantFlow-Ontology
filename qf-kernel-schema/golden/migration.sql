-- qf-kernel-schema generated migration
-- DO NOT EDIT — regenerate with `bun run generate`.

-- Type-level lifecycle and descriptions (not per-row data).
CREATE TABLE schema_meta (
  -- Object, link, or action name.
  type_name TEXT PRIMARY KEY NOT NULL,
  -- Schema kind: object | link | action.
  kind TEXT NOT NULL,
  -- Type lifecycle governing modify-vs-extend rules.
  lifecycle TEXT NOT NULL CHECK (lifecycle IN ('experimental', 'active')),
  -- Agent-facing description of the type.
  description TEXT NOT NULL
);

INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('competitor', 'object', 'experimental', 'A participant that can be bet on — fighter, player, or team. One identity per real competitor; aliases stay as links, not duplicate rows.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('event', 'object', 'experimental', 'A scheduled real-world contest (UFC bout, tennis match, football game). starts_at is the point-in-time fence for pre-event decisions.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('market', 'object', 'experimental', 'One bettable proposition on an event. Moneyline, spread, total, and prop are kinds of this single type — never separate object types.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('odds_series', 'object', 'experimental', 'Recorded price history of one market at one book. Pointer object: data_ref points at hashed Parquet quote segments; the Kernel never stores tick rows.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('result', 'object', 'experimental', 'Settled truth of an event and the grading of its markets. Point-in-time fenced by settled_at.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('hypothesis', 'object', 'experimental', 'A falsifiable research claim that roots every lineage chain. Open one before datasets, tickets, or evaluations so work answers a named question.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('strategy', 'object', 'experimental', 'A versioned, parameterized betting rule set under test. Identity lives here; the code/rules content lives in a linked artifact.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('ticket', 'object', 'experimental', 'The atomic proposed wager — single or parlay. Strategies emit tickets; backtests grade them; evaluations aggregate them. A one-leg bet is still a ticket.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('dataset', 'object', 'experimental', 'A versioned, content-hashed, point-in-time-correct data snapshot. Identical content_hash means identical bytes.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('run', 'object', 'experimental', 'One canonical execution type — ingestion, feature build, backtest, or analysis via kind. Never clone types per pipeline step.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('artifact', 'object', 'experimental', 'An immutable, content-addressed published output (strategy_spec, code, result_set, report, trajectory). Reports are artifacts, not a separate type.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('evaluation', 'object', 'experimental', 'Structured verdict on an artifact/run against a hypothesis. Parlay-aware metrics: per-leg edge and bankroll survival, not raw win rate.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('workspace', 'object', 'experimental', 'One canvas of work — the spatial container for tiles, sessions, and connections in a research project.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('agent_definition', 'object', 'experimental', 'A spawnable agent species (Researcher, Ingestion-Collector, Backtester, Critic) — the template, not a live instance.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('agent_session', 'object', 'experimental', 'One durable live agent instance (L1 ledger identity). Operational states only — never actor-internal THINKING/TOOL_CALLING.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('task', 'object', 'experimental', 'A unit of assigned work on the canvas, routed to agent sessions via assigned_to / delegates_to links.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('tool', 'object', 'experimental', 'A capability exposed via MCP and generated from this schema — agents call tools; they do not invent ad-hoc side channels.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('execution_environment', 'object', 'experimental', 'Where a run executes: local process, local Python sidecar, or disposable Cloudflare sandbox.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('connection', 'object', 'experimental', 'A typed cable between tiles on the canvas — projection wiring, never a second truth store.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('participates_in', 'link', 'experimental', 'Roster/matchup edge: which competitors take part in an event.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('offered_on', 'link', 'experimental', 'Attaches a market to the event it is offered on for per-contest discovery.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('quotes', 'link', 'experimental', 'Price-history lookup: which market an odds_series records.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('settles', 'link', 'experimental', 'Truth attachment: which event a result settles.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('tests', 'link', 'experimental', 'Why this run or strategy exists — it tests a named hypothesis.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('has_leg', 'link', 'experimental', 'Which markets a ticket bets; enables correlation traversal.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('uses', 'link', 'experimental', 'Full input manifest for a run: datasets, strategies, and tools consumed.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('executes_in', 'link', 'experimental', 'Where computation for a run happened.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('produces', 'link', 'experimental', 'Output provenance: datasets or artifacts produced by a run or agent session.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('derived_from', 'link', 'experimental', 'Version and transformation lineage among datasets, artifacts, and strategies.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('evaluated_by', 'link', 'experimental', 'Verdict attachment: which evaluation judged an artifact or run.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('assigned_to', 'link', 'experimental', 'Work routing: which agent session owns a task.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('delegates_to', 'link', 'experimental', 'Session-to-session delegation on the canvas.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_hypothesis', 'action', 'experimental', 'Open a new research hypothesis with claim, success criteria, and optional sources.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('register_dataset_version', 'action', 'experimental', 'Register a new content-hashed, point-in-time dataset version in the Kernel.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('start_run', 'action', 'experimental', 'Start a queued run (queued → running). Rejectable if the transition is illegal.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('cancel_run', 'action', 'experimental', 'Cancel a running run (running → cancelled).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('complete_run', 'action', 'experimental', 'Mark a running run as succeeded (running → succeeded).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('fail_run', 'action', 'experimental', 'Mark a running run as failed (running → failed).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('retry_run', 'action', 'experimental', 'Request another attempt after failure/cancellation by creating a new queued run derived_from the prior (terminals do not reopen).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('close_run', 'action', 'experimental', 'Operator close/ack for a terminal run (no status change — succeeded/failed/cancelled are already terminal).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('grade_ticket', 'action', 'experimental', 'Grade a pending ticket to win|loss|push|void after result settlement.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('start_event', 'action', 'experimental', 'Move a scheduled event to live (scheduled → live).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('settle_event', 'action', 'experimental', 'Settle a live event (live → settled).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('void_event', 'action', 'experimental', 'Void a scheduled event that will not be contested (scheduled → void).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('register_agent_definition', 'action', 'experimental', 'Register a spawnable agent species in the Kernel registry (id = name). Duplicate names are rejected.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_agent_session', 'action', 'experimental', 'Create an agent_session by adopting a guest-minted session_id (Kernel never mints). Sets status=starting; put the species name in label until agent_definition arrives.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('start_agent_session', 'action', 'experimental', 'Bring a starting agent session into running (starting → running).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('block_agent_session', 'action', 'experimental', 'Block a running agent session (running → blocked).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('unblock_agent_session', 'action', 'experimental', 'Return a blocked agent session to running (blocked → running).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('cancel_agent_session', 'action', 'experimental', 'Cancel a running or blocked agent session (→ cancelled).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('fail_agent_session', 'action', 'experimental', 'Fail a starting, running, or blocked agent session (→ failed). Used for guest crash and boot reconciliation.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('close_agent_session', 'action', 'experimental', 'Close a running, cancelled, or failed agent session (→ closed).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('publish_artifact', 'action', 'experimental', 'Publish an immutable content-addressed artifact (must land before sandbox death).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('record_evaluation', 'action', 'experimental', 'Record a structured evaluation verdict with metrics against a hypothesis lineage.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('resolve_hypothesis', 'action', 'experimental', 'Resolve an open hypothesis to supported|rejected|inconclusive; evaluation-gated at the Kernel.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('request_approval', 'action', 'experimental', 'Request operator approval for a pending context item (L2 gate).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('approve', 'action', 'experimental', 'Approve a pending approval request.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('deny', 'action', 'experimental', 'Deny a pending approval request.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('promote_type', 'action', 'experimental', 'Promote a schema type from experimental to active (schema governance action).');

-- A participant that can be bet on — fighter, player, or team. One identity per real competitor; aliases stay as links, not duplicate rows.
CREATE TABLE competitor (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Competitor species; a team's sport comes from the events it plays.
  kind TEXT NOT NULL,
  -- Canonical display name used in markets and reports.
  name TEXT NOT NULL,
  -- Source-system IDs (Bovada participant id, dataset keys) for entity resolution.
  external_refs TEXT NOT NULL,
  CHECK (kind IN ('ufc_fighter', 'tennis_player', 'team'))
);

-- A scheduled real-world contest (UFC bout, tennis match, football game). starts_at is the point-in-time fence for pre-event decisions.
CREATE TABLE event (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Sport domain for this contest; drives prop vocabularies and coverage.
  sport TEXT NOT NULL,
  -- Scheduled start as ISO-8601 UTC; no post-start data may inform a pre-event ticket.
  starts_at TEXT NOT NULL,
  -- Contest state from schedule through settlement or void.
  status TEXT NOT NULL,
  -- Tournament or league context (UFC 320, Wimbledon R16, NFL Week 3).
  competition TEXT NOT NULL,
  CHECK (sport IN ('ufc', 'tennis', 'football')),
  CHECK (status IN ('scheduled', 'live', 'settled', 'void'))
);

-- One bettable proposition on an event. Moneyline, spread, total, and prop are kinds of this single type — never separate object types.
CREATE TABLE market (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Market family; props carry sport-specific structure in params.
  kind TEXT NOT NULL,
  -- Kind-specific parameters (lines, prop category/method/round, handicaps) as JSON.
  params TEXT NOT NULL,
  -- Named outcomes offered, e.g. ["Jones","Miocic"] or ["over","under"].
  sides TEXT NOT NULL,
  -- Shared key for same-event markets with dependent outcomes; null when independence is assumed.
  correlation_group TEXT,
  CHECK (kind IN ('moneyline', 'spread', 'total', 'prop'))
);

-- Recorded price history of one market at one book. Pointer object: data_ref points at hashed Parquet quote segments; the Kernel never stores tick rows.
CREATE TABLE odds_series (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Sportsbook source; Pinnacle series are the sharp CLV benchmark.
  book TEXT NOT NULL,
  -- Content hash plus path of the Parquet segment(s) holding timestamped quotes.
  data_ref TEXT NOT NULL,
  -- Sufficiency summary: first/last captured timestamps and quote count for agent judgment.
  coverage TEXT NOT NULL,
  CHECK (book IN ('bovada', 'pinnacle'))
);

-- Settled truth of an event and the grading of its markets. Point-in-time fenced by settled_at.
CREATE TABLE result (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Structured result (winner, score/method, per-market grading win|loss|push|void).
  outcome TEXT NOT NULL,
  -- When truth became known (ISO-8601 UTC); also a point-in-time fence.
  settled_at TEXT NOT NULL
);

-- A falsifiable research claim that roots every lineage chain. Open one before datasets, tickets, or evaluations so work answers a named question.
CREATE TABLE hypothesis (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- The statement under test in betting-research terms.
  claim TEXT NOT NULL,
  -- What evaluation outcome would support the claim (metrics, n, risk bounds).
  success_criteria TEXT NOT NULL,
  -- Citations grounding the claim (arXiv IDs, papers, articles).
  sources TEXT NOT NULL,
  -- Claim lifecycle; only evaluation-backed resolution leaves open.
  status TEXT NOT NULL,
  CHECK (status IN ('open', 'supported', 'rejected', 'inconclusive'))
);

-- A versioned, parameterized betting rule set under test. Identity lives here; the code/rules content lives in a linked artifact.
CREATE TABLE strategy (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Artifact id whose content defines this strategy's rules/code.
  spec_ref TEXT NOT NULL,
  -- Monotonic version number; new versions are new objects derived_from the old.
  version REAL NOT NULL,
  -- How positions are sized in backtests.
  stake_model TEXT NOT NULL,
  CHECK (stake_model IN ('flat', 'fractional_kelly', 'custom'))
);

-- The atomic proposed wager — single or parlay. Strategies emit tickets; backtests grade them; evaluations aggregate them. A one-leg bet is still a ticket.
CREATE TABLE ticket (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Whether this wager is one leg or a multi-leg parlay.
  kind TEXT NOT NULL,
  -- Structured legs: market ref + side + price-at-selection + captured_at as JSON objects.
  legs TEXT NOT NULL,
  -- Total odds for the ticket as offered or computed.
  combined_price REAL NOT NULL,
  -- Simulated stake under the strategy stake model.
  stake REAL NOT NULL,
  -- Declared dependence among legs (same-event legs must reference correlation_group keys).
  correlation_note TEXT NOT NULL,
  -- Settlement grade once results land; pending until then.
  grade TEXT NOT NULL,
  CHECK (kind IN ('single', 'parlay')),
  CHECK (grade IN ('pending', 'win', 'loss', 'push', 'void'))
);

-- A versioned, content-hashed, point-in-time-correct data snapshot. Identical content_hash means identical bytes.
CREATE TABLE dataset (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- What kind of research data this snapshot holds.
  kind TEXT NOT NULL,
  -- Hash over the underlying Parquet set; byte-identical data shares this hash.
  content_hash TEXT NOT NULL,
  -- Point-in-time boundary this dataset respects (ISO-8601 UTC).
  as_of TEXT NOT NULL,
  -- Agent-readable sufficiency: sports, date range, event count.
  coverage TEXT NOT NULL,
  CHECK (kind IN ('odds_history', 'results', 'features', 'mixed'))
);

-- One canonical execution type — ingestion, feature build, backtest, or analysis via kind. Never clone types per pipeline step.
CREATE TABLE run (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Which execution pipeline this run performs.
  kind TEXT NOT NULL,
  -- Operational run state; actor-internal THINKING/TOOL_CALLING are never stored here.
  status TEXT NOT NULL,
  -- Full invocation parameters — the reproducibility contract.
  params TEXT NOT NULL,
  -- Root of this run's span tree in the trace layer (L5).
  trace_id TEXT NOT NULL,
  CHECK (kind IN ('ingestion', 'feature_build', 'backtest', 'analysis')),
  CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled'))
);

-- An immutable, content-addressed published output (strategy_spec, code, result_set, report, trajectory). Reports are artifacts, not a separate type.
CREATE TABLE artifact (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Artifact family; trajectory/report must be distilled, never raw transcripts.
  kind TEXT NOT NULL,
  -- Content hash of the durable bytes.
  content_hash TEXT NOT NULL,
  -- Durable location of the bytes (exported before any sandbox dies).
  storage_ref TEXT NOT NULL,
  CHECK (kind IN ('strategy_spec', 'code', 'result_set', 'report', 'trajectory'))
);

-- Structured verdict on an artifact/run against a hypothesis. Parlay-aware metrics: per-leg edge and bankroll survival, not raw win rate.
CREATE TABLE evaluation (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Typed metric set: per-leg CLV/hit/price-beat, per-ticket ROI, Monte Carlo bankroll, OOS consistency.
  metrics TEXT NOT NULL,
  -- Artifact id of triaged Critic findings weighed in this verdict.
  critic_findings_ref TEXT,
  -- Overall evaluation verdict relative to the hypothesis.
  verdict TEXT NOT NULL,
  -- Confidence in the verdict on a 0–1 scale.
  confidence REAL NOT NULL,
  -- Human/agent-readable rationale for the verdict.
  rationale TEXT NOT NULL,
  CHECK (verdict IN ('supports', 'rejects', 'inconclusive'))
);

-- One canvas of work — the spatial container for tiles, sessions, and connections in a research project.
CREATE TABLE workspace (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Short workspace name shown on the canvas.
  name TEXT NOT NULL,
  -- Human-readable title for the research workspace.
  title TEXT NOT NULL
);

-- A spawnable agent species (Researcher, Ingestion-Collector, Backtester, Critic) — the template, not a live instance.
CREATE TABLE agent_definition (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Species name agents and operators use to request a spawn.
  name TEXT NOT NULL,
  -- Role summary (researcher, critic, backtester, ingestion) for routing and prompts.
  role TEXT NOT NULL,
  -- AgentOS package this species launches — the plug half of the row.
  package_ref TEXT NOT NULL,
  -- Artifact or prompt id that defines this species' instructions.
  system_prompt_ref TEXT
);

-- One durable live agent instance (L1 ledger identity). Operational states only — never actor-internal THINKING/TOOL_CALLING.
CREATE TABLE agent_session (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Operational session state enforced by the transition table.
  status TEXT NOT NULL,
  -- Optional operator-facing label for the live session.
  label TEXT,
  CHECK (status IN ('starting', 'running', 'blocked', 'cancelled', 'failed', 'closed'))
);

-- A unit of assigned work on the canvas, routed to agent sessions via assigned_to / delegates_to links.
CREATE TABLE task (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Short task title for the operator and agents.
  title TEXT NOT NULL,
  -- What done looks like for this unit of work.
  description TEXT NOT NULL
);

-- A capability exposed via MCP and generated from this schema — agents call tools; they do not invent ad-hoc side channels.
CREATE TABLE tool (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Tool name as exposed to agents (typically qf_*).
  name TEXT NOT NULL,
  -- One-line summary of what the tool does for an agent reader.
  summary TEXT NOT NULL
);

-- Where a run executes: local process, local Python sidecar, or disposable Cloudflare sandbox.
CREATE TABLE execution_environment (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Execution substrate for runs linked via executes_in.
  kind TEXT NOT NULL,
  -- Operator-facing label for this environment instance.
  label TEXT NOT NULL,
  CHECK (kind IN ('local_process', 'local_python', 'cloudflare_sandbox'))
);

-- A typed cable between tiles on the canvas — projection wiring, never a second truth store.
CREATE TABLE connection (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Cable/connection kind (data, control, or view projection).
  kind TEXT NOT NULL,
  -- Source tile or object id for this cable.
  from_ref TEXT NOT NULL,
  -- Target tile or object id for this cable.
  to_ref TEXT NOT NULL
);

-- Typed directed edges between ontology objects.
CREATE TABLE links (
  -- Primary key for this link instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- Link kind (schema link name), e.g. offered_on.
  kind TEXT NOT NULL CHECK (kind IN ('participates_in', 'offered_on', 'quotes', 'settles', 'tests', 'has_leg', 'uses', 'executes_in', 'produces', 'derived_from', 'evaluated_by', 'assigned_to', 'delegates_to')),
  -- Source object id.
  from_id TEXT NOT NULL,
  -- Target object id.
  to_id TEXT NOT NULL,
  -- ISO-8601 UTC timestamp when the link was created.
  created_at TEXT NOT NULL
);
