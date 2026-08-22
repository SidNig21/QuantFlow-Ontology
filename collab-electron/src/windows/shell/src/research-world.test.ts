import { describe, expect, test } from "bun:test";
import { createResearchWorldController, latestSavedWorldRoot, researchSessionReceiptFields, researchWorldLayoutIsMalformed, resolveResearchWorldEndpointTileId } from "./research-world.js";
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

function makeSessionDOM(): { container: FakeElement; taskFoot: FakeElement } {
  const container = new FakeElement();
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
  return { container, taskFoot };
}

describe("research world renderer seam", () => {
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
		const lanes = Array.from({ length: 10 }, (_, index) => ({
			type: "research", x: (index % 3) * 444, y: Math.floor(index / 3) * 304,
		}));
		expect(researchWorldLayoutIsMalformed(runaway)).toBe(true);
		expect(researchWorldLayoutIsMalformed(lanes)).toBe(false);
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

  test("reuses one direct task-foot receipt and preserves the live session tile", async () => {
    await withDocument(async () => {
      const previousWindow = (globalThis as Record<string, unknown>).window;
      const rootTile = { id: "ontology:mission:mission-1", type: "research", ontologyType: "mission", ontologyId: "mission-1" };
      const sessionTile = { id: "terminal-session", type: "term", sessionId: "session-1" };
      const rootDOM = { container: new FakeElement(), contentArea: new FakeElement(), taskFoot: new FakeElement() };
      const sessionDOM = makeSessionDOM();
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
        value: { shellApi: { qf: { getResearchWorldProjection: async () => ({ ok: true, world }) } } },
      });
      try {
        const controller = createResearchWorldController({
          tileManager: { createResearchTile: () => rootTile },
          getTileDOMs: () => doms,
          onCables: () => {},
        });
        await controller.reveal("mission", "mission-1");
        const firstReceipt = sessionDOM.taskFoot.children.find((child) => child.className === "qf-world-session-receipt");
        expect(sessionDOM.taskFoot.children.map((child) => child.className)).toEqual(["existing-before", "qf-world-session-receipt", "existing-after"]);
        expect(firstReceipt).toBeDefined();
        expect(firstReceipt!.children.map((row) => row.dataset.qfWorldField)).toEqual(["id", "status", "label"]);
        expect(firstReceipt!.children.map((row) => row.children[1]?.textContent)).toEqual(["session-1", "running", "Not recorded"]);
        expect(sessionDOM.container.dataset.qfWorldType).toBe("agent_session");
        expect(sessionDOM.container.dataset.qfWorldId).toBe("session-1");
        expect(sessionDOM.container.attributes.get("aria-label")).toBe("agent_session session-1");
        const nonReceiptChildren = sessionDOM.taskFoot.children.filter((child) => child.className !== "qf-world-session-receipt");
        await controller.reveal("mission", "mission-1");
        const secondReceipt = sessionDOM.taskFoot.children.find((child) => child.className === "qf-world-session-receipt");
        expect(secondReceipt).toBe(firstReceipt);
        expect(sessionDOM.taskFoot.children.filter((child) => child.className === "qf-world-session-receipt")).toHaveLength(1);
        expect(sessionDOM.taskFoot.children.filter((child) => child.className !== "qf-world-session-receipt")).toEqual(nonReceiptChildren);
      } finally {
        canvasTiles.splice(0, canvasTiles.length);
        if (previousWindow === undefined) delete (globalThis as Record<string, unknown>).window;
        else Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
      }
    });
  });

  test("keeps the session decorator on the task-foot receipt seam", async () => {
    const source = await Bun.file(new URL("./research-world.js", import.meta.url)).text();
    const decorator = source.match(/function decorateSession\(object\) \{[\s\S]*?\n\t\}\n\n\tfunction positionFor/)?.[0] ?? "";
    expect(decorator).toContain("dom.taskFoot");
    expect(decorator).toContain("qf-world-session-receipt");
    expect(decorator).not.toContain("dom.contentArea.replaceChildren");
    expect(decorator).not.toContain("renderObject");
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
    expect(source).toContain("Show research world");
    const forbidden = new RegExp([
      ["bun", "sqlite"].join(":"),
      ["node", "sqlite"].join(":"),
      "better" + "-sqlite3",
      ["node", "fs"].join(":"),
    ].join("|"));
    expect(source).not.toMatch(forbidden);
  });
});
