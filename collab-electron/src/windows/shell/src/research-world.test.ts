import { describe, expect, test } from "bun:test";
import { resolveResearchWorldEndpointTileId } from "./research-world.js";

const objects = [
  { type: "mission", id: "mission-1" },
  { type: "task", id: "source-task-1" },
  { type: "task", id: "review-task-1" },
  { type: "hypothesis", id: "hypothesis-1" },
  { type: "dataset", id: "dataset-1" },
  { type: "run", id: "run-1" },
  { type: "artifact", id: "result-artifact-1" },
  { type: "evaluation", id: "evaluation-1" },
  { type: "artifact", id: "findings-artifact-1" },
  { type: "artifact", id: "report-artifact-1" },
  { type: "agent_session", id: "director-session-1" },
  { type: "agent_session", id: "executor-session-1" },
  { type: "agent_session", id: "critic-session-1" },
];

const tiles = [
  ...objects
    .filter((object) => object.type !== "agent_session")
    .map((object) => ({
      id: `ontology:${object.type}:${object.id}`,
      type: "research",
      ontologyType: object.type,
      ontologyId: object.id,
    })),
  { id: "session-director", type: "session", sessionId: "director-session-1" },
  { id: "session-executor", type: "session", sessionId: "executor-session-1" },
  { id: "session-critic", type: "session", sessionId: "critic-session-1" },
];

const links = [
  ["belongs_to", "source-task-1", "mission-1"],
  ["assigned_to", "source-task-1", "executor-session-1"],
  ["delegated_by", "source-task-1", "director-session-1"],
  ["delegates_to", "director-session-1", "executor-session-1"],
  ["tests", "run-1", "hypothesis-1"],
  ["uses", "run-1", "dataset-1"],
  ["produces", "run-1", "result-artifact-1"],
  ["evaluated_by", "hypothesis-1", "evaluation-1"],
  ["evaluated_by", "run-1", "evaluation-1"],
  ["evaluated_by", "result-artifact-1", "evaluation-1"],
  ["performed_by", "evaluation-1", "critic-session-1"],
  ["produces", "critic-session-1", "findings-artifact-1"],
  ["gates", "evaluation-1", "report-artifact-1"],
  ["assigned_to", "review-task-1", "critic-session-1"],
  ["delegated_by", "review-task-1", "director-session-1"],
].map(([kind, from_id, to_id]) => ({ kind, from_id, to_id }));

describe("research world renderer seam", () => {
  test("resolves every endpoint in the 13-tile, 15-link world", () => {
    expect(objects).toHaveLength(13);
    expect(tiles).toHaveLength(13);
    expect(links).toHaveLength(15);
    const expectedTileId = (id: string) => {
      const object = objects.find((entry) => entry.id === id);
      if (object.type === "agent_session") return tiles.find((tile) => tile.type !== "research" && tile.sessionId === id).id;
      return `ontology:${object.type}:${id}`;
    };
    const expected = links.map(({ from_id, to_id }) => [
      expectedTileId(from_id),
      expectedTileId(to_id),
    ]);

    expect(links.map(({ from_id, to_id }) => [
      resolveResearchWorldEndpointTileId(objects, tiles, from_id),
      resolveResearchWorldEndpointTileId(objects, tiles, to_id),
    ])).toEqual(expected);
  });

  test("returns null for unknown and ambiguous endpoints", () => {
    expect(resolveResearchWorldEndpointTileId(objects, tiles, "unknown-id")).toBeNull();
    expect(resolveResearchWorldEndpointTileId([
      { type: "mission", id: "duplicate-id" },
      { type: "task", id: "duplicate-id" },
    ], tiles, "duplicate-id")).toBeNull();
    expect(resolveResearchWorldEndpointTileId(objects, [
      ...tiles,
      { id: "duplicate-research", type: "research", ontologyType: "mission", ontologyId: "mission-1" },
    ], "mission-1")).toBeNull();
    expect(resolveResearchWorldEndpointTileId(objects, [
      ...tiles,
      { id: "duplicate-session", type: "term", sessionId: "director-session-1" },
    ], "director-session-1")).toBeNull();
    expect(resolveResearchWorldEndpointTileId([
      { type: "agent_session", id: "research-session-1" },
    ], [{ id: "ontology:agent_session:research-session-1", type: "research", ontologyType: "agent_session", ontologyId: "research-session-1", sessionId: "research-session-1" }], "research-session-1")).toBeNull();
  });

  test("uses projection attributes and never opens a truth store", async () => {
    const source = await Bun.file(new URL("./research-world.js", import.meta.url)).text();
    expect(source).toContain("qfWorldField");
    expect(source).toContain("Show research world");
    const forbidden = new RegExp([
      ["bun", "sqlite"].join(":"),
      ["node", "sqlite"].join(":"),
      "better" + "-sqlite3",
      ["node", "fs"].join(":"),
    ].join("|"));
    expect(source).not.toMatch(forbidden);
  });
});
