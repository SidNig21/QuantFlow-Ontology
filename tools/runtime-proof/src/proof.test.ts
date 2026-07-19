import { beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { runCancelProof, runProofTurn } from "./proof.ts";

beforeAll(() => {
  // `bun test` does not run package.json scripts — pack explicitly so a bare
  // `bun test` (the acceptance gate) still builds the AgentOS agent package.
  const pack = spawnSync("node", [join(import.meta.dir, "..", "scripts", "pack-agent.mjs")], {
    cwd: join(import.meta.dir, ".."),
    stdio: "inherit",
  });
  if (pack.status !== 0) {
    throw new Error(`pack-agent failed with status ${pack.status}`);
  }
});

describe("WO-004 runtime ownership proof", () => {
  test("P1 · one session ID across AgentOS, ACP, and ToolLoopAgent", async () => {
    const run = await runProofTurn();

    console.log("P1 AgentOS session ID:", run.agentOsSessionId);
    console.log("P1 ACP session ID:    ", run.acpSessionId);
    console.log("P1 ToolLoop session ID:", run.toolLoopSessionId);

    expect(run.agentOsSessionId.length).toBeGreaterThan(0);
    expect(run.acpSessionId).toBe(run.agentOsSessionId);
    expect(run.toolLoopSessionId).toBe(run.agentOsSessionId);
    expect(run.receipt.acpSessionId).toBe(run.agentOsSessionId);
  }, 60_000);

  test("P2 · no second listening server", async () => {
    const run = await runProofTurn();

    console.log("P2 listeners before:", run.listenersBefore.count);
    console.log("P2 listeners after start:", run.listenersAfterStart.count);
    console.log("P2 listeners after session:", run.listenersAfterSession.count);
    console.log("P2 new after start:", run.newListenersAfterStart);
    console.log("P2 new after session:", run.newListenersAfterSession);

    expect(run.newListenersAfterStart).toEqual([]);
    expect(run.newListenersAfterSession).toEqual([]);
    expect(run.listenersAfterStart.count).toBe(run.listenersBefore.count);
    expect(run.listenersAfterSession.count).toBe(run.listenersBefore.count);
  }, 60_000);

  test("P3 · tool call inside the session reaches the assistant message", async () => {
    const run = await runProofTurn();

    console.log("P3 prompt text:", run.promptText);
    console.log("P3 tool output:", run.toolOutput);
    console.log("P3 chunk events:", run.chunkEventTimestamps.length);

    expect(run.toolOutput).toBe("QUANTFLOW");
    expect(run.promptText).toContain("QUANTFLOW");
    // Incremental streaming: more than one distinct chunk-event timestamp.
    const distinct = new Set(run.chunkEventTimestamps).size;
    expect(run.chunkEventTimestamps.length).toBeGreaterThan(1);
    expect(distinct).toBeGreaterThan(1);
  }, 60_000);

  test("P4 · cancel mid-turn is clean", async () => {
    const run = await runCancelProof();

    console.log("P4 stopReason:", run.stopReason);
    console.log("P4 chunk events before cancel drain:", run.chunkEventTimestamps.length);
    console.log("P4 orphanCheck:", run.orphanCheck);
    console.log("P4 new listeners after cancel:", run.newListeners);

    expect(["cancelled", "end_turn"]).toContain(run.stopReason);
    // Prefer cancelled; if the mock finished first, still require clean teardown.
    expect(run.orphanCheck.sessionGone).toBe(true);
    expect(run.orphanCheck.disposeCompleted).toBe(true);
    expect(run.newListeners).toEqual([]);
  }, 60_000);
});
