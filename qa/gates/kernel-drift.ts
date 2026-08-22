/**
 * Cold-safe launcher for the kernel-drift gate (WO-K3 G1–G3, G6).
 *
 * WO-K3-COLD: frozen install plan is qf-kernel, then this gate package.
 *
 * Direct use:
 *   bun qa/gates/kernel-drift.ts
 *   QF_KERNEL_DRIFT_GATE_FALSIFY=1 bun qa/gates/kernel-drift.ts
 *   QF_KERNEL_DRIFT_ENFORCE_OFF=1 bun qa/gates/kernel-drift.ts
 *   QF_K3_COLD_INSTALL_FALSIFY=kernel-drift bun qa/gates/kernel-drift.ts
 */
import { join } from "node:path";
import { runFrozenPackageInstall } from "../package-install.ts";

const GATE_DIR = join(import.meta.dir, "kernel-drift");
const REPO_ROOT = join(import.meta.dir, "../..");
const KERNEL_PKG = join(REPO_ROOT, "packages/qf-kernel");

const FALSIFY_ENV = "QF_K3_COLD_INSTALL_FALSIFY";
const GATE_NAME = "kernel-drift";
const ACCEPTED_FALSIFY = new Set(["kernel-drift", "artifact-root"]);

export type ColdInstallPlanEntry = {
  name: string;
  cwd: string;
};

export function buildKernelDriftInstallPlan():
  | { ok: true; entries: ColdInstallPlanEntry[] }
  | { ok: false; error: string } {
  const falsify = process.env[FALSIFY_ENV]?.trim() ?? "";
  if (falsify !== "" && !ACCEPTED_FALSIFY.has(falsify)) {
    return {
      ok: false,
      error: `kernel-drift: unknown ${FALSIFY_ENV}=${falsify}`,
    };
  }

  const entries: ColdInstallPlanEntry[] = [
    { name: "qf-kernel", cwd: KERNEL_PKG },
    { name: GATE_NAME, cwd: GATE_DIR },
  ];

  if (falsify === GATE_NAME) {
    return {
      ok: true,
      entries: entries.filter((entry) => entry.name !== "qf-kernel"),
    };
  }

  return { ok: true, entries };
}

export function validateKernelDriftInstallPlan(
  entries: ColdInstallPlanEntry[],
): string | null {
  const expected: ColdInstallPlanEntry[] = [
    { name: "qf-kernel", cwd: KERNEL_PKG },
    { name: GATE_NAME, cwd: GATE_DIR },
  ];

  for (const entry of expected) {
    if (!entries.some((candidate) => candidate.name === entry.name)) {
      return `kernel-drift: missing install plan entry: ${entry.name}`;
    }
  }
  if (entries.length !== expected.length) {
    return `kernel-drift: install plan must contain exactly ${expected.map((e) => e.name).join(" then ")}`;
  }
  for (let i = 0; i < expected.length; i += 1) {
    if (entries[i]!.name !== expected[i]!.name) {
      return `kernel-drift: install plan order must be ${expected.map((e) => e.name).join(" then ")}`;
    }
    if (entries[i]!.cwd !== expected[i]!.cwd) {
      return `kernel-drift: install plan ${expected[i]!.name} cwd must be ${expected[i]!.cwd}`;
    }
  }
  return null;
}

async function executeInstallPlan(
  entries: ColdInstallPlanEntry[],
): Promise<number> {
  for (const entry of entries) {
    if (!(await runFrozenPackageInstall(`kernel-drift:${entry.name}`, entry.cwd))) return 1;
  }
  return 0;
}

async function run(): Promise<number> {
  const built = buildKernelDriftInstallPlan();
  if (!built.ok) {
    console.error(built.error);
    return 1;
  }

  const planError = validateKernelDriftInstallPlan(built.entries);
  if (planError) {
    console.error(planError);
    return 1;
  }

  const installCode = await executeInstallPlan(built.entries);
  if (installCode !== 0) {
    return installCode;
  }

  const gate = Bun.spawn(["bun", "./run.ts"], {
    cwd: GATE_DIR,
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env },
  });
  return await gate.exited;
}

if (import.meta.main) {
  process.exit(await run());
}

export async function runKernelDriftGate(): Promise<{ ok: boolean }> {
  const code = await run();
  return { ok: code === 0 };
}
