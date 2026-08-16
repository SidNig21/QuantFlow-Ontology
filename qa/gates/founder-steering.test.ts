import { expect, test } from "bun:test";
import { normalizeHistoryFacts, normalizeVisibleTaskSessionLinkFacts } from "./founder-steering.ts";

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

test("founder steering normalizes visible Task/session/link facts for exact reopen comparison", () => {
  expect(normalizeVisibleTaskSessionLinkFacts([
    {
      session_id: "worker-2",
      definition_id: "hermes-worker-2",
      task_id: "task-1",
      title: "Fixture",
      status: "CANCELLED",
      description: "Current instruction",
      delegated_by_session_id: "director-1",
      assigned_to_session_id: "worker-2",
      history: [],
    },
    {
      session_id: "director-1",
      definition_id: "hermes-research-director",
      task_id: null,
      history: [],
    },
  ])).toMatchObject([
    { session_id: "director-1", task_id: null },
    {
      session_id: "worker-2",
      task_id: "task-1",
      delegated_by_session_id: "director-1",
      assigned_to_session_id: "worker-2",
    },
  ]);
});
