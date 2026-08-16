import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
export const GOVERNED_REVIEW_TIMEOUT_MS = 180_000;
export const GOVERNED_REVIEW_LIVE_TIMEOUT_MS = 240_000;

export function compareIndependentManifest(expected: Record<string, unknown>, observed: Record<string, unknown>): boolean {
  return JSON.stringify(expected) === JSON.stringify(observed);
}

export function measureCleanup(roots: readonly string[]): { residue_count: number; missing_roots: string[] } {
  const missing_roots = roots.filter((root) => !existsSync(root));
  return { residue_count: roots.length - missing_roots.length, missing_roots };
}

async function run(command: string[], timeoutMs = GOVERNED_REVIEW_TIMEOUT_MS): Promise<number> {
  const proc = Bun.spawn(command, { cwd: ROOT, stdout: "inherit", stderr: "inherit" });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<number>((resolve) => {
    timer = setTimeout(() => {
      proc.kill();
      resolve(124);
    }, timeoutMs);
  });
  const result = await Promise.race([proc.exited, timeout]);
  if (timer) clearTimeout(timer);
  return result;
}

export async function runGovernedReviewGate(): Promise<{ ok: boolean }> {
  const required = [
    "packages/qf-kernel/src/governed-review.ts",
    "packages/qf-kernel/src/r15-governed-review.test.ts",
    "collab-electron/src/main/governed-review.test.ts",
    "collab-electron/src/main/ipc-kernel.ts",
  ];
  for (const path of required) {
    if (!existsSync(join(ROOT, path))) {
      console.error(`governed-review: missing ${path}`);
      return { ok: false };
    }
  }
  const source = readFileSync(join(ROOT, "packages/qf-kernel/src/governed-review.ts"), "utf8");
  for (const literal of ["EVALUATION_REJECTS_PUBLICATION", "EVALUATION_INCONCLUSIVE_PUBLICATION", "qf_review_attempt", "qf_review_invocation"]) {
    if (!source.includes(literal)) {
      console.error(`governed-review: missing production literal ${literal}`);
      return { ok: false };
    }
  }
  const code = await run(["bun", "test", "packages/qf-kernel/src/r15-governed-review.test.ts", "collab-electron/src/main/governed-review.test.ts"]);
  console.log(`governed-review: focused production/kernel proof exit=${code}`);
  return { ok: code === 0 };
}

export async function runGovernedReviewLiveGate(): Promise<{ ok: boolean }> {
  const main = readFileSync(join(ROOT, "collab-electron/src/main/ipc-kernel.ts"), "utf8");
  const policy = readFileSync(join(ROOT, "collab-electron/src/main/ontology-role-tools.ts"), "utf8");
  const checks = [
    main.includes('ipcMain.handle("qf:review:request"'),
    main.includes("kernelFreezeSourceWork"),
    policy.includes('"qf_record_evaluation"'),
    !policy.includes('"qf_publish_artifact"'),
  ];
  console.log(`governed-review-live: production transport policy checks=${checks.filter(Boolean).length}/${checks.length}`);
  if (checks.some((value) => !value)) return { ok: false };
  const code = await run(["bun", "test", "packages/qf-kernel/src/r15-governed-review.test.ts"], GOVERNED_REVIEW_LIVE_TIMEOUT_MS);
  console.log(`governed-review-live: broker/kernel live-contract control exit=${code}`);
  return { ok: code === 0 };
}
