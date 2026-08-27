import { describe, expect, mock, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PeerRoleRegistry } from "./peer-role-registry";

const roles = new PeerRoleRegistry();
let teardownCalls = 0;
const definitions = new Map<string, Record<string, unknown>>();
const sessions = new Map<string, Record<string, unknown>>();
const tasks = new Map<string, Record<string, unknown>>();

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

class BunDatabaseSync {
  private readonly database: Database;

  constructor(path: string) {
    this.database = new Database(path);
  }

  prepare(sql: string) {
    return this.database.prepare(sql);
  }

  exec(sql: string) {
    return this.database.exec(sql);
  }

  close() {
    this.database.close();
  }
}

mock.module("node:sqlite", () => ({ DatabaseSync: BunDatabaseSync }));

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

function createBus(path: string): Database {
  const db = new Database(path);
  db.exec(`
    CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      from_role TEXT,
      to_role TEXT,
      from_session_id TEXT,
      to_session_id TEXT,
      artifact_id TEXT,
      body TEXT,
      message_kind TEXT DEFAULT 'task',
      reply_to_artifact_id TEXT,
      created_at TEXT,
      delivered INTEGER DEFAULT 0,
      pushed_at TEXT
    )
  `);
  return db;
}

describe("agent-host native-TUI lifecycle admission", () => {
  test("holds teardown for an undelivered result and releases it only after acknowledgment", async () => {
    const busRoot = mkdtempSync(join(tmpdir(), "qf-g5-agent-host-bus-"));
    const busPath = join(busRoot, "peer-bus.db");
    const previousPeerBusDb = process.env.QF_PEER_BUS_DB;
    process.env.QF_PEER_BUS_DB = busPath;
    teardownCalls = 0;
    let bus: Database | null = null;

    try {
      const { admitAndStartSession, closeAgentSessionRow } = await import("./agent-host");
      const { kernelExecute, kernelGetObject } = await import("./kernel");
      registerDefinition(kernelExecute, "hermes-research-director", "orchestrator");
      registerDefinition(kernelExecute, "hermes-worker", "worker");
      createSession(kernelExecute, "director-session", "hermes-research-director");
      createSession(kernelExecute, "worker-session", "hermes-worker");
      const mission = kernelExecute("create_mission", {
        mission_id: "mission-lifecycle",
        name: "Lifecycle falsifier",
        objective: "Protect a delegated result recipient.",
      }, trace()) as { object_id: string };
      kernelExecute("create_task", {
        task_id: "task-lifecycle",
        title: "Complete worker task",
        description: "A result remains pending at the recipient seat.",
        assignee_session_id: "worker-session",
      }, { ...trace(), actor_session_id: "director-session", mission_id: mission.object_id });
      kernelExecute("complete_task", {
        task_id: "task-lifecycle",
        result_artifact_id: "artifact-lifecycle",
      }, { ...trace(), actor_session_id: "worker-session", mission_id: mission.object_id });
      expect((kernelGetObject("task", "task-lifecycle") as { status: string }).status).toBe("done");

      bus = createBus(busPath);
      bus.prepare(`
        INSERT INTO messages
          (id, from_role, to_role, from_session_id, to_session_id, artifact_id, body,
           message_kind, created_at, pushed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `).run(
        "result-message-lifecycle",
        "worker",
        "orchestrator",
        "worker-session",
        "director-session",
        "artifact-lifecycle",
        JSON.stringify({ task_id: "task-lifecycle", artifact_id: "artifact-lifecycle" }),
        "result",
        new Date().toISOString(),
      );

      await admitAndStartSession("hermes-research-director", { existingSessionId: "director-session" });
      expect(roles.get("orchestrator")).toBe("pty-director-session");

      // The worker Task is complete, but completion is intermediate—not delivery.
      expect(() => closeAgentSessionRow("director-session")).toThrow(
        "delegated result remains undelivered",
      );
      expect(teardownCalls).toBe(0);
      expect(roles.get("orchestrator")).toBe("pty-director-session");

      bus.prepare("UPDATE messages SET pushed_at = ? WHERE id = ?")
        .run(new Date().toISOString(), "result-message-lifecycle");
      closeAgentSessionRow("director-session");
      expect(teardownCalls).toBe(1);
      expect(roles.get("orchestrator")).toBeUndefined();
      expect((kernelGetObject("agent_session", "director-session") as { status: string }).status).toBe("closed");
    } finally {
      bus?.close();
      if (previousPeerBusDb === undefined) delete process.env.QF_PEER_BUS_DB;
      else process.env.QF_PEER_BUS_DB = previousPeerBusDb;
      try { rmSync(busRoot, { recursive: true, force: true }); } catch {}
    }
  });
});
