import { ingest_market_batch } from "../ontology/market.ts";
import { sqlString } from "./sql.ts";

/**
 * WO-107b data-preserving upgrade from the D1 / WO-N1 schema shape.
 * The object tables are unchanged; only the new action authority enters schema_meta.
 */
export function generateUpgradeMarketIngest(): string {
  const lines: string[] = [];
  lines.push("-- qf-kernel-schema generated upgrade: market-ingest");
  lines.push("-- DO NOT EDIT — regenerate with `bun run generate`.");
  lines.push("");
  lines.push(
    `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(ingest_market_batch.name)}, 'action', ${sqlString(ingest_market_batch.lifecycle)}, ${sqlString(ingest_market_batch.description)});`,
  );
  lines.push("");
  return lines.join("\n");
}
