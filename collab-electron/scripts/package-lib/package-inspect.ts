/**
 * Inspect the finished Linux directory package through production resolution rules.
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  createPackage,
  extractAll,
  extractFile,
  listPackage,
  uncache,
} from "@electron/asar";
import { resolvePackageRef } from "qf-kernel/portable";
import {
  committedAllowlistPathForPackageRef,
  committedLaunchPathForPackageRef,
  packedMetaPathForPackageRef,
} from "./package-resource-paths-reexport.ts";
import { expandFileSetOutputs } from "./fileset-expand.ts";
import type { FileSet } from "./extra-resources.ts";
import { discoverDockProfileManifests } from "../../src/main/dock-profiles.ts";
import { resolveRuntimeAdapterMetadata } from "../../src/main/runtime-adapter.ts";

export const QF_PROOF_AGENT_REF = "tools/qf-proof-agent/packed/qf-proof-agent.aospkg";
export const QF_PROOF_AGENT_META =
  "tools/qf-proof-agent/packed/qf-proof-agent.meta.json";
export const QF_PROOF_AGENT_LAUNCH = "tools/qf-proof-agent/launch.json";

export const QF_PROOF_AGENT_DOCK_PROFILES =
  "tools/qf-proof-agent/dock-profiles.json";
export const QF_KERNEL_SCHEMA_MIGRATION =
  "node_modules/qf-kernel-schema/golden/migration.sql";
export const QF_KERNEL_SCHEMA_PRE_D1_AUTHORITY =
  "node_modules/qf-kernel-schema/compat/pre-d1-profile-identity.sql";
export const QF_KERNEL_SCHEMA_UPGRADE =
  "node_modules/qf-kernel-schema/golden/upgrades/0001-agent-profile-identity.sql";
export const QF_KERNEL_SCHEMA_MARKET_INGEST_UPGRADE =
  "node_modules/qf-kernel-schema/golden/upgrades/0002-market-ingest.sql";
export const QF_KERNEL_SCHEMA_MARKET_CONTEXT_UPGRADE =
  "node_modules/qf-kernel-schema/golden/upgrades/0003-market-context.sql";
export const HERMES_REF = "species/hermes/packed/hermes.aospkg";
export const HERMES_META = "species/hermes/packed/hermes.meta.json";
export const HERMES_LAUNCH = "species/hermes/launch.json";
export const HERMES_DOCK_PROFILES = "species/hermes/dock-profiles.json";
export const HERMES_TOOLS_ALLOWLIST = "species/hermes/tools-allowlist.json";

export const QF_LINUX_EXECUTABLE = "quantflow";
export const QF_PACKAGE_NAME = "@quantflow/electron";
export const QF_UPDATE_OWNER = "SidNig21";
export const QF_UPDATE_REPOSITORY = "QuantFlow-Ontology";

export const PRODUCTION_RUNTIME_CONTROL_FILES = [
  HERMES_META,
  HERMES_LAUNCH,
  HERMES_DOCK_PROFILES,
  HERMES_TOOLS_ALLOWLIST,
] as const;

export const QA_RUNTIME_CONTROL_FILES = [
  QF_PROOF_AGENT_META,
  QF_PROOF_AGENT_LAUNCH,
  QF_PROOF_AGENT_DOCK_PROFILES,
  ...PRODUCTION_RUNTIME_CONTROL_FILES,
] as const;

/** Normal package inspection. QA gates opt into QA_RUNTIME_CONTROL_FILES. */
export const RUNTIME_CONTROL_FILES = PRODUCTION_RUNTIME_CONTROL_FILES;

const REPO_SCHEMA_MIGRATION = "qf-kernel-schema/golden/migration.sql";
const REPO_SCHEMA_PRE_D1_AUTHORITY =
  "qf-kernel-schema/compat/pre-d1-profile-identity.sql";
const REPO_SCHEMA_UPGRADE =
  "qf-kernel-schema/golden/upgrades/0001-agent-profile-identity.sql";
const REPO_SCHEMA_MARKET_INGEST_UPGRADE =
  "qf-kernel-schema/golden/upgrades/0002-market-ingest.sql";
const REPO_SCHEMA_MARKET_CONTEXT_UPGRADE =
  "qf-kernel-schema/golden/upgrades/0003-market-context.sql";

export type InspectFailure = {
  ok: false;
  reason: string;
};

export type InspectSuccess = {
  ok: true;
  checkedPaths: { path: string; bytes: number }[];
};

export type InspectResult = InspectFailure | InspectSuccess;

export type InspectOptions = {
  /** When set, proves the inspector rejects a development repo root. */
  probeDevRoot?: string;
  /** Exact resources root trusted for this inspection (the temporary bait copy in D7). */
  expectedResourcesRoot?: string;
  /** QA-only package closure includes deterministic proof runtime fixtures. */
  qaMode?: boolean;
};

function fileSize(path: string): number {
  return statSync(path).size;
}

function requireNonEmpty(path: string, label: string): InspectFailure | null {
  if (!existsSync(path)) {
    return { ok: false, reason: `${label} missing: ${path}` };
  }
  const bytes = fileSize(path);
  if (bytes === 0) {
    return { ok: false, reason: `${label} empty: ${path}` };
  }
  return null;
}

function inspectAuxiliaryPaths(
  packageRef: string,
  resourcesRoot: string,
  checked: { path: string; bytes: number }[],
  requireAllowlist: boolean,
): InspectFailure | null {
  const meta = packedMetaPathForPackageRef(packageRef, resourcesRoot);
  if (!meta) {
    return { ok: false, reason: `cannot derive packed meta for ${packageRef}` };
  }
  const metaFail = requireNonEmpty(meta, "packed metadata");
  if (metaFail) return metaFail;
  checked.push({ path: meta, bytes: fileSize(meta) });

  const launch = committedLaunchPathForPackageRef(packageRef, resourcesRoot);
  if (!launch) {
    return { ok: false, reason: `cannot derive launch path for ${packageRef}` };
  }
  const launchFail = requireNonEmpty(launch, "launch document");
  if (launchFail) return launchFail;
  checked.push({ path: launch, bytes: fileSize(launch) });

  if (!requireAllowlist) return null;

  const allowlist = committedAllowlistPathForPackageRef(packageRef, resourcesRoot);
  if (!allowlist) {
    return {
      ok: false,
      reason: `cannot derive tools-allowlist path for ${packageRef}`,
    };
  }
  const allowFail = requireNonEmpty(allowlist, "tools allowlist");
  if (allowFail) return allowFail;
  checked.push({ path: allowlist, bytes: fileSize(allowlist) });

  return null;
}

function inspectRuntimeControlFiles(
  resourcesRoot: string,
  repoRoot: string,
  checked: { path: string; bytes: number }[],
  files: readonly string[],
): InspectFailure | null {
  for (const rel of files) {
    const packagedPath = join(resourcesRoot, rel);
    if (!existsSync(packagedPath)) {
      return { ok: false, reason: `runtime control file missing: ${rel}` };
    }
    const sourcePath = join(repoRoot, rel);
    if (!existsSync(sourcePath)) {
      return { ok: false, reason: `runtime source control file missing: ${rel}` };
    }
    const packagedBytes = readFileSync(packagedPath);
    const sourceBytes = readFileSync(sourcePath);
    if (packagedBytes.compare(sourceBytes) !== 0) {
      return {
        ok: false,
        reason:
          `runtime control byte mismatch: ${rel}` +
          ` packaged=${sha256Buffer(packagedBytes)}` +
          ` source=${sha256Buffer(sourceBytes)}`,
      };
    }
    checked.push({ path: packagedPath, bytes: packagedBytes.length });
  }
  return null;
}

function assertPackagedResourcesRoot(
  resourcesRoot: string,
  expectedResourcesRoot: string,
): InspectFailure | null {
  const normalized = resolve(resourcesRoot);
  if (normalized !== resolve(expectedResourcesRoot)) {
    return {
      ok: false,
      reason: "root escape: inspection must target packaged resources root",
    };
  }
  return null;
}

function inspectStagedRuntimeReferences(
  resourcesRoot: string,
  qaMode: boolean,
  checked: { path: string; bytes: number }[],
): InspectFailure | null {
  let manifests: ReturnType<typeof discoverDockProfileManifests>;
  try {
    manifests = discoverDockProfileManifests(resourcesRoot, { qaMode });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `runtime control validation failed: ${message}` };
  }

  const packageRefs = [...new Set(
    manifests.flatMap((manifest) =>
      manifest.profiles.map((profile) => profile.package_ref),
    ),
  )].sort();

  for (const packageRef of packageRefs) {
    let resolved: ReturnType<typeof resolveRuntimeAdapterMetadata>;
    try {
      resolved = resolveRuntimeAdapterMetadata(packageRef, resourcesRoot);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        reason: `unresolved staged runtime reference ${packageRef}: ${message}`,
      };
    }
    if (resolved.metadata.route !== "native_tui" && resolved.metadata.route !== "host_acp") {
      return {
        ok: false,
        reason: `unsupported staged runtime route "${resolved.metadata.route}" for package_ref "${packageRef}"`,
      };
    }
    const packageFail = requireNonEmpty(resolved.packagePath, "runtime package");
    if (packageFail) return packageFail;
    checked.push({ path: resolved.packagePath, bytes: fileSize(resolved.packagePath) });
    const auxFail = inspectAuxiliaryPaths(
      packageRef,
      resourcesRoot,
      checked,
      packageRef === HERMES_REF,
    );
    if (auxFail) return auxFail;
  }

  return null;
}
export function inspectPackagedResources(
  resourcesRoot: string,
  collabRoot: string,
  fileSets: FileSet[],
  options: InspectOptions = {},
): InspectResult {
  const productionResourcesRoot = join(
    collabRoot,
    "dist",
    "linux-unpacked",
    "resources",
  );
  if (options.probeDevRoot) {
    const probe = resolve(options.probeDevRoot);
    const escape = assertPackagedResourcesRoot(probe, productionResourcesRoot);
    if (!escape) {
      return {
        ok: false,
        reason: "root escape: dev-root probe unexpectedly matched packaged resources",
      };
    }
    try {
      resolvePackageRef(HERMES_REF, probe, "hermes");
    } catch {
      return {
        ok: false,
        reason: "root escape: inspection used development repo root instead of packaged resources",
      };
    }
    return {
      ok: false,
      reason: "root escape: inspection used development repo root instead of packaged resources",
    };
  }

  const root = resolve(resourcesRoot);
  const packagedCheck = assertPackagedResourcesRoot(
    root,
    options.expectedResourcesRoot ?? productionResourcesRoot,
  );
  if (packagedCheck) return packagedCheck;

  const checked: { path: string; bytes: number }[] = [];
  const repoRoot = join(collabRoot, "..");
  const qaMode = options.qaMode ?? process.env.QF_DOCK_QA_MODE === "1";
  const runtimeControlFiles = qaMode
    ? QA_RUNTIME_CONTROL_FILES
    : PRODUCTION_RUNTIME_CONTROL_FILES;

  const controlFail = inspectRuntimeControlFiles(
    root,
    repoRoot,
    checked,
    runtimeControlFiles,
  );
  if (controlFail) return controlFail;

  const stagedRuntimeFail = inspectStagedRuntimeReferences(root, qaMode, checked);
  if (stagedRuntimeFail) return stagedRuntimeFail;
  for (const fileSet of fileSets) {
    const outputs = expandFileSetOutputs(collabRoot, fileSet);
    for (const output of outputs) {
      const packaged = join(root, output.destination);
      const fail = requireNonEmpty(packaged, "FileSet output");
      if (fail) {
        return {
          ok: false,
          reason: `${fail.reason} (from ${output.source})`,
        };
      }
      checked.push({ path: packaged, bytes: fileSize(packaged) });
    }
  }

  const sqlInspect = inspectAsarSqlArtifacts(root, repoRoot);
  if ("ok" in sqlInspect && sqlInspect.ok === false) {
    return sqlInspect;
  }
  if ("entries" in sqlInspect) {
    checked.push(...sqlInspect.entries);
  }

  const productIdentity = inspectPackagedProductIdentity(root);
  if ("ok" in productIdentity && productIdentity.ok === false) {
    return productIdentity;
  }
  if ("entries" in productIdentity) {
    checked.push(...productIdentity.entries);
  }

  return { ok: true, checkedPaths: checked };
}

function copyDir(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}

export function copyPackageForBait(packageRoot: string): string {
  const baitRoot = join(
    tmpdir(),
    `qf-package-closure-bait-${process.pid}-${Date.now()}`,
  );
  rmSync(baitRoot, { recursive: true, force: true });
  mkdirSync(baitRoot, { recursive: true });
  copyDir(packageRoot, baitRoot);
  return baitRoot;
}

export function removeHermesPackage(baitPackageRoot: string): void {
  const target = join(baitPackageRoot, "resources", HERMES_REF);
  rmSync(target, { force: true });
}

function asarEntryPath(path: string): string {
  return process.platform === "win32" ? path.replaceAll("/", "\\") : path;
}
function sha256Buffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Prove the finished package contains the fixed Bovada boundary and the exact
 * shipped qf-canvas resource. This reads package bytes only; it never starts a
 * vendor request or mutates the package.
 */
export function inspectBovadaPackagedSurface(
  resourcesRoot: string,
  repoRoot: string,
): InspectResult {
  const asarPath = join(resourcesRoot, "app.asar");
  if (!existsSync(asarPath)) {
    return { ok: false, reason: "Bovada package proof missing app.asar" };
  }

  let mainBundle: Buffer;
  try {
    mainBundle = extractFile(asarPath, asarEntryPath("out/main/index.js"));
  } catch {
    return {
      ok: false,
      reason: "Bovada package proof missing out/main/index.js",
    };
  }
  const bundleText = mainBundle.toString("utf8");
  const requiredNeedles = [
    "https://www.bovada.lv/services/sports/event/v2/events/A/description/football/nfl",
    "QuantFlow-Bovada-Football/0.1",
    'credentials: "omit"',
    "market.bovadaFootballCapture",
  ];
  for (const needle of requiredNeedles) {
    if (!bundleText.includes(needle)) {
      return {
        ok: false,
        reason: `Bovada main bundle missing required marker: ${needle}`,
      };
    }
  }

  const sourceCliPath = join(repoRoot, "collab-electron", "cli", "collab-cli.mjs");
  const packagedCliPath = join(resourcesRoot, "collab-cli.mjs");
  if (!existsSync(sourceCliPath) || !existsSync(packagedCliPath)) {
    return { ok: false, reason: "Bovada package proof missing qf-canvas CLI bytes" };
  }
  const sourceCli = readFileSync(sourceCliPath);
  const packagedCli = readFileSync(packagedCliPath);
  if (sourceCli.compare(packagedCli) !== 0) {
    return {
      ok: false,
      reason:
        "packaged qf-canvas byte mismatch" +
        ` packaged=${sha256Buffer(packagedCli)} source=${sha256Buffer(sourceCli)}`,
    };
  }
  const cliText = packagedCli.toString("utf8");
  for (const marker of [
    "market bovada-football --once",
    "market bovada-football --at <UTC>",
    "market.bovadaFootballCapture",
  ]) {
    if (!cliText.includes(marker)) {
      return { ok: false, reason: `packaged qf-canvas missing marker: ${marker}` };
    }
  }

  return {
    ok: true,
    checkedPaths: [
      { path: "app.asar:out/main/index.js", bytes: mainBundle.length },
      { path: "resources/collab-cli.mjs", bytes: packagedCli.length },
    ],
  };
}

function inspectAsarSqlArtifacts(
  resourcesRoot: string,
  repoRoot: string,
): InspectFailure | { entries: { path: string; bytes: number }[] } {
  const asarPath = join(resourcesRoot, "app.asar");
  if (!existsSync(asarPath)) {
    return { ok: false, reason: "app.asar missing from packaged resources" };
  }

  const checked: { path: string; bytes: number }[] = [];
  const pairs: Array<{ packaged: string; golden: string }> = [
    {
      packaged: QF_KERNEL_SCHEMA_MIGRATION,
      golden: REPO_SCHEMA_MIGRATION,
    },
    {
      packaged: QF_KERNEL_SCHEMA_PRE_D1_AUTHORITY,
      golden: REPO_SCHEMA_PRE_D1_AUTHORITY,
    },
    {
      packaged: QF_KERNEL_SCHEMA_UPGRADE,
      golden: REPO_SCHEMA_UPGRADE,
    },
    {
      packaged: QF_KERNEL_SCHEMA_MARKET_INGEST_UPGRADE,
      golden: REPO_SCHEMA_MARKET_INGEST_UPGRADE,
    },
    {
      packaged: QF_KERNEL_SCHEMA_MARKET_CONTEXT_UPGRADE,
      golden: REPO_SCHEMA_MARKET_CONTEXT_UPGRADE,
    },
  ];

  for (const pair of pairs) {
    let packagedBytes: Buffer;
    try {
      packagedBytes = extractFile(asarPath, asarEntryPath(pair.packaged));
    } catch {
      return {
        ok: false,
        reason: `missing packaged SQL artifact: ${pair.packaged}`,
      };
    }

    const goldenPath = join(repoRoot, pair.golden);
    if (!existsSync(goldenPath)) {
      return { ok: false, reason: `missing golden SQL artifact: ${goldenPath}` };
    }
    const goldenBytes = readFileSync(goldenPath);
    if (packagedBytes.compare(goldenBytes) !== 0) {
      return {
        ok: false,
        reason: `SQL artifact byte mismatch: ${pair.packaged} packaged=${sha256Buffer(packagedBytes)} golden=${sha256Buffer(goldenBytes)}`,
      };
    }
    checked.push({ path: pair.packaged, bytes: packagedBytes.length });
  }

  return { entries: checked };
}

function yamlScalar(source: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^\\s*${escaped}\\s*:\\s*["']?([^"'\\s#]+)["']?\\s*(?:#.*)?$`, "m")
    .exec(source);
  return match?.[1] ?? null;
}

function inspectPackagedProductIdentity(
  resourcesRoot: string,
): InspectFailure | { entries: { path: string; bytes: number }[] } {
  const packageRoot = resolve(resourcesRoot, "..");
  const executablePath = join(packageRoot, QF_LINUX_EXECUTABLE);
  const executableFail = requireNonEmpty(executablePath, "QuantFlow executable");
  if (executableFail) return executableFail;
  if ((statSync(executablePath).mode & 0o111) === 0) {
    return {
      ok: false,
      reason: `QuantFlow executable is not executable: ${executablePath}`,
    };
  }

  const legacyExecutable = join(packageRoot, "collaborator");
  if (existsSync(legacyExecutable)) {
    return {
      ok: false,
      reason: `legacy production executable still emitted: ${legacyExecutable}`,
    };
  }

  const asarPath = join(resourcesRoot, "app.asar");
  let manifestBytes: Buffer;
  try {
    manifestBytes = extractFile(asarPath, asarEntryPath("package.json"));
  } catch {
    return { ok: false, reason: "packaged app.asar manifest missing: package.json" };
  }

  let manifest: { name?: unknown };
  try {
    manifest = JSON.parse(manifestBytes.toString("utf8")) as { name?: unknown };
  } catch {
    return { ok: false, reason: "packaged app.asar manifest is not valid JSON" };
  }
  if (manifest.name !== QF_PACKAGE_NAME) {
    return {
      ok: false,
      reason: `packaged app.asar manifest name must be ${QF_PACKAGE_NAME}, got ${String(manifest.name)}`,
    };
  }

  const updatePath = join(resourcesRoot, "app-update.yml");
  const updateFail = requireNonEmpty(updatePath, "packaged update metadata");
  if (updateFail) return updateFail;
  const updateSource = readFileSync(updatePath, "utf8");
  const provider = yamlScalar(updateSource, "provider");
  const owner = yamlScalar(updateSource, "owner");
  const repo = yamlScalar(updateSource, "repo");
  if (
    provider !== "github" ||
    owner !== QF_UPDATE_OWNER ||
    repo !== QF_UPDATE_REPOSITORY
  ) {
    return {
      ok: false,
      reason:
        "packaged update target mismatch:" +
        ` provider=${String(provider)} owner=${String(owner)} repo=${String(repo)}`,
    };
  }
  if (/collabs-inc|collab-public/i.test(updateSource)) {
    return {
      ok: false,
      reason: "legacy production update target still emitted in app-update.yml",
    };
  }

  return {
    entries: [
      { path: executablePath, bytes: fileSize(executablePath) },
      { path: "app.asar:package.json", bytes: manifestBytes.length },
      { path: updatePath, bytes: fileSize(updatePath) },
    ],
  };
}

export type AsarInventoryDiff = {
  removed: string[];
  added: string[];
};

function normalizedFileInventory(root: string, prefix = ""): string[] {
  const paths: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      paths.push(...normalizedFileInventory(join(root, entry.name), rel));
    } else if (entry.isFile()) {
      paths.push(rel);
    }
  }
  return paths.sort();
}

export function removeDockProfilesManifest(
  baitPackageRoot: string,
  manifestRef = HERMES_DOCK_PROFILES,
): AsarInventoryDiff {
  const resourcesRoot = join(baitPackageRoot, "resources");
  const inventoryBefore = normalizedFileInventory(resourcesRoot);
  const target = join(resourcesRoot, manifestRef);
  if (!existsSync(target)) {
    throw new Error(`missing Dock profile manifest before bait removal: ${manifestRef}`);
  }
  rmSync(target);
  const inventoryAfter = normalizedFileInventory(resourcesRoot);
  const beforeSet = new Set(inventoryBefore);
  const afterSet = new Set(inventoryAfter);
  return {
    removed: [...beforeSet].filter((entry) => !afterSet.has(entry)).sort(),
    added: [...afterSet].filter((entry) => !beforeSet.has(entry)).sort(),
  };
}

function normalizedAsarInventory(asarPath: string): string[] {
  return listPackage(asarPath, { isPack: false })
    .map((entry) => entry.replace(/^[/\\]+/, "").replaceAll("\\", "/"))
    .sort();
}

export async function removeD1UpgradeFromAsar(
  baitPackageRoot: string,
): Promise<AsarInventoryDiff> {
  return removeUpgradeFromAsar(baitPackageRoot, QF_KERNEL_SCHEMA_UPGRADE);
}

export async function removeMarketIngestUpgradeFromAsar(
  baitPackageRoot: string,
): Promise<AsarInventoryDiff> {
  return removeUpgradeFromAsar(
    baitPackageRoot,
    QF_KERNEL_SCHEMA_MARKET_INGEST_UPGRADE,
  );
}

export async function removeMarketContextUpgradeFromAsar(
  baitPackageRoot: string,
): Promise<AsarInventoryDiff> {
  return removeUpgradeFromAsar(
    baitPackageRoot,
    QF_KERNEL_SCHEMA_MARKET_CONTEXT_UPGRADE,
  );
}

async function removeUpgradeFromAsar(
  baitPackageRoot: string,
  packagedUpgradePath: string,
): Promise<AsarInventoryDiff> {
  const asarPath = join(baitPackageRoot, "resources", "app.asar");
  if (!existsSync(asarPath)) {
    throw new Error(`missing bait app.asar: ${asarPath}`);
  }

  const inventoryBefore = normalizedAsarInventory(asarPath);
  const extractRoot = join(tmpdir(), `qf-asar-bait-${process.pid}-${Date.now()}`);
  const replacementPath = `${asarPath}.qf-bait-${process.pid}-${Date.now()}`;
  rmSync(extractRoot, { recursive: true, force: true });
  rmSync(replacementPath, { force: true });

  try {
    mkdirSync(extractRoot, { recursive: true });
    extractAll(asarPath, extractRoot);

    const upgradePath = join(extractRoot, packagedUpgradePath);
    if (!existsSync(upgradePath)) {
      throw new Error(
        `missing packaged SQL artifact before bait removal: ${packagedUpgradePath}`,
      );
    }
    rmSync(upgradePath);

    await createPackage(extractRoot, replacementPath);
    renameSync(replacementPath, asarPath);

    // @electron/asar caches archive headers by path. The copied archive now has
    // new bytes at the same path, so force the after-inventory to reread disk.
    uncache(asarPath);
    const inventoryAfter = normalizedAsarInventory(asarPath);
    const beforeSet = new Set(inventoryBefore);
    const afterSet = new Set(inventoryAfter);
    return {
      removed: [...beforeSet].filter((entry) => !afterSet.has(entry)).sort(),
      added: [...afterSet].filter((entry) => !beforeSet.has(entry)).sort(),
    };
  } finally {
    uncache(asarPath);
    rmSync(extractRoot, { recursive: true, force: true });
    rmSync(replacementPath, { force: true });
  }
}
