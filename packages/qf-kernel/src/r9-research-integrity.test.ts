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

afterEach(() => {
  if (db) closeKernel(db);
});

function createHypothesis(claim: string) {
  return execute(
    db,
    "create_hypothesis",
    { claim, success_criteria: "A recorded evaluation decides the claim." },
    trace,
  );
}

function recordEvaluation(
  hypothesisId: string | undefined,
  verdict: "supports" | "rejects" | "inconclusive",
) {
  return execute(
    db,
    "record_evaluation",
    {
      metrics: { observed: true },
      verdict,
      confidence: 0.8,
      rationale: `${verdict} based on recorded evidence`,
      ...(hypothesisId ? { hypothesis_id: hypothesisId } : {}),
    },
    trace,
  );
}

describe("R9 research integrity", () => {
  test("matching Evaluation resolves a hypothesis and gates a report", () => {
    db = openKernel(":memory:");
    const hypothesis = createHypothesis("The seeded edge is positive.");
    const evaluation = recordEvaluation(hypothesis.object_id, "supports");

    const resolution = execute(
      db,
      "resolve_hypothesis",
      {
        hypothesis_id: hypothesis.object_id,
        evaluation_id: evaluation.object_id,
        status: "supported",
      },
      trace,
    );
    const report = execute(
      db,
      "publish_artifact",
      {
        kind: "report",
        bytes: new TextEncoder().encode("supported research report"),
        storage_ref: "file:///r9/report.txt",
        evaluation_id: evaluation.object_id,
      },
      trace,
    );

    expect(resolution.to).toBe("supported");
    expect(
      db
        .query(`SELECT from_id FROM links WHERE kind = 'gates' AND to_id = ?`)
        .get(report.object_id),
    ).toEqual({ from_id: evaluation.object_id });
  });

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

  test("wrong hypothesis or verdict cannot authorize resolution", () => {
    db = openKernel(":memory:");
    const first = createHypothesis("First claim.");
    const second = createHypothesis("Second claim.");
    const evaluation = recordEvaluation(first.object_id, "rejects");
    const before = eventCount(db);

    expect(() =>
      execute(
        db,
        "resolve_hypothesis",
        {
          hypothesis_id: second.object_id,
          evaluation_id: evaluation.object_id,
          status: "rejected",
        },
        trace,
      ),
    ).toThrow(/requested hypothesis/);
    expect(() =>
      execute(
        db,
        "resolve_hypothesis",
        {
          hypothesis_id: first.object_id,
          evaluation_id: evaluation.object_id,
          status: "supported",
        },
        trace,
      ),
    ).toThrow(/requires Evaluation verdict supports/);

    expect(eventCount(db)).toBe(before);
  });

  test("missing, rejecting, or hypothesis-free evidence cannot publish a report", () => {
    db = openKernel(":memory:");
    const hypothesis = createHypothesis("Only supporting evidence publishes.");
    const rejecting = recordEvaluation(hypothesis.object_id, "rejects");
    const unrelated = recordEvaluation(undefined, "supports");
    const before = eventCount(db);
    const report = (evaluation_id?: string) =>
      execute(
        db,
        "publish_artifact",
        {
          kind: "report",
          bytes: new TextEncoder().encode(`blocked report ${evaluation_id ?? "none"}`),
          storage_ref: "file:///r9/blocked.txt",
          ...(evaluation_id ? { evaluation_id } : {}),
        },
        trace,
      );

    expect(() => report()).toThrow(/requires evaluation_id/);
    expect(() => report(rejecting.object_id)).toThrow(/verdict supports/);
    expect(() => report(unrelated.object_id)).toThrow(/exactly one hypothesis/);

    expect(eventCount(db)).toBe(before);
    expect(
      db.query(`SELECT COUNT(*) AS count FROM artifact WHERE kind = 'report'`).get(),
    ).toEqual({ count: 0 });
  });
});
