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
import type { TraceContext } from "./trace.ts";

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
} {
  const spec = objectValue(input, "strategy_spec");
  exactKeys(
    spec,
    ["contract", "version", "stake_model", "score_field"],
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
  const bytes = new TextEncoder().encode(`${canonicalJson(spec)}\n`);
  return {
    spec,
    bytes,
    hash: contentHash(bytes),
    version: spec.version as number,
    stakeModel: spec.stake_model,
    scoreField: spec.score_field,
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
} {
  const dataset = db
    .query(`SELECT content_hash FROM dataset WHERE id = ?`)
    .get(datasetId) as { content_hash: string } | null;
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
): { bytes: Uint8Array; hash: string; selected: JsonRecord[] } {
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
  return { bytes, hash: contentHash(bytes), selected };
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
  kind: "strategy_spec" | "result_set",
  storageRef: string,
  trace: TraceContext,
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

export function executeDeterministicRun(
  db: KernelDb,
  cmd: CreationCommand,
  input: Record<string, unknown>,
  trace: TraceContext,
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
  if (db.query(`SELECT 1 AS ok FROM run WHERE id = ?`).get(runId)) {
    throw new KernelError(`run "${runId}" already exists`);
  }
  const repeatOfRunId = input.repeat_of_run_id;
  if (repeatOfRunId !== undefined &&
      (typeof repeatOfRunId !== "string" || repeatOfRunId.length === 0)) {
    throw new KernelError("repeat_of_run_id must be a non-empty string");
  }

  const strategy = parseStrategy(input.strategy_spec);
  const params = parseParams(input.params);
  const dataset = loadDataset(db, datasetId);
  const strategyId = `strategy:${strategy.hash}:v${strategy.version}`;
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
      writeLinks(db, "strategy", strategyId, [
        { kind: "derived_from", to_id: strategy.hash },
      ]);
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
    },
  };
}
