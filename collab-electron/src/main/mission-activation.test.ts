import { expect, test } from "bun:test";
import {
  buildMissionActivationInstruction,
  MAX_MISSION_QUESTION_BYTES,
} from "./mission-activation";

test("mission activation is one bounded JSON-safe PTY instruction", () => {
  const instruction = buildMissionActivationInstruction(
    "mission-safe",
    "line one\r\nline two\u001b[31m\u007f\u0085\u009f",
  );
  expect(instruction.endsWith("\r")).toBe(true);
  expect(instruction.slice(0, -1)).not.toContain("\r");
  expect(instruction.slice(0, -1)).not.toContain("\n");
  expect(instruction).not.toContain("\u001b");
  expect(instruction).not.toContain("\u007f");
  expect(instruction).not.toContain("\u0085");
  expect(instruction).not.toContain("\u009f");
  expect(instruction).toContain("\\r\\n");
  expect(instruction).toContain("\\u001b");
  expect(instruction).toContain("\\u007f");
  expect(instruction).toContain("\\u0085");
  expect(instruction).toContain("\\u009f");
  expect(instruction).toContain('"contract":"qf.mission.activation.v1"');
  expect(instruction).toContain("Report missing data or Strategy/Technique coverage honestly.");
  expect(instruction).toContain("qf_agent_definition_query");
  expect(instruction).toContain("select only hermes-worker");
  expect(instruction).toContain("qf_create_agent_session once");
  expect(instruction).toContain("qf_start_agent_session once");
  expect(instruction).toContain("send_task once with to_role=worker");
  expect(instruction).toContain("Task is not assigned until the Kernel-backed send_task call returns a Task id");
  expect(instruction).toContain("Never place a bet or trade.");
});

test("mission activation rejects oversize and invalid ids before bytes exist", () => {
  const oversized = "x".repeat(MAX_MISSION_QUESTION_BYTES + 1);
  expect(() => buildMissionActivationInstruction("mission-safe", oversized)).toThrow(
    /exceeds/,
  );
  expect(() => buildMissionActivationInstruction("bad\r\nid", "safe")).toThrow(
    /id is invalid/,
  );
});
