import { copyFileSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "../..");
const COLLAB = join(REPO, "collab-electron");
const SOURCE = join(import.meta.dir, "kernel-market-lineage.ts");
const DEST = join(COLLAB, "src/main/gates-kernel-market-lineage.ts");

async function run(): Promise<number> {
  copyFileSync(SOURCE, DEST);
  const child = Bun.spawn(["bun", DEST], {
    cwd: COLLAB,
    stdout: "inherit",
    stderr: "inherit",
  });
  return await child.exited;
}

if (import.meta.main) process.exit(await run());

export async function runKernelMarketLineageGate(): Promise<{ ok: boolean }> {
  return { ok: (await run()) === 0 };
}
