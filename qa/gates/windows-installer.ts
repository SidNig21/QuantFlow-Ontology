/**
 * R13 installed-artifact door. This is intentionally separate from the
 * unpacked windows-cold-boot gate: it proves the NSIS output the founder opens.
 */
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import {
  collectOwnedPids,
  isolatedEnvironment,
  processSnapshot,
  rpcCall,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
  waitForReady,
} from "./windows-cold-boot.ts";
import { discoverDockProfileManifests } from "../../collab-electron/src/main/dock-profiles.ts";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const COLLAB_ROOT = join(REPO_ROOT, "collab-electron");
const PACKAGE_DEADLINE_MS = 10 * 60 * 1000;
const INSTALLER_TIMEOUT_MS = 2 * 60 * 1000;
const SHUTDOWN_TIMEOUT_MS = 20_000;

type ReleaseStatus = {
  contract?: unknown;
  package?: { name?: unknown; productName?: unknown; version?: unknown };
  build?: { commit_sha?: unknown; packaged_at?: unknown };
  installer?: { name?: unknown; path?: unknown; authenticode?: unknown };
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function tail(value: string, max = 8_000): string {
  return value.length <= max ? value : value.slice(-max);
}

function runChildBounded(
  command: string,
  args: readonly string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  timeoutMs: number,
): Promise<{ code: number; output: string; timedOut: boolean }> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(command, [...args], {
      cwd,
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
    child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
    const timer = setTimeout(async () => {
      if (child.pid !== undefined) await terminateOwnedProcessTree(child.pid);
      resolveResult({ code: 124, output, timedOut: true });
    }, timeoutMs);
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      resolveResult({ code: code ?? 1, output, timedOut: false });
    });
  });
}

function packageManifest(): {
  name: string;
  version: string;
  productName: string;
} {
  const raw = JSON.parse(readFileSync(join(COLLAB_ROOT, "package.json"), "utf8")) as {
    name?: unknown;
    version?: unknown;
    build?: { productName?: unknown };
  };
  assert(typeof raw.name === "string", "package name missing");
  assert(typeof raw.version === "string", "package version missing");
  assert(typeof raw.build?.productName === "string", "build productName missing");
  return { name: raw.name, version: raw.version, productName: raw.build.productName };
}

function currentCommitSha(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
}

function authenticodeStatus(path: string): string {
  const quoted = path.replaceAll("'", "''");
  return execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", `(Get-AuthenticodeSignature -LiteralPath '${quoted}').Status.ToString()`],
    { cwd: REPO_ROOT, encoding: "utf8", windowsHide: true },
  ).trim();
}

function readReleaseStatus(path: string): ReleaseStatus {
  assert(existsSync(path), `RELEASE-STATUS.json missing: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as ReleaseStatus;
}

function assertBuildIdentity(status: ReleaseStatus, manifest: ReturnType<typeof packageManifest>): {
  commitSha: string;
  packagedAt: string;
} {
  assert(status.contract === "qf.windows.release-status.v1", "release status contract mismatch");
  assert(status.package?.name === manifest.name, "release status package name mismatch");
  assert(status.package?.productName === manifest.productName, "release status product name mismatch");
  assert(status.package?.version === manifest.version, "release status package version mismatch");
  const commitSha = status.build?.commit_sha;
  const packagedAt = status.build?.packaged_at;
  assert(typeof commitSha === "string" && /^[0-9a-f]{40}$/.test(commitSha), "release status build SHA is not full-length");
  assert(typeof packagedAt === "string" && new Date(packagedAt).toISOString() === packagedAt, "release status packaging time is not canonical ISO UTC");
  assert(commitSha === currentCommitSha(), `release status SHA ${commitSha} does not equal checkout HEAD`);
  return { commitSha, packagedAt };
}

async function launchInstalledArtifact(
  installRoot: string,
  tempRoot: string,
  expectedIdentity: { commitSha: string; packagedAt: string },
): Promise<void> {
  const executable = join(installRoot, "QuantFlow.exe");
  assert(existsSync(executable), `installed executable missing: ${executable}`);
  const resourcesRoot = join(installRoot, "resources");
  const manifests = discoverDockProfileManifests(resourcesRoot);
  const installedRows = manifests.flatMap((manifest) => manifest.profiles.map((profile) => ({
    id: profile.name,
    role: profile.role,
  })));
  assert(installedRows.some((row) => row.id === "hermes-critic"), "installed production Dock is missing hermes-critic");
  assert(!installedRows.some((row) => /fixture|proof|test|ungranted/i.test(`${row.id} ${row.role}`)), "installed production Dock contains a QA-only identity");

  const stores = join(tempRoot, "stores");
  const kernelDb = join(stores, "kernel.db");
  const artifactRoot = join(stores, "artifacts");
  mkdirSync(artifactRoot, { recursive: true });
  const env = isolatedEnvironment(tempRoot, kernelDb, artifactRoot);
  delete env.QF_DOCK_QA_MODE;
  const endpointFile = join(env.USERPROFILE!, ".quantflow", "app", "socket-path");
  const before = await processSnapshot();
  const child = spawn(executable, ["--disable-gpu"], {
    cwd: installRoot,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  assert(child.pid !== undefined, "installed application did not provide a PID");
  let owned = new Set<number>([child.pid]);
  let shutdownRequested = false;
  try {
    const ready = await waitForReady(child, endpointFile);
    const readiness = ready.readiness as {
      canvas?: unknown;
      dockProfileIds?: unknown[];
      buildIdentity?: { commitSha?: unknown; packagedAt?: unknown };
    };
    assert(readiness.canvas === true, "installed app readiness did not report the shell");
    const ids = readiness.dockProfileIds ?? [];
    assert(ids.includes("hermes-critic"), "installed app readiness omitted hermes-critic");
    assert(!ids.some((id) => typeof id === "string" && /fixture|proof|test|ungranted/i.test(id)), "installed app readiness exposed a QA-only profile");
    const identity = await rpcCall(ready.endpoint, "app.build-identity") as { commitSha?: unknown; packagedAt?: unknown };
    assert(identity.commitSha === expectedIdentity.commitSha, `displayed build SHA mismatch: ${String(identity.commitSha)}`);
    assert(identity.packagedAt === expectedIdentity.packagedAt, `displayed packaging time mismatch: ${String(identity.packagedAt)}`);
    assert(readiness.buildIdentity?.commitSha === expectedIdentity.commitSha, "readiness build SHA mismatch");
    assert(readiness.buildIdentity?.packagedAt === expectedIdentity.packagedAt, "readiness packaging time mismatch");
    assert(existsSync(kernelDb), "installed app did not create the isolated Kernel database");
    const afterReady = await processSnapshot();
    owned = collectOwnedPids(before, afterReady, child.pid, installRoot);
    assert(owned.size > 0, "no process owned by the install was observed");
    console.log(`windows-installer: installed executable=${executable}`);
    console.log(`windows-installer: build-identity=${JSON.stringify({ ...expectedIdentity, displayed: identity })}`);
    console.log(`windows-installer: production-profiles=${JSON.stringify(installedRows)}`);
    const shutdown = await rpcCall(ready.endpoint, "app.shutdown");
    assert((shutdown as { shuttingDown?: unknown }).shuttingDown === true, "installed app shutdown receipt missing");
    shutdownRequested = true;
    const exitCode = await waitForExit(child, SHUTDOWN_TIMEOUT_MS);
    assert(exitCode === 0 || exitCode === null, `installed app exited with code ${String(exitCode)}`);
    const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const lingering = (await processSnapshot()).filter((row) => owned.has(row.pid));
      if (lingering.length === 0) {
        console.log("windows-installer: install-owned processes=0");
        return;
      }
      await wait(250);
    }
    throw new Error("process owned by installed artifact remained after clean shutdown");
  } catch (error) {
    if (child.exitCode === null && child.pid !== undefined) {
      await terminateOwnedProcessTree(child.pid);
    }
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}; ` +
        `shutdownRequested=${shutdownRequested}; installed-app-log=${tail(output)}`,
    );
  }
}

export async function runWindowsInstallerGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-installer: FAIL (native Windows 11 is required)");
    return { ok: false };
  }

  const tempRoot = mkdtempSync(join(tmpdir(), "qf-windows-installer-"));
  const dist = join(COLLAB_ROOT, "dist");
  const manifest = packageManifest();
  try {
    console.log("windows-installer: packaging with a 10-minute deadline");
    const packageResult = await runChildBounded(
      process.execPath,
      ["run", "package:unsigned"],
      COLLAB_ROOT,
      { ...process.env },
      PACKAGE_DEADLINE_MS,
    );
    if (packageResult.timedOut) {
      console.error("windows-installer: packaging timed out after 600000ms; last active phase=package:unsigned");
      console.error(tail(packageResult.output));
      return { ok: false };
    }
    if (packageResult.code !== 0) {
      console.error(`windows-installer: package:unsigned exited ${packageResult.code}`);
      console.error(tail(packageResult.output));
      return { ok: false };
    }

    const installerName = `${manifest.productName} Setup ${manifest.version}.exe`;
    const installers = readdirSync(dist)
      .filter((name) => name === installerName)
      .map((name) => join(dist, name));
    assert(installers.length === 1, `expected exactly one NSIS installer ${installerName}, found ${JSON.stringify(installers)}`);
    const installer = installers[0]!;
    const signature = authenticodeStatus(installer);
    assert(signature === "NotSigned", `installer Authenticode status must be NotSigned, got ${signature}`);
    const statusPath = join(dist, "RELEASE-STATUS.json");
    const status = readReleaseStatus(statusPath);
    const identity = assertBuildIdentity(status, manifest);
    assert(status.installer?.name === installerName, "RELEASE-STATUS installer name mismatch");
    assert(basename(String(status.installer?.path ?? "")) === installerName, "RELEASE-STATUS installer path mismatch");
    assert(status.installer?.authenticode === "NotSigned", "RELEASE-STATUS signing state mismatch");
    console.log(`windows-installer: installer=${installer}`);
    console.log(`windows-installer: Authenticode=${signature}`);
    console.log(`windows-installer: RELEASE-STATUS=${statusPath}`);
    const installRoot = join(tempRoot, "installed");
    mkdirSync(installRoot, { recursive: true });
    const installResult = await runChildBounded(
      installer,
      ["/S", `/D=${installRoot}`],
      tempRoot,
      { ...process.env, TEMP: join(tempRoot, "temp"), TMP: join(tempRoot, "temp") },
      INSTALLER_TIMEOUT_MS,
    );
    assert(!installResult.timedOut, "NSIS silent install timed out");
    assert(installResult.code === 0, `NSIS silent install exited ${installResult.code}: ${tail(installResult.output)}`);
    const installedExecutable = join(installRoot, "QuantFlow.exe");
    assert(existsSync(installedExecutable), `silent install did not produce ${installedExecutable}`);
    console.log(`windows-installer: installed-executable=${installedExecutable}`);
    await launchInstalledArtifact(installRoot, tempRoot, identity);
    console.log("windows-installer: PASS");
    return { ok: true };
  } catch (error) {
    console.error(`windows-installer: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false };
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  process.exit((await runWindowsInstallerGate()).ok ? 0 : 1);
}
