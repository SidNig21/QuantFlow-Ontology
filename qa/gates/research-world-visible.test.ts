import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";
import {
  assertResearchWorldContract,
  compareVisibleSnapshot,
  assertSavedResearchTileAllowlist,
  assertVisibleWorldCounts,
  CLEANUP_RESERVE_MS,
  CLEANUP_PREFLIGHT_DEADLINE_MS,
  createLaunchActivity,
  EXPECTED_VISIBLE_CABLE_COUNT,
  EXPECTED_VISIBLE_TILE_COUNT,
  formatFailureReceipts,
  RESEARCH_TILE_STORAGE_KEYS,
  RESEARCH_WORLD_VISIBLE_DEADLINE_MS,
  rendererEvaluationExpression,
  removeRegisteredRoot,
  runSequentialCases,
  scheduleFirstWorldSpecialists,
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

  test("runs cases serially and derives one-launch activity with concrete red checks", async () => {
    const activity = createLaunchActivity();
    const order: string[] = [];
    let activeCallbacks = 0;
    let maxActiveCallbacks = 0;
    const run = async (name: string, ready: boolean) => {
      activeCallbacks += 1;
      maxActiveCallbacks = Math.max(maxActiveCallbacks, activeCallbacks);
      const live = { activityOpen: false, activityReady: false };
      activity.begin(live);
      if (ready) activity.markReady(live);
      await Promise.resolve();
      activity.end(live);
      activeCallbacks -= 1;
      order.push(name);
      return name;
    };
    const result = await runSequentialCases([
      () => run("forced-failure", false),
      () => run("forced-timeout", false),
      () => run("first-world", true),
      () => run("normal-reopen", true),
    ]);
    expect(result).toEqual(["forced-failure", "forced-timeout", "first-world", "normal-reopen"]);
    expect(order).toEqual(result);
    expect(maxActiveCallbacks).toBe(1);
    expect(activity).toMatchObject({ attempts: 4, ready: 2, active: 0, maxActive: 1 });

    const red = createLaunchActivity();
    const overlap = { activityOpen: false, activityReady: false };
    red.begin(overlap);
    expect(() => red.begin({ activityOpen: false, activityReady: false })).toThrow();
    red.end(overlap);
    const duplicateReady = { activityOpen: false, activityReady: false };
    red.begin(duplicateReady);
    red.markReady(duplicateReady);
    expect(() => red.markReady(duplicateReady)).toThrow();
    red.end(duplicateReady);
    const duplicateEnd = { activityOpen: false, activityReady: false };
    red.begin(duplicateEnd);
    red.end(duplicateEnd);
    expect(() => red.end(duplicateEnd)).toThrow();
    expect(red.active).toBe(0);
  });

  test("stops on a child-bearing rejection and closes its activity lease in finally", async () => {
    const activity = createLaunchActivity();
    const live = { activityOpen: false, activityReady: false };
    let invoked = 0;
    await expect(runSequentialCases([
      async () => {
        invoked += 1;
        activity.begin(live);
        try {
          throw Object.assign(new Error("child-bearing failure"), { live });
        } finally {
          activity.end(live);
        }
      },
      async () => {
        invoked += 1;
        return true;
      },
    ])).rejects.toThrow("child-bearing failure");
    expect(invoked).toBe(1);
    expect(activity.active).toBe(0);
  });

  test("requires the exact pointer-first DOM click-handler proof and no keyboard sender", () => {
    const gate = readFileSync(join(import.meta.dir, "research-world-visible.ts"), "utf8");
    const main = readFileSync(join(REPO_ROOT, "collab-electron/src/main/index.ts"), "utf8");
    const preload = readFileSync(join(REPO_ROOT, "collab-electron/src/preload/shell.ts"), "utf8");
    const renderer = readFileSync(join(REPO_ROOT, "collab-electron/src/windows/shell/src/research-world.js"), "utf8");
    const tileManager = readFileSync(join(REPO_ROOT, "collab-electron/src/windows/shell/src/tile-manager.js"), "utf8");
    const electronVitePreview = readFileSync(join(REPO_ROOT, "collab-electron/node_modules/electron-vite/dist/chunks/lib-Dvh2Hokw.js"), "utf8");
    const electronPackage = JSON.parse(readFileSync(join(REPO_ROOT, "collab-electron/package.json"), "utf8")) as { scripts?: Record<string, string> };
    const pointerStart = gate.indexOf("const pointerObjects = expected.objects.filter");
    const pointerEnd = gate.indexOf("\n  const second =", pointerStart);
    const pointerProof = gate.slice(pointerStart, pointerEnd);
    const liveStart = gate.indexOf("async function observeWorld");
    const liveEnd = gate.indexOf("\nconst TRANSIENT_ROOT_ERRORS", liveStart);
    const liveGate = gate.slice(liveStart, liveEnd);
    const spawnStart = gate.indexOf("async function spawnOwnedLaunch");
    const readinessStart = gate.indexOf("async function awaitLaunchReadiness");
    const launchReadyStart = gate.indexOf("async function launchReady");
    const launchReadyEnd = gate.indexOf("\n\ntype VisibleObject", launchReadyStart);
    const cleanupStart = gate.indexOf("async function cleanupProcessSet");
    const cleanupEnd = gate.indexOf("\n\nasync function spawnOwnedLaunch", cleanupStart);
    const buildStart = gate.indexOf("async function prepareCandidateBuild");
    const buildEnd = gate.indexOf("\n\nfunction manifestForWorld", buildStart);
    const failureStart = gate.indexOf("async function runForcedFailureCase");
    const timeoutStart = gate.indexOf("async function runForcedTimeoutCase");
    const mergeOutcomesStart = gate.indexOf("function mergeCaseOutcomes", timeoutStart);
    const firstWorldStart = gate.indexOf("async function runFirstWorldStage");
    const orchestrationStart = gate.indexOf("export async function runResearchWorldVisibleGate");
    const sequenceStart = gate.indexOf("const caseResults = await runSequentialCases", orchestrationStart);
    const sequenceEnd = gate.indexOf("\n    void caseResults;", sequenceStart);
    const spawnSource = gate.slice(spawnStart, readinessStart);
    const readinessSource = gate.slice(readinessStart, launchReadyStart);
    const launchReadySource = gate.slice(launchReadyStart, launchReadyEnd);
    const cleanupSource = gate.slice(cleanupStart, cleanupEnd);
    const buildSource = gate.slice(buildStart, buildEnd);
    const activityStart = gate.indexOf("const activity = createLaunchActivity();");
    const forcedRootStart = gate.indexOf("const failureRoot = registerRoot();");
    const preflightStart = gate.indexOf("const cleanupPreflightStartedAt = performance.now();");
    const productClock = gate.indexOf("const startedAt = performance.now();");
    const normalRootStart = gate.indexOf("const normalRoot = registerRoot();");
    const preflightSource = gate.slice(preflightStart, productClock);
    const rootCasesStart = gate.indexOf("const rootCases = [");
    const rootCleanupSource = gate.slice(rootCasesStart);
    const failureSource = gate.slice(failureStart, timeoutStart);
    const timeoutSource = gate.slice(timeoutStart, mergeOutcomesStart);
    const firstWorldSource = gate.slice(firstWorldStart, failureStart);
    const sequenceSource = gate.slice(sequenceStart, sequenceEnd);
    expect(pointerStart).toBeGreaterThanOrEqual(0);
    expect(pointerEnd).toBeGreaterThan(pointerStart);
    expect(spawnStart).toBeGreaterThanOrEqual(0);
    expect(readinessStart).toBeGreaterThan(spawnStart);
    expect(launchReadyStart).toBeGreaterThan(readinessStart);
    expect(buildStart).toBeGreaterThanOrEqual(0);
    expect(buildEnd).toBeGreaterThan(buildStart);
    expect(activityStart).toBeGreaterThanOrEqual(0);
    expect(forcedRootStart).toBeGreaterThan(activityStart);
    expect(preflightStart).toBeGreaterThan(forcedRootStart);
    expect(productClock).toBeGreaterThan(preflightStart);
    expect(normalRootStart).toBeGreaterThan(productClock);
    expect(rootCasesStart).toBeGreaterThan(normalRootStart);
    expect(failureStart).toBeGreaterThanOrEqual(0);
    expect(timeoutStart).toBeGreaterThanOrEqual(0);
    expect(firstWorldStart).toBeGreaterThanOrEqual(0);
    expect(sequenceStart).toBeGreaterThanOrEqual(0);
    expect(sequenceEnd).toBeGreaterThan(sequenceStart);
    expect(pointerProof).toContain('expected.objects.filter((entry) => entry.type !== "agent_session")');
    expect(pointerProof).toContain("pointerObjects.length === 10");
    expect(pointerProof).toContain("querySelectorAll('.qf-world-inspect')");
    expect(pointerProof).toContain("querySelectorAll('.qf-world-details')");
    expect(pointerProof).toContain("inspect.disabled");
    expect(pointerProof).toContain("getComputedStyle");
    expect(pointerProof).toContain("getClientRects");
    expect(pointerProof).toContain("details.length !== 1");
    expect(pointerProof.match(/inspect\.click\(\)/g) ?? []).toHaveLength(1);
    expect(pointerProof.match(/collapse\.click\(\)/g) ?? []).toHaveLength(1);
    expect((gate.match(/console\.log\("pointer_tiles=10 inspect=10 collapse=10"\)/g) ?? [])).toHaveLength(1);
    expect(spawnSource).toContain("activity.begin(live)");
    expect(spawnSource).toContain("endpoint: \"\"");
    expect(spawnSource).toContain("failure.live = live");
    expect(readinessSource).toContain("socket-path");
    expect(readinessSource).toContain('rpcCall(value, "ping"');
    expect(readinessSource).toContain('rpcCall(value, "app.readiness"');
    expect(readinessSource).toContain("activity.markReady(live)");
    expect(launchReadySource).toContain("return await awaitLaunchReadiness(await spawnOwnedLaunch(root, activity), deadlineAt, activity);");
    expect((gate.match(/spawn\("bun", \["run", "build"\]/g) ?? [])).toHaveLength(1);
    expect((gate.match(/spawn\("bun", \["run", "preview", "--", "--skipBuild"\]/g) ?? [])).toHaveLength(1);
    expect((spawnSource.match(/--skipBuild/g) ?? [])).toHaveLength(1);
    expect(spawnSource).not.toMatch(/\["run", "preview"\]/);
    expect(spawnSource).not.toMatch(/\["run", "(?:dev|build|package)"/);
    expect(spawnSource).not.toMatch(/\bwatch(?:er|ing)?\b/i);
    expect(gate).not.toMatch(/spawn\("bun", \["run", "dev"/);
    expect(gate).not.toMatch(/spawn\("bun", \["run", "package"/);
    expect(buildSource).toContain("cwd: COLLAB_ROOT");
    expect(buildSource).toContain("env: { ...process.env }");
    expect(buildSource).toContain("windowsHide: true");
    expect(buildSource).toContain('stdio: ["ignore", "pipe", "pipe"]');
    expect(buildSource).toContain("waitForNativeExit(child)");
    expect(buildSource).toContain("result.code === 0");
    expect(buildSource).toContain('join(COLLAB_ROOT, "out", "main", "index.js")');
    expect((gate.match(/console\.log\(`build_once_ms=\$\{[^}]+\} build_exit=\$\{[^}]+\}`\)/g) ?? [])).toHaveLength(1);
    expect(buildSource).not.toMatch(/build_once_ms=(?:0|[0-9]+) build_exit=0/);
    const buildCall = gate.indexOf("await prepareCandidateBuild();");
    expect(buildCall).toBeGreaterThanOrEqual(0);
    expect(buildCall).toBeLessThan(productClock);
    expect(buildCall).toBeLessThan(normalRootStart);
    expect(electronPackage.scripts?.preview).toBe("node ./scripts/run-local-bin.mjs electron-vite preview");
    expect(electronPackage.scripts?.preview).toContain("electron-vite preview");
    expect(electronVitePreview).toContain("if (!options.skipBuild)");
    expect(electronVitePreview).toContain("await build(inlineConfig)");
    expect(CLEANUP_PREFLIGHT_DEADLINE_MS).toBe(15_000);
    expect(preflightSource).toContain("const cleanupPreflightDeadlineAt = cleanupPreflightStartedAt + CLEANUP_PREFLIGHT_DEADLINE_MS;");
    expect(preflightSource).toContain("runForcedFailureCase");
    expect(preflightSource).toContain("runForcedTimeoutCase");
    expect(preflightSource).toContain("runSequentialCases");
    expect(preflightSource).toContain("removePreflightRoot");
    expect(preflightSource).toContain("assert(cleanupPreflightMs < CLEANUP_PREFLIGHT_DEADLINE_MS");
    expect(preflightSource).toContain("if (preflightError !== undefined) throw preflightError;");
    expect(preflightSource).not.toContain("normalRoot");
    expect(preflightSource).not.toContain("runFirstWorldStage");
    expect(preflightSource).not.toContain("runNormalReopenCase");
    expect((gate.match(/console\.log\(`cleanup_preflight_ms=\$\{[^}]+\} forced_roots_remaining=\$\{[^}]+\}`\)/g) ?? [])).toHaveLength(1);
    expect(gate).not.toContain("cleanup_preflight_ms=0");
    expect(rootCleanupSource).toContain("failureRoot");
    expect(rootCleanupSource).toContain("timeoutRoot");
    expect(rootCleanupSource).toContain("removalReceipts.push(receipt)");
    expect(rootCleanupSource).toContain("removeRootForCase");
    expect(gate.indexOf("if (preflightError !== undefined) throw preflightError;")).toBeLessThan(productClock);
    expect(gate.indexOf("runFirstWorldStage(normalRoot")).toBeGreaterThan(productClock);
    expect(gate).not.toContain("runNormalReopenCase");
    expect(gate).not.toContain("reopen_equal");
    expect(gate).not.toContain("forced_cases_clean_before_reopen");
    expect(buildSource).not.toMatch(/package|watch/i);
    expect(gate).not.toMatch(/\bwatch(?:er|ing)?\b/i);
    expect(cleanupSource).toContain("if (live.endpoint && live.child.exitCode === null)");
    expect(cleanupSource).toContain("activity.end(live)");
    expect(failureSource).toContain("spawnOwnedLaunch");
    expect(failureSource).toContain('forced_failure_phase=spawned_not_ready');
    expect(failureSource).not.toContain("awaitLaunchReadiness");
    expect(failureSource).not.toContain("launchReady");
    expect(failureSource).not.toContain("rpcCall");
    expect(failureSource).not.toContain("app.shutdown");
    expect(failureSource).not.toContain("endpoint");
    expect(timeoutSource).toContain("spawnOwnedLaunch");
    expect(timeoutSource).toContain('forced_timeout_phase=spawned_not_ready');
    expect(timeoutSource).toContain("setTimeout(() => reject(new Error(marker)), 500)");
    expect(timeoutSource).not.toContain("awaitLaunchReadiness");
    expect(timeoutSource).not.toContain("launchReady");
    expect(timeoutSource).not.toContain("rpcCall");
    expect(timeoutSource).not.toContain("app.shutdown");
    expect(timeoutSource).not.toContain("endpoint");
    expect(firstWorldSource).toContain("launchReady");
    expect(preflightSource.indexOf("runForcedFailureCase")).toBeLessThan(preflightSource.indexOf("runForcedTimeoutCase"));
    expect(gate.indexOf("runForcedTimeoutCase", preflightStart)).toBeLessThan(gate.indexOf("runFirstWorldStage(normalRoot"));
    expect((sequenceSource.match(/runFirstWorldStage/g) ?? [])).toHaveLength(1);
    expect(sequenceSource).not.toContain("runNormalReopenCase");
    expect(sequenceSource).not.toMatch(/Promise\.(all|allSettled)/);
    expect(gate).not.toContain("schedulePostFirstCases");
    expect(gate).not.toContain("post_first_case_start_spread_ms");
    expect(gate).toContain("activity.attempts === 3");
    expect(gate).toContain("activity.ready === 1");
    expect(gate).toContain("activity.active === 0");
    expect(gate).toContain("activity.maxActive === 1");
    expect(gate).toContain("pointer_tiles=10 inspect=10 collapse=10");
    expect(gate).toContain("roots_remaining");
    expect(gate).toContain("cleanup_failures=");
    expect(gate).toContain("exceeded its 60 second total deadline");
    expect((gate.match(/console\.log\(`launch_attempts=\$\{activity\.attempts\} ready_launches=\$\{activity\.ready\} active_launches=\$\{activity\.active\} max_concurrent_launches=\$\{activity\.maxActive\}`\)/g) ?? [])).toHaveLength(1);
    expect(gate).not.toContain("launch_attempts=3 ready_launches=1 active_launches=0 max_concurrent_launches=1");
    expect(liveGate).not.toMatch(/app\.ui\.pressKey|pressNativeKey|sendInputEvent|keyboard_|tab_focus_|qf-r16-tab-sentinel|\.focus\(|keyDown|keyUp|KeyboardEvent|dispatchEvent/);
    expect(gate).not.toContain("exerciseKeyboard");
    expect(gate).not.toContain("exerciseNativeKeyboard");
    expect(gate).not.toContain("pressNativeKey");
    expect(gate).not.toContain("keyboard_");
    expect(gate).not.toContain("tab_focus_");
    expect(gate).not.toContain("qf-r16-tab-sentinel");
    expect(main).toContain('registerMethod("app.ui.pressKey"');
    expect(main).toContain('["Tab", "Enter", "Escape"]');
    expect(main).toContain('sendInputEvent({ type: "keyDown", keyCode: key })');
    expect(main).toContain('sendInputEvent({ type: "keyUp", keyCode: key })');
    const keyHandlerStart = renderer.indexOf("const keyHandler = (event) => {");
    const keyHandlerEnd = renderer.indexOf("\n\t};", keyHandlerStart);
    const keyHandler = renderer.slice(keyHandlerStart, keyHandlerEnd < 0 ? renderer.length : keyHandlerEnd);
    expect(keyHandler).not.toContain('event.key === "Tab"');
    expect(keyHandler).not.toMatch(/event\.key\s*===\s*["']Tab["'][\s\S]*preventDefault/);
    expect(tileManager).not.toContain("wv.tabIndex = -1;");
    const focusStart = tileManager.indexOf("function focusCanvasTile");
    const focusEnd = tileManager.indexOf("\n\tlet fullscreenTileId = null;", focusStart);
    expect(tileManager.slice(focusStart, focusEnd < 0 ? tileManager.length : focusEnd)).toContain("dom.webview.focus()");
    expect(preload).not.toContain("app.ui.pressKey");

    const expectedFields = { id: "session", label: "Director", status: "running" };
    const expected = {
      root_id: "mission",
      objects: [{ type: "agent_session", id: "session", fields: expectedFields, accessible_name: "agent_session session" }],
      links: [],
    };
    const actual = {
      objects: [{
        type: expected.objects[0].type,
        id: expected.objects[0].id,
        accessible_name: expected.objects[0].accessible_name,
        fields: { ...expectedFields },
        position: { left: "0px", top: "0px", width: "1px", height: "1px", zIndex: "0" },
        inspector_expanded: false,
      }],
      links: [],
    };
    const captureDisplayedFieldsMismatch = () => {
      const lines: string[] = [];
      const originalLog = console.log;
      console.log = (...args: unknown[]) => { lines.push(args.map(String).join(" ")); };
      try {
        expect(() => compareVisibleSnapshot(actual, expected)).toThrow("displayed fields differ");
      } finally {
        console.log = originalLog;
      }
      expect(lines).toHaveLength(1);
      const prefix = "displayed_fields_mismatch=";
      expect(lines[0].startsWith(prefix)).toBe(true);
      const receipt = JSON.parse(lines[0].slice(prefix.length)) as {
        type: string;
        id: string;
        expected: Record<string, string>;
        actual: Record<string, string>;
        differing_fields: string[];
      };
      const sortFields = (fields: Record<string, string>) => Object.fromEntries(Object.entries(fields).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
      const expectedMap = sortFields(expected.objects[0].fields!);
      const actualMap = sortFields(actual.objects[0].fields);
      const differingFields = [...new Set([...Object.keys(expectedMap), ...Object.keys(actualMap)])]
        .sort((left, right) => left < right ? -1 : left > right ? 1 : 0)
        .filter((field) => !Object.prototype.hasOwnProperty.call(expectedMap, field)
          || !Object.prototype.hasOwnProperty.call(actualMap, field)
          || expectedMap[field] !== actualMap[field]);
      const expectedReceipt = {
        type: actual.objects[0].type,
        id: actual.objects[0].id,
        expected: expectedMap,
        actual: actualMap,
        differing_fields: differingFields,
      };
      expect(receipt).toEqual(expectedReceipt);
      expect(lines[0]).toBe(`${prefix}${JSON.stringify(expectedReceipt)}`);
      return receipt;
    };

    actual.objects[0].fields.label = "Changed label";
    expect(captureDisplayedFieldsMismatch().differing_fields).toEqual(["label"]);
    actual.objects[0].fields.label = expectedFields.label;
    expect(() => compareVisibleSnapshot(actual, expected)).not.toThrow();

    actual.objects[0].fields.id = "changed-session";
    expect(captureDisplayedFieldsMismatch().differing_fields).toEqual(["id"]);
    actual.objects[0].fields.id = expectedFields.id;
    expect(() => compareVisibleSnapshot(actual, expected)).not.toThrow();
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

});
