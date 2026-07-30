/**
 * Cold-safe launcher for package-closure (RW6).
 * Top-level imports must stay dependency-free until standalone install completes.
 */
import { join } from "node:path";
import { executePackageClosureMode } from "./package-closure/executors.ts";
import { resolvePackageClosureMode } from "./package-closure/modes.ts";

const REPO_ROOT = join(import.meta.dir, "..");

export async function runPackageClosureGate(): Promise<{ ok: boolean }> {
  let mode;
  try {
    mode = resolvePackageClosureMode({
      releaseRunId: process.env.QF_RELEASE_RUN_ID,
      bait: process.env.QF_PACKAGE_CLOSURE_BAIT,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`package-closure: ${message}`);
    return { ok: false };
  }

  const result = await executePackageClosureMode({
    mode,
    repoRoot: REPO_ROOT,
  });

  if (result.code !== 0) {
    if (result.reason) {
      console.error(`package-closure: ${result.reason}`);
    }
    return { ok: false };
  }

  return { ok: true };
}

if (import.meta.main) {
  const { ok } = await runPackageClosureGate();
  process.exit(ok ? 0 : 1);
}
