import { expect, test } from "bun:test";
import { parseCollaborationResultPayload, parseResearchReportPayload } from "./result-payload";

test("parses a cited collaboration result", () => {
  expect(parseCollaborationResultPayload(JSON.stringify({
    contract: "qf.collaboration.v1",
    kind: "result",
    result: "Venue one is strongest.",
    cited_market_ids: ["venue-1"],
    read_trajectory_artifact_ids: ["read-1"],
  }))).toEqual({
    result: "Venue one is strongest.",
    citedMarketIds: ["venue-1"],
    readTrajectoryArtifactIds: ["read-1"],
  });
});

test("parses a Kernel-gated research report", () => {
  expect(parseResearchReportPayload(JSON.stringify({
    contract: "qf.research.report.v1",
    hypothesis: { claim: "Highest edge produced positive ROI", status: "supported" },
    run: { id: "run-1" },
    evaluation: {
      verdict: "supports", confidence: 0.9, rationale: "The metric is positive.",
      metrics: JSON.stringify({ contract: "qf.metrics.v1", roi: "1.000000" }),
    },
  }))).toMatchObject({
    claim: "Highest edge produced positive ROI", verdict: "supports", confidence: 0.9,
    metrics: { roi: "1.000000" },
  });
});

test("parses an honest no-evidence result and rejects unrelated artifacts", () => {
  expect(parseCollaborationResultPayload(JSON.stringify({
    contract: "qf.collaboration.v1",
    kind: "result",
    result: "No market evidence is currently loaded.",
    cited_market_ids: [],
    read_trajectory_artifact_ids: ["read-empty"],
  }))?.citedMarketIds).toEqual([]);
  expect(parseCollaborationResultPayload('{"contract":"other"}')).toBeNull();
});
