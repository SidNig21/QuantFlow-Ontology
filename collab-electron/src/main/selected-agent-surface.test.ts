import { expect, test } from "bun:test";
import { clearSelectedAgentSurface, selectAgentSurface, selectedDirectorForTask } from "./selected-agent-surface";

const live = new Set(["director"]);
const authority = { isLive: (id: string) => live.has(id), roleFor: (id: string) => id === "director" ? "orchestrator" : "worker" };

test("current visible Director selection authorizes its exact tile only", () => {
  selectAgentSurface(1, { tileId: "tile-director", sessionId: "director" }, authority);
  expect(selectedDirectorForTask(1, "tile-director", authority)).toBe("director");
  expect(() => selectedDirectorForTask(1, "stale-tile", authority)).toThrow(/currently selected Director/);
  clearSelectedAgentSurface(1);
});

test("invisible, stale, stopped, and non-Director surfaces cannot authorize", () => {
  selectAgentSurface(2, { tileId: "tile-worker", sessionId: "worker" }, authority);
  expect(() => selectedDirectorForTask(2, "tile-worker", authority)).toThrow(/currently selected Director/);
  selectAgentSurface(2, { tileId: "tile-director", sessionId: "director" }, authority);
  live.delete("director");
  expect(() => selectedDirectorForTask(2, "tile-director", authority)).toThrow(/live selected Director/);
  live.add("director");
  selectAgentSurface(2, null, authority);
  expect(() => selectedDirectorForTask(2, "tile-director", authority)).toThrow(/currently selected Director/);
});
