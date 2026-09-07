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
  current_report_id: string | null;
  report_ids: string[];
};

export type ResearchWorldProjectionResult =
  | { ok: true; world: ResearchWorld }
  | { ok: false; code: "WORLD_ROOT_NOT_FOUND" | "WORLD_ROOT_INELIGIBLE"; message: string };

const TRAVERSAL_KINDS = new Set([
  "belongs_to", "tests", "uses", "produces", "evaluated_by", "performed_by",
  "gates", "assigned_to", "delegated_by", "delegates_to", "grades_ticket", "grades_run", "grades_strategy", "grades_run_result",
  "spawned_from", "investigates", "quotes", "offered_on", "lists",
]);
const OBJECT_TYPES = [
  "mission", "task", "hypothesis", "dataset", "run", "strategy", "ticket", "artifact", "evaluation", "agent_session",
  "quote", "instrument", "market_event", "venue", "tool", "execution_environment",
];
const JSON_FIELDS = new Set([
  "sources", "coverage", "params", "sides", "metrics", "rubric", "run_metrics", "source_work", "block_reason",
]);

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    return `{${Object.keys(row).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(row[key])}`).join(",")}}`;
  }
  throw new Error("Canonical projection JSON accepts JSON values only");
}

function decodeUtf8Hex(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(value)) {
    throw new Error(`Invalid UTF-8 hex in ${field}`);
  }
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new Error(`Invalid UTF-8 bytes in ${field}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function decodeOptionalUtf8Hex(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return decodeUtf8Hex(value, field);
}

function tableExists(db: KernelDb, table: string): boolean {
  return Boolean(db.query("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));
}

type RelationalSnapshot = {
  rows: Map<string, Map<string, Record<string, unknown>>>;
  links: ResearchWorldLink[];
  derivedLinks: ResearchWorldLink[];
  sourceWork: Map<string, Array<Record<string, unknown>>>;
  publications: Array<{
    source_work_key: string;
    report_artifact_id: string;
    authority_key: string;
    is_current: number;
    supersedes_source_work_key: string | null;
    superseded_by_source_work_key: string | null;
  }>;
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

function isNamedTechnique(snapshot: RelationalSnapshot, id: string | null | undefined): boolean {
  if (!id) return false;
  const strategy = snapshot.rows.get("strategy")?.get(id);
  const specRef = typeof strategy?.spec_ref === "string" ? strategy.spec_ref : "";
  const artifact = snapshot.rows.get("artifact")?.get(specRef);
  if (!artifact || typeof artifact.storage_ref !== "string") return false;
  try {
    const location = artifact.storage_ref.startsWith("file:") ? new URL(artifact.storage_ref) : artifact.storage_ref;
    const payload = JSON.parse(new TextDecoder().decode(new Uint8Array(readFileSync(location)))) as Record<string, unknown>;
    return typeof payload.family === "string" && payload.family.length > 0;
  } catch {
    return false;
  }
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
    for (const type of [...OBJECT_TYPES, "agent_definition"]) {
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
    const publications: RelationalSnapshot["publications"] = [];
    if (tableExists(db, "qf_review_publication")) {
      for (const row of db.query(
        `SELECT hex(CAST(source_work_key AS BLOB)) AS source_work_key_hex,
                report_artifact_id, authority_key, is_current,
                hex(CAST(supersedes_source_work_key AS BLOB)) AS supersedes_source_work_key_hex,
                hex(CAST(superseded_by_source_work_key AS BLOB)) AS superseded_by_source_work_key_hex
           FROM qf_review_publication
          ORDER BY created_at ASC, source_work_key ASC`,
      ).all() as Array<Record<string, unknown>>) {
        const sourceWorkKey = decodeUtf8Hex(row.source_work_key_hex, "qf_review_publication.source_work_key");
        const supersedesSourceWorkKey = decodeOptionalUtf8Hex(row.supersedes_source_work_key_hex, "qf_review_publication.supersedes_source_work_key");
        const supersededBySourceWorkKey = decodeOptionalUtf8Hex(row.superseded_by_source_work_key_hex, "qf_review_publication.superseded_by_source_work_key");
        if (typeof row.report_artifact_id === "string" && typeof row.authority_key === "string") {
          publications.push({
            source_work_key: sourceWorkKey,
            report_artifact_id: row.report_artifact_id,
            authority_key: row.authority_key,
            is_current: Number(row.is_current),
            supersedes_source_work_key: supersedesSourceWorkKey,
            superseded_by_source_work_key: supersededBySourceWorkKey,
          });
        }
      }
    }
    return {
      rows,
      links: readLinks(db, [...TRAVERSAL_KINDS]),
      derivedLinks: readLinks(db, ["derived_from"]),
      sourceWork,
      publications,
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
    let calculationResult = false;
    try { calculationResult = (JSON.parse(text) as Record<string, unknown>)?.contract === "qf.calculation.result.v1"; } catch { /* ordinary preview */ }
    const codePoints = Array.from(text);
    return {
      artifact_id: id, kind, content_hash: hash, durable_bytes_available: true,
      preview: calculationResult ? text : codePoints.slice(0, 2_048).join("") + (codePoints.length > 2_048 ? "…" : ""),
    };
  } catch {
    return { artifact_id: id, kind, content_hash: hash, durable_bytes_available: true, message: "Preview unavailable: artifact is not UTF-8" };
  }
}

function evidenceDatasetsForMission(snapshot: RelationalSnapshot, missionId: string): Array<{ datasetId: string; artifactId: string }> {
  const investigation = snapshot.links.filter((link) => link.kind === "investigates" && link.from_id === missionId);
  if (investigation.length !== 1) return [];
  const quoteId = investigation[0]!.to_id;
  const quote = snapshot.rows.get("quote")?.get(quoteId);
  if (!quote) return [];
  const quoted = snapshot.links.filter((link) => link.kind === "quotes" && link.from_id === quoteId);
  if (quoted.length !== 1) return [];
  const instrument = snapshot.rows.get("instrument")?.get(quoted[0]!.to_id);
  if (!instrument) return [];
  const offered = snapshot.links.filter((link) => link.kind === "offered_on" && link.from_id === quoted[0]!.to_id);
  if (offered.length !== 1) return [];
  const event = snapshot.rows.get("market_event")?.get(offered[0]!.to_id);
  const source = typeof quote.data_ref === "string" ? snapshot.rows.get("artifact")?.get(quote.data_ref) : undefined;
  const coverage = parseJson(quote.coverage) as Record<string, unknown> | null;
  const params = parseJson(instrument.params) as Record<string, unknown> | null;
  const sides = parseJson(instrument.sides);
  if (!event || !source || !coverage || !params || !Array.isArray(coverage.selections) || !Array.isArray(params.competitor_ids) || !Array.isArray(params.selection_ids) || !Array.isArray(sides)) return [];
  if (coverage.selections.length !== 2 || params.competitor_ids.length !== 2 || params.selection_ids.length !== 2 || sides.length !== 2) return [];
  const selections = coverage.selections as Array<Record<string, unknown>>;
  for (const [index, selection] of selections.entries()) {
    if (selection.competitor_id !== params.competitor_ids[index] || selection.selection_id !== params.selection_ids[index] || selection.label !== sides[index]) return [];
  }
  const liveContext = {
    quote_id: quoteId,
    quote_observed_at: coverage.observed_at,
    quote_source_hash: source.content_hash,
    market_event_id: event.id,
    event_cutoff: event.starts_at,
    competitors: selections.map((selection, index) => ({ competitor_id: params.competitor_ids[index], selection_id: params.selection_ids[index], label: sides[index] })),
    selection_ids: params.selection_ids,
  };
  const found: Array<{ datasetId: string; artifactId: string }> = [];
  for (const dataset of snapshot.rows.get("dataset")?.values() ?? []) {
    if (dataset.purpose !== "evidence" || typeof dataset.id !== "string") continue;
    const lineage = snapshot.derivedLinks.filter((link) => link.from_id === dataset.id);
    if (lineage.length !== 1) continue;
    const artifact = snapshot.rows.get("artifact")?.get(lineage[0]!.to_id);
    if (!artifact || artifactReceipt(artifact).durable_bytes_available !== true || typeof artifact.storage_ref !== "string") continue;
    try {
      const bytes = readFileSync(artifact.storage_ref.startsWith("file:") ? new URL(artifact.storage_ref) : artifact.storage_ref);
      const payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as Record<string, unknown>;
      if (payload.contract === "qf.dataset.v1" && canonicalJson(payload.market_context) === canonicalJson(liveContext)) found.push({ datasetId: dataset.id, artifactId: String(artifact.id) });
    } catch { /* unavailable or non-canonical evidence is not projected */ }
  }
  return found.sort((a, b) => a.datasetId.localeCompare(b.datasetId));
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

function addMarketLineage(snapshot: RelationalSnapshot, missionId: string, ids: Map<string, Set<string>>): ResearchWorldLink[] {
  const selected: ResearchWorldLink[] = [];
  const addLink = (link: ResearchWorldLink | undefined) => {
    if (!link) return;
    selected.push(link);
    addId(ids, objectType(snapshot, link.from_id), link.from_id);
    addId(ids, objectType(snapshot, link.to_id), link.to_id);
  };
  const investigation = snapshot.links.find((link) => link.kind === "investigates" && link.from_id === missionId);
  addLink(investigation);
  if (!investigation) return selected;
  const quote = snapshot.rows.get("quote")?.get(investigation.to_id);
  if (typeof quote?.data_ref === "string") addId(ids, "artifact", quote.data_ref);
  const quoted = snapshot.links.find((link) => link.kind === "quotes" && link.from_id === investigation.to_id);
  addLink(quoted);
  if (!quoted) return selected;
  addLink(snapshot.links.find((link) => link.kind === "offered_on" && link.from_id === quoted.to_id));
  addLink(snapshot.links.find((link) => link.kind === "lists" && link.to_id === quoted.to_id));
  return selected;
}

function sourceWorkMatches(row: Record<string, unknown>, source: Record<string, unknown>): boolean {
  const value = parseJson(row.source_work);
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return ["source_task_id", "hypothesis_id", "run_id", "result_artifact_id", "executor_session_id"]
    .every((key) => candidate[key] === source[key]);
}

function sourceWorkKey(source: Record<string, unknown>): string {
  return ["source_task_id", "hypothesis_id", "run_id", "result_artifact_id", "executor_session_id"]
    .map((key) => String(source[key] ?? ""))
    .join("\u0000");
}

type ReportContext = { currentReportId: string | null; reportIds: string[]; runId?: string; sourceTaskId?: string; runResultArtifactId?: string; sourceResultArtifactId?: string };

function reportContext(snapshot: RelationalSnapshot, source: Record<string, unknown>): ReportContext {
  const ids = new Set<string>();
  const sourceKey = sourceWorkKey(source);
  const sourcePublication = snapshot.publications.find((row) => row.source_work_key === sourceKey);
  const authorityRows = sourcePublication
    ? snapshot.publications.filter((row) => row.authority_key === sourcePublication.authority_key)
    : [];
  for (const link of snapshot.links) {
    if (link.kind !== "gates" || !objectExists(snapshot, "evaluation", link.from_id)) continue;
    const evaluation = objectRow(snapshot, "evaluation", link.from_id);
    if (!sourceWorkMatches(evaluation, source)) continue;
    if (objectExists(snapshot, "artifact", link.to_id) && snapshot.rows.get("artifact")?.get(link.to_id)?.kind === "report") {
      ids.add(link.to_id);
    }
  }
  for (const row of authorityRows) ids.add(row.report_artifact_id);
  const currentReportId = authorityRows.find((row) => row.is_current === 1)?.report_artifact_id ?? null;
  if (currentReportId) ids.add(currentReportId);
  return { currentReportId, reportIds: [...ids].sort() };
}

function markerFields(snapshot: RelationalSnapshot, type: string, id: string, context?: ReportContext): string[] {
  const row = snapshot.rows.get(type)?.get(id) ?? {};
  if (type === "evaluation") return ["EVALUATION"];
  if (type !== "artifact") return [];
  const markers: string[] = [];
  if (row.kind !== "report" && row.kind !== "evaluation_findings") markers.push("RAW ARTIFACT");
  if (context?.currentReportId === id) markers.push("PUBLISHED REPORT", "CURRENT AUTHORITY");
  else if (context?.reportIds.includes(id)) markers.push("HISTORICAL");
  return markers;
}

function projectObject(snapshot: RelationalSnapshot, type: string, id: string, context?: ReportContext): ResearchWorldObject {
  const row = objectRow(snapshot, type, id);
  const fields = rowFields(row);
  const incoming = snapshot.links.filter((link) => link.to_id === id);
  const outgoing = snapshot.links.filter((link) => link.from_id === id);
  const markers = markerFields(snapshot, type, id, context);
  if (markers.length > 0) fields.semantic_markers = markers;
  if (type === "dataset") {
    const source = snapshot.derivedLinks.find((link) => link.from_id === id);
    if (source && objectType(snapshot, source.to_id) === "artifact") {
      fields.source_artifact = artifactReceipt(objectRow(snapshot, "artifact", source.to_id));
    }
  }
  if (type === "artifact") {
    fields.receipt = artifactReceipt(row);
    if (typeof fields.receipt === "object" && fields.receipt && "preview" in fields.receipt) {
      try {
        const payload = JSON.parse(String((fields.receipt as ArtifactReceipt).preview ?? "")) as Record<string, unknown>;
        if (payload.contract === "qf.calculation.result.v1") fields.calculation_result = payload;
      } catch { /* non-JSON and truncated previews retain the ordinary receipt */ }
    }
    const producer = incoming.find((link) => link.kind === "produces");
    fields.producer_id = producer?.from_id ?? null;
    fields.producer_type = producer ? objectType(snapshot, producer.from_id) : null;
    if (context?.runResultArtifactId === id && incoming.some((link) =>
      link.kind === "produces" && link.from_id === context.runId
    )) fields.run_id = context.runId;
    if (context?.sourceResultArtifactId === id) fields.run_id = context.runId;
    const source = context?.sourceResultArtifactId === id
      ? { run_id: context.runId, source_task_id: context.sourceTaskId }
      : [...snapshot.sourceWork.values()].flat().find((candidate) => candidate.result_artifact_id === id);
    fields.source_run_id = source?.run_id ?? null;
    fields.source_task_id = source?.source_task_id ?? null;
    if (row.kind === "report") {
      fields.gating_evaluation_id = incoming.find((link) => link.kind === "gates")?.from_id ?? null;
      fields.current_authority = context?.currentReportId === id;
      fields.historical = context?.reportIds.includes(id) === true && context.currentReportId !== id;
    }
  }
  if (type === "task") {
    fields.assignee_session_id = outgoing.find((link) => link.kind === "assigned_to")?.to_id ?? null;
    fields.delegator_session_id = outgoing.find((link) => link.kind === "delegated_by")?.to_id ?? null;
    fields.mission_id = outgoing.find((link) => link.kind === "belongs_to")?.to_id ?? null;
    fields.steering_state = row.status;
    fields.review_state = row.status;
  }
  if (type === "mission") {
    const investigation = outgoing.find((link) => link.kind === "investigates");
    if (investigation) {
      const quote = snapshot.rows.get("quote")?.get(investigation.to_id);
      const coverage = parseJson(quote?.coverage);
      fields.quote_id = investigation.to_id;
      fields.state = "ready to staff";
      fields.method = null;
      fields.observed_at = coverage && typeof coverage === "object" && !Array.isArray(coverage)
        ? (coverage as Record<string, unknown>).observed_at ?? quote?.created_at ?? null
        : quote?.created_at ?? null;
    }
  }
  if (type === "quote") {
    const instrumentId = outgoing.find((link) => link.kind === "quotes")?.to_id;
    fields.instrument_id = instrumentId ?? null;
    const sourceId = typeof row.data_ref === "string" ? row.data_ref : "";
    const artifact = sourceId ? snapshot.rows.get("artifact")?.get(sourceId) : undefined;
    fields.source = artifact ? artifactReceipt(artifact) : null;
    const peers = instrumentId
      ? snapshot.links.filter((link) => link.kind === "quotes" && link.to_id === instrumentId)
        .map((link) => snapshot.rows.get("quote")?.get(link.from_id))
        .filter((candidate): candidate is Record<string, unknown> => Boolean(candidate))
        .sort((a, b) => {
          const observed = (candidate: Record<string, unknown>) => {
            const coverage = parseJson(candidate.coverage);
            const value = coverage && typeof coverage === "object" && !Array.isArray(coverage)
              ? Date.parse(String((coverage as Record<string, unknown>).observed_at ?? ""))
              : Number.NEGATIVE_INFINITY;
            return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
          };
          return observed(b) - observed(a) || String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")) || String(b.id ?? "").localeCompare(String(a.id ?? ""));
        })
      : [];
    fields.current = peers[0]?.id === id;
  }
  if (type === "run") {
    fields.dataset_id = outgoing.find((link) => link.kind === "uses" && objectType(snapshot, link.to_id) === "dataset")?.to_id ?? null;
    fields.hypothesis_id = outgoing.find((link) => link.kind === "tests")?.to_id ?? null;
    fields.result_artifact_id = outgoing.find((link) => link.kind === "produces")?.to_id ?? null;
    fields.executor_session_id = parseJson(row.params) && typeof parseJson(row.params) === "object"
      ? (parseJson(row.params) as Record<string, unknown>).executor_session_id ?? null : null;
    const strategyId = outgoing.find((link) => link.kind === "uses" && objectType(snapshot, link.to_id) === "strategy")?.to_id;
    fields.strategy_id = isNamedTechnique(snapshot, strategyId) ? strategyId : null;
    fields.technique = fields.strategy_id ? "selected" : "none selected";
    fields.mission_id = outgoing.find((link) => link.kind === "belongs_to")?.to_id ?? null;
    fields.quote_id = outgoing.find((link) => link.kind === "uses" && objectType(snapshot, link.to_id) === "quote")?.to_id ?? null;
    fields.tool_id = outgoing.find((link) => link.kind === "uses" && objectType(snapshot, link.to_id) === "tool")?.to_id ?? null;
    fields.calculation_artifact_id = outgoing.find((link) => link.kind === "uses" && objectType(snapshot, link.to_id) === "artifact")?.to_id ?? null;
    const parsedParams = parseJson(row.params);
    if (parsedParams && typeof parsedParams === "object" && !Array.isArray(parsedParams)) {
      const params = parsedParams as Record<string, unknown>;
      fields.operation = params.operation ?? null;
      fields.formula_version = params.formula_version ?? null;
      fields.implementation_version = params.implementation_version ?? null;
      fields.execution_manifest_hash = params.execution_manifest_hash ?? null;
      fields.event_cutoff = params.event_cutoff ?? null;
    }
  }
  if (type === "strategy") {
    const specRef = String(row.spec_ref ?? "");
    const artifact = snapshot.rows.get("artifact")?.get(specRef);
    if (artifact) {
      try {
        const location = String(artifact.storage_ref).startsWith("file:") ? new URL(String(artifact.storage_ref)) : String(artifact.storage_ref);
        const payload = JSON.parse(new TextDecoder().decode(new Uint8Array(readFileSync(location)))) as Record<string, unknown>;
        fields.family = payload.family ?? null;
        fields.probability_field = payload.probability_field ?? null;
        fields.content_hash = artifact.content_hash;
      } catch { fields.family = null; fields.probability_field = null; }
    }
  }
  if (type === "evaluation") {
    fields.critic_session_id = outgoing.find((link) => link.kind === "performed_by")?.to_id ?? null;
    fields.target_artifact_id = incoming.find((link) => link.kind === "evaluated_by" && objectType(snapshot, link.from_id) === "artifact")?.from_id ?? null;
    fields.findings_artifact_id = row.findings_artifact_id ?? null;
    fields.review_task_id = row.review_task_id ?? null;
    fields.report_artifact_id = row.publication_report_id ?? null;
  }
  if (type === "agent_session") {
    const definitionId = outgoing.find((link) => link.kind === "spawned_from")?.to_id;
    fields.definition_id = definitionId ?? null;
    const definition = definitionId ? snapshot.rows.get("agent_definition")?.get(definitionId) : undefined;
    if (definition) {
      fields.role = definition.role ?? null;
      fields.display_name = definition.display_name ?? null;
      fields.runtime_profile = definition.runtime_profile ?? null;
      fields.capability_groups = parseJson(definition.capability_groups);
    }
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
    const marketLinks = addMarketLineage(snapshot, request.root_id, ids);
    const tasks = allLinks.filter((link) =>
      link.kind === "belongs_to" &&
      link.to_id === request.root_id &&
      objectType(snapshot, link.from_id) === "task"
    ).map((link) => link.from_id);
    if (tasks.length > 1) return { ok: false, code: "WORLD_ROOT_INELIGIBLE", message: `Mission has ${tasks.length} linked research Tasks; choose one before revealing the world.` };
    selectedTaskId = tasks[0];
    if (!selectedTaskId) {
      const directRuns = allLinks.filter((link) => link.kind === "belongs_to" && link.to_id === request.root_id && objectType(snapshot, link.from_id) === "run").map((link) => link.from_id).sort();
      const evidenceDatasets = evidenceDatasetsForMission(snapshot, request.root_id);
      if (directRuns.length > 0 || evidenceDatasets.length > 0) {
        const selectedKeys = new Set(marketLinks.map((link) => `${link.kind}\u0000${link.from_id}\u0000${link.to_id}`));
        for (const evidence of evidenceDatasets) {
          addId(ids, "dataset", evidence.datasetId);
          addId(ids, "artifact", evidence.artifactId);
          selectedKeys.add(`derived_from\u0000${evidence.datasetId}\u0000${evidence.artifactId}`);
        }
        for (const runId of directRuns) {
          addId(ids, "run", runId);
          for (const link of allLinks.filter((candidate) => candidate.from_id === runId && ["belongs_to", "uses", "executes_in", "produces"].includes(candidate.kind))) {
            addId(ids, objectType(snapshot, link.to_id), link.to_id);
            selectedKeys.add(`${link.kind}\u0000${link.from_id}\u0000${link.to_id}`);
            if (objectType(snapshot, link.to_id) === "dataset") {
              for (const derived of allLinks.filter((candidate) => candidate.kind === "derived_from" && candidate.from_id === link.to_id)) {
                addId(ids, objectType(snapshot, derived.to_id), derived.to_id);
                selectedKeys.add(`${derived.kind}\u0000${derived.from_id}\u0000${derived.to_id}`);
              }
            }
          }
        }
        const objects: ResearchWorldObject[] = [];
        for (const type of OBJECT_TYPES) for (const id of ids.get(type) ?? []) objects.push(projectObject(snapshot, type, id));
        objects.sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
        const links = [...allLinks, ...snapshot.derivedLinks].filter((link) => selectedKeys.has(`${link.kind}\u0000${link.from_id}\u0000${link.to_id}`));
        const missingLineage = directRuns.length === 0
          ? [{ owning_type: "mission", owning_id: request.root_id, kind: "produces", message: "Evidence is registered; calculation did not produce a Run." }]
          : [];
        return { ok: true, world: freezeDeep({ root: { type: request.root_type, id: request.root_id }, objects, links, missing_lineage: missingLineage, current_report_id: null, report_ids: [] }) };
      }
      const objects: ResearchWorldObject[] = [];
      for (const type of OBJECT_TYPES) for (const id of ids.get(type) ?? []) objects.push(projectObject(snapshot, type, id));
      objects.sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
      return { ok: true, world: freezeDeep({ root: { type: request.root_type, id: request.root_id }, objects, links: marketLinks, missing_lineage: [{ owning_type: "mission", owning_id: request.root_id, kind: "belongs_to", message: marketLinks.length > 0 ? "Ready to staff — no participant-owned Task yet." : "No linked research Task yet." }], current_report_id: null, report_ids: [] }) };
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
    return { ok: true, world: freezeDeep({ root: { type: request.root_type, id: request.root_id }, objects: [projectObject(snapshot, request.root_type, request.root_id)], links: allLinks.filter((link) => idsContain(ids, link.from_id) && idsContain(ids, link.to_id)), missing_lineage: [{ owning_type: "task", owning_id: selectedTaskId, kind: "source_work", message: "This Task has no completed research lineage yet." }], current_report_id: null, report_ids: [] }) };
  }
  const source = sourceRows[0]!;
  const reports = reportContext(snapshot, source);
  for (const reportId of reports.reportIds) addId(ids, "artifact", reportId);
  for (const [type, key] of [["hypothesis", "hypothesis_id"], ["run", "run_id"], ["artifact", "result_artifact_id"], ["agent_session", "executor_session_id"]] as const) {
    addId(ids, type, source[key]);
  }

  const run = objectRow(snapshot, "run", String(source.run_id));
  const runParams = parseJson(run.params);
  const runFields = runParams && typeof runParams === "object" && !Array.isArray(runParams)
    ? runParams as Record<string, unknown> : {};
  const projectionContext = { ...reports, runId: String(source.run_id), sourceTaskId: selectedTaskId, runResultArtifactId: String(runFields.result_artifact_id), sourceResultArtifactId: String(source.result_artifact_id) };
  addId(ids, "dataset", runFields.dataset_id);
  addId(ids, "artifact", runFields.result_artifact_id);

  for (const link of allLinks) {
    if (link.from_id !== selectedTaskId) continue;
    if (link.kind === "belongs_to" || link.kind === "assigned_to" || link.kind === "delegated_by") {
      addId(ids, objectType(snapshot, link.to_id), link.to_id);
    }
  }

  const sourceIds = new Set([String(source.hypothesis_id), String(source.run_id), String(source.result_artifact_id)]);
  const strategyId = allLinks.find((link) => link.kind === "uses" && link.from_id === String(source.run_id) && objectType(snapshot, link.to_id) === "strategy")?.to_id;
  const selectedStrategyId = isNamedTechnique(snapshot, strategyId) ? strategyId : undefined;
  if (selectedStrategyId) addId(ids, "strategy", selectedStrategyId);
  const gradeArtifactIds = allLinks.filter((link) => link.kind === "grades_run" && link.to_id === String(source.run_id)).map((link) => link.from_id);
  for (const gradeId of gradeArtifactIds) {
    addId(ids, "artifact", gradeId);
    for (const link of allLinks.filter((candidate) => candidate.from_id === gradeId)) {
      if (["grades_ticket", "grades_strategy", "grades_run", "grades_run_result"].includes(link.kind)) addId(ids, objectType(snapshot, link.to_id), link.to_id);
    }
  }
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
  const selectedLinkKeys = new Set<string>();
  const addSelectedLink = (kind: string, fromId: unknown, toId: unknown) => {
    if (typeof fromId === "string" && fromId.length > 0 && typeof toId === "string" && toId.length > 0) {
      selectedLinkKeys.add(`${kind}\u0000${fromId}\u0000${toId}`);
    }
  };
  const sourceTaskLinks = allLinks.filter((link) => link.from_id === selectedTaskId);
  const missionId = sourceTaskLinks.find((link) => link.kind === "belongs_to")?.to_id;
  const executorId = source.executor_session_id;
  const directorId = sourceTaskLinks.find((link) => link.kind === "delegated_by")?.to_id;
  addSelectedLink("belongs_to", selectedTaskId, missionId);
  if (missionId) {
    for (const link of addMarketLineage(snapshot, missionId, ids)) addSelectedLink(link.kind, link.from_id, link.to_id);
  }
  addSelectedLink("assigned_to", selectedTaskId, executorId);
  addSelectedLink("delegated_by", selectedTaskId, directorId);
  addSelectedLink("delegates_to", directorId, executorId);
  addSelectedLink("tests", source.run_id, source.hypothesis_id);
  addSelectedLink("uses", source.run_id, runFields.dataset_id);
  addSelectedLink("uses", source.run_id, selectedStrategyId);
  addSelectedLink("produces", source.run_id, runFields.result_artifact_id);
  if (allLinks.some((link) => link.kind === "produces" && link.from_id === source.executor_session_id && link.to_id === source.result_artifact_id)) {
    addSelectedLink("produces", source.executor_session_id, source.result_artifact_id);
  }
  for (const gradeId of gradeArtifactIds) {
    for (const link of allLinks.filter((candidate) => candidate.from_id === gradeId && ["grades_ticket", "grades_run", "grades_strategy", "grades_run_result"].includes(candidate.kind))) {
      addSelectedLink(link.kind, link.from_id, link.to_id);
    }
  }
  for (const evaluationId of evaluationIds) {
    const evaluation = objectRow(snapshot, "evaluation", evaluationId);
    if (!sourceWorkMatches(evaluation, source)) continue;
    for (const sourceId of sourceIds) addSelectedLink("evaluated_by", sourceId, evaluationId);
    const evaluationLinks = allLinks.filter((link) => link.from_id === evaluationId);
    const criticId = evaluationLinks.find((link) => link.kind === "performed_by")?.to_id;
    addSelectedLink("performed_by", evaluationId, criticId);
    addSelectedLink("gates", evaluationId, evaluation.publication_report_id);
    const findingsId = evaluation.findings_artifact_id;
    addSelectedLink("produces", criticId, findingsId);
    const reviewTaskId = evaluation.review_task_id;
    const reviewTaskLinks = allLinks.filter((link) => link.from_id === reviewTaskId);
    addSelectedLink("assigned_to", reviewTaskId, reviewTaskLinks.find((link) => link.kind === "assigned_to")?.to_id);
    addSelectedLink("delegated_by", reviewTaskId, reviewTaskLinks.find((link) => link.kind === "delegated_by")?.to_id);
  }
  const worldLinks = allLinks
    .filter((link) => selectedLinkKeys.has(`${link.kind}\u0000${link.from_id}\u0000${link.to_id}`))
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.from_id.localeCompare(b.from_id) || a.to_id.localeCompare(b.to_id));
  const missing: MissingLineageFact[] = [];
  const requireLink = (owningType: string, owningId: string, kind: string, predicate: (link: ResearchWorldLink) => boolean) => {
    if (!worldLinks.some(predicate)) missing.push({ owning_type: owningType, owning_id: owningId, kind, message: `Lineage incomplete: ${kind}` });
  };
  requireLink("run", String(source.run_id), "tests", (link) => link.kind === "tests" && link.from_id === source.run_id);
  requireLink("run", String(source.run_id), "uses", (link) => link.kind === "uses" && link.from_id === source.run_id && objectType(snapshot, link.to_id) === "dataset");
  requireLink("run", String(source.run_id), "produces", (link) => link.kind === "produces" && link.from_id === source.run_id && link.to_id === runFields.result_artifact_id);
  const objects: ResearchWorldObject[] = [];
  for (const type of OBJECT_TYPES) for (const id of ids.get(type) ?? []) objects.push(projectObject(snapshot, type, id, projectionContext));
  objects.sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
  missing.sort((a, b) => a.owning_type.localeCompare(b.owning_type) || a.owning_id.localeCompare(b.owning_id) || a.kind.localeCompare(b.kind));
  return { ok: true, world: freezeDeep({ root: { type: request.root_type, id: request.root_id }, objects, links: worldLinks, missing_lineage: missing, current_report_id: reports.currentReportId, report_ids: reports.reportIds }) };
}
