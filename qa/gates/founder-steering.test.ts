import { expect, test } from "bun:test";
import { normalizeHistoryFacts } from "./founder-steering.ts";

test("founder steering gate normalizes the eight Kernel/DOM history fields", () => {
  expect(normalizeHistoryFacts([{
    sequence: 4,
    event_id: "event-4",
    kind: "task.clarified",
    task_id: "task-1",
    mode: "clarify",
    text: "Keep μ",
    outcome: "accepted",
    target_session_id: "worker-1",
  }])).toEqual([[4, "event-4", "task.clarified", "task-1", "clarify", "Keep μ", "accepted", "worker-1"]]);
});
