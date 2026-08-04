-- qf-kernel-schema generated upgrade: task-status
-- DO NOT EDIT — regenerate with `bun run generate`.

CREATE TABLE task__upgrade (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  CHECK (status IN ('open', 'done'))
);
INSERT INTO task__upgrade (id, created_at, title, description, status)
  SELECT id, created_at, title, description, 'open' FROM task;
DROP TABLE task;
ALTER TABLE task__upgrade RENAME TO task;

UPDATE schema_meta SET description = 'A task is a discrete unit of requested work tracked on the canvas. It governs delegation by linking intent to the session that owns execution.' WHERE type_name = 'task';
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('create_task', 'action', 'experimental', 'Create a task in status open and atomically assign it to an agent_session via assigned_to. Guest-minted task_id is adopted; caller may not supply assigned_to links.');
INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES ('complete_task', 'action', 'experimental', 'Mark an open task done (open → done) through the transition table.');
