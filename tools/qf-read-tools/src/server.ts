#!/usr/bin/env bun
/**
 * qf-read-tools MCP stdio server.
 *
 * Serves schema-generated read tools (_get, _query, _links) for every object type.
 * Action tools are excluded by construction: registration iterates schema.objects only
 * and never visits schema.actions.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { schema as defaultSchema } from "qf-kernel-schema";
import type { Schema } from "qf-kernel-schema/define";
import { closeKernel, openKernel, type KernelDb } from "qf-kernel";
import { registerReadTools } from "./register.ts";

async function loadSchema(): Promise<Schema> {
  const modPath = process.env.QF_READ_SCHEMA_MODULE;
  if (modPath) {
    const mod = (await import(modPath)) as { schema: Schema };
    return mod.schema;
  }
  return defaultSchema;
}

const kernelDbPath = process.env.QF_KERNEL_DB;
if (!kernelDbPath) {
  console.error("qf-read-tools server: QF_KERNEL_DB env var is required");
  process.exit(1);
}

const schema = await loadSchema();
const db: KernelDb = openKernel(kernelDbPath, { readonly: true });

const server = new McpServer({ name: "qf-read-tools", version: "0.1.0" });
registerReadTools(server, db, schema);

process.on("SIGINT", () => {
  closeKernel(db);
  process.exit(0);
});

const transport = new StdioServerTransport();
await server.connect(transport);
