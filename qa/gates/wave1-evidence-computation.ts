#!/usr/bin/env bun
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "../..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function source(path: string): string {
  const absolute = join(REPO, path);
  assert(existsSync(absolute), `required W1-02 source is missing: ${path}`);
  return readFileSync(absolute, "utf8");
}

async function runTests(label: string, cwd: string, files: string[]): Promise<void> {
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

function verifyProductWiring(): void {
  const adapter = source("tools/qf-ufc-history/src/index.ts");
  const deterministic = source("packages/qf-kernel/src/deterministic-execution.ts");
  const service = source("collab-electron/src/main/evidence-computation.ts");
  const dock = source("collab-electron/src/windows/shell/src/dock.js");
  const world = source("collab-electron/src/windows/shell/src/research-world.js");
  assert(adapter.includes("exactly two") && adapter.includes("25_000") && adapter.includes("10 * 1024 * 1024"), "bounded two-source acquisition contract missing");
  assert(service.includes('kernelExecute("register_dataset_version"') && service.includes('purpose: "evidence"'), "Dataset purpose is not written through execute()");
  assert(service.includes('kernelExecute("execute_deterministic_run"') && service.includes("mission_id") && service.includes("quote_id"), "selected Mission/Quote calculation boundary missing");
  assert(deterministic.includes("two_way_market_history_baseline") && !/calculation[\s\S]{0,400}INSERT INTO strategy/.test(deterministic), "technique-free calculation branch missing");
  assert(dock.includes("evidenceCapabilitiesRes") && service.includes("UFC Historical Evidence") && service.includes("Research Lab"), "governed capability rows missing from Dock");
  assert(world.includes("HISTORICAL EVIDENCE") && world.includes("TRANSPARENT CALCULATION") && world.includes("RAW RESULT — NOT REVIEWED"), "W1-02 Canvas hierarchy missing");
}

export async function runWave1EvidenceComputationGate(): Promise<{ ok: boolean }> {
  try {
    verifyProductWiring();
    await runTests("official UFC history boundaries", join(REPO, "tools/qf-ufc-history"), ["src/ufc-history.test.ts"]);
    await runTests("Kernel evidence calculation boundaries", join(REPO, "packages/qf-kernel"), ["src/wave1-evidence-computation.test.ts"]);
    await runTests("packaged W1-02 desk seams", join(REPO, "collab-electron"), [
      "src/main/evidence-computation.test.ts",
      "src/windows/shell/src/dock.test.ts",
      "src/windows/shell/src/research-world.test.ts",
    ]);
    console.log("wave1-evidence-computation gate OK");
    return { ok: true };
  } catch (error) {
    console.error("wave1-evidence-computation gate FAILED:", error instanceof Error ? error.message : String(error));
    return { ok: false };
  }
}

if (import.meta.main) {
  const { ok } = await runWave1EvidenceComputationGate();
  process.exit(ok ? 0 : 1);
}
