/**
 * WO-K1 — kernel-one-path gate.
 *
 * Scope: repo OUTSIDE collab-electron/ (kernel-sole-writer-app fences that tree).
 * G1: no process.env.QF_KERNEL_DB read and no kernel.db path construction
 *     outside the spelled allowlist.
 * G2/G3: package tests (busy_timeout control + fail-closed resolver).
 * G4: seat-shaped MCP subprocess (tools/qf-read-tools gate) — no envFor.
 *
 * Stated limit (same as kernel-sole-writer): this is a grep, not a parser.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { runFrozenPackageInstall } from "../package-install.ts";

const REPO_ROOT = join(import.meta.dir, "../..");
const READ_TOOLS = join(REPO_ROOT, "tools/qf-read-tools");
const KERNEL_PKG = join(REPO_ROOT, "packages/qf-kernel");

const FALSIFY_ENV = "QF_KERNEL_ONE_PATH_FALSIFY";
const FALSIFY_DIR = join(REPO_ROOT, "tools", "_qf-k1-path-bait");
const FALSIFY_FILE = join(FALSIFY_DIR, "falsify.ts");

const ENV_READ = /process\.env\.QF_KERNEL_DB/;
const KERNEL_DB_LITERAL = /kernel\.db/;

/**
 * Allowlist spelled by WO-K1. Adding an entry is a finding to report.
 *
 * Judgment (reported): species/.../acp-shim.ts must read the env to *forward*
 * it (D6). That is not a second resolver; without this entry G1 and D6 cannot
 * both be true. busy-timeout.test.ts constructs fixture paths (same shape as
 * harnesses). kernel-one-world.ts is the G4 implementation.
 */
const ALLOW_PREFIXES = [
  "packages/qf-kernel/src/resolve-path.ts",
  "packages/qf-kernel/src/resolve-path.test.ts",
  "packages/qf-kernel/src/busy-timeout.test.ts",
  "tools/qf-read-tools/src/harness.ts",
  "tools/qf-read-tools/src/gates/tool-discovery.ts",
  "tools/qf-read-tools/src/gates/action-transport.ts",
  "tools/qf-read-tools/src/gates/publish-artifact-root.ts",
  "tools/qf-read-tools/src/gates/kernel-one-world.ts",
  // WO-V1: fixture gate constructs temp Kernel paths (join(dir, "kernel.db")).
  "tools/qf-vault-projection/src/gate.ts",
  // WO-N1: migration fixture proves legacy Kernel files are excluded, never opened.
  "qa/gates/product-identity.ts",
  // WO-WIN1/WIN2: both gates build an isolated temp fixture and *set* QF_KERNEL_DB
  // in the launched child's env so the packaged app boots against throwaway state.
  // Setting it for a subprocess is the opposite of a second resolver — but G1 is a
  // grep, not a parser, and cannot tell a write from a read. These landed 2026-08-02
  // without this entry, leaving the gate red on main until 2026-08-03.
  "qa/gates/windows-cold-boot.ts",
  "qa/gates/windows-dock-collaboration.ts",
  // R1–R8 (2026-08-05): every rung gate builds an isolated temp fixture and sets
  // QF_KERNEL_DB for the child it launches — the same shape as WO-WIN1/WIN2
  // above, and the same omission repeated seven times. Nothing caught it because
  // kernel-one-path is not a release stage, so the gate had been red on main
  // since the Act I merge with no run to say so.
  "qa/gates/windows-dock-ontology.ts",
  "qa/gates/windows-dock-capability.ts",
  "qa/gates/windows-dock-hire.ts",
  "qa/gates/windows-research-question.ts",
  "qa/gates/kernel-task-delegation.ts",
  "qa/gates/kernel-market-lineage.ts",
  // Act I golden run (2026-08-10): same shape again — seeds an isolated temp
  // store and sets QF_KERNEL_DB for the packaged child it launches. Landed with
  // the WO-ACT1-GOLDEN-PATH merge and left this gate red on main, which is the
  // ninth repeat of the omission described above.
  "qa/gates/windows-golden-run.ts",
  // R13 installed-artifact gate: builds an isolated Kernel path for the
  // installed process proof, never for product code.
  "qa/gates/windows-installer.ts",
  "collab-electron/",
  "qa/gates/kernel-one-path.ts",
  "species/hermes/agent-package/src/acp-shim.ts",
];

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "out",
  "packed",
  "coverage",
  ".turbo",
  "docs",
  "evidence",
]);

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function isAllowed(rel: string): boolean {
  return ALLOW_PREFIXES.some((p) => rel === p || rel.startsWith(p));
}

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
    if (!CODE_EXT.has(ext)) continue;
    out.push(full);
  }
}

export function checkKernelOnePath(scanRoot = REPO_ROOT): { ok: boolean; offenders: string[] } {
  const files: string[] = [];
  walk(scanRoot, files);

  // Coverage floor. Walk swallows missing roots; empty files → PASS with no
  // allowlist check. Must always see the Kernel package this gate protects.
  const MIN_FILES = 200;
  const sawKernelPackage = files.some((f) =>
    relative(scanRoot, f).split("\\").join("/").startsWith("packages/qf-kernel/src/"),
  );
  if (files.length < MIN_FILES || !sawKernelPackage) {
    console.error(
      `kernel-one-path: scan collapsed — ${files.length} files, kernel package seen: ${sawKernelPackage}. ` +
        `Refusing to report PASS on a scan that inspected nothing.`,
    );
    return { ok: false, offenders: ["<scan-coverage-collapsed>"] };
  }

  const offenders: string[] = [];

  for (const full of files) {
    const rel = relative(scanRoot, full).split("\\").join("/");
    if (isAllowed(rel)) continue;
    let text: string;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    if (ENV_READ.test(text)) {
      offenders.push(`${rel} (process.env.QF_KERNEL_DB read)`);
      continue;
    }
    if (KERNEL_DB_LITERAL.test(text)) {
      offenders.push(`${rel} (kernel.db path construction/literal)`);
    }
  }

  if (offenders.length > 0) {
    console.error("kernel-one-path G1: offenders outside allowlist:");
    for (const o of offenders) console.error(`  - ${o}`);
    return { ok: false, offenders };
  }
  console.log("kernel-one-path G1: PASS (no illicit env reads or kernel.db literals)");
  return { ok: true, offenders: [] };
}

async function runKernelOnePathProof(): Promise<{ ok: boolean }> {
  const g1 = checkKernelOnePath();
  if (!g1.ok) return { ok: false };

  if (!(await runFrozenPackageInstall("kernel-one-path:qf-kernel", KERNEL_PKG))) {
    return { ok: false };
  }

  const g23 = Bun.spawn(
    ["bun", "test", "src/busy-timeout.test.ts", "src/resolve-path.test.ts"],
    {
      cwd: KERNEL_PKG,
      stdout: "inherit",
      stderr: "inherit",
    },
  );
  if ((await g23.exited) !== 0) {
    console.error("kernel-one-path G2/G3: package tests failed");
    return { ok: false };
  }
  console.log("kernel-one-path G2/G3: PASS");

  if (!(await runFrozenPackageInstall("kernel-one-path:qf-read-tools", READ_TOOLS))) {
    return { ok: false };
  }

  const g4 = Bun.spawn(["bun", "src/gates/kernel-one-world.ts"], {
    cwd: READ_TOOLS,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await g4.exited) !== 0) {
    console.error("kernel-one-path G4: FAIL");
    return { ok: false };
  }

  return { ok: true };
}

function removeFalsifyBait(): void {
  try {
    rmSync(FALSIFY_DIR, { recursive: true, force: true });
  } catch {
    // surfaced by the post-run tree check
  }
}

export async function runKernelOnePathGate(): Promise<{ ok: boolean }> {
  if (process.env[FALSIFY_ENV] !== "1") return runKernelOnePathProof();

  mkdirSync(FALSIFY_DIR, { recursive: true });
  writeFileSync(
    FALSIFY_FILE,
    'const unauthorized = process.env.QF_KERNEL_DB;\nconst baitPath = "kernel.db";\nvoid unauthorized; void baitPath;\n',
  );
  const onSignal = () => {
    removeFalsifyBait();
    process.exit(130);
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  try {
    const result = checkKernelOnePath();
    const caught = result.offenders.some((offender) => offender.includes("tools/_qf-k1-path-bait/falsify.ts"));
    if (!caught) {
      console.error("kernel-one-path falsifier: bait was not caught");
    } else {
      console.error("kernel-one-path falsifier: caught tools/_qf-k1-path-bait/falsify.ts");
    }
    return { ok: false };
  } finally {
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
    removeFalsifyBait();
  }
}

if (import.meta.main) {
  const { ok } = await runKernelOnePathGate();
  process.exit(ok ? 0 : 1);
}
