/**
 * Deterministic runtime asset preparation for verification packaging.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";

export const RUNTIME_FILES = [
  "tools/runtime-proof/packed/qf-toolloop.aospkg",
  "species/hermes/packed/hermes.aospkg",
  "species/hermes/packed/hermes.meta.json",
  "species/hermes/launch.json",
  "species/hermes/tools-allowlist.json",
] as const;

export type RuntimeStagingPaths = {
  stagingRoot: string;
  repoRoot: string;
};

function runOrThrow(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with ${result.status}`);
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

export function prepareRuntimeStaging(paths: RuntimeStagingPaths): void {
  const { stagingRoot, repoRoot } = paths;
  rmSync(stagingRoot, { recursive: true, force: true });
  mkdirSync(stagingRoot, { recursive: true });

  const runtimeProofDir = join(repoRoot, "tools/runtime-proof");
  runOrThrow("bun", ["install", "--frozen-lockfile"], runtimeProofDir);
  runOrThrow("bun", ["run", "pack-agent"], runtimeProofDir);

  const hermesDir = join(repoRoot, "species/hermes");
  runOrThrow("bun", ["install", "--frozen-lockfile"], hermesDir);
  runOrThrow("bun", ["run", "pack-agent"], hermesDir);

  for (const rel of RUNTIME_FILES) {
    const source = join(repoRoot, rel);
    assertNonEmptyFile(source);
    const dest = join(stagingRoot, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(source, dest);
    assertNonEmptyFile(dest);
  }
}
