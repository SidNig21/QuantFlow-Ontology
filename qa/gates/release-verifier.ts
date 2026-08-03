/**
 * WO-WIN1: keep the native Windows shipped-app verifier identical in CI and
 * operator docs. Static and install-free; falsification mutates in-memory
 * inputs through the real checker.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WINDOWS_RELEASE_STAGES,
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
// that makes removing or reordering a live Windows stage fail the gate.
const EXPECTED_STAGES: readonly ReleaseStage[] = [
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
    id: "doc-action-surface",
    cwd: ".",
    command: ["bun", "qa/run.ts", "doc-action-surface"],
  },
  {
    id: "one-skin",
    cwd: ".",
    command: ["bun", "qa/run.ts", "one-skin"],
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
      "canonical Windows release stages must be install -> focused unit -> cold boot -> static acceptance gates",
    );
  }

  for (const [name, source] of Object.entries(sources)) {
    if (name === "runner") continue;
    if (!source.includes(CANONICAL_COMMAND)) {
      reasons.push(`${name} must invoke ${CANONICAL_COMMAND}`);
    }
  }

  if (!/runs-on:\s*windows-latest/.test(sources.workflow)) {
    reasons.push("workflow must run the canonical verifier on windows-latest");
  }

  if (
    !/if\s*\(import\.meta\.main\)[\s\S]*if\s*\(!nativeWindowsReleaseAllowed\(\)\)[\s\S]*process\.exit\(1\)[\s\S]*process\.exit\(await runReleaseVerification\(\)\)/.test(
      sources.runner,
    )
  ) {
    reasons.push(
      "qa/verify-release.ts must fail closed off Windows and exit with runReleaseVerification()",
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
    "test-run-id",
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
  const failureIndex = stages.findIndex((stage) => stage.id === "windows-cold-boot");
  const failureCode = await runReleaseVerification(
    stages,
    async (stage) => {
      beforeFailure.push(stage.id);
      return stage.id === "windows-cold-boot" ? 47 : 0;
    },
    SILENT_REPORTER,
    "test-run-id",
  );
  if (
    failureCode !== 47 ||
    failureIndex < 0 ||
    beforeFailure.length !== failureIndex + 1 ||
    beforeFailure.at(-1) !== "windows-cold-boot"
  ) {
    reasons.push(
      "release runner must propagate the Windows cold-boot failure and stop before later gates",
    );
  }

  return reasons;
}

export async function runReleaseVerifierGate(): Promise<{ ok: boolean }> {
  let stages = [...WINDOWS_RELEASE_STAGES];
  const sources = loadSources();
  const falsify = process.env.QF_RELEASE_VERIFIER_FALSIFY;

  switch (falsify) {
    case "stage":
      stages = stages.filter((stage) => stage.id !== "windows-cold-boot");
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
