import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { servedToolsForSchema } from "qf-kernel-schema/mcp";
import type { Schema } from "qf-kernel-schema/define";
import { shouldServePublishArtifact, type ArtifactRoot } from "./artifact-root.ts";

/**
 * Override tools/list to advertise real generated JSON Schema for every served tool.
 * Action tools keep permissive registerTool validators; reads keep Zod validation as-is.
 */
export function installToolsListHandler(
  server: McpServer,
  schema: Schema,
  artifactRoot: ArtifactRoot,
): void {
  server.server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = servedToolsForSchema(schema).filter((def) => {
      if (def.name === "qf_publish_artifact" && !shouldServePublishArtifact(artifactRoot)) {
        return false;
      }
      return true;
    });
    return {
      tools: tools.map((def) => ({
        name: def.name,
        description: def.description,
        inputSchema: def.inputSchema,
      })),
    };
  });
}
