import { execute_deterministic_run } from "../ontology/research.ts";
import { sqlString } from "./sql.ts";

/** R11a metadata-only upgrade: expose the deterministic execution command. */
export function generateUpgradeDeterministicExecution(): string {
  return [
    "-- qf-kernel-schema generated upgrade: deterministic-execution",
    "-- DO NOT EDIT — regenerate with `bun run generate`.",
    "",
    `DELETE FROM schema_meta WHERE type_name = ${sqlString(execute_deterministic_run.name)};`,
    `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(execute_deterministic_run.name)}, 'action', ${sqlString(execute_deterministic_run.lifecycle)}, ${sqlString(execute_deterministic_run.description)});`,
    "",
  ].join("\n");
}
