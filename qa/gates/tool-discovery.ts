/**
 * WO-106 D4/G1/G3 — tool-discovery gate launcher.
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
    console.error(`tool-discovery: bun install exited ${installCode}`);
    return 1;
  }

  const proc = Bun.spawn(["bun", "src/gates/tool-discovery.ts"], {
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

export async function runToolDiscoveryGate(): Promise<{ ok: boolean }> {
  const code = await run();
  return { ok: code === 0 };
}
