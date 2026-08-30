import { describe, expect, test } from "bun:test";
import {
  createResearchWorldController,
  deriveResearchWorkflow,
  latestSavedWorldRoot,
	researchCableProjectionOpacity,
	researchCurrentMissionLinkKeys,
	researchCablePorts,
  researchSessionReceiptFields,
	researchTilePresentation,
	projectedSemanticMarkers,
	researchWorldLayout,
  researchWorldLayoutIsMalformed,
  resolveResearchWorldEndpointTileId,
} from "./research-world.js";
import { tiles as canvasTiles } from "./canvas-state.js";

const objects = [
  { type: "mission", id: "mission-1" },
  { type: "task", id: "source-task-1" },
  { type: "task", id: "review-task-1" },
  { type: "hypothesis", id: "hypothesis-1" },
  { type: "dataset", id: "dataset-1" },
  { type: "run", id: "run-1" },
  { type: "artifact", id: "result-artifact-1" },
  { type: "evaluation", id: "evaluation-1" },
  { type: "artifact", id: "findings-artifact-1" },
  { type: "artifact", id: "report-artifact-1" },
  { type: "agent_session", id: "director-session-1" },
  { type: "agent_session", id: "executor-session-1" },
  { type: "agent_session", id: "critic-session-1" },
];

const tiles = [
  ...objects
    .filter((object) => object.type !== "agent_session")
    .map((object) => ({
      id: `ontology:${object.type}:${object.id}`,
      type: "research",
      ontologyType: object.type,
      ontologyId: object.id,
    })),
  { id: "session-director", type: "session", sessionId: "director-session-1" },
  { id: "session-executor", type: "session", sessionId: "executor-session-1" },
  { id: "session-critic", type: "session", sessionId: "critic-session-1" },
];

const links = [
  ["belongs_to", "source-task-1", "mission-1"],
  ["assigned_to", "source-task-1", "executor-session-1"],
  ["delegated_by", "source-task-1", "director-session-1"],
  ["delegates_to", "director-session-1", "executor-session-1"],
  ["tests", "run-1", "hypothesis-1"],
  ["uses", "run-1", "dataset-1"],
  ["produces", "run-1", "result-artifact-1"],
  ["evaluated_by", "hypothesis-1", "evaluation-1"],
  ["evaluated_by", "run-1", "evaluation-1"],
  ["evaluated_by", "result-artifact-1", "evaluation-1"],
  ["performed_by", "evaluation-1", "critic-session-1"],
  ["produces", "critic-session-1", "findings-artifact-1"],
  ["gates", "evaluation-1", "report-artifact-1"],
  ["assigned_to", "review-task-1", "critic-session-1"],
  ["delegated_by", "review-task-1", "director-session-1"],
].map(([kind, from_id, to_id]) => ({ kind, from_id, to_id }));

class FakeElement {
  className = "";
  textContent = "";
  title = "";
  hidden = false;
  tabIndex = -1;
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  children: FakeElement[] = [];
  parent: FakeElement | null = null;
  listeners = new Map<string, (event: unknown) => void>();

  get classList() {
    return { contains: (name: string) => this.className.split(/\s+/).includes(name) };
  }

  appendChild(child: FakeElement): FakeElement {
    child.remove();
    child.parent = this;
    this.children.push(child);
    return child;
  }

  append(...children: FakeElement[]): void {
    for (const child of children) this.appendChild(child);
  }

  replaceChildren(...children: FakeElement[]): void {
    for (const child of this.children) child.parent = null;
    this.children = [];
    this.append(...children);
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners.set(type, listener);
  }

  removeEventListener(type: string, listener: (event: unknown) => void): void {
    if (this.listeners.get(type) === listener) this.listeners.delete(type);
  }

  remove(): void {
    if (!this.parent) return;
    const index = this.parent.children.indexOf(this);
    if (index !== -1) this.parent.children.splice(index, 1);
    this.parent = null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

async function withDocument<T>(run: () => Promise<T>): Promise<T> {
  const previous = (globalThis as Record<string, unknown>).document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => new FakeElement() },
  });
  try {
    return await run();
  } finally {
    if (previous === undefined) delete (globalThis as Record<string, unknown>).document;
    else Object.defineProperty(globalThis, "document", { configurable: true, value: previous });
  }
}

function makeSessionDOM(): { container: FakeElement; contentArea: FakeElement; taskFoot: FakeElement } {
  const container = new FakeElement();
	const contentArea = new FakeElement();
  const taskFoot = new FakeElement();
  const preservedBefore = new FakeElement();
  preservedBefore.className = "existing-before";
  const firstReceipt = new FakeElement();
  firstReceipt.className = "qf-world-session-receipt";
  const preservedAfter = new FakeElement();
  preservedAfter.className = "existing-after";
  const duplicateReceipt = new FakeElement();
  duplicateReceipt.className = "qf-world-session-receipt";
  taskFoot.append(preservedBefore, firstReceipt, preservedAfter, duplicateReceipt);
  return { container, contentArea, taskFoot };
}

function treeText(element: FakeElement): string {
	return `${element.textContent}${element.children.map(treeText).join("")}`;
}

function routedCableHitsTile(fromTile: Record<string, number>, fromSide: string, toTile: Record<string, number>, toSide: string, tile: Record<string, number>, curveLength: number): boolean {
	const port = (rect: Record<string, number>, side: string) => side === "n" ? { x: rect.x + rect.width / 2, y: rect.y, dx: 0, dy: -1 }
		: side === "e" ? { x: rect.x + rect.width, y: rect.y + rect.height / 2, dx: 1, dy: 0 }
			: side === "s" ? { x: rect.x + rect.width / 2, y: rect.y + rect.height, dx: 0, dy: 1 }
				: { x: rect.x, y: rect.y + rect.height / 2, dx: -1, dy: 0 };
	const a = port(fromTile, fromSide);
	const b = port(toTile, toSide);
	const curve = curveLength;
	const c1 = { x: a.x + a.dx * curve, y: a.y + a.dy * curve };
	const c2 = { x: b.x + b.dx * curve, y: b.y + b.dy * curve };
	for (let index = 1; index < 96; index += 1) {
		const t = index / 96;
		const u = 1 - t;
		const point = {
			x: u ** 3 * a.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * b.x,
			y: u ** 3 * a.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * b.y,
		};
		if (point.x > tile.x && point.x < tile.x + tile.width && point.y > tile.y && point.y < tile.y + tile.height) return true;
	}
	return false;
}

describe("research world renderer seam", () => {
	test("LOCAL renders every endpoint-in-current cable while overview stays primary", () => {
		const currentIds = new Set(Array.from({ length: 17 }, (_, index) => `current-${index}`));
		const primary = Array.from({ length: 12 }, (_, index) => ({ kind: `primary-${index}`, from_id: `current-${index}`, to_id: `current-${index + 1}` }));
		const internal = Array.from({ length: 9 }, (_, index) => ({ kind: `internal-${index}`, from_id: `current-${index}`, to_id: `current-${index + 2}` }));
		const historical = { kind: "historical", from_id: "current-0", to_id: "historical-1" };
		const workflow = {
			currentMissionIds: currentIds,
			primaryLinkKeys: new Set(primary.map(({ kind, from_id, to_id }) => `${kind}\u0000${from_id}\u0000${to_id}`)),
			links: [...primary, ...internal, historical],
		};
		expect([...researchCurrentMissionLinkKeys(workflow, false)].sort()).toEqual([...workflow.primaryLinkKeys].sort());
		expect([...researchCurrentMissionLinkKeys(workflow, true)].sort()).toEqual([...primary, ...internal]
			.map(({ kind, from_id, to_id }) => `${kind}\u0000${from_id}\u0000${to_id}`).sort());
		expect(researchCurrentMissionLinkKeys(workflow, true).size).toBe(21);
		expect([...researchCurrentMissionLinkKeys(workflow, true)]).not.toContain("historical\u0000current-0\u0000historical-1");
	});

	test("LOCAL cable paint distinguishes selected lineage from other current cables", () => {
		expect(researchCableProjectionOpacity({ local: true, currentMission: true })).toBe(0.9);
		expect(researchCableProjectionOpacity({ selected: true, currentMission: true })).toBe(0.9);
		expect(researchCableProjectionOpacity({ currentMission: true })).toBe(0.28);
		expect(researchCableProjectionOpacity()).toBe(0.16);
	});

	test("derives the five-stage primary workflow and exact primary links from Kernel objects and links", () => {
		const worldObjects = objects.map((object) => ({
			...object,
			fields: object.type === "mission" ? { objective: "Should Ryan publish this edge?", status: "active" }
				: object.id === "source-task-1" ? { title: "Test the edge", status: "done", assignee_session_id: "executor-session-1", delegator_session_id: "director-session-1" }
				: object.id === "review-task-1" ? { title: "Independent review", status: "done", assignee_session_id: "critic-session-1", delegator_session_id: "director-session-1" }
				: object.type === "run" ? { kind: "backtest", status: "succeeded", executor_session_id: "executor-session-1", result_artifact_id: "result-artifact-1" }
				: object.id === "result-artifact-1" ? { kind: "result_set", run_id: "run-1" }
				: object.type === "evaluation" ? { verdict: "supports", confidence: 0.9, critic_session_id: "critic-session-1", review_task_id: "review-task-1", publication_report_id: "report-artifact-1", findings_artifact_id: "findings-artifact-1" }
				: object.id === "report-artifact-1" ? { kind: "report", current_authority: true, semantic_markers: ["HISTORICAL", "CURRENT AUTHORITY"] }
				: object.type === "strategy" ? { family: "settled-results", status: "locked" }
				: object.type === "hypothesis" ? { claim: "Edge survives review", status: "open" }
				: object.type === "dataset" ? { kind: "results", coverage: { record_count: 10 }, as_of: "2026-08-22" }
				: object.type === "agent_session" ? { status: object.id === "executor-session-1" ? "closed" : "running", label: object.id }
				: { kind: "evaluation_findings" },
		}));
		const world = { root: { type: "mission", id: "mission-1" }, current_report_id: "report-artifact-1", report_ids: ["report-artifact-1"], objects: worldObjects, links };
		const workflow = deriveResearchWorkflow(world);
		expect(workflow.stages.map((stage) => stage.map((object) => object.id))).toEqual([
			["mission-1"],
			["review-task-1", "critic-session-1", "source-task-1", "executor-session-1", "director-session-1"],
			["run-1", "hypothesis-1", "dataset-1", "result-artifact-1"],
			["evaluation-1"],
			["report-artifact-1"],
		]);
		expect(workflow.primaryIds.has("executor-session-1")).toBe(true);
		expect(workflow.currentMissionIds.has("executor-session-1")).toBe(true);
		expect(workflow.historyIds.has("report-artifact-1")).toBe(false);
		const layout = researchWorldLayout(workflow);
		expect(layout.get("ontology:agent_session:critic-session-1")).toEqual({ x: 460, y: 80, width: 300, height: 190 });
		expect(layout.get("ontology:task:review-task-1")).toEqual({ x: 460, y: 310, width: 300, height: 190 });
		expect(layout.get("ontology:task:source-task-1")?.y).toBe(540);
		expect(layout.get("ontology:agent_session:executor-session-1")?.y).toBe(770);
		expect(layout.get("ontology:agent_session:director-session-1")?.y).toBe(1000);
		expect([...workflow.primaryLinkKeys].sort()).toEqual(links
			.filter((link) => !["evaluated_by:hypothesis-1", "evaluated_by:run-1", "produces:critic-session-1"].some((prefix) => `${link.kind}:${link.from_id}` === prefix))
			.map((link) => `${link.kind}\u0000${link.from_id}\u0000${link.to_id}`).sort());

		const participant = () => ({ role: "Executor", runtimeState: "stopped", session: "closed", work: "completed", recovery: "restartable" });
		expect(researchTilePresentation(workflow.mission, workflow, participant)).toEqual({
			title: "Should Ryan publish this edge?", badge: "MISSION", status: "active", facts: [{ label: "Technique", value: "Not recorded" }],
		});
		expect(researchTilePresentation(workflow.rawArtifact, workflow, participant)).toEqual({
			title: "Result Set", badge: "ARTIFACT", status: "RAW UNREVIEWED", facts: [
				{ label: "Producer", value: "Backtest" },
				{ label: "Source", value: "Backtest · Test the edge" },
			],
		});
		expect(researchTilePresentation(workflow.currentReport, workflow, participant).status).toBe("PUBLISHED CURRENT");
		expect(projectedSemanticMarkers(workflow.currentReport, workflow)).toEqual(["CURRENT AUTHORITY"]);
		expect(JSON.stringify(researchTilePresentation(workflow.mission, workflow, participant))).not.toContain("mission-1");

		const findingsLayout = layout.get("ontology:artifact:findings-artifact-1")!;
		const reportLayout = layout.get("ontology:artifact:report-artifact-1")!;
		expect(findingsLayout.x).toBe(reportLayout.x);
		expect(findingsLayout.y).toBe(80);
		expect(reportLayout.y).toBe(310);
		const stageCenters = workflow.stages.map((stage) => stage.map((object) => {
			const rect = layout.get(`ontology:${object.type}:${object.id}`)!;
			return rect.x + rect.width / 2;
		}));
		for (let stage = 0; stage < stageCenters.length - 1; stage += 1) {
			expect(Math.max(...stageCenters[stage])).toBeLessThan(Math.min(...stageCenters[stage + 1]));
		}
	});

	test("rehydrates the newest persisted world root instead of the oldest", () => {
		expect(latestSavedWorldRoot([
			{ id: "old", type: "research", ontologyType: "mission", ontologyId: "mission-old" },
			{ id: "middle", type: "research", ontologyType: "task", ontologyId: "task-middle" },
			{ id: "new", type: "research", ontologyType: "mission", ontologyId: "mission-new" },
		])?.id).toBe("new");
	});

	test("names the single-column runaway layout from the consumer screenshot", () => {
		const runaway = Array.from({ length: 10 }, (_, index) => ({
			type: "research", x: 1780, y: 5000 + index * 800,
		}));
		const reusedSharedMembers = [
			{ type: "research", x: 2220, y: 11760 },
			{ type: "research", x: 2220, y: 12680 },
		];
		const lanes = Array.from({ length: 10 }, (_, index) => ({
			type: "research", x: (index % 3) * 444, y: Math.floor(index / 3) * 304,
		}));
		expect(researchWorldLayoutIsMalformed(runaway)).toBe(true);
		expect(researchWorldLayoutIsMalformed(reusedSharedMembers)).toBe(true);
		expect(researchWorldLayoutIsMalformed(reusedSharedMembers.slice(0, 1))).toBe(false);
		expect(researchWorldLayoutIsMalformed(lanes)).toBe(false);
	});

	test("routes a long same-stage cable around unrelated workflow tiles", () => {
		const tile = (x: number, y: number) => ({ x, y, width: 300, height: 190 });
		const run = tile(920, 80);
		const grade = tile(920, 1460);
		const obstacles = [
			tile(0, 80),
			...Array.from({ length: 5 }, (_, row) => tile(460, 80 + row * 230)),
			run,
			...Array.from({ length: 4 }, (_, row) => tile(920, 540 + row * 230)),
			grade,
			tile(1380, 310), tile(1380, 540), tile(1380, 770),
			tile(1840, 310),
		];
		const route = researchCablePorts(grade, run, obstacles);
		for (const obstacle of obstacles.filter((candidate) => candidate !== grade && candidate !== run)) {
			expect(routedCableHitsTile(grade, route.from, run, route.to, obstacle, 160)).toBe(false);
		}
	});

	test("routes worker evidence to Evaluation around the unrelated Strategy using production geometry", () => {
		const workerEvidence = { x: 920, y: 80, width: 300, height: 190 };
		const evaluation = { x: 920, y: 770, width: 300, height: 190 };
		const strategy = { x: 920, y: 310, width: 300, height: 190 };
		expect(routedCableHitsTile(workerEvidence, "s", evaluation, "n", strategy, 160)).toBe(true);
		const route = researchCablePorts(workerEvidence, evaluation, [workerEvidence, strategy, evaluation]);
		expect(routedCableHitsTile(workerEvidence, route.from, evaluation, route.to, strategy, 160)).toBe(false);
	});

	test("reserves the stage-three gutter needed by the worst fitted Run-result route", () => {
		const workflow = { stages: [[], [], [], [{ type: "evaluation", id: "evaluation-1" }, { type: "ticket", id: "ticket-1" }], [{ type: "artifact", id: "report-1" }]], objects: [], stageById: new Map(), links: [] };
		const layout = researchWorldLayout(workflow);
		expect(layout.get("ontology:evaluation:evaluation-1")?.x).toBe(1500);
		expect(layout.get("ontology:ticket:ticket-1")?.x).toBe(1500);
		expect(layout.get("ontology:artifact:report-1")?.x).toBe(1840);
		expect(1840 - (1500 + 300)).toBe(40);
		const scale = 136 / 300;
		const run = { x: 920 * scale, y: 80 * scale, width: 136, height: 190 * scale };
		const result = { x: 920 * scale, y: 540 * scale, width: 136, height: 190 * scale };
		const oldEvaluation = { x: 1380 * scale, y: 310 * scale, width: 136, height: 190 * scale };
		const shiftedEvaluation = { ...oldEvaluation, x: 1500 * scale };
		expect(routedCableHitsTile(run, "e", result, "e", oldEvaluation, 160)).toBe(true);
		const route = researchCablePorts(run, result, [run, shiftedEvaluation, result]);
		expect(routedCableHitsTile(run, route.from, result, route.to, shiftedEvaluation, 160)).toBe(false);
	});

	test("places exact worker evidence in Evidence row one and clears the three production routes", () => {
		const workerEvidence = { type: "artifact", id: "worker-evidence", fields: {} };
		const rawResult = { type: "artifact", id: "raw-result", fields: {} };
		const evaluation = { type: "evaluation", id: "evaluation", fields: { source_work: { result_artifact_id: workerEvidence.id } } };
		const workflow = { stages: [[], [], [], [evaluation], []], objects: [workerEvidence, rawResult, evaluation], stageById: new Map(), links: [], evaluation, rawArtifact: rawResult };
		const layout = researchWorldLayout(workflow);
		expect(layout.get("ontology:artifact:worker-evidence")).toEqual({ x: 920, y: 310, width: 300, height: 190 });
		const oldWorker = { x: 460, y: 1230, width: 300, height: 190 };
		const newWorker = { x: 920, y: 310, width: 300, height: 190 };
		const evaluationRect = { x: 1500, y: 310, width: 300, height: 190 };
		const run = { x: 920, y: 80, width: 300, height: 190 };
		const raw = { x: 920, y: 1230, width: 300, height: 190 };
		const executor = { x: 460, y: 310, width: 300, height: 190 };
		const evidenceColumn = [run, { x: 920, y: 540, width: 300, height: 190 }, { x: 920, y: 770, width: 300, height: 190 }, { x: 920, y: 1000, width: 300, height: 190 }, raw, { x: 920, y: 1460, width: 300, height: 190 }];
		const sides = ["n", "e", "s", "w"];
		const blocked = sides.flatMap((from) => sides.map((to) => evidenceColumn.some((tile) => routedCableHitsTile(oldWorker, from, evaluationRect, to, tile, 160))));
		expect(blocked.every(Boolean)).toBe(true);
		expect(routedCableHitsTile(oldWorker, "e", evaluationRect, "e", raw, 160)).toBe(true);
		const workerRoute = researchCablePorts(newWorker, evaluationRect, [newWorker, ...evidenceColumn, evaluationRect]);
		expect(evidenceColumn.every((tile) => !routedCableHitsTile(newWorker, workerRoute.from, evaluationRect, workerRoute.to, tile, 160))).toBe(true);
		const executorRoute = researchCablePorts(executor, newWorker, [executor, ...evidenceColumn, newWorker]);
		expect(evidenceColumn.every((tile) => !routedCableHitsTile(executor, executorRoute.from, newWorker, executorRoute.to, tile, 160))).toBe(true);
		const resultRoute = researchCablePorts(run, raw, [run, newWorker, ...evidenceColumn, raw]);
		expect([newWorker, ...evidenceColumn].filter((tile) => tile !== run && tile !== raw).every((tile) => !routedCableHitsTile(run, resultRoute.from, raw, resultRoute.to, tile, 160))).toBe(true);
	});

	test("swaps only the review pair and clears its five production relationships", () => {
		const scale = 136 / 300;
		const tile = (x: number, y: number) => ({ x: x * scale, y: y * scale, width: 136, height: 190 * scale });
		const oldCritic = tile(460, 310);
		const critic = tile(460, 80);
		const reviewTask = tile(460, 310);
		const sourceTask = tile(460, 540);
		const executor = tile(460, 770);
		const director = tile(460, 1000);
		const run = tile(920, 80);
		const workerEvidence = tile(920, 310);
		const hypothesis = tile(920, 540);
		const dataset = tile(920, 770);
		const strategy = tile(920, 1000);
		const rawResult = tile(920, 1230);
		const grade = tile(920, 1460);
		const evaluation = tile(1500, 310);
		const ticket = tile(1500, 540);
		const oldFindings = tile(1840, 540);
		const findings = tile(1840, 80);
		const report = tile(1840, 310);
		const obstacles = [critic, reviewTask, sourceTask, executor, director, run, workerEvidence, hypothesis, dataset, strategy, rawResult, grade, evaluation, ticket, findings, report];
		const sides = ["n", "e", "s", "w"];
		const oldBlocked = sides.flatMap((from) => sides.map((to) => obstacles
			.filter((candidate) => candidate !== evaluation)
			.some((candidate) => routedCableHitsTile(evaluation, from, oldCritic, to, candidate, 160))));
		expect(oldBlocked.every(Boolean)).toBe(true);
		expect(routedCableHitsTile(evaluation, "n", oldCritic, "w", run, 160)).toBe(true);
		const oldFindingsBlocked = sides.flatMap((from) => sides.map((to) => obstacles
			.filter((candidate) => candidate !== critic && candidate !== findings)
			.some((candidate) => routedCableHitsTile(critic, from, oldFindings, to, candidate, 160))));
		expect(oldFindingsBlocked.every(Boolean)).toBe(true);
		expect(routedCableHitsTile(critic, "n", oldFindings, "s", run, 160)).toBe(true);
		const relationships = [
			[reviewTask, critic],
			[reviewTask, director],
			[evaluation, critic],
			[critic, findings],
			[workerEvidence, evaluation],
			[run, rawResult],
		];
		for (const [from, to] of relationships) {
			const route = researchCablePorts(from, to, obstacles);
			for (const obstacle of obstacles.filter((candidate) => candidate !== from && candidate !== to)) {
				expect(routedCableHitsTile(from, route.from, to, route.to, obstacle, 160)).toBe(false);
			}
		}
		const performedBy = researchCablePorts(evaluation, critic, obstacles);
		expect(performedBy).toEqual({ from: "n", to: "n" });
		const producesFindings = researchCablePorts(critic, findings, obstacles);
		expect(obstacles.filter((candidate) => candidate !== critic && candidate !== findings)
			.every((candidate) => !routedCableHitsTile(critic, producesFindings.from, findings, producesFindings.to, candidate, 160))).toBe(true);
		expect(obstacles.filter((candidate) => candidate !== critic && candidate !== findings)
			.every((candidate) => !routedCableHitsTile(critic, "n", findings, "n", candidate, 160))).toBe(true);
	});

  test("formats the exact session receipt field order and display values", () => {
    expect(researchSessionReceiptFields({ fields: { id: "session-1", status: null } })).toEqual([
      { field: "id", value: "session-1" },
      { field: "status", value: "Not recorded" },
      { field: "label", value: "Not recorded" },
    ]);
    expect(researchSessionReceiptFields({ fields: { id: "", status: 0, label: false } })).toEqual([
      { field: "id", value: "[empty string]" },
      { field: "status", value: "0" },
      { field: "label", value: "false" },
    ]);
    expect(researchSessionReceiptFields({ fields: { id: { source: "Kernel" }, status: undefined, label: "worker" } })).toEqual([
      { field: "id", value: '{"source":"Kernel"}' },
      { field: "status", value: "Not recorded" },
      { field: "label", value: "worker" },
    ]);
    for (const row of researchSessionReceiptFields({})) expect(Object.keys(row)).toEqual(["field", "value"]);
  });

  test("reuses one compact participant card while preserving the live terminal DOM", async () => {
    await withDocument(async () => {
      const previousWindow = (globalThis as Record<string, unknown>).window;
      const rootTile = { id: "ontology:mission:mission-1", type: "research", ontologyType: "mission", ontologyId: "mission-1" };
      const sessionTile = { id: "terminal-session", type: "term", sessionId: "session-1" };
      const rootDOM = { container: new FakeElement(), contentArea: new FakeElement(), taskFoot: new FakeElement() };
	  const sessionDOM = makeSessionDOM();
	  const terminalWebview = new FakeElement();
	  terminalWebview.className = "terminal-webview";
	  sessionDOM.contentArea.appendChild(terminalWebview);
	  let workState = "working";
	  let projectionReads = 0;
      const doms = new Map([
        [rootTile.id, rootDOM],
        [sessionTile.id, sessionDOM],
      ]);
      canvasTiles.splice(0, canvasTiles.length, rootTile, sessionTile);
      const world = {
        root: { type: "mission", id: "mission-1" },
        objects: [
          { type: "mission", id: "mission-1", fields: { id: "mission-1", name: "Mission", objective: "Objective" } },
          { type: "agent_session", id: "session-1", fields: { id: "session-1", status: "running", label: undefined } },
        ],
        links: [],
        missing_lineage: [],
      };
      Object.defineProperty(globalThis, "window", {
        configurable: true,
		value: { shellApi: { qf: { getResearchWorldProjection: async () => { projectionReads += 1; return { ok: true, world }; } } } },
      });
      try {
        const controller = createResearchWorldController({
          tileManager: { createResearchTile: () => rootTile },
          getTileDOMs: () => doms,
          onCables: () => {},
		  getParticipantView: () => ({ role: "Worker", runtimeState: "running", session: "live", work: workState, recovery: "ready" }),
        });
        await controller.reveal("mission", "mission-1");
        const firstCard = sessionDOM.taskFoot.children.find((child) => child.className === "qf-world-participant-card");
		expect(sessionDOM.taskFoot.children.map((child) => child.className)).toEqual(["existing-before", "qf-world-session-receipt", "existing-after", "qf-world-session-receipt", "qf-world-participant-card"]);
        expect(firstCard).toBeDefined();
		expect(treeText(firstCard!)).toContain("working");
        expect(firstCard!.children[0]?.children.map((child) => child.className)).toContain("qf-world-human-label");
        expect(firstCard!.children[0]?.children.flatMap((child) => child.children).some((child) => child.className === "qf-world-type-label" && child.textContent === "PARTICIPANT")).toBe(true);
		expect(sessionDOM.container.dataset.qfWorldType).toBe("agent_session");
        expect(sessionDOM.container.dataset.qfWorldId).toBe("session-1");
        expect(sessionDOM.container.attributes.get("aria-label")).toBe("agent_session session-1");
		const preservedChildren = sessionDOM.taskFoot.children.filter((child) => child.className !== "qf-world-participant-card");
		controller.refreshParticipants();
		workState = "completed";
		controller.refreshParticipants();
		const secondCard = sessionDOM.taskFoot.children.find((child) => child.className === "qf-world-participant-card");
		expect(secondCard).toBe(firstCard);
		expect(sessionDOM.taskFoot.children.filter((child) => child.className === "qf-world-participant-card")).toHaveLength(1);
		expect(sessionDOM.taskFoot.children.filter((child) => child.className !== "qf-world-participant-card")).toEqual(preservedChildren);
		expect(treeText(secondCard!)).toContain("completed");
		expect(sessionDOM.contentArea.children).toEqual([terminalWebview]);
		expect(sessionTile.sessionId).toBe("session-1");
		expect(projectionReads).toBe(1);
      } finally {
        canvasTiles.splice(0, canvasTiles.length);
        if (previousWindow === undefined) delete (globalThis as Record<string, unknown>).window;
        else Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
      }
    });
  });

  test("keeps the participant projection on the task-foot seam without inline Inspect", async () => {
    const source = await Bun.file(new URL("./research-world.js", import.meta.url)).text();
    const decorator = source.match(/function decorateSession\(object\) \{[\s\S]*?\n\t\}\n\n\tfunction positionFor/)?.[0] ?? "";
    expect(decorator).toContain("dom.taskFoot");
		expect(decorator).toContain("qf-world-participant-card");
		expect(decorator).not.toContain("dom.contentArea.replaceChildren");
		expect(decorator).not.toContain("renderObject");
		expect(decorator).not.toContain("qf-world-inspect");
  });

  test("resolves every endpoint in the 13-tile, 15-link world", () => {
    expect(objects).toHaveLength(13);
    expect(tiles).toHaveLength(13);
    expect(links).toHaveLength(15);
    const expectedTileId = (id: string) => {
      const object = objects.find((entry) => entry.id === id);
      if (object.type === "agent_session") return tiles.find((tile) => tile.type !== "research" && tile.sessionId === id).id;
      return `ontology:${object.type}:${id}`;
    };
    const expected = links.map(({ from_id, to_id }) => [
      expectedTileId(from_id),
      expectedTileId(to_id),
    ]);

    expect(links.map(({ from_id, to_id }) => [
      resolveResearchWorldEndpointTileId(objects, tiles, from_id),
      resolveResearchWorldEndpointTileId(objects, tiles, to_id),
    ])).toEqual(expected);
  });

  test("returns null for unknown and ambiguous endpoints", () => {
    expect(resolveResearchWorldEndpointTileId(objects, tiles, "unknown-id")).toBeNull();
    expect(resolveResearchWorldEndpointTileId([
      { type: "mission", id: "duplicate-id" },
      { type: "task", id: "duplicate-id" },
    ], tiles, "duplicate-id")).toBeNull();
    expect(resolveResearchWorldEndpointTileId(objects, [
      ...tiles,
      { id: "duplicate-research", type: "research", ontologyType: "mission", ontologyId: "mission-1" },
    ], "mission-1")).toBeNull();
    expect(resolveResearchWorldEndpointTileId(objects, [
      ...tiles,
      { id: "duplicate-session", type: "term", sessionId: "director-session-1" },
    ], "director-session-1")).toBeNull();
    expect(resolveResearchWorldEndpointTileId([
      { type: "agent_session", id: "research-session-1" },
    ], [{ id: "ontology:agent_session:research-session-1", type: "research", ontologyType: "agent_session", ontologyId: "research-session-1", sessionId: "research-session-1" }], "research-session-1")).toBeNull();
  });

  test("uses projection attributes and never opens a truth store", async () => {
    const source = await Bun.file(new URL("./research-world.js", import.meta.url)).text();
    expect(source).toContain("qfWorldField");
		expect(source).toContain("Open workspace");
    const forbidden = new RegExp([
      ["bun", "sqlite"].join(":"),
      ["node", "sqlite"].join(":"),
      "better" + "-sqlite3",
      ["node", "fs"].join(":"),
    ].join("|"));
    expect(source).not.toMatch(forbidden);
  });
});
