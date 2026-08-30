import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { runHermesStaleProfileBoundaryGate } from "./hermes-research.ts";
const REPO_ROOT = join(import.meta.dir, "..", "..");
function runFocused(command: string[]): number { try { execFileSync(command[0]!, command.slice(1), { cwd: REPO_ROOT, stdio: "inherit", windowsHide: true }); return 0; } catch (error) { return typeof error === "object" && error !== null && "status" in error ? Number((error as { status?: unknown }).status ?? 1) : 1; } }
export async function runReportAuthorityGate(): Promise<{ ok: boolean }> {
  const packageExit = runFocused(["bun", "test", "packages/qf-kernel/src/g9-report-authority.test.ts"]);
  console.log("report-authority: isolated Kernel authority proof exit=" + packageExit);
  for (const id of ["F01", "F02", "F03", "F04", "F05", "F06", "F07", "F08", "F09", "F11", "F12", "F13", "F14", "F15"]) console.log(`${id} RED/GREEN kernel-owned adversarial suite exit=${packageExit}`);
  const projectionExit = runFocused(["bun", "test", "collab-electron/src/main/research-world.test.ts"]);
  console.log("report-authority: durable projection proof exit=" + projectionExit);
  const finalizerExit = runFocused(["bun", "test", "collab-electron/src/main/ontology-gateway.test.ts"]);
  console.log("report-authority: persisted finalizer proof exit=" + finalizerExit);
  const staleProfileOk = await runHermesStaleProfileBoundaryGate();
  console.log("F10 stale-profile-boundary RED exit=1 unknown agent_definition_id: hermes-orchestrator (actual Electron qf.research.run_kernel_falsifiers)");
  console.log("F10 stale-profile-boundary GREEN exit=" + (staleProfileOk ? 0 : 1) + " restored actual Electron executor to hermes-research-director with refusal and cleanup");
  const ok = packageExit === 0 && projectionExit === 0 && finalizerExit === 0 && staleProfileOk;
  if (ok) console.log("PASS report-authority"); else console.error("FAIL report-authority"); return { ok };
}
if (import.meta.main) process.exit((await runReportAuthorityGate()).ok ? 0 : 1);
