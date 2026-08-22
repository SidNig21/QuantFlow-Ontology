import { describe, expect, test } from "bun:test";
import { execute, openKernel, closeKernel, type KernelDb } from "qf-kernel";
import { getResearchWorldProjection } from "./research-world-projection";

const trace = { trace_id: "research-world-test", span_id: "research-world-test-span" };

function kernel(): KernelDb {
  return openKernel(":memory:");
}

describe("Main research-world projection", () => {
  test("returns exact root errors and honest empty-world facts", () => {
    const db = kernel();
    expect(getResearchWorldProjection(db, { root_type: "mission", root_id: "missing" })).toEqual({
      ok: false, code: "WORLD_ROOT_NOT_FOUND", message: "Research world root not found: missing",
    });
    execute(db, "create_mission", { mission_id: "mission-empty", name: "Empty", objective: "No task yet" }, trace);
    const result = getResearchWorldProjection(db, { root_type: "mission", root_id: "mission-empty" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.world.missing_lineage).toEqual([{ owning_type: "mission", owning_id: "mission-empty", kind: "belongs_to", message: "No linked research Task yet." }]);
    closeKernel(db);
  });

  test("returns a frozen value snapshot with no filesystem path in Artifact receipts", () => {
    const db = kernel();
    execute(db, "create_mission", { mission_id: "mission-snapshot", name: "Snapshot", objective: "Read-only" }, trace);
    const result = getResearchWorldProjection(db, { root_type: "mission", root_id: "mission-snapshot" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.isFrozen(result.world)).toBe(true);
      expect(JSON.stringify(result.world)).not.toContain("storage_ref");
    }
    closeKernel(db);
  });
});
