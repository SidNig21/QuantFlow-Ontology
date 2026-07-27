import { z } from "zod";
import { propertyDescription, unwrapZodType, type DefinedObject, type Schema } from "../define.ts";

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

function zodDefType(field: z.ZodType): string | undefined {
  return (field as { _zod?: { def?: { type?: string } } })._zod?.def?.type;
}

/** Whether a declared property can be exposed as an optional equality filter in _query. */
function isFilterableProperty(field: z.ZodType): boolean {
  const inner = unwrapZodType(field);
  const type = zodDefType(inner);
  if (!type) return false;
  if (type === "string" || type === "number" || type === "boolean" || type === "enum") {
    return true;
  }
  if (type === "array") {
    const items = (inner as { _zod?: { def?: { element?: z.ZodType } } })._zod?.def?.element;
    if (!items) return false;
    const itemType = zodDefType(unwrapZodType(items));
    return itemType === "string" || itemType === "number" || itemType === "boolean";
  }
  return false;
}

function queryInputForObject(object: DefinedObject): z.ZodObject<z.ZodRawShape> {
  const shape: Record<string, z.ZodType> = {
    limit: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .describe("Maximum rows to return. Omit for default 100; pass null for no limit."),
    offset: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Rows to skip before returning results."),
    order: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Sort order on created_at. Defaults to desc when omitted."),
  };
  for (const [key, field] of Object.entries(object.properties.shape)) {
    const zodField = field as z.ZodType;
    if (!isFilterableProperty(zodField)) continue;
    const inner = unwrapZodType(zodField);
    const desc = propertyDescription(zodField);
    shape[key] = inner.optional().describe(
      desc ? `Equality filter on ${key}. ${desc}` : `Equality filter on ${key}.`,
    );
  }
  return z.object(shape);
}

const getInput = z.object({
  id: z.string().describe("Object id to fetch."),
});

const linksInput = z.object({
  id: z.string().describe("Object id whose links to traverse."),
  kind: z
    .string()
    .optional()
    .describe("Optional link kind filter — only edges of this kind are returned."),
});

export const linksToolInput = linksInput;

export function queryToolInputForObject(object: DefinedObject): z.ZodObject<z.ZodRawShape> {
  return queryInputForObject(object);
}

type ActionLike = {
  name: string;
  description: string;
  input: z.ZodType;
};

/** Build MCP tool definitions for the served set (read tools + non-operatorOnly actions). */
export function servedToolsForSchema(schema: Schema): McpToolDefinition[] {
  const tools: McpToolDefinition[] = [];
  for (const object of schema.objects) {
    tools.push(...readToolsForObject(object));
  }
  for (const action of schema.actions) {
    if (action.operatorOnly === true) continue;
    tools.push(actionToolForAction(action));
  }
  return tools;
}

/** Build one action-tool definition for discovery (not transport validation). */
export function actionToolForAction(action: ActionLike): McpToolDefinition {
  return {
    name: `qf_${action.name}`,
    description: action.description,
    inputSchema: toInputJsonSchema(action.input),
  };
}

/** Build the three read-tool definitions for one schema object. */
export function readToolsForObject(object: DefinedObject): McpToolDefinition[] {
  return [
    {
      name: `qf_${object.name}_get`,
      description: `Fetch one ${object.name} by id. ${object.description}`,
      inputSchema: toInputJsonSchema(getInput),
    },
    {
      name: `qf_${object.name}_query`,
      description: `List ${object.name} rows with optional filters. ${object.description}`,
      inputSchema: toInputJsonSchema(queryInputForObject(object)),
    },
    {
      name: `qf_${object.name}_links`,
      description: `Traverse links touching one ${object.name} by id. ${object.description}`,
      inputSchema: toInputJsonSchema(linksInput),
    },
  ];
}

/**
 * Pure generator: schema in → MCP tool definitions JSON string out.
 * Deterministic; does not touch the filesystem.
 */
export function generateMcp(schema: Schema): string {
  const tools: McpToolDefinition[] = [];

  for (const object of schema.objects) {
    tools.push(...readToolsForObject(object));
  }

  for (const action of schema.actions) {
    tools.push(actionToolForAction(action));
  }

  return `${JSON.stringify(tools, null, 2)}\n`;
}
