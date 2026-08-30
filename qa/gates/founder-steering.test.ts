import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeHistoryFacts, normalizeVisibleTaskSessionLinkFacts } from "./founder-steering.ts";

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
