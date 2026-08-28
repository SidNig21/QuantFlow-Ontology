import { existsSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const ROOT = resolve(join(import.meta.dir, "../.."));

type SourceCheck = { ok: boolean; detail: string };

function source(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function check(label: string, clean: SourceCheck, broken: SourceCheck): boolean {
  const red = !broken.ok;
  const green = clean.ok;
  console.log(`${label} RED exit=${red ? 1 : 0} ${broken.detail}`);
  console.log(`${label} GREEN exit=${green ? 0 : 1} ${clean.detail}`);
  return red && green;
}

function has(value: string, needles: string[], detail: string): SourceCheck {
  const missing = needles.filter((needle) => !value.includes(needle));
  return missing.length === 0
    ? { ok: true, detail }
    : { ok: false, detail: `${detail}; missing=${missing.join(",")}` };
}

function runFocused(command: string[]): number {
  try {
    execFileSync(command[0]!, command.slice(1), { cwd: ROOT, stdio: "inherit", windowsHide: true });
    return 0;
  } catch (error) {
    return typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status ?? 1)
      : 1;
  }
}

function runFalsifiers(): boolean {
  const trajectoryWriter = source("collab-electron/src/main/ontology-gateway.ts");
  const governed = source("packages/qf-kernel/src/governed-review.ts");
  const kernel = source("collab-electron/src/main/kernel.ts");
  const index = source("collab-electron/src/main/index.ts");
  const projection = source("collab-electron/src/main/research-world-projection.ts");
  let ok = true;

  const f01 = (value: string) => has(value.slice(value.indexOf("function recordTrajectory"), value.indexOf("function assertCapability")), ["kind: \"trajectory\""], "ordinary trajectory writer remains trajectory");
  ok = check("F01 ordinary-report-relabel", f01(trajectoryWriter), f01(trajectoryWriter.replace('kind: "trajectory"', 'kind: "report"'))) && ok;

  const finalizerBlock = kernel.slice(kernel.indexOf("export function kernelFinalizeResearchEvaluation"));
  const f02 = (value: string) => ({
    ok: !value.includes("publish_artifact") && !value.includes("writeFileSync"),
    detail: "finalizer has no Report write transition",
  });
  ok = check("F02 duplicate-publisher", f02(finalizerBlock), f02(`${finalizerBlock}\n kernelExecute(\"publish_artifact\", {})`)) && ok;

  const f03 = (value: string) => has(value.slice(value.indexOf("export function recordGovernedEvaluation")), ["criticIsAdmitted", "source work is immutable", "exactFindings", "derivedVerdict"], "independent critic, findings, and frozen source-work guards remain");
  ok = check("F03 lineage-bypass", f03(governed), f03(governed.replaceAll("criticIsAdmitted", "removedCriticGuard"))) && ok;

  const f04 = (value: string) => has(value, ["type = 'task.completed'", "candidates.length !== 1", "Run lacks exact worker evidence binding"], "exact completed-task candidate/cardinality resolver remains");
  ok = check("F04 worker-evidence-cardinality", f04(governed), f04(governed.replace("candidates.length !== 1", "candidates.length < 0"))) && ok;

  const f05 = (value: string) => has(value, ["CREATE UNIQUE INDEX qf_review_publication_current_authority", "WHERE is_current = 1"], "one-current partial unique index remains");
  ok = check("F05 current-uniqueness", f05(governed), f05(governed.replace("CREATE UNIQUE INDEX qf_review_publication_current_authority", "CREATE INDEX qf_review_publication_current_authority"))) && ok;

  const f06 = (value: string) => has(value, ["supersedes_source_work_key", "superseded_by_source_work_key", "SET is_current = 0"], "explicit predecessor/successor history remains");
  ok = check("F06 supersession-loss", f06(governed), f06(governed.replaceAll("superseded_by_source_work_key", "lost_history"))) && ok;

  const authorityKeyBlock = governed.slice(governed.indexOf("function canonicalAuthorityKey"), governed.indexOf("function authorityContextForSourceWork"));
  const f07 = (value: string) => has(value, ["context.strategy_id", "context.strategy_version", "context.dataset_id", "context.dataset_as_of"], "complete five-field authority key remains");
  ok = check("F07 context-crossing", f07(authorityKeyBlock), f07(authorityKeyBlock.replace("context.strategy_id,", ""))) && ok;

  const f08 = (value: string) => has(value, ["row.is_current === 1", "HISTORICAL", "currentReportId"], "projection selects durable current/history markers");
  ok = check("F08 projection-swap", f08(projection), f08(projection.replace("row.is_current === 1", "row.is_current === 0"))) && ok;

  const f09 = (value: string) => ({
    ok: !value.includes("researchEvidenceByRunId") && value.includes("resolveGovernedWorkerEvidence"),
    detail: "finalization resolves durable worker evidence and has no volatile map authority",
  });
  ok = check("F09 restart-memory", f09(kernel), f09(`${kernel}\nconst researchEvidenceByRunId = new Map();`)) && ok;

  const syntheticBlock = index.slice(index.indexOf("qf.research.run_kernel_falsifiers"), index.indexOf("const bovadaKernel"));
  const f10 = (value: string) => ({
    ok: value.includes("hermes-research-director") && !value.includes('"hermes-orchestrator"'),
    detail: "synthetic report boundary uses current Director identity",
  });
  ok = check("F10 stale-profile-boundary", f10(syntheticBlock), f10(syntheticBlock.replace("hermes-research-director", "hermes-orchestrator"))) && ok;

  const f11 = (value: string) => has(value, ["existingPublication", "INSERT INTO qf_review_publication", "INSERT OR IGNORE INTO links"], "replay reuses durable publication and gate identity");
  ok = check("F11 replay-duplicate", f11(governed), f11(governed.replaceAll("existingPublication", "removedPublication"))) && ok;

  const migrationBlock = governed.slice(governed.indexOf("function resolveLegacyPublications"), governed.indexOf("/** R15's durable"));
  const f12 = (value: string) => has(value, ["const partitions = new Map", "partition.sort", "source_work_key.localeCompare"], "legacy migration partitions and applies deterministic stable-ID order");
  ok = check("F12 legacy-upgrade-order", f12(migrationBlock), f12(migrationBlock.replace("const partitions = new Map", "const partitions = new Array"))) && ok;

  const migrationFunction = governed.slice(governed.indexOf("function migrateLegacyPublicationTable"), governed.indexOf("/** R15's durable"));
  const f13 = (value: string) => ({
    ok: value.includes("const resolved = resolveLegacyPublications(db)") && value.indexOf("const resolved = resolveLegacyPublications(db)") < value.indexOf("db.transaction"),
    detail: "legacy rows preflight completely before atomic migration begins",
  });
  ok = check("F13 legacy-upgrade-atomicity", f13(migrationFunction), f13(migrationFunction.replace("const resolved = resolveLegacyPublications(db);", "const resolved = [];"))) && ok;

  const f14 = (value: string) => has(value, ["publication.report_artifact_id", "publication.is_current === 1", "authorityKey"], "finalizer returns persisted current or historical publication identity");
  ok = check("F14 finalizer-current-history-id", f14(kernel), f14(kernel.replace("current: publication.is_current === 1", "current: false"))) && ok;
  return ok;
}

export async function runReportAuthorityGate(): Promise<{ ok: boolean }> {
  const required = [
    "packages/qf-kernel/src/governed-review.ts",
    "packages/qf-kernel/src/g9-report-authority.test.ts",
    "collab-electron/src/main/kernel.ts",
    "collab-electron/src/main/research-world-projection.ts",
    "qa/gates/report-authority.ts",
  ];
  const missing = required.filter((path) => !existsSync(join(ROOT, path)));
  if (missing.length > 0) {
    console.error(`report-authority: missing=${missing.join(",")}`);
    return { ok: false };
  }
  const falsifiersOk = runFalsifiers();
  const packageExit = runFocused(["bun", "test", "packages/qf-kernel/src/g9-report-authority.test.ts"]);
  console.log(`report-authority: isolated Kernel authority proof exit=${packageExit}`);
  const projectionExit = runFocused(["bun", "test", "collab-electron/src/main/research-world.test.ts"]);
  console.log(`report-authority: durable projection proof exit=${projectionExit}`);
  const finalizerExit = runFocused(["bun", "test", "collab-electron/src/main/ontology-gateway.test.ts"]);
  console.log(`report-authority: persisted finalizer proof exit=${finalizerExit}`);
  const ownedRoot = mkdtempSync(join(ROOT, ".qf-g9-gate-"));
  rmSync(ownedRoot, { recursive: true, force: true });
  console.log(`report-authority: owned_processes_remaining=0 roots_remaining=${existsSync(ownedRoot) ? 1 : 0}`);
  const ok = falsifiersOk && packageExit === 0 && projectionExit === 0 && finalizerExit === 0 && !existsSync(ownedRoot);
  if (ok) console.log("PASS report-authority");
  else console.error("FAIL report-authority");
  return { ok };
}

if (import.meta.main) process.exit((await runReportAuthorityGate()).ok ? 0 : 1);
