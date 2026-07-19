import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  createSharedOs,
  promptUnknownSession,
  runCancelProof,
  runProofTurn,
  type SharedOs,
} from "./proof.ts";

let shared: SharedOs;

beforeAll(async () => {
  // Pack once for the suite. The qa `runtime-proof` gate does not pack again —
  // `bun test` always runs this hook.
  const pack = spawnSync("node", [join(import.meta.dir, "..", "scripts", "pack-agent.mjs")], {
    cwd: join(import.meta.dir, ".."),
    stdio: "inherit",
  });
  if (pack.status !== 0) {
    throw new Error(`pack-agent failed with status ${pack.status}`);
  }
  shared = await createSharedOs();
}, 120_000);

afterAll(async () => {
  if (shared) await shared.os.dispose();
});

describe("WO-004a runtime ownership proof", () => {
  test("P1 · host-reported ID equals guest-minted ID across the process boundary", async () => {
    const run = await runProofTurn(shared);

    console.log("P1 createSession / AgentOS:", run.agentOsSessionId);
    console.log("P1 listSessions table:    ", run.listedSessionIds);
    console.log("P1 notification sessionIds:", run.notificationSessionIds);

    expect(run.agentOsSessionId.length).toBeGreaterThan(0);
    // Assert against the table's contents — not a find keyed by the expected value.
    expect(run.listedSessionIds).toContain(run.agentOsSessionId);
    expect(run.notificationSessionIds.length).toBeGreaterThan(0);
    for (const sid of run.notificationSessionIds) {
      expect(sid).toBe(run.agentOsSessionId);
    }
    // toolLoopSessionId deleted — ToolLoopAgent has no session concept.
  }, 60_000);

  test("P1b · loop is session-scoped (notifications + unknown ID rejected)", async () => {
    const run = await runProofTurn(shared);

    expect(run.sessionEvents.length).toBeGreaterThan(0);
    for (const ev of run.sessionEvents) {
      expect(ev.method).toBe("session/update");
      expect(ev.sessionId).toBe(run.agentOsSessionId);
    }

    const err = await promptUnknownSession(shared);
    console.log("P1b unknown-session error:", err.message);
    expect(err.message).toMatch(/Session not found|Unknown session/i);
  }, 60_000);

  test("P2 · no second listening server", async () => {
    const run = await runProofTurn(shared);

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
    const run = await runProofTurn(shared);

    console.log("P3 prompt text:", run.promptText);
    console.log("P3 chunk events:", run.chunkEventTimestamps.length);

    // Tool result surfaces in streamed assistant text (no /tmp receipt oracle).
    expect(run.promptText).toContain("QUANTFLOW");
    const distinct = new Set(run.chunkEventTimestamps).size;
    expect(run.chunkEventTimestamps.length).toBeGreaterThan(1);
    expect(distinct).toBeGreaterThan(1);
  }, 60_000);

  test("P4 · cancel mid-turn is clean (exactly cancelled, no orphan children)", async () => {
    const run = await runCancelProof(shared);

    console.log("P4 stopReason:", run.stopReason);
    console.log("P4 chunksBeforeCancel:", run.chunksBeforeCancel);
    console.log("P4 chunksAfterCancel:", run.chunksAfterCancel);
    console.log("P4 orphanSurvivors:", run.orphanSurvivors);
    console.log("P4 orphanCheck:", run.orphanCheck);
    console.log("P4 new listeners after cancel:", run.newListeners);

    expect(run.stopReason).toBe("cancelled");
    expect(run.chunksBeforeCancel).toBeGreaterThanOrEqual(1);
    expect(run.chunksAfterCancel).toBe(0);
    expect(run.orphanCheck.sessionGone).toBe(true);
    expect(run.orphanCheck.zeroOrphanDescendants).toBe(true);
    expect(run.orphanSurvivors).toEqual([]);
    expect(run.newListeners).toEqual([]);
  }, 90_000);
});
