export type RuntimeKernelAdmissionTrace = {
  trace_id: string;
  span_id: string;
};

export type RuntimeKernelAdmissionInput<TLive> = {
  definitionId: string;
  sessionId: string;
  liveEntry: TLive;
};

export type RuntimeKernelAdmissionDependencies<TLive> = {
  execute: (
    command: string,
    input: Record<string, unknown>,
    trace: RuntimeKernelAdmissionTrace,
  ) => unknown;
  newTrace: () => RuntimeKernelAdmissionTrace;
  liveSet: (sessionId: string, entry: TLive) => void;
  liveDelete: (sessionId: string) => void;
  tearDownRuntime: () => void | Promise<void>;
};

export type CreateKernelAgentSessionInput = {
  definitionId: string;
  sessionId: string;
  label: string;
  actorSessionId?: string;
};

export type CreateKernelAgentSessionDependencies = Pick<
  RuntimeKernelAdmissionDependencies<unknown>,
  "execute" | "newTrace"
>;

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/** Keep every production session creation inside the admitted Kernel seam. */
export function createKernelAgentSession(
  input: CreateKernelAgentSessionInput,
  dependencies: CreateKernelAgentSessionDependencies,
): RuntimeKernelAdmissionTrace {
  const { definitionId, sessionId, label, actorSessionId } = input;
  const trace = dependencies.newTrace();
  dependencies.execute(
    "create_agent_session",
    {
      session_id: sessionId,
      agent_definition_id: definitionId,
      label,
      ...(actorSessionId ? { actor_session_id: actorSessionId } : {}),
    },
    trace,
  );
  return trace;
}

/**
 * Admit an already-open runtime into Kernel truth, compensating every resource
 * this transaction owns if creation or startup is rejected.
 */
export async function completeRuntimeKernelAdmission<TLive>(
  input: RuntimeKernelAdmissionInput<TLive>,
  dependencies: RuntimeKernelAdmissionDependencies<TLive>,
): Promise<void> {
  const { definitionId, sessionId, liveEntry } = input;
  const {
    execute,
    newTrace,
    liveSet,
    liveDelete,
    tearDownRuntime,
  } = dependencies;
  let kernelCreated = false;

  try {
    liveSet(sessionId, liveEntry);
    const trace = createKernelAgentSession(
      { definitionId, sessionId, label: definitionId },
      { execute, newTrace },
    );
    kernelCreated = true;
    execute(
      "start_agent_session",
      { session_id: sessionId },
      { ...trace, span_id: newTrace().span_id },
    );
  } catch (cause) {
    const errors = [asError(cause)];

    try {
      await tearDownRuntime();
    } catch (error) {
      errors.push(asError(error));
    }

    try {
      liveDelete(sessionId);
    } catch (error) {
      errors.push(asError(error));
    }

    if (kernelCreated) {
      const trace = newTrace();
      try {
        execute(
          "fail_agent_session",
          { session_id: sessionId, reason: "runtime_kernel_admission_failed" },
          trace,
        );
      } catch (error) {
        errors.push(asError(error));
      }
      try {
        execute(
          "close_agent_session",
          { session_id: sessionId },
          { ...trace, span_id: newTrace().span_id },
        );
      } catch (error) {
        errors.push(asError(error));
      }
    }

    throw new AggregateError(
      errors,
      `runtime Kernel admission failed with ${errors.length - 1} cleanup error(s)`,
    );
  }
}
