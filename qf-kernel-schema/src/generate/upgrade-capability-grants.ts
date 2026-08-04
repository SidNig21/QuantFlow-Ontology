import { agent_definition } from "../ontology/agent.ts";
import { sqlString } from "./sql.ts";

/**
 * R2 data-preserving upgrade: add agent_definition.capability_groups.
 * Fresh migration.sql already emits the column; this ALTER brings predecessors forward.
 */
export function generateUpgradeCapabilityGrants(): string {
  const lines: string[] = [];
  lines.push("-- qf-kernel-schema generated upgrade: capability-grants");
  lines.push("-- DO NOT EDIT — regenerate with `bun run generate`.");
  lines.push("");
  lines.push(
    "ALTER TABLE agent_definition ADD COLUMN capability_groups TEXT NOT NULL DEFAULT '[]';",
  );
  lines.push("");
  lines.push(
    `UPDATE schema_meta SET description = ${sqlString(agent_definition.description)} WHERE type_name = 'agent_definition';`,
  );
  lines.push("");
  return lines.join("\n");
}
