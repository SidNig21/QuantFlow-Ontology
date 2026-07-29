/**
 * WO-CI1 rework: keep the shipped-app verifier identical in CI and operator docs.
 * Static and install-free; falsification mutates in-memory inputs through the real checker.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  RELEASE_STAGES,
  runReleaseVerification,
  type ReleaseStage,
} from "../verify-release.ts";

const REPO_ROOT = join(import.meta.dir, "../..");
const CANONICAL_COMMAND = "bun qa/verify-release.ts";

type CheckResult = { ok: boolean; reasons: string[] };
type AuthoritySources = {
  workflow: string;
  verifierHandbook: string;
  agentBriefing: string;
  runner: string;
};

// Deliberately independent from RELEASE_STAGES: this is the contract oracle
// that makes removing or reordering a live stage fail the gate.
const EXPECTED_STAGES: readonly ReleaseStage[] = [
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

function sameStage(actual: ReleaseStage, expected: ReleaseStage): boolean {
  return (
    actual.id === expected.id &&
    actual.cwd === expected.cwd &&
    actual.command.length === expected.command.length &&
    actual.command.every((part, index) => part === expected.command[index])
  );
}

export function checkReleaseVerifier(
  stages: readonly ReleaseStage[],
  sources: AuthoritySources,
): CheckResult {
  const reasons: string[] = [];

  if (
    stages.length !== EXPECTED_STAGES.length ||
    stages.some((stage, index) => !sameStage(stage, EXPECTED_STAGES[index]!))
  ) {
    reasons.push(
      "canonical release stages must be install -> unit -> production build -> all QA",
    );
  }

  for (const [name, source] of Object.entries(sources)) {
    if (name === "runner") continue;
    if (!source.includes(CANONICAL_COMMAND)) {
      reasons.push(`${name} must invoke ${CANONICAL_COMMAND}`);
    }
  }

  if (
    !/if\s*\(import\.meta\.main\)\s*\{\s*process\.exit\(await runReleaseVerification\(\)\);\s*\}/s.test(
      sources.runner,
    )
  ) {
    reasons.push(
      "qa/verify-release.ts main entrypoint must exit with runReleaseVerification()",
    );
  }

  const workflowRunCommands = [...sources.workflow.matchAll(/^\s*run:\s*(.+)$/gm)].map(
    (match) => match[1]!.trim(),
  );
  if (
    workflowRunCommands.length !== 1 ||
    workflowRunCommands[0] !== CANONICAL_COMMAND
  ) {
    reasons.push(
      `workflow must have exactly one run command: ${CANONICAL_COMMAND}`,
    );
  }

  return { ok: reasons.length === 0, reasons };
}

function loadSources(): AuthoritySources {
  return {
    workflow: readFileSync(join(REPO_ROOT, ".github/workflows/ci.yml"), "utf8"),
    verifierHandbook: readFileSync(
      join(REPO_ROOT, "docs/orders/VERIFYING.md"),
      "utf8",
    ),
    agentBriefing: readFileSync(join(REPO_ROOT, "AGENTS.md"), "utf8"),
    runner: readFileSync(join(REPO_ROOT, "qa/verify-release.ts"), "utf8"),
  };
}

const SILENT_REPORTER = { log: () => {}, error: () => {} };

async function checkRunnerBehavior(
  stages: readonly ReleaseStage[],
): Promise<string[]> {
  const reasons: string[] = [];
  const completed: string[] = [];
  const successCode = await runReleaseVerification(
    stages,
    async (stage) => {
      completed.push(stage.id);
      return 0;
    },
    SILENT_REPORTER,
  );
  const expectedIds = stages.map((stage) => stage.id);
  if (
    successCode !== 0 ||
    completed.length !== expectedIds.length ||
    completed.some((id, index) => id !== expectedIds[index])
  ) {
    reasons.push("release runner must execute every declared stage in order");
  }

  const beforeFailure: string[] = [];
  const failureCode = await runReleaseVerification(
    stages,
    async (stage) => {
      beforeFailure.push(stage.id);
      return stage.id === "build" ? 23 : 0;
    },
    SILENT_REPORTER,
  );
  if (
    failureCode !== 23 ||
    beforeFailure.includes("qa") ||
    beforeFailure.at(-1) !== "build"
  ) {
    reasons.push(
      "release runner must propagate a build failure and stop before QA",
    );
  }

  return reasons;
}

export async function runReleaseVerifierGate(): Promise<{ ok: boolean }> {
  let stages = [...RELEASE_STAGES];
  const sources = loadSources();
  const falsify = process.env.QF_RELEASE_VERIFIER_FALSIFY;

  switch (falsify) {
    case "stage":
      stages = stages.filter((stage) => stage.id !== "build");
      break;
    case "workflow":
      sources.workflow = sources.workflow.replace(
        CANONICAL_COMMAND,
        "bun qa/run.ts --all",
      );
      break;
    case "handbook":
      sources.verifierHandbook = sources.verifierHandbook.replace(
        CANONICAL_COMMAND,
        "bun qa/run.ts --all",
      );
      break;
    case undefined:
      break;
    default:
      console.error(
        `release-verifier: unknown QF_RELEASE_VERIFIER_FALSIFY=${falsify}`,
      );
      return { ok: false };
  }

  const result = checkReleaseVerifier(stages, sources);
  result.reasons.push(...(await checkRunnerBehavior(stages)));
  result.ok = result.reasons.length === 0;
  for (const reason of result.reasons) {
    console.error(`release-verifier: ${reason}`);
  }
  return { ok: result.ok };
}

if (import.meta.main) {
  const { ok } = await runReleaseVerifierGate();
  process.exit(ok ? 0 : 1);
}
