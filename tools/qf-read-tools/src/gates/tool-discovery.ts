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
  servedToolsForSchema,
} from "qf-kernel-schema/mcp";
import type { Schema } from "qf-kernel-schema/define";

const workDir = mkdtempSync(join(tmpdir(), "qf-tool-discovery-"));
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
  const client = new Client({ name: "qf-tool-discovery-gate", version: "0.1.0" });
  await client.connect(transport);
  return client;
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

function operatorOnlyActionNames(schema: Schema): Set<string> {
  return new Set(
    schema.actions.filter((a) => a.operatorOnly === true).map((a) => `qf_${a.name}`),
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
  // Operator-only set is anchored to production schema so G3 bait cannot move both sides together.
  const operatorOnly = operatorOnlyActionNames(productionSchema);

  console.log(`G3_advertised_count=${advertised.size}`);
  console.log(`G3_served_count=${served.size}`);
  console.log(`G3_generated_count=${generated.size}`);

  for (const name of operatorOnly) {
    console.log(`G3_operator_only_${name}_in_generated=${generated.has(name)}`);
    console.log(`G3_operator_only_${name}_in_advertised=${advertised.has(name)}`);
    console.log(`G3_operator_only_${name}_in_served=${served.has(name)}`);
  }

  if (!setsEqual(advertised, served)) {
    throw new Error("G3: advertised set !== served set");
  }
  for (const name of operatorOnly) {
    if (!generated.has(name)) {
      throw new Error(`G3: operatorOnly tool ${name} missing from generated set`);
    }
    if (advertised.has(name) || served.has(name)) {
      throw new Error(`G3: operatorOnly tool ${name} leaked into advertised or served set`);
    }
  }
  const expectedServed = new Set([...generated].filter((n) => !operatorOnly.has(n)));
  if (!setsEqual(served, expectedServed)) {
    throw new Error("G3: served set !== generated minus operatorOnly");
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
  const listed = await client.listTools();
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

  await client.close();
  console.log("tool-discovery PASS");
}

if (import.meta.main) {
  runToolDiscoveryGate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
