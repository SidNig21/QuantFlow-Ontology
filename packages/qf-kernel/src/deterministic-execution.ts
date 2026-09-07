import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { CreationCommand } from "qf-kernel-schema/commands";
import type { KernelDb } from "./db.ts";
import { KernelError } from "./errors.ts";
import { appendEvent } from "./events.ts";
import { contentHash } from "./hash.ts";
import {
  type CreationEnvelopePresence,
  type LinkSpec,
  writeLinks,
} from "./links.ts";
import { resolveArtifactRoot } from "./resolve-artifact-root.ts";
import type { ObjectExecuteResult } from "./results.ts";
import type { TraceContext, TrustedExecutionContext } from "./trace.ts";
import { readStrategySpec } from "./strategy-outcome.ts";

export const DETERMINISTIC_EXECUTION_VERSION = "qf-deterministic-v1";
const EXECUTION_ENVIRONMENT_ID =
  `execution_environment:${DETERMINISTIC_EXECUTION_VERSION}`;

type JsonRecord = Record<string, unknown>;

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new KernelError("deterministic execution refuses non-finite numbers");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => {
        if (record[key] === undefined) {
          throw new KernelError(
            `deterministic execution refuses undefined field "${key}"`,
          );
        }
        return `${JSON.stringify(key)}:${canonicalJson(record[key])}`;
      })
      .join(",")}}`;
  }
  throw new KernelError("deterministic execution accepts JSON values only");
}

function orderedJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new KernelError("deterministic execution refuses non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(orderedJson).join(",")}]`;
  if (typeof value === "object") {
    const row = value as JsonRecord;
    return `{${Object.keys(row).map((key) => `${JSON.stringify(key)}:${orderedJson(row[key])}`).join(",")}}`;
  }
  throw new KernelError("deterministic execution accepts JSON values only");
}

function exactKeys(record: JsonRecord, allowed: readonly string[], label: string): void {
  const extras = Object.keys(record).filter((key) => !allowed.includes(key));
  if (extras.length > 0) {
    throw new KernelError(`${label} rejects fields: ${extras.sort().join(", ")}`);
  }
}

function objectValue(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new KernelError(`${label} must be an object`);
  }
  return value as JsonRecord;
}

function parseStrategy(input: unknown): {
  spec: JsonRecord;
  bytes: Uint8Array;
  hash: string;
  version: number;
  stakeModel: "flat" | "fractional_kelly" | "custom";
  scoreField: string;
  family?: string;
  probabilityField?: string;
} {
  const spec = objectValue(input, "strategy_spec");
  exactKeys(
    spec,
    ["contract", "family", "version", "stake_model", "score_field", "probability_field"],
    "strategy_spec",
  );
  if (spec.contract !== "qf.strategy.v1") {
    throw new KernelError("strategy_spec contract must be qf.strategy.v1");
  }
  if (!Number.isInteger(spec.version) || (spec.version as number) < 1) {
    throw new KernelError("strategy_spec version must be a positive integer");
  }
  if (
    spec.stake_model !== "flat" &&
    spec.stake_model !== "fractional_kelly" &&
    spec.stake_model !== "custom"
  ) {
    throw new KernelError(
      "strategy_spec stake_model must be flat|fractional_kelly|custom",
    );
  }
  if (typeof spec.score_field !== "string" || spec.score_field.length === 0) {
    throw new KernelError("strategy_spec score_field must be non-empty");
  }
  const family = typeof spec.family === "string" ? spec.family : undefined;
  if (Object.prototype.hasOwnProperty.call(spec, "family") && (!family || family.length === 0)) {
    throw new KernelError("strategy_spec family must be non-empty when supplied");
  }
  const probabilityField = typeof spec.probability_field === "string" ? spec.probability_field : undefined;
  if (Object.prototype.hasOwnProperty.call(spec, "probability_field") && (!probabilityField || probabilityField.length === 0)) {
    throw new KernelError("strategy_spec probability_field must be non-empty when supplied");
  }
  const orderedSpec = family
    ? { contract: spec.contract, family, version: spec.version, stake_model: spec.stake_model, score_field: spec.score_field, ...(probabilityField ? { probability_field: probabilityField } : {}) }
    : spec;
  const bytes = new TextEncoder().encode(family ? orderedJson(orderedSpec) : `${canonicalJson(spec)}\n`);
  return {
    spec,
    bytes,
    hash: contentHash(bytes),
    version: spec.version as number,
    stakeModel: spec.stake_model,
    scoreField: spec.score_field,
    family,
    probabilityField,
  };
}

function parseParams(input: unknown): {
  value: JsonRecord;
  limit: number;
  minimumScore: number | null;
} {
  const value = objectValue(input, "params");
  exactKeys(value, ["limit", "minimum_score"], "params");
  const limit = value.limit;
  if (!Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > 1000) {
    throw new KernelError("params limit must be an integer from 1 through 1000");
  }
  const minimumScore = value.minimum_score ?? null;
  if (
    minimumScore !== null &&
    (typeof minimumScore !== "number" || !Number.isFinite(minimumScore))
  ) {
    throw new KernelError("params minimum_score must be a finite number when supplied");
  }
  return {
    value,
    limit: limit as number,
    minimumScore: minimumScore as number | null,
  };
}

function readVerifiedArtifact(
  row: { id: string; kind: string; content_hash: string; storage_ref: string },
  expectedKind: string,
): Uint8Array {
  if (row.kind !== expectedKind || row.id !== row.content_hash) {
    throw new KernelError(
      `deterministic execution requires immutable ${expectedKind} Artifact identity`,
    );
  }
  let bytes: Uint8Array;
  try {
    const location = row.storage_ref.startsWith("file:")
      ? new URL(row.storage_ref)
      : row.storage_ref;
    bytes = new Uint8Array(readFileSync(location));
  } catch {
    throw new KernelError(
      `deterministic execution Artifact bytes are unavailable: ${row.id}`,
    );
  }
  if (contentHash(bytes) !== row.id) {
    throw new KernelError(
      `deterministic execution Artifact bytes changed after publication: ${row.id}`,
    );
  }
  return bytes;
}

function loadDataset(db: KernelDb, datasetId: string): {
  contentHash: string;
  artifactId: string;
  observations: JsonRecord[];
  marketContext: JsonRecord | null;
  purpose: string | null;
} {
  const dataset = db
    .query(`SELECT content_hash, purpose FROM dataset WHERE id = ?`)
    .get(datasetId) as { content_hash: string; purpose: string | null } | null;
  if (!dataset) {
    throw new KernelError(`deterministic execution Dataset not found: ${datasetId}`);
  }
  const lineage = db
    .query(
      `SELECT artifact.id, artifact.kind, artifact.content_hash, artifact.storage_ref
         FROM links
         JOIN artifact ON artifact.id = links.to_id
        WHERE links.from_id = ? AND links.kind = 'derived_from'`,
    )
    .all(datasetId) as Array<{
      id: string;
      kind: string;
      content_hash: string;
      storage_ref: string;
    }>;
  if (
    lineage.length !== 1 ||
    lineage[0]!.id !== dataset.content_hash
  ) {
    throw new KernelError(
      "deterministic execution Dataset must have exactly one matching Artifact lineage",
    );
  }
  const bytes = readVerifiedArtifact(lineage[0]!, "result_set");
  let payload: JsonRecord;
  try {
    payload = objectValue(
      JSON.parse(new TextDecoder().decode(bytes)),
      "Dataset payload",
    );
  } catch (error) {
    if (error instanceof KernelError) throw error;
    throw new KernelError("deterministic execution Dataset payload is not JSON");
  }
  if (payload.contract !== "qf.dataset.v1" || !Array.isArray(payload.observations)) {
    throw new KernelError(
      "deterministic execution Dataset must contain qf.dataset.v1 observations",
    );
  }
  return {
    contentHash: dataset.content_hash,
    artifactId: lineage[0]!.id,
    observations: payload.observations.map((observation, index) =>
      objectValue(observation, `Dataset observation ${index}`)),
    marketContext: payload.market_context === undefined ? null : objectValue(payload.market_context, "Dataset market_context"),
    purpose: dataset.purpose,
  };
}

function compareCanonical(left: JsonRecord, right: JsonRecord): number {
  const a = canonicalJson(left);
  const b = canonicalJson(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

const METRIC_SCALE = 1_000_000n;

function parsePositiveFixed(value: unknown, label: string): bigint {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,6})?$/.test(value)) {
    throw new KernelError(`${label} must be a positive decimal string with at most 6 places`);
  }
  const [whole, fraction = ""] = value.split(".");
  const units = BigInt(whole!) * METRIC_SCALE + BigInt(fraction.padEnd(6, "0"));
  if (units <= 0n) throw new KernelError(`${label} must be greater than zero`);
  return units;
}

function roundDivide(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new KernelError("metric denominator must be positive");
  const negative = numerator < 0n;
  const absolute = negative ? -numerator : numerator;
  const rounded = (absolute + denominator / 2n) / denominator;
  return negative ? -rounded : rounded;
}

function formatFixed(units: bigint): string {
  const negative = units < 0n;
  const absolute = negative ? -units : units;
  const whole = absolute / METRIC_SCALE;
  const fraction = (absolute % METRIC_SCALE).toString().padStart(6, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

function calculateMetrics(selected: readonly JsonRecord[]): JsonRecord {
  let wins = 0n;
  let losses = 0n;
  let pushes = 0n;
  let voids = 0n;
  let settledStake = 0n;
  let netProfit = 0n;
  let clvTotal = 0n;
  let clvCount = 0n;
  let excluded = 0n;

  for (const [index, observation] of selected.entries()) {
    const raw = observation.settlement;
    if (raw === undefined) {
      excluded++;
      continue;
    }
    const settlement = objectValue(raw, `selected observation ${index} settlement`);
    exactKeys(
      settlement,
      ["outcome", "stake", "decimal_odds", "closing_decimal_odds"],
      `selected observation ${index} settlement`,
    );
    if (!["win", "loss", "push", "void"].includes(String(settlement.outcome))) {
      throw new KernelError(
        `selected observation ${index} settlement outcome must be win|loss|push|void`,
      );
    }
    const stake = parsePositiveFixed(settlement.stake, `selected observation ${index} stake`);
    const odds = parsePositiveFixed(
      settlement.decimal_odds,
      `selected observation ${index} decimal_odds`,
    );
    if (odds <= METRIC_SCALE) {
      throw new KernelError(`selected observation ${index} decimal_odds must be greater than 1`);
    }
    const outcome = settlement.outcome;
    if (outcome !== "void") settledStake += stake;
    if (outcome === "win") {
      wins++;
      netProfit += roundDivide(stake * (odds - METRIC_SCALE), METRIC_SCALE);
    } else if (outcome === "loss") {
      losses++;
      netProfit -= stake;
    } else if (outcome === "push") {
      pushes++;
    } else {
      voids++;
    }

    if (outcome !== "void" && settlement.closing_decimal_odds !== undefined) {
      const close = parsePositiveFixed(
        settlement.closing_decimal_odds,
        `selected observation ${index} closing_decimal_odds`,
      );
      if (close <= METRIC_SCALE) {
        throw new KernelError(
          `selected observation ${index} closing_decimal_odds must be greater than 1`,
        );
      }
      clvTotal += roundDivide((odds - close) * METRIC_SCALE, close);
      clvCount++;
    }
  }

  const decisive = wins + losses;
  return {
    contract: "qf.metrics.v1",
    version: 1,
    scale: 6,
    definitions: {
      roi: "net profit / stake across win, loss, and push rows; void rows excluded",
      hit_rate: "wins / (wins + losses); push and void rows excluded",
      average_clv:
        "mean of per-row (decimal_odds / closing_decimal_odds - 1), each rounded half-up to 6 decimals; missing close and void rows excluded",
      missing_settlement: "selected rows without settlement are counted and excluded",
    },
    selected_count: selected.length,
    excluded_count: Number(excluded),
    settled_count: Number(wins + losses + pushes + voids),
    clv_count: Number(clvCount),
    wins: Number(wins),
    losses: Number(losses),
    pushes: Number(pushes),
    voids: Number(voids),
    total_stake: formatFixed(settledStake),
    net_profit: formatFixed(netProfit),
    roi:
      settledStake === 0n
        ? null
        : formatFixed(roundDivide(netProfit * METRIC_SCALE, settledStake)),
    hit_rate:
      decisive === 0n
        ? null
        : formatFixed(roundDivide(wins * METRIC_SCALE, decisive)),
    average_clv:
      clvCount === 0n ? null : formatFixed(roundDivide(clvTotal, clvCount)),
  };
}

function buildResult(
  observations: readonly JsonRecord[],
  scoreField: string,
  params: { value: JsonRecord; limit: number; minimumScore: number | null },
  strategyHash: string,
  datasetHash: string,
): { bytes: Uint8Array; hash: string; selected: JsonRecord[]; metrics: JsonRecord } {
  const ranked = observations
    .map((observation) => {
      const score = observation[scoreField];
      if (typeof score !== "number" || !Number.isFinite(score)) return null;
      return { observation, score };
    })
    .filter(
      (candidate): candidate is { observation: JsonRecord; score: number } =>
        candidate !== null &&
        (params.minimumScore === null || candidate.score >= params.minimumScore),
    )
    .sort((left, right) =>
      right.score - left.score || compareCanonical(left.observation, right.observation));
  const selected = ranked.slice(0, params.limit).map((row) => row.observation);
  const metrics = calculateMetrics(selected);
  const payload = {
    contract: "qf.execution.result.v1",
    execution_version: DETERMINISTIC_EXECUTION_VERSION,
    strategy_content_hash: strategyHash,
    dataset_content_hash: datasetHash,
    params: params.value,
    selected,
    eligible_count: ranked.length,
    metrics,
  };
  const bytes = new TextEncoder().encode(`${canonicalJson(payload)}\n`);
  return { bytes, hash: contentHash(bytes), selected, metrics };
}

function artifactRow(db: KernelDb, id: string): {
  id: string;
  kind: string;
  content_hash: string;
  storage_ref: string;
} | null {
  return db
    .query(`SELECT id, kind, content_hash, storage_ref FROM artifact WHERE id = ?`)
    .get(id) as {
      id: string;
      kind: string;
      content_hash: string;
      storage_ref: string;
    } | null;
}

function verifyExistingBytes(
  db: KernelDb,
  id: string,
  kind: string,
  expected: Uint8Array,
): { exists: boolean; storageRef: string } {
  const existing = artifactRow(db, id);
  if (!existing) return { exists: false, storageRef: "" };
  const bytes = readVerifiedArtifact(existing, kind);
  if (
    bytes.length !== expected.length ||
    bytes.some((byte, index) => byte !== expected[index])
  ) {
    throw new KernelError(`deterministic execution Artifact ${id} has conflicting bytes`);
  }
  return { exists: true, storageRef: existing.storage_ref };
}

function ensureFile(directory: string, hash: string, bytes: Uint8Array): string {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, `${hash}.json`);
  if (existsSync(path)) {
    const existing = new Uint8Array(readFileSync(path));
    if (contentHash(existing) !== hash || existing.length !== bytes.length) {
      throw new KernelError(`deterministic execution file conflict: ${path}`);
    }
    for (let index = 0; index < bytes.length; index++) {
      if (existing[index] !== bytes[index]) {
        throw new KernelError(`deterministic execution file conflict: ${path}`);
      }
    }
    return path;
  }
  writeFileSync(path, bytes, { flag: "wx" });
  return path;
}

function assertRepeat(
  db: KernelDb,
  repeatOfRunId: string | undefined,
  manifestHash: string,
  resultHash: string,
): void {
  if (!repeatOfRunId) return;
  const prior = db
    .query(`SELECT status, params FROM run WHERE id = ?`)
    .get(repeatOfRunId) as { status: string; params: string } | null;
  if (!prior || prior.status !== "succeeded") {
    throw new KernelError(
      "claimed deterministic repeat requires an existing succeeded run",
    );
  }
  let priorParams: JsonRecord;
  try {
    priorParams = objectValue(JSON.parse(prior.params), "prior run params");
  } catch (error) {
    if (error instanceof KernelError) throw error;
    throw new KernelError("claimed deterministic repeat has invalid prior params");
  }
  if (priorParams.execution_manifest_hash !== manifestHash) {
    throw new KernelError("claimed deterministic repeat input manifest differs");
  }
  const outputs = db
    .query(
      `SELECT artifact.id, artifact.kind, artifact.content_hash, artifact.storage_ref
         FROM links
         JOIN artifact ON artifact.id = links.to_id
        WHERE links.from_id = ? AND links.kind = 'produces'`,
    )
    .all(repeatOfRunId) as Array<{
      id: string;
      kind: string;
      content_hash: string;
      storage_ref: string;
    }>;
  if (outputs.length !== 1 || outputs[0]!.id !== resultHash) {
    throw new KernelError("claimed deterministic repeat result hash differs");
  }
  readVerifiedArtifact(outputs[0]!, "result_set");
}

function insertArtifact(
  db: KernelDb,
  id: string,
  kind: "strategy_spec" | "code" | "result_set",
  storageRef: string,
  trace: TrustedExecutionContext,
): void {
  db.query(
    `INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, new Date().toISOString(), kind, id, storageRef);
  appendEvent(db, {
    type: "artifact.published",
    object_type: "artifact",
    object_id: id,
    payload: {
      command: "execute_deterministic_run",
      kind,
      content_hash: id,
      storage_ref: storageRef,
      span_id: trace.span_id,
    },
    trace_id: trace.trace_id,
  });
}

const CALCULATION_OPERATION = "two_way_market_history_baseline";
const CALCULATION_FORMULA_VERSION = 1;
const CALCULATION_IMPLEMENTATION_VERSION = "qf-two-way-history-v1";

function fixedProbability(price: unknown, label: string): { price_units: number; raw_probability_units: number; raw_probability: string } {
  const priceUnits = parsePositiveFixed(price, label);
  if (priceUnits <= METRIC_SCALE || priceUnits > BigInt(Number.MAX_SAFE_INTEGER)) throw new KernelError(`${label} must be greater than 1 and within the fixed-point domain`);
  const raw = roundDivide(1_000_000_000_000n, priceUnits);
  return { price_units: Number(priceUnits), raw_probability_units: Number(raw), raw_probability: formatFixed(raw) };
}

function parseCalculation(input: unknown): { value: JsonRecord; bytes: Uint8Array; hash: string } {
  const value = objectValue(input, "calculation");
  exactKeys(value, ["contract", "operation", "version", "formula_version", "implementation_version"], "calculation");
  if (value.contract !== "qf.calculation.v1" || value.operation !== CALCULATION_OPERATION || value.version !== 1 || value.formula_version !== CALCULATION_FORMULA_VERSION || value.implementation_version !== CALCULATION_IMPLEMENTATION_VERSION) {
    throw new KernelError("calculation must name two_way_market_history_baseline version 1 with the exact formula and implementation version");
  }
  const bytes = new TextEncoder().encode(`${canonicalJson(value)}\n`);
  return { value, bytes, hash: contentHash(bytes) };
}

function parseStoredObject(value: unknown, label: string): JsonRecord {
  try { return objectValue(typeof value === "string" ? JSON.parse(value) : value, label); }
  catch (error) { if (error instanceof KernelError) throw error; throw new KernelError(`${label} is not valid JSON`); }
}

function exactOne(rows: Array<{ from_id: string; to_id: string }>, label: string): { from_id: string; to_id: string } {
  if (rows.length !== 1) throw new KernelError(`${label} requires exactly one lineage edge`);
  return rows[0]!;
}

function validateMarketCalculationContext(db: KernelDb, missionId: string, quoteId: string, dataset: ReturnType<typeof loadDataset>, toolId: string): { context: JsonRecord; selections: JsonRecord[]; toolVersion: string } {
  if (dataset.purpose !== "evidence" || !dataset.marketContext) throw new KernelError("technique-free calculation requires an evidence-purpose Dataset with market_context");
  const investigation = db.query("SELECT from_id, to_id FROM links WHERE kind = 'investigates' AND from_id = ?").all(missionId) as Array<{ from_id: string; to_id: string }>;
  if (exactOne(investigation, "calculation Mission investigates").to_id !== quoteId) throw new KernelError("calculation Mission does not investigate the exact starting Quote");
  const quote = db.query("SELECT id, created_at, data_ref, coverage FROM quote WHERE id = ?").get(quoteId) as { id: string; created_at: string; data_ref: string; coverage: string } | null;
  if (!quote) throw new KernelError(`calculation Quote not found: ${quoteId}`);
  const quoteSource = db.query("SELECT id, content_hash FROM artifact WHERE id = ?").get(quote.data_ref) as { id: string; content_hash: string } | null;
  if (!quoteSource || quoteSource.id !== quoteSource.content_hash) throw new KernelError("calculation Quote source Artifact identity is invalid");
  const quotes = db.query("SELECT from_id, to_id FROM links WHERE kind = 'quotes' AND from_id = ?").all(quoteId) as Array<{ from_id: string; to_id: string }>;
  const instrumentId = exactOne(quotes, "calculation Quote quotes").to_id;
  const instrument = db.query("SELECT id, params, sides FROM instrument WHERE id = ?").get(instrumentId) as { id: string; params: string; sides: string } | null;
  if (!instrument) throw new KernelError("calculation Instrument not found");
  const offered = db.query("SELECT from_id, to_id FROM links WHERE kind = 'offered_on' AND from_id = ?").all(instrumentId) as Array<{ from_id: string; to_id: string }>;
  const eventId = exactOne(offered, "calculation Instrument offered_on").to_id;
  const event = db.query("SELECT id, starts_at FROM market_event WHERE id = ?").get(eventId) as { id: string; starts_at: string } | null;
  if (!event) throw new KernelError("calculation Market Event not found");
  const coverage = parseStoredObject(quote.coverage, "Quote coverage");
  const params = parseStoredObject(instrument.params, "Instrument params");
  const sides = JSON.parse(instrument.sides) as unknown;
  const selections = Array.isArray(coverage.selections) ? coverage.selections.map((row, index) => objectValue(row, `Quote selection ${index}`)) : [];
  const competitorIds = Array.isArray(params.competitor_ids) ? params.competitor_ids : [];
  const selectionIds = Array.isArray(params.selection_ids) ? params.selection_ids : [];
  if (selections.length !== 2 || competitorIds.length !== 2 || selectionIds.length !== 2 || !Array.isArray(sides) || sides.length !== 2) throw new KernelError("calculation requires exact ordered two-way Quote identity");
  if (coverage.source_hash !== quoteSource.content_hash) throw new KernelError("calculation Quote coverage source hash differs from its source Artifact");
  for (const [index, selection] of selections.entries()) {
    if (selection.competitor_id !== competitorIds[index] || selection.selection_id !== selectionIds[index] || selection.label !== sides[index]) {
      throw new KernelError(`calculation Quote selection ${index} differs from ordered Instrument identity`);
    }
  }
  if (typeof params.provider_event_id === "string" && typeof coverage.provider_event_id === "string" && params.provider_event_id !== coverage.provider_event_id) throw new KernelError("calculation Quote provider event identity differs from its Instrument");
  if (typeof params.provider_market_id === "string" && typeof coverage.provider_market_id === "string" && params.provider_market_id !== coverage.provider_market_id) throw new KernelError("calculation Quote provider market identity differs from its Instrument");
  const competitors = selections.map((selection, index) => ({ competitor_id: competitorIds[index], selection_id: selectionIds[index], label: sides[index] }));
  const live = { quote_id: quoteId, quote_observed_at: coverage.observed_at, quote_source_hash: quoteSource.content_hash, market_event_id: eventId, event_cutoff: event.starts_at, competitors, selection_ids: selectionIds };
  if (canonicalJson(dataset.marketContext) !== canonicalJson(live)) throw new KernelError("calculation Dataset market_context differs from live Quote lineage");
  const tool = db.query("SELECT name, capability_class, implementation_version FROM tool WHERE id = ?").get(toolId) as { name: string; capability_class: string | null; implementation_version: string | null } | null;
  if (!tool || tool.name !== "Research Lab" || tool.capability_class !== "tool" || !tool.implementation_version) throw new KernelError("calculation requires the registered Research Lab Tool");
  return { context: live, selections, toolVersion: tool.implementation_version };
}

function buildCalculationResult(dataset: ReturnType<typeof loadDataset>, selections: JsonRecord[], context: JsonRecord, calculationHash: string, toolId: string, toolVersion: string): { bytes: Uint8Array; hash: string; output: JsonRecord } {
  const summaries = new Map(dataset.observations.map((row) => [String(row.competitor_id), row]));
  const priced = selections.map((selection, index) => {
    const decimal = selection.decimal;
    const probability = fixedProbability(decimal, `Quote selection ${index} decimal price`);
    return { selection, probability, history: summaries.get(String((context.competitors as JsonRecord[])[index]!.competitor_id)) };
  });
  const overround = BigInt(priced[0]!.probability.raw_probability_units) + BigInt(priced[1]!.probability.raw_probability_units);
  const sides = priced.map(({ selection, probability, history }, index) => {
    if (!history) throw new KernelError(`Dataset has no summary for ordered competitor ${index}`);
    for (const field of ["wins", "losses", "draws", "no_contests", "decisive_sample_size"]) if (!Number.isSafeInteger(history[field]) || (history[field] as number) < 0) throw new KernelError(`Dataset history ${field} is outside the integer domain`);
    const wins = BigInt(history.wins as number), losses = BigInt(history.losses as number), decisive = wins + losses;
    if (Number(decisive) !== history.decisive_sample_size) throw new KernelError("Dataset decisive sample size does not equal wins plus losses");
    const normalizedUnits = roundDivide(BigInt(probability.raw_probability_units) * METRIC_SCALE, overround);
    const fractionUnits = decisive === 0n ? null : roundDivide(wins * METRIC_SCALE, decisive);
    return { competitor_id: history.competitor_id, selection_id: history.selection_id, label: selection.label, decimal_price: selection.decimal, price_units: probability.price_units, raw_implied_probability_units: probability.raw_probability_units, raw_implied_probability: probability.raw_probability, normalized_market_probability_units: Number(normalizedUnits), normalized_market_probability: formatFixed(normalizedUnits), source_listed_wins: Number(wins), source_listed_losses: Number(losses), source_listed_draws: history.draws, source_listed_no_contests: history.no_contests, decisive_sample_size: Number(decisive), source_listed_decisive_fraction_units: fractionUnits === null ? null : Number(fractionUnits), source_listed_decisive_fraction: fractionUnits === null ? null : formatFixed(fractionUnits) };
  });
  const output: JsonRecord = { contract: "qf.calculation.result.v1", operation: CALCULATION_OPERATION, formula_version: CALCULATION_FORMULA_VERSION, implementation_version: CALCULATION_IMPLEMENTATION_VERSION, scale: 6, formulas: { raw_implied_probability: "round_half_up(1000000000000 / price_units)", overround: "sum(raw_implied_probability_units)", normalized_market_probability: "round_half_up(raw_implied_probability_units * 1000000 / overround_units)", source_listed_decisive_fraction: "round_half_up(wins * 1000000 / (wins + losses)); unavailable when denominator is zero" }, market_context: context, dataset_id: `dataset:${dataset.contentHash}`, dataset_content_hash: dataset.contentHash, calculation_envelope_hash: calculationHash, capability_id: toolId, capability_version: toolVersion, execution_environment: EXECUTION_ENVIRONMENT_ID, overround_units: Number(overround), overround: formatFixed(overround), sides, limitation: "Source-listed descriptive history is not an estimated win probability." };
  const bytes = new TextEncoder().encode(`${canonicalJson(output)}\n`);
  return { bytes, hash: contentHash(bytes), output };
}

function executeTransparentCalculation(db: KernelDb, cmd: CreationCommand, input: Record<string, unknown>, trace: TrustedExecutionContext, runId: string, datasetId: string, repeatOfRunId: string | undefined): ObjectExecuteResult {
  if (input.strategy_spec !== undefined || input.strategy_id !== undefined || input.hypothesis_id !== undefined) throw new KernelError("calculation mode is mutually exclusive with Strategy and Hypothesis inputs");
  const params = objectValue(input.params, "params"); exactKeys(params, [], "calculation params");
  const missionId = input.mission_id, quoteId = input.quote_id, toolId = input.tool_id;
  if (typeof missionId !== "string" || !missionId || typeof quoteId !== "string" || !quoteId || typeof toolId !== "string" || !toolId) throw new KernelError("calculation mode requires exact mission_id, quote_id, and tool_id");
  const calculation = parseCalculation(input.calculation);
  const dataset = loadDataset(db, datasetId);
  const validated = validateMarketCalculationContext(db, missionId, quoteId, dataset, toolId);
  const result = buildCalculationResult(dataset, validated.selections, validated.context, calculation.hash, toolId, validated.toolVersion);
  const manifest = { contract: "qf.execution.manifest.v1", execution_version: DETERMINISTIC_EXECUTION_VERSION, mode: "calculation", operation: CALCULATION_OPERATION, formula_version: CALCULATION_FORMULA_VERSION, implementation_version: CALCULATION_IMPLEMENTATION_VERSION, dataset_id: datasetId, dataset_content_hash: dataset.contentHash, quote_id: quoteId, quote_observed_at: validated.context.quote_observed_at, quote_source_hash: validated.context.quote_source_hash, event_cutoff: validated.context.event_cutoff, mission_id: missionId, calculation_envelope_hash: calculation.hash, capability_id: toolId, capability_version: validated.toolVersion, execution_environment: EXECUTION_ENVIRONMENT_ID, params };
  const manifestHash = contentHash(new TextEncoder().encode(`${canonicalJson(manifest)}\n`));
  assertRepeat(db, repeatOfRunId, manifestHash, result.hash);
  const root = resolveArtifactRoot().path;
  const methodExisting = verifyExistingBytes(db, calculation.hash, "code", calculation.bytes);
  const resultExisting = verifyExistingBytes(db, result.hash, "result_set", result.bytes);
  const methodStorage = methodExisting.exists ? methodExisting.storageRef : ensureFile(join(root, "calculation-envelopes"), calculation.hash, calculation.bytes);
  const resultStorage = resultExisting.exists ? resultExisting.storageRef : ensureFile(join(root, "deterministic-results"), result.hash, result.bytes);
  const runParams = { ...manifest, execution_manifest_hash: manifestHash, dataset_artifact_id: dataset.artifactId, result_artifact_id: result.hash, ...(trace.actor_session_id ? { executor_session_id: trace.actor_session_id } : {}), ...(repeatOfRunId ? { repeat_of_run_id: repeatOfRunId } : {}) };
  const commitCalculation = db.transaction(() => {
    if (!methodExisting.exists) insertArtifact(db, calculation.hash, "code", methodStorage, trace);
    const environmentLabel = `QuantFlow deterministic executor ${DETERMINISTIC_EXECUTION_VERSION}`;
    const environment = db.query("SELECT kind, label FROM execution_environment WHERE id = ?").get(EXECUTION_ENVIRONMENT_ID) as { kind: string; label: string } | null;
    if (!environment) { db.query("INSERT INTO execution_environment (id, created_at, kind, label) VALUES (?, ?, 'local_process', ?)").run(EXECUTION_ENVIRONMENT_ID, new Date().toISOString(), environmentLabel); appendEvent(db, { type: "execution_environment.registered", object_type: "execution_environment", object_id: EXECUTION_ENVIRONMENT_ID, payload: { command: cmd.action, kind: "local_process", label: environmentLabel, version: DETERMINISTIC_EXECUTION_VERSION, span_id: trace.span_id }, trace_id: trace.trace_id }); }
    else if (environment.kind !== "local_process" || environment.label !== environmentLabel) throw new KernelError(`immutable execution environment conflict: ${EXECUTION_ENVIRONMENT_ID}`);
    if (!resultExisting.exists) insertArtifact(db, result.hash, "result_set", resultStorage, trace);
    db.query("INSERT INTO run (id, created_at, kind, status, params, trace_id) VALUES (?, ?, 'analysis', 'succeeded', ?, ?)").run(runId, new Date().toISOString(), JSON.stringify(runParams), trace.trace_id);
    writeLinks(db, "run", runId, [{ kind: "uses", to_id: datasetId }, { kind: "uses", to_id: toolId }, { kind: "uses", to_id: calculation.hash }, { kind: "uses", to_id: quoteId }, { kind: "executes_in", to_id: EXECUTION_ENVIRONMENT_ID }, { kind: "produces", to_id: result.hash }, { kind: "belongs_to", to_id: missionId }]);
    for (const event of ["run.created", "run.started", "run.succeeded"]) appendEvent(db, { type: event, object_type: "run", object_id: runId, payload: { command: cmd.action, execution_manifest_hash: manifestHash, result_artifact_id: result.hash, span_id: trace.span_id }, trace_id: trace.trace_id });
    return db.query("SELECT * FROM run WHERE id = ?").get(runId) as JsonRecord;
  });
  const state = commitCalculation();
  return { kind: "object", object_type: "run", object_id: runId, from: "(none)", to: "succeeded", event: "run.succeeded", state: { ...state, execution_manifest_hash: manifestHash, result_artifact_id: result.hash, output: result.output } };
}

export function executeDeterministicRun(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TrustedExecutionContext,
  links: LinkSpec[],
  envelope?: CreationEnvelopePresence,
): ObjectExecuteResult {
  if (links.length > 0 || envelope?.links || envelope?.bytes) {
    throw new KernelError(
      "execute_deterministic_run rejects caller-supplied links and bytes",
    );
  }
  const runId = input.run_id;
  const datasetId = input.dataset_id;
  if (typeof runId !== "string" || runId.length === 0) {
    throw new KernelError("execute_deterministic_run requires non-empty run_id");
  }
  if (typeof datasetId !== "string" || datasetId.length === 0) {
    throw new KernelError("execute_deterministic_run requires non-empty dataset_id");
  }
  const hypothesisId = input.hypothesis_id;
  if (hypothesisId !== undefined && (typeof hypothesisId !== "string" || hypothesisId.length === 0)) {
    throw new KernelError("execute_deterministic_run hypothesis_id must be a non-empty string when supplied");
  }
  if (db.query(`SELECT 1 AS ok FROM run WHERE id = ?`).get(runId)) {
    throw new KernelError(`run "${runId}" already exists`);
  }
  const repeatOfRunId = input.repeat_of_run_id;
  if (repeatOfRunId !== undefined &&
      (typeof repeatOfRunId !== "string" || repeatOfRunId.length === 0)) {
    throw new KernelError("repeat_of_run_id must be a non-empty string");
  }

  if (input.calculation !== undefined) {
    return executeTransparentCalculation(db, cmd, input, trace, runId, datasetId, repeatOfRunId as string | undefined);
  }
  if (input.mission_id !== undefined || input.quote_id !== undefined || input.tool_id !== undefined) {
    throw new KernelError("Strategy mode rejects calculation-only Mission, Quote, and Tool inputs");
  }

  const selectedStrategyId = typeof input.strategy_id === "string" && input.strategy_id.length > 0
    ? input.strategy_id
    : undefined;
  const selectedSpec = selectedStrategyId ? readStrategySpec(db, selectedStrategyId) : input.strategy_spec;
  const strategy = parseStrategy(selectedSpec);
  if (selectedStrategyId && !strategy.family) {
    throw new KernelError(`TECHNIQUE COVERAGE REFUSED: legacy Strategy cannot be selected for R17 forward research: ${selectedStrategyId}`);
  }
  const params = parseParams(input.params);
  const dataset = loadDataset(db, datasetId);
  if (typeof hypothesisId === "string" && !db.query(`SELECT 1 AS ok FROM hypothesis WHERE id = ?`).get(hypothesisId)) {
    throw new KernelError(`execute_deterministic_run Hypothesis not found: ${hypothesisId}`);
  }
  const strategyId = selectedStrategyId ?? (strategy.family
    ? `strategy:${strategy.family}:v${strategy.version}:${strategy.hash.slice(0, 16)}`
    : `strategy:${strategy.hash}:v${strategy.version}`);
  const manifest = {
    contract: "qf.execution.manifest.v1",
    execution_version: DETERMINISTIC_EXECUTION_VERSION,
    strategy_content_hash: strategy.hash,
    dataset_content_hash: dataset.contentHash,
    params: params.value,
  };
  const manifestHash = contentHash(
    new TextEncoder().encode(`${canonicalJson(manifest)}\n`),
  );
  const result = buildResult(
    dataset.observations,
    strategy.scoreField,
    params,
    strategy.hash,
    dataset.contentHash,
  );

  assertRepeat(
    db,
    repeatOfRunId as string | undefined,
    manifestHash,
    result.hash,
  );

  const root = resolveArtifactRoot().path;
  const strategyExisting = verifyExistingBytes(
    db,
    strategy.hash,
    "strategy_spec",
    strategy.bytes,
  );
  const resultExisting = verifyExistingBytes(
    db,
    result.hash,
    "result_set",
    result.bytes,
  );
  const strategyStorage = strategyExisting.exists
    ? strategyExisting.storageRef
    : ensureFile(join(root, "deterministic-strategies"), strategy.hash, strategy.bytes);
  const resultStorage = resultExisting.exists
    ? resultExisting.storageRef
    : ensureFile(join(root, "deterministic-results"), result.hash, result.bytes);

  const runParams = {
    ...params.value,
    execution_contract: "qf.execution.manifest.v1",
    execution_version: DETERMINISTIC_EXECUTION_VERSION,
    execution_manifest_hash: manifestHash,
    strategy_id: strategyId,
    strategy_artifact_id: strategy.hash,
    dataset_id: datasetId,
    dataset_artifact_id: dataset.artifactId,
    dataset_content_hash: dataset.contentHash,
    result_artifact_id: result.hash,
    ...(typeof hypothesisId === "string" ? { hypothesis_id: hypothesisId } : {}),
    ...(trace.actor_session_id
      ? { executor_session_id: trace.actor_session_id }
      : {}),
    ...(repeatOfRunId ? { repeat_of_run_id: repeatOfRunId } : {}),
  };

  const tx = db.transaction(() => {
    if (!strategyExisting.exists) {
      insertArtifact(db, strategy.hash, "strategy_spec", strategyStorage, trace);
    }
    const priorStrategy = db
      .query(`SELECT spec_ref, version, stake_model FROM strategy WHERE id = ?`)
      .get(strategyId) as {
        spec_ref: string;
        version: number;
        stake_model: string;
      } | null;
    if (!priorStrategy) {
      let predecessorStrategyId: string | undefined;
      if (strategy.family) {
        const family = strategy.family;
        const familyRows = db.query("SELECT id, spec_ref, version FROM strategy").all() as Array<{ id: string; spec_ref: string; version: number }>;
        for (const row of familyRows) {
          let priorSpec: JsonRecord | null = null;
          try {
            const artifact = db.query("SELECT id, kind, content_hash, storage_ref FROM artifact WHERE id = ?").get(row.spec_ref) as { id: string; kind: string; content_hash: string; storage_ref: string } | null;
            if (artifact?.kind === "strategy_spec") priorSpec = objectValue(JSON.parse(new TextDecoder().decode(readVerifiedArtifact(artifact, "strategy_spec"))), "strategy_spec");
          } catch { /* malformed legacy specs remain readable only through their legacy path */ }
          if (priorSpec?.family === family && priorSpec.version === strategy.version) throw new KernelError(`duplicate Strategy family/version: ${family} v${strategy.version}`);
          if (priorSpec?.family === family && priorSpec.version === strategy.version - 1) {
            predecessorStrategyId = row.id;
          }
        }
        if (strategy.version > 1) {
          const predecessor = familyRows.filter((row) => {
            try {
              const artifact = db.query("SELECT id, kind, content_hash, storage_ref FROM artifact WHERE id = ?").get(row.spec_ref) as { id: string; kind: string; content_hash: string; storage_ref: string } | null;
              const priorSpec = artifact?.kind === "strategy_spec" ? objectValue(JSON.parse(new TextDecoder().decode(readVerifiedArtifact(artifact, "strategy_spec"))), "strategy_spec") : null;
              return priorSpec?.family === family && priorSpec.version === strategy.version - 1;
            } catch { return false; }
          });
          if (predecessor.length !== 1) throw new KernelError(`Strategy version ${family} v${strategy.version} requires exactly one immediate predecessor`);
        }
      }
      db.query(
        `INSERT INTO strategy (id, created_at, spec_ref, version, stake_model)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(
        strategyId,
        new Date().toISOString(),
        strategy.hash,
        strategy.version,
        strategy.stakeModel,
      );
      if (!strategy.family) writeLinks(db, "strategy", strategyId, [{ kind: "derived_from", to_id: strategy.hash }]);
      else if (predecessorStrategyId) writeLinks(db, "strategy", strategyId, [{ kind: "derived_from", to_id: predecessorStrategyId }]);
      appendEvent(db, {
        type: "strategy.registered",
        object_type: "strategy",
        object_id: strategyId,
        payload: {
          command: cmd.action,
          spec_ref: strategy.hash,
          version: strategy.version,
          stake_model: strategy.stakeModel,
          span_id: trace.span_id,
        },
        trace_id: trace.trace_id,
      });
    } else if (
      priorStrategy.spec_ref !== strategy.hash ||
      priorStrategy.version !== strategy.version ||
      priorStrategy.stake_model !== strategy.stakeModel
    ) {
      throw new KernelError(`immutable Strategy conflict: ${strategyId}`);
    }

    const environment = db
      .query(`SELECT kind, label FROM execution_environment WHERE id = ?`)
      .get(EXECUTION_ENVIRONMENT_ID) as { kind: string; label: string } | null;
    const environmentLabel = `QuantFlow deterministic executor ${DETERMINISTIC_EXECUTION_VERSION}`;
    if (!environment) {
      db.query(
        `INSERT INTO execution_environment (id, created_at, kind, label)
         VALUES (?, ?, 'local_process', ?)`,
      ).run(
        EXECUTION_ENVIRONMENT_ID,
        new Date().toISOString(),
        environmentLabel,
      );
      appendEvent(db, {
        type: "execution_environment.registered",
        object_type: "execution_environment",
        object_id: EXECUTION_ENVIRONMENT_ID,
        payload: {
          command: cmd.action,
          kind: "local_process",
          label: environmentLabel,
          version: DETERMINISTIC_EXECUTION_VERSION,
          span_id: trace.span_id,
        },
        trace_id: trace.trace_id,
      });
    } else if (
      environment.kind !== "local_process" ||
      environment.label !== environmentLabel
    ) {
      throw new KernelError(
        `immutable execution environment conflict: ${EXECUTION_ENVIRONMENT_ID}`,
      );
    }

    if (!resultExisting.exists) {
      insertArtifact(db, result.hash, "result_set", resultStorage, trace);
    }

    const createdAt = new Date().toISOString();
    db.query(
      `INSERT INTO run (id, created_at, kind, status, params, trace_id)
       VALUES (?, ?, 'backtest', 'succeeded', ?, ?)`,
    ).run(runId, createdAt, JSON.stringify(runParams), trace.trace_id);
    writeLinks(db, "run", runId, [
      { kind: "uses", to_id: datasetId },
      { kind: "uses", to_id: strategyId },
      { kind: "executes_in", to_id: EXECUTION_ENVIRONMENT_ID },
      { kind: "produces", to_id: result.hash },
      ...(typeof hypothesisId === "string" ? [{ kind: "tests", to_id: hypothesisId }] : []),
    ]);
    for (const event of ["run.created", "run.started", "run.succeeded"]) {
      appendEvent(db, {
        type: event,
        object_type: "run",
        object_id: runId,
        payload: {
          command: cmd.action,
          execution_manifest_hash: manifestHash,
          result_artifact_id: result.hash,
          span_id: trace.span_id,
        },
        trace_id: trace.trace_id,
      });
    }
    return db.query(`SELECT * FROM run WHERE id = ?`).get(runId) as JsonRecord;
  });

  const state = tx();
  return {
    kind: "object",
    object_type: "run",
    object_id: runId,
    from: "(none)",
    to: "succeeded",
    event: "run.succeeded",
    state: {
      ...state,
      execution_manifest_hash: manifestHash,
      result_artifact_id: result.hash,
      selected_count: result.selected.length,
      metrics: result.metrics,
    },
  };
}
