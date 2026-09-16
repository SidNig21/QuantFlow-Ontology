import { describe, expect, mock, test } from "bun:test";
import { PeerRoleRegistry } from "./peer-role-registry";

const roles = new PeerRoleRegistry();
let teardownCalls = 0;
const definitions = new Map<string, Record<string, unknown>>();
const sessions = new Map<string, Record<string, unknown>>();
const tasks = new Map<string, Record<string, unknown>>();
const pendingResults = new Set<string>();
const taskAssignments: Record<string, unknown>[] = [];
const kernelCommands: Array<{ command: string; input: Record<string, unknown> }> = [];

mock.module("./peer-delivery", () => ({
  hasUndeliveredResult: (_role: string, sessionId: string, _dbPath: string) => pendingResults.has(sessionId),
}));

mock.module("./kernel", () => ({
  getArtifactRoot: () => "",
  kernelGetLinks: (id: string, options?: { kind?: string }) => {
    if (options?.kind !== "assigned_to") return [];
    return taskAssignments
      .filter((task) => task.assignedToSessionId === id)
      .map((task) => ({
        id: `assigned-${String(task.taskId)}`,
        kind: "assigned_to",
        from_id: String(task.taskId),
        to_id: id,
      }));
  },
  kernelListAgentDefinitions: () => [...definitions.values()],
  kernelListAgentSessions: () => [...sessions.values()],
  kernelListTaskAssignments: () => taskAssignments,
  kernelQueryObjects: () => [],
  kernelDecisionReadScope: () => null,
  kernelDecisionModelReadView: () => null,
  kernelGetObject: (type: string, id: string) => {
    if (type === "agent_definition") return definitions.get(id) ?? null;
    if (type === "agent_session") return sessions.get(id) ?? null;
    if (type === "task") return tasks.get(id) ?? null;
    return null;
  },
  kernelExecute: (command: string, input: Record<string, unknown>) => {
    kernelCommands.push({ command, input: { ...input } });
    const id = String(input.session_id ?? input.task_id ?? input.mission_id ?? input.name ?? "object");
    if (command === "register_agent_definition") {
      definitions.set(id, { id, ...input });
    } else if (command === "create_agent_session") {
      sessions.set(id, { id, status: "created", ...input });
    } else if (command === "start_agent_session") {
      const session = sessions.get(id);
      if (session) session.status = "running";
    } else if (command === "create_task") {
      tasks.set(id, { id, status: "open", ...input });
    } else if (command === "complete_task") {
      const task = tasks.get(id);
      if (task) {
        task.status = "done";
        task.result_artifact_id = input.result_artifact_id;
      }
    } else if (command === "close_agent_session") {
      if (taskAssignments.some((task) => task.status === "open" && task.assignedToSessionId === id)) {
        throw new Error("Reassign or cancel this task before closing the seat.");
      }
      const session = sessions.get(id);
      if (session) session.status = "closed";
    } else if (command === "cancel_agent_session") {
      const session = sessions.get(id);
      if (session) session.status = "cancelled";
    } else if (command === "fail_agent_session") {
      const session = sessions.get(id);
      if (session) session.status = "failed";
    }
    return { object_id: id, command };
  },
  openAppKernel: () => ({ query: () => ({ get: () => null, all: () => [], run: () => {} }), exec: () => {} }),
}));

mock.module("./pty", () => ({
  captureSession: async () => "ready | test\n❯",
  writeToSession: () => true,
  onPtySessionExit: () => {},
}));

mock.module("./host-native-tui", () => ({
  admitNativeTuiDefinition: async (opts: {
    definitionId: string;
    existingSessionId?: string;
    liveSet: (sessionId: string, entry: {
      cancelled: boolean;
      definitionId: string;
      guestId: string;
      kind: "native_tui";
      ptySessionId: string;
      peerRole?: string;
      turnInFlight: boolean;
    }) => void;
    peerDelivery?: { role: string; dbPath: string };
  }) => {
    const sessionId = opts.existingSessionId ?? "test-native-tui";
    const ptySessionId = `pty-${sessionId}`;
    if (opts.peerDelivery) roles.register(opts.peerDelivery.role, ptySessionId);
    opts.liveSet(sessionId, {
      cancelled: false,
      definitionId: opts.definitionId,
      guestId: ptySessionId,
      kind: "native_tui",
      ptySessionId,
      ...(opts.peerDelivery ? { peerRole: opts.peerDelivery.role } : {}),
      turnInFlight: false,
    });
    return {
      sessionId,
      guestId: ptySessionId,
      definitionId: opts.definitionId,
      surface: "native_tui" as const,
      ptySessionId,
    };
  },
  cancelNativeTuiSession: async (_sessionId: string, entry: { peerRole?: string; ptySessionId: string }) => {
    teardownCalls += 1;
    if (entry.peerRole) roles.unregister(entry.peerRole, entry.ptySessionId);
  },
  installNativeTuiPtyExitHook: () => {},
  tearDownNativeTui: async (entry: { peerRole?: string; ptySessionId: string }) => {
    teardownCalls += 1;
    if (entry.peerRole) roles.unregister(entry.peerRole, entry.ptySessionId);
  },
}));

mock.module("./host-acp-bridge", () => ({
  admitHostAcp: async () => { throw new Error("test does not admit host ACP"); },
  cancelHostAcp: async () => {},
  resolveHostAcpCommand: () => null,
  tearDownHostAcp: async () => {},
}));
mock.module("./host-acp-permission", () => ({
  cancelPendingPermissions: () => {},
  requestFounderPermission: async () => false,
}));
mock.module("./host-acp-turn", () => ({
  runHostAcpTurn: async () => { throw new Error("test does not run host ACP"); },
}));
mock.module("electron", () => ({ app: { isPackaged: false } }));
mock.module("./runtime-route-dispatch", () => ({
  dispatchRuntimeRoute: (_route: string, _packageRef: string, handlers: { native_tui: () => unknown }) => handlers.native_tui(),
}));
mock.module("./definition-runtime", () => ({
  resolveDefinitionRuntime: (definitionId: string) => ({
    definitionId,
    role: "orchestrator",
    packageRef: "species/hermes/packed/hermes.aospkg",
    runtimeProfile: "default",
    systemPromptRef: null,
    argv: [],
    entrypointPath: null,
    metadata: {
      route: "native_tui",
      adapterId: "hermes",
      command: "hermes",
      terminalTarget: "wsl",
      peerDelivery: { runtimeProfiles: ["default"] },
    },
  }),
}));

const trace = () => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });

function registerDefinition(kernelExecute: Function, id: string, role: string): void {
  kernelExecute("register_agent_definition", {
    name: id,
    role,
    package_ref: "species/hermes/packed/hermes.aospkg",
    runtime_profile: "default",
    capability_groups: ["desk.orchestrate"],
    display_name: role === "orchestrator" ? "Research Director" : "Market Researcher",
  }, trace());
}

function createSession(kernelExecute: Function, id: string, definitionId: string): void {
  kernelExecute("create_agent_session", {
    session_id: id,
    agent_definition_id: definitionId,
    label: id,
  }, trace());
  kernelExecute("start_agent_session", { session_id: id }, trace());
}

describe("agent-host native-TUI lifecycle admission", () => {
  const peerBusDb = "peer-bus-fixture";

  test("retired Hermes orchestrator is not launchable inventory", async () => {
    const { getDockDefinitionAvailability } = await import("./agent-host");
    expect(getDockDefinitionAvailability({
      id: "hermes-orchestrator",
      package_ref: "species/hermes/packed/hermes.aospkg",
    })).toEqual({
      available: false,
      adapterId: "hermes",
      message: "Retired Hermes profile. Use Research Director.",
    });
  });

  async function admitSession(id: string): Promise<{
    admitted: { sessionId: string; ptySessionId: string };
    kernelExecute: Function;
    kernelGetObject: Function;
  }> {
    process.env.QF_PEER_BUS_DB = peerBusDb;
    const { admitAndStartSession } = await import("./agent-host");
    const { kernelExecute, kernelGetObject } = await import("./kernel");
    registerDefinition(kernelExecute, "hermes-research-director", "orchestrator");
    createSession(kernelExecute, id, "hermes-research-director");
    const admitted = await admitAndStartSession("hermes-research-director", { existingSessionId: id });
    return { admitted, kernelExecute, kernelGetObject };
  }

  test("registry.begin blocks direct teardown and releases after acknowledgment", async () => {
    pendingResults.clear();
    teardownCalls = 0;
    const id = "registry-session";
    const { admitted, kernelGetObject } = await admitSession(id);
    const { createNativeTuiTeardownRegistry, closeAgentSessionRow } = await import("./agent-host");
    pendingResults.add(id);
    const entry = {
      cancelled: false,
      definitionId: "hermes-research-director",
      guestId: admitted.ptySessionId,
      kind: "native_tui" as const,
      ptySessionId: admitted.ptySessionId,
      peerRole: "orchestrator",
      turnInFlight: false,
    } as Parameters<ReturnType<typeof createNativeTuiTeardownRegistry>["begin"]>[1];
    const registry = createNativeTuiTeardownRegistry(async (value) => {
      teardownCalls += 1;
      if (value.peerRole) roles.unregister(value.peerRole, value.ptySessionId);
    });

    expect(() => registry.begin(id, entry)).toThrow("delegated result remains undelivered");
    expect(teardownCalls).toBe(0);
    expect(roles.get("orchestrator")).toBe(`pty-${id}`);
    expect((kernelGetObject("agent_session", id) as { status: string }).status).toBe("running");

    pendingResults.delete(id);
    await registry.begin(id, entry);
    expect(teardownCalls).toBe(1);
    expect(roles.get("orchestrator")).toBeUndefined();

    closeAgentSessionRow(id);
    expect((kernelGetObject("agent_session", id) as { status: string }).status).toBe("closed");
  });

  test("explicit close blocks before Kernel-row close and releases after acknowledgment", async () => {
    pendingResults.clear();
    teardownCalls = 0;
    const id = "explicit-close-session";
    const { kernelGetObject } = await admitSession(id);
    const { closeAgentSessionRow, hasLiveAgentSession } = await import("./agent-host");
    pendingResults.add(id);

    expect(() => closeAgentSessionRow(id)).toThrow("delegated result remains undelivered");
    expect(teardownCalls).toBe(0);
    expect(hasLiveAgentSession(id)).toBe(true);
    expect(roles.get("orchestrator")).toBe(`pty-${id}`);
    expect((kernelGetObject("agent_session", id) as { status: string }).status).toBe("running");

    pendingResults.delete(id);
    closeAgentSessionRow(id);
    expect(teardownCalls).toBe(1);
    expect(hasLiveAgentSession(id)).toBe(false);
    expect(roles.get("orchestrator")).toBeUndefined();
    expect((kernelGetObject("agent_session", id) as { status: string }).status).toBe("closed");
  });

  test("application disposal closes the native runtime even with an undelivered result", async () => {
    pendingResults.clear();
    teardownCalls = 0;
    const id = "disposal-session";
    const { kernelGetObject } = await admitSession(id);
    const { disposeAgentHost, hasLiveAgentSession } = await import("./agent-host");
    pendingResults.add(id);

    await disposeAgentHost();
    expect(teardownCalls).toBe(1);
    expect(hasLiveAgentSession(id)).toBe(false);
    expect(roles.get("orchestrator")).toBeUndefined();
    expect((kernelGetObject("agent_session", id) as { status: string }).status).toBe("closed");
    pendingResults.delete(id);
  });

  test("application disposal terminates an unfinished Task's runtime without erasing or completing its work", async () => {
    const id = "disposal-open-owner";
    const taskId = "disposal-unfinished-task";
    await admitSession(id);
    tasks.set(taskId, { id: taskId, status: "open", title: "Unpublished research" });
    taskAssignments.push({ taskId, status: "open", assignedToSessionId: id, delegatedBySessionId: "director" });
    const { disposeAgentHost, hasLiveAgentSession, closeAgentSessionRow } = await import("./agent-host");
    expect(() => closeAgentSessionRow(id)).toThrow("Reassign or cancel");
    kernelCommands.length = 0;
    const before = teardownCalls;
    await disposeAgentHost();
    expect(teardownCalls).toBe(before + 1);
    expect(hasLiveAgentSession(id)).toBe(false);
    expect(sessions.get(id)?.status).toBe("failed");
    expect(tasks.get(taskId)?.status).toBe("open");
    expect(taskAssignments.find((task) => task.taskId === taskId)?.assignedToSessionId).toBe(id);
    expect(kernelCommands).toEqual([{ command: "fail_agent_session", input: { session_id: id, reason: "app_terminated" } }]);
    taskAssignments.splice(0, taskAssignments.length);
  });

  test("runtime exit fails an unfinished Task owner and releases the dead seat", async () => {
    const id = "runtime-exit-open-owner";
    const taskId = "runtime-exit-unfinished-task";
    await admitSession(id);
    tasks.set(taskId, { id: taskId, status: "open", title: "Interrupted research" });
    taskAssignments.push({ taskId, status: "open", assignedToSessionId: id, delegatedBySessionId: "director" });
    kernelCommands.length = 0;
    const before = teardownCalls;

    const { handleNativeTuiPtyExit, hasLiveAgentSession } = await import("./agent-host");
    handleNativeTuiPtyExit(id);
    await Promise.resolve();

    expect(teardownCalls).toBe(before + 1);
    expect(hasLiveAgentSession(id)).toBe(false);
    expect(roles.get("orchestrator")).toBeUndefined();
    expect(sessions.get(id)?.status).toBe("failed");
    expect(tasks.get(taskId)?.status).toBe("open");
    expect(kernelCommands).toEqual([{
      command: "fail_agent_session",
      input: { session_id: id, reason: "provider_stream_interrupted" },
    }]);
    taskAssignments.splice(0, taskAssignments.length);
  });

  test("application disposal does not wait forever for a wedged runtime", async () => {
    const { awaitRuntimeTeardownsForShutdown } = await import("./agent-host");
    const never = new Promise<void>(() => {});
    const startedAt = performance.now();
    await awaitRuntimeTeardownsForShutdown([never], 5);
    expect(performance.now() - startedAt).toBeLessThan(250);
  });

  test("cancel blocks its own teardown and releases after acknowledgment", async () => {
    pendingResults.clear();
    teardownCalls = 0;
    const id = "cancel-session";
    const { kernelGetObject } = await admitSession(id);
    const { cancelAgentSession, hasLiveAgentSession } = await import("./agent-host");
    pendingResults.add(id);

    await expect(cancelAgentSession(id)).rejects.toThrow("delegated result remains undelivered");
    expect(teardownCalls).toBe(0);
    expect(hasLiveAgentSession(id)).toBe(true);
    expect(roles.get("orchestrator")).toBe(`pty-${id}`);
    expect((kernelGetObject("agent_session", id) as { status: string }).status).toBe("running");

    pendingResults.delete(id);
    await cancelAgentSession(id);
    expect(teardownCalls).toBe(1);
    expect(hasLiveAgentSession(id)).toBe(false);
    expect(roles.get("orchestrator")).toBeUndefined();
    expect((kernelGetObject("agent_session", id) as { status: string }).status).toBe("cancelled");
  });

  test("cold reconciliation fails an absent open-Task owner exactly once without closing its lineage", async () => {
    const id = "stale-open-task-owner";
    const taskId = "durable-open-task";
    sessions.set(id, { id, status: "running", definition_id: "hermes-research-director" });
    tasks.set(taskId, { id: taskId, status: "open", title: "Founder task" });
    taskAssignments.splice(0, taskAssignments.length, {
      taskId,
      status: "open",
      assignmentState: "assigned",
      assignedToSessionId: id,
      delegatedBySessionId: id,
    });
    kernelCommands.length = 0;

    const { reconcileStaleSessions } = await import("./agent-host");
    reconcileStaleSessions();

    expect(sessions.get(id)?.status).toBe("failed");
    expect(tasks.get(taskId)?.status).toBe("open");
    expect(taskAssignments[0]).toMatchObject({
      taskId,
      assignedToSessionId: id,
      delegatedBySessionId: id,
    });
    expect(kernelCommands.filter((row) => row.command === "fail_agent_session")).toEqual([{
      command: "fail_agent_session",
      input: { session_id: id, reason: "app_terminated" },
    }]);
    expect(kernelCommands.some((row) =>
      row.command === "close_agent_session" && row.input.session_id === id
    )).toBe(false);

    kernelCommands.length = 0;
    reconcileStaleSessions();
    expect(kernelCommands.filter((row) => row.input.session_id === id)).toEqual([]);
  });
});
