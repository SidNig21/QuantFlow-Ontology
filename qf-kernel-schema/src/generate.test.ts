import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { countConformanceTests, generateConformance } from "./generate/conformance.ts";
import { generateDocs } from "./generate/docs.ts";
import { generateMcp, servedToolsForSchema } from "./generate/mcp.ts";
import { generateSql } from "./generate/sql.ts";
import { generateUpgradeAgentProfileIdentity } from "./generate/upgrade-agent-profile-identity.ts";
import { generateUpgradeMarketIngest } from "./generate/upgrade-market-ingest.ts";
import { generateUpgradeMarketContext } from "./generate/upgrade-market-context.ts";
import { generateUpgradeCapabilityGrants } from "./generate/upgrade-capability-grants.ts";
import { generateUpgradeTaskStatus } from "./generate/upgrade-task-status.ts";
import { generateUpgradeConnectionActions } from "./generate/upgrade-connection-actions.ts";
import { generateUpgradeTaskDelegation } from "./generate/upgrade-task-delegation.ts";
import { generateUpgradeDeterministicExecution } from "./generate/upgrade-deterministic-execution.ts";
import { generateUpgradeIndependentCritic } from "./generate/upgrade-independent-critic.ts";
import { generateUpgradeTaskSteering } from "./generate/upgrade-task-steering.ts";
import { schema } from "./schema.ts";

const goldenDir = join(import.meta.dir, "..", "golden");

function fileSha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

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

  test("agent-profile-identity upgrade matches golden byte-for-byte", () => {
    const actual = generateUpgradeAgentProfileIdentity();
    const expected = readFileSync(
      join(goldenDir, "upgrades", "0001-agent-profile-identity.sql"),
      "utf8",
    );
    expect(actual).toBe(expected);
  });

  test("market-ingest upgrade matches golden byte-for-byte", () => {
    const actual = generateUpgradeMarketIngest();
    const expected = readFileSync(
      join(goldenDir, "upgrades", "0002-market-ingest.sql"),
      "utf8",
    );
    expect(actual).toBe(expected);
  });

  test("market-context upgrade matches golden byte-for-byte", () => {
    const actual = generateUpgradeMarketContext();
    const expected = readFileSync(
      join(goldenDir, "upgrades", "0003-market-context.sql"),
      "utf8",
    );
    expect(actual).toBe(expected);
  });

  test("capability-grants upgrade matches golden byte-for-byte", () => {
    const actual = generateUpgradeCapabilityGrants();
    const expected = readFileSync(
      join(goldenDir, "upgrades", "0004-capability-grants.sql"),
      "utf8",
    );
    expect(actual).toBe(expected);
  });

  test("task-status upgrade matches golden byte-for-byte", () => {
    const actual = generateUpgradeTaskStatus();
    const expected = readFileSync(
      join(goldenDir, "upgrades", "0005-task-status.sql"),
      "utf8",
    );
    expect(actual).toBe(expected);
  });

  test("connection-actions upgrade matches golden byte-for-byte", () => {
    const actual = generateUpgradeConnectionActions();
    const expected = readFileSync(
      join(goldenDir, "upgrades", "0006-connection-actions.sql"),
      "utf8",
    );
    expect(actual).toBe(expected);
  });

  test("task-delegation upgrade matches golden byte-for-byte", () => {
    const actual = generateUpgradeTaskDelegation();
    const expected = readFileSync(
      join(goldenDir, "upgrades", "0007-task-delegation.sql"),
      "utf8",
    );
    expect(actual).toBe(expected);
  });

  test("deterministic-execution upgrade matches golden byte-for-byte", () => {
    const actual = generateUpgradeDeterministicExecution();
    const expected = readFileSync(
      join(goldenDir, "upgrades", "0008-deterministic-execution.sql"),
      "utf8",
    );
    expect(actual).toBe(expected);
  });

  test("independent-critic upgrade matches golden byte-for-byte", () => {
    const actual = generateUpgradeIndependentCritic();
    const expected = readFileSync(
      join(goldenDir, "upgrades", "0009-independent-critic.sql"),
      "utf8",
    );
    expect(actual).toBe(expected);
  });

  test("historical task upgrades stay byte-stable", () => {
    expect(fileSha256(join(goldenDir, "upgrades", "0001-agent-profile-identity.sql"))).toBe(
      "a0a4dc1259aa658cf1a4fe7e47585ed5f289d2963d3306b5d687ffbc8de2a768",
    );
    expect(fileSha256(join(goldenDir, "upgrades", "0005-task-status.sql"))).toBe(
      "2df9f05c66efba16f3493082f5cfd191cbbb3c696ee42f5abe204fbe65a3b820",
    );
  });

  test("task-steering upgrade matches golden byte-for-byte", () => {
    expect(generateUpgradeTaskSteering()).toBe(readFileSync(join(goldenDir, "upgrades", "0011-task-steering.sql"), "utf8"));
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
  test("get, query, and links descriptions are distinct per object", () => {
    const tools = JSON.parse(generateMcp(schema)) as Array<{ name: string; description: string }>;
    for (const object of schema.objects) {
      const get = tools.find((t) => t.name === `qf_${object.name}_get`);
      const query = tools.find((t) => t.name === `qf_${object.name}_query`);
      const links = tools.find((t) => t.name === `qf_${object.name}_links`);
      expect(get).toBeDefined();
      expect(query).toBeDefined();
      expect(links).toBeDefined();
      expect(get!.description).not.toBe(query!.description);
      expect(get!.description).not.toBe(links!.description);
      expect(query!.description).not.toBe(links!.description);
      expect(get!.description.startsWith(`Fetch one ${object.name} by id.`)).toBe(true);
      expect(query!.description.startsWith(`List ${object.name} rows with optional filters.`)).toBe(
        true,
      );
      expect(
        links!.description.startsWith(`Traverse links touching one ${object.name} by id.`),
      ).toBe(true);
    }
  });

  test("read tool count is three per object plus one action per action", () => {
    const tools = JSON.parse(generateMcp(schema)) as Array<{ name: string }>;
    expect(tools).toHaveLength(schema.objects.length * 3 + schema.actions.filter((action) => action.internalOnly !== true).length);
    const readSuffixes = ["_get", "_query", "_links"] as const;
    for (const object of schema.objects) {
      for (const suffix of readSuffixes) {
        expect(tools.some((t) => t.name === `qf_${object.name}${suffix}`)).toBe(true);
      }
    }
  });

  test("pipeline-only action is complete generated authority but is not served to agents", () => {
    const complete = JSON.parse(generateMcp(schema)) as Array<{ name: string }>;
    const served = servedToolsForSchema(schema);
    expect(complete.some((tool) => tool.name === "qf_ingest_market_batch")).toBe(true);
    expect(served.some((tool) => tool.name === "qf_ingest_market_batch")).toBe(false);
    const restrictedActions = schema.actions.filter(
      (action) => action.operatorOnly === true || action.pipelineOnly === true,
    );
    expect(served).toHaveLength(complete.length - restrictedActions.length);
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

test("record_evaluation publishes an exact numeric rubric object", () => {
  const tools = JSON.parse(generateMcp(schema)) as Array<{
    name: string;
    inputSchema: { properties?: Record<string, unknown> };
  }>;
  const recordEvaluation = tools.find((tool) => tool.name === "qf_record_evaluation");
  expect(recordEvaluation).toBeDefined();
  const rubric = recordEvaluation?.inputSchema.properties?.rubric;
  expect(rubric).toEqual({
    type: "object",
    properties: {
      faithfulness: { type: "number", minimum: 0, maximum: 1 },
      answer_relevancy: { type: "number", minimum: 0, maximum: 1 },
      context_precision: { type: "number", minimum: 0, maximum: 1 },
      context_recall: { type: "number", minimum: 0, maximum: 1 },
    },
    required: ["faithfulness", "answer_relevancy", "context_precision", "context_recall"],
    additionalProperties: false,
    description: "Exactly four finite scores: faithfulness, answer_relevancy, context_precision, context_recall.",
  });
});
