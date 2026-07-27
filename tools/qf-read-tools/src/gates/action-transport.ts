#!/usr/bin/env bun
/** WO-106 G2 gate — MCP is not a validator for action tools. */
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CompatibilityCallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { closeKernel, eventCount, execute, openKernel } from "qf-kernel";

const workDir = mkdtempSync(join(tmpdir(), "qf-action-transport-"));
const kernelDbPath = join(workDir, "kernel.db");
const artifactRootPath = join(workDir, "artifact-root");
mkdirSync(artifactRootPath, { recursive: true });
const serverEntry = join(import.meta.dir, "..", "server.ts");

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
    env: envFor({
      QF_KERNEL_DB: kernelDbPath,
      QF_ARTIFACT_ROOT: artifactRootPath,
      ...extraEnv,
    }),
  });
  const client = new Client({ name: "qf-action-transport-gate", version: "0.1.0" });
  await client.connect(transport);
  return client;
}

function toolText(result: CompatibilityCallToolResult): string {
  if ("toolResult" in result) {
    throw new Error("tool returned toolResult instead of content blocks");
  }
  const text = result.content.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("tool returned no text");
  return text;
}

export async function runActionTransportGate(): Promise<void> {
  const db = openKernel(kernelDbPath);
  const ctx = { trace_id: "action-transport-gate", span_id: "span-1" };
  execute(db, "create_run", { run_id: "gate-run-1", kind: "backtest", params: {} }, ctx);
  const eventsBefore = eventCount(db);
  const rowsBefore = (
    db.query(`SELECT COUNT(*) AS n FROM run`).get() as { n: number }
  ).n;
  closeKernel(db);

  const client = await makeClient();

  const result = await client.callTool({
    name: "qf_start_run",
    arguments: { run_id: "gate-run-1", bogus_unknown_key: true },
  });
  console.log("G2_call_result=" + JSON.stringify(result));
  const text = toolText(result);

  if (!result.isError) {
    throw new Error("G2: malformed action should return isError");
  }
  if (!text.includes("bogus_unknown_key") && !text.includes("unrecognized_keys")) {
    throw new Error(`G2: Kernel strict-parse error not visible at transport: ${text}`);
  }

  const dbAfter = openKernel(kernelDbPath);
  const eventsAfter = eventCount(dbAfter);
  const rowsAfter = (
    dbAfter.query(`SELECT COUNT(*) AS n FROM run`).get() as { n: number }
  ).n;
  const status = (
    dbAfter.query(`SELECT status FROM run WHERE id = ?`).get("gate-run-1") as {
      status: string;
    }
  ).status;
  closeKernel(dbAfter);

  console.log(`G2_events_before_after=${eventsBefore} ${eventsAfter}`);
  console.log(`G2_rows_before_after=${rowsBefore} ${rowsAfter}`);
  console.log(`G2_run_status=${status}`);

  if (eventsAfter !== eventsBefore) {
    throw new Error("G2: malformed action wrote events");
  }
  if (rowsAfter !== rowsBefore) {
    throw new Error("G2: malformed action wrote rows");
  }
  if (status !== "queued") {
    throw new Error("G2: malformed action mutated run row");
  }

  await client.close();
  console.log("action-transport PASS");
}

if (import.meta.main) {
  runActionTransportGate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
