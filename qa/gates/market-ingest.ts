/**
 * Cold-safe launcher for the WO-107b market-ingest gate.
 *
 * The gate package imports both qf-kernel and schema source. Install the two
 * authority packages first so a fresh clone cannot pass because another gate
 * happened to materialize their dependencies.
 */
import { join } from "node:path";

const REPO = join(import.meta.dir, "../..");
const INSTALL_PLAN = [
  { name: "qf-kernel-schema", cwd: join(REPO, "qf-kernel-schema") },
  { name: "qf-kernel", cwd: join(REPO, "packages/qf-kernel") },
  { name: "qf-read-tools", cwd: join(REPO, "tools/qf-read-tools") },
  { name: "market-ingest gate", cwd: join(import.meta.dir, "market-ingest") },
] as const;

async function run(): Promise<number> {
  for (const entry of INSTALL_PLAN) {
    const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
      cwd: entry.cwd,
      stdout: "inherit",
      stderr: "inherit",
    });
    const code = await install.exited;
    if (code !== 0) {
      console.error(`market-ingest: ${entry.name} bun install exited ${code}`);
      return code;
    }
  }

  const gate = Bun.spawn(["bun", "./run.ts"], {
    cwd: join(import.meta.dir, "market-ingest"),
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env },
  });
  return gate.exited;
}

if (import.meta.main) process.exit(await run());

export async function runMarketIngestGate(): Promise<{ ok: boolean }> {
  return { ok: (await run()) === 0 };
}
