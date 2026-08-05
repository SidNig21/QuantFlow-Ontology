/**
 * WO-N1: product identity, migration coupling, and compatibility-boundary gate.
 * This launcher stays dependency-free so it runs from a cold checkout.
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, posix, relative, win32 } from "node:path";

const REPO = join(import.meta.dir, "../..");
const COLLAB = join(REPO, "collab-electron");

type Failure = { ok: false; reason: string };
type Success = { ok: true };
type Result = Failure | Success;

const fail = (reason: string): Failure => ({ ok: false, reason });

function text(rel: string): string {
  return readFileSync(join(REPO, rel), "utf8");
}

function sourceIdentity(): Result {
  const pkg = JSON.parse(text("collab-electron/package.json")) as {
    name?: unknown;
    build?: {
      appId?: unknown;
      productName?: unknown;
      publish?: Array<{ provider?: unknown; owner?: unknown; repo?: unknown }>;
      linux?: { executableName?: unknown };
    };
  };
  if (pkg.name !== "@quantflow/electron") {
    return fail(`package name must be @quantflow/electron, got ${String(pkg.name)}`);
  }
  if (pkg.build?.appId !== "com.quantflow.ontology") {
    return fail(`appId must be com.quantflow.ontology, got ${String(pkg.build?.appId)}`);
  }
  if (pkg.build?.productName !== "QuantFlow") {
    return fail(`productName must be QuantFlow, got ${String(pkg.build?.productName)}`);
  }
  if (pkg.build?.linux?.executableName !== "quantflow") {
    return fail(
      `Linux executableName must be quantflow, got ${String(pkg.build?.linux?.executableName)}`,
    );
  }
  const publish = pkg.build?.publish;
  if (
    !Array.isArray(publish) ||
    publish.length !== 1 ||
    publish[0]?.provider !== "github" ||
    publish[0]?.owner !== "SidNig21" ||
    publish[0]?.repo !== "QuantFlow-Ontology"
  ) {
    return fail("publish target must be exactly github:SidNig21/QuantFlow-Ontology");
  }

  const installer = text("install.sh");
  if (!/^REPO="SidNig21\/QuantFlow-Ontology"$/m.test(installer)) {
    return fail("install.sh release repository is not SidNig21/QuantFlow-Ontology");
  }
  if (!/INSTALL_PATH="\$\{INSTALL_DIR\}\/quantflow"/.test(installer)) {
    return fail("install.sh does not install the Linux executable as quantflow");
  }

  const upload = text("collab-electron/scripts/upload-to-github.cjs");
  if (!/name:\s*`QuantFlow Ontology \$\{version\}`/.test(upload)) {
    return fail("GitHub release title is not QuantFlow Ontology");
  }
  if (/collabs-inc|collab-public/.test(JSON.stringify(pkg.build?.publish))) {
    return fail("old production release target remains in package publish configuration");
  }
  return { ok: true };
}

type ResidualBucket = "B" | "C" | "D";
type Residual = { file: string; line: number; value: string; bucket: ResidualBucket };

const CURRENT_DOCS_THAT_MUST_NOT_BE_STALE = new Set([
  "docs/demos/agent-path.md",
  "docs/demos/dock.md",
  "docs/demos/law-d.md",
  "species/critic-mock/README.md",
  "species/hermes/README.md",
]);

function bucketC(file: string): boolean {
  if (CURRENT_DOCS_THAT_MUST_NOT_BE_STALE.has(file)) return false;
  return (
    file === "README.md" ||
    file === "START_HERE.md" ||
    /^LICENSE(?:\.|$)/.test(file) ||
    /^NOTICE(?:\.|$)/.test(file) ||
    file.startsWith("docs/orders/") ||
    file.startsWith("docs/archive/") ||
    file.startsWith("docs/superpowers/") ||
    file.startsWith("collab-electron/docs/superpowers/") ||
    file === "collab-electron/scripts/package-lib/package-inspect.ts" ||
    file === "collab-electron/scripts/package-lib/package-inspect.test.ts" ||
    file === "docs/BLUEPRINT.md" ||
    file === "docs/ROADMAP.md" ||
    file === "tools/qf-vault-projection/src/gate.ts" ||
    file.startsWith("qa/")
  );
}

function bucketD(file: string, value: string): boolean {
  if (file === ".gitignore" || file === "collab-electron/.gitignore") {
    return /\.collaborator/.test(value);
  }
  if (
    file === "collab-electron/src/main/app-migration.ts" ||
    file === "collab-electron/src/main/app-migration.test.ts"
  ) {
    return /\.collaborator|@collaborator(?:\/electron)?/i.test(value) &&
      !/collabs-inc|collab-public|collaborator-ai/.test(value);
  }
  if (file === "collab-electron/src/main/cli-installer.ts") {
    return /^\s*["'`](?:Collaborator|collaborator)["'`]\s*,?\s*$/.test(value) ||
      (/LEGACY_INSTALL_DIR|legacyNames/.test(value) && /collaborator/i.test(value));
  }
  return false;
}

function bucketB(file: string, value: string): boolean {
  if (file === "collab-electron/src/main/ipc-endpoint.ts") {
    return /collaborator-/.test(value);
  }
  return /@collab\/|collab-file/i.test(value);
}

function trackedFiles(): string[] {
  const proc = Bun.spawnSync(
    ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
    cwd: REPO,
    stdout: "pipe",
    stderr: "pipe",
    },
  );
  if (proc.exitCode !== 0) {
    throw new Error(`git ls-files failed: ${proc.stderr.toString()}`);
  }
  return [...new Set(proc.stdout.toString().split("\0").filter(Boolean))].sort();
}

function classifyResiduals(): Result & { residuals?: Residual[] } {
  const forbidden = /\.collaborator|@collaborator\/electron|\bcollaborator\b|collabs-inc|collab-public/ig;
  const residuals: Residual[] = [];
  const files = trackedFiles();
  // Coverage floor. Empty git listing → zero residuals → PASS while scanning nothing.
  const MIN_TRACKED = 100;
  const sawPackageJson = files.includes("collab-electron/package.json");
  if (files.length < MIN_TRACKED || !sawPackageJson) {
    return {
      ok: false,
      reason:
        `product-identity: scan collapsed — ${files.length} tracked files, ` +
        `collab-electron/package.json seen: ${sawPackageJson}. ` +
        `Refusing to report PASS on a scan that inspected nothing.`,
    };
  }
  for (const file of files) {
    const abs = join(REPO, file);
    if (!existsSync(abs) || !statSync(abs).isFile()) continue;
    let source: string;
    try {
      source = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    for (const [index, line] of source.split("\n").entries()) {
      forbidden.lastIndex = 0;
      if (!forbidden.test(line)) continue;
      let bucket: ResidualBucket | null = null;
      if (bucketD(file, line)) bucket = "D";
      else if (bucketB(file, line)) bucket = "B";
      else if (bucketC(file)) bucket = "C";
      if (!bucket) {
        return {
          ok: false,
          reason: `unclassified or stale product identity at ${file}:${index + 1}: ${line.trim()}`,
          residuals,
        };
      }
      residuals.push({ file, line: index + 1, value: line.trim(), bucket });
    }
  }

  const dFiles = [...new Set(residuals.filter((item) => item.bucket === "D").map((item) => item.file))].sort();
  const unexpectedD = dFiles.filter(
    (file) =>
      ![
        ".gitignore",
        "collab-electron/.gitignore",
        "collab-electron/src/main/app-migration.ts",
        "collab-electron/src/main/app-migration.test.ts",
        "collab-electron/src/main/cli-installer.ts",
      ].includes(file),
  );
  if (unexpectedD.length > 0) {
    return fail(`bucket-D allowlist escaped: ${unexpectedD.join(", ")}`);
  }

  for (const bucket of ["B", "C", "D"] as const) {
    const count = residuals.filter((item) => item.bucket === bucket).length;
    console.log(`product-identity: bucket ${bucket} residuals=${count}`);
  }
  return { ok: true, residuals };
}

function productionDelegation(): Result {
  const index = text("collab-electron/src/main/index.ts");
  if (/^import\s+["']\.\/logger["'];?$/m.test(index)) {
    return fail("logger still initializes by side-effect before app migration");
  }
  const migrationCall = index.search(/\brunAppMigrationBeforeBoot\s*\(\s*\{/);
  const userDataBind = index.search(
    /app\.setPath\s*\(\s*["']userData["']\s*,\s*join\s*\(\s*QF_APP_DIR\s*,\s*["']electron["']\s*\)\s*\)/,
  );
  const configLoad = index.search(/\bloadConfig\s*\(\s*\)/);
  if (migrationCall < 0) return fail("production boot does not call runAppMigrationBeforeBoot");
  if (userDataBind < 0) return fail("production boot does not bind Electron userData to QF_APP_DIR/electron");
  if (configLoad < 0) return fail("production boot config load is not visible to the identity gate");
  if (!(migrationCall < userDataBind && userDataBind < configLoad)) {
    return fail("production boot must migrate, bind userData, then load config in that order");
  }

  const workspace = text("collab-electron/src/main/ipc-workspace.ts");
  const startOffset = workspace.indexOf("export function startAllWorkspaceServices");
  const nextOffset = workspace.indexOf(
    "/**\n * Start workspace services for a single newly-added workspace.",
    startOffset,
  );
  const startAll =
    startOffset >= 0 && nextOffset > startOffset
      ? workspace.slice(startOffset, nextOffset)
      : undefined;
  if (!startAll) return fail("cannot locate configured-workspace boot function");
  const migrate = startAll.indexOf("migrateWorkspaceMetadata(");
  const consumers = [
    "loadWorkspaceConfig(",
    "setThumbnailCacheDir(",
    "watcher.watchWorkspace(",
    "wikilinkIndex.buildIndex(",
  ];
  if (migrate < 0) return fail("configured-workspace boot does not delegate to migrateWorkspaceMetadata");
  for (const consumer of consumers) {
    const offset = startAll.indexOf(consumer);
    if (offset < 0 || migrate > offset) {
      return fail(`configured-workspace migration must precede ${consumer}`);
    }
  }

  for (const rel of [
    "collab-electron/src/main/workspace-config.ts",
    "collab-electron/src/main/image-service.ts",
    "collab-electron/src/main/git-replay.ts",
  ]) {
    if (!text(rel).includes("migrateWorkspaceMetadata(")) {
      return fail(`${rel} does not delegate through migrateWorkspaceMetadata`);
    }
  }
  return { ok: true };
}

function hashTree(root: string): string {
  const hash = createHash("sha256");
  const walk = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = join(dir, entry.name);
      const rel = relative(root, abs).replaceAll("\\", "/");
      hash.update(`${entry.isDirectory() ? "d" : entry.isSymbolicLink() ? "l" : "f"}:${rel}\0`);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile()) hash.update(readFileSync(abs));
    }
  };
  walk(root);
  return hash.digest("hex");
}

function listRelative(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      const rel = relative(root, abs).replaceAll("\\", "/");
      found.push(rel);
      if (entry.isDirectory()) walk(abs);
    }
  };
  walk(root);
  return found.sort();
}

async function migrationMatrix(): Promise<Result> {
  const migrationModule = await import("../../collab-electron/src/main/app-migration.ts");
  const pathsModule = await import("../../collab-electron/src/main/paths.ts");
  const migrateLegacyAppState = migrationModule.migrateLegacyAppState;
  const migrateWorkspaceMetadata = migrationModule.migrateWorkspaceMetadata;
  if (typeof migrateLegacyAppState !== "function" || typeof migrateWorkspaceMetadata !== "function") {
    return fail("production migration exports are missing");
  }
  if (typeof pathsModule.resolveQuantFlowPaths !== "function") {
    return fail("resolveQuantFlowPaths production export is missing");
  }

  const root = join(tmpdir(), `qf-product-identity-${process.pid}-${Date.now()}`);
  const expect = (condition: unknown, message: string): void => {
    if (!condition) throw new Error(message);
  };
  const put = (path: string, value: string): void => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, value);
  };

  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  try {
    const resolved = pathsModule.resolveQuantFlowPaths({
      home: join(root, "linux-home"),
      platform: "linux",
      isDev: true,
      worktreeRoot: join(root, "repo-worktree"),
    });
    expect(
      resolved.appRoot === posix.join(join(root, "linux-home"), ".quantflow", "app"),
      "Linux QF_APP_ROOT is not ~/.quantflow/app",
    );
    expect(
      resolved.appDir.startsWith(posix.join(resolved.appRoot, "dev", "worktree-")),
      "Linux development QF_APP_DIR is not worktree-isolated beneath QF_APP_ROOT",
    );

    const windowsResolved = pathsModule.resolveQuantFlowPaths({
      home: join(root, "windows-home"),
      platform: "win32",
      isDev: true,
      worktreeRoot: join(root, "windows-repo-worktree"),
    });
    expect(
      windowsResolved.appRoot === win32.join(root, "windows-home", ".quantflow", "app"),
      "Windows QF_APP_ROOT is not beneath the injected USERPROFILE home",
    );
    expect(
      windowsResolved.appDir.startsWith(win32.join(windowsResolved.appRoot, "dev", "worktree-")),
      "Windows development QF_APP_DIR is not worktree-isolated beneath QF_APP_ROOT",
    );

    // old-only: persistent app + Electron bytes migrate together, unsafe state
    // is excluded, links are not followed, and both sources remain byte-stable.
    const oldRoot = join(root, "old-only", ".collaborator");
    const oldElectron = join(root, "old-only", "legacy-electron");
    const target = join(root, "old-only", ".quantflow", "app");
    put(join(oldRoot, "config.json"), "legacy-config\n");
    put(join(oldRoot, "nested", "canvas.json"), "canvas-bytes\n");
    put(join(oldRoot, "kernel.db"), "kernel-excluded\n");
    put(join(oldRoot, "kernel.db-wal"), "kernel-wal-excluded\n");
    put(join(oldRoot, "agent-artifacts", "artifact.md"), "artifact-excluded\n");
    put(join(oldRoot, "server.pid"), "pid-excluded\n");
    put(join(oldRoot, "agent.sock"), "socket-excluded\n");
    put(join(oldElectron, "Partitions", "persist", "Cookies"), "cookie-bytes\n");
    put(join(oldElectron, "kernel.db"), "electron-kernel-excluded\n");
    put(join(oldElectron, "server.pid"), "electron-pid-excluded\n");
    put(join(oldElectron, "agent-artifacts", "artifact.md"), "electron-artifact-excluded\n");
    put(join(oldElectron, "socket-path"), "electron-breadcrumb-excluded\n");
    const outside = join(root, "outside-canary.txt");
    put(outside, "do-not-follow\n");
    const outsideLinkSupported = process.platform !== "win32";
    if (outsideLinkSupported) symlinkSync(outside, join(oldRoot, "outside-link"));
    const oldHashBefore = hashTree(oldRoot);
    const electronHashBefore = hashTree(oldElectron);
    const oldOnly = migrateLegacyAppState({
      legacyRoot: oldRoot,
      destinationRoot: target,
      electronUserData: {
        source: oldElectron,
        destinationRelative: "electron",
      },
      stageId: "old-only",
    });
    expect(oldOnly.status === "migrated", "old-only migration did not publish");
    expect(readFileSync(join(target, "config.json"), "utf8") === "legacy-config\n", "app canary changed");
    expect(
      readFileSync(join(target, "electron/Partitions/persist/Cookies"), "utf8") === "cookie-bytes\n",
      "Electron userData canary changed",
    );
    for (const excluded of [
      "kernel.db",
      "kernel.db-wal",
      "agent-artifacts",
      "server.pid",
      "agent.sock",
      ...(outsideLinkSupported ? ["outside-link"] : []),
    ]) {
      expect(!existsSync(join(target, excluded)), `excluded entry migrated: ${excluded}`);
    }
    for (const excluded of [
      "kernel.db",
      "server.pid",
      "agent-artifacts",
      "socket-path",
    ]) {
      expect(
        !existsSync(join(target, "electron", excluded)),
        `excluded Electron entry migrated: ${excluded}`,
      );
    }
    expect(hashTree(oldRoot) === oldHashBefore, "old app source changed during migration");
    expect(hashTree(oldElectron) === electronHashBefore, "old Electron source changed during migration");

    // both-exist: the destination wins byte-for-byte and the old source remains.
    const bothOld = join(root, "both", ".collaborator");
    const bothTarget = join(root, "both", ".quantflow", "app");
    put(join(bothOld, "config.json"), "old-must-not-win\n");
    put(join(bothTarget, "config.json"), "new-wins\n");
    const bothOldHash = hashTree(bothOld);
    const bothTargetHash = hashTree(bothTarget);
    const both = migrateLegacyAppState({
      legacyRoot: bothOld,
      destinationRoot: bothTarget,
      stageId: "both",
    });
    expect(both.status === "destination-exists", "both-exist did not prefer destination");
    expect(hashTree(bothOld) === bothOldHash, "both-exist changed legacy source");
    expect(hashTree(bothTarget) === bothTargetHash, "both-exist changed new destination");

    // injected copy failure: final root remains absent, stage is cleaned, and
    // the same exact production helper succeeds on retry.
    const retryOld = join(root, "retry", ".collaborator");
    const retryTarget = join(root, "retry", ".quantflow", "app");
    put(join(retryOld, "first.txt"), "first\n");
    put(join(retryOld, "fail-canary.txt"), "retry-me\n");
    const retrySourceHash = hashTree(retryOld);
    let injected = false;
    const failingFs = {
      ...migrationModule.nodeMigrationFileSystem,
      copyFile(source: string, destination: string): void {
        if (source.endsWith("fail-canary.txt")) {
          injected = true;
          throw new Error("injected-copy-failure");
        }
        migrationModule.nodeMigrationFileSystem.copyFile(source, destination);
      },
    };
    let observedFailure = false;
    try {
      migrateLegacyAppState({
        legacyRoot: retryOld,
        destinationRoot: retryTarget,
        fs: failingFs,
        stageId: "failure",
      });
    } catch (error) {
      observedFailure = error instanceof Error && error.message === "injected-copy-failure";
    }
    expect(injected && observedFailure, "copy failure injection was not observed");
    expect(!existsSync(retryTarget), "failed migration published a final destination");
    expect(
      !existsSync(join(dirname(retryTarget), ".app.migration-failure")),
      "failed migration left its staging directory",
    );
    expect(hashTree(retryOld) === retrySourceHash, "failed migration changed source bytes");
    const retry = migrateLegacyAppState({
      legacyRoot: retryOld,
      destinationRoot: retryTarget,
      stageId: "retry",
    });
    expect(retry.status === "migrated", "retry did not publish");
    expect(readFileSync(join(retryTarget, "fail-canary.txt"), "utf8") === "retry-me\n", "retry canary changed");

    // Existing workspace state uses the same production helper before boot
    // consumers (the exact call ordering is checked in productionDelegation).
    const workspace = join(root, "existing-workspace");
    const workspaceOld = join(workspace, ".collaborator");
    put(join(workspaceOld, "config.json"), "workspace-config\n");
    put(join(workspaceOld, "thumbnails", "one.png"), "thumbnail\n");
    const workspaceHash = hashTree(workspaceOld);
    const workspaceResult = migrateWorkspaceMetadata({
      workspacePath: workspace,
      stageId: "existing",
    });
    expect(workspaceResult.status === "migrated", "existing workspace did not migrate");
    expect(
      readFileSync(join(workspace, ".quantflow/config.json"), "utf8") === "workspace-config\n",
      "workspace config canary changed",
    );
    expect(hashTree(workspaceOld) === workspaceHash, "workspace source changed");

    console.log(
      `product-identity: migration old-only=${listRelative(target).length} both=preserved failure=absent retry=published workspace=before-consumers`,
    );
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(`migration matrix failed: ${message}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

export async function runProductIdentityGate(): Promise<{ ok: boolean }> {
  for (const check of [sourceIdentity(), classifyResiduals(), productionDelegation()]) {
    if (!check.ok) {
      console.error(`product-identity: ${check.reason}`);
      return { ok: false };
    }
  }
  const migration = await migrationMatrix();
  if (!migration.ok) {
    console.error(`product-identity: ${migration.reason}`);
    return { ok: false };
  }
  console.log("product-identity: source, delegation, migration, and package identity coupled");
  return { ok: true };
}

if (import.meta.main) {
  const { ok } = await runProductIdentityGate();
  process.exit(ok ? 0 : 1);
}
