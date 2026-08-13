/**
 * Deterministic runtime asset preparation for verification packaging.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { discoverDockProfileManifests } from "../../src/main/dock-profiles.ts";

export const PRODUCTION_RUNTIME_FILES = [
  "species/hermes/packed/hermes.aospkg",
  "species/hermes/packed/hermes.meta.json",
  "species/hermes/launch.json",
  "species/hermes/dock-profiles.json",
  "species/hermes/tools-allowlist.json",
  "species/claude-code/packed/claude-code.aospkg",
  "species/claude-code/packed/claude-code.meta.json",
  "species/claude-code/packed/claude-code.mjs",
  "species/claude-code/launch.json",
  "species/claude-code/dock-profiles.json",
] as const;

export const QA_RUNTIME_FILES = [
  "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
  "tools/qf-proof-agent/packed/qf-proof-agent.meta.json",
  "tools/qf-proof-agent/packed/qf-proof-agent.mjs",
  "tools/qf-proof-agent/launch.json",
  "tools/qf-proof-agent/dock-profiles.json",
  "tools/runtime-proof/packed/qf-toolloop.aospkg",
  "tools/runtime-proof/packed/qf-toolloop.meta.json",
  "tools/runtime-proof/launch.json",
  "tools/runtime-proof/dock-profiles.json",
  ...PRODUCTION_RUNTIME_FILES,
  "species/claude-code/qa-dock-profiles.json",
] as const;

/** Normal packaging inventory. QA must opt into QA_RUNTIME_FILES explicitly. */
export const RUNTIME_FILES = PRODUCTION_RUNTIME_FILES;

export type RuntimeStagingPaths = {
  stagingRoot: string;
  repoRoot: string;
};

export type RuntimeStagingOptions = {
  qaMode?: boolean;
};

function runOrThrow(
  command: string,
  args: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv,
): void {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: env ?? { ...process.env },
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with ${result.status}`);
  }
}

function copySourceTree(source: string, target: string): void {
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isDirectory()) {
      copySourceTree(from, to);
    } else if (entry.isFile()) {
      copyFileSync(from, to);
    }
  }
}

function prepareWindowsToolchainAdapter(root: string): {
  bin: string;
  cleanup: () => void;
} | null {
  if (process.platform !== "win32") return null;
  const source = join(root, "node_modules/@rivet-dev/agentos-toolchain");
  if (!existsSync(source)) throw new Error(`AgentOS toolchain missing: ${source}`);
  const target = join(
    root,
    "node_modules/@rivet-dev/agentos-toolchain-win-adapter",
  );
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
  const dist = join(target, "dist");
  const bundle = readdirSync(dist)
    .filter((name) => name.endsWith(".js"))
    .map((name) => join(dist, name))
    .find((path) => readFileSync(path, "utf8").includes("function npmBinary()"));
  if (!bundle) {
    rmSync(target, { recursive: true, force: true });
    throw new Error(`AgentOS toolchain adapter bundle missing npmBinary: ${dist}`);
  }
  const before = readFileSync(bundle, "utf8");
  const after = before
    .replaceAll('{ stdio: "pipe" }', '{ stdio: "pipe", shell: process.env.ComSpec }')
    .replaceAll('{ encoding: "utf8" }', '{ encoding: "utf8", shell: process.env.ComSpec }')
    .replaceAll(
      "symlinkSync(relative(binDir, targetAbs), join3(binDir, cmd));",
      "cpSync2(targetAbs, join3(binDir, cmd));",
    );
  if (
    after === before &&
    (!before.includes("shell: process.env.ComSpec") ||
      before.includes("symlinkSync(relative(binDir, targetAbs), join3(binDir, cmd));"))
  ) {
    rmSync(target, { recursive: true, force: true });
    throw new Error("AgentOS toolchain npm calls changed; Windows adapter needs review");
  }
  if (after !== before) writeFileSync(bundle, after, "utf8");
  return {
    bin: join(target, "bin/agentos-toolchain.mjs"),
    cleanup: () => rmSync(target, { recursive: true, force: true }),
  };
}

function assertNonEmptyFile(path: string): void {
  if (!existsSync(path)) {
    throw new Error(`runtime staging missing file: ${path}`);
  }
  if (statSync(path).size === 0) {
    throw new Error(`runtime staging empty file: ${path}`);
  }
}

export function prepareRuntimeStaging(
  paths: RuntimeStagingPaths,
  options: RuntimeStagingOptions = {},
): void {
  const { stagingRoot, repoRoot } = paths;
  const qaMode = options.qaMode === true;
  const runtimeFiles = qaMode ? QA_RUNTIME_FILES : PRODUCTION_RUNTIME_FILES;
  rmSync(stagingRoot, { recursive: true, force: true });
  mkdirSync(stagingRoot, { recursive: true });

  const stagingWorkspace = mkdtempSync(join(tmpdir(), "qf-runtime-staging-"));
  const stagingRepo = join(stagingWorkspace, "repo");
  const hermesDir = join(stagingRepo, "species/hermes");
  const claudeCodeDir = join(stagingRepo, "species/claude-code");
  const runtimeProofDir = join(stagingRepo, "tools/runtime-proof");
  const proofAgentDir = join(stagingRepo, "tools/qf-proof-agent");
  try {
    copySourceTree(join(repoRoot, "species/hermes"), hermesDir);
    copySourceTree(join(repoRoot, "species/claude-code"), claudeCodeDir);
    if (qaMode) {
      copySourceTree(join(repoRoot, "tools/qf-proof-agent"), proofAgentDir);
      copySourceTree(join(repoRoot, "tools/runtime-proof"), runtimeProofDir);
    }

    // Each copied species is its own frozen workspace. Install Hermes in the
    // production path so packing never depends on a checkout's node_modules or
    // on the QA runtime-proof fixture. QA installs its fixture workspace
    // separately and gets a separate Windows adapter copy.
    // qf-kernel is used by the Hermes harness smoke scripts, not by the
    // deploy-true ACP shim that pack-agent builds. Its nested local
    // qf-kernel-schema dependency is not portable when this workspace is
    // copied into a clean temporary root, so remove that harness-only edge in
    // the copy and regenerate its lockfile before the frozen install.
    const hermesPackagePath = join(hermesDir, "package.json");
    const hermesPackage = JSON.parse(readFileSync(hermesPackagePath, "utf8")) as {
      dependencies?: Record<string, unknown>;
    };
    if (!hermesPackage.dependencies?.["qf-kernel"]) {
      throw new Error("Hermes staging package must declare its harness qf-kernel dependency");
    }
    delete hermesPackage.dependencies["qf-kernel"];
    writeFileSync(hermesPackagePath, `${JSON.stringify(hermesPackage, null, 2)}\n`, "utf8");
    rmSync(join(hermesDir, "bun.lock"), { force: true });
    runOrThrow("bun", ["install", "--lockfile-only"], hermesDir);

    const installArgs = ["install", "--frozen-lockfile", "--backend", "copyfile"];
    runOrThrow("bun", installArgs, hermesDir);
    if (qaMode) {
      runOrThrow("bun", installArgs, runtimeProofDir);
    }

    const hermesAdapter = prepareWindowsToolchainAdapter(hermesDir);
    const proofAdapter = qaMode
      ? prepareWindowsToolchainAdapter(runtimeProofDir)
      : null;
    const packEnv = (adapter: { bin: string } | null) => adapter
      ? {
          ...process.env,
          QF_AGENTOS_TOOLCHAIN_BIN: adapter.bin,
          AGENTOS_TOOLCHAIN_NPM: "npm",
        }
      : undefined;
    try {
      if (qaMode) {
        runOrThrow("node", ["./scripts/pack-agent.mjs"], proofAgentDir);
        runOrThrow("bun", ["run", "pack-agent"], runtimeProofDir, packEnv(proofAdapter));
      }
      runOrThrow("bun", ["run", "pack-agent"], hermesDir, packEnv(hermesAdapter));
      runOrThrow("node", ["./scripts/pack-agent.mjs"], claudeCodeDir);
    } finally {
      proofAdapter?.cleanup();
      hermesAdapter?.cleanup();
    }

    const stagedRepo = stagingRepo;
    discoverDockProfileManifests(stagedRepo, { qaMode });
    for (const rel of runtimeFiles) {
      const source = join(stagedRepo, rel);
      assertNonEmptyFile(source);
      const dest = join(stagingRoot, rel);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(source, dest);
      assertNonEmptyFile(dest);
    }

    discoverDockProfileManifests(stagingRoot, { qaMode });
  } finally {
    rmSync(stagingWorkspace, { recursive: true, force: true });
  }
}
