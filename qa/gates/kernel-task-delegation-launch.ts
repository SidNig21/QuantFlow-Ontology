/**
 * Cold-safe launcher for R5 kernel-task-delegation (runs under collab-electron deps).
 */
import { copyFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "../..");
const COLLAB = join(REPO, "collab-electron");
const SOURCE = join(import.meta.dir, "kernel-task-delegation.ts");
const DEST = join(COLLAB, "src/main/gates-kernel-task-delegation.ts");

async function run(): Promise<number> {
  try {
    copyFileSync(SOURCE, DEST);
    const child = Bun.spawn(["bun", DEST], {
      cwd: COLLAB,
      stdout: "inherit",
      stderr: "inherit",
    });
    return await child.exited;
  } finally {
    rmSync(DEST, { force: true });
  }
}

if (import.meta.main) process.exit(await run());

export async function runKernelTaskDelegationGate(): Promise<{ ok: boolean }> {
  return { ok: (await run()) === 0 };
}
