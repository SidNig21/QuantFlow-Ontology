import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CreationCommand } from "qf-kernel-schema/commands";
import type { KernelDb } from "./db.ts";
import { KernelError } from "./errors.ts";
import { appendEvent } from "./events.ts";
import { contentHash } from "./hash.ts";
import { resolveArtifactRoot } from "./resolve-artifact-root.ts";
import type { ObjectExecuteResult } from "./results.ts";
import type { TrustedExecutionContext } from "./trace.ts";

type JsonRecord = Record<string, unknown>;
const SCALE = 1_000_000n;
const DECIMAL = /^\d+(?:\.\d+)?$/u;
const SETTLED_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/u;

function fail(message: string): never { throw new KernelError(message); }
function record(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as JsonRecord;
}
function exactKeys(value: JsonRecord, allowed: readonly string[], label: string): void {
  const extras = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extras.length) fail(`${label} rejects fields: ${extras.sort().join(", ")}`);
}

/** JSON encoding used by R17. It preserves insertion order and emits UTF-8 literally. */
export function r17CanonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("R17 canonical JSON refuses non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(r17CanonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const object = value as JsonRecord;
    return `{${Object.keys(object).map((key) => {
      if (object[key] === undefined) fail(`R17 canonical JSON refuses undefined field "${key}"`);
      return `${JSON.stringify(key)}:${r17CanonicalJson(object[key])}`;
    }).join(",")}}`;
  }
  fail("R17 canonical JSON accepts JSON values only");
}

function normalizedDecimal(value: unknown, label: string, allowZero: boolean): string {
  if (typeof value !== "string" || !DECIMAL.test(value)) fail(`${label} must be a decimal string`);
  const [wholeRaw, fractionRaw = ""] = value.split(".");
  const whole = wholeRaw!.replace(/^0+(?=\d)/u, "") || "0";
  const fraction = fractionRaw.replace(/0+$/u, "");
  const normalized = fraction.length ? `${whole}.${fraction}` : whole;
  if (!allowZero && normalized === "0") fail(`${label} must be greater than zero`);
  return normalized;
}

function decimalParts(value: string): { units: bigint; scale: bigint } {
  const [whole, fraction = ""] = value.split(".");
  return { units: BigInt(`${whole}${fraction}`), scale: 10n ** BigInt(fraction.length) };
}
function decimalGreaterThanOne(value: string, label: string): void {
  const parts = decimalParts(value);
  if (parts.units <= parts.scale) fail(`${label} must be greater than 1`);
}
function roundedFixed(numerator: bigint, denominator: bigint): string {
  if (denominator <= 0n) fail("R17 metric denominator must be positive");
  const negative = numerator < 0n;
  const absolute = negative ? -numerator : numerator;
  const rounded = (absolute * SCALE + denominator / 2n) / denominator;
  const whole = rounded / SCALE;
  return `${negative ? "-" : ""}${whole}.${(rounded % SCALE).toString().padStart(6, "0")}`;
}
function probabilityFixed(value: number): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) fail("predicted_probability must be a finite JSON number in [0,1]");
  return roundedFixed(BigInt(Math.round(value * 1_000_000)), 1_000_000n);
}

function decodePointer(value: unknown, pointer: string): unknown {
  if (pointer === "") return value;
  if (!pointer.startsWith("/")) fail("strategy probability_field must be an RFC 6901 JSON Pointer");
  let current: unknown = value;
  for (const raw of pointer.slice(1).split("/")) {
    const token = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (Array.isArray(current) && /^(?:0|[1-9]\d*)$/u.test(token)) current = current[Number(token)];
    else if (current && typeof current === "object") current = (current as JsonRecord)[token];
    else current = undefined;
  }
  return current;
}

function storedBytes(row: { storage_ref: string; id: string; content_hash: string }): Uint8Array {
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(readFileSync(row.storage_ref.startsWith("file:") ? new URL(row.storage_ref) : row.storage_ref));
  } catch { fail(`R17 Artifact bytes are unavailable: ${row.id}`); }
  if (row.id !== row.content_hash || contentHash(bytes) !== row.id) fail(`R17 Artifact bytes changed after publication: ${row.id}`);
  return bytes;
}

export function readStrategySpec(db: KernelDb, strategyId: string): JsonRecord {
  const strategy = db.query("SELECT id, spec_ref, version, stake_model FROM strategy WHERE id = ?").get(strategyId) as { id: string; spec_ref: string; version: number; stake_model: string } | null;
  if (!strategy) fail(`TECHNIQUE COVERAGE REFUSED: Strategy not found: ${strategyId}`);
  const artifact = db.query("SELECT id, kind, content_hash, storage_ref FROM artifact WHERE id = ?").get(strategy.spec_ref) as { id: string; kind: string; content_hash: string; storage_ref: string } | null;
  if (!artifact || artifact.kind !== "strategy_spec") fail(`TECHNIQUE COVERAGE REFUSED: Strategy spec Artifact unavailable: ${strategy.spec_ref}`);
  let spec: JsonRecord;
  try { spec = record(JSON.parse(new TextDecoder().decode(storedBytes(artifact))), "strategy_spec"); }
  catch (error) { if (error instanceof KernelError) throw error; fail(`TECHNIQUE COVERAGE REFUSED: malformed Strategy spec: ${strategy.spec_ref}`); }
  exactKeys(spec, ["contract", "family", "version", "stake_model", "score_field", "probability_field"], "strategy_spec");
  if (spec.contract !== "qf.strategy.v1" || typeof spec.family !== "string" || spec.family.length === 0 || !Number.isInteger(spec.version) || spec.version !== strategy.version || spec.stake_model !== strategy.stake_model || typeof spec.score_field !== "string" || spec.score_field.length === 0) fail(`TECHNIQUE COVERAGE REFUSED: Strategy spec mismatch: ${strategyId}`);
  if (typeof spec.probability_field !== "string" || spec.probability_field.length === 0) fail(`TECHNIQUE COVERAGE REFUSED: Strategy probability pointer is unavailable: ${strategyId}`);
  const canonical = { contract: spec.contract, family: spec.family, version: spec.version, stake_model: spec.stake_model, score_field: spec.score_field, probability_field: spec.probability_field };
  if (new TextDecoder().decode(storedBytes(artifact)) !== r17CanonicalJson(canonical)) fail(`TECHNIQUE COVERAGE REFUSED: Strategy spec bytes are not canonical: ${strategyId}`);
  return spec;
}

function objectTypeForId(db: KernelDb, id: string): string | null {
  for (const type of ["ticket", "artifact", "run", "strategy"]) {
    if (db.query(`SELECT 1 AS ok FROM ${type} WHERE id = ?`).get(id)) return type;
  }
  return null;
}
function link(db: KernelDb, kind: string, fromId: string, toId: string): void {
  if (!objectTypeForId(db, fromId) || !objectTypeForId(db, toId)) fail(`R17 link target missing: ${kind}`);
  db.query("INSERT INTO links (id, kind, from_id, to_id, created_at) VALUES (?, ?, ?, ?, ?)").run(crypto.randomUUID(), kind, fromId, toId, new Date().toISOString());
}
function findExistingGrade(db: KernelDb, externalRef: string): { ticketId: string; artifactId: string; bytes: Uint8Array } | null {
  const ticket = db.query("SELECT id FROM ticket WHERE external_ref = ?").get(externalRef) as { id: string } | null;
  if (!ticket) return null;
  const grade = db.query("SELECT l.from_id AS artifact_id FROM links l JOIN artifact a ON a.id = l.from_id WHERE l.kind = 'grades_ticket' AND l.to_id = ?").all(ticket.id) as Array<{ artifact_id: string }>;
  if (grade.length !== 1) fail(`R17 external_ref already exists without exactly one outcome grade: ${externalRef}`);
  const row = db.query("SELECT id, content_hash, storage_ref FROM artifact WHERE id = ?").get(grade[0]!.artifact_id) as { id: string; content_hash: string; storage_ref: string } | null;
  if (!row) fail(`R17 outcome grade Artifact missing: ${grade[0]!.artifact_id}`);
  return { ticketId: ticket.id, artifactId: row.id, bytes: storedBytes(row) };
}

function parseResult(db: KernelDb, runId: string, selectionRef: string): { run: JsonRecord; strategyId: string; resultId: string; selection: JsonRecord } {
  const run = db.query("SELECT * FROM run WHERE id = ?").get(runId) as JsonRecord | null;
  if (!run || run.status !== "succeeded") fail(`R17 outcome requires a succeeded Run: ${runId}`);
  let params: JsonRecord; try { params = record(JSON.parse(String(run.params)), "Run params"); } catch { fail("R17 Run params are malformed"); }
  const strategyLinks = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'uses' AND EXISTS (SELECT 1 FROM strategy WHERE id = to_id)").all(runId) as Array<{ to_id: string }>;
  if (strategyLinks.length !== 1) fail("R17 Run must use exactly one Strategy");
  const strategyId = strategyLinks[0]!.to_id;
  const resultId = String(params.result_artifact_id ?? "");
  const resultLinks = db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'produces'").all(runId) as Array<{ to_id: string }>;
  if (resultLinks.length !== 1 || resultLinks[0]!.to_id !== resultId) fail("R17 Run result Artifact lineage is not exact");
  const result = db.query("SELECT id, kind, content_hash, storage_ref FROM artifact WHERE id = ?").get(resultId) as { id: string; kind: string; content_hash: string; storage_ref: string } | null;
  if (!result || result.kind !== "result_set") fail("R17 Run result Artifact is unavailable");
  let payload: JsonRecord; try { payload = record(JSON.parse(new TextDecoder().decode(storedBytes(result))), "Run result"); } catch { fail("R17 Run result payload is malformed"); }
  const selected = payload.selected;
  if (!Array.isArray(selected)) fail("R17 Run result has no selected observations");
  const matches = selected.filter((row) => record(row, "selected observation").id === selectionRef);
  if (matches.length !== 1) fail(`R17 selected observation is not unique: ${selectionRef}`);
  return { run, strategyId, resultId, selection: record(matches[0], "selected observation") };
}

export function recordStrategyOutcome(db: KernelDb, cmd: CreationCommand, input: Record<string, unknown>, trace: TrustedExecutionContext): ObjectExecuteResult {
  if (trace.actor_session_id) fail("record_strategy_outcome is operator-only");
  exactKeys(input, ["run_id", "selection_ref", "external_ref", "settled_at", "outcome", "decimal_odds", "closing_decimal_odds", "stake", "payout"], "record_strategy_outcome");
  for (const key of ["run_id", "selection_ref", "external_ref"] as const) if (typeof input[key] !== "string" || input[key] === "") fail(`record_strategy_outcome requires non-empty ${key}`);
  const externalRef = input.external_ref as string;
  if (/^[\s\u0000-\u001f\u007f-\u009f]|[\s\u0000-\u001f\u007f-\u009f]$/u.test(externalRef)) fail("external_ref must have no controls or surrounding whitespace");
  if (!SETTLED_AT.test(String(input.settled_at))) fail("settled_at must be UTC ISO-8601 with literal Z and at most six fractional digits");
  const rawSettledAt = String(input.settled_at);
  const settledAt = rawSettledAt.includes(".")
    ? rawSettledAt.replace(/\.(\d{1,6})Z$/u, (_m, fraction: string) => `.${fraction.padEnd(6, "0")}Z`)
    : rawSettledAt.replace(/Z$/u, ".000000Z");
  const odds = normalizedDecimal(input.decimal_odds, "decimal_odds", false); decimalGreaterThanOne(odds, "decimal_odds");
  const close = input.closing_decimal_odds === undefined ? null : normalizedDecimal(input.closing_decimal_odds, "closing_decimal_odds", false); if (close) decimalGreaterThanOne(close, "closing_decimal_odds");
  const stake = normalizedDecimal(input.stake, "stake", true);
  const payout = input.payout === null ? null : normalizedDecimal(input.payout, "payout", true);
  const canonicalInput = { run_id: input.run_id, selection_ref: input.selection_ref, external_ref: externalRef, settled_at: settledAt, outcome: input.outcome, decimal_odds: odds, closing_decimal_odds: close, stake, payout };
  const tx = db.transaction(() => {
    const existing = findExistingGrade(db, externalRef);
    if (existing) {
      const old = record(JSON.parse(new TextDecoder().decode(existing.bytes)), "existing grade");
      if (r17CanonicalJson({ run_id: old.run_id, selection_ref: old.selection_ref, external_ref: old.external_ref, settled_at: old.settled_at, outcome: old.outcome, decimal_odds: old.decimal_odds, closing_decimal_odds: old.closing_decimal_odds, stake: old.stake, payout: old.payout }) !== r17CanonicalJson(canonicalInput)) fail(`R17 external_ref conflicts with existing outcome: ${externalRef}`);
      return { existing, old };
    }
    const parsed = parseResult(db, String(input.run_id), String(input.selection_ref));
    const spec = readStrategySpec(db, parsed.strategyId);
    const predicted = decodePointer(parsed.selection, spec.probability_field as string);
    if (typeof predicted !== "number" || !Number.isFinite(predicted) || predicted < 0 || predicted > 1) fail(`R17 selected observation probability pointer is invalid: ${spec.probability_field}`);
    const predictedFixed = probabilityFixed(predicted);
    let calibration: string | null = null; let calibrationReason: string | null = null;
    if (input.outcome === "win" || input.outcome === "loss") {
      const p = BigInt(predictedFixed.replace(".", "")); const actual = input.outcome === "win" ? SCALE : 0n; const delta = p - actual; calibration = roundedFixed(delta * delta, SCALE * SCALE); }
    else calibrationReason = "non_decisive_outcome";
    let clv: string | null = null; let clvReason: string | null = null;
    if (close === null) clvReason = "closing_price_unavailable";
    else { const o = decimalParts(odds); const c = decimalParts(close); clv = roundedFixed((o.units * c.scale - c.units * o.scale), c.units * o.scale); }
    const grade = { run_id: String(input.run_id), selection_ref: String(input.selection_ref), external_ref: externalRef, ticket_id: externalRef, strategy_id: parsed.strategyId, run_result_artifact_id: parsed.resultId, settled_at: settledAt, predicted_probability: predictedFixed, outcome: input.outcome, decimal_odds: odds, closing_decimal_odds: close, stake, payout, calibration, calibration_reason: calibrationReason, clv, clv_reason: clvReason, formula_version: "qf.outcome.formulas.v1" };
    const bytes = new TextEncoder().encode(r17CanonicalJson(grade)); const artifactId = contentHash(bytes); const root = resolveArtifactRoot().path; const dir = join(root, "outcome-grades"); mkdirSync(dir, { recursive: true }); const path = join(dir, `${artifactId}.json`); if (!existsSync(path)) writeFileSync(path, bytes, { flag: "wx" });
    db.query("INSERT INTO ticket (id, created_at, origin, kind, external_ref, placed_at, legs, combined_price, stake, payout, correlation_note, grade) VALUES (?, ?, 'operator_supplied', 'single', ?, ?, ?, ?, ?, ?, ?, ?)").run(externalRef, new Date().toISOString(), externalRef, settledAt, JSON.stringify([{ id: String(input.selection_ref), decimal_odds: odds }]), Number(odds), Number(stake), payout === null ? null : Number(payout), "operator settlement for forward research selection", input.outcome);
    db.query("INSERT INTO artifact (id, created_at, kind, content_hash, storage_ref) VALUES (?, ?, 'result_set', ?, ?)").run(artifactId, new Date().toISOString(), artifactId, path);
    link(db, "grades_ticket", artifactId, externalRef); link(db, "grades_run", artifactId, String(input.run_id));
    if (process.env.QF_R17_FALSIFY_GRADES_STRATEGY !== "1") link(db, "grades_strategy", artifactId, parsed.strategyId);
    link(db, "grades_run_result", artifactId, parsed.resultId);
    appendEvent(db, { type: "artifact.published", object_type: "artifact", object_id: artifactId, payload: { command: cmd.action, contract: "qf.outcome.grade.v1", span_id: trace.span_id }, trace_id: trace.trace_id });
    appendEvent(db, { type: "ticket.observed", object_type: "ticket", object_id: externalRef, payload: { command: cmd.action, external_ref: externalRef, outcome: input.outcome, span_id: trace.span_id }, trace_id: trace.trace_id });
    return { existing: null, old: grade, artifactId };
  });
  const result = tx();
  if (result.existing) return { kind: "object", object_type: "artifact", object_id: result.existing.artifactId, from: "graded", to: "graded", event: "ticket.observed", state: result.old };
  return { kind: "object", object_type: "artifact", object_id: String((result as { artifactId: string }).artifactId), from: "none", to: "graded", event: "ticket.observed", state: result.old };
}
