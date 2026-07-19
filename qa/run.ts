/**
 * QuantFlow QA gate runner. Every gate is a named, re-runnable check —
 * "verified" means this command passed, never a typed checkmark.
 *
 *   bun qa/run.ts --list
 *   bun qa/run.ts <gate-name>
 *   bun qa/run.ts --all
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { checkKernelSoleWriter } from "./gates/kernel-sole-writer.ts";
import { checkNoCanvasDomainWrites } from "./gates/no-canvas-domain-writes.ts";

const REPO_ROOT = join(import.meta.dir, "..");

type Gate = {
  name: string;
  description: string;
  run: () => boolean | Promise<boolean>;
};

const gates: Gate[] = [
  {
    name: "repo-shape",
    description: "Front door + authority map + orders dir exist; CLA machinery stays gone",
    run: () => {
      const mustExist = [
        "START_HERE.md",
        "DOC_AUTHORITY_MAP.md",
        "docs/orders/README.md",
        ".gitattributes",
      ];
      const mustNotExist = [".clabot", "CLA.md", ".github/workflows/cla.yml"];
      let ok = true;
      for (const f of mustExist) {
        if (!existsSync(join(REPO_ROOT, f))) {
          console.error(`repo-shape: missing required file ${f}`);
          ok = false;
        }
      }
      for (const f of mustNotExist) {
        if (existsSync(join(REPO_ROOT, f))) {
          console.error(`repo-shape: stripped file has returned: ${f}`);
          ok = false;
        }
      }
      return ok;
    },
  },
  {
    name: "lockfile-committed",
    description: "bun.lock exists and is not gitignored (reproducible installs)",
    run: () => {
      const lock = join(REPO_ROOT, "collab-electron", "bun.lock");
      if (!existsSync(lock)) {
        console.error("lockfile-committed: collab-electron/bun.lock missing");
        return false;
      }
      const gi = readFileSync(join(REPO_ROOT, "collab-electron", ".gitignore"), "utf8");
      if (/^bun\.lock$/m.test(gi)) {
        console.error("lockfile-committed: bun.lock is gitignored — remove that line");
        return false;
      }
      return true;
    },
  },
  {
    name: "schema",
    description:
      "qf-kernel-schema tests green (lint, golden, determinism, conformance)",
    run: async () => {
      const cwd = join(REPO_ROOT, "qf-kernel-schema");
      // Sub-packages carry their own lockfile; the root install does not reach
      // them. Install here so the gate behaves identically on a fresh clone
      // (CI) and on a machine where deps happen to be present. Frozen means
      // this can never silently drift from the committed lockfile.
      const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
        cwd,
        stdout: "inherit",
        stderr: "inherit",
      });
      const installCode = await install.exited;
      if (installCode !== 0) {
        console.error(`schema: bun install exited ${installCode}`);
        return false;
      }
      const proc = Bun.spawn(["bun", "test"], {
        cwd,
        stdout: "inherit",
        stderr: "inherit",
      });
      const code = await proc.exited;
      if (code !== 0) {
        console.error(`schema: bun test exited ${code}`);
        return false;
      }
      return true;
    },
  },
  {
    name: "runtime-proof",
    description:
      "WO-004 AgentOS→ACP→ToolLoopAgent proof (P1–P4; no API key; installs own deps)",
    run: async () => {
      const cwd = join(REPO_ROOT, "tools/runtime-proof");
      const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
        cwd,
        stdout: "inherit",
        stderr: "inherit",
      });
      const installCode = await install.exited;
      if (installCode !== 0) {
        console.error(`runtime-proof: bun install exited ${installCode}`);
        return false;
      }
      // Pack the ACP agent (bun test does not run npm pretest hooks), then P1–P4.
      const pack = Bun.spawn(["bun", "run", "pack-agent"], {
        cwd,
        stdout: "inherit",
        stderr: "inherit",
      });
      const packCode = await pack.exited;
      if (packCode !== 0) {
        console.error(`runtime-proof: pack-agent exited ${packCode}`);
        return false;
      }
      const proc = Bun.spawn(["bun", "test", "src"], {
        cwd,
        stdout: "inherit",
        stderr: "inherit",
        env: {
          ...process.env,
          // Ensure no credential is required or consulted.
          OPENAI_API_KEY: "",
          ANTHROPIC_API_KEY: "",
          OPENROUTER_API_KEY: "",
        },
      });
      const code = await proc.exited;
      if (code !== 0) {
        console.error(`runtime-proof: bun test exited ${code}`);
        return false;
      }
      return true;
    },
  },
  {
    name: "kernel",
    description:
      "qf-kernel tests green (migration, commands, replay, session id, trace) — installs own deps",
    run: async () => {
      const cwd = join(REPO_ROOT, "packages/qf-kernel");
      const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
        cwd,
        stdout: "inherit",
        stderr: "inherit",
      });
      const installCode = await install.exited;
      if (installCode !== 0) {
        console.error(`kernel: bun install exited ${installCode}`);
        return false;
      }
      const proc = Bun.spawn(["bun", "test"], {
        cwd,
        stdout: "inherit",
        stderr: "inherit",
      });
      const code = await proc.exited;
      if (code !== 0) {
        console.error(`kernel: bun test exited ${code}`);
        return false;
      }
      return true;
    },
  },
  {
    name: "kernel-sole-writer",
    description:
      "Law E: no SQLite/DDL/DML for domain types outside packages/qf-kernel (+ schema allowlist)",
    run: () => {
      const { ok } = checkKernelSoleWriter();
      return ok;
    },
  },
  {
    name: "no-canvas-domain-writes",
    description:
      "Law E: no QuantFlow domain type persisted via canvas-state / canvas-persistence",
    run: () => {
      const { ok } = checkNoCanvasDomainWrites();
      return ok;
    },
  },
];

async function main() {
  const arg = process.argv[2];
  if (!arg || arg === "--list") {
    for (const g of gates) console.log(`${g.name}\t${g.description}`);
    if (!arg) console.log("\nUsage: bun qa/run.ts --list | <gate-name> | --all");
    return;
  }
  const selected = arg === "--all" ? gates : gates.filter((g) => g.name === arg);
  if (selected.length === 0) {
    console.error(`No gate named '${arg}'. Run with --list.`);
    process.exit(1);
  }
  let failed = 0;
  for (const g of selected) {
    const ok = await g.run();
    console.log(`${ok ? "PASS" : "FAIL"}  ${g.name}`);
    if (!ok) failed++;
  }
  process.exit(failed === 0 ? 0 : 1);
}

main();
