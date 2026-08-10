import { task } from "../ontology/agent.ts";
import { sqlString } from "./sql.ts";

const PRE_TASK_DELEGATION_ACTIONS = [
  [
    "create_task",
    "Create a task in status open and atomically assign it to an agent_session via assigned_to. Guest-minted task_id is adopted; caller may not supply assigned_to links.",
  ],
  ["complete_task", "Mark an open task done (open → done) through the transition table."],
] as const;

/**
 * R5 data-preserving upgrade: bring predecessors to the exact current `task`
 * CREATE shape (including CHECK). Plain ALTER ADD COLUMN cannot attach a
 * table-level CHECK and leaves DEFAULT in sqlite_master, so classifyKernelShape
 * would never accept the result as `current`. Rebuild + copy instead.
 */
export function generateUpgradeTaskStatus(): string {
  const lines: string[] = [];
  lines.push("-- qf-kernel-schema generated upgrade: task-status");
  lines.push("-- DO NOT EDIT — regenerate with `bun run generate`.");
  lines.push("");
  lines.push("CREATE TABLE task__upgrade (");
  lines.push("  id TEXT PRIMARY KEY NOT NULL,");
  lines.push("  created_at TEXT NOT NULL,");
  lines.push("  title TEXT NOT NULL,");
  lines.push("  description TEXT NOT NULL,");
  lines.push("  status TEXT NOT NULL,");
  lines.push("  CHECK (status IN ('open', 'done'))");
  lines.push(");");
  lines.push(
    "INSERT INTO task__upgrade (id, created_at, title, description, status)",
  );
  lines.push(
    "  SELECT id, created_at, title, description, 'open' FROM task;",
  );
  lines.push("DROP TABLE task;");
  lines.push("ALTER TABLE task__upgrade RENAME TO task;");
  lines.push("");
  lines.push(
    `UPDATE schema_meta SET description = ${sqlString(task.description)} WHERE type_name = 'task';`,
  );
  for (const [name, description] of PRE_TASK_DELEGATION_ACTIONS) {
    lines.push(
      `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(name)}, 'action', 'experimental', ${sqlString(description)});`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
