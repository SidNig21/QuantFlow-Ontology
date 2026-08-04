import { create_connection, delete_connection } from "../ontology/agent.ts";
import { sqlString } from "./sql.ts";

/**
 * WO-g5a: register create_connection / delete_connection authorities on
 * predecessors. Fresh migration.sql already emits them; this INSERT brings
 * upgraded Kernels to the exact current schema_meta shape without ALTER TABLE.
 */
export function generateUpgradeConnectionActions(): string {
  const lines: string[] = [];
  lines.push("-- qf-kernel-schema generated upgrade: connection-actions");
  lines.push("-- DO NOT EDIT — regenerate with `bun run generate`.");
  lines.push("");
  for (const action of [create_connection, delete_connection]) {
    lines.push(
      `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(action.name)}, 'action', ${sqlString(action.lifecycle)}, ${sqlString(action.description)});`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
