import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { countConformanceTests, generateConformance } from "./generate/conformance.ts";
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

  test("conformance.test.ts matches golden byte-for-byte", () => {
    const actual = generateConformance();
    const expected = readFileSync(join(goldenDir, "conformance.test.ts"), "utf8");
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

  test("two consecutive conformance generations are identical", () => {
    expect(generateConformance()).toBe(generateConformance());
  });
});

describe("mcp tool descriptions", () => {
  test("get and query descriptions are distinct per object", () => {
    const tools = JSON.parse(generateMcp(schema)) as Array<{ name: string; description: string }>;
    for (const object of schema.objects) {
      const get = tools.find((t) => t.name === `qf_${object.name}_get`);
      const query = tools.find((t) => t.name === `qf_${object.name}_query`);
      expect(get).toBeDefined();
      expect(query).toBeDefined();
      expect(get!.description).not.toBe(query!.description);
      expect(get!.description.startsWith(`Fetch one ${object.name} by id.`)).toBe(true);
      expect(query!.description.startsWith(`List ${object.name} rows with optional filters.`)).toBe(
        true,
      );
    }
  });
});

describe("conformance counts", () => {
  test("generated file meta matches counted accept/reject totals", () => {
    const { accept, reject, total } = countConformanceTests();
    const text = generateConformance();
    expect(text).toContain(`accept=${accept} reject=${reject} total=${total}`);
    expect(total).toBeGreaterThan(0);
    expect(reject).toBeGreaterThan(0);
  });
});
