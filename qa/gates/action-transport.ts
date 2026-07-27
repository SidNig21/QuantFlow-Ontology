/**
 * WO-106 G2 — action-transport gate launcher.
 */
import { join } from "node:path";

const CWD = join(import.meta.dir, "../../tools/qf-read-tools");

async function run(): Promise<number> {
  const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
  });
  const installCode = await install.exited;
  if (installCode !== 0) {
    console.error(`action-transport: bun install exited ${installCode}`);
    return 1;
  }

  const proc = Bun.spawn(["bun", "src/gates/action-transport.ts"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env },
  });
  return await proc.exited;
}

if (import.meta.main) {
  process.exit(await run());
}

export async function runActionTransportGate(): Promise<{ ok: boolean }> {
  const code = await run();
  return { ok: code === 0 };
}
