-- qa/fixtures/kernel-drift/prior-schema/migration.sql
-- Pinned prior Kernel snapshot (WO-K3 RULING 4 strategy A).
-- DO NOT import live qf-kernel-schema/golden/migration.sql for drift fixtures.

CREATE TABLE schema_meta (
  type_name TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  lifecycle TEXT NOT NULL CHECK (lifecycle IN ('experimental', 'active')),
  description TEXT NOT NULL
);

INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES
('artifact', 'object', 'experimental', 'Prior snapshot artifact type for drift gate fixtures. Used only to seed a known-old registry row set.'),
('agent_session', 'object', 'experimental', 'Prior snapshot agent_session type for drift gate fixtures. Used only to seed a known-old registry row set.'),
('run', 'object', 'experimental', 'Prior snapshot run type for drift gate fixtures. Used only to seed a known-old registry row set.');

CREATE TABLE artifact (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  storage_ref TEXT NOT NULL,
  CHECK (kind IN ('strategy_spec', 'code', 'result_set', 'report', 'trajectory'))
);

CREATE TABLE agent_session (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL,
  label TEXT,
  CHECK (status IN ('starting', 'running', 'blocked', 'cancelled', 'failed', 'closed'))
);

CREATE TABLE run (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  params TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  CHECK (kind IN ('ingestion', 'feature_build', 'backtest', 'analysis', 'training')),
  CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled'))
);

CREATE TABLE links (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
