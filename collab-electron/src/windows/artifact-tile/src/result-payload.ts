export type CollaborationResultPayload = {
  result: string;
  citedMarketIds: string[];
  readTrajectoryArtifactIds: string[];
};

export type ResearchReportPayload = {
  claim: string;
  status: string;
  verdict: string;
  confidence: number;
  rationale: string;
  metrics: Record<string, unknown>;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function parseResearchReportPayload(text: string): ResearchReportPayload | null {
  let value: Record<string, unknown> | null = null;
  try { value = record(JSON.parse(text)); } catch { return null; }
  if (value?.contract !== "qf.research.report.v1") return null;
  const hypothesis = record(value.hypothesis);
  const evaluation = record(value.evaluation);
  if (!hypothesis || !evaluation || typeof hypothesis.claim !== "string" ||
      typeof evaluation.verdict !== "string" || typeof evaluation.confidence !== "number" ||
      typeof evaluation.rationale !== "string") return null;
  let metrics = record(evaluation.metrics);
  if (!metrics && typeof evaluation.metrics === "string") {
    try { metrics = record(JSON.parse(evaluation.metrics)); } catch { metrics = null; }
  }
  return {
    claim: hypothesis.claim,
    status: String(hypothesis.status ?? "unknown"),
    verdict: evaluation.verdict,
    confidence: evaluation.confidence,
    rationale: evaluation.rationale,
    metrics: metrics ?? {},
  };
}

export function parseCollaborationResultPayload(
  text: string,
): CollaborationResultPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const value = parsed as Record<string, unknown>;
  if (
    value.contract !== "qf.collaboration.v1" ||
    value.kind !== "result" ||
    typeof value.result !== "string" ||
    value.result.trim().length === 0 ||
    !Array.isArray(value.cited_market_ids) ||
    value.cited_market_ids.some((id) => typeof id !== "string") ||
    !Array.isArray(value.read_trajectory_artifact_ids) ||
    value.read_trajectory_artifact_ids.length === 0 ||
    value.read_trajectory_artifact_ids.some((id) => typeof id !== "string")
  ) return null;
  return {
    result: value.result.trim(),
    citedMarketIds: value.cited_market_ids as string[],
    readTrajectoryArtifactIds: value.read_trajectory_artifact_ids as string[],
  };
}
