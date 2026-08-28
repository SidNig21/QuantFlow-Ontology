import { describe, expect, mock, test } from "bun:test";
import { PeerRoleRegistry } from "./peer-role-registry";

const roles = new PeerRoleRegistry();
let teardownCalls = 0;
const definitions = new Map<string, Record<string, unknown>>();
const sessions = new Map<string, Record<string, unknown>>();
const tasks = new Map<string, Record<string, unknown>>();
const pendingResults = new Set<string>();

mock.module("./peer-delivery", () => ({
  hasUndeliveredResult: (_role: string, sessionId: string, _dbPath: string) => pendingResults.has(sessionId),
}));

mock.module("./kernel", () => ({
  getArtifactRoot: () => "",
  kernelGetLinks: () => [],
  kernelListAgentSessions: () => [],
  kernelListTaskAssignments: () => [],
  kernelGetObject: (type: string, id: string) => {
    if (type === "agent_definition") return definitions.get(id) ?? null;
    if (type === "agent_session") return sessions.get(id) ?? null;
    if (type === "task") return tasks.get(id) ?? null;
    return null;
  },
  kernelExecute: (command: string, input: Record<string, unknown>) => {
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
      const session = sessions.get(id);
      if (session) session.status = "closed";
    } else if (command === "cancel_agent_session") {
      const session = sessions.get(id);
      if (session) session.status = "cancelled";
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

  test("disposal blocks the native teardown and releases after acknowledgment", async () => {
    pendingResults.clear();
    teardownCalls = 0;
    const id = "disposal-session";
    const { kernelGetObject } = await admitSession(id);
    const { disposeAgentHost, hasLiveAgentSession } = await import("./agent-host");
    pendingResults.add(id);

    await disposeAgentHost();
    expect(teardownCalls).toBe(0);
    expect(hasLiveAgentSession(id)).toBe(true);
    expect(roles.get("orchestrator")).toBe(`pty-${id}`);
    expect((kernelGetObject("agent_session", id) as { status: string }).status).toBe("running");

    pendingResults.delete(id);
    await disposeAgentHost();
    expect(teardownCalls).toBe(1);
    expect(hasLiveAgentSession(id)).toBe(false);
    expect(roles.get("orchestrator")).toBeUndefined();
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
});
