import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateDocs } from "./generate/docs.ts";
import { generateMcp } from "./generate/mcp.ts";
import { generateSql } from "./generate/sql.ts";
import { schema } from "./schema.ts";

const goldenDir = join(import.meta.dir, "..", "golden");

describe("golden outputs", () => {
  test("SQL migration matches golden byte-for-byte", () => {
    const actual = generateSql(schema);
    const expected = readFileSync(join(goldenDir, "migration.sql"), "utf8");
    expect(actual).toBe(expected);
  });

  test("MCP tools match golden byte-for-byte", () => {
    const actual = generateMcp(schema);
    const expected = readFileSync(join(goldenDir, "tools.json"), "utf8");
    expect(actual).toBe(expected);
  });

  test("ONTOLOGY.md matches golden byte-for-byte", () => {
    const actual = generateDocs(schema);
    const expected = readFileSync(join(goldenDir, "ONTOLOGY.md"), "utf8");
    expect(actual).toBe(expected);
  });
});

describe("determinism", () => {
  test("two consecutive SQL generations are identical", () => {
    expect(generateSql(schema)).toBe(generateSql(schema));
  });

  test("two consecutive MCP generations are identical", () => {
    expect(generateMcp(schema)).toBe(generateMcp(schema));
  });

  test("two consecutive docs generations are identical", () => {
    expect(generateDocs(schema)).toBe(generateDocs(schema));
  });
});
