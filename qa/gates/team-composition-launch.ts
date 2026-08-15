import { copyFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dir, "../..");
const COLLAB = join(REPO, "collab-electron");
const SOURCE = join(import.meta.dir, "team-composition.ts");
const DEST = join(COLLAB, "src/main/gates-team-composition.ts");

async function run(): Promise<number> {
  try {
    copyFileSync(SOURCE, DEST);
    const child = Bun.spawn(["bun", DEST], {
      cwd: COLLAB,
      stdout: "inherit",
      stderr: "inherit",
      env: process.env,
    });
    return await child.exited;
  } finally {
    rmSync(DEST, { force: true });
  }
}

if (import.meta.main) process.exit(await run());

export async function runTeamCompositionGate(): Promise<{ ok: boolean }> {
  return { ok: (await run()) === 0 };
}
