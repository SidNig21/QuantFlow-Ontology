/**
 * Cold-safe launcher for the vault-projection gate (WO-V1 G1–G5).
 *
 * Direct use:
 *   bun qa/gates/vault-projection.ts
 */
import { join } from "node:path";

const CWD = join(import.meta.dir, "../../tools/qf-vault-projection");

async function run(): Promise<number> {
  const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
  });
  const installCode = await install.exited;
  if (installCode !== 0) {
    console.error(`vault-projection: bun install exited ${installCode}`);
    return 1;
  }

  const gate = Bun.spawn(["bun", "run", "gate"], {
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

export async function runVaultProjectionGate(): Promise<{ ok: boolean }> {
  const code = await run();
  return { ok: code === 0 };
}
