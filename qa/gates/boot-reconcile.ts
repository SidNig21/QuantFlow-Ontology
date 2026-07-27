/**
 * Cold-safe launcher for the boot-reconcile gate (WO-106 G5).
 *
 * Direct use:
 *   bun qa/gates/boot-reconcile.ts
 *   QF_BOOT_RECONCILE_DEFAULT_LIMIT=1 bun qa/gates/boot-reconcile.ts
 */
import { join } from "node:path";

const CWD = join(import.meta.dir, "boot-reconcile");

async function run(): Promise<number> {
  const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
  });
  const installCode = await install.exited;
  if (installCode !== 0) {
    console.error(`boot-reconcile: bun install exited ${installCode}`);
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

export async function runBootReconcileGate(): Promise<{ ok: boolean }> {
  const code = await run();
  return { ok: code === 0 };
}
