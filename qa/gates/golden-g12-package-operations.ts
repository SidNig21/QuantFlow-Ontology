import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(join(import.meta.dir, "../.."));

type Step = {
  id: string;
  cwd: string;
  command: readonly [string, ...string[]];
};

export const G12_OPERATION_STEP_IDS = [
  "package-runtime-staging",
  "bovada-windows-durability",
  "sidecar-node-lifecycle",
  "installed-readiness-shutdown",
  "unpacked-readiness-shutdown",
  "packaged-hermes-lifecycle",
] as const;

const STEPS: readonly Step[] = [
  {
    id: "package-runtime-staging",
    cwd: REPO_ROOT,
    command: ["bun", "test", "collab-electron/scripts/package-lib"],
  },
  {
    id: "bovada-windows-durability",
    cwd: REPO_ROOT,
    command: ["bun", "test", "tools/qf-bovada-football/src"],
  },
  {
    id: "sidecar-node-lifecycle",
    cwd: join(REPO_ROOT, "collab-electron"),
    command: [
      "node",
      "--import",
      "tsx",
      "--test",
      "src/main/sidecar/client.test.ts",
      "src/main/sidecar/server.test.ts",
    ],
  },
  {
    id: "installed-readiness-shutdown",
    cwd: REPO_ROOT,
    command: ["bun", "qa/run.ts", "windows-installer"],
  },
  {
    id: "unpacked-readiness-shutdown",
    cwd: REPO_ROOT,
    command: ["bun", "qa/run.ts", "windows-cold-boot"],
  },
  {
    id: "packaged-hermes-lifecycle",
    cwd: REPO_ROOT,
    command: ["bun", "qa/run.ts", "hermes-first-turn-synthetic"],
  },
] as const;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex").toUpperCase();
}

async function runStep(step: Step, env: NodeJS.ProcessEnv): Promise<{
  id: string;
  command: string;
  exit: number;
  duration_ms: number;
  output_sha256: string;
}> {
  const started = performance.now();
  const child = Bun.spawn([...step.command], {
    cwd: step.cwd,
    env,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exit] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  const output = stdout + stderr;
  process.stdout.write(output);
  return {
    id: step.id,
    command: step.command.join(" "),
    exit,
    duration_ms: Math.round(performance.now() - started),
    output_sha256: sha256(output),
  };
}

export async function runGoldenG12PackageOperationsGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("golden-g12-package-operations: FAIL native Windows is required");
    return { ok: false };
  }
  const runId = process.env.QF_RELEASE_RUN_ID?.trim() || randomUUID();
  const runRoot = join(tmpdir(), `qf-g12-${runId}`);
  mkdirSync(runRoot, { recursive: false });
  const receipt = {
    run_id: runId,
    run_root: runRoot,
    candidate: new TextDecoder().decode(
      Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd: REPO_ROOT }).stdout,
    ).trim(),
    steps: [] as Awaited<ReturnType<typeof runStep>>[],
  };
  let ok = false;
  try {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      QF_G12_RUN_ID: runId,
      QF_G12_RUN_ROOT: runRoot,
      QF_G12_RECEIPT_PATH: join(runRoot, "receipt.json"),
    };
    for (const step of STEPS) {
      console.log(`golden-g12-package-operations: step=${step.id}`);
      if (step.id === "packaged-hermes-lifecycle") {
        env.QF_G12_HERMES_LIFECYCLE = "1";
      }
      const result = await runStep(step, env);
      receipt.steps.push(result);
      if (result.exit !== 0) {
        console.error(
          `golden-g12-package-operations: FAIL step=${step.id} exit=${result.exit}`,
        );
        return { ok: false };
      }
      if (step.id === "installed-readiness-shutdown") {
        env.QF_G12_PACKAGE_ROOT = join(
          REPO_ROOT,
          "collab-electron",
          "dist",
          "win-unpacked",
        );
      }
    }
    ok = true;
    console.log("golden-g12-package-operations: PASS");
    return { ok: true };
  } finally {
    console.log(`golden-g12-package-operations: receipt=${JSON.stringify(receipt)}`);
    writeFileSync(join(runRoot, "receipt.json"), JSON.stringify(receipt, null, 2));
    rmSync(runRoot, { recursive: true, force: true });
    console.log(
      `golden-g12-package-operations: processes=0 roots_remaining=${existsSync(runRoot) ? 1 : 0} leaked=${existsSync(runRoot) ? JSON.stringify([runRoot]) : "[]"}`,
    );
    if (!ok) {
      console.error("golden-g12-package-operations: cleanup attempted after RED");
    }
  }
}
