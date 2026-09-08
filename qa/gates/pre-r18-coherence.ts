#!/usr/bin/env bun
/** One-Canvas coherence regression. The retired gate proved alternate Mission worlds. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "../..");
const FALSIFY_ENV = "QF_PRE_R18_COHERENCE_FALSIFY";
const source = (path: string): string => readFileSync(join(REPO, path), "utf8");
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function test(label: string, cwd: string, files: string[]): Promise<void> {
  const child = Bun.spawn(["bun", "test", ...files], { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code !== 0) { process.stdout.write(stdout); process.stderr.write(stderr); throw new Error(`${label} exited ${code}`); }
  console.log(`pre-r18-coherence: ${label}=PASS`);
}

function verifyOneCanvasContract(): void {
  const html = source("collab-electron/src/windows/shell/index.html");
  const renderer = source("collab-electron/src/windows/shell/src/renderer.js");
  const canvas = source("collab-electron/src/windows/shell/src/one-canvas.js");
  const workflow = source("collab-electron/src/windows/shell/src/research-workflow.js");
  const desk = source("collab-electron/src/windows/shell/src/market-desk.js");
  const dock = source("collab-electron/src/windows/shell/src/dock.js");
  const ipcCanvas = source("collab-electron/src/main/ipc-canvas.ts");
  const ipcKernel = source("collab-electron/src/main/ipc-kernel.ts");
  const preload = source("collab-electron/src/preload/shell.ts");
  const tileManager = source("collab-electron/src/windows/shell/src/tile-manager.js");
  const combined = [html, renderer, canvas, workflow, desk, dock, ipcCanvas, ipcKernel, preload, tileManager].join("\n");
  assert(!/ORDINARY_CANVAS|CURRENT_MISSION|FULL_LINEAGE|savedOverview|back-to-world/.test(combined), "alternate Canvas mode architecture remains reachable");
  assert(!/research-world-projection|data-qf-world-full|data-qf-world-back/.test(html), "legacy projection controls remain in the product shell");
  assert(!/saveCanvasState|loadCanvasState|canvas-state\.json|canvas:load-state|canvas:save-state|restoreCanvasState/.test(combined), "startup restoration or stale Canvas authority remains");
  assert(!/createCableController|listConnections\(|createConnection\(|deleteConnection\(/.test(renderer), "arbitrary persistent cables remain reachable");
  assert(!/setInterval\s*\([^)]*1500/.test(renderer), "renderer retains the legacy 1.5-second world poll");
  assert(renderer.includes("createOneCanvasController") && canvas.includes("ensureReadyDirector"), "one-Canvas controller or Director-only cold surface is missing");
  assert(canvas.includes("oneCanvasSurfaceObjects") && canvas.includes("renderInvestigation") && canvas.includes("renderResult"), "deliberate investigation surface is incomplete");
  assert(canvas.includes("onCables?.([])"), "Canvas does not default to zero relationships");
  assert(workflow.includes("deriveResearchWorkflow") && workflow.includes('"investigates"'), "useful Kernel workflow resolver is missing");
  assert(desk.includes("Open investigation") && desk.includes("Refresh"), "market work is not deliberately retrievable");
  assert(dock.includes("INSPECT") && !dock.includes('mode: "HISTORY"'), "Dock does not preserve contextual Inspect or still exposes History as a primary world");
  console.log("pre-r18-coherence: one-workspace-contract=PASS");
}

function applyFalsifier(): void {
  const value = process.env[FALSIFY_ENV]?.trim();
  if (!value) return;
  const accepted = new Set(["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08", "C09", "C10", "C11", "C12", "C13", "C14"]);
  assert(accepted.has(value), `unknown ${FALSIFY_ENV}=${JSON.stringify(value)}`);
  throw new Error(`falsifier ${value}: one-Canvas coherence deliberately broken`);
}

export async function runPreR18CoherenceGate(): Promise<{ ok: boolean }> {
  try {
    verifyOneCanvasContract();
    applyFalsifier();
    await test("Kernel projection and authority", join(REPO, "collab-electron"), ["src/main/research-world.test.ts", "src/main/market-decision.test.ts"]);
    await test("rendered one-Canvas behavior", join(REPO, "collab-electron"), ["src/windows/shell/src/one-canvas.test.ts", "src/windows/shell/src/market-desk.test.ts", "src/windows/shell/src/participant-projection.test.ts", "src/windows/shell/src/dock.test.ts", "src/windows/shell/src/tile-manager-layout.test.ts", "src/windows/shell/src/tile-manager-focus.test.ts", "src/windows/shell/src/canvas-rpc.test.ts"]);
    await test("live authority and lifecycle boundaries", join(REPO, "collab-electron"), ["src/main/selected-agent-surface.test.ts", "src/main/agent-host-lifecycle.test.ts", "src/main/launcher-readiness-pty.test.ts"]);
    await test("Kernel handle lifecycle", join(REPO, "collab-electron"), ["src/main/kernel-lifecycle.test.ts"]);
    console.log("pre-r18-coherence gate OK boundary=one persistent Canvas; Kernel details are deliberate projections, never a second world");
    return { ok: true };
  } catch (error) {
    console.error("pre-r18-coherence gate FAILED:", error instanceof Error ? error.message : String(error));
    return { ok: false };
  }
}

if (import.meta.main) { const { ok } = await runPreR18CoherenceGate(); process.exit(ok ? 0 : 1); }
