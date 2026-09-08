import { KernelError } from "./errors.ts";
import type { KernelDb } from "./db.ts";
import { readFileSync } from "node:fs";
import { contentHash } from "./hash.ts";
import { assertDurableOntologyReadReceipt } from "./ontology-read-receipt.ts";
import { isMarketExpressionComparison, MARKET_EXPRESSION_COMPARISON_OPERATION } from "./market-context.ts";

export const DECISION_TOLERANCE = 1e-9;
export type ProbabilityRange = { low: number; central: number; high: number };
export type DecisionSelection = { quote_id: string; instrument_id: string; selection_id: string; market_id: string; label: string; decimal_price: number; observed_at: string; event_cutoff: string; complete_exclusive_set: boolean; probability: ProbabilityRange | { unavailable: string } };
export type DecisionContext = {
  mission_id: string; task_id: string; worker_session_id: string; hypothesis_id: string; hypothesis: string;
  dataset_id: string; run_id: string; inputs: Array<{ id: string; hash: string }>;
  method: { id: string; version: string; hash: string; probability_producing: boolean };
  selections: DecisionSelection[];
  evidence_facts: unknown[];
};
export function decisionComparisonRows(context: DecisionContext): Row[] {
  return context.selections.map(({ complete_exclusive_set, ...row }) => {
    const group = context.selections.filter((peer) => peer.market_id === row.market_id);
    const p = "unavailable" in row.probability ? null : row.probability;
    return { ...row, raw_break_even: 1 / row.decimal_price, no_vig: group.length > 1 && group.every((peer) => peer.complete_exclusive_set) ? (1 / row.decimal_price) / group.reduce((sum, peer) => sum + 1 / peer.decimal_price, 0) : null, minimum_decimal_price: p && p.low > 0 ? 1 / p.low : null, conservative_margin: p ? p.low - 1 / row.decimal_price : null };
  });
}
export function readDecisionArtifact(db: KernelDb, id: string): unknown {
  const row = db.query("SELECT content_hash, storage_ref FROM artifact WHERE id = ?").get(id) as { content_hash: string; storage_ref: string } | null;
  if (!row || row.content_hash !== id) throw new KernelError("decision artifact identity unavailable");
  const bytes = new Uint8Array(readFileSync(row.storage_ref));
  if (contentHash(bytes) !== id) throw new KernelError("decision artifact hash disagreement");
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Build the finite comparison from one complete source response, never from participant estimates. */
export function buildDecisionContext(db: KernelDb, input: { mission_id: string; task_id: string; worker_session_id: string; hypothesis_id: string; dataset_id: string; dataset_hash: string; run_id: string; quote_id: string; method_hash: string }, options: { allowAgedQuote?: boolean } = {}): DecisionContext {
  const outgoing = (id: string, kind: string) => (db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = ?").all(id, kind) as Array<{ to_id: string }>).map((row) => row.to_id);
  equal(outgoing(input.task_id, "belongs_to"), [input.mission_id], "decision Task Mission");
  equal(outgoing(input.task_id, "assigned_to"), [input.worker_session_id], "decision worker");
  equal(outgoing(input.mission_id, "investigates"), [input.quote_id], "decision investigated Quote");
  const hypothesis = db.query("SELECT claim, status FROM hypothesis WHERE id = ?").get(input.hypothesis_id) as { claim: string; status: string } | null;
  if (!hypothesis || !hypothesis.claim.trim() || hypothesis.status !== "open") throw new KernelError("decision requires the exact open Hypothesis");
  const runExists = db.query("SELECT id FROM run WHERE id = ?").get(input.run_id);
  if (runExists) {
    equal(outgoing(input.run_id, "belongs_to"), [input.mission_id], "decision Run Mission");
    equal(outgoing(input.run_id, "tests"), [input.hypothesis_id], "decision Run Hypothesis");
  }
  const quote = db.query("SELECT coverage, data_ref FROM quote WHERE id = ?").get(input.quote_id) as { coverage: string; data_ref: string } | null;
  if (!quote) throw new KernelError("decision Quote unavailable");
  const coverage = JSON.parse(quote.coverage) as Row;
  const menu = object(coverage.market_menu, "complete market menu");
  const source = readDecisionArtifact(db, quote.data_ref);
  if (!Array.isArray(source)) throw new KernelError("market menu source must be the event-list response");
  const events = source.flatMap((coupon) => { const row = object(coupon, "coupon"); return Array.isArray(row.events) ? row.events : []; }).filter((event) => object(event, "event").id === menu.provider_event_id);
  if (events.length !== 1) throw new KernelError("market menu exact event missing or duplicated");
  const event = object(events[0], "event");
  const cutoff = new Date(Number(event.startTime)).toISOString();
  if (event.live !== false || event.status !== "U" || Date.now() >= Date.parse(cutoff)) throw new KernelError("decision requires pre-event source");
  const groups = event.displayGroups;
  if (!Array.isArray(groups)) throw new KernelError("market menu display groups missing");
  const markets = groups.flatMap((group) => { const row = object(group, "display group"); if (!Array.isArray(row.markets)) throw new KernelError("market menu incomplete"); return row.markets.map((value) => object(value, "market")); });
  if (event.numMarkets !== markets.length || new Set(markets.map((row) => row.id)).size !== markets.length) throw new KernelError("market_menu_incomplete");
  const quotes = db.query("SELECT q.id, q.coverage, l.to_id AS instrument_id FROM quote q JOIN links l ON l.from_id=q.id AND l.kind='quotes' WHERE q.data_ref=?").all(quote.data_ref) as Array<{ id: string; coverage: string; instrument_id: string }>;
  const selections: DecisionSelection[] = [];
  for (const market of markets) {
    const period = object(market.period, "market period");
    if (market.status !== "O" || period.live !== false || !Array.isArray(market.outcomes) || !market.outcomes.length) throw new KernelError("market menu contains closed selections");
    const peers = quotes.filter((row) => { const data = JSON.parse(row.coverage); return data.provider_event_id === event.id && data.provider_market_id === market.id && data.observed_at === coverage.observed_at; });
    if (peers.length !== 1) throw new KernelError("decision requires one exact same-time Quote per menu market");
    const peer = peers[0]!; const data = JSON.parse(peer.coverage) as Row;
    const age = Date.now() - Date.parse(String(data.observed_at));
    if (!Number.isFinite(age) || age < -60000 || (!options.allowAgedQuote && age > 15 * 60 * 1000)) throw new KernelError("decision Quote is stale");
    const newer = db.query("SELECT q.coverage FROM quote q JOIN links l ON l.from_id=q.id AND l.kind='quotes' WHERE l.to_id=? AND q.id<>?").all(peer.instrument_id, peer.id) as Array<{ coverage: string }>;
    if (newer.some((row) => Date.parse(String(JSON.parse(row.coverage).observed_at)) > Date.parse(String(data.observed_at)))) throw new KernelError("decision Quote is superseded");
    const outcomes = market.outcomes.map((value) => object(value, "outcome"));
    const complete = outcomes.length === 2 && ((market.key === "2W-12" && market.description === "Fight Winner") || (market.key === "2W-OU" && outcomes.map((row) => row.type).sort().join() === "O,U" && object(outcomes[0]!.price, "price").handicap === object(outcomes[1]!.price, "price").handicap));
    if (!Array.isArray(data.selections) || data.selections.length !== outcomes.length) throw new KernelError("Quote omitted an offered selection");
    for (const [index, outcome] of outcomes.entries()) {
      const price = object(outcome.price, "price"); const stored = object(data.selections[index], "Quote selection");
      if (outcome.status !== "O" || stored.selection_id !== outcome.id || stored.label !== outcome.description || Number(stored.decimal) !== Number(price.decimal)) throw new KernelError("Quote selection differs from source bytes");
      selections.push({ quote_id: peer.id, instrument_id: peer.instrument_id, market_id: String(market.id), selection_id: String(outcome.id), label: String(outcome.description), decimal_price: Number(price.decimal), observed_at: String(data.observed_at), event_cutoff: cutoff, complete_exclusive_set: complete, probability: { unavailable: "The two official athlete pages provide descriptive aggregates and sparse bout history, with no validated matchup probability or submission-path uncertainty method." } });
    }
  }
  if (new Set(selections.map((row) => row.selection_id)).size !== selections.length) throw new KernelError("duplicate decision selection identity");
  return { mission_id: input.mission_id, task_id: input.task_id, worker_session_id: input.worker_session_id, hypothesis_id: input.hypothesis_id, hypothesis: hypothesis.claim, dataset_id: input.dataset_id, run_id: input.run_id,
    inputs: [{ id: quote.data_ref, hash: quote.data_ref }, { id: input.dataset_hash, hash: input.dataset_hash }, { id: input.method_hash, hash: input.method_hash }],
    method: { id: MARKET_EXPRESSION_COMPARISON_OPERATION, version: "1", hash: input.method_hash, probability_producing: false }, selections, evidence_facts: object(readDecisionArtifact(db, input.dataset_hash), "Dataset evidence").observations as unknown[] };
}
type Row = Record<string, unknown>;
function object(value: unknown, label: string): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new KernelError(`${label} must be an object`);
  return value as Row;
}
function keys(row: Row, allowed: string[], label: string): void {
  if (Object.keys(row).length !== allowed.length || Object.keys(row).some((key) => !allowed.includes(key))) throw new KernelError(`${label} has missing or foreign fields`);
}
function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new KernelError(`${label} requires a nonempty reason`);
  return value;
}
function equal(actual: unknown, expected: unknown, label: string): void {
  const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`).join(",")}}` : String(JSON.stringify(value));
  if (canonical(actual) !== canonical(expected)) throw new KernelError(`${label} disagrees with exact input or method output`);
}

export function validateDecisionWorkerArtifact(db: KernelDb, runId: string, artifactId: string): Row | null {
  const run = db.query("SELECT params FROM run WHERE id=?").get(runId) as { params: string } | null;
  if (!run) throw new KernelError("decision Run missing");
  const params = JSON.parse(run.params) as Row;
  if (!isMarketExpressionComparison(params.operation, params.implementation_version)) return null;
  const context = object(params.decision_context, "decision context") as unknown as DecisionContext;
  const rebuilt = buildDecisionContext(db, { mission_id: context.mission_id, task_id: context.task_id, worker_session_id: context.worker_session_id, hypothesis_id: context.hypothesis_id, dataset_id: context.dataset_id, dataset_hash: String(params.dataset_content_hash), run_id: runId, quote_id: String(params.quote_id), method_hash: context.method.hash }, { allowAgedQuote: true });
  equal(context, rebuilt, "current decision context");
  const trajectory = object(readDecisionArtifact(db, artifactId), "worker trajectory");
  equal(trajectory.task_id, context.task_id, "worker trajectory Task"); equal(trajectory.from_session_id, context.worker_session_id, "worker trajectory session");
  const decision = validateMarketDecision(JSON.parse(text(trajectory.result, "worker result")), context);
  const reads = db.query("SELECT to_id FROM links WHERE from_id=? AND kind='derived_from'").all(artifactId) as Array<{ to_id: string }>;
  const expected = new Set([`qf_hypothesis_get:${context.hypothesis_id}`, `qf_run_get:${runId}`, `qf_dataset_get:${context.dataset_id}`, ...context.inputs.map((row) => `qf_artifact_get:${row.id}`), `qf_artifact_get:${String(params.result_artifact_id)}`, ...context.selections.map((row) => `qf_quote_get:${row.quote_id}`)]);
  const observed = new Set<string>();
  for (const read of reads) {
    assertDurableOntologyReadReceipt(db, read.to_id, context.worker_session_id);
    const receipt = object(readDecisionArtifact(db, read.to_id), "read receipt");
    const args = object(receipt.arguments, "read arguments"); keys(args, ["id"], "exact decision read");
    const key = `${receipt.tool}:${args.id}`;
    if (!expected.has(key) || observed.has(key)) throw new KernelError("worker read set contains a foreign or duplicate input");
    observed.add(key);
  }
  if (observed.size !== expected.size) throw new KernelError("worker did not durably read the complete exact input set");
  return decision;
}
function range(value: unknown): ProbabilityRange {
  const row = object(value, "probability"); keys(row, ["low", "central", "high"], "probability");
  const { low, central, high } = row;
  if (typeof low !== "number" || typeof central !== "number" || typeof high !== "number" || !Number.isFinite(low + central + high) || low < 0 || low > central || central > high || high > 1) throw new KernelError("probability range must satisfy 0 <= low <= central <= high <= 1");
  return { low, central, high };
}

/** Validate a participant interpretation against exact Kernel-derived inputs and reproducible method output. */
export function validateMarketDecision(value: unknown, context: DecisionContext): Row {
  const decision = object(value, "market decision");
  keys(decision, ["contract", "mission_id", "task_id", "worker_session_id", "hypothesis_id", "hypothesis", "dataset_id", "run_id", "inputs", "method", "comparisons", "research_assessment", "classification", "selection_id", "selection_reason", "change_condition", "rationale", "evidence_refs", "evidence_facts", "limitations", "invalidation", "provenance"], "market decision");
  equal(decision.contract, "qf.market.decision.v1", "decision contract");
  equal(decision.evidence_facts, context.evidence_facts, "exact source evidence facts");
  for (const key of ["mission_id", "task_id", "worker_session_id", "hypothesis_id", "hypothesis", "dataset_id", "run_id", "inputs", "method"] as const) equal(decision[key], context[key], key);
  if (!Array.isArray(decision.comparisons) || decision.comparisons.length !== context.selections.length || !context.selections.length) throw new KernelError("decision must compare every offered selection exactly once in order");
  const refs = decision.evidence_refs;
  if (!Array.isArray(refs) || !refs.length || new Set(refs).size !== refs.length || refs.some((id) => !context.inputs.some((input) => input.id === id))) throw new KernelError("decision contains missing or foreign evidence references");
  for (const key of ["selection_reason", "change_condition", "rationale", "limitations", "invalidation"] as const) text(decision[key], key);
  const provenance = object(decision.provenance, "provenance");
  keys(provenance, ["provider", "model", "runtime"], "provenance");
  for (const key of Object.keys(provenance)) text(provenance[key], key);
  const groups = new Map<string, Array<{ selection: DecisionSelection; probability: ProbabilityRange | null }>>();
  const margins: Array<{ id: string; margin: number }> = [];
  for (const [index, expected] of context.selections.entries()) {
    const row = object(decision.comparisons[index], `comparison ${index}`);
    keys(row, ["quote_id", "instrument_id", "selection_id", "market_id", "label", "decimal_price", "observed_at", "event_cutoff", "probability", "raw_break_even", "no_vig", "minimum_decimal_price", "conservative_margin"], `comparison ${index}`);
    for (const key of ["quote_id", "instrument_id", "selection_id", "market_id", "label", "decimal_price", "observed_at", "event_cutoff"] as const) equal(row[key], expected[key], `comparison ${index} ${key}`);
    if (!Number.isFinite(expected.decimal_price) || expected.decimal_price <= 1) throw new KernelError("invalid offered price");
    equal(row.raw_break_even, 1 / expected.decimal_price, "raw break-even");
    equal(row.probability, expected.probability, "probability method provenance");
    let p: ProbabilityRange | null = null;
    if ("unavailable" in expected.probability) {
      text(expected.probability.unavailable, "probability unavailable");
      equal(row.minimum_decimal_price, null, "unavailable price threshold"); equal(row.conservative_margin, null, "unavailable margin");
    } else {
      if (!context.method.probability_producing) throw new KernelError("descriptive method cannot produce probability");
      p = range(row.probability);
      equal(row.minimum_decimal_price, p.low > 0 ? 1 / p.low : null, "minimum decimal price");
      equal(row.conservative_margin, p.low - 1 / expected.decimal_price, "conservative margin");
      margins.push({ id: expected.selection_id, margin: p.low - 1 / expected.decimal_price });
    }
    const group = groups.get(expected.market_id) ?? []; group.push({ selection: expected, probability: p }); groups.set(expected.market_id, group);
    const peers = context.selections.filter((selection) => selection.market_id === expected.market_id);
    const noVig = peers.length > 1 && peers.every((selection) => selection.complete_exclusive_set) ? (1 / expected.decimal_price) / peers.reduce((sum, selection) => sum + 1 / selection.decimal_price, 0) : null;
    equal(row.no_vig, noVig, "complete exclusive no-vig market");
  }
  for (const group of groups.values()) {
    if (!group.every((entry) => entry.selection.complete_exclusive_set) || !group.some((entry) => entry.probability)) continue;
    if (group.some((entry) => !entry.probability)) throw new KernelError("complete market has incomplete probability method outputs");
    const total = (key: keyof ProbabilityRange) => group.reduce((sum, entry) => sum + entry.probability![key], 0);
    if (Math.abs(total("central") - 1) > DECISION_TOLERANCE || total("low") > 1 + DECISION_TOLERANCE || total("high") < 1 - DECISION_TOLERANCE) throw new KernelError("market probability ranges have no coherent total");
  }
  if (!["CANDIDATE", "WATCH", "PASS"].includes(String(decision.classification))) throw new KernelError("invalid decision classification");
  if (!["SUPPORTED", "CHALLENGED", "INCONCLUSIVE", "INSUFFICIENT_EVIDENCE"].includes(String(decision.research_assessment))) throw new KernelError("invalid research assessment");
  if (decision.classification === "CANDIDATE") {
    if (decision.research_assessment !== "SUPPORTED") throw new KernelError("CANDIDATE requires a supported research assessment");
    const selected = margins.find((row) => row.id === decision.selection_id);
    if (!selected || selected.margin <= 0 || margins.some((row) => row.margin > selected.margin)) throw new KernelError("CANDIDATE requires greatest positive conservative supported margin");
  } else if (decision.selection_id !== null && !context.selections.some((row) => row.selection_id === decision.selection_id)) throw new KernelError("decision selects an unavailable expression");
  return decision;
}
