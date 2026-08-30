import { expect, test } from "bun:test";
import { createHash } from "node:crypto";

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

test("production worker hold owns two exact steering acknowledgements through reader close", async () => {
	process.env[HOLD_FLAG] = "1";
	class PushableReader {
		closed = false;
		#lines: string[] = ["[QuantFlow TASK task-test from orchestrator] Test task"];
		#waiters: Array<{ resolve: (line: string) => void; reject: (error: Error) => void }> = [];
		next() {
			if (this.#lines.length > 0) return Promise.resolve(this.#lines.shift());
			if (this.closed) return Promise.reject(new Error("reader closed"));
			return new Promise<string>((resolve, reject) => this.#waiters.push({ resolve, reject }));
		}
		push(line: string) {
			const waiter = this.#waiters.shift();
			if (waiter) waiter.resolve(line); else this.#lines.push(line);
		}
		close() {
			this.closed = true;
			while (this.#waiters.length > 0) this.#waiters.shift()?.reject(new Error("reader closed"));
		}
	}
	const reader = new PushableReader();
	let ontologyListTools = 0;
	let collaborationListTools = 0;
	let collaborationCalls = 0;
	const output: string[] = [];
	const outputWaiters: Array<() => void> = [];
	const originalWrite = process.stdout.write;
	process.stdout.write = ((chunk: any) => {
		output.push(String(chunk));
		while (outputWaiters.length > 0) outputWaiters.shift()?.();
		return true;
	}) as typeof process.stdout.write;
	const waitForText = async (text: string, count = 1) => {
		while (output.join("").split(text).length - 1 < count) await new Promise<void>((resolve) => outputWaiters.push(resolve));
	};
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
		await waitForText("QF_SYNTHETIC readiness=steering_hold task_id=task-test");
		reader.push(JSON.stringify({ contract: "qf.task.steering.v1", task_id: "task-test", mode: "clarify", instruction: "hold" }));
		await waitForText("QF_SYNTHETIC delivery_ack role=undefined task_id=task-test", 1);
		reader.push(JSON.stringify({ contract: "qf.task.steering.v1", task_id: "task-redirect", mode: "redirect", instruction: "redirect" }));
		await waitForText("QF_SYNTHETIC delivery_ack role=undefined task_id=task-redirect", 1);
		reader.push(JSON.stringify({ contract: "qf.task.steering.v2", task_id: "task-malformed", mode: "redirect", instruction: "ignore" }));
		reader.close();
		await running;
		const receipts = output.join("");
		const clarifyDigest = createHash("sha256").update(JSON.stringify(["qf.task.steering.v1", "task-test", "clarify", "hold"]), "utf8").digest("hex").slice(0, 32);
		const redirectDigest = createHash("sha256").update(JSON.stringify(["qf.task.steering.v1", "task-redirect", "redirect", "redirect"]), "utf8").digest("hex").slice(0, 32);
		expect(receipts.match(/delivery_received role=undefined contract=qf.task.steering.v1 task_id=task-test/g)).toHaveLength(1);
		expect(receipts.match(/delivery_ack role=undefined task_id=task-test/g)).toHaveLength(1);
		expect(receipts.match(new RegExp(`delivery_proof role=undefined digest=${clarifyDigest}`, "g"))).toHaveLength(1);
		expect(receipts.match(/delivery_received role=undefined contract=qf.task.steering.v1 task_id=task-redirect/g)).toHaveLength(1);
		expect(receipts.match(/delivery_ack role=undefined task_id=task-redirect/g)).toHaveLength(1);
		expect(receipts.match(new RegExp(`delivery_proof role=undefined digest=${redirectDigest}`, "g"))).toHaveLength(1);
		expect(receipts.match(/delivery_proof role=undefined digest=/g)).toHaveLength(2);
		expect(receipts).not.toContain("task-malformed");
		expect(ontologyListTools).toBe(0);
		expect(collaborationListTools).toBe(0);
		expect(collaborationCalls).toBe(0);
	} finally {
		process.stdout.write = originalWrite;
		delete process.env[HOLD_FLAG];
	}
});

test("steering delivery proof is exact, domain-fixed, and rejects malformed input", () => {
  const exact = { contract: "qf.task.steering.v1", task_id: "task-a", mode: "redirect", instruction: "Do it exactly." };
  const digest = responder.steeringDeliveryDigest(exact);
  expect(digest).toMatch(/^[0-9a-f]{32}$/);
  expect(digest).toBe(createHash("sha256").update(JSON.stringify([exact.contract, exact.task_id, exact.mode, exact.instruction]), "utf8").digest("hex").slice(0, 32));
  expect(responder.steeringDeliveryDigest({ ...exact, contract: "qf.task.steering.v2" })).toBeNull();
  expect(responder.steeringDeliveryDigest({ ...exact, mode: "settle" })).toBeNull();
  expect(responder.steeringDeliveryDigest({ ...exact, instruction: 7 })).toBeNull();
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
		await waitUntil(() => reader.deliveryConsumed);
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

class ReviewReader {
	closed = false;
	#lines: string[];

	constructor(lines: string[]) { this.#lines = [...lines]; }
	async next() {
		if (this.#lines.length > 0) return this.#lines.shift();
		this.closed = true;
		throw new Error("review input exhausted");
	}
	waitForClose() { this.closed = true; return Promise.resolve(); }
}

const SECOND_OPINION = {
	contract: "qf.task.second_opinion.v1",
	source_task_id: "source-task-second-opinion",
	review_task_id: "review-task-second-opinion",
	title: "Independent second opinion",
	instruction: "Review the exact source task independently.",
};

test("nextReview acknowledges one exact structured second opinion with exact bindings", async () => {
	const parsed = await responder.nextReview(new ReviewReader([JSON.stringify(SECOND_OPINION)]));
	expect(parsed).toEqual({ secondOpinion: SECOND_OPINION });
	const output: string[] = [];
	const originalWrite = process.stdout.write;
	process.stdout.write = ((chunk: any) => { output.push(String(chunk)); return true; }) as typeof process.stdout.write;
	try {
		await responder.selectRoleHandler("critic")(new ReviewReader([JSON.stringify(SECOND_OPINION)]), {}, {});
	} finally {
		process.stdout.write = originalWrite;
	}
	const text = output.join("");
	expect(text.match(/delivery_ack role=[^ ]+ task_id=review-task-second-opinion/g)).toHaveLength(1);
	expect(text).toContain("delivery_binding source_task_id=source-task-second-opinion");
	expect(text).toContain("delivery_binding review_task_id=review-task-second-opinion");
});

test("nextReview rejects malformed wrong-contract raw and carried second-opinion input", async () => {
	const invalid = [
		JSON.stringify({ ...SECOND_OPINION, contract: "qf.task.second_opinion.v2" }),
		JSON.stringify({ ...SECOND_OPINION, review_task_id: 7 }),
		JSON.stringify({ review_task_id: SECOND_OPINION.review_task_id, source_task_id: SECOND_OPINION.source_task_id }),
		`prefix ${JSON.stringify(SECOND_OPINION)}`,
	];
	for (const line of invalid) {
		await expect(responder.nextReview(new ReviewReader([line]))).rejects.toThrow("review input exhausted");
	}
	await expect(responder.nextReview(new ReviewReader([
		JSON.stringify(SECOND_OPINION),
		JSON.stringify({ ...SECOND_OPINION, contract: "qf.task.second_opinion.v2" }),
	]))).resolves.toEqual({ secondOpinion: SECOND_OPINION });
	await expect(responder.nextReview(new ReviewReader([
		JSON.stringify({ ...SECOND_OPINION, contract: "qf.task.second_opinion.v2" }),
	]))).rejects.toThrow("review input exhausted");
});

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
