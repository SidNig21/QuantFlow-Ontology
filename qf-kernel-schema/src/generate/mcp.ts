import { z } from "zod";
import type { Schema } from "../define.ts";

export type McpToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

function toInputJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const raw = z.toJSONSchema(schema, { target: "draft-07", io: "input" }) as Record<
    string,
    unknown
  >;
  const cleaned: Record<string, unknown> = { ...raw };
  delete cleaned.$schema;
  delete cleaned["~standard"];
  return cleaned;
}

const getInput = z.object({
  id: z.string().describe("Object id to fetch."),
});

const queryInput = z.object({
  limit: z.number().int().positive().optional().describe("Maximum rows to return."),
  offset: z.number().int().nonnegative().optional().describe("Rows to skip before returning results."),
});

/**
 * Pure generator: schema in → MCP tool definitions JSON string out.
 * Deterministic; does not touch the filesystem.
 */
export function generateMcp(schema: Schema): string {
  const tools: McpToolDefinition[] = [];

  for (const object of schema.objects) {
    tools.push({
      name: `qf_${object.name}_get`,
      description: `Fetch one ${object.name} by id. ${object.description}`,
      inputSchema: toInputJsonSchema(getInput),
    });
    tools.push({
      name: `qf_${object.name}_query`,
      description: `List ${object.name} rows with optional filters. ${object.description}`,
      inputSchema: toInputJsonSchema(queryInput),
    });
  }

  for (const action of schema.actions) {
    tools.push({
      name: `qf_${action.name}`,
      description: action.description,
      inputSchema: toInputJsonSchema(action.input),
    });
  }

  return `${JSON.stringify(tools, null, 2)}\n`;
}
