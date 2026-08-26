/** Cold-safe launcher for the WO-D2 dock-definition-launch gate. */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const CWD = join(import.meta.dir, "dock-definition-launch");
const KERNEL_PKG = join(import.meta.dir, "../../packages/qf-kernel");
const SCHEMA_PKG = join(import.meta.dir, "../../qf-kernel-schema");

async function install(name: string, cwd: string): Promise<number> {
  const child = Bun.spawn(["bun", "install", "--frozen-lockfile", "--backend", "copyfile", "--linker", "isolated"], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await child.exited;
  if (code !== 0) {
    console.error(`dock-definition-launch: ${name} bun install exited ${code}`);
  }
  return code;
}

async function run(): Promise<number> {
  if ((await install("qf-kernel-schema", SCHEMA_PKG)) !== 0) return 1;
  if ((await install("qf-kernel", KERNEL_PKG)) !== 0) return 1;
  if ((await install("gate", CWD)) !== 0) return 1;

  mkdirSync(join(CWD, ".gate-home"), { recursive: true });
  const child = Bun.spawn(["bun", "./run.ts"], {
    cwd: CWD,
    stdout: "inherit",
    stderr: "inherit",
    env: {
      HOME: join(CWD, ".gate-home"),
      PATH: process.env.PATH ?? "/usr/bin:/bin",
    },
  });
  return await child.exited;
}

if (import.meta.main) process.exit(await run());

export async function runDockDefinitionLaunchGate(): Promise<{ ok: boolean }> {
  return { ok: (await run()) === 0 };
}
