import { z } from "zod";
import { propertyDescription, unwrapZodType, type DefinedObject, type Schema } from "../define.ts";

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

function enumValues(schema: z.ZodType): string[] | null {
  const def = (schema as { _zod?: { def?: { type?: string; entries?: Record<string, string> } } })._zod
    ?.def;
  if (def?.type !== "enum" || !def.entries) return null;
  return Object.values(def.entries);
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

  // z.iso.datetime and other string brands still report as string; fallback TEXT
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
    {
      name: "lifecycle",
      sqlType: "TEXT",
      notNull: true,
      check: `IN ('experimental', 'active')`,
      comment: `Schema lifecycle for ${object.name} (default '${object.lifecycle}').`,
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
  // trim trailing comma from last column line, then add table checks
  const lastColIdx = body.length - 1;
  body[lastColIdx] = body[lastColIdx]!.replace(/,$/, "");

  const checks: string[] = [];
  for (const col of cols) {
    if (col.check) {
      if (col.name === "lifecycle") {
        checks.push(`  CHECK (lifecycle ${col.check})`);
      } else {
        checks.push(`  CHECK (${col.check})`);
      }
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

/**
 * Pure generator: schema in → migration SQL string out.
 * Deterministic; does not touch the filesystem.
 */
export function generateSql(schema: Schema): string {
  const parts: string[] = [];
  parts.push("-- qf-kernel-schema generated migration");
  parts.push("-- DO NOT EDIT — regenerate with `bun run generate`.");
  parts.push("");

  for (const object of schema.objects) {
    parts.push(emitObjectTable(object));
  }

  parts.push("-- Typed directed edges between ontology objects.");
  parts.push("CREATE TABLE links (");
  parts.push("  -- Primary key for this link instance.");
  parts.push("  id TEXT PRIMARY KEY NOT NULL,");
  parts.push("  -- Link kind (schema link name), e.g. offered_on.");
  parts.push("  kind TEXT NOT NULL,");
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
