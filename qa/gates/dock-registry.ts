/**
 * Cold-safe launcher for the dock-registry gate (WO-007 D8).
 *
 * Heavy deps live in ./dock-registry/ and are imported only after
 * `bun install` + pack-agent in a subprocess — missing deps fail this gate,
 * never the qa runner's module load.
 *
 * Direct use (falsify flags):
 *   bun qa/gates/dock-registry.ts
 *   QF_DOCK_REGISTRY_SKIP_REGISTER=1 bun qa/gates/dock-registry.ts
 *   QF_DOCK_REGISTRY_LIST_FAKE=1 bun qa/gates/dock-registry.ts
 */
import { join } from "node:path";

const CWD = join(import.meta.dir, "dock-registry");

async function run(): Promise<number> {
  const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
  });
  const installCode = await install.exited;
  if (installCode !== 0) {
    console.error(`dock-registry: bun install exited ${installCode}`);
    return 1;
  }

  const pack = Bun.spawn(["bun", "run", "pack-agent"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
  });
  const packCode = await pack.exited;
  if (packCode !== 0) {
    console.error(`dock-registry: pack-agent exited ${packCode}`);
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

export async function runDockRegistryGate(): Promise<{ ok: boolean }> {
  const code = await run();
  return { ok: code === 0 };
}
