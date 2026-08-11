export type CollaborationResultPayload = {
  result: string;
  citedMarketIds: string[];
  readTrajectoryArtifactIds: string[];
};

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
