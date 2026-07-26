#!/usr/bin/env bun
/**
 * WO-104 builder gates G2–G4: MCP read-tools proof harness.
 * Real stdio MCP transport, real Kernel db, no mocks.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  closeKernel,
  execute,
  openKernel,
  seedExperimentalFixtureTable,
  type KernelDb,
} from "qf-kernel";
import { schema } from "qf-kernel-schema";

const workDir = mkdtempSync(join(tmpdir(), "qf-read-tools-harness-"));
const kernelDbPath = join(workDir, "kernel.db");
const serverEntry = join(import.meta.dir, "server.ts");
const fixtureSchema = join(import.meta.dir, "fixtures/experimental-schema.ts");

console.log(`[harness] work dir: ${workDir}`);
console.log(`[harness] kernel db: ${kernelDbPath}`);

function envFor(overrides: Record<string, string>): Record<string, string> {
  const base: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) base[k] = v;
  }
  return { ...base, ...overrides };
}

async function makeClient(extraEnv: Record<string, string> = {}): Promise<Client> {
  const transport = new StdioClientTransport({
    command: "bun",
    args: [serverEntry],
    env: envFor({ QF_KERNEL_DB: kernelDbPath, ...extraEnv }),
  });
  const client = new Client({ name: "qf-read-tools-harness", version: "0.1.0" });
  await client.connect(transport);
  return client;
}

function seedGraph(db: KernelDb): { hypothesisId: string } {
  const ctx = { trace_id: "harness-trace", span_id: "span-1" };
  const hyp = execute(
    db,
    "create_hypothesis",
    { claim: "harness", success_criteria: "bar", sources: ["s"] },
    ctx,
  );
  execute(
    db,
    "create_run",
    {
      run_id: "harness-run-1",
      kind: "backtest",
      params: {},
      links: [{ kind: "tests", to_id: hyp.object_id }],
    },
    { ...ctx, span_id: "span-2" },
  );
  return { hypothesisId: hyp.object_id };
}

function seedExperimentalTable(db: KernelDb): void {
  seedExperimentalFixtureTable(db);
}

async function gateG2(): Promise<void> {
  console.log("\n=== G2 doctrine phase-exit gate ===");
  const db = openKernel(kernelDbPath);
  seedExperimentalTable(db);
  closeKernel(db);

  const client = await makeClient({ QF_READ_SCHEMA_MODULE: fixtureSchema });
  const listed = await client.listTools();
  const names = listed.tools.map((t) => t.name).sort();
  const experimentalTools = names.filter((n) => n.startsWith("qf_experimental_"));
  console.log("G2_experimental_tools=" + JSON.stringify(experimentalTools));
  if (experimentalTools.length !== 3) {
    throw new Error(`expected 3 experimental tools, got ${experimentalTools.length}`);
  }

  const got = await client.callTool({ name: "qf_experimental_get", arguments: { id: "exp-probe-1" } });
  console.log("G2_experimental_get_response=" + JSON.stringify(got));
  await client.close();
}

async function gateG3(): Promise<void> {
  console.log("\n=== G3 links traversal ===");
  const db = openKernel(kernelDbPath);
  const { hypothesisId } = seedGraph(db);

  const toolLinks = db
    .query(
      `SELECT kind, from_id, to_id FROM links WHERE from_id = ? OR to_id = ? ORDER BY kind, from_id, to_id`,
    )
    .all(hypothesisId, hypothesisId) as Array<{ kind: string; from_id: string; to_id: string }>;

  closeKernel(db);

  const client = await makeClient();
  const viaTool = await client.callTool({
    name: "qf_hypothesis_links",
    arguments: { id: hypothesisId },
  });
  console.log("G3_tool_response=" + JSON.stringify(viaTool));
  console.log("G3_sql_rows=" + JSON.stringify(toolLinks));

  const text = (viaTool.content as Array<{ type: string; text?: string }>).find(
    (c) => c.type === "text",
  )?.text;
  if (!text) throw new Error("G3: tool returned no text");
  const parsed = JSON.parse(text) as Array<{ kind: string; from_id: string; to_id: string }>;
  const norm = (rows: typeof parsed) =>
    rows
      .map((r) => ({ kind: r.kind, from_id: r.from_id, to_id: r.to_id }))
      .sort((a, b) =>
        `${a.kind}:${a.from_id}:${a.to_id}`.localeCompare(`${b.kind}:${b.from_id}:${b.to_id}`),
      );
  const a = norm(parsed);
  const b = norm(toolLinks);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error("G3: tool rows do not match SQL");
  }
  await client.close();
}

async function gateG4(): Promise<void> {
  console.log("\n=== G4 zero action tools served ===");
  const client = await makeClient();
  const listed = await client.listTools();
  const names = listed.tools.map((t) => t.name).sort();
  console.log("G4_tools_list_length=" + names.length);
  console.log("G4_tools_list_raw=" + JSON.stringify(listed, null, 2));

  if (names.length !== 69) {
    throw new Error(`G4: expected 69 tools, got ${names.length}`);
  }
  for (const name of names) {
    if (!/_(get|query|links)$/.test(name)) {
      throw new Error(`G4: unexpected tool name ${name}`);
    }
  }
  const actionToolNames = new Set(schema.actions.map((a) => `qf_${a.name}`));
  const leaked = names.filter((n) => actionToolNames.has(n));
  console.log("G4_action_tools_leaked=" + JSON.stringify(leaked));
  if (leaked.length > 0) {
    throw new Error(`G4: action tools leaked: ${leaked.join(", ")}`);
  }
  await client.close();
}

async function main(): Promise<void> {
  const db = openKernel(kernelDbPath);
  closeKernel(db);

  await gateG2();
  await gateG3();
  await gateG4();
  console.log("\n[harness] G2 G3 G4 PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
