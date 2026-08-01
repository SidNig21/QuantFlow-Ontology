import { linkDefinition, linkKindNames } from "qf-kernel-schema/link-endpoints";
import type { KernelDb } from "./db.ts";
import { IllegalLinkError, KernelError } from "./errors.ts";

export type LinkSpec = {
  kind: string;
  from_id?: string;
  to_id?: string;
};

export type CreationEnvelopePresence = {
  links: boolean;
  bytes: boolean;
};

/** Strip kernel-only envelope fields (`links`, `bytes`) before action-field validation. */
export function extractCreationEnvelope(input: Record<string, unknown>): {
  body: Record<string, unknown>;
  links: LinkSpec[];
  bytes?: Uint8Array;
  present: CreationEnvelopePresence;
} {
  const { links, bytes, ...body } = input;
  const present: CreationEnvelopePresence = {
    links: Object.prototype.hasOwnProperty.call(input, "links"),
    bytes: Object.prototype.hasOwnProperty.call(input, "bytes"),
  };
  let extractedBytes: Uint8Array | undefined;
  if (bytes !== undefined) {
    if (!(bytes instanceof Uint8Array)) {
      throw new KernelError('Optional "bytes" must be a Uint8Array');
    }
    extractedBytes = bytes;
  }
  if (links === undefined) {
    return { body, links: [], bytes: extractedBytes, present };
  }
  if (!Array.isArray(links)) {
    throw new KernelError('Optional "links" must be an array of { kind, from_id?, to_id? }');
  }
  const specs: LinkSpec[] = [];
  for (const entry of links) {
    if (!entry || typeof entry !== "object") {
      throw new KernelError("Each link entry must be an object");
    }
    const row = entry as Record<string, unknown>;
    if (typeof row.kind !== "string" || row.kind.length === 0) {
      throw new KernelError("Each link entry requires non-empty kind");
    }
    specs.push({
      kind: row.kind,
      from_id: typeof row.from_id === "string" ? row.from_id : undefined,
      to_id: typeof row.to_id === "string" ? row.to_id : undefined,
    });
  }
  return { body, links: specs, bytes: extractedBytes, present };
}

/** @deprecated Use extractCreationEnvelope — kept for callers that only need links. */
export function extractLinkSpecs(input: Record<string, unknown>): {
  body: Record<string, unknown>;
  links: LinkSpec[];
} {
  const { body, links } = extractCreationEnvelope(input);
  return { body, links };
}

function objectTypeOf(db: KernelDb, id: string): string | null {
  const tables = db
    .query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('events','links','schema_meta','sqlite_sequence')`,
    )
    .all() as Array<{ name: string }>;
  for (const { name } of tables) {
    const row = db.query(`SELECT 1 AS ok FROM ${name} WHERE id = ?`).get(id) as
      | { ok: number }
      | null;
    if (row) return name;
  }
  return null;
}

function resolveEndpoints(
  linkName: string,
  createdType: string,
  createdId: string,
  spec: LinkSpec,
): { from_id: string; to_id: string } {
  const def = linkDefinition(linkName);
  if (!def) {
    throw new IllegalLinkError("kind", linkName, linkKindNames.join(", "));
  }
  const createdIsFrom = def.from.includes(createdType);
  const createdIsTo = def.to.includes(createdType);
  if (!createdIsFrom && !createdIsTo) {
    throw new IllegalLinkError(
      "endpoint",
      `${linkName} does not involve ${createdType}`,
      `one of: ${[...def.from, ...def.to].join(", ")}`,
    );
  }

  if (createdIsTo && spec.from_id) {
    return { from_id: spec.from_id, to_id: createdId };
  }
  if (createdIsFrom && spec.to_id) {
    return { from_id: createdId, to_id: spec.to_id };
  }
  if (spec.from_id && spec.to_id) {
    return { from_id: spec.from_id, to_id: spec.to_id };
  }
  throw new IllegalLinkError(
    "endpoint",
    linkName,
    "supply from_id when created object is link.to, or to_id when created object is link.from",
  );
}

function validateEndpointTypes(
  db: KernelDb,
  linkName: string,
  from_id: string,
  to_id: string,
  def: NonNullable<ReturnType<typeof linkDefinition>>,
): void {
  const fromType = objectTypeOf(db, from_id);
  const toType = objectTypeOf(db, to_id);
  if (!fromType) {
    throw new KernelError(`Link "${linkName}": from_id "${from_id}" not found`);
  }
  if (!toType) {
    throw new KernelError(`Link "${linkName}": to_id "${to_id}" not found`);
  }
  if (!def.from.includes(fromType)) {
    throw new IllegalLinkError(
      "endpoint",
      `${linkName} from ${fromType}`,
      `allowed from: ${def.from.join(", ")}`,
    );
  }
  if (!def.to.includes(toType)) {
    throw new IllegalLinkError(
      "endpoint",
      `${linkName} to ${toType}`,
      `allowed to: ${def.to.join(", ")}`,
    );
  }
}

/**
 * Validate and insert edges into links — sole writer besides execute()'s creation path.
 * Rejects unknown kinds and wrong endpoint types before SQLite sees the row.
 */
export function writeLinks(
  db: KernelDb,
  createdType: string,
  createdId: string,
  specs: readonly LinkSpec[],
): void {
  for (const spec of specs) {
    const def = linkDefinition(spec.kind);
    if (!def) {
      throw new IllegalLinkError("kind", spec.kind, linkKindNames.join(", "));
    }
    const { from_id, to_id } = resolveEndpoints(spec.kind, createdType, createdId, spec);
    validateEndpointTypes(db, spec.kind, from_id, to_id, def);
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    db.query(
      `INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(id, spec.kind, from_id, to_id, created_at);
  }
}

/** Merge convenience lineage fields into link specs for record_evaluation. */
export function lineageFieldsToLinks(input: Record<string, unknown>): LinkSpec[] {
  const extra: LinkSpec[] = [];
  if (typeof input.artifact_id === "string" && input.artifact_id.length > 0) {
    extra.push({ kind: "evaluated_by", from_id: input.artifact_id });
  }
  if (typeof input.run_id === "string" && input.run_id.length > 0) {
    extra.push({ kind: "evaluated_by", from_id: input.run_id });
  }
  return extra;
}
