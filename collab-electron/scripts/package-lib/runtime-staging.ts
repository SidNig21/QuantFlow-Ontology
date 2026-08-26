/**
 * Deterministic runtime asset preparation for verification packaging.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,

  existsSync,
  mkdirSync,
  mkdtempSync,

  readdirSync,
  rmSync,
  statSync,

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
  "species/hermes/prompts/research-director.md",
  "species/hermes/prompts/worker.md",
  "species/hermes/prompts/critic.md",
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

  const proofAgentDir = join(stagingRepo, "tools/qf-proof-agent");
  try {
    copySourceTree(join(repoRoot, "species/hermes"), hermesDir);
    copySourceTree(join(repoRoot, "species/claude-code"), claudeCodeDir);
    if (qaMode) {
      copySourceTree(join(repoRoot, "tools/qf-proof-agent"), proofAgentDir);

    }

    if (qaMode) {
      runOrThrow("node", ["./scripts/pack-agent.mjs"], proofAgentDir);
    }
    runOrThrow("node", ["./scripts/pack-agent.mjs"], hermesDir);
    runOrThrow("node", ["./scripts/pack-agent.mjs"], claudeCodeDir);
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
