/**
 * QuantFlow QA gate runner. Every gate is a named, re-runnable check —
 * "verified" means this command passed, never a typed checkmark.
 *
 *   bun qa/run.ts --list
 *   bun qa/run.ts <gate-name>
 *   bun qa/run.ts --all
 */
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { checkDocActionSurface } from "./gates/doc-action-surface.ts";
import { checkObserveDoor } from "./gates/observe-door.ts";
import { checkKernelSoleWriter } from "./gates/kernel-sole-writer.ts";
import { checkKernelSoleWriterApp } from "./gates/kernel-sole-writer-app.ts";
import { checkNoCanvasDomainWrites } from "./gates/no-canvas-domain-writes.ts";
import { checkOneSkin } from "./gates/one-skin.ts";
// agent-path / dock-registry: cold-safe launchers only (no heavy top-level imports)
import { runAgentPathGate } from "./gates/agent-path.ts";
import { runDockRegistryGate } from "./gates/dock-registry.ts";

const REPO_ROOT = join(import.meta.dir, "..");

const SKIP_DIRS = new Set(["node_modules", ".git"]);

type PackageManifest = {
  scripts?: { typecheck?: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

function readPackageManifest(dir: string): PackageManifest | null {
  const pkgPath = join(dir, "package.json");
  if (!existsSync(pkgPath)) return null;
  return JSON.parse(readFileSync(pkgPath, "utf8")) as PackageManifest;
}

/** Collect local `file:` dependency paths declared in a package manifest. */
function localFileDeps(pkg: PackageManifest): string[] {
  const found: string[] = [];
  for (const section of [
    pkg.dependencies,
    pkg.devDependencies,
    pkg.peerDependencies,
    pkg.optionalDependencies,
  ]) {
    if (!section) continue;
    for (const value of Object.values(section)) {
      if (value.startsWith("file:")) found.push(value.slice("file:".length));
    }
  }
  return found;
}

/**
 * Packages to install before typecheck: each typecheck target plus the
 * transitive closure of its local `file:` dependencies (read from manifests).
 */
function discoverTypecheckInstallPackages(root: string): string[] {
  const installDirs = new Set<string>();
  const queue = [...discoverTypecheckPackages(root)];

  while (queue.length > 0) {
    const dir = queue.pop()!;
    if (installDirs.has(dir)) continue;
    installDirs.add(dir);

    const pkg = readPackageManifest(dir);
    if (!pkg) continue;

    for (const relPath of localFileDeps(pkg)) {
      const resolved = join(dir, relPath);
      if (existsSync(join(resolved, "package.json")) && !installDirs.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return [...installDirs].sort();
}

/** Walk the repo for package.json files that declare a typecheck script. */
function discoverTypecheckPackages(root: string): string[] {
  const found: string[] = [];
  function walk(dir: string): void {
    const base = dir.slice(dir.lastIndexOf("/") + 1);
    if (SKIP_DIRS.has(base)) return;
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
        scripts?: { typecheck?: string };
      };
      if (pkg.scripts?.typecheck) found.push(dir);
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name));
    }
  }
  walk(root);
  return found.sort();
}

type Gate = {
  name: string;
  description: string;
  run: () => boolean | Promise<boolean>;
};

/**
 * Shared package gate runner: frozen install, then package-local test command.
 * Keeps per-gate error prefixes so failures still report as `schema:`/`kernel:`.
 */
async function bunPackageGate(
  gateName: string,
  cwd: string,
  testCommand: readonly [string, ...string[]] = ["bun", "test"],
): Promise<boolean> {
  const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const installCode = await install.exited;
  if (installCode !== 0) {
    console.error(`${gateName}: bun install exited ${installCode}`);
    return false;
  }

  const proc = Bun.spawn([...testCommand], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0) {
    console.error(`${gateName}: ${testCommand.join(" ")} exited ${code}`);
    return false;
  }
  return true;
}

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
      return bunPackageGate("schema", cwd);
    },
  },
  {
    name: "runtime-proof",
    description:
      "WO-004a AgentOS→ACP→ToolLoopAgent proof (P1–P4; no API key; installs own deps; pack-once in test beforeAll)",
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
      // Pack happens once inside the suite beforeAll — do not pack again here.
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
      return bunPackageGate("kernel", cwd);
    },
  },
  {
    name: "typecheck",
    description:
      "TypeScript strict check for every package that declares a typecheck script",
    run: async () => {
      const typecheckPackages = discoverTypecheckPackages(REPO_ROOT);
      if (typecheckPackages.length === 0) {
        console.error("typecheck: no packages with a typecheck script found");
        return false;
      }
      for (const cwd of discoverTypecheckInstallPackages(REPO_ROOT)) {
        const install = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
          cwd,
          stdout: "inherit",
          stderr: "inherit",
        });
        const installCode = await install.exited;
        if (installCode !== 0) {
          console.error(`typecheck: bun install in ${cwd} exited ${installCode}`);
          return false;
        }
      }
      for (const cwd of typecheckPackages) {
        const proc = Bun.spawn(["bunx", "tsc", "--noEmit"], {
          cwd,
          stdout: "inherit",
          stderr: "inherit",
        });
        const code = await proc.exited;
        if (code !== 0) {
          console.error(`typecheck: bunx tsc --noEmit in ${cwd} exited ${code}`);
          return false;
        }
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
    name: "kernel-sole-writer-app",
    description:
      "WO-006b: only collab-electron/src/main/kernel.ts may import qf-kernel/sqlite or reference kernel.db",
    run: () => {
      const { ok } = checkKernelSoleWriterApp();
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
  {
    name: "doc-action-surface",
    description:
      "Debt #0: ONTOLOGY_SCHEMA.md §Actions equals schema.ts actions (names both directions)",
    run: () => {
      const { ok } = checkDocActionSurface();
      return ok;
    },
  },
  {
    name: "observe-door",
    description:
      "Debt #22: observe_ticket strings only on allowlist; no tools.json reads or generateMcp calls outside qf-kernel-schema/",
    run: () => {
      const { ok } = checkObserveDoor();
      return ok;
    },
  },
  {
    name: "agent-path",
    description:
      "WO-006c: headless spawn→stream→tool→artifact, concurrency, cancel, orphans, reconcile",
    run: async () => {
      const { ok } = await runAgentPathGate();
      return ok;
    },
  },
  {
    name: "one-skin",
    description:
      "WO-006d/007: no raw hex/rgb/hsl or non-token font-family outside windows/shared/qf-tokens.css",
    run: () => {
      const { ok } = checkOneSkin();
      return ok;
    },
  },
  {
    name: "dock-registry",
    description:
      "WO-007: agent_definition registry list/resolve, species-literal scan, linkSoftware admission",
    run: async () => {
      const { ok } = await runDockRegistryGate();
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
