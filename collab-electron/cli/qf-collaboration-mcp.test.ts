import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
// The packaged bridge is deliberately one self-contained JavaScript resource.
// @ts-expect-error JavaScript resource has no declaration file.
import { validateToolArguments } from "./qf-collaboration-mcp.mjs";

test("collaboration bridge rejects missing and malicious extra fields", () => {
  expect(validateToolArguments("send_task", {
    to_role: "worker",
    task: "Read venue-1",
  })).toBeTruthy();
  expect(() => validateToolArguments("send_task", {
    to_role: "worker",
    task: "Read venue-1",
    links: [{ kind: "assigned_to", to_id: "forged" }],
  })).toThrow(/extra field: links/);
  expect(() => validateToolArguments("send_result", {
    task_id: "task-1",
    result: "answer",
    cited_market_ids: ["venue-1"],
  })).toThrow(/read_trajectory_artifact_ids/);
  expect(() => validateToolArguments("send_result", {
    task_id: "task-1",
    result: "answer",
    cited_market_ids: ["venue-1"],
    read_trajectory_artifact_ids: ["read-1"],
    path: "C:\\forged\\result.json",
  })).toThrow(/extra field: path/);
  expect(validateToolArguments("send_result", {
    task_id: "task-1",
    result: "No market evidence is currently available.",
    cited_market_ids: [],
    read_trajectory_artifact_ids: ["read-empty"],
  })).toBeTruthy();
});

test("packaged collaboration bridge has no generic peer-send bypass", () => {
  const source = readFileSync(new URL("./qf-collaboration-mcp.mjs", import.meta.url), "utf8");
  expect(source).not.toContain("qf.peer-bus.send_to_peer");
  expect(source).toContain("qf.collaboration.send_task");
  expect(source).toContain("qf.collaboration.send_result");
});
