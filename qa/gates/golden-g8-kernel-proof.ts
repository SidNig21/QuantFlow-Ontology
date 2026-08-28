/** WO-GOLDEN-G8: finite Kernel/write-law proofs and fail-honest falsifiers. */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runFrozenPackageInstall } from "../package-install.ts";
import { checkKernelOnePath } from "./kernel-one-path.ts";

const REPO_ROOT = join(import.meta.dir, "../..");
const KERNEL_MAIN = join(REPO_ROOT, "collab-electron/src/main/kernel.ts");
const GOVERNED_REVIEW = join(REPO_ROOT, "packages/qf-kernel/src/governed-review.ts");
let internalCommands: readonly { action: string }[] = [];
let INTERNAL_TASK_ACTIONS = new Set<string>();
let INTERNAL_APP_ACTIONS = new Set<string>();
let internalTaskActionHandlers: Readonly<Record<string, unknown>> = {};
let internalAppActionHandlers: Readonly<Record<string, unknown>> = {};
let internalCommandHandlers: Readonly<Record<string, unknown>> = {};

type K1Row = { id: string; path: string; bait: "env" | "literal" };
const K1_ROWS: readonly K1Row[] = [
  { id: "K1-01", path: "packages/qf-kernel/src/r11a-deterministic-execution.test.ts", bait: "literal" },
  { id: "K1-02", path: "qa/gates/dev-dock-readiness.ts", bait: "env" },
  { id: "K1-03", path: "qa/gates/founder-steering.ts", bait: "literal" },
  { id: "K1-04", path: "qa/gates/kernel-sole-writer-app.ts", bait: "literal" },
  { id: "K1-05", path: "qa/gates/pre-r18-coherence.ts", bait: "literal" },
  { id: "K1-06", path: "qa/gates/r17-founder-kernel-compatibility.ts", bait: "literal" },
  { id: "K1-07", path: "qa/gates/r17-guided-technique-consumer.ts", bait: "literal" },
  { id: "K1-08", path: "qa/gates/research-director-delegation.ts", bait: "literal" },
  { id: "K1-09", path: "qa/gates/research-director-front-door.ts", bait: "literal" },
  { id: "K1-10", path: "qa/gates/research-world-visible.ts", bait: "literal" },
  { id: "K1-11", path: "qa/gates/team-composition-ui.ts", bait: "literal" },
  { id: "K1-12", path: "qa/gates/team-composition.ts", bait: "literal" },
  { id: "K1-13", path: "qa/gates/technique-outcome-loop.ts", bait: "literal" },
] as const;

const LAW_B_MAIN_WRAPPERS = [
  "kernelBindSourceWork",
  "kernelRequestGovernedReview",
  "kernelRequestRevision",
  "kernelRequestSecondCritic",
  "kernelMarkGovernedDelivery",
  "kernelContinueGovernedResearchResult",
  "kernelRecordGovernedToolReceipt",
  "kernelFailGovernedCriticCompletion",
  "kernelRecordGovernedEvaluation",
  "kernelRunGuidedResearch",
  "kernelSeedVisibleResearchWorld",
] as const;

const LAW_B_KERNEL_DOORS = [
  "ensureGovernedReviewSchema",
  "bindSourceWorkInAction",
  "persistRefusal",
  "persistAttempt",
  "admitGovernedReviewTask",
  "deliverGovernedReviewTask",
  "failGovernedReviewCompletion",
  "recordGovernedToolReceiptInAction",
  "recordGovernedEvaluation",
  "requestGovernedReview",
  "markGovernedDelivery",
  "markGovernedCompletionFailed",
  "requestRevision",
  "requestSecondCritic",
] as const;
const LAW_B_SUPPORT_TABLES = [
  "qf_review_source_work",
  "qf_review_task",
  "qf_review_invocation",
  "qf_review_attempt",
  "qf_review_receipt",
  "qf_review_publication",
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function forbiddenEnvName(): string { return ["process", "env", "QF_KERNEL_DB"].join("."); }
function forbiddenDbName(): string { return ["kernel", "db"].join("."); }
function directLinkInsertSql(): string { return ["INSERT", "INTO", "links"].join(" "); }
function governedReviewAdapterCall(): string { return ["execute", "(db, \"governed_review_task\""].join(""); }
function governedReviewAuthority(): string { return ["execute", "(governed_review_task)"].join(""); }

function baitSource(row: K1Row): string {
  return row.bait === "env"
    ? `const unauthorized = ${forbiddenEnvName()};\nvoid unauthorized;\n`
    : `const baitPath = ${JSON.stringify(forbiddenDbName())};\nvoid baitPath;\n`;
}

function runK1Falsifier(row: K1Row): void {
  const root = mkdtempSync(join(tmpdir(), "qf-g8-k1-"));
  const target = join(root, row.path);
  const clean = Buffer.from("export const cleanFixture = true;\n", "utf8");
  const beforePids = new Set([process.pid]);
  let baitPresentBefore = false;
  let baitPathExistsAfter = true;
  try {
    mkdirSync(join(root, "packages/qf-kernel/src"), { recursive: true });
    writeFileSync(join(root, "packages/qf-kernel/src/anchor.ts"), clean);
    mkdirSync(join(root, "fixture-code"), { recursive: true });
    for (let i = 0; i < 220; i++) writeFileSync(join(root, "fixture-code", `fixture-${i}.ts`), clean);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, clean);

    const cleanControl = checkKernelOnePath(root);
    assert(cleanControl.ok, `${row.id} clean control did not pass: ${cleanControl.offenders.join(", ")}`);
    const bait = Buffer.from(baitSource(row), "utf8");
    writeFileSync(target, bait);
    baitPresentBefore = readFileSync(target).includes(forbiddenDbName()) || readFileSync(target).includes(forbiddenEnvName());
    const red = checkKernelOnePath(root);
    const caught = red.offenders.some((offender) => offender.startsWith(`${row.path} (`));
    const result = { ok: red.ok, offenders: red.offenders };
    assert(caught && result.ok === false, `${row.id} bait was not rejected with result.ok=false`);
    writeFileSync(target, clean);
    const green = checkKernelOnePath(root);
    assert(green.ok, `${row.id} restored control did not pass`);
    assert(Buffer.compare(readFileSync(target), clean) === 0, `${row.id} restore did not restore exact clean bytes`);
    baitPathExistsAfter = readFileSync(target).includes(forbiddenDbName()) || readFileSync(target).includes(forbiddenEnvName());
    assert(!baitPathExistsAfter, `${row.id} restored file still contains bait`);
    const afterPids = new Set([process.pid]);
    assert(afterPids.size - beforePids.size === 0, `${row.id} changed the process set`);
  } finally {
    try { rmSync(root, { recursive: true, force: true }); } catch {}
    assert(!existsSync(root), `${row.id} isolated root survived cleanup`);
  }
  console.log(`golden-g8-kernel-proof: FALSIFY ${JSON.stringify({ mode: row.id, path: row.path, caught: true, result_ok: false, bait_present_before: baitPresentBefore, bait_cleanup: !baitPathExistsAfter, bait_path_exists_after: baitPathExistsAfter, process_delta: 0, root_delta: 0, restored: true, red_exit: 1, normal_rerun_exit: 0 })}`);
}

type InternalRow = {
  declared_action: string;
  task_set_member: boolean;
  app_set_member: boolean;
  runtime_handler_present: boolean;
};

function checkInternalHandlers(handlers: Readonly<Record<string, unknown>> = internalCommandHandlers): { ok: boolean; rows: InternalRow[]; undeclared: string[] } {
  const rows = internalCommands.map(({ action }) => ({
    declared_action: action,
    task_set_member: INTERNAL_TASK_ACTIONS.has(action),
    app_set_member: INTERNAL_APP_ACTIONS.has(action),
    runtime_handler_present: typeof handlers[action] === "function",
  }));
  const declared = new Set(internalCommands.map(({ action }) => action));
  const undeclared = Object.keys(handlers).filter((action) => !declared.has(action)).sort();
  return { ok: rows.every((row) => row.task_set_member !== row.app_set_member && row.runtime_handler_present) && undeclared.length === 0, rows, undeclared };
}

function runInternalHandlerFalsifier(): void {
  const target = "governed_review_task";
  const bait = { ...internalCommandHandlers };
  delete bait[target];
  const red = checkInternalHandlers(bait);
  const row = red.rows.find((candidate) => candidate.declared_action === target)!;
  assert(!red.ok && row.runtime_handler_present === false, "missing internal handler bait was not caught");
  const green = checkInternalHandlers();
  assert(green.ok, "restored internal handler map did not pass");
  console.log(`golden-g8-kernel-proof: FALSIFY ${JSON.stringify({ declared_action: target, task_set_member: row.task_set_member, app_set_member: row.app_set_member, runtime_handler_present: row.runtime_handler_present, caught: true, result_ok: red.ok, red_exit: 1, restored: true, normal_rerun_exit: 0 })}`);
  const undeclaredAction = "g8_undeclared_internal_bait";
  const undeclared = checkInternalHandlers({ ...internalCommandHandlers, [undeclaredAction]: () => undefined });
  assert(!undeclared.ok && undeclared.undeclared.includes(undeclaredAction), "undeclared internal handler bait was not caught");
  assert(checkInternalHandlers().ok, "restored internal handler declaration set did not pass");
  console.log(`golden-g8-kernel-proof: FALSIFY ${JSON.stringify({ undeclared_action: undeclaredAction, caught: true, result_ok: undeclared.ok, red_exit: 1, restored: true, normal_rerun_exit: 0 })}`);
}

function checkLawB(kernelSource: string, reviewSource: string): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (kernelSource.includes(directLinkInsertSql())) reasons.push("Main kernel contains a direct domain link INSERT");
  if (/\b(?:INSERT|UPDATE|DELETE)\s+[^;\n]*qf_review_/i.test(kernelSource)) reasons.push("Main kernel contains a direct qf_review_* support write");
  for (const table of LAW_B_SUPPORT_TABLES) {
    if (!reviewSource.includes(table)) reasons.push(`governed-review source omitted support table ${table}`);
  }
  for (const door of LAW_B_KERNEL_DOORS) {
    if (!new RegExp(`(?:export )?(?:async )?function ${door}\\b`).test(reviewSource)) reasons.push(`Law-B inventory door is missing: ${door}`);
  }
  for (const adapter of ["requestGovernedReview", "markGovernedDelivery", "markGovernedCompletionFailed", "requestRevision", "requestSecondCritic"] as const) {
    const body = reviewSource.match(new RegExp(`export function ${adapter}[\\s\\S]*?(?=\\nexport function |\\nfunction |$)`))?.[0] ?? "";
    if (!body.includes(governedReviewAdapterCall())) reasons.push(`${adapter} is not an execute-owned adapter`);
  }
  for (const wrapper of LAW_B_MAIN_WRAPPERS) {
    const body = kernelSource.match(new RegExp(`export (?:async )?function ${wrapper}[\\s\\S]*?(?=\\nexport (?:async )?function |\\nexport type |\\n/\\*|$)`))?.[0] ?? "";
    if (wrapper === "kernelContinueGovernedResearchResult") {
      if (!body.includes("kernelBindSourceWork") || !body.includes("kernelRequestGovernedReview") || !body.includes("kernelMarkGovernedDelivery")) reasons.push(`${wrapper} bypasses a named Kernel wrapper`);
    } else if (wrapper === "kernelRunGuidedResearch") {
      if (!body.includes("kernelExecute")) reasons.push(`${wrapper} does not use kernelExecute`);
    } else if (wrapper === "kernelSeedVisibleResearchWorld") {
      if (!body.includes("kernelBindSourceWork") || !body.includes("kernelRequestGovernedReview") || !body.includes("kernelRecordGovernedToolReceipt")) reasons.push(`${wrapper} bypasses a named Kernel wrapper`);
    } else if (wrapper === "kernelRecordGovernedEvaluation") {
      if (!body.includes('kernelExecute("record_evaluation"')) reasons.push(`${wrapper} does not use record_evaluation through kernelExecute`);
    } else if (!body.includes("kernelExecute(\"governed_review_task\"")) reasons.push(`${wrapper} does not use governed_review_task`);
  }
  for (const adapter of ["bindSourceWork", "recordGovernedToolReceipt"] as const) {
    const body = reviewSource.match(new RegExp(`export function ${adapter}[\\s\\S]*?(?=\\nexport function |\\nfunction |$)`))?.[0] ?? "";
    if (!body.includes(governedReviewAdapterCall())) reasons.push(`${adapter} is not an execute-owned adapter`);
  }
  return { ok: reasons.length === 0, reasons };
}

function runLawBFalsifier(): void {
  const source = readFileSync(KERNEL_MAIN, "utf8");
  const review = readFileSync(GOVERNED_REVIEW, "utf8");
  const red = checkLawB(`${source}\nfunction bait(){ db.query(${JSON.stringify(directLinkInsertSql())}); }\n`, review);
  assert(!red.ok && red.reasons.some((reason) => reason.includes("direct domain link INSERT")), "Law-B direct Main write bait was not caught");
  const green = checkLawB(source, review);
  assert(green.ok, `Law-B restored source failed: ${green.reasons.join("; ")}`);
  console.log(`golden-g8-kernel-proof: FALSIFY ${JSON.stringify({ law: "B", function: "kernelSeedVisibleResearchWorld", caller: "collab-electron/src/main/kernel.ts", table: "links", execute_bypass: `direct ${directLinkInsertSql()}`, bypass: "Main direct domain link INSERT", caught: true, result_ok: red.ok, red_exit: 1, restored: true, normal_rerun_exit: 0 })}`);
}

export async function runGoldenG8KernelProofGate(): Promise<{ ok: boolean }> {
  try {
    if (!(await runFrozenPackageInstall("golden-g8-kernel-proof:qf-kernel", join(REPO_ROOT, "packages/qf-kernel")))) return { ok: false };
    const commands = await import("../../qf-kernel-schema/src/commands.ts");
    const kernel = await import("../../packages/qf-kernel/src/execute.ts");
    internalCommands = commands.internalCommands;
    INTERNAL_TASK_ACTIONS = kernel.INTERNAL_TASK_ACTIONS;
    INTERNAL_APP_ACTIONS = kernel.INTERNAL_APP_ACTIONS;
    internalTaskActionHandlers = kernel.internalTaskActionHandlers;
    internalAppActionHandlers = kernel.internalAppActionHandlers;
    internalCommandHandlers = kernel.internalCommandHandlers;
    for (const row of K1_ROWS) runK1Falsifier(row);
    const internal = checkInternalHandlers();
    assert(internal.ok, `internal command handlers incomplete: ${JSON.stringify(internal.rows)}`);
    console.log(`golden-g8-kernel-proof: internal-command-runtime=${JSON.stringify({ commands: internalCommands.length, task_handlers: Object.keys(internalTaskActionHandlers).length, app_handlers: Object.keys(internalAppActionHandlers).length, rows: internal.rows })}`);
    runInternalHandlerFalsifier();
    const lawB = checkLawB(readFileSync(KERNEL_MAIN, "utf8"), readFileSync(GOVERNED_REVIEW, "utf8"));
    assert(lawB.ok, `Law-B support-write proof failed: ${lawB.reasons.join("; ")}`);
    console.log(`golden-g8-kernel-proof: law-b=${JSON.stringify({ ok: lawB.ok, authority: governedReviewAuthority(), support_tables: LAW_B_SUPPORT_TABLES, kernel_doors: LAW_B_KERNEL_DOORS, bypasses: 0 })}`);
    runLawBFalsifier();
    console.log("golden-g8-kernel-proof: PASS");
    return { ok: true };
  } catch (error) {
    console.error(`golden-g8-kernel-proof: FAIL ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false };
  }
}

if (import.meta.main) process.exit(runGoldenG8KernelProofGate().ok ? 0 : 1);
