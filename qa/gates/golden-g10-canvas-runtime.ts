#!/usr/bin/env bun
/** Golden G10 regression after ADR-0005 retired alternate Canvas worlds. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "../..");
const COLLAB = join(REPO, "collab-electron");
const source = (path: string): string => readFileSync(join(REPO, path), "utf8");
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

async function test(label: string, files: string[]): Promise<void> {
  const child = Bun.spawn(["bun", "test", ...files], { cwd: COLLAB, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code !== 0) { process.stdout.write(stdout); process.stderr.write(stderr); throw new Error(`${label} exited ${code}`); }
  console.log(`golden-g10-canvas-runtime: ${label}=PASS`);
}

function contract(): void {
  const html = source("collab-electron/src/windows/shell/index.html");
  const renderer = source("collab-electron/src/windows/shell/src/renderer.js");
  const canvas = source("collab-electron/src/windows/shell/src/one-canvas.js");
  const participant = source("collab-electron/src/windows/shell/src/participant-projection.js");
  const dock = source("collab-electron/src/windows/shell/src/dock.js");
  const canvasRpc = source("collab-electron/src/windows/shell/src/canvas-rpc.js");
  const preload = source("collab-electron/src/preload/shell.ts");
  const mainRpc = source("collab-electron/src/main/canvas-rpc.ts");
  const browser = source("collab-electron/src/main/ipc-browser.ts");
  const mainKernel = source("collab-electron/src/main/ipc-kernel.ts");
  const mainAgent = source("collab-electron/src/main/agent-host.ts");
  const ipcCanvas = source("collab-electron/src/main/ipc-canvas.ts");
  const tileManager = source("collab-electron/src/windows/shell/src/tile-manager.js");
  const combined = [html, renderer, canvas, dock, ipcCanvas, preload, mainKernel, tileManager].join("\n");

  assert(renderer.includes("createOneCanvasController") && canvas.includes("ensureReadyDirector"), "one Canvas or Director-only cold surface missing");
  assert(!/ORDINARY_CANVAS|CURRENT_MISSION|FULL_LINEAGE|savedOverview|back-to-world|research-world-projection/.test(combined), "retired alternate Canvas architecture remains reachable");
  assert(!/saveCanvasState|loadCanvasState|canvas-state\.json|canvas:load-state|canvas:save-state|restoreCanvasState|setInterval\s*\(/.test(combined), "startup restoration, stale authority, or legacy polling remains");
  assert(!/createCableController|listConnections\(|createConnection\(|deleteConnection\(/.test(renderer), "arbitrary persistent cable controller remains reachable");
  assert(canvas.includes("onCables?.([])") && canvas.includes("function inspect(") && canvas.includes("renderResult"), "quiet cables, contextual Inspect, or Decision surface missing");
  assert(renderer.includes('!container?.hidden && container?.style?.display !== "none"'), "TIDY is not bounded to visible tiles");
  assert(mainAgent.includes("getLiveSessionSnapshot") && mainKernel.includes('qf:sessions:runtime-snapshot') && preload.includes('qf:sessions:runtime-snapshot'), "runtime observation bridge missing");
  assert(participant.includes("runtimeObservationForSession"), "participant runtime truth is not derived from live observation");
  assert(dock.includes("runtimeSnapshot") && renderer.includes("runtimeSnapshot"), "Dock/Canvas participant parity consumers missing");
  for (const operation of ["browserEvaluate", "browserInfo", "browserScroll", "browserWait"]) {
    const wire = operation.replace(/^browser/, "").replace(/^[A-Z]/, (value) => value.toLowerCase());
    assert(canvasRpc.includes(`window.shellApi.${operation}`), `renderer browser route missing: ${operation}`);
    assert(preload.includes(`ipcRenderer.invoke("browser:${wire}"`), `preload browser route missing: ${operation}`);
    assert(mainRpc.includes(`"canvas.${operation}"`), `Main Canvas browser route missing: ${operation}`);
    assert(browser.includes(`"browser:${wire}"`), `Main browser IPC route missing: ${operation}`);
  }
  assert(!/localStorage|sessionStorage|indexedDB/.test(canvas), "one-Canvas renderer contains a second durable store");
  console.log("golden-g10-canvas-runtime: contract=PASS one Canvas + runtime observation + browser RPC + no second store");
}

function falsifier(): void {
  const selected = Object.entries(process.env).find(([key, value]) => key.startsWith("QF_G10_") && value && !["QF_G10_SKIP_BUILD"].includes(key));
  if (selected) throw new Error(`falsifier ${selected[0]} deliberately broke G10 acceptance`);
}

export async function runGoldenG10CanvasRuntimeGate(): Promise<{ ok: boolean }> {
  try {
    contract();
    falsifier();
    await test("Canvas interaction and layout", [
      "src/windows/shell/src/one-canvas.test.ts",
      "src/windows/shell/src/canvas-rpc.test.ts",
      "src/windows/shell/src/canvas-layout.test.ts",
      "src/windows/shell/src/tile-manager-focus.test.ts",
      "src/windows/shell/src/tile-manager-layout.test.ts",
    ]);
    await test("participant, Dock, and terminal truth", [
      "src/windows/shell/src/participant-projection.test.ts",
      "src/windows/shell/src/dock.test.ts",
      "src/main/dock-profiles.test.ts",
      "src/main/runtime-adapter.test.ts",
      "src/main/terminal-target.test.ts",
      "src/main/launcher-readiness.test.ts",
      "src/main/launcher-readiness-pty.test.ts",
      "src/main/selected-agent-surface.test.ts",
      "src/main/agent-host-lifecycle.test.ts",
    ]);
    await test("Kernel handle lifecycle", ["src/main/kernel-lifecycle.test.ts"]);
    await test("PTY reconnect observation", ["src/main/pty-reconnect-observer.test.ts"]);
    await test("Kernel projection and deliberate market surface", [
      "src/main/research-world.test.ts",
      "src/main/market-research-world.test.ts",
      "src/windows/shell/src/market-desk.test.ts",
    ]);
    console.log("golden-g10-canvas-runtime PASS");
    return { ok: true };
  } catch (error) {
    console.error("golden-g10-canvas-runtime FAILED:", error instanceof Error ? error.message : String(error));
    return { ok: false };
  }
}

if (import.meta.main) process.exit((await runGoldenG10CanvasRuntimeGate()).ok ? 0 : 1);
