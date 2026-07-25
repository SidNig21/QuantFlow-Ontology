import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildActiveSchemaBaseline } from "../src/define.ts";

process.env.QF_SCHEMA_SKIP_ACTIVE_FREEZE = "1";
const { schema } = await import("../src/schema.ts");

const baseline = buildActiveSchemaBaseline(schema);
const baselinePath = join(import.meta.dir, "..", "schema-baseline.json");
const text = `${JSON.stringify(baseline, null, 2)}\n`;
writeFileSync(baselinePath, text, "utf8");

console.log(`Wrote ${baselinePath}`);
