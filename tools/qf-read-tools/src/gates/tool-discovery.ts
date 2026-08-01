#!/usr/bin/env bun
/**
 * WO-106 tool-discovery gate (D4, G1, G3).
 *
 * Fixture hook (set before launch):
 *   QF_READ_SCHEMA_MODULE=<fixture>  — G1 bait (b): fixture schema drives advertisement
 */
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { closeKernel, openKernel } from "qf-kernel";
import { schema as productionSchema } from "qf-kernel-schema";
import {
  isActionServedToAgents,
  servedToolsForSchema,
} from "qf-kernel-schema/mcp";
import type { Schema } from "qf-kernel-schema/define";

const workDir = mkdtempSync(join(tmpdir(), "qf-tool-discovery-"));
const kernelDbPath = join(workDir, "kernel.db");
const artifactRootPath = join(workDir, "artifact-root");
mkdirSync(artifactRootPath, { recursive: true });
const serverEntry = join(import.meta.dir, "..", "server.ts");
const MCP_LIFECYCLE_TIMEOUT_MS = 10_000;

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
  const client = new Client({ name: "qf-tool-discovery-gate", version: "0.1.0" });
  console.log("mcp_connect=begin");
  try {
    await withTimeout(client.connect(transport), "mcp_connect");
    console.log("mcp_connect=end");
    return client;
  } catch (error) {
    await withTimeout(transport.close(), "mcp_transport_close").catch(() => {});
    await withTimeout(client.close(), "mcp_close").catch(() => {});
    throw error;
  }
}

async function withTimeout<T>(operation: Promise<T>, marker: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${marker} timed out after ${MCP_LIFECYCLE_TIMEOUT_MS}ms`));
        }, MCP_LIFECYCLE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function servedToolNames(schema: Schema): Set<string> {
  return new Set(servedToolsForSchema(schema).map((t) => t.name));
}

function generatedToolNames(schema: Schema): Set<string> {
  const names = new Set<string>();
  for (const object of schema.objects) {
    names.add(`qf_${object.name}_get`);
    names.add(`qf_${object.name}_query`);
    names.add(`qf_${object.name}_links`);
  }
  for (const action of schema.actions) {
    names.add(`qf_${action.name}`);
  }
  return names;
}

function restrictedActionNames(schema: Schema): Set<string> {
  return new Set(
    schema.actions.filter((a) => !isActionServedToAgents(a)).map((a) => `qf_${a.name}`),
  );
}

type ListedTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
};

function assertNoMetaInputSchema(tools: ListedTool[]): void {
  for (const tool of tools) {
    if (tool._meta && "qf/inputSchema" in tool._meta) {
      throw new Error(`${tool.name} still carries _meta["qf/inputSchema"]`);
    }
  }
}

function assertDescriptions(tools: ListedTool[]): void {
  for (const tool of tools) {
    if (!tool.description || tool.description.trim().length === 0) {
      throw new Error(`${tool.name} has empty description`);
    }
  }
}

function assertSchemaEquality(advertised: ListedTool[], schema: Schema): void {
  const expected = servedToolsForSchema(schema);
  const expectedByName = new Map(expected.map((t) => [t.name, t.inputSchema]));
  for (const tool of advertised) {
    const gen = expectedByName.get(tool.name);
    if (!gen) {
      throw new Error(`advertised tool ${tool.name} not in served generator set`);
    }
    if (!deepEqual(tool.inputSchema, gen)) {
      throw new Error(`inputSchema mismatch for ${tool.name}`);
    }
  }
}

function assertSetRelations(advertised: Set<string>, schema: Schema): void {
  const served = servedToolNames(schema);
  const generated = generatedToolNames(schema);
  // Restricted set is anchored to production schema so a fixture cannot move both sides together.
  const restricted = restrictedActionNames(productionSchema);

  console.log(`G3_advertised_count=${advertised.size}`);
  console.log(`G3_served_count=${served.size}`);
  console.log(`G3_generated_count=${generated.size}`);

  for (const name of restricted) {
    console.log(`G3_restricted_${name}_in_generated=${generated.has(name)}`);
    console.log(`G3_restricted_${name}_in_advertised=${advertised.has(name)}`);
    console.log(`G3_restricted_${name}_in_served=${served.has(name)}`);
  }

  if (!setsEqual(advertised, served)) {
    throw new Error("G3: advertised set !== served set");
  }
  for (const name of restricted) {
    if (!generated.has(name)) {
      throw new Error(`G3: restricted tool ${name} missing from generated set`);
    }
    if (advertised.has(name) || served.has(name)) {
      throw new Error(`G3: restricted tool ${name} leaked into advertised or served set`);
    }
  }
  const expectedServed = new Set([...generated].filter((n) => !restricted.has(n)));
  if (!setsEqual(served, expectedServed)) {
    throw new Error("G3: served set !== generated minus restricted actions");
  }
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function requiredFields(schema: Record<string, unknown> | undefined): string[] {
  const req = schema?.required;
  return Array.isArray(req) ? (req as string[]) : [];
}

function assertNamedTaskReachable(tools: ListedTool[]): void {
  const byName = new Map(tools.map((t) => [t.name, t]));
  const steps: Array<{ tool: string; fields: string[] }> = [
    { tool: "qf_create_run", fields: ["run_id", "kind"] },
    { tool: "qf_start_run", fields: ["run_id"] },
    {
      tool: "qf_publish_artifact",
      fields: ["kind", "storage_ref"],
    },
    { tool: "qf_artifact_get", fields: ["id"] },
  ];
  for (const step of steps) {
    const def = byName.get(step.tool);
    if (!def) throw new Error(`named task missing tool ${step.tool}`);
    const req = requiredFields(def.inputSchema);
    for (const field of step.fields) {
      if (!req.includes(field)) {
        throw new Error(`named task: ${step.tool} required field ${field} not in advertisement`);
      }
    }
    const props = def.inputSchema?.properties as Record<string, unknown> | undefined;
    if (!props) throw new Error(`named task: ${step.tool} has no properties in advertisement`);
    for (const field of step.fields) {
      if (!(field in props)) {
        throw new Error(`named task: ${step.tool} property ${field} not reachable from advertisement`);
      }
    }
  }
  console.log("named_task_fields_reachable=true");
}

export async function runToolDiscoveryGate(): Promise<void> {
  const db = openKernel(kernelDbPath, { create: true });
  closeKernel(db);

  const schemaModule = process.env.QF_READ_SCHEMA_MODULE;
  const schema: Schema = schemaModule
    ? ((await import(schemaModule)) as { schema: Schema }).schema
    : productionSchema;

  const client = await makeClient(
    schemaModule ? { QF_READ_SCHEMA_MODULE: schemaModule } : {},
  );
  console.log("mcp_tools_list=begin");
  const listed = await withTimeout(client.listTools(), "mcp_tools_list");
  console.log("mcp_tools_list=end");
  const advertised = listed.tools as ListedTool[];
  const advertisedNames = new Set(advertised.map((t) => t.name));

  assertNoMetaInputSchema(advertised);
  assertDescriptions(advertised);
  assertSchemaEquality(advertised, schema);
  assertSetRelations(advertisedNames, schema);
  assertNamedTaskReachable(advertised);

  if (schemaModule?.endsWith("experimental-schema.ts")) {
    const experimental = advertised
      .map((t) => t.name)
      .filter((n) => n.startsWith("qf_experimental_"));
    console.log("G1_fixture_experimental_tools=" + JSON.stringify(experimental.sort()));
    if (experimental.length !== 3) {
      throw new Error(`fixture schema: expected 3 experimental tools, got ${experimental.length}`);
    }
  }

  await withTimeout(client.close(), "mcp_close");
  console.log("tool-discovery PASS");
}

function textFrom(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const content = (result as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  return content
    .filter(
      (block): block is { type: "text"; text?: string } =>
        Boolean(block) &&
        typeof block === "object" &&
        (block as { type?: unknown }).type === "text",
    )
    .map((block) => block.text ?? "")
    .join("\n");
}

export async function runMarketContextMcpBoundary(): Promise<void> {
  const db = openKernel(kernelDbPath, { create: true });
  closeKernel(db);

  const client = await makeClient();
  try {
    console.log("mcp_tools_list=begin");
    const listed = await withTimeout(client.listTools(), "mcp_tools_list");
    console.log("mcp_tools_list=end");
    const names = new Set(listed.tools.map((tool) => tool.name));
    for (const name of ["qf_register_venue", "qf_schedule_market_event"]) {
      if (names.has(name)) throw new Error(`tools/list advertised hidden context action ${name}`);
    }
    console.log("context_tools_list_absent=true");

    for (const name of ["qf_register_venue", "qf_schedule_market_event"]) {
      try {
        const result = await withTimeout(
          client.callTool({ name, arguments: {} }),
          `${name}_direct_call`,
        );
        if (!result.isError) throw new Error(`${name} direct MCP call unexpectedly succeeded`);
        const message = textFrom(result).toLowerCase();
        if (!message.includes("not found") && !message.includes("unknown tool")) {
          throw new Error(`${name} direct MCP call returned non-tool-not-found error: ${message}`);
        }
        console.log(`${name}_direct_tool_not_found=true`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.toLowerCase().includes("not found") && !message.toLowerCase().includes("unknown tool")) {
          throw error;
        }
        console.log(`${name}_direct_tool_not_found=true`);
      }
    }
  } finally {
    await withTimeout(client.close(), "mcp_close").catch(() => {});
  }
}

if (import.meta.main) {
  const run = process.env.QF_CONTEXT_MCP_BOUNDARY_ONLY === "1"
    ? runMarketContextMcpBoundary
    : runToolDiscoveryGate;
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
