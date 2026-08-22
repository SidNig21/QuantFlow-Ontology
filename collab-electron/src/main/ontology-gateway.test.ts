import { expect, mock, test } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { actionToolForAction, readToolsForObject } from "qf-kernel-schema/mcp";
import { schema } from "qf-kernel-schema";
import {
  bindLiveSeatCapability,
  mintLiveSeatCapability,
  requireLiveSeatCapability,
  revokeLiveSeatCapability,
} from "./live-seat-capability";
import { ontologyTrajectoryContext } from "./ontology-trajectory-context";
import { ontologyReadReceiptEligible } from "./ontology-read-dispatch";
import { ontologyToolsForRole } from "./ontology-role-tools";

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
mock.module("electron", () => ({
  BrowserWindow: { getAllWindows: () => [] },
}));

const {
  getKernelPath,
  kernelGetLinks,
  kernelGetObject,
  kernelExecute,
  openAppKernel,
} = await import("./kernel");
const { registerOntologyGatewayRpc } = await import("./ontology-gateway");

test("only ontology reads receive the Kernel read marker", () => {
  const identity = { sessionId: "session-worker", role: "worker" };
  expect(ontologyTrajectoryContext(identity, "qf_venue_get", true)).toMatchObject({
    actor_session_id: "session-worker",
    ontology_read_tool: "qf_venue_get",
  });
  const action = ontologyTrajectoryContext(identity, "qf_create_agent_session", false);
  expect(action.actor_session_id).toBe("session-worker");
  expect("ontology_read_tool" in action).toBe(false);
});

test("production read dispatch marks market reads but not desk orchestration reads", () => {
  for (const tool of ["qf_agent_session_get", "qf_agent_session_query"]) {
    expect(ontologyReadReceiptEligible(tool, "desk.orchestrate")).toBe(false);
    expect("ontology_read_tool" in ontologyTrajectoryContext(
      { sessionId: "orchestrator", role: "orchestrator" },
      tool,
      ontologyReadReceiptEligible(tool, "desk.orchestrate"),
    )).toBe(false);
  }
  expect(ontologyReadReceiptEligible("qf_venue_get", "market.read")).toBe(true);
  expect(ontologyTrajectoryContext(
    { sessionId: "worker", role: "worker" },
    "qf_venue_get",
    ontologyReadReceiptEligible("qf_venue_get", "market.read"),
  )).toMatchObject({ ontology_read_tool: "qf_venue_get" });
});

test("generic ontology actions expose deterministic execution but not task bypasses", () => {
  const source = readFileSync(new URL("./ontology-gateway.ts", import.meta.url), "utf8");
  const block = /const EXPOSED_ACTIONS = new Set\(\[([\s\S]*?)\]\);/.exec(source)?.[1] ?? "";
  expect(block).toContain("create_agent_session");
  expect(block).toContain("start_agent_session");
  expect(block).toContain("create_hypothesis");
  expect(block).toContain("execute_deterministic_run");
  expect(block).toContain("record_evaluation");
  expect(block).not.toContain("create_task");
  expect(block).not.toContain("complete_task");
});

test("native research roles receive a focused generated ontology surface", () => {
  const tools = [
    { name: "qf_agent_definition_query" },
    { name: "qf_create_agent_session" },
    { name: "qf_start_agent_session" },
    { name: "qf_task_query" },
    { name: "qf_hypothesis_get" },
    { name: "qf_run_get" },
    { name: "qf_artifact_get" },
    { name: "qf_record_evaluation" },
    { name: "qf_market_event_query" },
  ];
  expect(ontologyToolsForRole("orchestrator", tools).map((tool) => tool.name)).toEqual([
    "qf_agent_definition_query",
    "qf_create_agent_session",
    "qf_start_agent_session",
  ]);
  expect(ontologyToolsForRole("critic", tools).map((tool) => tool.name)).toEqual([
    "qf_hypothesis_get",
    "qf_run_get",
    "qf_artifact_get",
    "qf_record_evaluation",
  ]);
  expect(ontologyToolsForRole("worker", tools)).toEqual(tools);
});

test("production list_tools serves action and read schemas for admitted seats", () => {
  const previousKernelDb = process.env.QF_KERNEL_DB;
  const previousArtifactRoot = process.env.QF_ARTIFACT_ROOT;
  const previousPeerBusDb = process.env.QF_PEER_BUS_DB;
  process.env.QF_KERNEL_DB = ":memory:";
  delete process.env.QF_ARTIFACT_ROOT;
  delete process.env.QF_PEER_BUS_DB;
  const issuedCapabilities = new Set<string>();

  try {
    openAppKernel();
    const trace = () => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
    const definition = (
      id: string,
      role: string,
      capabilityGroup: string,
      displayName: string,
    ) => {
      kernelExecute("register_agent_definition", {
        name: id,
        role,
        package_ref: `test:${id}`,
        capability_groups: [capabilityGroup],
        display_name: displayName,
      }, trace());
      kernelExecute("create_agent_session", {
        session_id: `${id}-session`,
        agent_definition_id: id,
        label: role,
      }, trace());
      return `${id}-session`;
    };
    const orchestratorSessionId = definition(
      "test-orchestrator",
      "orchestrator",
      "desk.orchestrate",
      "Orchestrator",
    );
    const marketSessionId = definition(
      "test-market-reader",
      "worker",
      "market.read",
      "Market Researcher",
    );

    const capabilities = new Map<string, string>();
    const admittedSeat = (sessionId: string, role: string): string => {
      const capability = mintLiveSeatCapability(sessionId, role);
      bindLiveSeatCapability(capability, sessionId, role, `pty-${sessionId}`);
      issuedCapabilities.add(capability);
      capabilities.set(sessionId, capability);
      return capability;
    };
    admittedSeat(orchestratorSessionId, "orchestrator");
    admittedSeat(marketSessionId, "worker");
    const requireAdmittedSeat = (
      capability: unknown,
      sessionId: unknown,
      role: unknown,
    ): { sessionId: string; role: string } => {
      const seat = requireLiveSeatCapability(capability, sessionId, role);
      const links = kernelGetLinks(seat.sessionId, { kind: "spawned_from" })
        .filter((link) => link.from_id === seat.sessionId);
      const definitionId = links.length === 1 ? links[0]?.to_id : undefined;
      const row = definitionId ? kernelGetObject("agent_definition", definitionId) : null;
      if (!row || row.role !== seat.role) throw new Error("test seat is not admitted by Kernel identity");
      return { sessionId: seat.sessionId, role: seat.role };
    };

    type RpcHandler = (
      params: unknown,
      context: { signal: AbortSignal },
    ) => unknown | Promise<unknown>;
    const handlers = new Map<string, RpcHandler>();
    registerOntologyGatewayRpc(
      (method, handler) => handlers.set(method, handler as RpcHandler),
      requireAdmittedSeat,
      async () => undefined,
    );
    const listTools = handlers.get("qf.ontology.list_tools");
    if (!listTools) throw new Error("production list_tools handler was not registered");
    const rpcContext = { signal: new AbortController().signal };
    const serve = (sessionId: string, role: string) => listTools({
      seat_capability: capabilities.get(sessionId),
      session_id: sessionId,
      role,
      kernel_db: getKernelPath(),
    }, rpcContext) as { tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> };

    const orchestratorTools = serve(orchestratorSessionId, "orchestrator").tools;
    const createAgentSession = orchestratorTools.find((tool) => tool.name === "qf_create_agent_session");
    expect(createAgentSession).toBeDefined();
    const createAgentSessionAction = schema.actions.find((action) => action.name === "create_agent_session");
    if (!createAgentSessionAction) throw new Error("schema authority is missing create_agent_session");
    expect(createAgentSession).toEqual(actionToolForAction(createAgentSessionAction));
    expect(Object.keys(createAgentSession!.inputSchema.properties as Record<string, unknown>)).toEqual([
      "session_id",
      "agent_definition_id",
      "label",
    ]);
    expect(createAgentSession!.inputSchema.required).toEqual([
      "session_id",
      "agent_definition_id",
    ]);

    const marketTools = serve(marketSessionId, "worker").tools;
    const venueGet = marketTools.find((tool) => tool.name === "qf_venue_get");
    expect(venueGet).toBeDefined();
    const venue = schema.objects.find((object) => object.name === "venue");
    if (!venue) throw new Error("schema authority is missing venue");
    const expectedVenueGet = readToolsForObject(venue).find((tool) => tool.name === "qf_venue_get");
    expect(expectedVenueGet).toBeDefined();
    expect(venueGet).toEqual(expectedVenueGet);
  } finally {
    for (const capability of issuedCapabilities) {
      revokeLiveSeatCapability(capability);
    }
    if (previousKernelDb === undefined) delete process.env.QF_KERNEL_DB;
    else process.env.QF_KERNEL_DB = previousKernelDb;
    if (previousArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = previousArtifactRoot;
    if (previousPeerBusDb === undefined) delete process.env.QF_PEER_BUS_DB;
    else process.env.QF_PEER_BUS_DB = previousPeerBusDb;
  }
});
