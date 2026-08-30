import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { deliveryAckObserved, normalizeHistoryFacts, normalizeVisibleTaskSessionLinkFacts, steeringDeliveryObserved } from "./founder-steering.ts";

test("founder steering accepts an exact acknowledgement first observed at the timeout boundary", () => {
	const expected = "QF_SYNTHETIC delivery_ack role=worker task_id=task-1100ccac-66c4-429f-9265-b2da46a68ef9";
	expect(deliveryAckObserved("", expected)).toBe(false);
	expect(deliveryAckObserved(`\u001b[2K\r${expected}\r\n`, expected)).toBe(true);
	expect(deliveryAckObserved(`${expected}\r\n`, expected, 2)).toBe(false);
	expect(deliveryAckObserved(`${expected}\r\n${expected}\r\n`, expected, 2)).toBe(true);
	const gate = readFileSync(join(import.meta.dir, "founder-steering.ts"), "utf8");
	expect(gate).toContain("if (deliveryAckObserved(finalOutput, expected, count)) return;");
});

test("founder steering requires one exact causal Kernel receipt and a fresh role marker", () => {
  const binding = { acceptedEventId: "accepted-clarify", taskId: "task-1", targetSessionId: "worker-1", expectedRole: "worker" };
  const receipt = { accepted_event_id: "accepted-clarify", task_id: "task-1", target_session_id: "worker-1", outcome: "delivered" };
  const stale = "QF_SYNTHETIC delivery_ack role=worker task_id=task-1";
  const fresh = `${stale}\r\nQF_SYNTHETIC delivery_ack role=worker task_id=task-1`;

  expect(steeringDeliveryObserved([receipt], binding, fresh, 1)).toBe(true);
  expect(steeringDeliveryObserved([{ ...receipt, accepted_event_id: "wrong-event" }], binding, fresh, 1)).toBe(false);
  expect(steeringDeliveryObserved([{ ...receipt, task_id: "wrong-task" }], binding, fresh, 1)).toBe(false);
  expect(steeringDeliveryObserved([{ ...receipt, target_session_id: "wrong-worker" }], binding, fresh, 1)).toBe(false);
  expect(steeringDeliveryObserved([{ ...receipt, outcome: "delivery_failed" }], binding, fresh, 1)).toBe(false);
  expect(steeringDeliveryObserved([receipt], binding, stale, 1)).toBe(false);
  expect(steeringDeliveryObserved([receipt], binding, "QF_SYNTHETIC delivery_ack role=critic task_id=task-1", 0)).toBe(false);
  expect(steeringDeliveryObserved([], binding, fresh, 1)).toBe(false);
  expect(steeringDeliveryObserved([receipt, receipt], binding, fresh, 1)).toBe(false);

  const gate = readFileSync(join(import.meta.dir, "founder-steering.ts"), "utf8");
  expect(gate).toContain("if (steeringDeliveryObserved(finalFacts, binding, finalOutput, markerCountBefore)) return;");
});

test("founder steering uses the ordinary form with exact preload Dataset and Technique", () => {
  const gate = readFileSync(join(import.meta.dir, "founder-steering.ts"), "utf8");
  const setup = gate.slice(gate.indexOf("const sample = await window.shellApi.qf.loadSampleResearchDataset()"), gate.indexOf("await waitFor(\"original Task\""));
  expect(setup).toContain("const datasetId = sample?.dataset?.object_id");
  expect(setup).toContain("const strategyId = sample?.technique?.strategy_id");
  expect(gate).toContain("document.querySelector('.dock-technique-version')");
  expect(setup).toContain("form.dataset.r17DatasetId = datasetId");
  expect(setup.match(/form\.requestSubmit\(\)/g)).toHaveLength(1);
  expect(setup).not.toContain("TRY GUIDED RESEARCH");
});

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
