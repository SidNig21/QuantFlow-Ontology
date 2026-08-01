import { AgentOs, type JsonRpcNotification } from "@rivet-dev/agentos-core";
import { join } from "node:path";
import { listenerDelta, snapshotListeners, type ListenSnapshot } from "./listeners.ts";
import {
  processDelta,
  selectAgentProcesses,
  snapshotAgentProcesses,
  snapshotProcessTable,
  survivingPids,
  type ProcessSnap,
} from "./processes.ts";

export const AGENT_PACKAGE_PATH = join(import.meta.dir, "..", "packed", "qf-toolloop.aospkg");

export type SessionEventRecord = {
  method: string;
  sessionId: string;
  at: number;
};

export type ProofRun = {
  /** Host-reported ID from createSession (AgentOS adopted the guest mint). */
  agentOsSessionId: string;
  /** Full sessionId table from listSessions — not a lookup keyed by the expected ID. */
  listedSessionIds: string[];
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
  agentProcessesBaseline: ProcessSnap;
};

export type SocketDenialProof = {
  sessionCountBefore: number;
  sessionIdsBefore: string[];
  sessionCountAfter: number;
  sessionIdsAfter: string[];
  rejectionMessage: string;
};

function ownedPidsForAgentDelta(baseline: ProcessSnap, current: ProcessSnap): Set<number> {
  return new Set([process.pid, ...processDelta(baseline, current)]);
}

function openEphemeralListener(): Bun.TCPSocketListener<undefined> {
  return Bun.listen({
    hostname: "127.0.0.1",
    port: 0,
    socket: { data() {}, open() {}, close() {} },
  });
}

/** Create the shared AgentOS fixture (pack must already have run). */
export async function createSharedOs(): Promise<SharedOs> {
  const agentProcessesBaseline = await snapshotAgentProcesses();
  const listenersBefore = await snapshotListeners(new Set([process.pid]));
  const os = await AgentOs.create({
    defaultSoftware: false,
    software: [{ packagePath: AGENT_PACKAGE_PATH }],
    limits: { resources: { maxSockets: 0 } },
  });
  const agentProcessesAfterStart = await snapshotAgentProcesses();
  const listenersAfterStart = await snapshotListeners(
    ownedPidsForAgentDelta(agentProcessesBaseline, agentProcessesAfterStart),
  );
  return { os, listenersBefore, listenersAfterStart, agentProcessesBaseline };
}

function registeredSessionIds(os: AgentOs): string[] {
  return os
    .listSessions()
    .map((session) => session.sessionId)
    .sort();
}

/** Prove the packed guest cannot register a session that opens a socket. */
export async function runSocketDenialProof(shared: SharedOs): Promise<SocketDenialProof> {
  const sessionIdsBefore = registeredSessionIds(shared.os);
  const sessionCountBefore = sessionIdsBefore.length;
  let rejection: unknown;
  let createdSessionId: string | undefined;

  try {
    const created = await shared.os.createSession("qf-toolloop", {
      env: { QF_PROOF_OPEN_LISTENER: "1" },
    });
    createdSessionId = created.sessionId;
  } catch (error) {
    rejection = error;
  }

  if (createdSessionId) {
    await shared.os.destroySession(createdSessionId);
    rejection = new Error("P2 socket denial unexpectedly succeeded");
  }

  const sessionIdsAfter = registeredSessionIds(shared.os);
  const sessionCountAfter = sessionIdsAfter.length;
  const rejectionMessage = rejection instanceof Error ? rejection.message : String(rejection);

  if (!rejectionMessage.includes("maximum socket count reached")) {
    throw new Error(`P2 socket denial rejected for the wrong reason: ${rejectionMessage}`);
  }
  if (
    sessionCountAfter !== sessionCountBefore ||
    sessionIdsAfter.length !== sessionIdsBefore.length ||
    sessionIdsAfter.some((id, index) => id !== sessionIdsBefore[index])
  ) {
    throw new Error(
      `P2 socket denial left registered sessions: before=${sessionIdsBefore.join(",")} after=${sessionIdsAfter.join(",")}`,
    );
  }

  return {
    sessionCountBefore,
    sessionIdsBefore,
    sessionCountAfter,
    sessionIdsAfter,
    rejectionMessage,
  };
}

/**
 * One prompt turn on an existing AgentOS. Session ID evidence comes from
 * createSession / listSessions and from received ACP notifications — not a receipt file.
 */
export async function runProofTurn(shared: SharedOs): Promise<ProofRun> {
  const { os, listenersBefore, listenersAfterStart, agentProcessesBaseline } = shared;

  const created = await os.createSession("qf-toolloop");
  const agentOsSessionId = created.sessionId;
  let listedSessionIds = os.listSessions().map((s) => s.sessionId);
  // Set QF_PROOF_CORRUPT_LIST_SESSIONS=1 to prove P1 fails when the table is wrong.
  if (process.env.QF_PROOF_CORRUPT_LIST_SESSIONS === "1") {
    listedSessionIds = listedSessionIds.map(() => `corrupt-${crypto.randomUUID()}`);
  }
  if (!listedSessionIds.includes(agentOsSessionId)) {
    throw new Error("AgentOS listSessions did not report the created session id");
  }

  const agentProcessesAfterSession = await snapshotAgentProcesses();
  const listenersAfterSession = await snapshotListeners(
    ownedPidsForAgentDelta(agentProcessesBaseline, agentProcessesAfterSession),
  );

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
      listedSessionIds,
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
  const processTableAfter = await snapshotProcessTable();
  const agentProcessesAfter = selectAgentProcesses(processTableAfter, process.pid);
  const spawned = processDelta(agentProcessesBaseline, agentProcessesDuring);
  const orphanSurvivors = survivingPids(spawned, processTableAfter);

  let ownedTestListener: Bun.TCPSocketListener<undefined> | undefined;
  try {
    if (process.env.QF_PROOF_P4_OPEN_OWNED_LISTENER === "1") {
      ownedTestListener = openEphemeralListener();
    }
    const listenersAfter = await snapshotListeners(new Set([process.pid, ...orphanSurvivors]));

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
  } finally {
    ownedTestListener?.stop();
  }
}
