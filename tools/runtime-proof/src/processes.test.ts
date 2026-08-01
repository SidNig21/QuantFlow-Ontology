import { describe, expect, test } from "bun:test";
import {
  descendantPids,
  parseProcessTable,
  processDelta,
  selectAgentProcesses,
  survivingPids,
} from "./processes.ts";

const TABLE = [
  "100 1 bun test src/proof.test.ts",
  "110 100 /packed/qf-toolloop.aospkg qf-toolloop",
  "111 110 /packed/acp-main.js acp-main",
  "112 111 /usr/bin/helper-for-qf-toolloop",
  "120 1 /packed/qf-toolloop.aospkg qf-toolloop",
  "130 100 unrelated-child",
].join("\n");

describe("PID-scoped process ownership", () => {
  test("recursively derives descendants and excludes an unrelated same-command process", () => {
    const records = parseProcessTable(TABLE);
    expect(descendantPids(100, records)).toEqual([110, 111, 112, 130]);

    const agents = selectAgentProcesses(records, 100);
    expect(agents.pids).toEqual([110, 111, 112]);
    expect(agents.pids).not.toContain(120);
  });

  test("process delta identifies only newly observed owned agents", () => {
    const before = selectAgentProcesses(parseProcessTable(TABLE), 100);
    const after = selectAgentProcesses(
      parseProcessTable(`${TABLE}\n140 100 /packed/qf-toolloop.aospkg qf-toolloop`),
      100,
    );
    expect(processDelta(before, after)).toEqual([140]);
  });

  test("exact tracked PID survives after reparenting", () => {
    const afterReparent = parseProcessTable("111 1 /packed/acp-main.js acp-main\n130 1 unrelated");
    expect(survivingPids([111, 999], afterReparent)).toEqual([111]);
  });

  test("malformed process rows are ignored without inventing ownership", () => {
    const records = parseProcessTable("not a process\n200 nope qf-toolloop\n201 100 qf-toolloop");
    expect(records.map((record) => record.pid)).toEqual([201]);
    expect(selectAgentProcesses(records, 100).pids).toEqual([201]);
  });
});
