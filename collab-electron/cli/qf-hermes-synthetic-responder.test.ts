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
