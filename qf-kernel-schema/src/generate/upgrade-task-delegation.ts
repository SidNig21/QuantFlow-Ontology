import {
  create_task,
  complete_task,
  delegated_by,
  delegates_to,
} from "../ontology/agent.ts";
import { schema } from "../schema.ts";
import { sqlString } from "./sql.ts";

/**
 * Act I data-preserving upgrade: add task delegated_by to the governed link
 * vocabulary and replace the affected schema metadata with current authority.
 */
export function generateUpgradeTaskDelegation(): string {
  const linkKinds = schema.links
    .filter((link) => link.name !== "performed_by" && link.name !== "belongs_to" && !link.name.startsWith("grades_"))
    .map((link) => sqlString(link.name))
    .join(", ");
  const lines: string[] = [];
  lines.push("-- qf-kernel-schema generated upgrade: task-delegation");
  lines.push("-- DO NOT EDIT â€” regenerate with `bun run generate`.");
  lines.push("");
  lines.push("CREATE TABLE links__upgrade (");
  lines.push("  id TEXT PRIMARY KEY NOT NULL,");
  lines.push(`  kind TEXT NOT NULL CHECK (kind IN (${linkKinds})),`);
  lines.push("  from_id TEXT NOT NULL,");
  lines.push("  to_id TEXT NOT NULL,");
  lines.push("  created_at TEXT NOT NULL");
  lines.push(");");
  lines.push(
    "INSERT INTO links__upgrade (id, kind, from_id, to_id, created_at) SELECT id, kind, from_id, to_id, created_at FROM links;",
  );
  lines.push("DROP TABLE links;");
  lines.push("ALTER TABLE links__upgrade RENAME TO links;");
  lines.push("");
  lines.push(
    "DELETE FROM schema_meta WHERE type_name IN ('delegated_by', 'delegates_to', 'create_task', 'complete_task');",
  );
  for (const [definition, kind] of [
    [delegated_by, "link"],
    [delegates_to, "link"],
    [create_task, "action"],
    [complete_task, "action"],
  ] as const) {
    lines.push(
      `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(definition.name)}, ${sqlString(kind)}, ${sqlString(definition.lifecycle)}, ${sqlString(definition.description)});`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
