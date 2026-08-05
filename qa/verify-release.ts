/**
 * Canonical native-Windows release verifier.
 *
 * CI, builders, and independent verifiers call this one command so a green
 * ontology board can never stand in for the packaged Windows application.
 * The old Linux route remains available through verify-release-linux.ts, but
 * it is compatibility evidence and never the Windows acceptance door.
 */
import { randomUUID } from "node:crypto";
import { delimiter, dirname, join } from "node:path";

const REPO_ROOT = join(import.meta.dir, "..");

export type ReleaseStage = {
  id: string;
  cwd: "." | "collab-electron";
  command: readonly [string, ...string[]];
};

export const WINDOWS_RELEASE_STAGES: readonly ReleaseStage[] = [
  {
    id: "install",
    cwd: "collab-electron",
    command: ["bun", "install", "--frozen-lockfile"],
  },
  {
    id: "unit",
    cwd: ".",
    command: ["bun", "qa/windows-unit.ts"],
  },
  {
    id: "windows-cold-boot",
    cwd: ".",
    command: ["bun", "qa/run.ts", "windows-cold-boot"],
  },
  // hermes-founder-state is deliberately NOT a release stage. It needs a real
  // WSL distro and fails closed without one, which is the correct posture for a
  // gate but wrong for this door: CI runs on windows-latest, which ships no WSL
  // distro, so listing it here turns the canonical door permanently red. Same
  // reason windows-dock-collaboration is not a stage. Run it on a founder
  // machine with `bun qa/run.ts hermes-founder-state`.
  {
    id: "repo-shape",
    cwd: ".",
    command: ["bun", "qa/run.ts", "repo-shape"],
  },
  {
    id: "lockfile-committed",
    cwd: ".",
    command: ["bun", "qa/run.ts", "lockfile-committed"],
  },
  {
    id: "kernel-sole-writer",
    cwd: ".",
    command: ["bun", "qa/run.ts", "kernel-sole-writer"],
  },
  {
    id: "no-canvas-domain-writes",
    cwd: ".",
    command: ["bun", "qa/run.ts", "no-canvas-domain-writes"],
  },
  {
    id: "kernel-sole-writer-app",
    cwd: ".",
    command: ["bun", "qa/run.ts", "kernel-sole-writer-app"],
  },
  {
    id: "doc-links",
    cwd: ".",
    command: ["bun", "qa/run.ts", "doc-links"],
  },
  {
    id: "rung-ladder",
    cwd: ".",
    command: ["bun", "qa/run.ts", "rung-ladder"],
  },
  {
    id: "one-skin",
    cwd: ".",
    command: ["bun", "qa/run.ts", "one-skin"],
  },
  // WO-g7: cheap Act I / Law gates that were rung-once and then orphaned.
  // hermes-founder-state stays out (needs WSL; CI windows-latest has none).
  // Packaged-app windows-dock-* gates stay out of this door (~100s each) —
  // see .github/workflows/packaged-app.yml.
  {
    id: "glacier-feel",
    cwd: ".",
    command: ["bun", "qa/run.ts", "glacier-feel"],
  },
  {
    id: "acp-fs-confine",
    cwd: ".",
    command: ["bun", "qa/run.ts", "acp-fs-confine"],
  },
  {
    id: "schema-bundle-aliases",
    cwd: ".",
    command: ["bun", "qa/run.ts", "schema-bundle-aliases"],
  },
  {
    id: "verb-retirement",
    cwd: ".",
    command: ["bun", "qa/run.ts", "verb-retirement"],
  },
  {
    id: "kernel-task-delegation",
    cwd: ".",
    command: ["bun", "qa/run.ts", "kernel-task-delegation"],
  },
  {
    id: "kernel-market-lineage",
    cwd: ".",
    command: ["bun", "qa/run.ts", "kernel-market-lineage"],
  },
  {
    id: "observe-door",
    cwd: ".",
    command: ["bun", "qa/run.ts", "observe-door"],
  },
];

/** Compatibility-only Linux release route; it is not Windows proof. */
export const LINUX_RELEASE_STAGES: readonly ReleaseStage[] = [
  {
    id: "install",
    cwd: "collab-electron",
    command: ["bun", "install", "--frozen-lockfile"],
  },
  {
    id: "unit",
    cwd: "collab-electron",
    command: ["./scripts/test-unit.sh"],
  },
  {
    id: "build",
    cwd: "collab-electron",
    command: ["bun", "run", "build"],
  },
  {
    id: "package",
    cwd: "collab-electron",
    command: ["bun", "run", "package:verify"],
  },
  {
    id: "qa",
    cwd: ".",
    command: ["bun", "qa/run.ts", "--all"],
  },
];

export function releaseStagesForPlatform(
  platform: NodeJS.Platform = process.platform,
): readonly ReleaseStage[] {
  return platform === "win32" ? WINDOWS_RELEASE_STAGES : LINUX_RELEASE_STAGES;
}

export function nativeWindowsReleaseAllowed(
  platform: NodeJS.Platform = process.platform,
): boolean {
  return platform === "win32";
}

/** The canonical command dispatches to the native route on Windows. */
export const RELEASE_STAGES = releaseStagesForPlatform();

export type ReleaseStageExecutor = (
  stage: ReleaseStage,
  runId: string,
) => Promise<number>;
export type ReleaseReporter = Pick<Console, "log" | "error">;

function executableCommand(
  command: readonly [string, ...string[]],
): string[] {
  const [program, ...args] = command;
  if (program === "bun") return [process.execPath, ...args];
  return [program, ...args];
}

export const executeReleaseStage: ReleaseStageExecutor = async (
  stage,
  runId,
) => {
  const currentBunDir = dirname(process.execPath);
  const path = [currentBunDir, process.env.PATH]
    .filter((value): value is string => Boolean(value))
    .join(delimiter);
  const child = Bun.spawn(executableCommand(stage.command), {
    cwd: join(REPO_ROOT, stage.cwd),
    env: { ...process.env, PATH: path, QF_RELEASE_RUN_ID: runId },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  return child.exited;
};

export function createReleaseRunId(): string {
  return randomUUID();
}

export async function runReleaseVerification(
  stages: readonly ReleaseStage[] = RELEASE_STAGES,
  executeStage: ReleaseStageExecutor = executeReleaseStage,
  reporter: ReleaseReporter = console,
  runId: string = createReleaseRunId(),
): Promise<number> {
  reporter.log(`release: runId=${runId}`);
  for (const stage of stages) {
    const display = stage.command.join(" ");
    reporter.log(`\n== release:${stage.id} (${stage.cwd}) :: ${display} ==`);

    const exitCode = await executeStage(stage, runId);
    if (exitCode !== 0) {
      reporter.error(`release:${stage.id}: failed with exit ${exitCode}`);
      return exitCode;
    }
  }

  reporter.log("\nPASS  release-verification");
  return 0;
}

if (import.meta.main) {
  if (!nativeWindowsReleaseAllowed()) {
    console.error(
      "release-verification: FAIL (native Windows 11 is required; use qa/verify-release-linux.ts only for compatibility evidence)",
    );
    process.exit(1);
  }
  process.exit(await runReleaseVerification());
}
