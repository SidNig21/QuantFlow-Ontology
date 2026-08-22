import { describe, expect, mock, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ontologyToolsForRole } from "./ontology-role-tools.ts";
import { setShuttingDown, shouldEmitPtySessionExit } from "./pty.ts";
import { buildMissionActivationInstruction } from "./mission-activation.ts";

type TestLiveEntry = {
  cancelled: boolean;
  definitionId: string;
  guestId: string;
  kind: "native_tui";
  ptySessionId: string;
  turnInFlight: boolean;
};

let testLiveSet: ((sessionId: string, entry: TestLiveEntry) => void) | null = null;
let testLiveDelete: ((sessionId: string) => void) | null = null;
let testPtyWriteHook: ((sessionId: string, data: string) => boolean) | null = null;

mock.module("./pty", () => ({
  writeToSession: (sessionId: string, data: string) => {
    return testPtyWriteHook?.(sessionId, data) ?? true;
  },
}));

mock.module("./host-native-tui", () => ({
  admitNativeTuiDefinition: async (opts: {
    definitionId: string;
    existingSessionId?: string;
    liveSet: (sessionId: string, entry: TestLiveEntry) => void;
    liveDelete: (sessionId: string) => void;
  }) => {
    const sessionId = opts.existingSessionId ?? "test-native-tui";
    const ptySessionId = `pty-${sessionId}`;
    testLiveSet = opts.liveSet;
    testLiveDelete = opts.liveDelete;
    opts.liveSet(sessionId, {
      cancelled: false,
      definitionId: opts.definitionId,
      guestId: ptySessionId,
      kind: "native_tui",
      ptySessionId,
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
  cancelNativeTuiSession: async () => {},
  installNativeTuiPtyExitHook: () => {},
  tearDownNativeTui: async () => {},
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

mock.module("electron", () => ({
  app: { isPackaged: false },
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
}

mock.module("node:sqlite", () => ({ DatabaseSync: BunDatabaseSync }));

describe("R15 production governed-review seams", () => {
  test("critic policy is exact and least privilege", () => {
    const tools = ontologyToolsForRole("critic", [
      { name: "qf_hypothesis_get" }, { name: "qf_run_get" }, { name: "qf_artifact_get" },
      { name: "qf_record_evaluation" }, { name: "qf_publish_artifact" }, { name: "qf_create_task" },
    ]);
    expect(tools.map((tool) => tool.name)).toEqual([
      "qf_hypothesis_get", "qf_run_get", "qf_artifact_get", "qf_record_evaluation",
    ]);
  });

  test("request review crosses preload and Main IPC, and block literals are order-owned", () => {
    const preload = readFileSync(new URL("../preload/shell.ts", import.meta.url), "utf8");
    const main = readFileSync(new URL("./ipc-kernel.ts", import.meta.url), "utf8");
    const gateway = readFileSync(new URL("./ontology-gateway.ts", import.meta.url), "utf8");
    const renderer = readFileSync(new URL("../windows/shell/src/renderer.js", import.meta.url), "utf8");
    expect(preload).toContain('ipcRenderer.invoke("qf:review:request"');
    expect(main).toContain('ipcMain.handle("qf:review:request"');
    expect(main).toContain("kernelFreezeSourceWork");
    expect(main).toContain("admitAndStartSession(\"hermes-critic\")");
    expect(gateway).toContain("kernelRecordGovernedToolReceipt");
    expect(renderer).toContain("window.shellApi.qf.requestReview");
    expect(gateway).toContain("qf_record_evaluation");
  });

  test("production critic Mission uses the exact ordered findings contract", () => {
    const index = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
    expect(index).toContain("non-empty ordered findings array");
    expect(index).toContain("Every finding must contain exactly code, severity, message, and evidence_refs");
    expect(index).toContain("every evidence_refs value must be drawn only from the exact Hypothesis, Run, result Artifact, source Task, or executor ids in frozen source_work");
    expect(index).toContain('"critic",');
    expect(index).not.toContain("plain-text findings");
  });

  test("sidecar shutdown exit preserves the durable Task/session/link snapshot", () => {
    const before = {
      task: { id: "task-1", status: "cancelled" },
      session: { id: "session-1", status: "running" },
      links: [{ kind: "assigned_to", from_id: "task-1", to_id: "session-1" }],
    };
    const after = structuredClone(before);
    const applyPtyExit = () => {
      if (shouldEmitPtySessionExit()) after.session.status = "closed";
    };

    setShuttingDown(true);
    try {
      applyPtyExit();
      expect(after).toEqual(before);

      setShuttingDown(false);
      applyPtyExit();
      expect(after.session.status).toBe("closed");
    } finally {
      setShuttingDown(false);
    }
  });

  test("normal continuation binds worker lineage, admits one review, delivers once, and publishes supports", async () => {
    const {
      getKernelDb,
      kernelContinueGovernedResearchResult,
      kernelExecute,
      kernelRecordGovernedToolReceipt,
      kernelRecordGovernedEvaluation,
      kernelRunGuidedResearch,
      openAppKernel,
    } = await import("./kernel");
    const {
      admitAndStartSession,
      submitAgentSessionInstruction,
    } = await import("./agent-host");
    const artifactRoot = mkdtempSync(join(tmpdir(), "qf-r16-governed-review-"));
    const previousKernelDb = process.env.QF_KERNEL_DB;
    const previousArtifactRoot = process.env.QF_ARTIFACT_ROOT;
    process.env.QF_KERNEL_DB = ":memory:";
    process.env.QF_ARTIFACT_ROOT = artifactRoot;
    const trace = () => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
    const db = openAppKernel();

    try {
      const session = (id: string, definitionId: string, role: string, groups: string[], actor?: string) => {
        if (!db.query("SELECT 1 AS ok FROM agent_definition WHERE id = ?").get(definitionId)) {
          kernelExecute("register_agent_definition", {
            name: definitionId,
            role,
            package_ref: "species/hermes/packed/hermes.aospkg",
            runtime_profile: "default",
            capability_groups: groups,
            display_name: role === "critic" ? "Critic" : role === "orchestrator" ? "Research Director" : "Market Researcher",
          }, trace());
        }
        kernelExecute("create_agent_session", { session_id: id, agent_definition_id: definitionId, label: id }, {
          ...trace(),
          ...(actor ? { actor_session_id: actor } : {}),
        });
        kernelExecute("start_agent_session", { session_id: id }, trace());
      };
      session("director-continuation", "director-continuation-definition", "orchestrator", ["desk.orchestrate"]);
      session("worker-continuation", "worker-continuation-definition", "worker", ["desk.orchestrate"]);
      session("critic-continuation", "hermes-critic", "critic", ["research.evaluate"], "director-continuation");
      await admitAndStartSession("hermes-critic", { existingSessionId: "critic-continuation" });
      const mission = kernelExecute("create_mission", {
        mission_id: "mission-continuation",
        name: "Continuation mission",
        objective: "Exercise the normal governed result boundary.",
      }, trace()) as { object_id: string };
      const bytes = new TextEncoder().encode(JSON.stringify({ contract: "qf.dataset.v1", observations: [{ observed_at: "2026-08-22T00:00:00.000Z", edge: 1 }] }));
      const datasetPath = join(artifactRoot, "dataset.json");
      writeFileSync(datasetPath, bytes);
      const sourceArtifact = kernelExecute("publish_artifact", { kind: "result_set", bytes, storage_ref: datasetPath }, trace()) as { object_id: string };
      const dataset = kernelExecute("register_dataset_version", {
        kind: "results",
        artifact_id: sourceArtifact.object_id,
        content_hash: sourceArtifact.object_id,
        as_of: "2026-08-22T00:00:00.000Z",
        coverage: { deterministic_score_field: "edge" },
      }, trace()) as { object_id: string };
      const hypothesis = kernelExecute("create_hypothesis", {
        claim: "The worker result can be governed.",
        success_criteria: "The critic publishes a supports report.",
        sources: [dataset.object_id],
      }, trace()) as { object_id: string };
      const task = kernelExecute("create_task", {
        task_id: "task-continuation",
        title: "Worker research",
        description: "Complete the governed result.",
        assignee_session_id: "worker-continuation",
      }, { ...trace(), actor_session_id: "director-continuation", mission_id: mission.object_id }) as { object_id: string };
      const run = kernelRunGuidedResearch("worker-continuation", hypothesis.object_id, "worker-evidence");
      expect(run).not.toBeNull();
      if (!run) return;

      const deliveries: Array<{ reviewTaskId: string; sourceWork: Record<string, string> }> = [];
      const writes: Array<{ sessionId: string; data: string; at: number }> = [];
      let deliveredInstruction = "";
      testPtyWriteHook = (sessionId, data) => {
        writes.push({ sessionId, data, at: performance.now() });
        return true;
      };
      const continuation = await kernelContinueGovernedResearchResult({
        source_task_id: task.object_id,
        hypothesis_id: run.hypothesisId,
        run_id: run.runId,
        result_artifact_id: run.artifactId,
        executor_session_id: "worker-continuation",
        critic_session_id: "critic-continuation",
        attempt_id: "continuation-attempt",
        deliver: async (reviewTaskId, sourceWork) => {
          const instruction = buildMissionActivationInstruction(
            reviewTaskId,
            "Independently review this completed deterministic QuantFlow research run.",
            "orchestrator",
          );
          deliveredInstruction = instruction;
          await submitAgentSessionInstruction("critic-continuation", instruction);
          deliveries.push({ reviewTaskId, sourceWork });
        },
      });
      if (writes[1]?.data !== "\r") {
        throw new Error("governed review critic submit write was not accepted");
      }
      expect(writes.map(({ sessionId, data }) => ({ sessionId, data }))).toEqual([
        { sessionId: "pty-critic-continuation", data: deliveredInstruction.slice(0, -1) },
        { sessionId: "pty-critic-continuation", data: "\r" },
      ]);
      expect(writes[0]!.data.endsWith("\r")).toBe(false);
      expect(writes[1]!.at - writes[0]!.at).toBeGreaterThanOrEqual(350);
      expect(deliveries).toHaveLength(1);
      expect(deliveries[0]).toEqual({ reviewTaskId: continuation.review_task_id, sourceWork: continuation.source_work });
      expect(continuation.outcome).toBe("delivered");
      expect(db.query("SELECT COUNT(*) AS n FROM qf_review_source_work WHERE source_task_id = ?").get(task.object_id)).toEqual({ n: 1 });
      expect(db.query("SELECT lifecycle, critic_session_id FROM qf_review_task WHERE task_id = ?").get(continuation.review_task_id)).toEqual({ lifecycle: "running", critic_session_id: "critic-continuation" });
      const runParams = db.query("SELECT params FROM run WHERE id = ?").get(run.runId) as { params: string };
      expect(JSON.parse(runParams.params).executor_session_id).toBe("worker-continuation");
      expect(db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'assigned_to'").all(task.object_id)).toEqual([{ to_id: "worker-continuation" }]);
      expect(db.query("SELECT COUNT(*) AS n FROM qf_review_receipt WHERE task_id = ? AND kind = 'delivery_receipt'").get(continuation.review_task_id)).toEqual({ n: 1 });

      const prepareDeliveryFailureCase = (suffix: string) => {
        const directorId = `director-${suffix}`;
        const workerId = `worker-${suffix}`;
        const criticId = `critic-${suffix}`;
        session(directorId, `${directorId}-definition`, "orchestrator", ["desk.orchestrate"]);
        session(workerId, `${workerId}-definition`, "worker", ["desk.orchestrate"]);
        session(criticId, "hermes-critic", "critic", ["research.evaluate"], directorId);
        const caseMission = kernelExecute("create_mission", {
          mission_id: `mission-${suffix}`,
          name: `Failure ${suffix} mission`,
          objective: "Exercise a rejected governed delivery attempt.",
        }, trace()) as { object_id: string };
        const caseBytes = new TextEncoder().encode(JSON.stringify({
          contract: "qf.dataset.v1",
          suffix,
          observations: [{ observed_at: "2026-08-22T00:00:00.000Z", edge: 1 }],
        }));
        const casePath = join(artifactRoot, `${suffix}.json`);
        writeFileSync(casePath, caseBytes);
        const caseArtifact = kernelExecute("publish_artifact", { kind: "result_set", bytes: caseBytes, storage_ref: casePath }, trace()) as { object_id: string };
        const caseDataset = kernelExecute("register_dataset_version", {
          kind: "results",
          artifact_id: caseArtifact.object_id,
          content_hash: caseArtifact.object_id,
          as_of: "2026-08-22T00:00:00.000Z",
          coverage: { deterministic_score_field: "edge" },
        }, trace()) as { object_id: string };
        const caseHypothesis = kernelExecute("create_hypothesis", {
          claim: `The ${suffix} delivery attempt is governed.`,
          success_criteria: "The critic must receive and submit the instruction.",
          sources: [caseDataset.object_id],
        }, trace()) as { object_id: string };
        const caseTask = kernelExecute("create_task", {
          task_id: `task-${suffix}`,
          title: `Task ${suffix}`,
          description: "Exercise a rejected delivery attempt.",
          assignee_session_id: workerId,
        }, { ...trace(), actor_session_id: directorId, mission_id: caseMission.object_id }) as { object_id: string };
        const caseRun = kernelRunGuidedResearch(workerId, caseHypothesis.object_id, `${suffix}-evidence`);
        expect(caseRun).not.toBeNull();
        if (!caseRun) throw new Error(`missing ${suffix} deterministic run`);
        return { criticId, taskId: caseTask.object_id, run: caseRun };
      };

      const runDeliveryFailureCase = async (suffix: string, falseWrite: number, message: string) => {
        const failureCase = prepareDeliveryFailureCase(suffix);
        await admitAndStartSession("hermes-critic", { existingSessionId: failureCase.criticId });
        const failedWrites: Array<{ sessionId: string; data: string }> = [];
        let writeNumber = 0;
        testPtyWriteHook = (sessionId, data) => {
          writeNumber += 1;
          failedWrites.push({ sessionId, data });
          return writeNumber !== falseWrite;
        };
        const instruction = buildMissionActivationInstruction(
          "pending-review-task",
          `Rejected ${suffix} delivery`,
          "orchestrator",
        );
        const attempt = async () => kernelContinueGovernedResearchResult({
          source_task_id: failureCase.taskId,
          hypothesis_id: failureCase.run.hypothesisId,
          run_id: failureCase.run.runId,
          result_artifact_id: failureCase.run.artifactId,
          executor_session_id: `worker-${suffix}`,
          critic_session_id: failureCase.criticId,
          attempt_id: `${suffix}-attempt`,
          deliver: async (reviewTaskId) => {
            const actualInstruction = buildMissionActivationInstruction(
              reviewTaskId,
              `Rejected ${suffix} delivery`,
              "orchestrator",
            );
            expect(actualInstruction).toBe(instruction.replace("pending-review-task", reviewTaskId));
            await submitAgentSessionInstruction(failureCase.criticId, actualInstruction);
          },
        });
        await expect(attempt()).rejects.toThrow(message);
        const reviewTask = db.query("SELECT task_id FROM qf_review_task WHERE source_task_id = ? ORDER BY created_at DESC LIMIT 1").get(failureCase.taskId) as { task_id: string };
        const failedReceipt = db.query("SELECT payload FROM qf_review_receipt WHERE task_id = ? AND kind = 'delivery_receipt'").get(reviewTask.task_id) as { payload: string };
        expect(JSON.parse(failedReceipt.payload).outcome).toBe("failed");
        expect(db.query("SELECT COUNT(*) AS n FROM qf_review_receipt WHERE task_id = ? AND kind = 'delivery_receipt' AND json_extract(payload, '$.outcome') = 'delivered'").get(reviewTask.task_id)).toEqual({ n: 0 });
        expect(db.query("SELECT COUNT(*) AS n FROM qf_review_invocation WHERE task_id = ?").get(reviewTask.task_id)).toEqual({ n: 0 });
        expect(db.query("SELECT COUNT(*) AS n FROM evaluation WHERE review_task_id = ?").get(reviewTask.task_id)).toEqual({ n: 0 });
        expect(db.query("SELECT COUNT(*) AS n FROM artifact WHERE kind = 'evaluation_findings' AND id IN (SELECT findings_artifact_id FROM evaluation WHERE review_task_id = ?)").get(reviewTask.task_id)).toEqual({ n: 0 });
        expect(db.query("SELECT COUNT(*) AS n FROM qf_review_publication WHERE publication_evaluation_id IN (SELECT id FROM evaluation WHERE review_task_id = ?)").get(reviewTask.task_id)).toEqual({ n: 0 });
        expect(failedWrites[0]?.sessionId).toBe(`pty-${failureCase.criticId}`);
        expect(failedWrites[0]?.data.endsWith("\r")).toBe(false);
        if (falseWrite === 1) expect(failedWrites).toHaveLength(1);
        else expect(failedWrites).toEqual([
          { sessionId: `pty-${failureCase.criticId}`, data: instruction.replace("pending-review-task", reviewTask.task_id).slice(0, -1) },
          { sessionId: `pty-${failureCase.criticId}`, data: "\r" },
        ]);
      };

      await runDeliveryFailureCase("first-write-false", 1, "governed review critic instruction write was not accepted");
      await runDeliveryFailureCase("submit-write-false", 2, "governed review critic submit write was not accepted");

      const readReceipt = (sequence: number, toolName: "qf_hypothesis_get" | "qf_run_get" | "qf_artifact_get" | "qf_record_evaluation", args: Record<string, unknown>) => {
        kernelRecordGovernedToolReceipt({
          invocation_id: `continuation-${sequence}`,
          session_id: "critic-continuation",
          task_id: continuation.review_task_id,
          tool_name: toolName,
          arguments: args,
          result: { ok: true },
          broker_sequence: sequence,
        });
      };
      readReceipt(1, "qf_hypothesis_get", { id: run.hypothesisId });
      readReceipt(2, "qf_run_get", { id: run.runId });
      readReceipt(3, "qf_artifact_get", { id: run.artifactId });
      readReceipt(4, "qf_record_evaluation", { verdict: "supports" });
      const evaluation = kernelRecordGovernedEvaluation({
        hypothesis_id: run.hypothesisId,
        run_id: run.runId,
        artifact_id: run.artifactId,
        review_task_id: continuation.review_task_id,
        source_work: continuation.source_work,
        broker_invocation_id: "continuation-4",
        verdict: "supports",
        rubric: { faithfulness: 0.9, answer_relevancy: 0.9, context_precision: 0.9, context_recall: 0.9 },
        confidence: 0.9,
        rationale: "The worker result is governed and complete.",
        findings: [{ code: "GOVERNED", severity: "info", message: "The exact source work was reviewed.", evidence_refs: [run.artifactId] }],
      }, "critic-continuation");
      expect(evaluation.verdict).toBe("supports");
      expect(evaluation.report_artifact_id).toBeString();
      expect(db.query("SELECT COUNT(*) AS n FROM qf_review_invocation WHERE task_id = ?").get(continuation.review_task_id)).toEqual({ n: 4 });

      const submitInstruction = buildMissionActivationInstruction(
        continuation.review_task_id,
        "changed-target proof",
        "orchestrator",
      );
      testPtyWriteHook = (_sessionId, data) => {
        if (data !== "\r") {
          testLiveSet?.("critic-continuation", {
            cancelled: false,
            definitionId: "hermes-critic",
            guestId: "pty-critic-changed",
            kind: "native_tui",
            ptySessionId: "pty-critic-changed",
            turnInFlight: false,
          });
        }
        return true;
      };
      await expect(
        submitAgentSessionInstruction("critic-continuation", submitInstruction),
      ).rejects.toThrow("target changed");

      await admitAndStartSession("hermes-critic", { existingSessionId: "critic-continuation" });
      testPtyWriteHook = (_sessionId, data) => {
        if (data !== "\r") testLiveDelete?.("critic-continuation");
        return true;
      };
      await expect(
        submitAgentSessionInstruction("critic-continuation", submitInstruction),
      ).rejects.toThrow("no longer live");
    } finally {
      testPtyWriteHook = null;
      testLiveSet = null;
      testLiveDelete = null;
      if (previousKernelDb === undefined) delete process.env.QF_KERNEL_DB;
      else process.env.QF_KERNEL_DB = previousKernelDb;
      if (previousArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
      else process.env.QF_ARTIFACT_ROOT = previousArtifactRoot;
      rmSync(artifactRoot, { recursive: true, force: true });
    }
  });
});
