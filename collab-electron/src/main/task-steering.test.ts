import { describe, expect, test } from "bun:test";
import { normalizeTaskInstruction } from "../../../packages/qf-kernel/src/task-governance.ts";
import { closeKernel, openKernel } from "../../../packages/qf-kernel/src/db-bun.ts";
import { execute } from "../../../packages/qf-kernel/src/execute.ts";

describe("Task steering normalization", () => {
  test("normalizes CRLF and CR to LF without changing founder text", () => {
    expect(normalizeTaskInstruction("one\r\ntwo\rthree")).toBe("one\ntwo\nthree");
  });

  test("preserves exact Unicode and ordinary spacing", () => {
    expect(normalizeTaskInstruction("  Keep μ and spaces  ")).toBe("  Keep μ and spaces  ");
  });

  test("public execute dispatches the Kernel-backed refusal action", () => {
    const db = openKernel(":memory:");
    try {
      const result = execute(
        db,
        "record_task_steering_refusal",
        {
          attempt_id: "attempt-1",
          attempted_action: "clarify",
          task_id: null,
          reason_code: "TASK_NOT_FOUND",
        },
        { trace_id: "trace-1", span_id: "span-1" },
      );
      expect(result.event).toBe("task.steering_refused");
      expect(db.query("SELECT type FROM events WHERE id = ?").get(result.event_id)).toEqual({ type: "task.steering_refused" });
    } finally {
      closeKernel(db);
    }
  });
});
