export type NativeTuiTrace = { trace_id: string; span_id: string };

export type NativeTuiLive = {
  cancelled: boolean;
  definitionId: string;
  guestId: string;
  kind: "native_tui";
  ptySessionId: string;
  unsub?: () => void;
  turnInFlight: boolean;
};

export type NativeTuiPty = { sessionId: string };

export type NativeTuiOrchestrationDependencies = {
  createPty: () => Promise<NativeTuiPty>;
  terminatePty: (ptySessionId: string) => Promise<void>;
  execute: (
    command: string,
    input: Record<string, unknown>,
    trace: NativeTuiTrace,
  ) => unknown;
  newTrace: () => NativeTuiTrace;
  newSessionId: () => string;
  liveSet: (sessionId: string, entry: NativeTuiLive) => void;
  liveDelete: (sessionId: string) => void;
  ptyMapSet: (ptySessionId: string, sessionId: string) => void;
  ptyMapDelete: (ptySessionId: string) => void;
  peerAssertAvailable: (role: string) => void;
  peerRegister: (role: string, ptySessionId: string) => void;
  peerUnregister: (role: string, ptySessionId: string) => void;
  peerStart: (dbPath: string) => void;
};

export type NativeTuiOrchestrationOptions = {
  definitionId: string;
  label: string;
  corruptId?: string;
  peerDelivery?: { role: string; dbPath: string };
  onStarted?: (
    sessionId: string,
    definitionId: string,
    info: { surface: "native_tui"; ptySessionId: string },
  ) => void;
};

export type NativeTuiOrchestrationResult = {
  sessionId: string;
  guestId: string;
  definitionId: string;
  surface: "native_tui";
  ptySessionId: string;
};

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/**
 * The single production native-TUI admission transaction across process-local
 * resources and Kernel receipts. Tests inject failures into this exact function.
 */
export async function orchestrateNativeTuiAdmission(
  opts: NativeTuiOrchestrationOptions,
  deps: NativeTuiOrchestrationDependencies,
): Promise<NativeTuiOrchestrationResult> {
  const peer = opts.peerDelivery;
  if (peer) deps.peerAssertAvailable(peer.role);

  let pty: NativeTuiPty | null = null;
  let sessionId: string | null = null;
  let liveOwned = false;
  let ptyMapOwned = false;
  let peerOwned = false;
  let kernelCreated = false;

  try {
    pty = await deps.createPty();
    sessionId = opts.corruptId ?? deps.newSessionId();

    deps.liveSet(sessionId, {
      cancelled: false,
      definitionId: opts.definitionId,
      guestId: pty.sessionId,
      kind: "native_tui",
      ptySessionId: pty.sessionId,
      turnInFlight: false,
    });
    liveOwned = true;
    deps.ptyMapSet(pty.sessionId, sessionId);
    ptyMapOwned = true;

    const trace = deps.newTrace();
    deps.execute(
      "create_agent_session",
      {
        session_id: sessionId,
        agent_definition_id: opts.definitionId,
        label: opts.label,
      },
      trace,
    );
    kernelCreated = true;
    deps.execute(
      "start_agent_session",
      { session_id: sessionId },
      { ...trace, span_id: deps.newTrace().span_id },
    );

    if (peer) {
      deps.peerRegister(peer.role, pty.sessionId);
      peerOwned = true;
      deps.peerStart(peer.dbPath);
    }

    opts.onStarted?.(sessionId, opts.definitionId, {
      surface: "native_tui",
      ptySessionId: pty.sessionId,
    });
    return {
      sessionId,
      guestId: pty.sessionId,
      definitionId: opts.definitionId,
      surface: "native_tui",
      ptySessionId: pty.sessionId,
    };
  } catch (cause) {
    const cleanupErrors: Error[] = [];
    if (peerOwned && peer && pty) {
      try {
        deps.peerUnregister(peer.role, pty.sessionId);
      } catch (error) {
        cleanupErrors.push(asError(error));
      }
    }
    if (ptyMapOwned && pty) {
      try {
        deps.ptyMapDelete(pty.sessionId);
      } catch (error) {
        cleanupErrors.push(asError(error));
      }
    }
    if (liveOwned && sessionId) {
      try {
        deps.liveDelete(sessionId);
      } catch (error) {
        cleanupErrors.push(asError(error));
      }
    }
    if (pty) {
      try {
        await deps.terminatePty(pty.sessionId);
      } catch (error) {
        cleanupErrors.push(asError(error));
      }
    }
    if (kernelCreated && sessionId) {
      const trace = deps.newTrace();
      try {
        deps.execute(
          "fail_agent_session",
          { session_id: sessionId, reason: "native_tui_admission_failed" },
          trace,
        );
        deps.execute(
          "close_agent_session",
          { session_id: sessionId },
          { ...trace, span_id: deps.newTrace().span_id },
        );
      } catch (error) {
        cleanupErrors.push(asError(error));
      }
    }

    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [asError(cause), ...cleanupErrors],
        `native-TUI admission failed and ${cleanupErrors.length} cleanup step(s) failed`,
      );
    }
    throw cause;
  }
}
