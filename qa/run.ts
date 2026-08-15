/**
 * QuantFlow QA gate runner. Every gate is a named, re-runnable check —
 * "verified" means this command passed, never a typed checkmark.
 *
 *   bun qa/run.ts --list
 *   bun qa/run.ts <gate-name>
 *   bun qa/run.ts --all
 */
import { existsSync, readdirSync, readFileSync } from "fs";
import { join, relative } from "path";
import { execFileSync } from "child_process";
import { runFrozenPackageInstall } from "./package-install.ts";

const REPO_ROOT = join(import.meta.dir, "..");

const SKIP_DIRS = new Set(["node_modules", ".git"]);

type PackageManifest = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type PackageManager = "bun" | "npm" | "pnpm" | "yarn";
type LifecycleOperation = "install" | "ci";

const PEER_BUS_DIR = join(REPO_ROOT, "tools/qf-peer-bus");
const LIFECYCLE_KEYS = ["preinstall", "install", "postinstall"] as const;
const LIFECYCLE_SEGMENT_BREAK = /;|&&|\|\||\|/;
const BARE_PACKAGE_MANAGER =
  /(?<![A-Za-z0-9_./-])(bun|npm|pnpm|yarn)(?![A-Za-z0-9_./-])/g;
const BARE_INSTALL_OPERATION = /(?<![A-Za-z0-9_./-])(install)(?![A-Za-z0-9_./-])/;
const BARE_NPM_OPERATION = /(?<![A-Za-z0-9_./-])(install|ci)(?![A-Za-z0-9_./-])/;

const LIFECYCLE_MATCHER_ALLOWED_CONTROLS = [
  "node scripts/postinstall.mjs",
  "electron-builder install-app-deps",
  "bun run build",
  "npm run build",
  "echo install complete",
] as const;

const LIFECYCLE_MATCHER_REJECTED_CONTROLS = [
  "cd x && bun install",
  "bun --cwd x install --frozen-lockfile",
  "echo preparing; npm --prefix x ci",
] as const;

const TYPECHECK_FALSIFIER_COMMANDS = {
  literal: "cd x && bun install",
  flagged: "bun --cwd x install --frozen-lockfile",
  chained: "echo preparing; npm --prefix x ci",
} as const;

type LifecycleMatch = {
  manager: PackageManager;
  operation: LifecycleOperation;
};

function findLifecycleMatch(command: string): LifecycleMatch | null {
  for (const segment of command.split(LIFECYCLE_SEGMENT_BREAK)) {
    for (const managerMatch of segment.matchAll(BARE_PACKAGE_MANAGER)) {
      const manager = managerMatch[1] as PackageManager;
      const managerEnd = (managerMatch.index ?? 0) + manager.length;
      const operationPattern =
        manager === "npm" ? BARE_NPM_OPERATION : BARE_INSTALL_OPERATION;
      const operationMatch = operationPattern.exec(segment.slice(managerEnd));
      if (operationMatch) {
        return { manager, operation: operationMatch[1] as LifecycleOperation };
      }
    }
  }
  return null;
}

function runLifecycleMatcherControls(): boolean {
  for (const command of LIFECYCLE_MATCHER_ALLOWED_CONTROLS) {
    if (findLifecycleMatch(command)) {
      console.error(`typecheck: lifecycle matcher rejected allowed control: ${command}`);
      return false;
    }
  }
  for (const command of LIFECYCLE_MATCHER_REJECTED_CONTROLS) {
    if (!findLifecycleMatch(command)) {
      console.error(`typecheck: lifecycle matcher allowed rejected control: ${command}`);
      return false;
    }
  }
  return true;
}

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

  // The Bovada typecheck uses tsconfig paths into collab-electron source, so
  // that app's external imports are part of the strict typecheck closure even
  // though collab-electron does not declare its own typecheck script.
  const collabElectron = join(root, "collab-electron");
  if (existsSync(join(collabElectron, "package.json"))) {
    queue.push(collabElectron);
  }

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

function lifecycleManifest(
  dir: string,
  pkg: PackageManifest,
  falsifierCommand: string | undefined,
): PackageManifest {
  if (falsifierCommand === undefined || dir !== PEER_BUS_DIR) return pkg;
  return {
    ...pkg,
    scripts: { ...pkg.scripts, postinstall: falsifierCommand },
  };
}

function checkLifecycleScripts(
  installDirs: string[],
  falsifierCommand: string | undefined,
): boolean {
  let falsifierApplied = falsifierCommand === undefined;
  for (const dir of installDirs) {
    const pkg = readPackageManifest(dir);
    if (!pkg) continue;
    const manifest = lifecycleManifest(dir, pkg, falsifierCommand);
    if (falsifierCommand !== undefined && dir === PEER_BUS_DIR) {
      falsifierApplied = true;
    }
    for (const lifecycleKey of LIFECYCLE_KEYS) {
      const command = manifest.scripts?.[lifecycleKey];
      if (typeof command !== "string") continue;
      const match = findLifecycleMatch(command);
      if (!match) continue;
      console.error(
        `typecheck: forbidden lifecycle install package=${relative(REPO_ROOT, dir)} lifecycle=${lifecycleKey} manager=${match.manager} operation=${match.operation} command=${command}`,
      );
      return false;
    }
  }
  if (!falsifierApplied) {
    console.error(
      `typecheck: falsifier target is not in the install closure: ${relative(REPO_ROOT, PEER_BUS_DIR)}`,
    );
    return false;
  }
  return true;
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
  if (!(await runFrozenPackageInstall(gateName, cwd))) return false;

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

/** Every path git tracks, repo-relative with forward slashes. */
function trackedFiles(): string[] {
  return execFileSync("git", ["ls-files"], { cwd: REPO_ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const gates: Gate[] = [
  {
    name: "research-director-front-door",
    description: "WO-RD-1: real Research Director form admission, durable Mission, exact session, and automatic tile",
    run: async () => {
      const { runResearchDirectorFrontDoorGate } = await import("./gates/research-director-front-door.ts");
      const { ok } = await runResearchDirectorFrontDoorGate();
      return ok;
    },
  },
  {
    name: "research-director-delegation",
    description: "WO-RD-2: real Research Director recruitment, durable Task assignment, and specialist canvas receipt",
    run: async () => {
      const { runResearchDirectorDelegationGate } = await import("./gates/research-director-delegation.ts");
      const { ok } = await runResearchDirectorDelegationGate();
      return ok;
    },
  },
  {
    name: "repo-shape",
    description: "The authority set named by START_HERE exists; CLA machinery stays gone",
    run: () => {
      // Mirrors START_HERE.md section 3. A file listed there and absent here is a
      // gate that stopped guarding the thing it names; a file here and absent there
      // is a document claiming authority nobody granted. Update both together.
      const mustExist = [
        "START_HERE.md",
        "AGENTS.md",
        "docs/DOCTRINE.md",
        "docs/LAWS.md",
        "docs/DEBT.md",
        "docs/orders/NEXT.md",
        "docs/orders/PROTOCOL.md",
        "docs/adr/0001-windows-first-product.md",
        "qf-kernel-schema/golden/ONTOLOGY.md",
        ".gitattributes",
      ];
      // DOC_AUTHORITY_MAP.md and docs/orders/README.md were hand-maintained caches
      // about other documents. Archived to docs/history/ on 2026-08-03 under
      // DOCTRINE A9. Their return would mean the doc-about-docs layer grew back.
      const mustNotExist = [
        ".clabot",
        "CLA.md",
        ".github/workflows/cla.yml",
        "DOC_AUTHORITY_MAP.md",
        "docs/orders/README.md",
        "docs/orders/SCOPES.md",
        "docs/ROADMAP.md",
      ];
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
      // A rendered export is a copy of a document with no mechanism to stay
      // true. QuantFlow-Ontology-Doctrine.pdf sat at the root from 2026-07-22
      // while docs/DOCTRINE.md changed three times underneath it, and the only
      // note explaining it was an export was itself archived. Exports live in
      // docs/history/ with a date in the filename, or they do not live here.
      const EXPORT_EXT = /\.(pdf|docx?|rtf|odt|pptx?|xlsx?|bak|old|orig)$/i;
      for (const rel of trackedFiles()) {
        if (EXPORT_EXT.test(rel) && !rel.startsWith("docs/history/")) {
          console.error(
            `repo-shape: rendered export tracked outside docs/history/: ${rel}`,
          );
          ok = false;
        }
      }
      // The root is the first thing any agent lists. Keep it to the front door
      // and nothing else, so a stray file cannot read as authority.
      const ROOT_ALLOWED = new Set([
        ".gitattributes",
        ".gitignore",
        ".mcp.json",
        "AGENTS.md",
        "install.sh",
        "LICENSE.md",
        "NOTICE.md",
        "README.md",
        "START_HERE.md",
      ]);
      for (const rel of trackedFiles()) {
        if (!rel.includes("/") && !ROOT_ALLOWED.has(rel)) {
          console.error(
            `repo-shape: unexpected tracked file at repo root: ${rel} — add it to ROOT_ALLOWED deliberately or move it`,
          );
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
    name: "schema-bundle-aliases",
    description:
      "WO-CI1: forbid private qf-kernel aliases; require bundle excludes and live package exports",
    run: async () => {
      const { runSchemaBundleAliasesGate } = await import(
        "./gates/schema-bundle-aliases.ts"
      );
      const { ok } = runSchemaBundleAliasesGate();
      return ok;
    },
  },
  {
    name: "release-verifier",
    description:
      "WO-WIN1: CI and verifier docs use the native Windows release door and its independent stage contract",
    run: async () => {
      const { runReleaseVerifierGate } = await import(
        "./gates/release-verifier.ts"
      );
      const { ok } = await runReleaseVerifierGate();
      return ok;
    },
  },
  {
    name: "package-closure",
    description:
      "WO-CI2: packaged Linux app closes over qf-toolloop and Hermes runtime bytes",
    run: async () => {
      const { runPackageClosureGate } = await import("./gates/package-closure.ts");
      const { ok } = await runPackageClosureGate();
      return ok;
    },
  },
  {
    name: "windows-cold-boot",
    description:
      "WO-WIN1: unpacked Windows package boots on isolated stores, answers ping, and shuts down cleanly",
    run: async () => {
      const { runWindowsColdBootGate } = await import(
        "./gates/windows-cold-boot.ts"
      );
      const { ok } = await runWindowsColdBootGate();
      return ok;
    },
  },
  {
    name: "windows-dock-collaboration",
    description:
      "WO-WIN2: packaged normal-Dock deterministic task/ACK round trip with Kernel lineage and clean shutdown",
    run: async () => {
      const { runWindowsDockCollaborationGate } = await import(
        "./gates/windows-dock-collaboration.ts"
      );
      const { ok } = await runWindowsDockCollaborationGate();
      return ok;
    },
  },
  {
    name: "hermes-founder-state",
    description:
      "R0: SHA-256 of WSL ~/.hermes/config.yaml and auth.json unchanged across a seat launch (hashes only)",
    run: async () => {
      const { runHermesFounderStateGate } = await import(
        "./gates/hermes-founder-state.ts"
      );
      const { ok } = await runHermesFounderStateGate();
      return ok;
    },
  },
  {
    name: "windows-dock-ontology",
    description:
      "R1: Dock seat calls generated ontology read tools through the app-owned gateway; foreign kernel_db refused",
    run: async () => {
      const { runWindowsDockOntologyGate } = await import(
        "./gates/windows-dock-ontology.ts"
      );
      const { ok } = await runWindowsDockOntologyGate();
      return ok;
    },
  },
  {
    name: "windows-dock-capability",
    description:
      "R2: capability groups grant desk tools to orchestrator and refuse them for worker",
    run: async () => {
      const { runWindowsDockCapabilityGate } = await import(
        "./gates/windows-dock-capability.ts"
      );
      const { ok } = await runWindowsDockCapabilityGate();
      return ok;
    },
  },
  {
    name: "windows-dock-hire",
    description:
      "R3: orchestrator catalogs/hires via ontology gateway; canvas projects Kernel sessions",
    run: async () => {
      const { runWindowsDockHireGate } = await import(
        "./gates/windows-dock-hire.ts"
      );
      const { ok } = await runWindowsDockHireGate();
      return ok;
    },
  },
  {
    name: "windows-dock-species",
    description:
      "R4: Claude Code and Hermes-contract seats share ontology gateway; no hermes MCP hardcode",
    run: async () => {
      const { runWindowsDockSpeciesGate } = await import(
        "./gates/windows-dock-species.ts"
      );
      const { ok } = await runWindowsDockSpeciesGate();
      return ok;
    },
  },
  {
    name: "kernel-task-delegation",
    description:
      "R5: create_task + assigned_to + complete_task survive reopen; illegal transition refused",
    run: async () => {
      const { runKernelTaskDelegationGate } = await import(
        "./gates/kernel-task-delegation-launch.ts"
      );
      const { ok } = await runKernelTaskDelegationGate();
      return ok;
    },
  },
  {
    name: "dev-dock-readiness",
    description:
      "V2-3R: public development startup uses tracked native-TUI assets before Electron",
    run: async () => {
      const { runDevDockReadinessGate } = await import(
        "./gates/dev-dock-readiness.ts"
      );
      const { ok } = await runDevDockReadinessGate();
      return ok;
    },
  },
  {
    name: "team-composition",
    description:
      "WO-V2-3: Dock roles/readiness and Kernel-backed task create, reassign, cancel, projection, and close guard",
    run: async () => {
      const { runTeamCompositionGate } = await import("./gates/team-composition-launch.ts");
      const { ok } = await runTeamCompositionGate();
      return ok;
    },
  },
  {
    name: "team-composition-ui",
    description:
      "V2-3.1: production renderer/preload/main Task, tile raise, and Dock pending route",
    run: async () => {
      const { runTeamCompositionUiGate } = await import(
        "./gates/team-composition-ui-launch.ts"
      );
      const { ok } = await runTeamCompositionUiGate();
      return ok;
    },
  },
  {
    name: "acp-fs-confine",
    description:
      "R7: ACP fs confined to QF_ACP_FS_ROOT; unset root not advertised; escape baits refused",
    run: async () => {
      const { runAcpFsConfineGate } = await import("./gates/acp-fs-confine.ts");
      const { ok } = await runAcpFsConfineGate();
      return ok;
    },
  },
  {
    name: "kernel-market-lineage",
    description:
      "R6: answer lineage must cite seeded/read ids; empty and fabricated cites fail",
    run: async () => {
      const { runKernelMarketLineageGate } = await import(
        "./gates/kernel-market-lineage-launch.ts"
      );
      const { ok } = await runKernelMarketLineageGate();
      return ok;
    },
  },
  {
    name: "windows-research-question",
    description:
      "R8: canvas/RPC submit creates Kernel mission + starts orchestrator",
    run: async () => {
      const { runWindowsResearchQuestionGate } = await import(
        "./gates/windows-research-question.ts"
      );
      const { ok } = await runWindowsResearchQuestionGate();
      return ok;
    },
  },
  {
    name: "windows-golden-run",
    description:
      "Act I: one packaged Submit delegates a cited market result and recovers it after restart",
    run: async () => {
      const { runWindowsGoldenRunGate } = await import(
        "./gates/windows-golden-run.ts"
      );
      const { ok } = await runWindowsGoldenRunGate();
      return ok;
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
      if (!runLifecycleMatcherControls()) return false;

      const selector = process.env.QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL;
      let falsifierCommand: string | undefined;
      if (selector !== undefined) {
        if (!Object.prototype.hasOwnProperty.call(TYPECHECK_FALSIFIER_COMMANDS, selector)) {
          console.error(
            `typecheck: unknown QF_TYPECHECK_FALSIFY_RECURSIVE_INSTALL value=${JSON.stringify(selector)}; expected literal, flagged, or chained`,
          );
          return false;
        }
        falsifierCommand =
          TYPECHECK_FALSIFIER_COMMANDS[
            selector as keyof typeof TYPECHECK_FALSIFIER_COMMANDS
          ];
      }

      const typecheckPackages = discoverTypecheckPackages(REPO_ROOT);
      if (typecheckPackages.length === 0) {
        console.error("typecheck: no packages with a typecheck script found");
        return false;
      }
      const installPackages = discoverTypecheckInstallPackages(REPO_ROOT);
      if (!checkLifecycleScripts(installPackages, falsifierCommand)) return false;

      for (const cwd of installPackages) {
        if (!(await runFrozenPackageInstall("typecheck", cwd))) return false;
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
    run: async () => {
      const { checkKernelSoleWriter } = await import("./gates/kernel-sole-writer.ts");
      const { ok } = checkKernelSoleWriter();
      return ok;
    },
  },
  {
    name: "kernel-sole-writer-app",
    description:
      "WO-006b: only collab-electron/src/main/kernel.ts may import qf-kernel/sqlite or reference the Kernel db file",
    run: async () => {
      const { checkKernelSoleWriterApp } = await import(
        "./gates/kernel-sole-writer-app.ts"
      );
      const { ok } = checkKernelSoleWriterApp();
      return ok;
    },
  },
  {
    name: "kernel-one-path",
    description:
      "WO-K1: one Kernel resolver; WAL/busy_timeout; MCP seat shares the default world",
    run: async () => {
      const { runKernelOnePathGate } = await import("./gates/kernel-one-path.ts");
      const { ok } = await runKernelOnePathGate();
      return ok;
    },
  },
  {
    name: "no-canvas-domain-writes",
    description:
      "Law E: no QuantFlow domain type persisted via canvas-state / canvas-persistence",
    run: async () => {
      const { checkNoCanvasDomainWrites } = await import(
        "./gates/no-canvas-domain-writes.ts"
      );
      const { ok } = checkNoCanvasDomainWrites();
      return ok;
    },
  },
  {
    name: "doc-links",
    description:
      "Every relative link in a live document resolves; links into docs/history/ are marked superseded",
    run: async () => {
      const { checkDocLinks } = await import("./gates/doc-links.ts");
      return checkDocLinks().ok;
    },
  },
  {
    name: "rung-ladder",
    description:
      "GOLDEN-RUN.md rung status and NEXT.md agree; one active rung; complete rungs have evidence; no rung skipped; no second ladder",
    run: async () => {
      const { checkRungLadder } = await import("./gates/rung-ladder.ts");
      return checkRungLadder().ok;
    },
  },
  {
    name: "observe-door",
    description:
      "Debt #22: observe_ticket strings only on allowlist; no tools.json reads or generateMcp calls outside qf-kernel-schema/",
    run: async () => {
      const { checkObserveDoor } = await import("./gates/observe-door.ts");
      const { ok } = checkObserveDoor();
      return ok;
    },
  },
  {
    name: "agent-path",
    description:
      "WO-006c: headless spawn→stream→tool→artifact, concurrency, cancel, orphans, reconcile",
    run: async () => {
      const { runAgentPathGate } = await import("./gates/agent-path.ts");
      const { ok } = await runAgentPathGate();
      return ok;
    },
  },
  {
    name: "glacier-feel",
    description:
      "WO-g6: cable endpoints track tile geometry; Kernel ledger projection matches events",
    run: async () => {
      const { checkGlacierFeel } = await import("./gates/glacier-feel.ts");
      return checkGlacierFeel().ok;
    },
  },
  {
    name: "one-skin",
    description:
      "WO-006d/007: no raw hex/rgb/hsl or non-token font-family outside windows/shared/qf-tokens.css",
    run: async () => {
      const { checkOneSkin } = await import("./gates/one-skin.ts");
      const { ok } = checkOneSkin();
      return ok;
    },
  },
  {
    name: "dock-profile-identity",
    description:
      "WO-D1: Dock profile identity, upgrade, spawned_from, operator-only surface, callsite coupling",
    run: async () => {
      const { runDockProfileIdentityGate } = await import("./gates/dock-profile-identity.ts");
      const { ok } = await runDockProfileIdentityGate();
      return ok;
    },
  },
  {
    name: "dock-production-inventory",
    description:
      "R13: production Dock excludes QA fixture identities while QA closure retains claude-code-ungranted",
    run: async () => {
      const { runDockProductionInventoryGate } = await import(
        "./gates/dock-production-inventory.ts"
      );
      return runDockProductionInventoryGate().ok;
    },
  },
  {
    name: "hermes-launch-policy",
    description:
      "R13: all Hermes launcher branches pass the two QuantFlow MCP toolsets exactly once and preserve one TUI flag",
    run: async () => {
      const { runHermesLaunchPolicyGate } = await import(
        "./gates/hermes-launch-policy.ts"
      );
      return runHermesLaunchPolicyGate().ok;
    },
  },
  {
    name: "hermes-first-turn-synthetic",
    description:
      "WO-V2-2: production Hermes packaged-seat first turn through Dock, PTY, app-owned MCP bridges, Kernel, and deterministic falsifiers",
    run: async () => {
      const { runHermesFirstTurnSyntheticGate } = await import(
        "./gates/hermes-research.ts"
      );
      return (await runHermesFirstTurnSyntheticGate()).ok;
    },
  },
  {
    name: "windows-hermes-research-chain",
    description:
      "WO-V2-2: installed production Hermes question-to-report chain with Dataset as-of, R11b metrics, independent Evaluation, lineage hashes, and process cleanup",
    run: async () => {
      const { runWindowsHermesResearchChainGate } = await import(
        "./gates/hermes-research.ts"
      );
      return (await runWindowsHermesResearchChainGate()).ok;
    },
  },
  {
    name: "windows-installer",
    description:
      "R13: finite unsigned NSIS build, honest Authenticode/status metadata, isolated silent install, readiness, and clean shutdown",
    run: async () => {
      const { runWindowsInstallerGate } = await import(
        "./gates/windows-installer.ts"
      );
      return (await runWindowsInstallerGate()).ok;
    },
  },
  {
    name: "dock-definition-launch",
    description:
      "WO-D2: packaged Dock defaults, definition-driven argv, peer ownership, and native-TUI compensation",
    run: async () => {
      const { runDockDefinitionLaunchGate } = await import(
        "./gates/dock-definition-launch.ts"
      );
      const { ok } = await runDockDefinitionLaunchGate();
      return ok;
    },
  },
  {
    name: "dock-registry",
    description:
      "WO-007: agent_definition registry list/resolve, species-literal scan, linkSoftware admission",
    run: async () => {
      const { runDockRegistryGate } = await import("./gates/dock-registry.ts");
      const { ok } = await runDockRegistryGate();
      return ok;
    },
  },
  {
    name: "tool-plane",
    description:
      "WO-105: MCP tool-plane harness (read + action tools, set-equality served surface, GATE 1/2 at transport)",
    run: async () => {
      const cwd = join(REPO_ROOT, "tools/qf-read-tools");
      return bunPackageGate("tool-plane", cwd, ["bun", "run", "harness"]);
    },
  },
  {
    name: "market-context",
    description:
      "WO-107c: trusted venue/event context, atomic market links, exact replay, upgrade/package closure, and hidden context actions",
    run: async () => {
      const { runMarketContextGate } = await import("./gates/market-context.ts");
      const { ok } = await runMarketContextGate();
      return ok;
    },
  },
  {
    name: "market-ingest",
    description:
      "WO-107b: governed pipeline catalog, upgrade chain, atomic/replay-safe market ingest, and generated reads",
    run: async () => {
      const { runMarketIngestGate } = await import("./gates/market-ingest.ts");
      const { ok } = await runMarketIngestGate();
      return ok;
    },
  },
  {
    name: "tool-discovery",
    description:
      "WO-106 D4/G1/G3: tools/list sufficiency, schema equality, operator door set relations",
    run: async () => {
      const { runToolDiscoveryGate } = await import("./gates/tool-discovery.ts");
      const { ok } = await runToolDiscoveryGate();
      return ok;
    },
  },
  {
    name: "action-transport",
    description:
      "WO-106 G2: action tools stay permissive at MCP transport; Kernel rejects unknown keys",
    run: async () => {
      const { runActionTransportGate } = await import("./gates/action-transport.ts");
      const { ok } = await runActionTransportGate();
      return ok;
    },
  },
  {
    name: "publish-artifact-root",
    description:
      "WO-106b G1/G2/G3: publish_artifact path confined to QF_ARTIFACT_ROOT; fail closed without root",
    run: async () => {
      const { runPublishArtifactRootGate } = await import(
        "./gates/publish-artifact-root.ts"
      );
      const { ok } = await runPublishArtifactRootGate();
      return ok;
    },
  },
  {
    name: "verb-retirement",
    description:
      "WO-106 G4: retired read verbs and renamed hand-written SQL stay deleted",
    run: async () => {
      const { checkVerbRetirement } = await import("./gates/verb-retirement.ts");
      const { ok } = checkVerbRetirement();
      return ok;
    },
  },
  {
    name: "boot-reconcile",
    description:
      "WO-106 G5: boot reconciliation closes every acted-on session above 100 rows",
    run: async () => {
      const { runBootReconcileGate } = await import("./gates/boot-reconcile.ts");
      const { ok } = await runBootReconcileGate();
      return ok;
    },
  },
  {
    name: "kernel-drift",
    description:
      "WO-K3 G1–G3/G6: object-type registry drift detector, attachKernel enforcement, canary incomplete DB",
    run: async () => {
      const { runKernelDriftGate } = await import("./gates/kernel-drift.ts");
      const { ok } = await runKernelDriftGate();
      return ok;
    },
  },
  {
    name: "artifact-root",
    description:
      "WO-K3 G4/D5: resolveArtifactRoot default, publish under root, agent-host path grep",
    run: async () => {
      const { runArtifactRootGate } = await import("./gates/artifact-root.ts");
      const { ok } = await runArtifactRootGate();
      return ok;
    },
  },
  {
    name: "bovada-football",
    description:
      "WO-107: fixed public capture, Kernel graph/replay, 92-tool surface, and shipped CLI/app closure",
    run: async () => {
      const { runBovadaFootballGate } = await import(
        "./gates/bovada-football/run.ts"
      );
      const { ok } = await runBovadaFootballGate();
      return ok;
    },
  },
  {
    name: "product-identity",
    description:
      "WO-N1: pinned QuantFlow identity, staged legacy migration, production delegation, and shipped Linux metadata",
    run: async () => {
      const { runProductIdentityGate } = await import("./gates/product-identity.ts");
      const { ok } = await runProductIdentityGate();
      return ok;
    },
  },
  {
    name: "vault-projection",
    description:
      "WO-V1: Kernel→Obsidian projection (one-direction, hash-verify, schema-driven, idempotent)",
    run: async () => {
      const { runVaultProjectionGate } = await import("./gates/vault-projection.ts");
      const { ok } = await runVaultProjectionGate();
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
  const exitCode = failed === 0 ? 0 : 1;
  if (arg === "windows-cold-boot" && selected.length === 1) {
    console.log(`windows-cold-boot: direct-process-exit=${exitCode}`);
  }
  process.exit(exitCode);
}

main();
