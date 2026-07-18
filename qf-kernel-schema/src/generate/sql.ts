import { z } from "zod";
import {
  enumValues,
  propertyDescription,
  unwrapZodType,
  type DefinedObject,
  type Schema,
} from "../define.ts";

type SqlColumn = {
  name: string;
  sqlType: string;
  notNull: boolean;
  check?: string;
  comment: string;
};

function zodDefType(schema: z.ZodType): string | undefined {
  return (schema as { _zod?: { def?: { type?: string } } })._zod?.def?.type;
}

function isOptional(schema: z.ZodType): boolean {
  return zodDefType(schema) === "optional";
}

function isNullable(schema: z.ZodType): boolean {
  let current: z.ZodType = schema;
  for (;;) {
    const def = (current as { _zod?: { def?: { type?: string; innerType?: z.ZodType } } })._zod?.def;
    if (!def) return false;
    if (def.type === "nullable") return true;
    if (def.type === "optional" || def.type === "default") {
      if (!def.innerType) return false;
      current = def.innerType;
      continue;
    }
    return false;
  }
}

function mapZodToSql(field: z.ZodType): { sqlType: string; check?: string } {
  const inner = unwrapZodType(field);
  const type = zodDefType(inner);

  if (type === "enum") {
    const values = enumValues(inner);
    if (!values) throw new Error("enum without entries");
    const list = values.map((v) => `'${v.replaceAll("'", "''")}'`).join(", ");
    return { sqlType: "TEXT", check: `IN (${list})` };
  }

  if (type === "number") return { sqlType: "REAL" };
  if (type === "boolean") return { sqlType: "INTEGER" };
  if (type === "array" || type === "record" || type === "object") {
    return { sqlType: "TEXT" }; // JSON payload
  }
  if (type === "string") return { sqlType: "TEXT" };

  return { sqlType: "TEXT" };
}

function columnsForObject(object: DefinedObject): SqlColumn[] {
  const cols: SqlColumn[] = [
    {
      name: "id",
      sqlType: "TEXT",
      notNull: true,
      comment: "Primary key for this ontology object instance.",
    },
    {
      name: "created_at",
      sqlType: "TEXT",
      notNull: true,
      comment: "ISO-8601 UTC timestamp when the row was created.",
    },
  ];

  for (const [name, field] of Object.entries(object.properties.shape)) {
    const zodField = field as z.ZodType;
    const { sqlType, check } = mapZodToSql(zodField);
    const optional = isOptional(zodField);
    const nullable = isNullable(zodField);
    cols.push({
      name,
      sqlType,
      notNull: !optional && !nullable,
      check: check ? `${name} ${check}` : undefined,
      comment: propertyDescription(zodField) ?? "",
    });
  }

  return cols;
}

function emitObjectTable(object: DefinedObject): string {
  const cols = columnsForObject(object);
  const lines: string[] = [];
  lines.push(`-- ${object.description}`);
  lines.push(`CREATE TABLE ${object.name} (`);

  const body: string[] = [];
  for (const col of cols) {
    body.push(`  -- ${col.comment}`);
    const nullSql = col.notNull ? " NOT NULL" : "";
    const pk = col.name === "id" ? " PRIMARY KEY" : "";
    body.push(`  ${col.name} ${col.sqlType}${pk}${nullSql},`);
  }
  const lastColIdx = body.length - 1;
  body[lastColIdx] = body[lastColIdx]!.replace(/,$/, "");

  const checks: string[] = [];
  for (const col of cols) {
    if (col.check) {
      checks.push(`  CHECK (${col.check})`);
    }
  }

  if (checks.length > 0) {
    body[lastColIdx] = `${body[lastColIdx]},`;
    for (let i = 0; i < checks.length; i++) {
      const suffix = i === checks.length - 1 ? "" : ",";
      body.push(`${checks[i]}${suffix}`);
    }
  }

  lines.push(...body);
  lines.push(`);`);
  lines.push("");
  return lines.join("\n");
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function emitSchemaMeta(schema: Schema): string {
  const lines: string[] = [];
  lines.push("-- Type-level lifecycle and descriptions (not per-row data).");
  lines.push("CREATE TABLE schema_meta (");
  lines.push("  -- Object, link, or action name.");
  lines.push("  type_name TEXT PRIMARY KEY NOT NULL,");
  lines.push("  -- Schema kind: object | link | action.");
  lines.push("  kind TEXT NOT NULL,");
  lines.push("  -- Type lifecycle governing modify-vs-extend rules.");
  lines.push("  lifecycle TEXT NOT NULL CHECK (lifecycle IN ('experimental', 'active')),");
  lines.push("  -- Agent-facing description of the type.");
  lines.push("  description TEXT NOT NULL");
  lines.push(");");
  lines.push("");

  for (const object of schema.objects) {
    lines.push(
      `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(object.name)}, 'object', ${sqlString(object.lifecycle)}, ${sqlString(object.description)});`,
    );
  }
  for (const link of schema.links) {
    lines.push(
      `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(link.name)}, 'link', ${sqlString(link.lifecycle)}, ${sqlString(link.description)});`,
    );
  }
  for (const action of schema.actions) {
    lines.push(
      `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(action.name)}, 'action', ${sqlString(action.lifecycle)}, ${sqlString(action.description)});`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

/**
 * Pure generator: schema in → migration SQL string out.
 * Deterministic; does not touch the filesystem.
 */
export function generateSql(schema: Schema): string {
  const parts: string[] = [];
  parts.push("-- qf-kernel-schema generated migration");
  parts.push("-- DO NOT EDIT — regenerate with `bun run generate`.");
  parts.push("");

  parts.push(emitSchemaMeta(schema));

  for (const object of schema.objects) {
    parts.push(emitObjectTable(object));
  }

  const linkKinds = schema.links.map((l) => `'${l.name.replaceAll("'", "''")}'`).join(", ");

  parts.push("-- Typed directed edges between ontology objects.");
  parts.push("CREATE TABLE links (");
  parts.push("  -- Primary key for this link instance.");
  parts.push("  id TEXT PRIMARY KEY NOT NULL,");
  parts.push("  -- Link kind (schema link name), e.g. offered_on.");
  parts.push(`  kind TEXT NOT NULL CHECK (kind IN (${linkKinds})),`);
  parts.push("  -- Source object id.");
  parts.push("  from_id TEXT NOT NULL,");
  parts.push("  -- Target object id.");
  parts.push("  to_id TEXT NOT NULL,");
  parts.push("  -- ISO-8601 UTC timestamp when the link was created.");
  parts.push("  created_at TEXT NOT NULL");
  parts.push(");");
  parts.push("");

  return parts.join("\n");
}
