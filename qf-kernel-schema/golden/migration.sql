-- qf-kernel-schema generated migration
-- DO NOT EDIT — regenerate with `bun run generate`.

-- A falsifiable research claim that roots a betting-research lineage. Agents open one before building datasets, tickets, or evaluations so every subsequent artifact answers a named question.
CREATE TABLE hypothesis (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Schema lifecycle for hypothesis (default 'experimental').
  lifecycle TEXT NOT NULL,
  -- The statement under test in betting-research terms, e.g. a priced inefficiency or independence assumption.
  claim TEXT NOT NULL,
  -- What evaluation outcome would support the claim (metrics, sample size, risk bounds) so Critic/Evaluation can grade it.
  success_criteria TEXT NOT NULL,
  -- Citations grounding the claim (papers, articles, prior reports) that agents must carry into lineage.
  sources TEXT NOT NULL,
  -- Lifecycle of the claim; only evaluation-backed resolution should leave open.
  status TEXT NOT NULL,
  CHECK (lifecycle IN ('experimental', 'active')),
  CHECK (status IN ('open', 'supported', 'rejected', 'inconclusive'))
);

-- A scheduled real-world contest (UFC bout, tennis match, football game) that markets and results attach to. Starts_at is the point-in-time fence for pre-event decisions.
CREATE TABLE event (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Schema lifecycle for event (default 'experimental').
  lifecycle TEXT NOT NULL,
  -- Which sport domain this contest belongs to; drives prop vocabularies and dataset coverage.
  sport TEXT NOT NULL,
  -- Scheduled start as ISO-8601 UTC; no post-start data may inform a pre-event ticket.
  starts_at TEXT NOT NULL,
  -- Contest state from schedule through settlement or void.
  status TEXT NOT NULL,
  -- Tournament or league context (UFC 320, Wimbledon R16, NFL Week 3) for agent filtering.
  competition TEXT NOT NULL,
  CHECK (lifecycle IN ('experimental', 'active')),
  CHECK (sport IN ('ufc', 'tennis', 'football')),
  CHECK (status IN ('scheduled', 'live', 'settled', 'void'))
);

-- One bettable proposition on an event. Moneyline, spread, total, and prop are kinds of this single type — never separate object types.
CREATE TABLE market (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Schema lifecycle for market (default 'experimental').
  lifecycle TEXT NOT NULL,
  -- Market family; props carry sport-specific structure in params.
  kind TEXT NOT NULL,
  -- Kind-specific parameters (lines, prop category/method/round, handicaps) as a JSON object.
  params TEXT NOT NULL,
  -- Named outcomes offered, e.g. ["Jones","Miocic"] or ["over","under"].
  sides TEXT NOT NULL,
  -- Shared key for same-event markets with dependent outcomes; null when independence is assumed.
  correlation_group TEXT,
  CHECK (lifecycle IN ('experimental', 'active')),
  CHECK (kind IN ('moneyline', 'spread', 'total', 'prop'))
);

-- The atomic proposed wager — a single or a parlay — emitted by strategies and graded in backtests. A one-leg ticket is still a ticket, never a separate type.
CREATE TABLE ticket (
  -- Primary key for this ontology object instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- ISO-8601 UTC timestamp when the row was created.
  created_at TEXT NOT NULL,
  -- Schema lifecycle for ticket (default 'experimental').
  lifecycle TEXT NOT NULL,
  -- Whether this wager is one leg or a multi-leg parlay.
  kind TEXT NOT NULL,
  -- Structured legs: each entry is market ref + side + price-at-selection (+ captured_at) as JSON objects.
  legs TEXT NOT NULL,
  -- Total odds for the ticket as offered or computed across legs.
  combined_price REAL NOT NULL,
  -- Simulated stake under the strategy stake model.
  stake REAL NOT NULL,
  -- Settlement grade once results land; pending until then.
  grade TEXT NOT NULL,
  CHECK (lifecycle IN ('experimental', 'active')),
  CHECK (kind IN ('single', 'parlay')),
  CHECK (grade IN ('pending', 'win', 'loss', 'push', 'void'))
);

-- Typed directed edges between ontology objects.
CREATE TABLE links (
  -- Primary key for this link instance.
  id TEXT PRIMARY KEY NOT NULL,
  -- Link kind (schema link name), e.g. offered_on.
  kind TEXT NOT NULL,
  -- Source object id.
  from_id TEXT NOT NULL,
  -- Target object id.
  to_id TEXT NOT NULL,
  -- ISO-8601 UTC timestamp when the link was created.
  created_at TEXT NOT NULL
);
