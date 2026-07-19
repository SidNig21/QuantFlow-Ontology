/**
 * Cold-safe launcher for the agent-path gate (WO-006c D1).
 *
 * Heavy deps (@rivet-dev/agentos-core, qf-kernel) live in ./agent-path/ and are
 * imported only *after* `bun install` in a subprocess — so a missing dependency
 * fails this gate, never the qa runner's module load.
 *
 * Direct use (falsify flags still work):
 *   bun qa/gates/agent-path.ts
 *   QF_AGENT_PATH_NEUTER_CANCEL=1 bun qa/gates/agent-path.ts
 */
import { join } from "node:path";

const CWD = join(import.meta.dir, "agent-path");

async function run(): Promise<number> {
  const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
  });
  const installCode = await install.exited;
  if (installCode !== 0) {
    console.error(`agent-path: bun install exited ${installCode}`);
    return 1;
  }

  const pack = Bun.spawn(["bun", "run", "pack-agent"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
  });
  const packCode = await pack.exited;
  if (packCode !== 0) {
    console.error(`agent-path: pack-agent exited ${packCode}`);
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

export async function runAgentPathGate(): Promise<{ ok: boolean }> {
  const code = await run();
  return { ok: code === 0 };
}
