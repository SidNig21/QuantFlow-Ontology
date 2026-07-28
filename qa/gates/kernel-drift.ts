/**
 * Cold-safe launcher for the kernel-drift gate (WO-K3 G1–G3, G6).
 *
 * Direct use:
 *   bun qa/gates/kernel-drift.ts
 *   QF_KERNEL_DRIFT_GATE_FALSIFY=1 bun qa/gates/kernel-drift.ts
 *   QF_KERNEL_DRIFT_ENFORCE_OFF=1 bun qa/gates/kernel-drift.ts
 */
import { join } from "node:path";

const CWD = join(import.meta.dir, "kernel-drift");

async function run(): Promise<number> {
  const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
  });
  const installCode = await install.exited;
  if (installCode !== 0) {
    console.error(`kernel-drift: bun install exited ${installCode}`);
    return 1;
  }

  const gate = Bun.spawn(["bun", "./run.ts"], {
    cwd: CWD,
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
