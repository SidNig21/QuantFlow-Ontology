/**
 * G6 production/QA Dock inventory gate.
 *
 * Production is the exact Hermes runtime set. QA may add only the generic
 * deterministic qf-proof runtime, and every staged path is set-equal checked.
 */
import {
  readdirSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  discoverDockProfileManifests,
  type DockProfileManifest,
} from "../../collab-electron/src/main/dock-profiles.ts";
import {
  prepareRuntimeStaging,
  PRODUCTION_RUNTIME_CONTROL_FILES,
  PRODUCTION_RUNTIME_FILES,
  PRODUCTION_RUNTIME_RESOURCES,
  QA_RUNTIME_CONTROL_FILES,
  QA_RUNTIME_FILES,
  QA_RUNTIME_RESOURCES,
} from "../../collab-electron/scripts/package-lib/runtime-staging.ts";

const REPO_ROOT = resolve(import.meta.dir, "../..");

function stagedFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(path.slice(root.length + 1).replaceAll("\\", "/"));
    }
  };
  visit(root);
  return files.sort();
}

function assertSet(label: string, actual: readonly string[], expected: readonly string[]): void {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (JSON.stringify(actualSorted) !== JSON.stringify(expectedSorted)) {
    throw new Error(`${label} set mismatch: expected=${JSON.stringify(expectedSorted)} actual=${JSON.stringify(actualSorted)}`);
  }
}

function assertStagedSet(label: string, root: string, expected: readonly string[], controls: readonly string[], resources: readonly string[]): void {
  const actual = stagedFiles(root);
  const controlSet = new Set(controls);
  const resourceSet = new Set(resources);
  assertSet(`${label} controls`, actual.filter((path) => controlSet.has(path)), controls);
  assertSet(`${label} runtime resources`, actual.filter((path) => resourceSet.has(path)), resources);
  assertSet(`${label} union`, actual, expected);
}

function profileRows(manifests: readonly DockProfileManifest[]) {
  return manifests.flatMap((manifest) =>
    manifest.profiles.map((profile) => ({
      manifest: manifest.manifestRef,
      id: profile.name,
      role: profile.role,
      package_ref: profile.package_ref,
    })),
  );
}

function assertProfileSet(label: string, actual: ReturnType<typeof profileRows>, expected: readonly string[]): void {
  assertSet(label, actual.map((row) => row.id), expected);
  if (actual.some((row) => row.id.toLowerCase().includes("claude") || row.role.toLowerCase().includes("claude"))) {
    throw new Error(`${label} contains the removed Claude identity`);
  }
}

function runStagingBait(productionRoot: string): void {
  const baitName = process.env.QF_G6_FALSIFY;
  if (baitName !== "production-claude-manifest" && baitName !== "qa-fixture-leak") return;
  const bait = baitName === "production-claude-manifest"
    ? "species/claude-code/packed/claude-code.aospkg"
    : "tools/qf-proof-agent/packed/qf-proof-agent.mjs";
  const path = join(productionRoot, bait);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, `credential-free G6 bait ${baitName}\n`);
  let red = false;
  try {
    assertStagedSet("production bait", productionRoot, PRODUCTION_RUNTIME_FILES, PRODUCTION_RUNTIME_CONTROL_FILES, PRODUCTION_RUNTIME_RESOURCES);
  } catch {
    red = true;
    console.error(`falsifier=${baitName} result=red defect=${bait}`);
  } finally {
    rmSync(path, { force: true });
  }
  if (!red) throw new Error(`falsifier=${baitName} unexpectedly passed`);
  throw new Error(`falsifier=${baitName} result=red`);
}

export function runDockProductionInventoryGate(): { ok: boolean } {
  const productionRoot = mkdtempSync(join(tmpdir(), "qf-dock-production-inventory-"));
  const qaRoot = mkdtempSync(join(tmpdir(), "qf-dock-qa-inventory-"));
  try {
    prepareRuntimeStaging({ stagingRoot: productionRoot, repoRoot: REPO_ROOT });
    prepareRuntimeStaging({ stagingRoot: qaRoot, repoRoot: REPO_ROOT }, { qaMode: true });
    runStagingBait(productionRoot);

    assertStagedSet("production", productionRoot, PRODUCTION_RUNTIME_FILES, PRODUCTION_RUNTIME_CONTROL_FILES, PRODUCTION_RUNTIME_RESOURCES);
    assertStagedSet("QA", qaRoot, QA_RUNTIME_FILES, QA_RUNTIME_CONTROL_FILES, QA_RUNTIME_RESOURCES);

    const productionRows = profileRows(discoverDockProfileManifests(productionRoot));
    const qaRows = profileRows(discoverDockProfileManifests(qaRoot, { qaMode: true }));
    assertProfileSet("production", productionRows, [
      "hermes-critic",
      "hermes-research-director",
      "hermes-worker",
      "hermes-worker-2",
    ]);
    assertProfileSet("QA", qaRows, [
      "hermes-critic",
      "hermes-research-director",
      "hermes-worker",
      "hermes-worker-2",
      "qf-proof-orchestrator",
      "qf-proof-worker",
    ]);
    if (qaRows.some((row) => row.package_ref.startsWith("species/claude-code/"))) {
      throw new Error("QA inventory contains the removed Claude runtime");
    }

    console.log(
      `dock-production-inventory: productionControls=${PRODUCTION_RUNTIME_CONTROL_FILES.length} ` +
        `productionResources=${PRODUCTION_RUNTIME_RESOURCES.length} ` +
        `productionTotal=${productionRows.length} ` +
        `qaControls=${QA_RUNTIME_CONTROL_FILES.length} ` +
        `qaResources=${QA_RUNTIME_RESOURCES.length} ` +
        `qaTotal=${qaRows.length} ` +
        "productionRuntime=hermes-only qaRuntime=qf-proof-only",
    );
    return { ok: true };
  } catch (error) {
    console.error(
      `dock-production-inventory: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  } finally {
    rmSync(productionRoot, { recursive: true, force: true });
    rmSync(qaRoot, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  process.exit(runDockProductionInventoryGate().ok ? 0 : 1);
}
