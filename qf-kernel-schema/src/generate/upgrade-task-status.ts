import { complete_task, create_task, task } from "../ontology/agent.ts";
import { sqlString } from "./sql.ts";

/**
 * R5 data-preserving upgrade: add task.status and task action authorities.
 * Fresh migration.sql already emits them; this brings predecessors forward.
 */
export function generateUpgradeTaskStatus(): string {
  const lines: string[] = [];
  lines.push("-- qf-kernel-schema generated upgrade: task-status");
  lines.push("-- DO NOT EDIT — regenerate with `bun run generate`.");
  lines.push("");
  lines.push(
    "ALTER TABLE task ADD COLUMN status TEXT NOT NULL DEFAULT 'open';",
  );
  lines.push("");
  lines.push(
    `UPDATE schema_meta SET description = ${sqlString(task.description)} WHERE type_name = 'task';`,
  );
  for (const action of [create_task, complete_task]) {
    lines.push(
      `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(action.name)}, 'action', ${sqlString(action.lifecycle)}, ${sqlString(action.description)});`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
