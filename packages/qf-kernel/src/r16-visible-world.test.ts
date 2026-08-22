import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  bindSourceWork,
  closeKernel,
  execute,
  openKernel,
  type KernelDb,
} from "./index.ts";

const trace = { trace_id: "r16-trace", span_id: "r16-span" };
let db: KernelDb | undefined;
let root: string | undefined;

afterEach(() => {
  if (db) closeKernel(db);
  if (root) rmSync(root, { recursive: true, force: true });
  db = undefined;
  root = undefined;
  delete process.env.QF_ARTIFACT_ROOT;
});

function session(id: string, definitionId: string, role: string): void {
  execute(db!, "register_agent_definition", {
    name: definitionId, role, package_ref: "species/hermes/packed/hermes.aospkg",
    runtime_profile: "default", system_prompt_ref: null, capability_groups: ["desk.orchestrate", "research.evaluate"],
    display_name: role === "orchestrator" ? "Orchestrator" : "Market Researcher",
  }, trace);
  execute(db!, "create_agent_session", { session_id: id, agent_definition_id: definitionId, label: id }, trace);
  execute(db!, "start_agent_session", { session_id: id }, trace);
}

function fixture() {
  root = mkdtempSync(join(tmpdir(), "qf-r16-visible-"));
  process.env.QF_ARTIFACT_ROOT = root;
  db = openKernel(":memory:");
  session("director-session", "director-definition", "orchestrator");
  session("executor-session", "executor-definition", "worker");
  const mission = execute(db, "create_mission", { mission_id: "mission-r16", name: "R16 mission", objective: "Measure the visible world." }, trace);
  const hypothesis = execute(db, "create_hypothesis", { claim: "The visible world is complete.", success_criteria: "Every durable edge is inspectable." }, trace);
  const bytes = new TextEncoder().encode(JSON.stringify({ contract: "qf.dataset.v1", observations: [{ observed_at: "2026-08-20T00:00:00.000Z", edge: 1 }] }));
  const path = join(root, "dataset.json");
  writeFileSync(path, bytes);
  const sourceArtifact = execute(db, "publish_artifact", { kind: "result_set", bytes, storage_ref: path }, trace);
  const dataset = execute(db, "register_dataset_version", { kind: "results", artifact_id: sourceArtifact.object_id, content_hash: sourceArtifact.object_id, as_of: "2026-08-21T00:00:00.000Z", coverage: { deterministic_score_field: "edge" } }, trace);
  const task = execute(db, "create_task", { task_id: "task-r16", title: "Visible research", description: "Inspect the world", assignee_session_id: "executor-session" }, { ...trace, actor_session_id: "director-session", mission_id: mission.object_id });
  const run = execute(db, "execute_deterministic_run", { run_id: "run-r16", dataset_id: dataset.object_id, hypothesis_id: hypothesis.object_id, strategy_spec: { contract: "qf.strategy.v1", version: 1, stake_model: "flat", score_field: "edge" }, params: { limit: 1 } }, { ...trace, actor_session_id: "executor-session" });
  bindSourceWork(db, { source_task_id: task.object_id, hypothesis_id: hypothesis.object_id, run_id: run.object_id, result_artifact_id: String(run.state.result_artifact_id), executor_session_id: "executor-session" }, trace);
  return { mission, task, hypothesis, dataset, run };
}

describe("R16 visible research world Kernel seams", () => {
  test("trusted Mission context writes one belongs_to edge and hypothesis-bound runs write tests", () => {
    const f = fixture();
    expect(db!.query("SELECT kind, from_id, to_id FROM links WHERE from_id = 'task-r16' ORDER BY kind").all()).toContainEqual({ kind: "belongs_to", from_id: f.task.object_id, to_id: f.mission.object_id });
    expect(db!.query("SELECT kind, from_id, to_id FROM links WHERE from_id = 'run-r16' AND kind = 'tests'").all()).toEqual([{ kind: "tests", from_id: f.run.object_id, to_id: f.hypothesis.object_id }]);
  });

  test("caller-supplied mission_id is rejected as an action field", () => {
    fixture();
    expect(() => execute(db!, "create_task", { task_id: "bad", title: "bad", description: "bad", assignee_session_id: "executor-session", mission_id: "mission-r16" }, { ...trace, actor_session_id: "director-session" })).toThrow();
    expect(db!.query("SELECT COUNT(*) AS n FROM task WHERE id = 'bad'").get()).toEqual({ n: 0 });
  });

  test("omitted hypothesis preserves legacy execution and the projection can report missing tests", () => {
    const f = fixture();
    execute(db!, "execute_deterministic_run", { run_id: "run-legacy", dataset_id: f.dataset.object_id, strategy_spec: { contract: "qf.strategy.v1", version: 1, stake_model: "flat", score_field: "edge" }, params: { limit: 1 } }, trace);
    expect(db!.query("SELECT COUNT(*) AS n FROM links WHERE from_id = 'run-legacy' AND kind = 'tests'").get()).toEqual({ n: 0 });
  });
});
