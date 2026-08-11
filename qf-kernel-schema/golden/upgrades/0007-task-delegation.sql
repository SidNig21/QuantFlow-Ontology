-- qf-kernel-schema generated upgrade: task-delegation
-- DO NOT EDIT â€” regenerate with `bun run generate`.

CREATE TABLE links__upgrade (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('participates_in', 'offered_on', 'quotes', 'lists', 'settles', 'tests', 'has_leg', 'uses', 'executes_in', 'produces', 'derived_from', 'evaluated_by', 'gates', 'assigned_to', 'delegated_by', 'delegates_to', 'spawned_from')),
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
INSERT INTO links__upgrade (id, kind, from_id, to_id, created_at) SELECT id, kind, from_id, to_id, created_at FROM links;
DROP TABLE links;
ALTER TABLE links__upgrade RENAME TO links;

DELETE FROM schema_meta WHERE type_name IN ('delegated_by', 'delegates_to', 'create_task', 'complete_task');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('delegated_by', 'link', 'experimental', 'Task provenance: which admitted agent session delegated a task. It is written only from trusted execution context so callers cannot forge responsibility.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('delegates_to', 'link', 'experimental', 'Hire provenance: which admitted orchestrator created an agent session. It authorizes worker ownership only; task cables must use task delegated_by and assigned_to links.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_task', 'action', 'experimental', 'Create an open task with one trusted delegator and one assignee. The Kernel writes delegated_by and assigned_to atomically; callers cannot supply either identity link.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('complete_task', 'action', 'experimental', 'Complete an open task with its durable result artifact. The Kernel accepts it only when trusted worker context owns the assignment and the result derives from that worker''s Kernel-receipted generated ontology read.');
