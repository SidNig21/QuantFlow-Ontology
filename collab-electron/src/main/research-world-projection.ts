import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
type KernelDb = {
  query(sql: string): { get(...params: unknown[]): unknown; all(...params: unknown[]): unknown[] };
  transaction<T>(fn: () => T): () => T;
};

export type ResearchWorldRootType = "mission" | "task";
export type ResearchWorldRequest = { root_type: ResearchWorldRootType; root_id: string };

export type ArtifactReceipt = {
  artifact_id: string;
  kind: string;
  content_hash: string;
  durable_bytes_available: boolean;
  preview?: string;
  message?: string;
};

export type ResearchWorldObject = {
  type: string;
  id: string;
  fields: Record<string, unknown>;
};

export type ResearchWorldLink = {
  kind: string;
  from_id: string;
  to_id: string;
};

export type MissingLineageFact = {
  owning_type: string;
  owning_id: string;
  kind: string;
  message: string;
};

export type ResearchWorld = {
  root: { type: ResearchWorldRootType; id: string };
  objects: ResearchWorldObject[];
  links: ResearchWorldLink[];
  missing_lineage: MissingLineageFact[];
};

export type ResearchWorldProjectionResult =
  | { ok: true; world: ResearchWorld }
  | { ok: false; code: "WORLD_ROOT_NOT_FOUND" | "WORLD_ROOT_INELIGIBLE"; message: string };

const TRAVERSAL_KINDS = new Set([
  "belongs_to", "tests", "uses", "produces", "evaluated_by", "performed_by",
  "gates", "assigned_to", "delegated_by", "delegates_to",
]);
const OBJECT_TYPES = [
  "mission", "task", "hypothesis", "dataset", "run", "artifact", "evaluation", "agent_session",
];
const JSON_FIELDS = new Set([
  "sources", "coverage", "params", "metrics", "rubric", "run_metrics", "source_work", "block_reason",
]);

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

function tableExists(db: KernelDb, table: string): boolean {
  return Boolean(db.query("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));
}

type RelationalSnapshot = {
  rows: Map<string, Map<string, Record<string, unknown>>>;
  links: ResearchWorldLink[];
  derivedLinks: ResearchWorldLink[];
  sourceWork: Map<string, Array<Record<string, unknown>>>;
};

function objectExists(snapshot: RelationalSnapshot, type: string, id: string): boolean {
  return Boolean(snapshot.rows.get(type)?.has(id));
}

function objectType(snapshot: RelationalSnapshot, id: string): string | null {
  for (const type of OBJECT_TYPES) {
    if (objectExists(snapshot, type, id)) return type;
  }
  return null;
}

function readLinks(db: KernelDb, kinds: readonly string[]): ResearchWorldLink[] {
  return (db.query(
    `SELECT kind, from_id, to_id FROM links WHERE kind IN (${kinds.map(() => "?").join(",")})`,
  ).all(...kinds) as ResearchWorldLink[]).map((link) => ({
    kind: String(link.kind), from_id: String(link.from_id), to_id: String(link.to_id),
  }));
}

function relationalSnapshot(db: KernelDb): RelationalSnapshot {
  return db.transaction(() => {
    const rows = new Map<string, Map<string, Record<string, unknown>>>();
    for (const type of OBJECT_TYPES) {
      const byId = new Map<string, Record<string, unknown>>();
      for (const row of db.query(`SELECT * FROM ${type}`).all() as Array<Record<string, unknown>>) {
        if (typeof row.id === "string") byId.set(row.id, { ...row });
      }
      rows.set(type, byId);
    }
    const sourceWork = new Map<string, Array<Record<string, unknown>>>();
    if (tableExists(db, "qf_review_source_work")) {
      for (const row of db.query(
        "SELECT source_task_id, source_work, created_at FROM qf_review_source_work ORDER BY created_at ASC, source_task_id ASC",
      ).all() as Array<{ source_task_id: string; source_work: string; created_at: string }>) {
        const values = sourceWork.get(row.source_task_id) ?? [];
        values.push({ source_task_id: row.source_task_id, ...parseJson(row.source_work) as Record<string, unknown>, created_at: row.created_at });
        sourceWork.set(row.source_task_id, values);
      }
    }
    return {
      rows,
      links: readLinks(db, [...TRAVERSAL_KINDS]),
      derivedLinks: readLinks(db, ["derived_from"]),
      sourceWork,
    };
  })();
}

function freezeDeep<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  return Object.freeze(value);
}

export function artifactReceipt(row: Record<string, unknown>): ArtifactReceipt {
  const id = String(row.id);
  const kind = String(row.kind);
  const hash = String(row.content_hash);
  let bytes: Uint8Array;
  try {
    const storage = String(row.storage_ref);
    bytes = new Uint8Array(readFileSync(storage.startsWith("file:") ? new URL(storage) : storage));
  } catch {
    return { artifact_id: id, kind, content_hash: hash, durable_bytes_available: false, message: "Artifact unavailable: hash mismatch" };
  }
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== hash) {
    return { artifact_id: id, kind, content_hash: hash, durable_bytes_available: false, message: "Artifact unavailable: hash mismatch" };
  }
  if (bytes.length > 65_536) {
    return { artifact_id: id, kind, content_hash: hash, durable_bytes_available: true, message: "Preview unavailable: artifact exceeds 65536 bytes" };
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const codePoints = Array.from(text);
    return {
      artifact_id: id, kind, content_hash: hash, durable_bytes_available: true,
      preview: codePoints.slice(0, 2_048).join("") + (codePoints.length > 2_048 ? "…" : ""),
    };
  } catch {
    return { artifact_id: id, kind, content_hash: hash, durable_bytes_available: true, message: "Preview unavailable: artifact is not UTF-8" };
  }
}

function rowFields(row: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "created_at" || key === "storage_ref") continue;
    fields[key] = JSON_FIELDS.has(key) ? parseJson(value) : value;
  }
  return fields;
}

function objectRow(snapshot: RelationalSnapshot, type: string, id: string): Record<string, unknown> {
  return snapshot.rows.get(type)?.get(id) ?? { id };
}

function addId(ids: Map<string, Set<string>>, type: string | null, id: unknown): boolean {
  if (!type || typeof id !== "string" || id.length === 0) return false;
  const set = ids.get(type) ?? new Set<string>();
  const before = set.size;
  set.add(id);
  ids.set(type, set);
  return set.size !== before;
}

function idsContain(ids: Map<string, Set<string>>, id: string): boolean {
  return [...ids.values()].some((set) => set.has(id));
}

function sourceWorkMatches(row: Record<string, unknown>, source: Record<string, unknown>): boolean {
  const value = parseJson(row.source_work);
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return ["source_task_id", "hypothesis_id", "run_id", "result_artifact_id", "executor_session_id"]
    .every((key) => candidate[key] === source[key]);
}

function projectObject(snapshot: RelationalSnapshot, type: string, id: string): ResearchWorldObject {
  const row = objectRow(snapshot, type, id);
  const fields = rowFields(row);
  if (type === "dataset") {
    const source = snapshot.derivedLinks.find((link) => link.from_id === id);
    if (source && objectType(snapshot, source.to_id) === "artifact") {
      fields.source_artifact = artifactReceipt(objectRow(snapshot, "artifact", source.to_id));
    }
  }
  if (type === "artifact") fields.receipt = artifactReceipt(row);
  const outgoing = snapshot.links.filter((link) => link.from_id === id);
  if (type === "task") {
    fields.assignee_session_id = outgoing.find((link) => link.kind === "assigned_to")?.to_id ?? null;
    fields.delegator_session_id = outgoing.find((link) => link.kind === "delegated_by")?.to_id ?? null;
    fields.mission_id = outgoing.find((link) => link.kind === "belongs_to")?.to_id ?? null;
    fields.steering_state = row.status;
    fields.review_state = row.status;
  }
  if (type === "run") {
    fields.dataset_id = outgoing.find((link) => link.kind === "uses" && objectType(snapshot, link.to_id) === "dataset")?.to_id ?? null;
    fields.hypothesis_id = outgoing.find((link) => link.kind === "tests")?.to_id ?? null;
    fields.result_artifact_id = outgoing.find((link) => link.kind === "produces")?.to_id ?? null;
    fields.executor_session_id = parseJson(row.params) && typeof parseJson(row.params) === "object"
      ? (parseJson(row.params) as Record<string, unknown>).executor_session_id ?? null : null;
  }
  if (type === "evaluation") {
    fields.critic_session_id = outgoing.find((link) => link.kind === "performed_by")?.to_id ?? null;
    fields.findings_artifact_id = row.findings_artifact_id ?? null;
    fields.review_task_id = row.review_task_id ?? null;
    fields.report_artifact_id = row.publication_report_id ?? null;
  }
  return { type, id, fields };
}

export function getResearchWorldProjection(db: KernelDb, request: ResearchWorldRequest): ResearchWorldProjectionResult {
  if ((request.root_type !== "mission" && request.root_type !== "task") || typeof request.root_id !== "string" || request.root_id.length === 0) {
    return { ok: false, code: "WORLD_ROOT_INELIGIBLE", message: "Research world root must be mission or task with a full Kernel id." };
  }
  const snapshot = relationalSnapshot(db);
  if (!objectExists(snapshot, request.root_type, request.root_id)) {
    return { ok: false, code: "WORLD_ROOT_NOT_FOUND", message: `Research world root not found: ${request.root_id}` };
  }
  const allLinks = snapshot.links;
  const ids = new Map<string, Set<string>>();
  addId(ids, request.root_type, request.root_id);
  let selectedTaskId: string | undefined;
  let sourceRows: Array<Record<string, unknown>> = [];
  if (request.root_type === "mission") {
    const tasks = allLinks.filter((link) => link.kind === "belongs_to" && link.to_id === request.root_id).map((link) => link.from_id);
    if (tasks.length > 1) return { ok: false, code: "WORLD_ROOT_INELIGIBLE", message: `Mission has ${tasks.length} linked research Tasks; choose one before revealing the world.` };
    selectedTaskId = tasks[0];
    if (!selectedTaskId) {
      return { ok: true, world: freezeDeep({ root: { type: request.root_type, id: request.root_id }, objects: [projectObject(snapshot, "mission", request.root_id)], links: [], missing_lineage: [{ owning_type: "mission", owning_id: request.root_id, kind: "belongs_to", message: "No linked research Task yet." }] }) };
    }
    addId(ids, "task", selectedTaskId);
  } else {
    selectedTaskId = request.root_id;
  }
  sourceRows = snapshot.sourceWork.get(selectedTaskId) ?? [];
  if (sourceRows.length > 1) {
    return { ok: false, code: "WORLD_ROOT_INELIGIBLE", message: `Task has ${sourceRows.length} duplicate R15 source-work bindings.` };
  }
  if (sourceRows.length === 0) {
    return { ok: true, world: freezeDeep({ root: { type: request.root_type, id: request.root_id }, objects: [projectObject(snapshot, request.root_type, request.root_id)], links: allLinks.filter((link) => idsContain(ids, link.from_id) && idsContain(ids, link.to_id)), missing_lineage: [{ owning_type: "task", owning_id: selectedTaskId, kind: "source_work", message: "This Task has no completed research lineage yet." }] }) };
  }
  const source = sourceRows[0]!;
  for (const [type, key] of [["hypothesis", "hypothesis_id"], ["run", "run_id"], ["artifact", "result_artifact_id"], ["agent_session", "executor_session_id"]] as const) {
    addId(ids, type, source[key]);
  }

  const run = objectRow(snapshot, "run", String(source.run_id));
  const runParams = parseJson(run.params);
  const runFields = runParams && typeof runParams === "object" && !Array.isArray(runParams)
    ? runParams as Record<string, unknown> : {};
  addId(ids, "dataset", runFields.dataset_id);

  for (const link of allLinks) {
    if (link.from_id !== selectedTaskId) continue;
    if (link.kind === "belongs_to" || link.kind === "assigned_to" || link.kind === "delegated_by") {
      addId(ids, objectType(snapshot, link.to_id), link.to_id);
    }
  }

  const sourceIds = new Set([String(source.hypothesis_id), String(source.run_id), String(source.result_artifact_id)]);
  const evaluationIds = new Set(
    allLinks
      .filter((link) => link.kind === "evaluated_by" && sourceIds.has(link.from_id))
      .map((link) => link.to_id),
  );
  for (const evaluationId of evaluationIds) {
    const evaluation = objectRow(snapshot, "evaluation", evaluationId);
    if (!sourceWorkMatches(evaluation, source)) continue;
    addId(ids, "evaluation", evaluationId);
    addId(ids, "task", evaluation.review_task_id);
    addId(ids, "artifact", evaluation.findings_artifact_id);
    addId(ids, "artifact", evaluation.publication_report_id);
    for (const link of allLinks) {
      if (link.from_id !== evaluationId) continue;
      if (link.kind === "performed_by") addId(ids, objectType(snapshot, link.to_id), link.to_id);
    }
  }

  for (const reviewTaskId of ids.get("task") ?? []) {
    if (reviewTaskId === selectedTaskId) continue;
    for (const link of allLinks) {
      if (link.from_id !== reviewTaskId) continue;
      if (link.kind === "assigned_to" || link.kind === "delegated_by") {
        addId(ids, objectType(snapshot, link.to_id), link.to_id);
      }
    }
  }
  const worldLinks = allLinks
    .filter((link) => idsContain(ids, link.from_id) && idsContain(ids, link.to_id))
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.from_id.localeCompare(b.from_id) || a.to_id.localeCompare(b.to_id));
  const missing: MissingLineageFact[] = [];
  const requireLink = (owningType: string, owningId: string, kind: string, predicate: (link: ResearchWorldLink) => boolean) => {
    if (!worldLinks.some(predicate)) missing.push({ owning_type: owningType, owning_id: owningId, kind, message: `Lineage incomplete: ${kind}` });
  };
  requireLink("run", String(source.run_id), "tests", (link) => link.kind === "tests" && link.from_id === source.run_id);
  requireLink("run", String(source.run_id), "uses", (link) => link.kind === "uses" && link.from_id === source.run_id && objectType(snapshot, link.to_id) === "dataset");
  requireLink("run", String(source.run_id), "produces", (link) => link.kind === "produces" && link.from_id === source.run_id && link.to_id === source.result_artifact_id);
  const objects: ResearchWorldObject[] = [];
  for (const type of OBJECT_TYPES) for (const id of ids.get(type) ?? []) objects.push(projectObject(snapshot, type, id));
  objects.sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
  missing.sort((a, b) => a.owning_type.localeCompare(b.owning_type) || a.owning_id.localeCompare(b.owning_id) || a.kind.localeCompare(b.kind));
  return { ok: true, world: freezeDeep({ root: { type: request.root_type, id: request.root_id }, objects, links: worldLinks, missing_lineage: missing }) };
}
