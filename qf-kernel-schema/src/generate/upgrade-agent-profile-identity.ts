import { agent_definition, spawned_from } from "../ontology/agent.ts";
import { schema } from "../schema.ts";
import { sqlString } from "./sql.ts";

/** Frozen 0001 vocabulary. Later links belong only to their own upgrades. */
const D1_LINK_KINDS = [
  "participates_in", "offered_on", "quotes", "lists", "settles", "tests", "has_leg",
  "uses", "executes_in", "produces", "derived_from", "evaluated_by", "gates",
  "assigned_to", "delegates_to", "spawned_from",
].map(sqlString).join(", ");

/**
 * WO-D1 data-preserving upgrade from the exact pre-D1 profile-identity baseline.
 * Adds agent_definition.runtime_profile, rebuilds links CHECK for spawned_from,
 * and synchronizes affected schema_meta rows from generated schema authority.
 */
export function generateUpgradeAgentProfileIdentity(): string {
  const lines: string[] = [];
  lines.push("-- qf-kernel-schema generated upgrade: agent-profile-identity");
  lines.push("-- DO NOT EDIT — regenerate with `bun run generate`.");
  lines.push("");

  lines.push("ALTER TABLE agent_definition ADD COLUMN runtime_profile TEXT;");
  lines.push("");

  lines.push("-- Typed directed edges between ontology objects.");
  lines.push("CREATE TABLE links_d1_upgrade (");
  lines.push("  -- Primary key for this link instance.");
  lines.push("  id TEXT PRIMARY KEY NOT NULL,");
  lines.push("  -- Link kind (schema link name), e.g. offered_on.");
  lines.push(`  kind TEXT NOT NULL CHECK (kind IN (${D1_LINK_KINDS})),`);
  lines.push("  -- Source object id.");
  lines.push("  from_id TEXT NOT NULL,");
  lines.push("  -- Target object id.");
  lines.push("  to_id TEXT NOT NULL,");
  lines.push("  -- ISO-8601 UTC timestamp when the link was created.");
  lines.push("  created_at TEXT NOT NULL");
  lines.push(");");
  lines.push(
    "INSERT INTO links_d1_upgrade (id, kind, from_id, to_id, created_at) SELECT id, kind, from_id, to_id, created_at FROM links;",
  );
  lines.push("DROP TABLE links;");
  lines.push("ALTER TABLE links_d1_upgrade RENAME TO links;");
  lines.push("");

  lines.push(
    `UPDATE schema_meta SET description = ${sqlString(agent_definition.description)} WHERE type_name = 'agent_definition';`,
  );
  lines.push(
    `INSERT OR REPLACE INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(spawned_from.name)}, 'link', ${sqlString(spawned_from.lifecycle)}, ${sqlString(spawned_from.description)});`,
  );

  const createSession = schema.actions.find((a) => a.name === "create_agent_session");
  const registerDef = schema.actions.find((a) => a.name === "register_agent_definition");
  if (createSession) {
    lines.push(
      `UPDATE schema_meta SET description = ${sqlString(createSession.description)} WHERE type_name = 'create_agent_session';`,
    );
  }
  if (registerDef) {
    lines.push(
      `UPDATE schema_meta SET description = ${sqlString(registerDef.description)} WHERE type_name = 'register_agent_definition';`,
    );
  }

  lines.push("");
  return lines.join("\n");
}
