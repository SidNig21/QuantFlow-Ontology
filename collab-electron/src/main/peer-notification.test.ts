import { expect, test } from "bun:test";
import { formatPeerNotification } from "./peer-notification";

test("only exact peer notification envelopes produce TUI instructions", () => {
  const valid = JSON.stringify({
    contract: "qf.peer-notification.v1",
    task_id: "task-1",
    body: "Read venue-1",
  });
  expect(formatPeerNotification("orchestrator", "task", valid)).toContain("task_id=task-1");
  expect(formatPeerNotification("worker", "result", valid)).toBe(
    "[QuantFlow RESULT for task-1 from worker] Read venue-1",
  );
  for (const malformed of [
    "legacy plaintext task",
    "{",
    JSON.stringify({ contract: "qf.peer-notification.v0", task_id: "task-1", body: "x" }),
    JSON.stringify({ contract: "qf.peer-notification.v1", body: "x" }),
    JSON.stringify({ contract: "qf.peer-notification.v1", task_id: "task-1", body: "x", links: [] }),
  ]) {
    expect(formatPeerNotification("orchestrator", "task", malformed)).toBeNull();
  }
});
