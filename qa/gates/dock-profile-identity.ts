/**
 * Cold-safe launcher for dock-profile-identity (WO-D1 D4).
 */
import { join } from "node:path";
import { runFrozenPackageInstall } from "../package-install.ts";

const CWD = join(import.meta.dir, "dock-profile-identity");
const KERNEL_PKG = join(import.meta.dir, "../../packages/qf-kernel");

async function install(name: string, cwd: string): Promise<number> {
  return (await runFrozenPackageInstall(`dock-profile-identity:${name}`, cwd))
    ? 0
    : 1;
}

async function run(): Promise<number> {
  // qf-kernel is file-linked into the gate package. Bun resolves imports from
  // the linked source directory, so its own declared dependencies must be
  // materialized there before the gate-owned install can execute it cold.
  if ((await install("qf-kernel", KERNEL_PKG)) !== 0) return 1;
  if ((await install("gate", CWD)) !== 0) return 1;

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
