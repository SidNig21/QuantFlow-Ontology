/**
 * Cold-safe launcher for the artifact-root gate (WO-K3 G4 / D5).
 *
 * Direct use:
 *   bun qa/gates/artifact-root.ts
 */
import { join } from "node:path";

const CWD = join(import.meta.dir, "artifact-root");

async function run(): Promise<number> {
  const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
  });
  const installCode = await install.exited;
  if (installCode !== 0) {
    console.error(`artifact-root: bun install exited ${installCode}`);
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

export async function runArtifactRootGate(): Promise<{ ok: boolean }> {
  const code = await run();
  return { ok: code === 0 };
}
