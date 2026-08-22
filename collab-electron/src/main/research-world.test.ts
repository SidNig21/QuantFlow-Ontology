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
    const session = (id: string, definitionId: string, role: string, groups: string[]) => {
      execute(db, "register_agent_definition", {
        name: definitionId,
        role,
        package_ref: "species/hermes/packed/hermes.aospkg",
        runtime_profile: "default",
        capability_groups: groups,
        display_name: role === "orchestrator" ? "Research Director" : role === "critic" ? "Critic" : "Market Researcher",
      }, localTrace);
      execute(db, "create_agent_session", { session_id: id, agent_definition_id: definitionId, label: id }, { ...localTrace, ...(role === "worker" ? { actor_session_id: "director-world" } : {}) });
      execute(db, "start_agent_session", { session_id: id }, localTrace);
    };

    try {
      session("director-world", "director-world-definition", "orchestrator", ["desk.orchestrate"]);
      session("worker-world", "worker-world-definition", "worker", ["desk.orchestrate"]);
      session("critic-world", "hermes-critic", "critic", ["research.evaluate"]);
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
      const resultArtifactId = String(run.state.result_artifact_id);
      const sourceWork = bindSourceWork(db, {
        source_task_id: sourceTask.object_id,
        hypothesis_id: hypothesis.object_id,
        run_id: run.object_id,
        result_artifact_id: resultArtifactId,
        executor_session_id: "worker-world",
      }, localTrace);
      const admission = requestGovernedReview(db, sourceTask.object_id, "normal-world-attempt", "critic-world", localTrace);
      expect(admission.kind).toBe("admitted");
      const reviewTaskId = String(admission.review_task_id);
      markGovernedDelivery(db, reviewTaskId, "delivered", localTrace);
      for (const [sequence, toolName, args] of [
        [1, "qf_hypothesis_get", { id: hypothesis.object_id }],
        [2, "qf_run_get", { id: run.object_id }],
        [3, "qf_artifact_get", { id: resultArtifactId }],
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
        artifact_id: resultArtifactId,
        review_task_id: reviewTaskId,
        source_work: sourceWork,
        broker_invocation_id: "normal-world-4",
        verdict: "supports",
        rubric: { faithfulness: 0.9, answer_relevancy: 0.9, context_precision: 0.9, context_recall: 0.9 },
        confidence: 0.9,
        rationale: "The governed world is complete.",
        findings: [{ code: "WORLD_COMPLETE", severity: "info", message: "Every required lineage edge is durable.", evidence_refs: [resultArtifactId] }],
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
          "artifact:" + resultArtifactId,
          "artifact:" + String(evaluation.state.report_artifact_id),
          "dataset:" + dataset.object_id,
          "evaluation:" + String(evaluation.state.id),
          "hypothesis:" + hypothesis.object_id,
          "mission:" + mission.object_id,
          "run:" + run.object_id,
          "task:" + String(admission.review_task_id),
          "task:" + sourceTask.object_id,
        ].sort());
        expect(projection.world.objects).toHaveLength(13);
        expect(projection.world.links).toHaveLength(15);
        expect(projection.world.links.map(({ kind, from_id, to_id }) => `${kind}:${from_id}:${to_id}`)).toEqual([
          `assigned_to:${sourceTask.object_id}:worker-world`,
          `assigned_to:${reviewTaskId}:critic-world`,
          `belongs_to:${sourceTask.object_id}:${mission.object_id}`,
          `delegated_by:${reviewTaskId}:director-world`,
          `delegated_by:${sourceTask.object_id}:director-world`,
          `delegates_to:director-world:worker-world`,
          `evaluated_by:${hypothesis.object_id}:${evaluation.state.id}`,
          `evaluated_by:${run.object_id}:${evaluation.state.id}`,
          `evaluated_by:${resultArtifactId}:${evaluation.state.id}`,
          `gates:${evaluation.state.id}:${evaluation.state.report_artifact_id}`,
          `performed_by:${evaluation.state.id}:critic-world`,
          `produces:critic-world:${evaluation.state.findings_artifact_id}`,
          `produces:${run.object_id}:${resultArtifactId}`,
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
});
