/**
 * host_acp runTurn path (WO-008a) — extracted to keep agent-host.ts under 1k.
 */
import {
  cancelHostAcp,
  promptHostAcp,
  tearDownHostAcp,
  type HostAcpHandle,
} from "./host-acp-bridge";
import { cancelPendingPermissions } from "./host-acp-permission";
import { kernelExecute, type TraceContext } from "./kernel";

export type HostAcpTurnLive = {
  cancelled: boolean;
  hostAcp?: HostAcpHandle;
  turnInFlight: boolean;
};

export type HostAcpTurnResult = {
  sessionId: string;
  artifactId?: string;
  stopReason: string;
  text: string;
};

type DoneInfo = {
  status: "closed" | "cancelled" | "failed";
  artifactId?: string;
  text: string;
};

export async function runHostAcpTurn(opts: {
  sessionId: string;
  entry: HostAcpTurnLive;
  promptText: string;
  finalize: boolean;
  newTrace: () => TraceContext;
  onChunk: (sessionId: string, text: string) => void;
  onDone: (sessionId: string, info: DoneInfo) => void;
  liveDelete: (sessionId: string) => void;
}): Promise<HostAcpTurnResult> {
  const { sessionId, entry, promptText, finalize, newTrace } = opts;
  const handle = entry.hostAcp;
  if (!handle) {
    throw new Error(`agent-host: runTurn — host_acp missing handle ${sessionId}`);
  }

  entry.turnInFlight = true;
  entry.cancelled = false;

  const prevChunk = handle.hooks.onChunk;
  handle.hooks.onChunk = (chunk) => {
    opts.onChunk(sessionId, chunk);
    prevChunk?.(chunk);
  };

  let text = "";
  let stopReason = "unknown";
  try {
    const result = await promptHostAcp(handle, promptText);
    text = result.text;
    stopReason = result.stopReason;
  } catch (err) {
    stopReason = "failed";
    console.error("agent-host: host_acp prompt failed", err);
  } finally {
    handle.hooks.onChunk = prevChunk;
    entry.turnInFlight = false;
  }

  const wasCancelled = entry.cancelled || stopReason === "cancelled";

  if (wasCancelled) {
    cancelPendingPermissions(sessionId);
    await cancelHostAcp(handle).catch(() => {});
    opts.liveDelete(sessionId);
    try {
      kernelExecute(
        "cancel_agent_session",
        { session_id: sessionId },
        newTrace(),
      );
    } catch {
      /* already terminal */
    }
    try {
      kernelExecute(
        "close_agent_session",
        { session_id: sessionId },
        newTrace(),
      );
    } catch {
      /* ignore */
    }
    opts.onDone(sessionId, { status: "cancelled", text });
    console.log(`agent-host: host_acp session cancelled ${sessionId}`);
    return { sessionId, stopReason: "cancelled", text };
  }

  if (stopReason !== "end_turn" && stopReason !== "unknown") {
    cancelPendingPermissions(sessionId);
    await tearDownHostAcp(handle).catch(() => {});
    opts.liveDelete(sessionId);
    try {
      kernelExecute(
        "fail_agent_session",
        { session_id: sessionId, reason: stopReason },
        newTrace(),
      );
      kernelExecute(
        "close_agent_session",
        { session_id: sessionId },
        newTrace(),
      );
    } catch {
      /* ignore */
    }
    opts.onDone(sessionId, { status: "failed", text });
    return { sessionId, stopReason, text };
  }

  if (finalize) {
    cancelPendingPermissions(sessionId);
    await tearDownHostAcp(handle).catch(() => {});
    opts.liveDelete(sessionId);
    try {
      kernelExecute(
        "close_agent_session",
        { session_id: sessionId },
        newTrace(),
      );
    } catch {
      /* ignore */
    }
    opts.onDone(sessionId, { status: "closed", text });
    console.log(`agent-host: host_acp session complete ${sessionId}`);
  } else {
    console.log(`agent-host: host_acp turn complete (keep-alive) ${sessionId}`);
  }
  return { sessionId, stopReason, text };
}
