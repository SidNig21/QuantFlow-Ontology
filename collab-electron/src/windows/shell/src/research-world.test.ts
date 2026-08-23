import { describe, expect, test } from "bun:test";
import {
  createResearchWorldController,
  deriveResearchWorkflow,
  latestSavedWorldRoot,
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
	test("derives the five-stage primary workflow and exact primary links from Kernel objects and links", () => {
		const worldObjects = objects.map((object) => ({
			...object,
			fields: object.type === "mission" ? { objective: "Should Ryan publish this edge?", status: "active" }
				: object.id === "source-task-1" ? { title: "Test the edge", status: "done", assignee_session_id: "executor-session-1", delegator_session_id: "director-session-1" }
				: object.id === "review-task-1" ? { title: "Independent review", status: "done", assignee_session_id: "critic-session-1", delegator_session_id: "director-session-1" }
				: object.type === "run" ? { kind: "backtest", status: "succeeded", executor_session_id: "executor-session-1", result_artifact_id: "result-artifact-1" }
				: object.id === "result-artifact-1" ? { kind: "result_set", run_id: "run-1" }
				: object.type === "evaluation" ? { verdict: "supports", confidence: 0.9, critic_session_id: "critic-session-1", review_task_id: "review-task-1", publication_report_id: "report-artifact-1" }
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

		const layout = researchWorldLayout(workflow);
		const findingsLayout = layout.get("ontology:artifact:findings-artifact-1")!;
		const reportLayout = layout.get("ontology:artifact:report-artifact-1")!;
		expect(findingsLayout.x).toBe(reportLayout.x);
		expect(findingsLayout.y).toBeGreaterThan(reportLayout.y);
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
		for (const curveLength of [280, 320, 360]) {
			for (const obstacle of obstacles.filter((candidate) => candidate !== grade && candidate !== run)) {
				expect(routedCableHitsTile(grade, route.from, run, route.to, obstacle, curveLength)).toBe(false);
			}
		}
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
