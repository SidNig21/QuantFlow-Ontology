import { performed_by, record_evaluation } from "../ontology/research.ts";
import { schema } from "../schema.ts";
import { sqlString } from "./sql.ts";

/** R12 data-preserving upgrade: add independent critic lineage and action policy. */
export function generateUpgradeIndependentCritic(): string {
  const linkKinds = schema.links
    .filter((link) => link.name !== "belongs_to" && !link.name.startsWith("grades_"))
    .map((link) => sqlString(link.name)).join(", ");
  return [
    "-- qf-kernel-schema generated upgrade: independent-critic",
    "-- DO NOT EDIT — regenerate with `bun run generate`.",
    "",
    "CREATE TABLE links__upgrade (",
    "  id TEXT PRIMARY KEY NOT NULL,",
    `  kind TEXT NOT NULL CHECK (kind IN (${linkKinds})),`,
    "  from_id TEXT NOT NULL,",
    "  to_id TEXT NOT NULL,",
    "  created_at TEXT NOT NULL",
    ");",
    "INSERT INTO links__upgrade (id, kind, from_id, to_id, created_at) SELECT id, kind, from_id, to_id, created_at FROM links;",
    "DROP TABLE links;",
    "ALTER TABLE links__upgrade RENAME TO links;",
    "",
    "DELETE FROM schema_meta WHERE type_name IN ('performed_by', 'record_evaluation');",
    `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(performed_by.name)}, 'link', ${sqlString(performed_by.lifecycle)}, ${sqlString(performed_by.description)});`,
    `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(record_evaluation.name)}, 'action', ${sqlString(record_evaluation.lifecycle)}, ${sqlString(record_evaluation.description)});`,
    "",
  ].join("\n");
}
