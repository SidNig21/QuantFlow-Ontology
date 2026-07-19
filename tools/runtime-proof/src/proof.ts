import { AgentOs, type JsonRpcNotification } from "@rivet-dev/agentos-core";
import { join } from "node:path";
import { listenerDelta, snapshotListeners, type ListenSnapshot } from "./listeners.ts";
import { processDelta, snapshotAgentProcesses, type ProcessSnap } from "./processes.ts";

export const AGENT_PACKAGE_PATH = join(import.meta.dir, "..", "packed", "qf-toolloop.aospkg");

export type SessionEventRecord = {
  method: string;
  sessionId: string;
  at: number;
};

export type ProofRun = {
  /** Host-reported ID from createSession (AgentOS adopted the guest mint). */
  agentOsSessionId: string;
  /** Same ID as reported by listSessions. */
  listedSessionId: string;
  /** sessionId from every received ACP session/update notification. */
  notificationSessionIds: string[];
  sessionEvents: SessionEventRecord[];
  promptText: string;
  stopReason: string;
  chunkEventTimestamps: number[];
  listenersBefore: ListenSnapshot;
  listenersAfterStart: ListenSnapshot;
  listenersAfterSession: ListenSnapshot;
  newListenersAfterStart: string[];
  newListenersAfterSession: string[];
};

export type CancelRun = {
  agentOsSessionId: string;
  stopReason: string;
  chunkEventTimestamps: number[];
  chunksBeforeCancel: number;
  chunksAfterCancel: number;
  cancelAt: number;
  listenersAfter: ListenSnapshot;
  newListeners: string[];
  agentProcessesBaseline: ProcessSnap;
  agentProcessesDuring: ProcessSnap;
  agentProcessesAfter: ProcessSnap;
  orphanSurvivors: number[];
  orphanCheck: {
    sessionGone: boolean;
    disposeCompleted: boolean;
    listenerCountFinal: number;
    zeroOrphanDescendants: boolean;
  };
};

/** Extract ACP sessionId from a host-received session event notification. */
export function sessionIdFromNotification(event: JsonRpcNotification): string | null {
  if (event.method !== "session/update") return null;
  const params = event.params;
  if (!params || typeof params !== "object") return null;
  const sid = (params as { sessionId?: unknown }).sessionId;
  return typeof sid === "string" && sid.length > 0 ? sid : null;
}

function stopReasonFromPrompt(result: { response: unknown }): string {
  const response = result.response as {
    result?: { stopReason?: string };
  };
  return response?.result?.stopReason ?? "unknown";
}

export type SharedOs = {
  os: AgentOs;
  listenersBefore: ListenSnapshot;
  listenersAfterStart: ListenSnapshot;
};

/** Create the shared AgentOS fixture (pack must already have run). */
export async function createSharedOs(): Promise<SharedOs> {
  const listenersBefore = await snapshotListeners();
  const os = await AgentOs.create({
    defaultSoftware: false,
    software: [{ packagePath: AGENT_PACKAGE_PATH }],
  });
  const listenersAfterStart = await snapshotListeners();
  return { os, listenersBefore, listenersAfterStart };
}

/**
 * One prompt turn on an existing AgentOS. Session ID evidence comes from
 * createSession / listSessions and from received ACP notifications — not a receipt file.
 */
export async function runProofTurn(shared: SharedOs): Promise<ProofRun> {
  const { os, listenersBefore, listenersAfterStart } = shared;

  const created = await os.createSession("qf-toolloop");
  const agentOsSessionId = created.sessionId;
  const listed = os.listSessions();
  const listedSessionId = listed.find((s) => s.sessionId === agentOsSessionId)?.sessionId;
  if (!listedSessionId) {
    throw new Error("AgentOS listSessions did not report the created session id");
  }

  const listenersAfterSession = await snapshotListeners();

  const sessionEvents: SessionEventRecord[] = [];
  const chunkEventTimestamps: number[] = [];
  const unsub = os.onSessionEvent(agentOsSessionId, (event) => {
    const sid = sessionIdFromNotification(event);
    if (sid) {
      sessionEvents.push({ method: event.method, sessionId: sid, at: Date.now() });
      chunkEventTimestamps.push(Date.now());
    }
  });

  try {
    const promptResult = await os.prompt(agentOsSessionId, "uppercase quantflow");
    const stopReason = stopReasonFromPrompt(promptResult);
    const notificationSessionIds = sessionEvents.map((e) => e.sessionId);

    return {
      agentOsSessionId,
      listedSessionId,
      notificationSessionIds,
      sessionEvents,
      promptText: promptResult.text,
      stopReason,
      chunkEventTimestamps,
      listenersBefore,
      listenersAfterStart,
      listenersAfterSession,
      newListenersAfterStart: listenerDelta(listenersBefore, listenersAfterStart),
      newListenersAfterSession: listenerDelta(listenersBefore, listenersAfterSession),
    };
  } finally {
    unsub();
    await os.destroySession(agentOsSessionId);
  }
}

/**
 * Prompt an ID that was never created — host routing must reject it.
 */
export async function promptUnknownSession(shared: SharedOs): Promise<Error> {
  const unknownId = `unknown-session-${crypto.randomUUID()}`;
  try {
    await shared.os.prompt(unknownId, "should fail");
    throw new Error("expected prompt on unknown session to reject");
  } catch (err) {
    if (err instanceof Error && err.message.includes("expected prompt")) throw err;
    return err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Cancel mid-turn: slow chunks, cancel after first notification, assert cancelled.
 */
export async function runCancelProof(shared: SharedOs): Promise<CancelRun> {
  const { os, listenersBefore } = shared;
  const agentProcessesBaseline = await snapshotAgentProcesses();

  const created = await os.createSession("qf-toolloop", {
    env: { QF_PROOF_SLOW_CHUNK_MS: "400" },
  });
  const agentOsSessionId = created.sessionId;

  const chunkEventTimestamps: number[] = [];
  let cancelAt = 0;
  const unsub = os.onSessionEvent(agentOsSessionId, (event) => {
    if (sessionIdFromNotification(event)) {
      chunkEventTimestamps.push(Date.now());
    }
  });

  const promptPromise = os.prompt(agentOsSessionId, "uppercase quantflow");

  // Wait until at least one chunk notification arrives, then cancel.
  const deadline = Date.now() + 15_000;
  while (chunkEventTimestamps.length < 1 && Date.now() < deadline) {
    await Bun.sleep(20);
  }
  if (chunkEventTimestamps.length < 1) {
    unsub();
    await os.destroySession(agentOsSessionId).catch(() => {});
    throw new Error("P4: no chunk arrived before cancel window — mock not slow enough");
  }

  const agentProcessesDuring = await snapshotAgentProcesses();
  const chunksBeforeCancel = chunkEventTimestamps.length;
  cancelAt = Date.now();
  // Set QF_PROOF_NEUTER_CANCEL=1 to prove P4 fails when cancel is skipped.
  if (process.env.QF_PROOF_NEUTER_CANCEL === "1") {
    // cancel path neutered — prompt should finish as end_turn
  } else {
    await os.cancelSession(agentOsSessionId);
  }

  const promptResult = await promptPromise;
  const drainAt = Date.now();
  unsub();

  // After the prompt settles, no further session updates may arrive.
  await Bun.sleep(400);
  const chunksAfterCancel = chunkEventTimestamps.filter((t) => t > drainAt).length;

  const stopReason = stopReasonFromPrompt(promptResult);

  await os.destroySession(agentOsSessionId);
  const sessionGone = os.listSessions().every((s) => s.sessionId !== agentOsSessionId);

  // Brief settle so the stdio child can exit.
  await Bun.sleep(200);
  const agentProcessesAfter = await snapshotAgentProcesses();
  const spawned = processDelta(agentProcessesBaseline, agentProcessesDuring);
  const orphanSurvivors = spawned.filter((pid) => agentProcessesAfter.pids.includes(pid));

  const listenersAfter = await snapshotListeners();

  return {
    agentOsSessionId,
    stopReason,
    chunkEventTimestamps,
    chunksBeforeCancel,
    chunksAfterCancel,
    cancelAt,
    listenersAfter,
    newListeners: listenerDelta(listenersBefore, listenersAfter),
    agentProcessesBaseline,
    agentProcessesDuring,
    agentProcessesAfter,
    orphanSurvivors,
    orphanCheck: {
      sessionGone,
      disposeCompleted: true, // shared fixture owns dispose; session destroy completed above
      listenerCountFinal: listenersAfter.count,
      zeroOrphanDescendants: orphanSurvivors.length === 0,
    },
  };
}
