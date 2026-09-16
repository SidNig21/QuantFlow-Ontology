import { afterEach, describe, expect, test } from "bun:test";
import {
  clearRuntimeMcpReadiness,
  recordRuntimeMcpReady,
  waitForRuntimeMcpReadiness,
} from "./runtime-mcp-readiness";

const sessions = new Set<string>();

afterEach(() => {
  for (const sessionId of sessions) clearRuntimeMcpReadiness(sessionId);
  sessions.clear();
});

describe("runtime MCP readiness", () => {
  test("waits for every declared server and accepts early receipts", async () => {
    const sessionId = "runtime-ready";
    sessions.add(sessionId);
    recordRuntimeMcpReady(sessionId, "quantflow-ontology");
    let settled = false;
    const waiting = waitForRuntimeMcpReadiness(
      sessionId,
      ["quantflow-collaboration", "quantflow-ontology"],
      1_000,
    ).then(() => { settled = true; });
    await Bun.sleep(5);
    expect(settled).toBe(false);
    recordRuntimeMcpReady(sessionId, "quantflow-collaboration");
    await waiting;
    expect(settled).toBe(true);
  });

  test("fails with the exact missing required server", async () => {
    const sessionId = "runtime-missing";
    sessions.add(sessionId);
    recordRuntimeMcpReady(sessionId, "quantflow-ontology");
    await expect(waitForRuntimeMcpReadiness(
      sessionId,
      ["quantflow-collaboration", "quantflow-ontology"],
      10,
    )).rejects.toThrow("quantflow-collaboration");
  });

  test("tracks receipts that arrive after waiting begins", async () => {
    const sessionId = "runtime-late-receipts";
    sessions.add(sessionId);
    const waiting = waitForRuntimeMcpReadiness(
      sessionId,
      ["quantflow-collaboration", "quantflow-ontology"],
      1_000,
    );
    recordRuntimeMcpReady(sessionId, "quantflow-collaboration");
    recordRuntimeMcpReady(sessionId, "quantflow-ontology");
    await expect(waiting).resolves.toBeUndefined();
  });
});
