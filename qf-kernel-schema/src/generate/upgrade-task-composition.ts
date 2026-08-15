import { agent_definition, cancel_task, reassign_task, task } from "../ontology/agent.ts";
import { sqlString } from "./sql.ts";

/** V2-3 data-preserving upgrade: add founder-facing profile labels, cancellation, and task governance. */
export function generateUpgradeTaskComposition(): string {
  const lines: string[] = [];
  lines.push("-- qf-kernel-schema generated upgrade: task-composition");
  lines.push("-- DO NOT EDIT — regenerate with `bun run generate`.");
  lines.push("");
  lines.push("CREATE TABLE agent_definition__upgrade (");
  lines.push("  id TEXT PRIMARY KEY NOT NULL,");
  lines.push("  created_at TEXT NOT NULL,");
  lines.push("  name TEXT NOT NULL,");
  lines.push("  role TEXT NOT NULL,");
  lines.push("  package_ref TEXT NOT NULL,");
  lines.push("  system_prompt_ref TEXT,");
  lines.push("  runtime_profile TEXT,");
  lines.push("  capability_groups TEXT NOT NULL,");
  lines.push("  display_name TEXT NOT NULL");
  lines.push(");");
  lines.push(
    "INSERT INTO agent_definition__upgrade (id, created_at, name, role, package_ref, system_prompt_ref, runtime_profile, capability_groups, display_name)",
  );
  lines.push(
    "  SELECT id, created_at, name, role, package_ref, system_prompt_ref, runtime_profile, capability_groups, CASE role WHEN 'critic' THEN 'Critic' WHEN 'orchestrator' THEN 'Orchestrator' ELSE 'Market Researcher' END FROM agent_definition;",
  );
  lines.push("DROP TABLE agent_definition;");
  lines.push("ALTER TABLE agent_definition__upgrade RENAME TO agent_definition;");
  lines.push("");
  lines.push("CREATE TABLE task__upgrade (");
  lines.push("  id TEXT PRIMARY KEY NOT NULL,");
  lines.push("  created_at TEXT NOT NULL,");
  lines.push("  title TEXT NOT NULL,");
  lines.push("  description TEXT NOT NULL,");
  lines.push("  status TEXT NOT NULL,");
  lines.push("  CHECK (status IN ('open', 'done', 'cancelled'))");
  lines.push(");");
  lines.push(
    "INSERT INTO task__upgrade (id, created_at, title, description, status) SELECT id, created_at, title, description, status FROM task;",
  );
  lines.push("DROP TABLE task;");
  lines.push("ALTER TABLE task__upgrade RENAME TO task;");
  lines.push("");
  lines.push(
    `UPDATE schema_meta SET description = ${sqlString(task.description)} WHERE type_name = 'task';`,
  );
  for (const [definition, kind] of [
    [reassign_task, "action"],
    [cancel_task, "action"],
  ] as const) {
    lines.push(
      `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(definition.name)}, ${sqlString(kind)}, ${sqlString(definition.lifecycle)}, ${sqlString(definition.description)});`,
    );
  }
  lines.push(
    `UPDATE schema_meta SET description = ${sqlString(agent_definition.description)} WHERE type_name = 'agent_definition';`,
  );
  lines.push("");
  return lines.join("\n");
}
