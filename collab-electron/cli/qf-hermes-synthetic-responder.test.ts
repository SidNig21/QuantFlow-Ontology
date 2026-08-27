import { expect, test } from "bun:test";

const responder = await import("./qf-hermes-synthetic-responder.mjs");

const HOLD_FLAG = "QF_FOUNDER_STEERING_HOLD";

class ControlledReader {
  closed = false;
  waitForCloseStarted = false;
  deliveryConsumed = false;
  #nextCall = 0;
  #closeResolve;
  #pendingReject;
  #closePromise = new Promise((resolve) => { this.#closeResolve = resolve; });

  constructor(firstLine = "[QuantFlow TASK task-test from orchestrator] Test task") {
    this.firstLine = firstLine;
  }

  firstLine: string;

  async next() {
    this.#nextCall += 1;
    if (this.#nextCall === 1) return this.firstLine;
    if (this.#nextCall === 2) {
      this.deliveryConsumed = true;
      return JSON.stringify({ contract: "qf.task.steering.v1", task_id: "task-test", mode: "clarify", instruction: "hold" });
    }
    return new Promise((resolve, reject) => {
      this.#pendingReject = reject;
      if (this.closed) reject(new Error("reader closed"));
    });
  }

  waitForClose() {
    this.waitForCloseStarted = true;
    return this.#closePromise;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.#pendingReject?.(new Error("reader closed"));
    this.#closeResolve?.();
  }
}

async function waitUntil(predicate) {
  const deadline = Date.now() + 1_000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("production responder test condition timed out");
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}

test("production synthetic responder selects the exact role behavior", () => {
  expect(responder.selectRoleHandler("worker2").name).toBe("worker");
  expect(responder.selectRoleHandler("worker").name).toBe("worker");
  expect(responder.selectRoleHandler("critic").name).toBe("critic");
  expect(responder.selectRoleHandler("orchestrator").name).toBe("orchestrator");
  expect(() => responder.selectRoleHandler("unknown")).toThrow("unsupported synthetic Hermes role: unknown");
});

test("production worker hold keeps delivery consumption live without query or send_result", async () => {
  process.env[HOLD_FLAG] = "1";
  const reader = new ControlledReader();
  let ontologyListTools = 0;
  let collaborationListTools = 0;
  let collaborationCalls = 0;
  const ontology = {
    async listTools() { ontologyListTools += 1; return []; },
    async callTool() { throw new Error("hold must not call ontology tools"); },
  };
  const collaboration = {
    async listTools() { collaborationListTools += 1; return []; },
    async callTool() { collaborationCalls += 1; throw new Error("hold must not call collaboration tools"); },
  };
  try {
    const running = responder.worker(reader, ontology, collaboration);
    await waitUntil(() => reader.deliveryConsumed && reader.waitForCloseStarted);
    expect(ontologyListTools).toBe(0);
    expect(collaborationListTools).toBe(0);
    expect(collaborationCalls).toBe(0);
    reader.close();
    await running;
  } finally {
    delete process.env[HOLD_FLAG];
  }
});

test("production worker accepts the real assignment envelope as worker2 activation", async () => {
  process.env[HOLD_FLAG] = "1";
  const reader = new ControlledReader(JSON.stringify({
    contract: "qf.task.assignment.v1",
    task_id: "task-test",
    title: "Test task",
    instruction: "assigned task",
  }));
  const ontology = {
    async listTools() { throw new Error("assignment hold must not list ontology tools"); },
    async callTool() { throw new Error("assignment hold must not call ontology tools"); },
  };
  const collaboration = {
    async listTools() { throw new Error("assignment hold must not list collaboration tools"); },
    async callTool() { throw new Error("assignment hold must not call collaboration tools"); },
  };
  try {
    const running = responder.worker(reader, ontology, collaboration);
    await waitUntil(() => reader.deliveryConsumed && reader.waitForCloseStarted);
    reader.close();
    await running;
  } finally {
    delete process.env[HOLD_FLAG];
  }
});

test("production worker without hold keeps the existing market-read and send_result path", async () => {
  delete process.env[HOLD_FLAG];
  const reader = new ControlledReader();
  let queried = 0;
  let sent = 0;
  const ontology = {
    async listTools() { return [{ name: "qf_market_event_get" }, { name: "qf_market_event_query" }]; },
    async callTool(name) {
      expect(name).toBe("qf_market_event_query");
      queried += 1;
      return { artifactId: "trajectory-test", result: [{ id: "market:test" }] };
    },
  };
  const collaboration = {
    async listTools() { return [{ name: "send_result" }]; },
    async callTool(name) {
      expect(name).toBe("send_result");
      sent += 1;
      return { artifactId: "result-test" };
    },
  };
  const running = responder.worker(reader, ontology, collaboration);
  await waitUntil(() => queried === 1 && sent === 1 && reader.waitForCloseStarted);
  expect(queried).toBe(1);
  expect(sent).toBe(1);
  reader.close();
  await running;
});

const CRITIC_TOOLS = ["qf_hypothesis_get", "qf_run_get", "qf_artifact_get", "qf_record_evaluation"];
const CRITIC_IDS = {
  source_task_id: "source-task-test",
  hypothesis_id: "hypothesis-test",
  run_id: "run-test",
  result_artifact_id: "artifact-test",
  executor_session_id: "executor-session-test",
};
const CRITIC_REVIEW_TASK_ID = "review-task-test";

function criticActivationLine(includeReviewTask = true, sourceWork = CRITIC_IDS) {
  const lines = [
    ...(includeReviewTask ? [`review_task_id=${CRITIC_REVIEW_TASK_ID}`] : []),
    `source_work=${JSON.stringify(sourceWork)}`,
  ];
  return `QUANTFLOW_MISSION ${JSON.stringify({
    contract: "qf.mission.activation.v1",
    mission_id: CRITIC_REVIEW_TASK_ID,
    question: lines.join("\n"),
  })}`;
}

function makeCriticOntology(options: any = {}) {
  const calls: Array<{ name: string; args: any }> = [];
  const tools = options.tools ?? CRITIC_TOOLS;
  const ontology = {
    calls,
    async listTools() { return tools.map((name: string) => ({ name })); },
    async callTool(name: string, args: any) {
      calls.push({ name, args });
      options.onCall?.(name, args);
      if (name === "qf_record_evaluation") return options.evaluationResult ?? { result: { object_id: "evaluation-test" } };
      if (options.readResult) return options.readResult(name, args);
      return { artifactId: `trajectory-${name}`, result: { id: args.id } };
    },
  };
  return ontology;
}

async function runDirectCritic(ontology: any, includeReviewTask = true) {
  const output: string[] = [];
  const originalWrite = process.stdout.write;
  process.stdout.write = ((chunk: any) => {
    output.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  try {
    await responder.selectRoleHandler("critic")(
      new ControlledReader(criticActivationLine(includeReviewTask)),
      ontology,
      {},
    );
  } finally {
    process.stdout.write = originalWrite;
  }
  return { calls: ontology.calls, output };
}

test("production critic direct activation reads exact objects and records one durable evaluation", async () => {
  const ontology = makeCriticOntology();
  const { calls, output } = await runDirectCritic(ontology);
  expect(calls.map(({ name }) => name)).toEqual(CRITIC_TOOLS);
  expect(calls.slice(0, 3).map(({ args }) => args)).toEqual([
    { id: CRITIC_IDS.hypothesis_id },
    { id: CRITIC_IDS.run_id },
    { id: CRITIC_IDS.result_artifact_id },
  ]);
  expect(calls[3]?.args).toMatchObject({
    hypothesis_id: CRITIC_IDS.hypothesis_id,
    run_id: CRITIC_IDS.run_id,
    artifact_id: CRITIC_IDS.result_artifact_id,
    review_task_id: CRITIC_REVIEW_TASK_ID,
    source_work: CRITIC_IDS,
  });
  expect(calls[3]?.args.source_work).toEqual(CRITIC_IDS);
  expect(calls[3]?.args).toHaveProperty("verdict", "supports");
  expect(output.join("")).toContain("boundary=lineage_publication");
  expect(output.join("")).toContain("evaluation_id=evaluation-test");
  expect(output.join("")).toContain("turn=complete");
});

test("production critic direct path rejects the required-tool and exact-read/evaluation falsifiers", async () => {
  await expect(runDirectCritic(makeCriticOntology({ tools: CRITIC_TOOLS.filter((name) => name !== "qf_artifact_get") }))).rejects.toThrow("critic ontology missing generated tool qf_artifact_get");
  await expect(runDirectCritic(makeCriticOntology({
    readResult: (name: string, args: any) => name === "qf_run_get"
      ? { artifactId: "trajectory-qf_run_get", result: { id: "wrong-run" } }
      : { artifactId: `trajectory-${name}`, result: { id: args.id } },
  }))).rejects.toThrow("qf_run_get returned the wrong object for run-test");
  await expect(runDirectCritic(makeCriticOntology({
    readResult: (name: string, args: any) => name === "qf_hypothesis_get"
      ? { result: { id: args.id } }
      : { artifactId: `trajectory-${name}`, result: { id: args.id } },
  }))).rejects.toThrow("qf_hypothesis_get returned no read trajectory artifact");
  await expect(runDirectCritic(makeCriticOntology({ evaluationResult: { result: {} } }))).rejects.toThrow("qf_record_evaluation returned no Evaluation id");
});

test("existing critic activation falsifiers preserve missing review, source-work mismatch, and substituted artifact inputs", async () => {
  delete process.env.QF_HERMES_SYNTHETIC_CRITIC_FALSIFY;
  delete process.env.QF_HERMES_SYNTHETIC_SUBSTITUTED_RESULT_ARTIFACT_ID;
  await expect(runDirectCritic(makeCriticOntology(), false)).rejects.toThrow("critic activation review_task_id line is not unique");

  let mismatchedSourceWork: any;
  process.env.QF_HERMES_SYNTHETIC_CRITIC_FALSIFY = "mismatched-source-work";
  await runDirectCritic(makeCriticOntology({ onCall: (name: string, args: any) => {
    if (name === "qf_record_evaluation") mismatchedSourceWork = args.source_work;
  } }));
  expect(mismatchedSourceWork.source_task_id).toBe("source-task-test-falsifier");

  let substitutedArtifactId = "";
  process.env.QF_HERMES_SYNTHETIC_CRITIC_FALSIFY = "substituted-result-artifact-id";
  process.env.QF_HERMES_SYNTHETIC_SUBSTITUTED_RESULT_ARTIFACT_ID = "artifact-substituted";
  await runDirectCritic(makeCriticOntology({ onCall: (name: string, args: any) => {
    if (name === "qf_record_evaluation") substitutedArtifactId = args.artifact_id;
  } }));
  expect(substitutedArtifactId).toBe("artifact-substituted");
  delete process.env.QF_HERMES_SYNTHETIC_CRITIC_FALSIFY;
  delete process.env.QF_HERMES_SYNTHETIC_SUBSTITUTED_RESULT_ARTIFACT_ID;
});
