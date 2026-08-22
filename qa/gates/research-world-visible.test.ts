import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";
import {
  assertResearchWorldContract,
  assertSavedResearchTileAllowlist,
  assertVisibleWorldCounts,
  CLEANUP_RESERVE_MS,
  EXPECTED_VISIBLE_CABLE_COUNT,
  EXPECTED_VISIBLE_TILE_COUNT,
  formatFailureReceipts,
  RESEARCH_TILE_STORAGE_KEYS,
  RESEARCH_WORLD_VISIBLE_DEADLINE_MS,
  rendererEvaluationExpression,
  removeRegisteredRoot,
  scheduleFirstWorldSpecialists,
  schedulePostFirstCases,
  tabFocusObservationExpression,
  type FocusedElementReceipt,
  waitForSentinelDeparture,
  worldTimeoutDelta,
  worldObservationExpression,
} from "./research-world-visible.ts";

const REPO_ROOT = join(import.meta.dir, "../..");

describe("research-world-visible gate contract", () => {
  test("keeps the live gate bounded and contract-complete without launching in the focused test", () => {
    expect(RESEARCH_WORLD_VISIBLE_DEADLINE_MS).toBe(60_000);
    expect(CLEANUP_RESERVE_MS).toBe(8_000);
    expect(() => assertResearchWorldContract()).not.toThrow();
  });

  test("requires the corrected 13-tile/15-cable Oracle count", () => {
    expect(EXPECTED_VISIBLE_TILE_COUNT).toBe(13);
    expect(EXPECTED_VISIBLE_CABLE_COUNT).toBe(15);
    expect(() => assertVisibleWorldCounts({ objects: Array(13), links: Array(15) })).not.toThrow();
    expect(() => assertVisibleWorldCounts({ objects: Array(12), links: Array(15) })).toThrow();
    expect(() => assertVisibleWorldCounts({ objects: Array(13), links: Array(13) })).toThrow();
  });

  test("preserves the first functional failure and reports cleanup failures separately", () => {
    const receipts = formatFailureReceipts([
      { case: "normal", functionalError: new Error("world count"), cleanupError: new Error("normal cleanup") },
      { case: "forced-failure", cleanupError: new Error("forced cleanup") },
      { case: "forced-timeout", functionalError: new Error("unexpected timeout") },
    ]);
    expect(receipts.primary).toBe('primary_failure={"case":"normal","message":"world count"}');
    expect(receipts.cleanup).toBe('cleanup_failures=[{"case":"forced-failure","message":"forced cleanup"},{"case":"normal","message":"normal cleanup"}]');
    expect(receipts.ok).toBe(false);
  });

  test("returns specialist results in executor/critic order after critic resolves first", async () => {
    let resolveExecutor!: (value: string) => void;
    let resolveCritic!: (value: string) => void;
    const executor = new Promise<string>((resolve) => { resolveExecutor = resolve; });
    const critic = new Promise<string>((resolve) => { resolveCritic = resolve; });
    const started: string[] = [];
    const result = scheduleFirstWorldSpecialists(
      () => { started.push("executor"); return executor; },
      () => { started.push("critic"); return critic; },
    );
    expect(started).toEqual(["executor", "critic"]);
    resolveCritic("critic-result");
    resolveExecutor("executor-result");
    await expect(result).resolves.toEqual(["executor-result", "critic-result"]);
  });

  test("removes an existing expired-deadline root with one immediate attempt", async () => {
    const root = mkdtempSync(join(tmpdir(), "qf-r16-focused-root-"));
    try {
      const receipt = await removeRegisteredRoot(root, performance.now() - 1);
      expect(receipt.attempts).toBe(1);
      expect(existsSync(root)).toBe(false);
    } finally {
      if (existsSync(root)) rmSync(root, { recursive: true, force: true });
    }
  });

  test("JSON-encodes renderer expressions and returns the exact error shape", () => {
    const value = `quote='\" backslash=\\ newline=\n${String.fromCharCode(10)}`;
    const success = Function(`return ${rendererEvaluationExpression(JSON.stringify(value))}`)() as { ok: boolean; value: string };
    expect(success).toEqual({ ok: true, value });

    const message = `throw \"quoted\" \\ slash\n${String.fromCharCode(10)}`;
    const throwingExpression = `(() => { throw new Error(${JSON.stringify(message)}); })()`;
    const failure = Function(`return ${rendererEvaluationExpression(throwingExpression)}`)() as { ok: boolean; message: string; stack: string };
    expect(Object.keys(failure).sort()).toEqual(["message", "ok", "stack"]);
    expect(failure.ok).toBe(false);
    expect(failure.message).toBe(message);
    expect(typeof failure.stack).toBe("string");
  });

  test("world observation expression parses before it reaches the renderer", () => {
    const result = Function(`return ${rendererEvaluationExpression(worldObservationExpression())}`)() as { ok: boolean; message?: string };
    expect(result.ok).toBe(false);
    expect(result.message).toContain("document is not defined");
  });

  test("reports every sorted delta for a known 12/14 snapshot", () => {
    const expectedObjects = [
      ["mission", "m"], ["task", "source"], ["task", "review"], ["hypothesis", "h"], ["dataset", "d"], ["run", "r"],
      ["artifact", "result"], ["artifact", "findings"], ["artifact", "report"], ["agent_session", "critic"], ["agent_session", "director"], ["agent_session", "executor"], ["artifact", "source"],
    ].map(([type, id]) => ({ type, id }));
    const expectedLinks = [
      ["belongs_to", "source", "m"], ["assigned_to", "source", "executor"], ["delegated_by", "source", "director"], ["delegates_to", "director", "executor"],
      ["tests", "r", "h"], ["uses", "r", "d"], ["produces", "r", "result"], ["evaluated_by", "h", "e"], ["evaluated_by", "r", "e"], ["evaluated_by", "result", "e"],
      ["performed_by", "e", "critic"], ["produces", "critic", "findings"], ["gates", "e", "report"], ["assigned_to", "review", "critic"], ["delegated_by", "review", "director"],
    ].map(([kind, from_id, to_id]) => ({ kind, from_id, to_id }));
    const actualObjects = expectedObjects.filter((object) => !((object.type === "task" && object.id === "review") || (object.type === "agent_session" && object.id === "executor")));
    actualObjects.push({ type: "task", id: "stale" });
    const actualLinks = expectedLinks.filter((link) => !(link.kind === "assigned_to" && link.from_id === "review") && !(link.kind === "delegated_by" && link.from_id === "review"));
    actualLinks.push({ kind: "uses", from_id: "r", to_id: "source" });
    expect(worldTimeoutDelta({ objects: actualObjects, links: actualLinks }, { objects: expectedObjects, links: expectedLinks })).toBe('world_timeout={"object_count":12,"link_count":14,"missing_objects":["agent_session:executor","task:review"],"extra_objects":["task:stale"],"missing_links":["assigned_to:review:critic","delegated_by:review:director"],"extra_links":["uses:r:source"]}');
  });

  test("enforces the exact saved research-tile storage allowlist", () => {
    expect(RESEARCH_TILE_STORAGE_KEYS).toEqual(["height", "id", "ontologyId", "ontologyType", "type", "width", "x", "y", "zIndex"]);
    const state = {
      version: 1,
      tiles: [{ id: "ontology:mission:m", type: "research", x: 0, y: 0, width: 420, height: 280, zIndex: 1, ontologyType: "mission", ontologyId: "m" }],
      viewport: { centerX: 0, centerY: 0, zoom: 1 },
    };
    expect(() => assertSavedResearchTileAllowlist(state, ["mission:m"])).not.toThrow();
    expect(() => assertSavedResearchTileAllowlist({ ...state, tiles: [{ ...state.tiles[0], domainFact: "source title" }] }, ["mission:m"])).toThrow();
    expect(() => assertSavedResearchTileAllowlist({ ...state, tiles: [{ ...state.tiles[0], cableKind: "belongs_to" }] }, ["mission:m"])).toThrow();
  });

  test("starts all post-first cases before awaiting any result", async () => {
    const reported: number[] = [];
    let release!: () => void;
    const released = new Promise<void>((resolve) => { release = resolve; });
    const allStarted = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("post-first cases serialized")), 250);
      void schedulePostFirstCases(Promise.resolve(), [0, 1, 2].map(() => async (reportStarted) => {
        reportStarted();
        await released;
        return true;
      }), (index) => {
        reported.push(index);
        if (reported.length === 3) { clearTimeout(timer); resolve(); }
      }).catch(reject);
    });
    await allStarted;
    expect(reported).toEqual([0, 1, 2]);
    release();
  });

  test("does not invoke post-first callbacks when the first-world stage rejects", async () => {
    let invoked = 0;
    let rejected = false;
    try {
      await schedulePostFirstCases(Promise.reject(new Error("first world rejected")), [0, 1, 2].map(() => async () => {
        invoked += 1;
        return true;
      }));
    } catch (error) {
      rejected = error instanceof Error && error.message === "first world rejected";
    }
    expect(rejected).toBe(true);
    expect(invoked).toBe(0);
  });

  test("requires native keyboard receipts and the restricted Main key method", () => {
    const gate = readFileSync(join(import.meta.dir, "research-world-visible.ts"), "utf8");
    const main = readFileSync(join(REPO_ROOT, "collab-electron/src/main/index.ts"), "utf8");
    const preload = readFileSync(join(REPO_ROOT, "collab-electron/src/preload/shell.ts"), "utf8");
    expect(gate).toContain("app.ui.pressKey");
    expect(gate).toContain("tab_focus_receipts=");
    expect(gate).toContain("keyboard_tiles=10 enter=10 escape=10 focus_retained=20");
    expect(main).toContain('registerMethod("app.ui.pressKey"');
    expect(main).toContain('["Tab", "Enter", "Escape"]');
    expect(main).toContain('sendInputEvent({ type: "keyDown", keyCode: key })');
    expect(main).toContain('sendInputEvent({ type: "keyUp", keyCode: key })');
    expect(preload).not.toContain("app.ui.pressKey");
  });

  test("keeps fixture truth out of the renderer and exposes inspection attributes", () => {
    const renderer = readFileSync(join(REPO_ROOT, "collab-electron/src/windows/shell/src/research-world.js"), "utf8");
    const forbidden = new RegExp([
      ["bun", "sqlite"].join(":"),
      ["node", "sqlite"].join(":"),
      "better" + "-sqlite3",
      ["node", "fs"].join(":"),
    ].join("|"));
    expect(renderer).not.toMatch(forbidden);
    expect(renderer).toContain("qfWorldType");
    expect(renderer).toContain("qfWorldId");
    expect(renderer).toContain("qfWorldField");
  });

  test("describes exact Tab focus targets and an outside focus thief", () => {
    class MockElement {
      readonly tagName: string;
      readonly id: string;
      readonly className: string;
      readonly textContent: string;
      private readonly attributes: Record<string, string>;
      private readonly closestTile: MockElement | null;

      constructor(tagName: string, id: string, className: string, attributes: Record<string, string>, textContent: string, closestTile: MockElement | null = null) {
        this.tagName = tagName;
        this.id = id;
        this.className = className;
        this.attributes = attributes;
        this.textContent = textContent;
        this.closestTile = closestTile;
      }

      getAttribute(name: string): string | null {
        return this.attributes[name] ?? null;
      }

      closest(): MockElement | null {
        return this.closestTile ?? (this.attributes["data-qf-world-type"] ? this : null);
      }
    }

    class MockButton extends MockElement {}
    const globals = globalThis as unknown as Record<string, unknown>;
    const previousDocument = globals.document;
    const previousElement = globals.Element;
    const previousButton = globals.HTMLButtonElement;
    const expression = tabFocusObservationExpression();
    const evaluate = (activeElement: MockElement): unknown => {
      globals.document = { activeElement };
      globals.Element = MockElement;
      globals.HTMLButtonElement = MockButton;
      return Function(`return ${expression}`)();
    };
    const tile = new MockElement(
      "DIV",
      "ontology:mission:m1",
      "canvas-tile research-tile",
      { "data-qf-world-type": "mission", "data-qf-world-id": "m1", "aria-label": "Mission m1" },
      "Mission body",
    );
    const button = new MockButton(
      "BUTTON",
      "inspect-m1",
      "qf-world-inspect",
      { type: "button", title: "  Inspect mission  " },
      "ignored button text",
      tile,
    );
    const outside = new MockElement(
      "INPUT",
      "search-box",
      "search-control",
      { type: "text", "aria-label": "  ", title: "Outside input" },
      "ignored input text",
    );

    try {
      expect(evaluate(tile)).toEqual({
        tag: "div",
        id: "ontology:mission:m1",
        class: "canvas-tile research-tile",
        input_type: "",
        world_type: "mission",
        world_id: "m1",
        control: "tile",
        accessible_name: "Mission m1",
      });
      expect(evaluate(button)).toEqual({
        tag: "button",
        id: "inspect-m1",
        class: "qf-world-inspect",
        input_type: "button",
        world_type: "mission",
        world_id: "m1",
        control: "button",
        accessible_name: "Inspect mission",
      });
      expect(evaluate(outside)).toEqual({
        tag: "input",
        id: "search-box",
        class: "search-control",
        input_type: "text",
        world_type: "",
        world_id: "",
        control: "other",
        accessible_name: "Outside input",
      });
    } finally {
      globals.document = previousDocument;
      globals.Element = previousElement;
      globals.HTMLButtonElement = previousButton;
    }
  });

  test("waits for the sentinel to depart and returns the first different receipt", async () => {
    const sentinelId = "qf-r16-tab-sentinel-test";
    const sentinel: FocusedElementReceipt = {
      tag: "button",
      id: sentinelId,
      class: "",
      input_type: "button",
      world_type: "",
      world_id: "",
      control: "other",
      accessible_name: "R16 temporary focus sentinel",
    };
    const departed: FocusedElementReceipt = {
      tag: "div",
      id: "ontology:mission:m",
      class: "canvas-tile",
      input_type: "",
      world_type: "mission",
      world_id: "m",
      control: "tile",
      accessible_name: "mission m",
    };
    const receipts = [sentinel, sentinel, departed];
    const pauses: number[] = [];
    let reads = 0;
    const actual = await waitForSentinelDeparture(
      sentinelId,
      async () => receipts[reads++],
      async (milliseconds) => { pauses.push(milliseconds); },
      () => 100,
    );
    expect(pauses).toEqual([10, 10]);
    expect(reads).toBe(3);
    expect(actual).toEqual(departed);
  });

  test("binds sentinel waiting to the monotonic deadline and read ceiling", async () => {
    const sentinelId = "qf-r16-tab-sentinel-clock";
    const sentinel: FocusedElementReceipt = {
      tag: "button",
      id: sentinelId,
      class: "",
      input_type: "button",
      world_type: "",
      world_id: "",
      control: "other",
      accessible_name: "R16 temporary focus sentinel",
    };
    let clock = 0;
    const pauseEnds: number[] = [];
    const readTimes: number[] = [];
    const deadlineResult = await waitForSentinelDeparture(
      sentinelId,
      async () => { readTimes.push(clock); return sentinel; },
      async (milliseconds) => { pauseEnds.push(clock + milliseconds); clock += milliseconds; },
      () => clock,
    );
    expect(deadlineResult).toEqual(sentinel);
    expect(pauseEnds.length).toBeLessThanOrEqual(25);
    expect(pauseEnds.every((time) => time <= 250)).toBe(true);
    expect(readTimes.every((time) => time < 250)).toBe(true);
    expect(clock).toBe(250);

    const readCountPauses: number[] = [];
    let readCount = 0;
    const readCountResult = await waitForSentinelDeparture(
      sentinelId,
      async () => { readCount += 1; return sentinel; },
      async (milliseconds) => { readCountPauses.push(milliseconds); },
      () => 0,
    );
    expect(readCountPauses).toEqual(Array(25).fill(10));
    expect(readCount).toBe(26);
    expect(readCountResult).toEqual(sentinel);
  });

  test("returns an outside focus receipt immediately and keeps one Tab sender", async () => {
    const sentinelId = "qf-r16-tab-sentinel-outside";
    const sentinel: FocusedElementReceipt = {
      tag: "button",
      id: sentinelId,
      class: "",
      input_type: "button",
      world_type: "",
      world_id: "",
      control: "other",
      accessible_name: "R16 temporary focus sentinel",
    };
    const outside: FocusedElementReceipt = {
      tag: "input",
      id: "outside-input",
      class: "search-control",
      input_type: "text",
      world_type: "",
      world_id: "",
      control: "other",
      accessible_name: "Outside input",
    };
    let reads = 0;
    let pauses = 0;
    const actual = await waitForSentinelDeparture(
      sentinelId,
      async () => { reads += 1; return reads === 1 ? sentinel : outside; },
      async () => { pauses += 1; },
      () => 0,
    );
    expect(actual).toEqual(outside);
    expect(reads).toBe(2);
    expect(pauses).toBe(1);

    const gate = readFileSync(join(import.meta.dir, "research-world-visible.ts"), "utf8");
    const extract = (source: string, startMarker: string, endMarker: string): string => {
      const start = source.indexOf(startMarker);
      const end = source.indexOf(endMarker, start);
      return source.slice(start, end < 0 ? source.length : end);
    };
    const senderName = ["pressNative", "Key"].join("");
    const exerciseBody = extract(gate, "async function exerciseNativeKeyboard", "async function observeWorld");
    const waitBody = extract(gate, "export async function waitForSentinelDeparture", "async function pressNativeKey");
    expect(exerciseBody.split(`${senderName}(endpoint, \"Tab\")`).length - 1).toBe(1);
    expect(waitBody).not.toContain(senderName);
    const uiMethodName = ["app", "ui", "pressKey"].join(".");
    expect(gate.split(`\"${uiMethodName}\"`).length - 1).toBe(1);
  });
});
