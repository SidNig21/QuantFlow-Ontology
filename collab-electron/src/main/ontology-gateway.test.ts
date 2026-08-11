import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { ontologyTrajectoryContext } from "./ontology-trajectory-context";
import { ontologyReadReceiptEligible } from "./ontology-read-dispatch";
import { ontologyToolsForRole } from "./ontology-role-tools";

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
