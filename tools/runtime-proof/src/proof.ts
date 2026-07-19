import { AgentOs } from "@rivet-dev/agentos-core";
import { join } from "node:path";
import { listenerDelta, snapshotListeners, type ListenSnapshot } from "./listeners.ts";

export const AGENT_PACKAGE_PATH = join(import.meta.dir, "..", "packed", "qf-toolloop.aospkg");
export const RECEIPT_PATH = "/tmp/qf-runtime-proof-receipt.json";

export type ProofReceipt = {
  phase: string;
  acpSessionId: string;
  toolLoopSessionId: string | null;
  toolOutput?: string | null;
  text?: string;
  chunkCount?: number;
};

export type ProofRun = {
  agentOsSessionId: string;
  acpSessionId: string;
  toolLoopSessionId: string;
  promptText: string;
  toolOutput: string | null;
  chunkEventTimestamps: number[];
  listenersBefore: ListenSnapshot;
  listenersAfterStart: ListenSnapshot;
  listenersAfterSession: ListenSnapshot;
  newListenersAfterStart: string[];
  newListenersAfterSession: string[];
  receipt: ProofReceipt;
};

export type CancelRun = {
  agentOsSessionId: string;
  stopReason: string;
  chunkEventTimestamps: number[];
  listenersAfter: ListenSnapshot;
  newListeners: string[];
  orphanCheck: {
    sessionGone: boolean;
    disposeCompleted: boolean;
    listenerCountFinal: number;
  };
};

async function readReceipt(os: AgentOs): Promise<ProofReceipt> {
  const bytes = await os.readFile(RECEIPT_PATH);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as ProofReceipt;
}

/**
 * Full chain: AgentOs.create → createSession(qf-toolloop) → ACP → ToolLoopAgent(mock).
 */
export async function runProofTurn(): Promise<ProofRun> {
  const listenersBefore = await snapshotListeners();

  const os = await AgentOs.create({
    defaultSoftware: false,
    software: [{ packagePath: AGENT_PACKAGE_PATH }],
  });

  const listenersAfterStart = await snapshotListeners();

  try {
    const created = await os.createSession("qf-toolloop");
    const agentOsSessionId = created.sessionId;
    const listed = os.listSessions();
    const listedId = listed.find((s) => s.sessionId === agentOsSessionId)?.sessionId;
    if (!listedId) {
      throw new Error("AgentOS listSessions did not report the created session id");
    }

    const listenersAfterSession = await snapshotListeners();

    const chunkEventTimestamps: number[] = [];
    const unsub = os.onSessionEvent(agentOsSessionId, (event) => {
      // Any session notification proves ACP is carrying this session id in-band.
      chunkEventTimestamps.push(Date.now());
      void event;
    });

    const promptResult = await os.prompt(agentOsSessionId, "uppercase quantflow");
    unsub();

    const receipt = await readReceipt(os);

    return {
      agentOsSessionId,
      acpSessionId: receipt.acpSessionId,
      toolLoopSessionId: receipt.toolLoopSessionId ?? "",
      promptText: promptResult.text,
      toolOutput: receipt.toolOutput ?? null,
      chunkEventTimestamps,
      listenersBefore,
      listenersAfterStart,
      listenersAfterSession,
      newListenersAfterStart: listenerDelta(listenersBefore, listenersAfterStart),
      newListenersAfterSession: listenerDelta(listenersBefore, listenersAfterSession),
      receipt,
    };
  } finally {
    await os.dispose();
  }
}

/**
 * Cancel mid-turn: slow chunks, cancelSession while prompting, assert clean stop.
 */
export async function runCancelProof(): Promise<CancelRun> {
  const listenersBefore = await snapshotListeners();

  const os = await AgentOs.create({
    defaultSoftware: false,
    software: [{ packagePath: AGENT_PACKAGE_PATH }],
  });

  try {
    const created = await os.createSession("qf-toolloop", {
      // Slow the mock stream so cancel lands mid-turn.
      env: { QF_PROOF_SLOW_CHUNK_MS: "200" },
    });
    const agentOsSessionId = created.sessionId;

    const chunkEventTimestamps: number[] = [];
    const unsub = os.onSessionEvent(agentOsSessionId, () => {
      chunkEventTimestamps.push(Date.now());
    });

    const promptPromise = os.prompt(agentOsSessionId, "uppercase quantflow");

    // Cancel after the first chunks should have started.
    await Bun.sleep(250);
    await os.cancelSession(agentOsSessionId);

    const promptResult = await promptPromise;
    unsub();

    const stopReason =
      (promptResult.response as { result?: { stopReason?: string } })?.result?.stopReason ??
      "unknown";

    await os.destroySession(agentOsSessionId);
    const sessionGone = os.listSessions().every((s) => s.sessionId !== agentOsSessionId);

    let disposeCompleted = false;
    const disposePromise = os.dispose();
    const hung = await Promise.race([
      disposePromise.then(() => {
        disposeCompleted = true;
        return false;
      }),
      Bun.sleep(10_000).then(() => true),
    ]);
    if (hung) {
      throw new Error("AgentOs.dispose hung after cancel — orphan risk");
    }

    const listenersAfter = await snapshotListeners();

    return {
      agentOsSessionId,
      stopReason,
      chunkEventTimestamps,
      listenersAfter,
      newListeners: listenerDelta(listenersBefore, listenersAfter),
      orphanCheck: {
        sessionGone,
        disposeCompleted,
        listenerCountFinal: listenersAfter.count,
      },
    };
  } catch (err) {
    try {
      await os.dispose();
    } catch {
      // ignore
    }
    throw err;
  }
}
