import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  bindSourceWork,
  closeKernel,
  execute,
  markGovernedDelivery,
  openKernel,
  recordGovernedToolReceipt,
  requestGovernedReview,
  type KernelDb,
} from "qf-kernel";
import { getResearchWorldProjection } from "./research-world-projection";

const trace = { trace_id: "research-world-test", span_id: "research-world-test-span" };

function kernel(): KernelDb {
  return openKernel(":memory:");
}

function completeWorkerTask(db: KernelDb, root: string, taskId: string, workerId: string, label: string, sourceWork: { source_task_id: string; hypothesis_id: string; run_id: string; result_artifact_id: string; executor_session_id: string }): void {
  const readBytes = new TextEncoder().encode(JSON.stringify({
    contract: "qf.ontology.v1", tool: "qf_venue_get", arguments: { id: `venue-${label}` },
    result: { id: `venue-${label}` }, session_id: workerId, role: "worker",
    created_at: "2026-08-28T00:00:00.000Z", nonce: `${label}-read-nonce`,
  }));
  const readPath = join(root, `${label}-read.json`);
  writeFileSync(readPath, readBytes);
  const read = execute(db, "publish_artifact", {
    kind: "trajectory", bytes: readBytes, storage_ref: readPath,
    links: [{ kind: "produces", from_id: workerId }],
  }, { trace_id: `${label}-trace`, span_id: `${label}-read-span`, actor_session_id: workerId, ontology_read_tool: "qf_venue_get" } as never);
  const resultBytes = new TextEncoder().encode(JSON.stringify({
    contract: "qf.collaboration.v1", kind: "result", task_id: taskId,
    from_session_id: workerId, result: "completed",
  }));
  const resultPath = join(root, `${label}-result-trajectory.json`);
  writeFileSync(resultPath, resultBytes);
  const result = execute(db, "publish_artifact", {
    kind: "trajectory", bytes: resultBytes, storage_ref: resultPath,
    links: [{ kind: "produces", from_id: workerId }, { kind: "derived_from", to_id: read.object_id }],
  }, { trace_id: `${label}-trace`, span_id: `${label}-result-span`, actor_session_id: workerId });
  sourceWork.result_artifact_id = result.object_id;
  bindSourceWork(db, sourceWork, { trace_id: `${label}-trace`, span_id: `${label}-bind-span` });
  execute(db, "complete_task", { task_id: taskId, result_artifact_id: result.object_id }, {
    trace_id: `${label}-trace`, span_id: `${label}-complete-span`, actor_session_id: workerId,
  });
}

describe("Main research-world projection", () => {
  test("returns exact root errors and honest empty-world facts", () => {
    const db = kernel();
    expect(getResearchWorldProjection(db, { root_type: "mission", root_id: "missing" })).toEqual({
      ok: false, code: "WORLD_ROOT_NOT_FOUND", message: "Research world root not found: missing",
    });
    execute(db, "create_mission", { mission_id: "mission-empty", name: "Empty", objective: "No task yet" }, trace);
    const result = getResearchWorldProjection(db, { root_type: "mission", root_id: "mission-empty" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.world.missing_lineage).toEqual([{ owning_type: "mission", owning_id: "mission-empty", kind: "belongs_to", message: "No linked research Task yet." }]);
    closeKernel(db);
  });

  test("returns a frozen value snapshot with no filesystem path in Artifact receipts", () => {
    const db = kernel();
    execute(db, "create_mission", { mission_id: "mission-snapshot", name: "Snapshot", objective: "Read-only" }, trace);
    const result = getResearchWorldProjection(db, { root_type: "mission", root_id: "mission-snapshot" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.isFrozen(result.world)).toBe(true);
      expect(JSON.stringify(result.world)).not.toContain("storage_ref");
    }
    closeKernel(db);
  });

  test("projects the complete normal governed world as 13 objects and 15 links", () => {
    const root = mkdtempSync(join(tmpdir(), "qf-r16-world-test-"));
    const previousArtifactRoot = process.env.QF_ARTIFACT_ROOT;
    process.env.QF_ARTIFACT_ROOT = root;
    const db = kernel();
    const localTrace = { trace_id: "normal-world-trace", span_id: "normal-world-span" };
    const session = (id: string, definitionId: string, role: string, groups: string[], actorSessionId?: string) => {
      execute(db, "register_agent_definition", {
        name: definitionId,
        role,
        package_ref: "species/hermes/packed/hermes.aospkg",
        runtime_profile: "default",
        capability_groups: groups,
        display_name: role === "orchestrator" ? "Research Director" : role === "critic" ? "Critic" : "Market Researcher",
      }, localTrace);
      execute(db, "create_agent_session", { session_id: id, agent_definition_id: definitionId, label: id }, { ...localTrace, ...(actorSessionId ? { actor_session_id: actorSessionId } : role === "worker" ? { actor_session_id: "director-world" } : {}) });
      execute(db, "start_agent_session", { session_id: id }, localTrace);
    };

    try {
      session("director-world", "director-world-definition", "orchestrator", ["desk.orchestrate"]);
      session("worker-world", "worker-world-definition", "worker", ["desk.orchestrate"]);
      session("critic-world", "hermes-critic", "critic", ["research.evaluate"], "director-world");
      expect(db.query("SELECT 1 AS ok FROM links WHERE kind = 'delegates_to' AND from_id = ? AND to_id = ?").get("director-world", "critic-world")).toEqual({ ok: 1 });
      const mission = execute(db, "create_mission", {
        mission_id: "mission-normal-world",
        name: "Normal governed world",
        objective: "Prove the complete durable research loop.",
      }, localTrace);
      const hypothesis = execute(db, "create_hypothesis", {
        claim: "The normal governed world is complete.",
        success_criteria: "The exact durable lineage is visible.",
      }, localTrace);
      const sourceBytes = new TextEncoder().encode(JSON.stringify({
        contract: "qf.dataset.v1",
        observations: [{ observed_at: "2026-08-22T00:00:00.000Z", edge: 1 }],
      }));
      const sourcePath = join(root, "dataset.json");
      writeFileSync(sourcePath, sourceBytes);
      const sourceArtifact = execute(db, "publish_artifact", {
        kind: "result_set", bytes: sourceBytes, storage_ref: sourcePath,
      }, localTrace);
      const dataset = execute(db, "register_dataset_version", {
        kind: "results",
        artifact_id: sourceArtifact.object_id,
        content_hash: sourceArtifact.object_id,
        as_of: "2026-08-22T00:00:00.000Z",
        coverage: { deterministic_score_field: "edge" },
      }, localTrace);
      const sourceTask = execute(db, "create_task", {
        task_id: "task-normal-world",
        title: "Normal governed research",
        description: "Complete the governed research sequence.",
        assignee_session_id: "worker-world",
      }, { ...localTrace, actor_session_id: "director-world", mission_id: mission.object_id });
      const run = execute(db, "execute_deterministic_run", {
        run_id: "run-normal-world",
        dataset_id: dataset.object_id,
        hypothesis_id: hypothesis.object_id,
        strategy_spec: { contract: "qf.strategy.v1", version: 1, stake_model: "flat", score_field: "edge" },
        params: { limit: 1 },
      }, { ...localTrace, actor_session_id: "worker-world" });
       const runResultArtifactId = String(run.state.result_artifact_id);
       const sourceWork = {
         source_task_id: sourceTask.object_id,
         hypothesis_id: hypothesis.object_id,
         run_id: run.object_id,
         result_artifact_id: runResultArtifactId,
         executor_session_id: "worker-world",
       };
       completeWorkerTask(db, root, sourceTask.object_id, "worker-world", "normal-world", sourceWork);
       const workerResultArtifactId = sourceWork.result_artifact_id;
      const admission = requestGovernedReview(db, sourceTask.object_id, "normal-world-attempt", "critic-world", localTrace);
      expect(admission.kind).toBe("admitted");
      const reviewTaskId = String(admission.review_task_id);
      markGovernedDelivery(db, reviewTaskId, "delivered", localTrace);
      for (const [sequence, toolName, args] of [
        [1, "qf_hypothesis_get", { id: hypothesis.object_id }],
        [2, "qf_run_get", { id: run.object_id }],
         [3, "qf_artifact_get", { id: workerResultArtifactId }],
        [4, "qf_record_evaluation", { verdict: "supports" }],
      ] as const) {
        recordGovernedToolReceipt(db, {
          invocation_id: `normal-world-${sequence}`,
          session_id: "critic-world",
          task_id: reviewTaskId,
          tool_name: toolName,
          arguments: args,
          result: { ok: true },
          broker_sequence: sequence,
        }, localTrace);
      }
      const evaluation = execute(db, "record_evaluation", {
        hypothesis_id: hypothesis.object_id,
        run_id: run.object_id,
         artifact_id: workerResultArtifactId,
        review_task_id: reviewTaskId,
        source_work: sourceWork,
        broker_invocation_id: "normal-world-4",
        verdict: "supports",
        rubric: { faithfulness: 0.9, answer_relevancy: 0.9, context_precision: 0.9, context_recall: 0.9 },
        confidence: 0.9,
        rationale: "The governed world is complete.",
         findings: [{ code: "WORLD_COMPLETE", severity: "info", message: "Every required lineage edge is durable.", evidence_refs: [workerResultArtifactId] }],
      }, { ...localTrace, actor_session_id: "critic-world" });
      expect(evaluation.state.report_artifact_id).toBeString();

      const projection = getResearchWorldProjection(db, { root_type: "mission", root_id: mission.object_id });
      expect(projection.ok).toBe(true);
      if (projection.ok) {
        expect(projection.world.objects.map((object) => `${object.type}:${object.id}`)).toEqual([
          "agent_session:critic-world",
          "agent_session:director-world",
          "agent_session:worker-world",
          "artifact:" + String(evaluation.state.findings_artifact_id),
           "artifact:" + runResultArtifactId,
           "artifact:" + workerResultArtifactId,
          "artifact:" + String(evaluation.state.report_artifact_id),
          "dataset:" + dataset.object_id,
          "evaluation:" + String(evaluation.state.id),
          "hypothesis:" + hypothesis.object_id,
          "mission:" + mission.object_id,
          "run:" + run.object_id,
          "task:" + String(admission.review_task_id),
          "task:" + sourceTask.object_id,
        ].sort());
         expect(projection.world.objects).toHaveLength(14);
         expect(projection.world.links).toHaveLength(15);
        expect(projection.world.current_report_id).toBe(String(evaluation.state.report_artifact_id));
        expect(projection.world.report_ids).toContain(String(evaluation.state.report_artifact_id));
        expect(projection.world.objects.find((object) => object.type === "evaluation")?.fields.semantic_markers).toEqual(["EVALUATION"]);
         expect(projection.world.objects.find((object) => object.type === "artifact" && object.id === runResultArtifactId)?.fields.semantic_markers).toContain("RAW ARTIFACT");
         expect(projection.world.objects.find((object) => object.type === "artifact" && object.id === workerResultArtifactId)?.fields.semantic_markers).toContain("RAW ARTIFACT");
        expect(projection.world.objects.find((object) => object.type === "artifact" && object.id === String(evaluation.state.report_artifact_id))?.fields.semantic_markers).toContain("PUBLISHED REPORT");
        expect(projection.world.links.map(({ kind, from_id, to_id }) => `${kind}:${from_id}:${to_id}`)).toEqual([
          `assigned_to:${sourceTask.object_id}:worker-world`,
          `assigned_to:${reviewTaskId}:critic-world`,
          `belongs_to:${sourceTask.object_id}:${mission.object_id}`,
          `delegated_by:${reviewTaskId}:director-world`,
          `delegated_by:${sourceTask.object_id}:director-world`,
          `delegates_to:director-world:worker-world`,
          `evaluated_by:${hypothesis.object_id}:${evaluation.state.id}`,
          `evaluated_by:${run.object_id}:${evaluation.state.id}`,
          `evaluated_by:${workerResultArtifactId}:${evaluation.state.id}`,
          `gates:${evaluation.state.id}:${evaluation.state.report_artifact_id}`,
          `performed_by:${evaluation.state.id}:critic-world`,
          `produces:critic-world:${evaluation.state.findings_artifact_id}`,
          `produces:${run.object_id}:${runResultArtifactId}`,
          `tests:${run.object_id}:${hypothesis.object_id}`,
          `uses:${run.object_id}:${dataset.object_id}`,
        ].sort());
      }
    } finally {
      closeKernel(db);
      if (previousArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
      else process.env.QF_ARTIFACT_ROOT = previousArtifactRoot;
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("isolates two Missions that share Dataset and result Artifact in both root directions", () => {
    const root = mkdtempSync(join(tmpdir(), "qf-r16-shared-world-test-"));
    const previousArtifactRoot = process.env.QF_ARTIFACT_ROOT;
    process.env.QF_ARTIFACT_ROOT = root;
    const db = kernel();
    const localTrace = { trace_id: "shared-world-trace", span_id: "shared-world-span" };
    const strategySpec = { contract: "qf.strategy.v1", version: 1, stake_model: "flat", score_field: "edge" };
    const params = { limit: 1 };
    type World = {
      mission: string; hypothesis: string; task: string; run: string; dataset: string;
      resultArtifact: string; workerResultArtifact: string; reviewTask: string; evaluation: string; findings: string; report: string;
      director: string; worker: string; critic: string;
    };

    try {
      const registerDefinition = (definitionId: string, name: string, role: string, groups: string[]) => {
        execute(db, "register_agent_definition", {
          name, role, package_ref: "species/hermes/packed/hermes.aospkg", runtime_profile: "default",
          capability_groups: groups,
          display_name: role === "orchestrator" ? "Research Director" : role === "critic" ? "Critic" : "Market Researcher",
        }, localTrace);
        return definitionId;
      };
      const directorDefinition = registerDefinition("shared-director-definition", "shared-director-definition", "orchestrator", ["desk.orchestrate"]);
      const workerDefinition = registerDefinition("shared-worker-definition", "shared-worker-definition", "worker", ["desk.orchestrate"]);
      const criticDefinition = registerDefinition("hermes-critic", "hermes-critic", "critic", ["research.evaluate"]);
      const createSession = (id: string, definitionId: string, actorSessionId?: string): string => {
        execute(db, "create_agent_session", {
          session_id: id, agent_definition_id: definitionId, label: id,
        }, { ...localTrace, ...(actorSessionId ? { actor_session_id: actorSessionId } : {}) });
        execute(db, "start_agent_session", { session_id: id }, localTrace);
        return id;
      };
      const sessions = {
        decoyDirector: createSession("decoy-director", directorDefinition),
        decoyWorker: createSession("decoy-worker", workerDefinition, "decoy-director"),
        decoyCritic: createSession("decoy-critic", criticDefinition),
        targetDirector: createSession("target-director", directorDefinition),
        targetWorker: createSession("target-worker", workerDefinition, "target-director"),
        targetCritic: createSession("target-critic", criticDefinition),
      };

      const missionData = JSON.stringify({
        contract: "qf.dataset.v1",
        observations: [{ observed_at: "2026-08-22T00:00:00.000Z", edge: 1 }],
      });
      const datasetBytes = new TextEncoder().encode(missionData);
      const datasetPath = join(root, "shared-dataset.json");
      writeFileSync(datasetPath, datasetBytes);
      const datasetArtifact = execute(db, "publish_artifact", {
        kind: "result_set", bytes: datasetBytes, storage_ref: datasetPath,
      }, localTrace);
      const dataset = execute(db, "register_dataset_version", {
        kind: "results", artifact_id: datasetArtifact.object_id, content_hash: datasetArtifact.object_id,
        as_of: "2026-08-22T00:00:00.000Z", coverage: { deterministic_score_field: "edge" },
      }, localTrace);

      const makeWorld = (prefix: "decoy" | "target", director: string, worker: string, critic: string): World => {
        const mission = execute(db, "create_mission", {
          mission_id: `${prefix}-shared-mission`, name: `${prefix} Mission`, objective: "Isolate shared research data.",
        }, localTrace);
        const hypothesis = execute(db, "create_hypothesis", {
          claim: `${prefix} hypothesis`, success_criteria: `${prefix} governed result is complete.`,
        }, localTrace);
        const task = execute(db, "create_task", {
          task_id: `${prefix}-shared-source-task`, title: `${prefix} source work`, description: "Complete the governed source work.",
          assignee_session_id: worker,
        }, { ...localTrace, actor_session_id: director, mission_id: mission.object_id });
        const run = execute(db, "execute_deterministic_run", {
          run_id: `${prefix}-shared-run`, dataset_id: dataset.object_id, hypothesis_id: hypothesis.object_id,
          strategy_spec: strategySpec, params,
        }, { ...localTrace, actor_session_id: worker });
         const resultArtifact = String(run.state.result_artifact_id);
         const sourceWork = {
           source_task_id: task.object_id, hypothesis_id: hypothesis.object_id, run_id: run.object_id,
           result_artifact_id: resultArtifact, executor_session_id: worker,
         };
         completeWorkerTask(db, root, task.object_id, worker, `${prefix}-shared`, sourceWork);
         const workerResultArtifact = sourceWork.result_artifact_id;
        const admission = requestGovernedReview(db, task.object_id, `${prefix}-shared-attempt`, critic, localTrace);
        expect(admission.kind).toBe("admitted");
        const reviewTask = String(admission.review_task_id);
        markGovernedDelivery(db, reviewTask, "delivered", localTrace);
        for (const [sequence, toolName, args] of [
          [1, "qf_hypothesis_get", { id: hypothesis.object_id }],
          [2, "qf_run_get", { id: run.object_id }],
           [3, "qf_artifact_get", { id: workerResultArtifact }],
          [4, "qf_record_evaluation", { verdict: "supports" }],
        ] as const) {
          recordGovernedToolReceipt(db, {
            invocation_id: `${prefix}-shared-${sequence}`, session_id: critic, task_id: reviewTask,
            tool_name: toolName, arguments: args, result: { ok: true }, broker_sequence: sequence,
          }, localTrace);
        }
        const evaluation = execute(db, "record_evaluation", {
           hypothesis_id: hypothesis.object_id, run_id: run.object_id, artifact_id: workerResultArtifact,
          review_task_id: reviewTask, source_work: sourceWork, broker_invocation_id: `${prefix}-shared-4`,
          verdict: "supports", rubric: { faithfulness: 0.9, answer_relevancy: 0.9, context_precision: 0.9, context_recall: 0.9 },
          confidence: 0.9, rationale: `${prefix} review is complete.`,
           findings: [{ code: `${prefix.toUpperCase()}_COMPLETE`, severity: "info", message: "The governed world is complete.", evidence_refs: [workerResultArtifact] }],
        }, { ...localTrace, actor_session_id: critic });
        return {
          mission: mission.object_id, hypothesis: hypothesis.object_id, task: task.object_id, run: run.object_id,
           dataset: dataset.object_id, resultArtifact, workerResultArtifact, reviewTask, evaluation: String(evaluation.state.id),
          findings: String(evaluation.state.findings_artifact_id), report: String(evaluation.state.report_artifact_id),
          director, worker, critic,
        };
      };

      const decoy = makeWorld("decoy", sessions.decoyDirector, sessions.decoyWorker, sessions.decoyCritic);
      const target = makeWorld("target", sessions.targetDirector, sessions.targetWorker, sessions.targetCritic);
      expect(target.dataset).toBe(decoy.dataset);
      expect(target.resultArtifact).toBe(decoy.resultArtifact);

      const allDistinctIds = [
        decoy.mission, decoy.hypothesis, decoy.task, decoy.run, decoy.reviewTask, decoy.evaluation,
         decoy.findings, decoy.report, decoy.workerResultArtifact, decoy.director, decoy.worker, decoy.critic,
        target.mission, target.hypothesis, target.task, target.run, target.reviewTask, target.evaluation,
         target.findings, target.report, target.workerResultArtifact, target.director, target.worker, target.critic,
      ];
      expect(new Set(allDistinctIds).size).toBe(allDistinctIds.length);

      const expectedObjects = (world: World) => [
        `agent_session:${world.critic}`, `agent_session:${world.director}`, `agent_session:${world.worker}`,
         `artifact:${world.findings}`, `artifact:${world.resultArtifact}`, `artifact:${world.workerResultArtifact}`, `artifact:${world.report}`,
        `dataset:${world.dataset}`, `evaluation:${world.evaluation}`, `hypothesis:${world.hypothesis}`,
        `mission:${world.mission}`, `run:${world.run}`, `task:${world.reviewTask}`, `task:${world.task}`,
      ].sort();
      const expectedLinks = (world: World) => [
        `assigned_to:${world.task}:${world.worker}`, `assigned_to:${world.reviewTask}:${world.critic}`,
        `belongs_to:${world.task}:${world.mission}`, `delegated_by:${world.reviewTask}:${world.director}`,
        `delegated_by:${world.task}:${world.director}`, `delegates_to:${world.director}:${world.worker}`,
        `evaluated_by:${world.hypothesis}:${world.evaluation}`, `evaluated_by:${world.run}:${world.evaluation}`,
         `evaluated_by:${world.workerResultArtifact}:${world.evaluation}`, `gates:${world.evaluation}:${world.report}`,
        `performed_by:${world.evaluation}:${world.critic}`, `produces:${world.critic}:${world.findings}`,
         `produces:${world.run}:${world.resultArtifact}`, `tests:${world.run}:${world.hypothesis}`,
        `uses:${world.run}:${world.dataset}`,
      ].sort();
      const assertWorld = (world: World) => {
        const projection = getResearchWorldProjection(db, { root_type: "mission", root_id: world.mission });
        expect(projection.ok).toBe(true);
        if (!projection.ok) return;
        expect(projection.world.objects.map((object) => `${object.type}:${object.id}`).sort()).toEqual(expectedObjects(world));
         expect(projection.world.objects).toHaveLength(14);
         expect(projection.world.objects.find((object) => object.type === "artifact" && object.id === world.workerResultArtifact)?.fields.run_id).toBe(world.run);
        expect(projection.world.links.map(({ kind, from_id, to_id }) => `${kind}:${from_id}:${to_id}`).sort()).toEqual(expectedLinks(world));
         expect(projection.world.links).toHaveLength(15);
        expect(projection.world.missing_lineage).toEqual([]);
        return new Set(projection.world.objects.map((object) => object.id));
      };
      const decoyIds = [decoy.mission, decoy.hypothesis, decoy.task, decoy.run, decoy.reviewTask, decoy.evaluation, decoy.findings, decoy.report, decoy.director, decoy.worker, decoy.critic];
      const targetIds = [target.mission, target.hypothesis, target.task, target.run, target.reviewTask, target.evaluation, target.findings, target.report, target.director, target.worker, target.critic];
      const targetProjectionIds = assertWorld(target)!;
      const decoyProjectionIds = assertWorld(decoy)!;
      for (const id of decoyIds) expect(targetProjectionIds.has(id)).toBe(false);
      for (const id of targetIds) expect(decoyProjectionIds.has(id)).toBe(false);
    } finally {
      closeKernel(db);
      if (previousArtifactRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
      else process.env.QF_ARTIFACT_ROOT = previousArtifactRoot;
      rmSync(root, { recursive: true, force: true });
    }
  });
});
