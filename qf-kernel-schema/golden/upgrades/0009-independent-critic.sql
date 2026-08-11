-- qf-kernel-schema generated upgrade: independent-critic
-- DO NOT EDIT — regenerate with `bun run generate`.

CREATE TABLE links__upgrade (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('participates_in', 'offered_on', 'quotes', 'lists', 'settles', 'tests', 'has_leg', 'uses', 'executes_in', 'produces', 'derived_from', 'evaluated_by', 'performed_by', 'gates', 'assigned_to', 'delegated_by', 'delegates_to', 'spawned_from')),
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
INSERT INTO links__upgrade (id, kind, from_id, to_id, created_at) SELECT id, kind, from_id, to_id, created_at FROM links;
DROP TABLE links;
ALTER TABLE links__upgrade RENAME TO links;

DELETE FROM schema_meta WHERE type_name IN ('performed_by', 'record_evaluation');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('performed_by', 'link', 'experimental', 'Independent review provenance: which admitted critic session authored an Evaluation.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('record_evaluation', 'action', 'experimental', 'Record an independent critic verdict over a succeeded deterministic Run. The Kernel derives metrics from the Run result, binds the admitted critic identity and durable findings, and refuses self-review.');
