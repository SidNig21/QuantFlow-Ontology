import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  acquireUfcHistoricalEvidence,
  UFC_HISTORICAL_EVIDENCE_TOOL_ID,
  UFC_HISTORICAL_EVIDENCE_VERSION,
  UFC_HISTORY_AGGREGATE_LIMIT_BYTES,
  UFC_HISTORY_OPERATION_TIMEOUT_MS,
  UFC_HISTORY_REQUEST_TIMEOUT_MS,
  UFC_HISTORY_SOURCE_LIMIT_BYTES,
  type HistoricalMarketContext,
  type HistoryTransport,
} from "qf-ufc-history";
import { contentHash } from "qf-kernel/portable";
import { getArtifactRoot, kernelExecute, kernelGetLinks, kernelGetObject } from "./kernel";
import { listBovadaMarketDeskRows } from "./market-desk";

export const RESEARCH_LAB_TOOL_ID = "research-lab";
export const RESEARCH_LAB_VERSION = "qf-research-lab-v1";

const HISTORY_CAPABILITY = Object.freeze({
  tool_id: UFC_HISTORICAL_EVIDENCE_TOOL_ID,
  name: "UFC Historical Evidence",
  summary: "Add exact pre-event results from two official UFC athlete pages to the selected investigation.",
  capability_class: "data" as const,
  implementation_version: UFC_HISTORICAL_EVIDENCE_VERSION,
});
const LAB_CAPABILITY = Object.freeze({
  tool_id: RESEARCH_LAB_TOOL_ID,
  name: "Research Lab",
  summary: "Run one transparent two-way market/history baseline without selecting a Technique.",
  capability_class: "tool" as const,
  implementation_version: RESEARCH_LAB_VERSION,
});

const activeOperations = new Set<AbortController>();
const trace = (action: string) => ({ trace_id: `w1-02:${crypto.randomUUID()}`, span_id: `w1-02:${action}:${crypto.randomUUID()}` });

export function ensureEvidenceComputationCapabilities(): Record<string, unknown>[] {
  for (const capability of [HISTORY_CAPABILITY, LAB_CAPABILITY]) kernelExecute("register_tool", capability, trace("register_tool"));
  return [UFC_HISTORICAL_EVIDENCE_TOOL_ID, RESEARCH_LAB_TOOL_ID].map((id) => {
    const row = kernelGetObject("tool", id);
    if (!row) throw new Error(`Capability registration did not persist: ${id}`);
    return row;
  });
}

export function getEvidenceComputationCapabilities(): Record<string, unknown>[] {
  const rows = ensureEvidenceComputationCapabilities();
  return rows.map((row) => row.id === UFC_HISTORICAL_EVIDENCE_TOOL_ID ? {
    ...row, readiness: "ready", readiness_detail: `Ready for exactly two official UFC athlete pages; ${UFC_HISTORY_REQUEST_TIMEOUT_MS / 1000}s and ${UFC_HISTORY_SOURCE_LIMIT_BYTES / 1024 / 1024} MiB each, ${UFC_HISTORY_OPERATION_TIMEOUT_MS / 1000}s and ${UFC_HISTORY_AGGREGATE_LIMIT_BYTES / 1024 / 1024} MiB total.`,
  } : { ...row, readiness: "ready", readiness_detail: "Ready for the versioned integer-fixed-point two_way_market_history_baseline calculation." });
}

function exactMarketContext(missionId: string, quoteId: string): HistoricalMarketContext {
  const investigates = kernelGetLinks(missionId, { kind: "investigates" }).filter((link) => link.from_id === missionId);
  if (investigates.length !== 1 || investigates[0]!.to_id !== quoteId) throw new Error("Selected Quote is no longer the Mission's exact investigated observation; select or refresh explicitly.");
  const row = listBovadaMarketDeskRows().find((candidate) => candidate.quote_id === quoteId);
  if (!row) throw new Error("The exact selected Bovada Quote and its market lineage are unavailable.");
  const selections = Array.isArray(row.selections) ? row.selections : [];
  if (selections.length !== 2) throw new Error("The selected Quote does not contain exactly two ordered competitor and selection identities.");
  return {
    quote_id: quoteId,
    quote_observed_at: String(row.observed_at),
    quote_source_hash: String(row.source_hash),
    market_event_id: String(row.market_event_id),
    event_cutoff: String(row.starts_at),
    competitors: selections.map((selection) => ({ competitor_id: String(selection.competitor_id), selection_id: String(selection.selection_id), label: String(selection.label) })),
    selection_ids: selections.map((selection) => String(selection.selection_id)),
  };
}

function durableJson(hash: string, bytes: Uint8Array): string {
  const directory = join(getArtifactRoot(), "historical-evidence");
  mkdirSync(directory, { recursive: true });
  const path = join(directory, `${hash}.json`);
  if (existsSync(path)) {
    const existing = new Uint8Array(readFileSync(path));
    if (contentHash(existing) !== hash || existing.length !== bytes.length || existing.some((byte, index) => byte !== bytes[index])) throw new Error("Historical evidence content-addressed file conflict");
  } else writeFileSync(path, bytes, { flag: "wx" });
  return path;
}

export type EvidenceCalculationReceipt = { mission_id: string; quote_id: string; dataset_id: string; dataset_hash: string; run_id: string; result_artifact_id: string; output: Record<string, unknown> };

export async function addEvidenceAndCalculate(input: { mission_id: string; quote_id: string; transport?: HistoryTransport; signal?: AbortSignal; now?: () => Date }): Promise<EvidenceCalculationReceipt> {
  ensureEvidenceComputationCapabilities();
  const context = exactMarketContext(input.mission_id, input.quote_id);
  const controller = new AbortController(); activeOperations.add(controller);
  let acquired: Awaited<ReturnType<typeof acquireUfcHistoricalEvidence>>;
  try {
    acquired = await acquireUfcHistoricalEvidence({ market_context: context, transport: input.transport, signal: input.signal ? AbortSignal.any([controller.signal, input.signal]) : controller.signal, now: input.now });
  } finally { controller.abort(); activeOperations.delete(controller); }
  const hash = contentHash(acquired.bytes);
  const path = durableJson(hash, acquired.bytes);
  const artifact = kernelExecute("publish_artifact", { kind: "result_set", content_hash: hash, storage_ref: path, bytes: acquired.bytes }, trace("publish_artifact")) as { object_id?: unknown };
  if (artifact.object_id !== hash) throw new Error("Historical evidence Artifact identity did not match its bytes");
  const dataset = kernelExecute("register_dataset_version", { kind: "results", purpose: "evidence", artifact_id: hash, content_hash: hash, as_of: acquired.payload.observations && Array.isArray(acquired.payload.observations) ? String((acquired.payload.observations[0] as Record<string, unknown>)?.observed_at ?? "") : "", coverage: acquired.coverage }, trace("register_dataset_version")) as { object_id?: unknown };
  const datasetId = String(dataset.object_id ?? "");
  if (!datasetId) throw new Error("Historical evidence Dataset registration returned no identity");
  const runId = `analysis:${crypto.randomUUID()}`;
  const run = kernelExecute("execute_deterministic_run", {
    run_id: runId, dataset_id: datasetId, mission_id: input.mission_id, quote_id: input.quote_id, tool_id: RESEARCH_LAB_TOOL_ID,
    calculation: { contract: "qf.calculation.v1", operation: "two_way_market_history_baseline", version: 1, formula_version: 1, implementation_version: "qf-two-way-history-v1" }, params: {},
  }, trace("execute_deterministic_run")) as { state?: Record<string, unknown> };
  const resultId = String(run.state?.result_artifact_id ?? "");
  if (!resultId) throw new Error("Transparent calculation produced no result Artifact");
  return { mission_id: input.mission_id, quote_id: input.quote_id, dataset_id: datasetId, dataset_hash: hash, run_id: runId, result_artifact_id: resultId, output: (run.state?.output as Record<string, unknown>) ?? {} };
}

export function cancelEvidenceComputation(): void { for (const controller of activeOperations) controller.abort(); activeOperations.clear(); }
