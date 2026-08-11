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

INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('competitor', 'object', 'experimental', 'A competitor is a participant that can appear in priced betting instruments. Keep one row per real participant and represent aliases as references rather than duplicate identities.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('market_event', 'object', 'experimental', 'A market_event is the bounded real-world occurrence that instruments resolve against. Treat starts_at and status as the governing fence for legal pre-event decisions and lifecycle transitions.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('instrument', 'object', 'experimental', 'An instrument is one bettable selection under a market category. Encode category variation in kind and params so the type can exist with or without a bounded market_event.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('quote', 'object', 'experimental', 'A quote is a pointer object for timestamped price observations of one instrument from one source. Keep raw tick rows outside the Kernel and store only references and coverage metadata here.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('venue', 'object', 'experimental', 'A venue is the listing and pricing source where instruments are offered. Represent sportsbooks and exchanges as rows here so tickets can reference a concrete origin.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('result', 'object', 'experimental', 'A result is the settled truth payload for a market_event and its instruments. Treat settled_at as the governing timestamp that closes uncertainty and enables final grading.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('mission', 'object', 'experimental', 'A mission is the standing research intent for a desk or workspace. It governs which hypotheses belong together so agents preserve one coherent question stream.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('hypothesis', 'object', 'experimental', 'A hypothesis is a falsifiable claim about market behavior. It governs lineage by defining the question that runs, evaluations, and reports must answer.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('policy', 'object', 'experimental', 'A policy is a versioned decision strategy intended for training or recommendation experiments. It governs promotion by requiring explicit lineage to the artifact that defines the policy.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('environment', 'object', 'experimental', 'An environment is the bounded world a policy is trained or evaluated against. It governs comparability by declaring the data and reward contract a run assumes.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('strategy', 'object', 'experimental', 'A strategy is a versioned betting decision recipe under evaluation. It governs execution by separating durable identity here from executable content in artifacts.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('ticket', 'object', 'experimental', 'A ticket is one wager record, whether strategy-proposed before placement or operator-supplied after placement. It governs grading lineage by preserving selection-time terms and settlement facts in one object.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('dataset', 'object', 'experimental', 'A dataset is a versioned, point-in-time-fenced snapshot consumed by runs. It governs replay by binding every run to immutable bytes and an as-of boundary.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('run', 'object', 'experimental', 'A run is the canonical execution record for ingest, feature build, backtest, analysis, or training work. It governs ontology shape by encoding mode in kind instead of creating subtype objects.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('artifact', 'object', 'experimental', 'An artifact is an immutable, content-addressed output produced by a run or session. Reports remain an artifact kind and must never be split into a separate object type.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('evaluation', 'object', 'experimental', 'An evaluation is a structured verdict on whether evidence supports a hypothesis. It governs publication and resolution decisions by separating verdict semantics from confidence scoring.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('workspace', 'object', 'experimental', 'A workspace is the operator-visible canvas container for one research effort. It governs spatial context and should not be overloaded with mission semantics.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('agent_definition', 'object', 'experimental', 'An agent_definition is one founder-visible Dock profile. It governs spawn admission through package_ref while runtime_profile selects the adapter profile without encoding per-session state.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('agent_session', 'object', 'experimental', 'An agent_session is one durable live seat identity on the canvas. It governs operational lifecycle only and must never store model-internal reasoning states.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('task', 'object', 'experimental', 'A task is a discrete unit of requested work tracked on the canvas. It governs delegation by linking intent to the session that owns execution.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('tool', 'object', 'experimental', 'A tool is an MCP-exposed capability agents can invoke. It governs action surface by keeping work on declared tools instead of ad-hoc side channels.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('execution_environment', 'object', 'experimental', 'An execution_environment identifies where a run actually executes. It governs reproducibility by separating runtime substrate from run intent.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('connection', 'object', 'experimental', 'A connection is a typed edge between canvas tiles. It governs projection wiring only and must never become an independent truth store.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('participates_in', 'link', 'experimental', 'Roster edge from each competitor to the market_event it contests.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('offered_on', 'link', 'experimental', 'Attachment edge from an instrument to the market_event it is offered on.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('quotes', 'link', 'experimental', 'Price-history edge from a quote record to the instrument it prices.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('lists', 'link', 'experimental', 'Listing edge from a venue to each instrument it offers.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('settles', 'link', 'experimental', 'Truth edge from a result row to the market_event it settles.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('tests', 'link', 'experimental', 'Why this run or strategy exists — it tests a named hypothesis.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('has_leg', 'link', 'experimental', 'Which instruments a ticket bets; enables correlation traversal.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('uses', 'link', 'experimental', 'Full input manifest for a run: datasets, strategies, and tools consumed.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('executes_in', 'link', 'experimental', 'Where computation for a run happened.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('produces', 'link', 'experimental', 'Output provenance: datasets or artifacts produced by a run or agent session.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('derived_from', 'link', 'experimental', 'Version and transformation lineage among datasets, artifacts, and strategies.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('evaluated_by', 'link', 'experimental', 'Verdict attachment: which evaluation judged an artifact or run.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('gates', 'link', 'experimental', 'Publication authorization: which evaluation approved an artifact for release. Ends evaluation''s sink status so WO-110 can read the gating fact.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('assigned_to', 'link', 'experimental', 'Work routing: which agent session owns a task.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('delegated_by', 'link', 'experimental', 'Task provenance: which admitted agent session delegated a task. It is written only from trusted execution context so callers cannot forge responsibility.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('delegates_to', 'link', 'experimental', 'Hire provenance: which admitted orchestrator created an agent session. It authorizes worker ownership only; task cables must use task delegated_by and assigned_to links.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('spawned_from', 'link', 'experimental', 'Session identity: which agent_definition profile created this agent_session.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_hypothesis', 'action', 'experimental', 'Open a new research hypothesis with claim, success criteria, and optional sources.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('register_dataset_version', 'action', 'experimental', 'Register a new content-hashed, point-in-time dataset version in the Kernel.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_run', 'action', 'experimental', 'Enqueue a new run in queued status with full invocation params. Rejectable when params are invalid.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_mission', 'action', 'experimental', 'Register a standing research mission with name and objective.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_ticket', 'action', 'experimental', 'Record a strategy-proposed ticket starting pending. Does not accept a grade; use observe_ticket for externally observed slips.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('observe_ticket', 'action', 'experimental', 'Ingest an externally observed ticket at its settlement grade. Writes an observation event, never a synthetic transition.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('start_run', 'action', 'experimental', 'Start a queued run (queued → running). Rejectable if the transition is illegal.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('cancel_run', 'action', 'experimental', 'Cancel a running run (running → cancelled).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('complete_run', 'action', 'experimental', 'Mark a running run as succeeded (running → succeeded).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('fail_run', 'action', 'experimental', 'Mark a running run as failed (running → failed).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('grade_ticket', 'action', 'experimental', 'Grade a pending ticket to win|loss|push|void after result settlement.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('start_event', 'action', 'experimental', 'Move a scheduled event to live (scheduled → live).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('settle_event', 'action', 'experimental', 'Settle a live event (live → settled).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('void_event', 'action', 'experimental', 'Void a scheduled event that will not be contested (scheduled → void).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('register_venue', 'action', 'experimental', 'Register one trusted venue identity from an existing source Artifact. Operator-only provenance is required and retries must preserve the original venue rather than silently updating it.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('schedule_market_event', 'action', 'experimental', 'Schedule one trusted market event from an existing source Artifact. Operator-only provenance is required and creation always writes scheduled state without accepting a caller-supplied status.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('ingest_market_batch', 'action', 'experimental', 'Ingest one provenance-bound batch of instrument and quote rows through the trusted market pipeline. The Kernel must validate the whole batch and commit its rows, derived quote links, and evidence events atomically.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('register_agent_definition', 'action', 'experimental', 'Register a Dock profile in the Kernel registry (id = name). Duplicate names are rejected; operator-only because it controls package_ref and runtime_profile.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_agent_session', 'action', 'experimental', 'Create an agent_session by adopting a guest-minted session_id (Kernel never mints). Requires agent_definition_id and atomically links spawned_from; label is presentation-only.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_task', 'action', 'experimental', 'Create an open task with one trusted delegator and one assignee. The Kernel writes delegated_by and assigned_to atomically; callers cannot supply either identity link.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('complete_task', 'action', 'experimental', 'Complete an open task with its durable result artifact. The Kernel accepts it only when trusted worker context owns the assignment and the result derives from that worker''s Kernel-receipted generated ontology read.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_connection', 'action', 'experimental', 'Create a typed canvas connection edge (kind data|control|view) between two port refs. It persists projection wiring only through the Kernel command path — never a second truth store or a self-loop.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('delete_connection', 'action', 'experimental', 'Delete a connection row by id and append connection.deleted. Hard delete only — the ontology has no tombstone field, and canvas persistence must never keep the edge.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('start_agent_session', 'action', 'experimental', 'Bring a starting agent session into running (starting → running).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('block_agent_session', 'action', 'experimental', 'Block a running agent session (running → blocked).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('unblock_agent_session', 'action', 'experimental', 'Return a blocked agent session to running (blocked → running).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('cancel_agent_session', 'action', 'experimental', 'Cancel a running or blocked agent session (→ cancelled).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('fail_agent_session', 'action', 'experimental', 'Fail a starting, running, or blocked agent session (→ failed). Used for guest crash and boot reconciliation.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('close_agent_session', 'action', 'experimental', 'Close a running, cancelled, or failed agent session (→ closed).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('publish_artifact', 'action', 'experimental', 'Publish an immutable content-addressed artifact (must land before sandbox death).');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('record_evaluation', 'action', 'experimental', 'Record a structured evaluation verdict with metrics against a hypothesis lineage.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('resolve_hypothesis', 'action', 'experimental', 'Resolve an open hypothesis to supported|rejected|inconclusive; evaluation-gated at the Kernel.');

-- A competitor is a participant that can appear in priced betting instruments. Keep one row per real participant and represent aliases as references rather than duplicate identities.
CREATE TABLE competitor (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- This field classifies the participant species used for matching and grouping. Derive sport context from linked market events instead of hard-coding it on the competitor row.
  kind TEXT NOT NULL,
  -- This field stores the canonical display name for the participant. Keep this stable so historical instruments and results stay joined to one identity.
  name TEXT NOT NULL,
  -- This field stores source-system identifiers used for entity resolution. Add new upstream identifiers here instead of creating duplicate competitor rows.
  external_refs TEXT NOT NULL,
  CHECK (kind IN ('ufc_fighter', 'tennis_player', 'team'))
);

-- A market_event is the bounded real-world occurrence that instruments resolve against. Treat starts_at and status as the governing fence for legal pre-event decisions and lifecycle transitions.
CREATE TABLE market_event (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- This field names the sport domain for the occurrence. Use it to interpret market vocabularies while keeping shared instrument structure in one type.
  sport TEXT NOT NULL,
  -- This field records the scheduled start timestamp in ISO-8601 UTC. Do not use data timestamped after this moment for pre-event decisions.
  starts_at TEXT NOT NULL,
  -- This field records the operational lifecycle state for the occurrence. Move it only through declared transition actions, never by ad-hoc writes.
  status TEXT NOT NULL,
  -- This field stores the competition context such as league, card, or tournament round. Keep the value operator-legible so slips and reports can be reconciled without external decoding.
  competition TEXT NOT NULL,
  CHECK (sport IN ('ufc', 'tennis', 'football')),
  CHECK (status IN ('scheduled', 'live', 'settled', 'void'))
);

-- An instrument is one bettable selection under a market category. Encode category variation in kind and params so the type can exist with or without a bounded market_event.
CREATE TABLE instrument (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- This field identifies the instrument family needed to interpret pricing semantics. Extend the enum by order rather than cloning new object types per category.
  kind TEXT NOT NULL,
  -- This field stores kind-specific parameters such as lines, methods, rounds, or handicaps. Keep it machine-readable and deterministic so equivalent instruments compare cleanly.
  params TEXT NOT NULL,
  -- This field lists the named outcomes offered for the instrument, such as ["Jones","Miocic"] or ["over","under"]. Preserve provider wording so grading and reconciliation can be traced exactly.
  sides TEXT NOT NULL,
  -- This field groups instruments with known dependent outcomes. Leave it null only when no declared dependence key is available.
  correlation_group TEXT,
  CHECK (kind IN ('moneyline', 'spread', 'total', 'prop'))
);

-- A quote is a pointer object for timestamped price observations of one instrument from one source. Keep raw tick rows outside the Kernel and store only references and coverage metadata here.
CREATE TABLE quote (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- This field identifies the source venue or book that published the prices. Use stable lowercase identifiers so cross-source joins remain deterministic.
  book TEXT NOT NULL,
  -- This field points to the content-addressed segment containing timestamped quotes. Treat it as immutable evidence for replay and audit.
  data_ref TEXT NOT NULL,
  -- This field summarizes temporal and count coverage for the referenced quote data. Use it as a sufficiency hint, not as a replacement for inspecting underlying rows.
  coverage TEXT NOT NULL,
  CHECK (book IN ('bovada', 'pinnacle'))
);

-- A venue is the listing and pricing source where instruments are offered. Represent sportsbooks and exchanges as rows here so tickets can reference a concrete origin.
CREATE TABLE venue (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- This field identifies the venue class that governs listing and settlement behavior. Add new classes by order so downstream assumptions remain explicit.
  kind TEXT NOT NULL,
  -- This field stores the operator-visible venue name, such as Bovada. Keep names stable so external references can be re-imported idempotently.
  name TEXT NOT NULL,
  CHECK (kind IN ('sportsbook', 'exchange'))
);

-- A result is the settled truth payload for a market_event and its instruments. Treat settled_at as the governing timestamp that closes uncertainty and enables final grading.
CREATE TABLE result (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- This field stores structured settlement facts such as winner, method, and per-instrument grading. Keep the structure explicit so grading decisions are reproducible.
  outcome TEXT NOT NULL,
  -- This field records when settled truth became known in ISO-8601 UTC. Do not allow grading decisions to cite truth timestamps after this boundary.
  settled_at TEXT NOT NULL
);

-- A mission is the standing research intent for a desk or workspace. It governs which hypotheses belong together so agents preserve one coherent question stream.
CREATE TABLE mission (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Operator-facing mission label. Keep this stable across revisions so lineage queries stay anchored to one intent.
  name TEXT NOT NULL,
  -- The decision goal this mission serves. It must be concrete enough for an agent to reject work that is out of charter.
  objective TEXT NOT NULL
);

-- A hypothesis is a falsifiable claim about market behavior. It governs lineage by defining the question that runs, evaluations, and reports must answer.
CREATE TABLE hypothesis (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- The claim being tested in domain language. Phrase it so a supporting or rejecting verdict is objectively distinguishable.
  claim TEXT NOT NULL,
  -- The evidence bar for support. This defines the gate so confidence alone cannot silently override the research contract.
  success_criteria TEXT NOT NULL,
  -- Citations that justify the claim's priors. Treat this as provenance for why the claim exists, not as proof that it is true.
  sources TEXT NOT NULL,
  -- Current lifecycle state for the claim. Only evaluation-backed resolution should move it away from open.
  status TEXT NOT NULL,
  CHECK (status IN ('open', 'supported', 'rejected', 'inconclusive'))
);

-- A policy is a versioned decision strategy intended for training or recommendation experiments. It governs promotion by requiring explicit lineage to the artifact that defines the policy.
CREATE TABLE policy (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Which implementation track the policy uses. This keeps playbook-level and model-weight policies comparable without splitting object types.
  kind TEXT NOT NULL,
  -- Artifact id that defines the policy behavior. Every policy revision must point to immutable bytes so evaluations can be reproduced.
  spec_ref TEXT NOT NULL,
  CHECK (kind IN ('prompt_playbook', 'trained_weights'))
);

-- An environment is the bounded world a policy is trained or evaluated against. It governs comparability by declaring the data and reward contract a run assumes.
CREATE TABLE environment (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Execution context used for training/evaluation. Agents must not compare outcomes across kinds without an explicit normalization rule.
  kind TEXT NOT NULL,
  -- Artifact id describing observations, actions, and reward semantics. Keep this immutable so results remain interpretable after schema evolution.
  contract_ref TEXT NOT NULL,
  CHECK (kind IN ('offline_replay', 'paper_market', 'live_shadow'))
);

-- A strategy is a versioned betting decision recipe under evaluation. It governs execution by separating durable identity here from executable content in artifacts.
CREATE TABLE strategy (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Artifact id whose content defines the strategy logic. This reference is the canonical source of behavior for replay and audit.
  spec_ref TEXT NOT NULL,
  -- Monotonic strategy revision number. New revisions must become new objects linked by derived_from instead of in-place edits.
  version REAL NOT NULL,
  -- Position sizing approach the strategy assumes. Use custom only when the sizing function is encoded in the referenced artifact.
  stake_model TEXT NOT NULL,
  CHECK (stake_model IN ('flat', 'fractional_kelly', 'custom'))
);

-- A ticket is one wager record, whether strategy-proposed before placement or operator-supplied after placement. It governs grading lineage by preserving selection-time terms and settlement facts in one object.
CREATE TABLE ticket (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- How this ticket entered the system. Strategy-proposed rows express planned intent, while operator-supplied rows are venue facts that must preserve external provenance exactly.
  origin TEXT NOT NULL,
  -- Whether the wager has one leg or multiple legs. Treat single as a first-class ticket, not a separate type.
  kind TEXT NOT NULL,
  -- Venue-issued ticket reference for this wager. Use it as the idempotency key so re-importing the same operator-supplied slip updates one row instead of duplicating it.
  external_ref TEXT NOT NULL,
  -- Timestamp when the wager was placed in ISO-8601 UTC. This is required input for CLV because selection-time price must be compared to market state at placement.
  placed_at TEXT NOT NULL,
  -- Structured per-leg selections and timestamps. Each leg entry must retain selection-time price so CLV and drift can be recomputed.
  legs TEXT NOT NULL,
  -- Aggregate ticket price at selection. Keep the source price so downstream evaluation does not infer payout assumptions.
  combined_price REAL NOT NULL,
  -- Amount risked on the wager. Store the actual stake for operator-supplied slips and the proposed stake for strategy-origin tickets without changing field semantics.
  stake REAL NOT NULL,
  -- Realized return from settlement, distinct from stake and combined_price assumptions. Keep it null while grade is pending and set it once the venue-grade is known.
  payout REAL,
  -- Declared dependence assumptions among legs. Same-event legs should reference known correlation groups to avoid false independence.
  correlation_note TEXT NOT NULL,
  -- Settlement outcome for the ticket. It stays pending until settled truth is available from result lineage.
  grade TEXT NOT NULL,
  CHECK (origin IN ('strategy_proposed', 'operator_supplied')),
  CHECK (kind IN ('single', 'parlay')),
  CHECK (grade IN ('pending', 'win', 'loss', 'push', 'void'))
);

-- A dataset is a versioned, point-in-time-fenced snapshot consumed by runs. It governs replay by binding every run to immutable bytes and an as-of boundary.
CREATE TABLE dataset (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Primary data family captured by this snapshot. Mixed should only be used when cross-family coupling is deliberate and documented.
  kind TEXT NOT NULL,
  -- Hash over the underlying bytes for this snapshot. Equal hashes mean byte-identical data and therefore equivalent replay input.
  content_hash TEXT NOT NULL,
  -- Latest timestamp allowed in this snapshot (ISO-8601 UTC). Agents must treat it as a leakage boundary for pre-event decisions.
  as_of TEXT NOT NULL,
  -- Machine-readable coverage summary (sports, range, counts). This is a sufficiency hint and must never override missing raw lineage.
  coverage TEXT NOT NULL,
  CHECK (kind IN ('odds_history', 'results', 'features', 'mixed'))
);

-- A run is the canonical execution record for ingest, feature build, backtest, analysis, or training work. It governs ontology shape by encoding mode in kind instead of creating subtype objects.
CREATE TABLE run (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Execution mode for this run. Add new modes here rather than cloning the run type per pipeline step.
  kind TEXT NOT NULL,
  -- Operational lifecycle state of execution. Never store actor-internal thinking/tool-calling states in this field.
  status TEXT NOT NULL,
  -- Full invocation arguments captured at launch. This is the reproducibility contract for re-run and audit.
  params TEXT NOT NULL,
  -- Root span identifier for this run in tracing systems. Keep it stable across child spans so causality can be reconstructed.
  trace_id TEXT NOT NULL,
  CHECK (kind IN ('ingestion', 'feature_build', 'backtest', 'analysis', 'training')),
  CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled'))
);

-- An artifact is an immutable, content-addressed output produced by a run or session. Reports remain an artifact kind and must never be split into a separate object type.
CREATE TABLE artifact (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Artifact family discriminator. Trajectory and report entries should contain distilled outputs, never raw transcript dumps.
  kind TEXT NOT NULL,
  -- Hash of the durable bytes referenced by this artifact. This is the canonical identity for dedupe and provenance checks.
  content_hash TEXT NOT NULL,
  -- Durable location that stores the referenced bytes. Publication should occur before ephemeral sandboxes can be reclaimed.
  storage_ref TEXT NOT NULL,
  CHECK (kind IN ('strategy_spec', 'code', 'result_set', 'report', 'trajectory'))
);

-- An evaluation is a structured verdict on whether evidence supports a hypothesis. It governs publication and resolution decisions by separating verdict semantics from confidence scoring.
CREATE TABLE evaluation (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Typed metric payload used to justify the verdict. Include enough detail for replayed judging without reconstructing hidden intermediate state.
  metrics TEXT NOT NULL,
  -- Artifact id containing critic findings considered in this judgment. Leave null only when no critic pass was available for this evaluation.
  critic_findings_ref TEXT,
  -- Disposition of the evidence against the hypothesis. This field carries gating semantics; confidence does not override it.
  verdict TEXT NOT NULL,
  -- Confidence score for the selected verdict on a 0-1 scale. Use it for prioritization and review, not as a substitute for verdict semantics.
  confidence REAL NOT NULL,
  -- Human- and agent-readable explanation for the verdict. It should name the decisive evidence rather than restating the metric payload.
  rationale TEXT NOT NULL,
  CHECK (verdict IN ('supports', 'rejects', 'inconclusive'))
);

-- A workspace is the operator-visible canvas container for one research effort. It governs spatial context and should not be overloaded with mission semantics.
CREATE TABLE workspace (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Short workspace slug shown in compact UI surfaces. Keep it stable so linked session labels and automation references do not drift.
  name TEXT NOT NULL,
  -- Long human-readable heading for the workspace. Use this for operator readability while keeping machine references on name.
  title TEXT NOT NULL
);

-- An agent_definition is one founder-visible Dock profile. It governs spawn admission through package_ref while runtime_profile selects the adapter profile without encoding per-session state.
CREATE TABLE agent_definition (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Canonical profile identifier used when requesting a spawn. Treat this as stable API surface for orchestration and routing rules.
  name TEXT NOT NULL,
  -- Role summary used for planner routing and prompt selection. Keep role labels aligned with actual task boundaries, not model branding.
  role TEXT NOT NULL,
  -- Reusable runtime package reference that resolves to executable code. Several profiles may share one package_ref without sharing identity.
  package_ref TEXT NOT NULL,
  -- Artifact or prompt identifier containing this profile's operating instructions. Point to immutable prompt bytes so behavior drift can be audited.
  system_prompt_ref TEXT,
  -- Optional runtime adapter profile selector (for example a Hermes profile name). Never a path to profile home or credential-bearing configuration.
  runtime_profile TEXT,
  -- Capability groups this Dock profile may invoke through the app-owned ontology gateway. Grant groups only — never tool names — so new schema objects join their group without a hand-edited roster.
  capability_groups TEXT NOT NULL
);

-- An agent_session is one durable live seat identity on the canvas. It governs operational lifecycle only and must never store model-internal reasoning states.
CREATE TABLE agent_session (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Operational lifecycle state enforced by transition policy. Status transitions must follow the transition table rather than ad-hoc writes.
  status TEXT NOT NULL,
  -- Optional operator-facing label for this live session. Use it for readability only; lifecycle and routing authority remain on stable ids.
  label TEXT,
  CHECK (status IN ('starting', 'running', 'blocked', 'cancelled', 'failed', 'closed'))
);

-- A task is a discrete unit of requested work tracked on the canvas. It governs delegation by linking intent to the session that owns execution.
CREATE TABLE task (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Short task title visible to operators and agents. Keep this outcome-oriented so routing can prioritize without opening full context.
  title TEXT NOT NULL,
  -- Completion contract for this task. Write it so a verifier can decide done versus not-done from observable evidence.
  description TEXT NOT NULL,
  -- Lifecycle state of this task on the canvas. Transitions must go through the Kernel write path — never ad-hoc SQL — so reopen always sees Kernel truth.
  status TEXT NOT NULL,
  CHECK (status IN ('open', 'done'))
);

-- A tool is an MCP-exposed capability agents can invoke. It governs action surface by keeping work on declared tools instead of ad-hoc side channels.
CREATE TABLE tool (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Tool identifier exposed to agents (typically qf_*). Keep naming stable because prompts and automations may reference it directly.
  name TEXT NOT NULL,
  -- One-line capability summary for agent selection. Explain what decision this tool enables, not just its transport mechanism.
  summary TEXT NOT NULL
);

-- An execution_environment identifies where a run actually executes. It governs reproducibility by separating runtime substrate from run intent.
CREATE TABLE execution_environment (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Execution substrate category used by runs linked through executes_in. Choose the narrowest accurate kind so failure domains stay interpretable.
  kind TEXT NOT NULL,
  -- Operator-facing name for this environment instance. Keep labels specific enough to distinguish local and remote contexts at a glance.
  label TEXT NOT NULL,
  CHECK (kind IN ('local_process', 'local_python', 'cloudflare_sandbox'))
);

-- A connection is a typed edge between canvas tiles. It governs projection wiring only and must never become an independent truth store.
CREATE TABLE connection (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Connection category such as data, control, or view. Use a constrained vocabulary in higher layers so traversal semantics stay predictable.
  kind TEXT NOT NULL,
  -- Source tile or object identifier for this connection. It should reference existing canvas entities rather than inferred placeholders.
  from_ref TEXT NOT NULL,
  -- Target tile or object identifier for this connection. Keep directional intent explicit so reverse traversals are computed, not guessed.
  to_ref TEXT NOT NULL
);

-- Typed directed edges between ontology objects.
CREATE TABLE links (
  -- Primary key for this link instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- Link kind (schema link name), e.g. offered_on.
  kind TEXT NOT NULL CHECK (kind IN ('participates_in', 'offered_on', 'quotes', 'lists', 'settles', 'tests', 'has_leg', 'uses', 'executes_in', 'produces', 'derived_from', 'evaluated_by', 'gates', 'assigned_to', 'delegated_by', 'delegates_to', 'spawned_from')),
  -- Source object id.
  from_id TEXT NOT NULL,
  -- Target object id.
  to_id TEXT NOT NULL,
  -- ISO-8601 UTC timestamp when the link was created.
  created_at TEXT NOT NULL
);