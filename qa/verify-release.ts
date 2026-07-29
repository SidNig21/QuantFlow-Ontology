/**
 * Canonical cold release verifier.
 *
 * CI, builders, and independent verifiers call this one command so a green
 * ontology board can never stand in for a production Electron build.
 */
import { delimiter, dirname, join } from "node:path";

const REPO_ROOT = join(import.meta.dir, "..");

export type ReleaseStage = {
  id: "install" | "unit" | "build" | "qa";
  cwd: "." | "collab-electron";
  command: readonly [string, ...string[]];
};

export const RELEASE_STAGES: readonly ReleaseStage[] = [
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
    id: "qa",
    cwd: ".",
    command: ["bun", "qa/run.ts", "--all"],
  },
];

export type ReleaseStageExecutor = (stage: ReleaseStage) => Promise<number>;
export type ReleaseReporter = Pick<Console, "log" | "error">;

function executableCommand(
  command: readonly [string, ...string[]],
): string[] {
  const [program, ...args] = command;
  if (program === "bun") return [process.execPath, ...args];
  return [program, ...args];
}

export const executeReleaseStage: ReleaseStageExecutor = async (stage) => {
  const currentBunDir = dirname(process.execPath);
  const path = [currentBunDir, process.env.PATH]
    .filter((value): value is string => Boolean(value))
    .join(delimiter);
  const child = Bun.spawn(executableCommand(stage.command), {
    cwd: join(REPO_ROOT, stage.cwd),
    env: { ...process.env, PATH: path },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  return child.exited;
};

export async function runReleaseVerification(
  stages: readonly ReleaseStage[] = RELEASE_STAGES,
  executeStage: ReleaseStageExecutor = executeReleaseStage,
  reporter: ReleaseReporter = console,
): Promise<number> {
  for (const stage of stages) {
    const display = stage.command.join(" ");
    reporter.log(`\n== release:${stage.id} (${stage.cwd}) :: ${display} ==`);

    const exitCode = await executeStage(stage);
    if (exitCode !== 0) {
      reporter.error(`release:${stage.id}: failed with exit ${exitCode}`);
      return exitCode;
    }
  }

  reporter.log("\nPASS  release-verification");
  return 0;
}

if (import.meta.main) {
  process.exit(await runReleaseVerification());
}
