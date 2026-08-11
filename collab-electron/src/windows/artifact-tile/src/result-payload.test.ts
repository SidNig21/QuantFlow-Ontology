import { expect, test } from "bun:test";
import { parseCollaborationResultPayload } from "./result-payload";

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
