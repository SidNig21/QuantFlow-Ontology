/**
 * Cold-safe launcher for dock-profile-identity (WO-D1 D4).
 */
import { join } from "node:path";

const CWD = join(import.meta.dir, "dock-profile-identity");

async function run(): Promise<number> {
  const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
  });
  const installCode = await install.exited;
  if (installCode !== 0) {
    console.error(`dock-profile-identity: bun install exited ${installCode}`);
    return 1;
  }

  const gate = Bun.spawn(["bun", "./run.ts"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
    env: {
      ...process.env,
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: "",
      OPENROUTER_API_KEY: "",
    },
  });
  return await gate.exited;
}

if (import.meta.main) {
  process.exit(await run());
}

export async function runDockProfileIdentityGate(): Promise<{ ok: boolean }> {
  const code = await run();
  return { ok: code === 0 };
}
