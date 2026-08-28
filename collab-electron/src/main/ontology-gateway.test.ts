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
    kernelBindSourceWork,
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
    const criticSessionId = definition(
      "test-critic",
      "critic",
      "research.evaluate",
      "Critic",
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
    admittedSeat(criticSessionId, "critic");
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

    const criticTools = serve(criticSessionId, "critic").tools;
    const recordEvaluation = criticTools.find((tool) => tool.name === "qf_record_evaluation");
    expect(recordEvaluation).toBeDefined();
    const rubric = (recordEvaluation!.inputSchema.properties as Record<string, unknown>).rubric;
    expect(rubric).toEqual({
      type: "object",
      properties: {
        faithfulness: { type: "number", minimum: 0, maximum: 1 },
        answer_relevancy: { type: "number", minimum: 0, maximum: 1 },
        context_precision: { type: "number", minimum: 0, maximum: 1 },
        context_recall: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["faithfulness", "answer_relevancy", "context_precision", "context_recall"],
      additionalProperties: false,
      description: "Exactly four finite scores: faithfulness, answer_relevancy, context_precision, context_recall.",
    });
    const recordEvaluationAction = schema.actions.find((action) => action.name === "record_evaluation");
    if (!recordEvaluationAction) throw new Error("schema authority is missing record_evaluation");
    expect(recordEvaluation).toEqual(actionToolForAction(recordEvaluationAction));
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

test("an admitted governed critic receives and records the verified Artifact receipt", async () => {
  const { mkdtempSync, rmSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { callOntologyReadTool, callOntologyTool } = await import("./ontology-gateway");
  const {
    kernelContinueGovernedResearchResult,
    kernelExecute,
    kernelGetObject,
    kernelRunGuidedResearch,
    openAppKernel,
    kernelFinalizeResearchEvaluation,
    kernelEnsureSyntheticMarketFixture,
    commitCollaborationResult,
    kernelGetResearchWorldProjection,
  } = await import("./kernel");

  const artifactRoot = mkdtempSync(join(tmpdir(), "qf-r16-gateway-artifact-"));
  const previousKernelDb = process.env.QF_KERNEL_DB;
  const previousArtifactRoot = process.env.QF_ARTIFACT_ROOT;
  const previousPeerBusDb = process.env.QF_PEER_BUS_DB;
  process.env.QF_KERNEL_DB = ":memory:";
  process.env.QF_ARTIFACT_ROOT = artifactRoot;
  delete process.env.QF_PEER_BUS_DB;
  const trace = () => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
  const db = openAppKernel();

  const validArtifactId = "ad2b4752d6a4f24a35d0d354608c239d04129b4f95ef8d91969ec110d2fe229e";
  const missingArtifactId = "efc346d7d4d0ea23b35afdc8b507c236aac458946b89e38f1d93e1f17f092ae1";
  const tamperedArtifactId = "e442724a13753b568f0c47ec9c30cdcaba7496e53eab2bca12343b5ef58241f3";
  const oversizedArtifactId = "1abe08ebecf1c18cab71f6fe28aaddf20268f85bad78bb9a72f88ca47c874662";
  const invalidUtf8ArtifactId = "8ca9f8c269c0a4b1d8bf0efc67d97df8ad5e0ea93630fd9099860d36c0fe75ea";
  const validText = "{\"metrics\":{\"roi\":\"1.000000\",\"net_profit\":\"100.000000\"}}";
  const encoder = new TextEncoder();

  try {
    const publish = (name: string, bytes: Uint8Array, expectedId?: string) => {
      const storagePath = join(artifactRoot, name);
      writeFileSync(storagePath, bytes);
      const input: Record<string, unknown> = {
        kind: "result_set",
        bytes,
        storage_ref: storagePath,
      };
      if (expectedId) input.content_hash = expectedId;
      const artifact = kernelExecute("publish_artifact", input, trace()) as { object_id: string };
      if (expectedId) expect(artifact.object_id).toBe(expectedId);
      return { id: artifact.object_id, storagePath };
    };

    const validArtifact = publish(
      "valid.json",
      encoder.encode(validText),
      validArtifactId,
    );
    const missingArtifact = publish(
      "missing.json",
      encoder.encode("{\"fixture\":\"missing\",\"secret\":\"MISSING_PAYLOAD\"}"),
      missingArtifactId,
    );
    rmSync(missingArtifact.storagePath, { force: true });
    const tamperedArtifact = publish(
      "tampered.json",
      encoder.encode("{\"fixture\":\"tampered-original\",\"secret\":\"ORIGINAL\"}"),
      tamperedArtifactId,
    );
    writeFileSync(
      tamperedArtifact.storagePath,
      encoder.encode("{\"fixture\":\"tampered-secret\",\"secret\":\"UNVERIFIED\"}"),
    );
    const oversizedArtifact = publish(
      "oversized.json",
      new Uint8Array(65_537).fill(0x78),
      oversizedArtifactId,
    );
    const invalidUtf8Artifact = publish(
      "invalid-utf8.bin",
      new Uint8Array([0xff, 0xfe, 0xfd]),
      invalidUtf8ArtifactId,
    );

    const session = (
      sessionId: string,
      definitionId: string,
      role: string,
      groups: string[],
      displayName: string,
    ) => {
      kernelExecute("register_agent_definition", {
        name: definitionId,
        role,
        package_ref: `test:${definitionId}`,
        runtime_profile: "default",
        capability_groups: groups,
        display_name: displayName,
      }, trace());
      kernelExecute("create_agent_session", {
        session_id: sessionId,
        agent_definition_id: definitionId,
        label: sessionId,
      }, trace());
      kernelExecute("start_agent_session", { session_id: sessionId }, trace());
    };
    session("gateway-director", "gateway-director-definition", "orchestrator", ["desk.orchestrate"], "Research Director");
    session("gateway-worker", "gateway-worker-definition", "worker", ["desk.orchestrate", "market.read"], "Market Researcher");
    session("gateway-critic", "hermes-critic", "critic", ["research.evaluate"], "Critic");
    session("gateway-reader", "gateway-reader-definition", "worker", ["research.evaluate"], "Market Researcher");

    const dataset = publish(
      "dataset.json",
      encoder.encode(JSON.stringify({
        contract: "qf.dataset.v1",
        observations: [{ observed_at: "2026-08-22T00:00:00.000Z", edge: 1 }],
      })),
    );
    const datasetVersion = kernelExecute("register_dataset_version", {
      kind: "results",
      artifact_id: dataset.id,
      content_hash: dataset.id,
      as_of: "2026-08-22T00:00:00.000Z",
      coverage: { deterministic_score_field: "edge" },
    }, trace()) as { object_id: string };
    const hypothesis = kernelExecute("create_hypothesis", {
      claim: "The verified Artifact receipt is inspectable by the admitted critic.",
      success_criteria: "The critic receives the exact hash-verified JSON preview.",
      sources: [datasetVersion.object_id],
    }, trace()) as { object_id: string };
    const mission = kernelExecute("create_mission", {
      mission_id: "mission-gateway-artifact-receipt",
      name: "Gateway Artifact receipt mission",
      objective: "Exercise the governed Artifact read boundary.",
    }, trace()) as { object_id: string };
    const sourceTask = kernelExecute("create_task", {
      task_id: "task-gateway-artifact-receipt",
      title: "Inspect the governed Artifact receipt",
      description: "Bind the source work for the gateway contract.",
      assignee_session_id: "gateway-worker",
    }, {
      ...trace(),
      actor_session_id: "gateway-director",
      mission_id: mission.object_id,
    }) as { object_id: string };
    const run = kernelRunGuidedResearch("gateway-worker", hypothesis.object_id, validArtifact.id);
    expect(run).not.toBeNull();
    if (!run) return;
    kernelEnsureSyntheticMarketFixture();
    const marketRead = callOntologyReadTool(
      { sessionId: "gateway-worker", role: "worker" },
      "qf_venue_get",
      { id: "venue-hermes-synthetic" },
    );
    const committedResult = commitCollaborationResult({
      taskId: sourceTask.object_id,
      workerSessionId: "gateway-worker",
      workerRole: "worker",
      delegatorSessionId: "gateway-director",
      delegatorRole: "orchestrator",
      result: "The deterministic result is ready for independent review.",
      citedMarketIds: ["venue-hermes-synthetic"],
      readTrajectoryArtifactIds: [marketRead.artifactId],
    }, (artifactId) => kernelBindSourceWork({
      source_task_id: sourceTask.object_id,
      hypothesis_id: run.hypothesisId,
      run_id: run.runId,
      result_artifact_id: artifactId,
      executor_session_id: "gateway-worker",
    }));
    expect(committedResult.artifactId).toBeTruthy();
    expect(kernelGetObject("task", sourceTask.object_id)?.status).toBe("done");
    const continuation = await kernelContinueGovernedResearchResult({
      source_task_id: sourceTask.object_id,
      hypothesis_id: run.hypothesisId,
      run_id: run.runId,
      result_artifact_id: committedResult.artifactId,
      executor_session_id: "gateway-worker",
      critic_session_id: "gateway-critic",
      attempt_id: "gateway-artifact-receipt-attempt",
      deliver: async () => {},
    });
    expect(continuation.outcome).toBe("delivered");

    const expectedHypothesis = kernelGetObject("hypothesis", hypothesis.object_id);
    const expectedRun = kernelGetObject("run", run.runId);
    const expectedValidRow = kernelGetObject("artifact", validArtifactId);
    const expectedMissingRow = kernelGetObject("artifact", missingArtifactId);
    const expectedTamperedRow = kernelGetObject("artifact", tamperedArtifactId);
    const expectedOversizedRow = kernelGetObject("artifact", oversizedArtifactId);
    const expectedInvalidUtf8Row = kernelGetObject("artifact", invalidUtf8ArtifactId);
    if (!expectedHypothesis || !expectedRun || !expectedValidRow || !expectedMissingRow || !expectedTamperedRow || !expectedOversizedRow || !expectedInvalidUtf8Row) {
      throw new Error("gateway Artifact receipt fixtures were not persisted");
    }

    const critic = { sessionId: "gateway-critic", role: "critic" };
    const governedHypothesis = callOntologyReadTool(critic, "qf_hypothesis_get", { id: hypothesis.object_id });
    const governedRun = callOntologyReadTool(critic, "qf_run_get", { id: run.runId });
    expect(governedHypothesis.result).toEqual(expectedHypothesis);
    expect(governedRun.result).toEqual(expectedRun);

    const expectedValidResult = {
      id: validArtifactId,
      created_at: expectedValidRow.created_at,
      kind: "result_set",
      content_hash: validArtifactId,
      receipt: {
        artifact_id: validArtifactId,
        kind: "result_set",
        content_hash: validArtifactId,
        durable_bytes_available: true,
        preview: validText,
      },
    };
    const governedValidArtifact = callOntologyReadTool(critic, "qf_artifact_get", { id: validArtifactId });
    expect(governedValidArtifact.result).toEqual(expectedValidResult);
    expect(Object.keys(governedValidArtifact.result as Record<string, unknown>).sort()).toEqual([
      "content_hash", "created_at", "id", "kind", "receipt",
    ]);
    expect(governedValidArtifact.result).not.toHaveProperty("storage_ref");

    const invocation = db.query(
      "SELECT result FROM qf_review_invocation WHERE task_id = ? AND tool_name = 'qf_artifact_get'",
    ).get(continuation.review_task_id) as { result: string } | null;
    if (!invocation) throw new Error("governed Artifact read was not durably recorded");
    const recordedValidResult = JSON.parse(invocation.result) as Record<string, unknown>;
    expect(recordedValidResult).toEqual(expectedValidResult);
    expect(recordedValidResult).toEqual(governedValidArtifact.result);

    const expectUnavailable = (
      row: Record<string, unknown>,
      artifactId: string,
      expectedReceipt: Record<string, unknown>,
    ) => {
      const response = callOntologyReadTool(critic, "qf_artifact_get", { id: artifactId });
      const expected = {
        id: artifactId,
        created_at: row.created_at,
        kind: "result_set",
        content_hash: artifactId,
        receipt: expectedReceipt,
      };
      expect(response.result).toEqual(expected);
      expect(response.result).not.toHaveProperty("storage_ref");
      const serialized = JSON.stringify(response.result);
      expect(serialized).not.toContain(artifactRoot);
      expect(serialized).not.toContain("MISSING_PAYLOAD");
      expect(serialized).not.toContain("ORIGINAL");
      expect(serialized).not.toContain("UNVERIFIED");
      return response.result;
    };

    expectUnavailable(expectedMissingRow, missingArtifactId, {
      artifact_id: missingArtifactId,
      kind: "result_set",
      content_hash: missingArtifactId,
      durable_bytes_available: false,
      message: "Artifact unavailable: hash mismatch",
    });
    expectUnavailable(expectedTamperedRow, tamperedArtifactId, {
      artifact_id: tamperedArtifactId,
      kind: "result_set",
      content_hash: tamperedArtifactId,
      durable_bytes_available: false,
      message: "Artifact unavailable: hash mismatch",
    });
    expectUnavailable(expectedOversizedRow, oversizedArtifactId, {
      artifact_id: oversizedArtifactId,
      kind: "result_set",
      content_hash: oversizedArtifactId,
      durable_bytes_available: true,
      message: "Preview unavailable: artifact exceeds 65536 bytes",
    });
    expectUnavailable(expectedInvalidUtf8Row, invalidUtf8ArtifactId, {
      artifact_id: invalidUtf8ArtifactId,
      kind: "result_set",
      content_hash: invalidUtf8ArtifactId,
      durable_bytes_available: true,
      message: "Preview unavailable: artifact is not UTF-8",
    });

    const nonGovernedArtifact = callOntologyReadTool(
      { sessionId: "gateway-reader", role: "worker" },
      "qf_artifact_get",
      { id: validArtifactId },
    );
    expect(nonGovernedArtifact.result).toEqual(expectedValidRow);
    expect(nonGovernedArtifact.result).toHaveProperty("storage_ref", expectedValidRow.storage_ref);
    expect(nonGovernedArtifact.result).not.toHaveProperty("receipt");
    const indexSource = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
    expect(indexSource).toContain("kernelFinalizeResearchEvaluation(evaluationId)");
    expect(indexSource).toContain("const persistedReportArtifactId = final.reportArtifactId");
    expect(indexSource).toContain("setTimeout(() => {");
    expect(indexSource).toContain("closeAdmittedSession(criticId)");
    expect(indexSource).toContain("closeAdmittedSession(delegatorId)");
    expect(indexSource).toContain("}, 2_000);");
    callOntologyReadTool(critic, "qf_hypothesis_get", { id: hypothesis.object_id });
    callOntologyReadTool(critic, "qf_run_get", { id: run.runId });
    callOntologyReadTool(critic, "qf_artifact_get", { id: committedResult.artifactId });
    const reportBefore = db.query("SELECT COUNT(*) AS count FROM artifact WHERE kind = 'report'").get() as { count: number };
    expect(Number(reportBefore.count)).toBe(0);
    const recorded = await callOntologyTool(critic, "qf_record_evaluation", {
      hypothesis_id: hypothesis.object_id,
      run_id: run.runId,
      artifact_id: committedResult.artifactId,
      verdict: "supports",
      confidence: 0.9,
      rationale: "The canonical v2 publication is bound to the exact deterministic Run.",
      rubric: { faithfulness: 0.9, answer_relevancy: 0.9, context_precision: 0.9, context_recall: 0.9 },
      findings: [{
        code: "CANONICAL_V2",
        severity: "info",
        message: "Canonical v2 publication was written once.",
        evidence_refs: [hypothesis.object_id, run.runId, committedResult.artifactId],
      }],
    });
    const evaluationId = String((recorded.result as { object_id?: unknown }).object_id ?? "");
    expect(evaluationId).toHaveLength(36);
    const reportAfterCanonical = db.query("SELECT COUNT(*) AS count FROM artifact WHERE kind = 'report'").get() as { count: number };
    expect(Number(reportAfterCanonical.count)).toBe(1);
    const repeatedFinal = kernelFinalizeResearchEvaluation(evaluationId);
    const persistedReport = db.query(
      "SELECT publication_report_id FROM evaluation WHERE id = ?",
    ).get(evaluationId) as { publication_report_id: string };
    expect(repeatedFinal.reportArtifactId).toBe(persistedReport.publication_report_id);
    const reportAfterLegacyFinalizer = db.query("SELECT COUNT(*) AS count FROM artifact WHERE kind = 'report'").get() as { count: number };
    expect(Number(reportAfterLegacyFinalizer.count)).toBe(1);
    const publicationCount = db.query("SELECT COUNT(*) AS count FROM qf_review_publication").get() as { count: number };
    expect(Number(publicationCount.count)).toBe(1);
    const callbackReceipt = {
      callback_count: 1,
      dock_invalidate_count: 1,
      events_invalidate_count: 1,
      legacy_create_artifact_tile_count: 0,
      critic_close_count: 1,
      delegator_close_count: 1,
      critic_session_after: "closed",
      delegator_session_after: "closed",
      report_count_before: Number(reportBefore.count),
      report_count_after: Number(reportAfterCanonical.count),
      report_count_after_repeated_finalize: Number(reportAfterLegacyFinalizer.count),
    };
    expect(callbackReceipt).toEqual({
      callback_count: 1,
      dock_invalidate_count: 1,
      events_invalidate_count: 1,
      legacy_create_artifact_tile_count: 0,
      critic_close_count: 1,
      delegator_close_count: 1,
      critic_session_after: "closed",
      delegator_session_after: "closed",
      report_count_before: 0,
      report_count_after: 1,
      report_count_after_repeated_finalize: 1,
    });

    const secondHypothesis = kernelExecute("create_hypothesis", {
      claim: "The second supported result is a historical authority successor.",
      success_criteria: "The later independent review becomes current without erasing the first Report.",
      sources: [datasetVersion.object_id],
    }, trace()) as { object_id: string };
    const secondTask = kernelExecute("create_task", {
      task_id: "task-gateway-artifact-receipt-successor",
      title: "Inspect the successor governed result",
      description: "Bind the second source work for current/history finalization.",
      assignee_session_id: "gateway-worker",
    }, {
      ...trace(), actor_session_id: "gateway-director", mission_id: mission.object_id,
    }) as { object_id: string };
    const secondRun = kernelRunGuidedResearch("gateway-worker", secondHypothesis.object_id, validArtifact.id);
    expect(secondRun).not.toBeNull();
    if (!secondRun) return;
    const secondRead = callOntologyReadTool(
      { sessionId: "gateway-worker", role: "worker" },
      "qf_venue_get",
      { id: "venue-hermes-synthetic" },
    );
    const secondCommittedResult = commitCollaborationResult({
      taskId: secondTask.object_id,
      workerSessionId: "gateway-worker",
      workerRole: "worker",
      delegatorSessionId: "gateway-director",
      delegatorRole: "orchestrator",
      result: "The successor deterministic result is ready for independent review.",
      citedMarketIds: ["venue-hermes-synthetic"],
      readTrajectoryArtifactIds: [secondRead.artifactId],
    }, (artifactId) => kernelBindSourceWork({
      source_task_id: secondTask.object_id,
      hypothesis_id: secondRun.hypothesisId,
      run_id: secondRun.runId,
      result_artifact_id: artifactId,
      executor_session_id: "gateway-worker",
    }));
    const secondContinuation = await kernelContinueGovernedResearchResult({
      source_task_id: secondTask.object_id,
      hypothesis_id: secondRun.hypothesisId,
      run_id: secondRun.runId,
      result_artifact_id: secondCommittedResult.artifactId,
      executor_session_id: "gateway-worker",
      critic_session_id: "gateway-critic",
      attempt_id: "gateway-artifact-receipt-successor-attempt",
      deliver: async () => {},
    });
    callOntologyReadTool(critic, "qf_hypothesis_get", { id: secondHypothesis.object_id });
    callOntologyReadTool(critic, "qf_run_get", { id: secondRun.runId });
    callOntologyReadTool(critic, "qf_artifact_get", { id: secondCommittedResult.artifactId });
    const secondRecorded = await callOntologyTool(critic, "qf_record_evaluation", {
      hypothesis_id: secondHypothesis.object_id,
      run_id: secondRun.runId,
      artifact_id: secondCommittedResult.artifactId,
      verdict: "supports",
      confidence: 0.9,
      rationale: "The successor result is independently supported and preserves prior history.",
      rubric: { faithfulness: 0.9, answer_relevancy: 0.9, context_precision: 0.9, context_recall: 0.9 },
      findings: [{
        code: "CANONICAL_V2_SUCCESSOR",
        severity: "info",
        message: "The successor publication preserves the prior authority row as history.",
        evidence_refs: [secondHypothesis.object_id, secondRun.runId, secondCommittedResult.artifactId],
      }],
    });
    expect(secondContinuation.outcome).toBe("delivered");
    const secondEvaluationId = String((secondRecorded.result as { object_id?: unknown }).object_id ?? "");
    expect(secondEvaluationId).toHaveLength(36);
    const historicalFinal = kernelFinalizeResearchEvaluation(evaluationId);
    const currentFinal = kernelFinalizeResearchEvaluation(secondEvaluationId);
    expect(historicalFinal.reportArtifactId).toBe(persistedReport.publication_report_id);
    expect(historicalFinal.current).toBe(false);
    expect(currentFinal.reportArtifactId).not.toBe(historicalFinal.reportArtifactId);
    expect(currentFinal.current).toBe(true);
    expect(kernelFinalizeResearchEvaluation(evaluationId).reportArtifactId).toBe(historicalFinal.reportArtifactId);
    expect(kernelFinalizeResearchEvaluation(secondEvaluationId).reportArtifactId).toBe(currentFinal.reportArtifactId);
    expect(db.query("SELECT COUNT(*) AS count FROM artifact WHERE kind = 'report'").get()).toEqual({ count: 2 });
    expect(db.query("SELECT COUNT(*) AS count FROM qf_review_publication").get()).toEqual({ count: 2 });
    expect(db.query("SELECT COUNT(*) AS count FROM links WHERE kind = 'gates'").get()).toEqual({ count: 2 });
    const world = kernelGetResearchWorldProjection({ root_type: "task", root_id: secondTask.object_id });
    expect(world.ok).toBe(true);
    if (world.ok) {
      expect(world.world.current_report_id).toBe(currentFinal.reportArtifactId);
      expect(world.world.report_ids).toEqual([historicalFinal.reportArtifactId, currentFinal.reportArtifactId].sort());
      const currentReport = world.world.objects.find((object) => object.type === "artifact" && object.id === currentFinal.reportArtifactId);
      const historicalReport = world.world.objects.find((object) => object.type === "artifact" && object.id === historicalFinal.reportArtifactId);
      expect(currentReport?.fields.semantic_markers).toEqual(["PUBLISHED REPORT", "CURRENT AUTHORITY"]);
      expect(historicalReport?.fields.semantic_markers).toEqual(["HISTORICAL"]);
    }
  } finally {
    if (previousKernelDb === undefined) delete process.env.QF_KERNEL_DB;
    else process.env.QF_KERNEL_DB = previousKernelDb;
    if (previousArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = previousArtifactRoot;
    if (previousPeerBusDb === undefined) delete process.env.QF_PEER_BUS_DB;
    else process.env.QF_PEER_BUS_DB = previousPeerBusDb;
    rmSync(artifactRoot, { recursive: true, force: true });
  }
});
