import { describe, expect, mock, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ontologyToolsForRole } from "./ontology-role-tools.ts";
import { setShuttingDown, shouldEmitPtySessionExit } from "./pty.ts";

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
    const artifactRoot = mkdtempSync(join(tmpdir(), "qf-r16-governed-review-"));
    const previousKernelDb = process.env.QF_KERNEL_DB;
    const previousArtifactRoot = process.env.QF_ARTIFACT_ROOT;
    process.env.QF_KERNEL_DB = ":memory:";
    process.env.QF_ARTIFACT_ROOT = artifactRoot;
    const trace = () => ({ trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
    const db = openAppKernel();

    try {
      const session = (id: string, definitionId: string, role: string, groups: string[], actor?: string) => {
        kernelExecute("register_agent_definition", {
          name: definitionId,
          role,
          package_ref: "species/hermes/packed/hermes.aospkg",
          runtime_profile: "default",
          capability_groups: groups,
          display_name: role === "critic" ? "Critic" : role === "orchestrator" ? "Research Director" : "Market Researcher",
        }, trace());
        kernelExecute("create_agent_session", { session_id: id, agent_definition_id: definitionId, label: id }, {
          ...trace(),
          ...(actor ? { actor_session_id: actor } : {}),
        });
        kernelExecute("start_agent_session", { session_id: id }, trace());
      };
      session("director-continuation", "director-continuation-definition", "orchestrator", ["desk.orchestrate"]);
      session("worker-continuation", "worker-continuation-definition", "worker", ["desk.orchestrate"]);
      session("critic-continuation", "hermes-critic", "critic", ["research.evaluate"], "director-continuation");
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
      const continuation = await kernelContinueGovernedResearchResult({
        source_task_id: task.object_id,
        hypothesis_id: run.hypothesisId,
        run_id: run.runId,
        result_artifact_id: run.artifactId,
        executor_session_id: "worker-continuation",
        critic_session_id: "critic-continuation",
        attempt_id: "continuation-attempt",
        deliver: async (reviewTaskId, sourceWork) => {
          deliveries.push({ reviewTaskId, sourceWork });
        },
      });
      expect(deliveries).toHaveLength(1);
      expect(deliveries[0]).toEqual({ reviewTaskId: continuation.review_task_id, sourceWork: continuation.source_work });
      expect(continuation.outcome).toBe("delivered");
      expect(db.query("SELECT COUNT(*) AS n FROM qf_review_source_work WHERE source_task_id = ?").get(task.object_id)).toEqual({ n: 1 });
      expect(db.query("SELECT lifecycle, critic_session_id FROM qf_review_task WHERE task_id = ?").get(continuation.review_task_id)).toEqual({ lifecycle: "running", critic_session_id: "critic-continuation" });
      const runParams = db.query("SELECT params FROM run WHERE id = ?").get(run.runId) as { params: string };
      expect(JSON.parse(runParams.params).executor_session_id).toBe("worker-continuation");
      expect(db.query("SELECT to_id FROM links WHERE from_id = ? AND kind = 'assigned_to'").all(task.object_id)).toEqual([{ to_id: "worker-continuation" }]);
      expect(db.query("SELECT COUNT(*) AS n FROM qf_review_receipt WHERE task_id = ? AND kind = 'delivery_receipt'").get(continuation.review_task_id)).toEqual({ n: 1 });

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
    } finally {
      if (previousKernelDb === undefined) delete process.env.QF_KERNEL_DB;
      else process.env.QF_KERNEL_DB = previousKernelDb;
      if (previousArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
      else process.env.QF_ARTIFACT_ROOT = previousArtifactRoot;
      rmSync(artifactRoot, { recursive: true, force: true });
    }
  });
});
