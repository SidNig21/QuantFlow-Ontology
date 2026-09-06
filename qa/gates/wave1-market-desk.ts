#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "../..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function run(label: string, cwd: string, files: string[]): Promise<void> {
  const child = Bun.spawn(["bun", "test", ...files], { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0) {
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    throw new Error(`${label} exited ${code}`);
  }
  console.log(`${label}: PASS`);
}

function source(path: string): string {
  return readFileSync(join(REPO, path), "utf8");
}

function verifyLiveReceipt(): void {
  const receipt = source("docs/orders/evidence/w1-01/ufc-live-door.txt");
  for (const marker of [
    "Manon Fiorot vs Alexa Grasso",
    "event 29195963 / Manon Fiorot vs Alexa Grasso",
    "market 519394567 / Fight Winner",
    "selection 2380264633 / competitor 29195963-16503226",
    "selection 2380264634 / competitor 29195963-16512926",
    "/ -220 / 1.454545",
    "/ +185 / 2.850",
    "source_sha256 530d36bc19564b77ab2bea84893d6c9dbe2b8b840c1e4af096501e86fbf30236",
    "https://www.ufc.com/event/ufc-fight-night-september-12-2026",
  ]) assert(receipt.includes(marker), `live D0 receipt is missing ${marker}`);
  assert(!/fixture|synthetic/i.test(receipt), "live D0 receipt claims fixture or synthetic evidence");
  console.log("live identity receipt: PASS rendered listing + public bytes + official event identity");
}

function verifyGovernedRenderedPath(): void {
  const main = source("collab-electron/src/main/ipc-kernel.ts");
  const service = source("collab-electron/src/main/market-desk.ts");
  const preload = source("collab-electron/src/preload/shell.ts");
  const dock = source("collab-electron/src/windows/shell/src/dock.js");
  const desk = source("collab-electron/src/windows/shell/src/market-desk.js");
  const research = source("collab-electron/src/windows/shell/src/research-world.js");
  const css = source("collab-electron/src/windows/shell/src/shell.css");
  assert(main.includes('"qf:markets:capture"') && main.includes("captureBovadaMarketDesk(request)"), "normal IPC capture boundary missing");
  assert(preload.includes("captureMarkets:") && preload.includes('ipcRenderer.invoke("qf:markets:capture"'), "preload market boundary missing");
  assert(service.includes('kernelExecute("register_tool", CAPABILITY') && service.includes('kernelExecute("create_market_investigation"'), "governed Kernel actions missing");
  assert(dock.includes("marketCapabilityRes.capability") && dock.includes("capability.implementation_version") && dock.includes("options.onOpenMarkets"), "Dock DATA row is not backed by registered identity");
  assert(desk.includes("Research this market") && desk.includes("source_hash") && desk.includes("Provider time unavailable") && desk.includes("is-historical"), "Canvas market surface is incomplete");
  assert(!research.includes("removeProjectionTiles?.(staleProjectionIds)"), "research focus still removes unrelated tiles");
  assert(!css.includes('#panel-viewer[data-qf-research-projection-active="true"] #tile-layer > .canvas-tile:not([data-qf-world-type])'), "research focus still hides unrelated tiles");
  assert(!/stake|bankroll|place bet|place ticket/i.test(desk), "market surface exposes a prohibited execution control");
  console.log("governed rendered path: PASS Dock DATA → IPC → Kernel → Canvas → investigation");
}

export async function runWave1MarketDeskGate(): Promise<{ ok: boolean }> {
  try {
    verifyLiveReceipt();
    verifyGovernedRenderedPath();
    const falsifier = process.env.QF_W1_MARKET_DESK_FALSIFY;
    if (falsifier === "renderer_row") throw new Error("falsifier: renderer-only market row substituted for Kernel readback");
    if (falsifier === "replacement_focus") throw new Error("falsifier: prior replacement focus removed an unrelated tile");
    if (falsifier === "unregistered_capability") throw new Error("falsifier: Dock row identity was not registered through execute()");
    await run("capture identity/freshness falsifiers", join(REPO, "tools/qf-bovada-football"), ["src/live-markets.test.ts"]);
    await run("Kernel investigation falsifiers", join(REPO, "packages/qf-kernel"), ["src/market-desk.test.ts"]);
    await run("render/projection/reopen seams", join(REPO, "collab-electron"), ["src/main/market-research-world.test.ts", "src/windows/shell/src/market-desk.test.ts"]);
    console.log("wave1-market-desk gate OK");
    return { ok: true };
  } catch (error) {
    console.error("wave1-market-desk gate FAILED:", error instanceof Error ? error.message : String(error));
    return { ok: false };
  }
}

if (import.meta.main) {
  const { ok } = await runWave1MarketDeskGate();
  process.exit(ok ? 0 : 1);
}
