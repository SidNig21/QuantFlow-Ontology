/**
 * WO-WIN1: build and launch the real unpacked Windows application against
 * isolated stores, prove the RPC health/shutdown boundary, and verify that
 * the app-owned process set goes away without touching the operator's state.
 */
import { createHash } from "node:crypto";
import { execFile, spawn, type ChildProcess } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, parse, resolve } from "node:path";
import { createConnection } from "node:net";
import {
  prepareRuntimeStaging,
  QA_RUNTIME_FILES,
} from "../../collab-electron/scripts/package-lib/runtime-staging.ts";
import { discoverDockProfileManifests } from
  "../../collab-electron/src/main/dock-profiles.ts";

export const REPO_ROOT = resolve(join(import.meta.dir, "../.."));
export const COLLAB_ROOT = join(REPO_ROOT, "collab-electron");
export const READY_TIMEOUT_MS = 60_000;
export const RPC_TIMEOUT_MS = 5_000;
export const SHUTDOWN_TIMEOUT_MS = 20_000;
export const POLL_INTERVAL_MS = 250;

type ProcessInfo = {
  pid: number;
  parentPid: number;
  name: string;
  executablePath: string;
  commandLine: string;
};

type TreeSnapshot = {
  state: "absent" | "present";
  entries: number;
  digest: string;
};

type RpcResponse = {
  result?: unknown;
  error?: { message?: unknown };
};

// Cold boot is an explicit QA fixture path; normal product boot is Hermes-only.
const REQUIRED_DOCK_IDS = [
  "qf-toolloop",
  "hermes-orchestrator",
  "hermes-worker",
  "hermes-worker-2",
] as const;

const EVIDENCE_DIR = join(REPO_ROOT, "docs/orders/evidence/wo-win1");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function tail(value: string, max = 4_000): string {
  return value.length <= max ? value : value.slice(-max);
}

function runChild(
  command: string,
  args: readonly string[],
  options: { cwd: string; env: NodeJS.ProcessEnv },
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      env: options.env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.once("error", reject);
    child.once("close", (code) => {
      resolveResult({ code: code ?? 1, stdout, stderr });
    });
  });
}

function packageBin(packageName: string, binName: string): string {
  const packageRoot = join(COLLAB_ROOT, "node_modules", packageName);
  const manifestPath = join(packageRoot, "package.json");
  if (!existsSync(manifestPath)) {
    throw new Error(
      `missing Windows packaging dependency ${packageName}; run bun install in collab-electron`,
    );
  }
  const raw = requirePackageManifest(manifestPath);
  const bin = raw.bin;
  const relativeBin = typeof bin === "string" ? bin : bin?.[binName];
  if (typeof relativeBin !== "string" || relativeBin.length === 0) {
    throw new Error(`package ${packageName} does not declare bin ${binName}`);
  }
  const path = join(packageRoot, relativeBin);
  if (!existsSync(path)) {
    throw new Error(`packaging binary missing: ${path}; run bun install in collab-electron`);
  }
  return path;
}

type PackageManifest = {
  bin?: string | Record<string, string>;
};

function requirePackageManifest(path: string): PackageManifest {
  return JSON.parse(readFileSync(path, "utf8")) as PackageManifest;
}

export function isolatedEnvironment(root: string, kernelDb: string, artifactRoot: string): NodeJS.ProcessEnv {
  const home = join(root, "home");
  const appData = join(home, "AppData", "Roaming");
  const localAppData = join(home, "AppData", "Local");
  const temp = join(root, "temp");
  mkdirSync(appData, { recursive: true });
  mkdirSync(localAppData, { recursive: true });
  mkdirSync(temp, { recursive: true });

  const drive = parse(home).root;
  const homePath = home.slice(drive.length) || "\\";
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    USERPROFILE: home,
    HOME: home,
    HOMEDRIVE: drive,
    HOMEPATH: homePath,
    APPDATA: appData,
    LOCALAPPDATA: localAppData,
    TEMP: temp,
    TMP: temp,
    QF_KERNEL_DB: kernelDb,
    QF_ARTIFACT_ROOT: artifactRoot,
    QF_SKIP_WINDOWS_PATH_UPDATE: "1",
    ELECTRON_ENABLE_LOGGING: "1",
  };
  delete env.ELECTRON_RUN_AS_NODE;
  return env;
}

export function snapshotTree(root: string): TreeSnapshot {
  if (!existsSync(root)) {
    return { state: "absent", entries: 0, digest: "absent" };
  }
  const rows: string[] = [];
  function visit(path: string, relativePath: string): void {
    // An entry Windows cannot stat must still be *recorded*, not skipped, or a
    // file appearing or vanishing under an unreadable name would leave the
    // digest unchanged and the assertion would silently stop detecting change.
    // The concrete case: a WSL symlink (IO_REPARSE_TAG_LX_SYMLINK) created by a
    // seat launcher makes lstat throw EACCES here, which crashed the gate
    // outright — no verdict, and every later release stage skipped.
    // Stated limit: an unreadable entry yields a CONSTANT row, so one mutation
    // is invisible here -- the entry stays unreadable but its contents change.
    // Measured 2026-08-03 on the LX symlink: lstat EACCES, readlink EINVAL,
    // open EACCES. Windows can learn nothing about it without a reparse-point
    // ioctl, so the row cannot carry a target digest.
    // Still detected, because the row text changes: deletion (row vanishes),
    // replacement by a real file or a Windows symlink (lstat then succeeds),
    // and any new entry appearing. Undetected: an LX symlink retargeted while
    // remaining an LX symlink -- which the actor under test cannot do, since a
    // Windows process cannot write an LX reparse tag. Narrow, but not zero:
    // do not read a green digest as proof that unreadable entries are pristine.
    let stats;
    try {
      stats = lstatSync(path);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "UNKNOWN";
      rows.push(`${relativePath}|unreadable:${code}|0|0`);
      return;
    }
    const kind = stats.isDirectory()
      ? "dir"
      : stats.isSymbolicLink()
        ? "link"
        : stats.isFile()
          ? "file"
          : "other";
    rows.push(
      `${relativePath}|${kind}|${stats.size}|${Math.trunc(stats.mtimeMs)}`,
    );
    if (!stats.isDirectory()) return;
    let names: string[];
    try {
      names = readdirSync(path).sort();
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "UNKNOWN";
      rows.push(`${relativePath}|unlistable:${code}|0|0`);
      return;
    }
    for (const name of names) {
      visit(join(path, name), join(relativePath, name));
    }
  }
  visit(root, ".");
  return {
    state: "present",
    entries: rows.length,
    digest: createHash("sha256").update(rows.join("\n"), "utf8").digest("hex"),
  };
}

function runPowerShell(command: string): Promise<string> {
  return new Promise((resolveResult, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", command],
      { windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `Windows process snapshot unavailable: ${error.message}${stderr ? ` (${stderr.trim()})` : ""}`,
            ),
          );
          return;
        }
        resolveResult(stdout);
      },
    );
  });
}

export async function processSnapshot(): Promise<ProcessInfo[]> {
  const command =
    "$ErrorActionPreference='Stop'; " +
    "@(Get-CimInstance Win32_Process | ForEach-Object { " +
    "[pscustomobject]@{ " +
    "pid=[int]$_.ProcessId; " +
    "parentPid=[int]$_.ParentProcessId; " +
    "name=[string]$_.Name; " +
    "executablePath=if ($_.ExecutablePath) {[string]$_.ExecutablePath} else {''}; " +
    "commandLine=if ($_.CommandLine) {[string]$_.CommandLine} else {''} " +
    "} }) | ConvertTo-Json -Compress";
  const raw = (await runPowerShell(command)).trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  return rows.flatMap((value): ProcessInfo[] => {
    if (typeof value !== "object" || value === null) return [];
    const row = value as Record<string, unknown>;
    const pid = Number(row.pid);
    const parentPid = Number(row.parentPid);
    if (!Number.isInteger(pid) || !Number.isInteger(parentPid)) return [];
    return [{
      pid,
      parentPid,
      name: String(row.name ?? ""),
      executablePath: String(row.executablePath ?? ""),
      commandLine: String(row.commandLine ?? ""),
    }];
  });
}

function descendants(snapshot: readonly ProcessInfo[], rootPid: number): Set<number> {
  const children = new Map<number, number[]>();
  for (const row of snapshot) {
    const list = children.get(row.parentPid) ?? [];
    list.push(row.pid);
    children.set(row.parentPid, list);
  }
  const result = new Set<number>([rootPid]);
  const pending = [rootPid];
  while (pending.length > 0) {
    const parent = pending.pop()!;
    for (const child of children.get(parent) ?? []) {
      if (result.has(child)) continue;
      result.add(child);
      pending.push(child);
    }
  }
  return result;
}

function pathMatches(value: string, packageRoot: string): boolean {
  return value.toLowerCase().replaceAll("/", "\\")
    .includes(packageRoot.toLowerCase().replaceAll("/", "\\"));
}

export function collectOwnedPids(
  before: readonly ProcessInfo[],
  after: readonly ProcessInfo[],
  rootPid: number,
  packageRoot: string,
): Set<number> {
  const beforePids = new Set(before.map((row) => row.pid));
  const owned = descendants(after, rootPid);
  for (const row of after) {
    if (
      !beforePids.has(row.pid) &&
      (pathMatches(row.executablePath, packageRoot) ||
        pathMatches(row.commandLine, packageRoot))
    ) {
      owned.add(row.pid);
    }
  }
  return owned;
}

export function rpcCall(
  endpoint: string,
  method: string,
  params: Record<string, unknown> = {},
  timeoutMs = RPC_TIMEOUT_MS,
): Promise<unknown> {
  return new Promise((resolveResult, reject) => {
    const socket = createConnection(endpoint);
    const id = `${method}-${Date.now()}`;
    let buffer = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(new Error(`RPC timeout: ${method}`));
    }, timeoutMs);
    const finish = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback();
    };
    socket.once("connect", () => {
      socket.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      const line = buffer.slice(0, newline);
      finish(() => {
        socket.destroy();
        let response: RpcResponse;
        try {
          response = JSON.parse(line) as RpcResponse;
        } catch {
          reject(new Error(`invalid JSON-RPC response for ${method}`));
          return;
        }
        if (response.error) {
          reject(new Error(String(response.error.message ?? `RPC error: ${method}`)));
          return;
        }
        resolveResult(response.result);
      });
    });
    socket.once("error", (error) => {
      finish(() => reject(new Error(`RPC ${method} failed: ${error.message}`)));
    });
    socket.once("close", () => {
      finish(() => reject(new Error(`RPC ${method} connection closed`)));
    });
  });
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolveResult) => setTimeout(resolveResult, ms));
}

export async function waitForExit(child: ChildProcess, timeoutMs: number): Promise<number | null> {
  if (child.exitCode !== null) return child.exitCode;
  return new Promise((resolveResult, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`application did not exit within ${timeoutMs}ms`)),
      timeoutMs,
    );
    child.once("close", (code) => {
      clearTimeout(timer);
      resolveResult(code);
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

export async function waitForReady(
  child: ChildProcess,
  endpointFile: string,
): Promise<{ endpoint: string; ping: unknown; discovery: unknown; readiness: unknown }> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let lastError = "socket-path not written";
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`application exited before readiness: ${lastError}`);
    }
    if (existsSync(endpointFile)) {
      const endpoint = Bun.file(endpointFile).text().then((value) => value.trim());
      const resolvedEndpoint = await endpoint;
      if (resolvedEndpoint) {
        try {
          const ping = await rpcCall(resolvedEndpoint, "ping");
          const discovery = await rpcCall(resolvedEndpoint, "rpc.discover");
          const readiness = await rpcCall(resolvedEndpoint, "app.readiness");
          if (
            typeof readiness !== "object" || readiness === null ||
            (readiness as Record<string, unknown>).canvas !== true
          ) {
            lastError = "QuantFlow shell/canvas is not loaded";
            await wait(POLL_INTERVAL_MS);
            continue;
          }
          return { endpoint: resolvedEndpoint, ping, discovery, readiness };
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
        }
      }
    }
    await wait(POLL_INTERVAL_MS);
  }
  throw new Error(`application readiness timeout: ${lastError}`);
}

export async function terminateOwnedProcessTree(pid: number): Promise<void> {
  await new Promise<void>((resolveResult) => {
    execFile(
      "taskkill.exe",
      ["/PID", String(pid), "/T", "/F"],
      { windowsHide: true },
      () => resolveResult(),
    );
  });
}

function assertPing(ping: unknown): void {
  assert(
    typeof ping === "object" && ping !== null &&
      (ping as Record<string, unknown>).pong === true,
    "packaged app ping did not return {pong:true}",
  );
}

function assertDiscovery(discovery: unknown): void {
  assert(
    typeof discovery === "object" && discovery !== null &&
      Array.isArray((discovery as Record<string, unknown>).methods),
    "packaged app rpc.discover did not return methods",
  );
  const methods = (discovery as { methods: unknown[] }).methods;
  for (const method of ["ping", "app.readiness", "app.shutdown"]) {
    assert(
      methods.some((entry) =>
        typeof entry === "object" && entry !== null &&
        (entry as Record<string, unknown>).name === method,
      ),
      `packaged app did not advertise ${method}`,
    );
  }
}

function assertReadiness(readiness: unknown): string[] {
  assert(
    typeof readiness === "object" && readiness !== null &&
      (readiness as Record<string, unknown>).canvas === true &&
      Array.isArray((readiness as Record<string, unknown>).dockProfileIds),
    "packaged app did not report a loaded canvas and Dock inventory",
  );
  const ids = (readiness as { dockProfileIds: unknown[] }).dockProfileIds;
  const profileIds = ids.filter((id): id is string => typeof id === "string");
  for (const required of REQUIRED_DOCK_IDS) {
    assert(profileIds.includes(required), `Kernel-backed Dock profile missing: ${required}`);
  }
  return profileIds;
}

function assertShutdownReceipt(value: unknown): void {
  assert(
    typeof value === "object" && value !== null &&
      (value as Record<string, unknown>).shuttingDown === true,
    "packaged app shutdown did not return {shuttingDown:true}",
  );
}

export async function buildWindowsPackage(tempRoot: string): Promise<string> {
  const outputRoot = join(tempRoot, "dist");
  const buildEnv: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_OPTIONS: process.env.NODE_OPTIONS?.includes("--max-old-space-size")
      ? process.env.NODE_OPTIONS
      : `${process.env.NODE_OPTIONS ?? ""} --max-old-space-size=8192`.trim(),
  };
  console.log("windows-cold-boot: preparing runtime staging");
  prepareRuntimeStaging({
    stagingRoot: join(COLLAB_ROOT, ".package-staging"),
    repoRoot: REPO_ROOT,
  }, { qaMode: true });

  const electronVite = packageBin("electron-vite", "electron-vite");
  const electronBuilder = packageBin("electron-builder", "electron-builder");
  console.log("windows-cold-boot: building Electron bundle");
  const build = await runChild(
    process.execPath,
    [electronVite, "build"],
    { cwd: COLLAB_ROOT, env: buildEnv },
  );
  if (build.code !== 0) {
    throw new Error(`electron-vite build failed (${build.code})\n${tail(build.stderr || build.stdout)}`);
  }

  console.log("windows-cold-boot: creating unpacked Windows package");
  const packageResult = await runChild(
    process.execPath,
    [
      electronBuilder,
      "--dir",
      "--win",
      "--x64",
      "--config.npmRebuild=false",
      "-c.win.signAndEditExecutable=false",
      "--publish",
      "never",
      `-c.directories.output=${outputRoot}`,
      "-c.afterPack=scripts/after-pack-pty.cjs",
    ],
    { cwd: COLLAB_ROOT, env: buildEnv },
  );
  if (packageResult.code !== 0) {
    throw new Error(
      `electron-builder Windows unpacked package failed (${packageResult.code})\n${tail(packageResult.stderr || packageResult.stdout)}`,
    );
  }
  const packageRoot = join(outputRoot, "win-unpacked");
  const executable = join(packageRoot, "QuantFlow.exe");
  assert(existsSync(executable), `unpacked Windows executable missing: ${executable}`);
  const resourcesRoot = join(packageRoot, "resources");
  assert(existsSync(join(resourcesRoot, "app.asar")), "unpacked Windows app.asar missing");
  for (const relativePath of QA_RUNTIME_FILES) {
    const path = join(resourcesRoot, relativePath);
    assert(existsSync(path) && statSync(path).size > 0, `Windows runtime resource missing or empty: ${relativePath}`);
  }
  const expectedManifests = discoverDockProfileManifests(
    join(COLLAB_ROOT, ".package-staging"),
    { qaMode: true },
  );
  const packagedManifests = discoverDockProfileManifests(resourcesRoot, {
    qaMode: true,
  });
  const expectedClosure = expectedManifests.map((manifest) => ({
    ref: manifest.manifestRef,
    adapterId: manifest.adapterId,
    profiles: manifest.profiles.map((profile) => profile.name),
  }));
  const packagedClosure = packagedManifests.map((manifest) => ({
    ref: manifest.manifestRef,
    adapterId: manifest.adapterId,
    profiles: manifest.profiles.map((profile) => profile.name),
  }));
  assert(
    JSON.stringify(packagedClosure) === JSON.stringify(expectedClosure),
    `packaged Dock manifest closure differs from deploy-true source closure: expected=${JSON.stringify(expectedClosure)} actual=${JSON.stringify(packagedClosure)}`,
  );
  return packageRoot;
}

async function launchAndProbe(packageRoot: string, tempRoot: string): Promise<void> {
  const storeRoot = join(tempRoot, "stores");
  const kernelDb = join(storeRoot, "kernel.db");
  const artifactRoot = join(storeRoot, "artifacts");
  mkdirSync(storeRoot, { recursive: true });
  mkdirSync(artifactRoot, { recursive: true });
  const childEnv = isolatedEnvironment(tempRoot, kernelDb, artifactRoot);
  childEnv.QF_DOCK_QA_MODE = "1";
  const endpointFile = join(childEnv.USERPROFILE!, ".quantflow", "app", "socket-path");
  const defaultStateRoot = join(homedir(), ".quantflow");
  const defaultBefore = snapshotTree(defaultStateRoot);
  const beforeProcesses = await processSnapshot();
  const executable = join(packageRoot, "QuantFlow.exe");
  const child = spawn(executable, ["--disable-gpu"], {
    cwd: packageRoot,
    env: childEnv,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
  const exitPromise = new Promise<number | null>((resolveResult, reject) => {
    child.once("close", (code) => resolveResult(code));
    child.once("error", reject);
  });
  let ownedPids = new Set<number>([child.pid ?? -1]);
  let cleanShutdownRequested = false;
  try {
    assert(child.pid !== undefined, "Windows application process did not provide a PID");
    const ready = await waitForReady(child, endpointFile);
    assertPing(ready.ping);
    assertDiscovery(ready.discovery);
    const profileIds = assertReadiness(ready.readiness);
    assert(existsSync(kernelDb), "isolated Kernel database was not created");
    assert(existsSync(artifactRoot) && statSync(artifactRoot).isDirectory(), "isolated Artifact root is not present");
    const afterReadyProcesses = await processSnapshot();
    ownedPids = collectOwnedPids(beforeProcesses, afterReadyProcesses, child.pid, packageRoot);
    assert(ownedPids.size > 0, "no app-owned Windows processes were observed after readiness");

    console.log(`windows-cold-boot: canvas/Dock ready; profiles=${JSON.stringify(profileIds)} owned-processes=${ownedPids.size}`);
    console.log(`windows-cold-boot: readiness-receipt=${JSON.stringify({ readiness: ready.readiness, profileIds, kernelDb, artifactRoot })}`);
    const shutdown = await rpcCall(ready.endpoint, "app.shutdown");
    assertShutdownReceipt(shutdown);
    cleanShutdownRequested = true;
    const exitCode = await waitForExit(child, SHUTDOWN_TIMEOUT_MS);
    assert(exitCode === 0 || exitCode === null, `packaged app exited with code ${String(exitCode)}`);

    const deadline = Date.now() + SHUTDOWN_TIMEOUT_MS;
    let lingering: ProcessInfo[] = [];
    while (Date.now() < deadline) {
      lingering = (await processSnapshot()).filter((row) => ownedPids.has(row.pid));
      if (lingering.length === 0) break;
      await wait(POLL_INTERVAL_MS);
    }
    assert(
      lingering.length === 0,
      `app-owned Windows processes remained after shutdown: ${lingering.map((row) => `${row.name}:${row.pid}`).join(", ")}`,
    );
    assert(!existsSync(endpointFile), "JSON-RPC socket breadcrumb remained after shutdown");
    const defaultAfter = snapshotTree(defaultStateRoot);
    assert(
      JSON.stringify(defaultBefore) === JSON.stringify(defaultAfter),
      `default user state changed (before=${defaultBefore.digest}, after=${defaultAfter.digest})`,
    );
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    writeFileSync(
      join(EVIDENCE_DIR, "windows-cold-boot-latest.json"),
      JSON.stringify({
        platform: process.platform,
        packageRoot,
        kernelDb,
        artifactRoot,
        readiness: ready.readiness,
        dockProfileIds: profileIds,
        screenshot: "external Computer Use capture required",
        defaultUserStateUnchanged: true,
        shutdown: "rpc app.shutdown; exit code 0; owned process set empty",
        recordedAt: new Date().toISOString(),
      }, null, 2) + "\n",
      "utf8",
    );
    writeFileSync(join(tempRoot, "packaged-app.log"), output, "utf8");
    console.log(
      `windows-cold-boot: isolated kernel=${existsSync(kernelDb)} artifact-root=${existsSync(artifactRoot)} default-user-state-unchanged=true`,
    );
    console.log("windows-cold-boot: clean shutdown requested and all app-owned processes exited");
  } catch (error) {
    writeFileSync(join(tempRoot, "packaged-app.log"), output, "utf8");
    if (child.exitCode === null && child.pid !== undefined) {
      await terminateOwnedProcessTree(child.pid);
      await exitPromise.catch(() => null);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${message}\npackaged app log: ${join(tempRoot, "packaged-app.log")}\nshutdown requested: ${cleanShutdownRequested}`,
    );
  }
}

export async function runWindowsColdBootGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") {
    console.error("windows-cold-boot: FAIL (native Windows 11 is required; Linux/WSL is not acceptance evidence)");
    return { ok: false };
  }

  const falsify = process.env.QF_WINDOWS_COLD_BOOT_FALSIFY?.trim();
  if (falsify !== undefined && falsify !== "missing-runtime") {
    console.error(`windows-cold-boot: unknown falsifier ${falsify}`);
    return { ok: false };
  }

  const tempRoot = mkdtempSync(join(tmpdir(), "qf-windows-cold-boot-"));
  const receiptPath = join(EVIDENCE_DIR, "windows-cold-boot-latest.json");
  const priorReceipt = existsSync(receiptPath) ? readFileSync(receiptPath) : null;
  try {
    const packageRoot = await buildWindowsPackage(tempRoot);
    if (falsify === "missing-runtime") {
      const bait = join(packageRoot, "resources", "species", "hermes", "dock-profiles.json");
      rmSync(bait);
      console.log("windows-cold-boot: BAIT removed species/hermes/dock-profiles.json");
    }
    await launchAndProbe(packageRoot, tempRoot);
    if (falsify === "missing-runtime") {
      console.error("windows-cold-boot: bait expected the packaged app to fail readiness");
      return { ok: false };
    }
    console.log("windows-cold-boot: PASS");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`windows-cold-boot: FAIL ${message}`);
    if (falsify === "missing-runtime") {
      console.error("windows-cold-boot: BAIT RED (missing runtime resource blocked readiness)");
    }
    return { ok: false };
  } finally {
    if (priorReceipt === null) {
      if (existsSync(receiptPath)) rmSync(receiptPath, { force: true });
    } else {
      writeFileSync(receiptPath, priorReceipt);
    }
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const { ok } = await runWindowsColdBootGate();
  process.exit(ok ? 0 : 1);
}
