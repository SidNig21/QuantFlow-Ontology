import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getLinks,
  getObject,
  queryObjects,
  type KernelDb,
} from "qf-kernel";
import {
  linksToolInput,
  queryToolInputForObject,
  readToolsForObject,
  type McpToolDefinition,
} from "qf-kernel-schema/mcp";
import type { Schema } from "qf-kernel-schema/define";
import { z } from "zod";

const getToolInput = z.object({
  id: z.string().describe("Object id to fetch."),
});

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

/**
 * Register read tools by iterating schema.objects only — schema.actions are never visited.
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
          return {
            content: [{ type: "text" as const, text: String(err) }],
            isError: true,
          };
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
        const { limit, offset, ...filters } = input as Record<string, unknown>;
        const rows = queryObjects(
          db,
          object.name,
          filters,
          typeof limit === "number" ? limit : undefined,
          typeof offset === "number" ? offset : undefined,
          schema,
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
