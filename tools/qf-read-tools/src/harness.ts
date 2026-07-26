#!/usr/bin/env bun
/**
 * WO-105 tool-plane harness: read + action tools over real MCP transport.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  closeKernel,
  eventCount,
  execute,
  openKernel,
  seedExperimentalFixtureTable,
  type KernelDb,
} from "qf-kernel";
import { schema as productionSchema } from "qf-kernel-schema";
import type { Schema } from "qf-kernel-schema/define";

const workDir = mkdtempSync(join(tmpdir(), "qf-tool-plane-harness-"));
const kernelDbPath = join(workDir, "kernel.db");
const serverEntry = join(import.meta.dir, "server.ts");
const fixtureSchema = join(import.meta.dir, "fixtures/experimental-schema.ts");
const observeLeakSchema = join(import.meta.dir, "fixtures/observe-leak-schema.ts");

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
  const client = new Client({ name: "qf-tool-plane-harness", version: "0.1.0" });
  await client.connect(transport);
  return client;
}

function expectedServedToolNames(schema: Schema): Set<string> {
  const names = new Set<string>();
  for (const object of schema.objects) {
    names.add(`qf_${object.name}_get`);
    names.add(`qf_${object.name}_query`);
    names.add(`qf_${object.name}_links`);
  }
  for (const action of schema.actions) {
    if (action.operatorOnly !== true) {
      names.add(`qf_${action.name}`);
    }
  }
  return names;
}

function toolText(result: { content: unknown }): string {
  const text = (result.content as Array<{ type: string; text?: string }>).find(
    (c) => c.type === "text",
  )?.text;
  if (!text) throw new Error("tool returned no text");
  return text;
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

async function assertServedSet(client: Client, schema: Schema): Promise<void> {
  const listed = await client.listTools();
  const served = new Set(listed.tools.map((t) => t.name));
  const expected = expectedServedToolNames(schema);
  console.log(
    `tool_plane_expected_count=${expected.size} served_count=${served.size} read=${schema.objects.length * 3} actions=${schema.actions.filter((a) => a.operatorOnly !== true).length}`,
  );
  if (served.size !== expected.size) {
    throw new Error(`set-equality: expected ${expected.size} tools, got ${served.size}`);
  }
  for (const name of expected) {
    if (!served.has(name)) throw new Error(`set-equality: missing ${name}`);
  }
  for (const name of served) {
    if (!expected.has(name)) throw new Error(`set-equality: unexpected ${name}`);
  }
  const operatorOnlyLeaks = schema.actions
    .filter((a) => a.operatorOnly === true)
    .map((a) => `qf_${a.name}`)
    .filter((name) => served.has(name));
  console.log("tool_plane_operator_only_leaks=" + JSON.stringify(operatorOnlyLeaks));
  if (operatorOnlyLeaks.length > 0) {
    throw new Error(`operatorOnly actions served: ${operatorOnlyLeaks.join(", ")}`);
  }
}

async function gateG2(): Promise<void> {
  console.log("\n=== G2 doctrine phase-exit gate ===");
  const db = openKernel(kernelDbPath);
  seedExperimentalTable(db);
  closeKernel(db);

  const mod = (await import(fixtureSchema)) as { schema: Schema };
  const client = await makeClient({ QF_READ_SCHEMA_MODULE: fixtureSchema });
  await assertServedSet(client, mod.schema);
  const listed = await client.listTools();
  const experimentalTools = listed.tools.map((t) => t.name).filter((n) => n.startsWith("qf_experimental_"));
  console.log("G2_experimental_tools=" + JSON.stringify(experimentalTools.sort()));
  if (experimentalTools.length !== 3) {
    throw new Error(`expected 3 experimental read tools, got ${experimentalTools.length}`);
  }
  if (!listed.tools.some((t) => t.name === "qf_probe_action")) {
    throw new Error("G2: fixture probe_action missing from served set");
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
  await assertServedSet(client, productionSchema);
  const viaTool = await client.callTool({
    name: "qf_hypothesis_links",
    arguments: { id: hypothesisId },
  });
  console.log("G3_tool_response=" + JSON.stringify(viaTool));
  console.log("G3_sql_rows=" + JSON.stringify(toolLinks));

  const parsed = JSON.parse(toolText(viaTool)) as Array<{
    kind: string;
    from_id: string;
    to_id: string;
  }>;
  const norm = (rows: typeof parsed) =>
    rows
      .map((r) => ({ kind: r.kind, from_id: r.from_id, to_id: r.to_id }))
      .sort((a, b) =>
        `${a.kind}:${a.from_id}:${a.to_id}`.localeCompare(`${b.kind}:${b.from_id}:${b.to_id}`),
      );
  if (JSON.stringify(norm(parsed)) !== JSON.stringify(norm(toolLinks))) {
    throw new Error("G3: tool rows do not match SQL");
  }
  await client.close();
}

async function gateToolPlaneActions(): Promise<void> {
  console.log("\n=== tool-plane action surface ===");
  const db = openKernel(kernelDbPath);
  const ctx = { trace_id: "harness-trace", span_id: "span-action-1" };
  execute(db, "create_run", { run_id: "harness-run-action", kind: "backtest", params: {} }, ctx);
  execute(db, "create_run", { run_id: "harness-run-action-ok", kind: "backtest", params: {} }, {
    ...ctx,
    span_id: "span-action-2",
  });
  const eventsBefore = eventCount(db);
  closeKernel(db);

  const client = await makeClient();
  await assertServedSet(client, productionSchema);

  const listed = await client.listTools();
  if (listed.tools.some((t) => t.name === "qf_observe_ticket")) {
    throw new Error("qf_observe_ticket must not be served");
  }

  const bad = await client.callTool({
    name: "qf_start_run",
    arguments: { run_id: "harness-run-action", bogus_gate1_field: true },
  });
  console.log("tool_plane_action_bad=" + JSON.stringify(bad));
  const badText = toolText(bad);
  if (!bad.isError) throw new Error("malformed start_run should be error");
  if (!badText.includes("bogus_gate1_field") && !badText.includes("unrecognized_keys")) {
    throw new Error(`GATE 1 error not visible at transport: ${badText}`);
  }

  const dbAfterBad = openKernel(kernelDbPath);
  const eventsAfterBad = eventCount(dbAfterBad);
  const statusAfterBad = (
    dbAfterBad.query(`SELECT status FROM run WHERE id = ?`).get("harness-run-action") as {
      status: string;
    }
  ).status;
  closeKernel(dbAfterBad);
  console.log(`tool_plane_events_before_after_bad=${eventsBefore} ${eventsAfterBad}`);
  console.log(`tool_plane_run_status_after_bad=${statusAfterBad}`);
  if (eventsAfterBad !== eventsBefore) throw new Error("malformed action wrote events");
  if (statusAfterBad !== "queued") throw new Error("malformed action mutated run row");

  const ok = await client.callTool({
    name: "qf_start_run",
    arguments: { run_id: "harness-run-action-ok" },
  });
  console.log("tool_plane_action_ok=" + JSON.stringify(ok));
  if (ok.isError) throw new Error(`well-formed start_run failed: ${toolText(ok)}`);

  await client.close();
}

async function gateIllegalTransition(): Promise<void> {
  console.log("\n=== GATE 2 via action tool ===");
  const db = openKernel(kernelDbPath);
  execute(
    db,
    "create_run",
    { run_id: "harness-run-illegal", kind: "backtest", params: {} },
    { trace_id: "harness-trace", span_id: "span-illegal-1" },
  );
  const eventsBefore = eventCount(db);
  closeKernel(db);

  const client = await makeClient();
  const result = await client.callTool({
    name: "qf_complete_run",
    arguments: { run_id: "harness-run-illegal" },
  });
  console.log("tool_plane_illegal_transition=" + JSON.stringify(result));
  if (!result.isError) throw new Error("illegal complete_run from queued should fail");

  const dbAfter = openKernel(kernelDbPath);
  const eventsAfter = eventCount(dbAfter);
  const status = (
    dbAfter.query(`SELECT status FROM run WHERE id = ?`).get("harness-run-illegal") as {
      status: string;
    }
  ).status;
  closeKernel(dbAfter);
  console.log(`tool_plane_illegal_events_before_after=${eventsBefore} ${eventsAfter}`);
  console.log(`tool_plane_illegal_status=${status}`);
  if (eventsAfter !== eventsBefore) throw new Error("illegal transition wrote events");
  if (status !== "queued") throw new Error("illegal transition mutated row");
  await client.close();
}

export async function runHarness(): Promise<void> {
  const db = openKernel(kernelDbPath);
  closeKernel(db);

  await gateG2();
  await gateG3();
  await gateToolPlaneActions();
  await gateIllegalTransition();
  console.log("\n[harness] tool-plane PASS");
}

if (import.meta.main) {
  runHarness().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
