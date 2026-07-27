import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execute, getLinks, getObject, queryObjects, type KernelDb } from "qf-kernel";
import {
  actionToolForAction,
  linksToolInput,
  queryToolInputForObject,
  readToolsForObject,
  type McpToolDefinition,
} from "qf-kernel-schema/mcp";
import type { Schema } from "qf-kernel-schema/define";
import { z } from "zod";
import { installToolsListHandler } from "./discovery.ts";

const getToolInput = z.object({
  id: z.string().describe("Object id to fetch."),
});

/** SDK transport schema — permissive so GATE 1 in execute() is the rejecting layer. */
const actionTransportInput = z.object({}).passthrough();

function toolResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function toolError(err: unknown) {
  return {
    content: [{ type: "text" as const, text: String(err) }],
    isError: true as const,
  };
}

function actionTrace() {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

/**
 * Register read tools by iterating schema.objects only.
 * A new object type yields three tools with no hand-written registration code.
 */
export function registerReadTools(
  server: McpServer,
  db: KernelDb,
  schema: Schema,
): McpToolDefinition[] {
  const registered: McpToolDefinition[] = [];

  for (const object of schema.objects) {
    const defs = readToolsForObject(object);
    registered.push(...defs);

    const [getDef, queryDef, linksDef] = defs;

    server.registerTool(
      getDef.name,
      {
        description: getDef.description,
        inputSchema: getToolInput.shape,
      },
      async ({ id }) => {
        try {
          return toolResult(getObject(db, object.name, id, schema));
        } catch (err) {
          return toolError(err);
        }
      },
    );

    const querySchema = queryToolInputForObject(object);
    server.registerTool(
      queryDef.name,
      {
        description: queryDef.description,
        inputSchema: querySchema.shape,
      },
      async (input) => {
        const { limit, offset, order, ...filters } = input as Record<string, unknown>;
        const rows = queryObjects(
          db,
          object.name,
          filters,
          limit === null ? null : typeof limit === "number" ? limit : undefined,
          typeof offset === "number" ? offset : 0,
          schema,
          order === "asc" || order === "desc" ? order : "desc",
        );
        return toolResult(rows);
      },
    );

    server.registerTool(
      linksDef.name,
      {
        description: linksDef.description,
        inputSchema: linksToolInput.shape,
      },
      async ({ id, kind }) => toolResult(getLinks(db, id, kind ? { kind } : undefined)),
    );
  }

  return registered;
}

/**
 * Register action tools for every schema action where operatorOnly !== true.
 * Transport validation is permissive; execute() applies GATE 1.
 */
export function registerActionTools(
  server: McpServer,
  db: KernelDb,
  schema: Schema,
): McpToolDefinition[] {
  const registered: McpToolDefinition[] = [];

  for (const action of schema.actions) {
    if (action.operatorOnly === true) continue;
    const def = actionToolForAction(action);
    registered.push(def);

    server.registerTool(
      def.name,
      {
        description: def.description,
        inputSchema: actionTransportInput,
      },
      async (args: Record<string, unknown>) => {
        try {
          const result = execute(
            db,
            action.name,
            args as Record<string, unknown>,
            actionTrace(),
          );
          return toolResult(result);
        } catch (err) {
          return toolError(err);
        }
      },
    );
  }

  return registered;
}

/**
 * Register read and action tools, then install the tools/list override.
 * Call once per server after openKernel.
 */
export function registerAllTools(
  server: McpServer,
  db: KernelDb,
  schema: Schema,
): McpToolDefinition[] {
  const read = registerReadTools(server, db, schema);
  const actions = registerActionTools(server, db, schema);
  installToolsListHandler(server, schema);
  return [...read, ...actions];
}
