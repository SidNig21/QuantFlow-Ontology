import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateDocs } from "../src/generate/docs.ts";
import { generateMcp } from "../src/generate/mcp.ts";
import { generateSql } from "../src/generate/sql.ts";
import { schema } from "../src/schema.ts";

const goldenDir = join(import.meta.dir, "..", "golden");
mkdirSync(goldenDir, { recursive: true });

writeFileSync(join(goldenDir, "migration.sql"), generateSql(schema), "utf8");
writeFileSync(join(goldenDir, "tools.json"), generateMcp(schema), "utf8");
writeFileSync(join(goldenDir, "ONTOLOGY.md"), generateDocs(schema), "utf8");

console.log("Wrote golden/migration.sql, golden/tools.json, golden/ONTOLOGY.md");
