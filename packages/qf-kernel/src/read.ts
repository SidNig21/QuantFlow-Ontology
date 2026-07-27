import { schema as defaultSchema } from "qf-kernel-schema";
import { unwrapZodType, type DefinedObject, type Schema } from "qf-kernel-schema/define";
import type { KernelDb } from "./db.ts";
import { KernelError } from "./errors.ts";

function objectByName(schema: Schema): Map<string, DefinedObject> {
  return new Map(schema.objects.map((o) => [o.name, o]));
}

function zodDefType(zodField: import("zod").ZodType): string | undefined {
  return (zodField as { _zod?: { def?: { type?: string } } })._zod?.def?.type;
}

function assertKnownType(schema: Schema, type: string): DefinedObject {
  const object = objectByName(schema).get(type);
  if (!object) {
    throw new KernelError(`Unknown object type: ${type}`);
  }
  return object;
}

function assertDeclaredFilters(
  object: DefinedObject,
  filters: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!filters || Object.keys(filters).length === 0) return {};
  const allowed = new Set(Object.keys(object.properties.shape));
  for (const key of Object.keys(filters)) {
    if (!allowed.has(key)) {
      throw new KernelError(`Unknown filter key for ${object.name}: ${key}`);
    }
  }
  return filters;
}

function coerceFilterValue(field: import("zod").ZodType, value: unknown): unknown {
  const inner = unwrapZodType(field);
  const type = zodDefType(inner);
  if (type === "boolean") {
    if (typeof value !== "boolean") {
      throw new KernelError(`Filter value for boolean field must be boolean`);
    }
    return value ? 1 : 0;
  }
  if (type === "array" || type === "record" || type === "object") {
    return JSON.stringify(value);
  }
  return value;
}

export type GetLinksOptions = {
  kind?: string;
};

export type LinkRow = {
  id: string;
  kind: string;
  from_id: string;
  to_id: string;
  created_at: string;
};

/** Fetch one ontology row by type and id, or null when absent. */
export function getObject(
  db: KernelDb,
  type: string,
  id: string,
  schema: Schema = defaultSchema,
): Record<string, unknown> | null {
  assertKnownType(schema, type);
  return (
    (db.query(`SELECT * FROM ${type} WHERE id = ?`).get(id) as Record<string, unknown> | null) ??
    null
  );
}

/**
 * List rows for a schema object type with optional equality filters (AND-combined).
 * Only declared properties may be filtered; unknown keys error before SQL runs.
 *
 * `limit`: omit for default 100, `null` for no LIMIT clause, a positive number otherwise.
 * `order`: sort direction on created_at; defaults to "desc".
 */
export function queryObjects(
  db: KernelDb,
  type: string,
  filters?: Record<string, unknown>,
  limit: number | null | undefined = 100,
  offset = 0,
  schema: Schema = defaultSchema,
  order: "asc" | "desc" = "desc",
): Record<string, unknown>[] {
  const object = assertKnownType(schema, type);
  const safeFilters = assertDeclaredFilters(object, filters);

  const clauses: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(safeFilters)) {
    if (value === undefined) continue;
    const field = object.properties.shape[key] as import("zod").ZodType;
    clauses.push(`${key} = ?`);
    params.push(coerceFilterValue(field, value));
  }

  const where = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
  const orderClause = ` ORDER BY created_at ${order === "asc" ? "ASC" : "DESC"}`;
  if (limit === null) {
    if (offset === 0) {
      const sql = `SELECT * FROM ${type}${where}${orderClause}`;
      return db.query(sql).all(...params) as Record<string, unknown>[];
    }
    const sql = `SELECT * FROM ${type}${where}${orderClause} LIMIT -1 OFFSET ?`;
    params.push(offset);
    return db.query(sql).all(...params) as Record<string, unknown>[];
  }
  const effectiveLimit = limit === undefined ? 100 : limit;
  const sql = `SELECT * FROM ${type}${where}${orderClause} LIMIT ? OFFSET ?`;
  params.push(effectiveLimit, offset);
  return db.query(sql).all(...params) as Record<string, unknown>[];
}

/**
 * Return link rows touching an object id in either direction.
 * This is the first production reader for the links table.
 */
export function getLinks(
  db: KernelDb,
  id: string,
  opts?: GetLinksOptions,
): LinkRow[] {
  if (opts?.kind) {
    return db
      .query(
        `SELECT id, kind, from_id, to_id, created_at FROM links
         WHERE (from_id = ? OR to_id = ?) AND kind = ?
         ORDER BY created_at ASC`,
      )
      .all(id, id, opts.kind) as LinkRow[];
  }
  return db
    .query(
      `SELECT id, kind, from_id, to_id, created_at FROM links
       WHERE from_id = ? OR to_id = ?
       ORDER BY created_at ASC`,
    )
    .all(id, id) as LinkRow[];
}
