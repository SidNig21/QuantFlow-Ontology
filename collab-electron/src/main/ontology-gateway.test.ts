import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { ontologyTrajectoryContext } from "./ontology-trajectory-context";
import { ontologyReadReceiptEligible } from "./ontology-read-dispatch";

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
  expect(block).toContain("execute_deterministic_run");
  expect(block).not.toContain("create_task");
  expect(block).not.toContain("complete_task");
});
