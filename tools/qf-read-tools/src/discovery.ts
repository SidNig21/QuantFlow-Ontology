import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { servedToolsForSchema } from "qf-kernel-schema/mcp";
import type { Schema } from "qf-kernel-schema/define";

/**
 * Override tools/list to advertise real generated JSON Schema for every served tool.
 * Action tools keep permissive registerTool validators; reads keep Zod validation as-is.
 */
export function installToolsListHandler(server: McpServer, schema: Schema): void {
  server.server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: servedToolsForSchema(schema).map((def) => ({
      name: def.name,
      description: def.description,
      inputSchema: def.inputSchema,
    })),
  }));
}
