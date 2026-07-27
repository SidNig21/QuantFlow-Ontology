/**
 * WO-106 G2 — action-transport gate launcher.
 */
import { join } from "node:path";

const CWD = join(import.meta.dir, "../../tools/qf-read-tools");

async function run(): Promise<number> {
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
