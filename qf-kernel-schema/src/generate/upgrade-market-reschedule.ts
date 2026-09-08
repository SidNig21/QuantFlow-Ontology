import { reschedule_market_event } from "../ontology/market.ts";
import { sqlString } from "./sql.ts";

/** W1-03 data-preserving upgrade: register the explicit event-reschedule authority. */
export function generateUpgradeMarketReschedule(): string {
  return [
    "-- qf-kernel-schema generated upgrade: market-reschedule",
    "-- DO NOT EDIT — regenerate with `bun run generate`.",
    "",
    `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(reschedule_market_event.name)}, 'action', ${sqlString(reschedule_market_event.lifecycle)}, ${sqlString(reschedule_market_event.description)});`,
    "",
  ].join("\n");
}
