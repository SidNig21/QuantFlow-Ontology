#!/usr/bin/env bun
/**
 * qf-read-tools MCP stdio server.
 *
 * Serves schema-generated read tools (_get, _query, _links) for every object type
 * and action tools for every non-operatorOnly action. Writes go through execute().
 *
 * Kernel path: resolveKernelPath() — QF_KERNEL_DB if set, else platform default.
 * Absence of the env var is no longer fatal (WO-K1); the resolver is the answer.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { schema as defaultSchema } from "qf-kernel-schema";
import type { Schema } from "qf-kernel-schema/define";
import { closeKernel, openKernel, resolveKernelPath, type KernelDb } from "qf-kernel";
import { loadArtifactRoot } from "./artifact-root.ts";
import { registerAllTools } from "./register.ts";

async function loadSchema(): Promise<Schema> {
  const modPath = process.env.QF_READ_SCHEMA_MODULE;
  if (modPath) {
    const mod = (await import(modPath)) as { schema: Schema };
    return mod.schema;
  }
  return defaultSchema;
}

const resolved = resolveKernelPath();
const schema = await loadSchema();
const db: KernelDb = openKernel(resolved.path, {
  provenance: resolved.provenance,
});
const artifactRoot = loadArtifactRoot();

const server = new McpServer({ name: "qf-read-tools", version: "0.1.0" });
registerAllTools(server, db, schema, artifactRoot);

process.on("SIGINT", () => {
  closeKernel(db);
  process.exit(0);
});

const transport = new StdioServerTransport();
await server.connect(transport);
