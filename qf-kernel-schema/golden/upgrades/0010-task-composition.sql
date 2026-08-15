-- qf-kernel-schema generated upgrade: task-composition
-- DO NOT EDIT — regenerate with `bun run generate`.

CREATE TABLE agent_definition__upgrade (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  package_ref TEXT NOT NULL,
  system_prompt_ref TEXT,
  runtime_profile TEXT,
  capability_groups TEXT NOT NULL,
  display_name TEXT NOT NULL
);
INSERT INTO agent_definition__upgrade (id, created_at, name, role, package_ref, system_prompt_ref, runtime_profile, capability_groups, display_name)
  SELECT id, created_at, name, role, package_ref, system_prompt_ref, runtime_profile, capability_groups, CASE role WHEN 'critic' THEN 'Critic' WHEN 'orchestrator' THEN 'Orchestrator' ELSE 'Market Researcher' END FROM agent_definition;
DROP TABLE agent_definition;
ALTER TABLE agent_definition__upgrade RENAME TO agent_definition;

CREATE TABLE task__upgrade (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  CHECK (status IN ('open', 'done', 'cancelled'))
);
INSERT INTO task__upgrade (id, created_at, title, description, status) SELECT id, created_at, title, description, status FROM task;
DROP TABLE task;
ALTER TABLE task__upgrade RENAME TO task;

UPDATE schema_meta SET description = 'A task is a discrete unit of requested work tracked on the canvas. It governs delegation by linking intent to the session that owns execution.' WHERE type_name = 'task';
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('reassign_task', 'action', 'experimental', 'Move an open task to a different running agent_session while preserving its trusted delegator and receipt provenance.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('cancel_task', 'action', 'experimental', 'Cancel an open task without deleting its trusted delegator or assignee provenance links.');
UPDATE schema_meta SET description = 'An agent_definition is one founder-visible Dock profile. It governs spawn admission through package_ref while runtime_profile selects the adapter profile without encoding per-session state.' WHERE type_name = 'agent_definition';
