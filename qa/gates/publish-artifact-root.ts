/**
 * WO-106b — publish-artifact-root gate launcher (G1/G2/G3).
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
    console.error(`publish-artifact-root: bun install exited ${installCode}`);
    return 1;
  }

  const proc = Bun.spawn(["bun", "src/gates/publish-artifact-root.ts"], {
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

export async function runPublishArtifactRootGate(): Promise<{ ok: boolean }> {
  const code = await run();
  return { ok: code === 0 };
}
