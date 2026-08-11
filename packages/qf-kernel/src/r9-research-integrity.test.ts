import { afterEach, describe, expect, test } from "bun:test";
import {
  closeKernel,
  eventCount,
  execute,
  openKernel,
  type KernelDb,
} from "./index.ts";

const trace = { trace_id: "r9-trace", span_id: "r9-span" };
let db: KernelDb;

afterEach(() => closeKernel(db));

function createHypothesis(claim: string) {
  return execute(
    db,
    "create_hypothesis",
    { claim, success_criteria: "A recorded independent evaluation decides the claim." },
    trace,
  );
}

describe("R9 research integrity", () => {
  test("resolution without named evidence writes nothing", () => {
    db = openKernel(":memory:");
    const hypothesis = createHypothesis("Evidence is required.");
    const before = eventCount(db);

    expect(() =>
      execute(
        db,
        "resolve_hypothesis",
        { hypothesis_id: hypothesis.object_id, status: "supported" },
        trace,
      ),
    ).toThrow();
    expect(eventCount(db)).toBe(before);
    expect(
      db.query(`SELECT status FROM hypothesis WHERE id = ?`).get(hypothesis.object_id),
    ).toEqual({ status: "open" });
  });

  test("a report without an independent supporting Evaluation writes nothing", () => {
    db = openKernel(":memory:");
    createHypothesis("Reports require an independent gate.");
    const before = eventCount(db);

    expect(() =>
      execute(
        db,
        "publish_artifact",
        {
          kind: "report",
          bytes: new TextEncoder().encode("blocked report"),
          storage_ref: "file:///r9/blocked.txt",
        },
        trace,
      ),
    ).toThrow(/requires evaluation_id/);
    expect(eventCount(db)).toBe(before);
    expect(
      db.query(`SELECT COUNT(*) AS count FROM artifact WHERE kind = 'report'`).get(),
    ).toEqual({ count: 0 });
  });
});
