import { register_venue, schedule_market_event } from "../ontology/market.ts";
import { sqlString } from "./sql.ts";

/**
 * WO-107c data-preserving upgrade from the WO-107b schema shape.
 * The object and link tables are unchanged; only the two trusted context
 * action authorities enter schema_meta.
 */
export function generateUpgradeMarketContext(): string {
  const lines: string[] = [];
  lines.push("-- qf-kernel-schema generated upgrade: market-context");
  lines.push("-- DO NOT EDIT — regenerate with `bun run generate`.");
  lines.push("");
  for (const action of [register_venue, schedule_market_event]) {
    lines.push(
      `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(action.name)}, 'action', ${sqlString(action.lifecycle)}, ${sqlString(action.description)});`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
