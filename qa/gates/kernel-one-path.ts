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
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");
const READ_TOOLS = join(REPO_ROOT, "tools/qf-read-tools");
const KERNEL_PKG = join(REPO_ROOT, "packages/qf-kernel");

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
  "tools/qf-peer-bus/src/harness.ts",
  // WO-V1: fixture gate constructs temp Kernel paths (join(dir, "kernel.db")).
  "tools/qf-vault-projection/src/gate.ts",
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

export function checkKernelOnePath(): { ok: boolean; offenders: string[] } {
  const files: string[] = [];
  walk(REPO_ROOT, files);
  const offenders: string[] = [];

  for (const full of files) {
    const rel = relative(REPO_ROOT, full).split("\\").join("/");
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

export async function runKernelOnePathGate(): Promise<{ ok: boolean }> {
  const g1 = checkKernelOnePath();
  if (!g1.ok) return { ok: false };

  const installKernel = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd: KERNEL_PKG,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await installKernel.exited) !== 0) {
    console.error("kernel-one-path: qf-kernel install failed");
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

  const installTools = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd: READ_TOOLS,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await installTools.exited) !== 0) {
    console.error("kernel-one-path G4: qf-read-tools install failed");
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

if (import.meta.main) {
  const { ok } = await runKernelOnePathGate();
  process.exit(ok ? 0 : 1);
}
