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

export const RUNTIME_FILES = [
  "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
  "tools/qf-proof-agent/packed/qf-proof-agent.meta.json",
  "tools/qf-proof-agent/packed/qf-proof-agent.mjs",
  "tools/qf-proof-agent/launch.json",
  "tools/qf-proof-agent/dock-profiles.json",
  "tools/runtime-proof/packed/qf-toolloop.aospkg",
  "tools/runtime-proof/packed/qf-toolloop.meta.json",
  "tools/runtime-proof/launch.json",
  "tools/runtime-proof/dock-profiles.json",
  "species/hermes/packed/hermes.aospkg",
  "species/hermes/packed/hermes.meta.json",
  "species/hermes/launch.json",
  "species/hermes/dock-profiles.json",
  "species/hermes/tools-allowlist.json",
] as const;

export type RuntimeStagingPaths = {
  stagingRoot: string;
  repoRoot: string;
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

export function prepareRuntimeStaging(paths: RuntimeStagingPaths): void {
  const { stagingRoot, repoRoot } = paths;
  rmSync(stagingRoot, { recursive: true, force: true });
  mkdirSync(stagingRoot, { recursive: true });

  const stagingWorkspace = mkdtempSync(join(tmpdir(), "qf-runtime-staging-"));
  const stagingRepo = join(stagingWorkspace, "repo");
  const runtimeProofDir = join(stagingRepo, "tools/runtime-proof");
  const proofAgentDir = join(stagingRepo, "tools/qf-proof-agent");
  const hermesDir = join(stagingRepo, "species/hermes");
  try {
    copySourceTree(join(repoRoot, "tools/qf-proof-agent"), proofAgentDir);
    copySourceTree(join(repoRoot, "tools/runtime-proof"), runtimeProofDir);
    copySourceTree(join(repoRoot, "species/hermes"), hermesDir);
    copySourceTree(join(repoRoot, "packages/qf-kernel"), join(stagingRepo, "packages/qf-kernel"));

    runOrThrow("bun", ["install", "--frozen-lockfile"], runtimeProofDir);
    // The Hermes package entrypoint is Node built-ins only; its harness-level
    // qf-kernel dependency is not part of the deploy-true package closure.
    // Avoid installing the harness root so local file-package handling cannot
    // contaminate or lock the shared checkout.

    const adapter = prepareWindowsToolchainAdapter(runtimeProofDir);
    const packEnv = adapter
      ? {
          ...process.env,
          QF_AGENTOS_TOOLCHAIN_BIN: adapter.bin,
          AGENTOS_TOOLCHAIN_NPM: "npm",
        }
      : undefined;
    try {
      runOrThrow("node", ["./scripts/pack-agent.mjs"], proofAgentDir, packEnv);
      runOrThrow("bun", ["run", "pack-agent"], runtimeProofDir, packEnv);
      runOrThrow("bun", ["run", "pack-agent"], hermesDir, packEnv);
    } finally {
      adapter?.cleanup();
    }

    const stagedRepo = stagingRepo;
    discoverDockProfileManifests(stagedRepo);
    for (const rel of RUNTIME_FILES) {
      const source = join(stagedRepo, rel);
      assertNonEmptyFile(source);
      const dest = join(stagingRoot, rel);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(source, dest);
      assertNonEmptyFile(dest);
    }

    discoverDockProfileManifests(stagingRoot);
  } finally {
    rmSync(stagingWorkspace, { recursive: true, force: true });
  }
}
