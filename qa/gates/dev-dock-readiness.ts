import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import {
  discoverDockProfileManifests,
  type DockProfileManifest,
} from "../../collab-electron/src/main/dock-profiles.ts";
import { resolveRuntimeAdapterMetadata } from "../../collab-electron/src/main/runtime-adapter.ts";

const REPO = resolve(import.meta.dir, "../..");
const COLLAB = join(REPO, "collab-electron");
const HERMES_PACKAGE_REF = "species/hermes/packed/hermes.aospkg";
const HERMES_META = join(REPO, "species/hermes/packed/hermes.meta.json");
const PRODUCTION_ASSETS = [
  "species/hermes/dock-profiles.json",
  HERMES_PACKAGE_REF,
  "species/hermes/packed/hermes.meta.json",
  "species/claude-code/dock-profiles.json",
  "species/claude-code/packed/claude-code.aospkg",
  "species/claude-code/packed/claude-code.meta.json",
  "species/claude-code/packed/claude-code.mjs",
] as const;
const HERMES_PACK_INPUTS = [
  "species/hermes/launch.json",
  "species/hermes/tools-allowlist.json",
  "species/hermes/scripts/pack-agent.mjs",
] as const;

type AppRpcResponse = { result?: unknown; error?: { message?: string } };
type DevRun = {
  child: ReturnType<typeof Bun.spawn>;
  done: Promise<number>;
  output: string[];
  pidFile: string;
};

const HARD_TIMEOUT_MS = 120_000;
let activeDevRun: DevRun | null = null;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function stopProcess(pid: number): void {
  if (!processAlive(pid)) return;
  if (process.platform === "win32") {
    execFileSync("taskkill.exe", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
  } else {
    process.kill(pid, "SIGTERM");
  }
}

function stopActiveDevRun(): void {
  if (!activeDevRun) return;
  try {
    stopProcess(activeDevRun.child.pid);
  } catch {
    // The watchdog is best-effort; the child may already have exited.
  }
}

async function waitFor(
  label: string,
  check: () => Promise<boolean>,
  timeoutMs = 45_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(100);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError}` : ""}`);
}

class AppRpc {
  constructor(private readonly endpoint: string) {}

  async send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return new Promise((resolvePromise, reject) => {
      const socket = connect(this.endpoint);
      let buffer = "";
      socket.once("error", reject);
      socket.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
        const newline = buffer.indexOf("\n");
        if (newline < 0) return;
        const response = JSON.parse(buffer.slice(0, newline)) as AppRpcResponse;
        socket.destroy();
        if (response.error) reject(new Error(response.error.message ?? "app RPC failed"));
        else resolvePromise(response.result);
      });
      socket.once("connect", () => {
        socket.write(JSON.stringify({ jsonrpc: "2.0", id: `${method}-${Date.now()}`, method, params }) + "\n");
      });
    });
  }

  async evaluate<T>(expression: string): Promise<T> {
    const raw = await this.send("app.ui.evaluate", { expression }) as {
      exceptionDetails?: { exception?: { description?: string } };
    };
    if (raw?.exceptionDetails) {
      throw new Error(raw.exceptionDetails.exception?.description ?? "renderer evaluation failed");
    }
    return raw as T;
  }
}

async function consume(stream: ReadableStream<Uint8Array> | null, output: string[]): Promise<void> {
  if (!stream) return;
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) return;
    const text = decoder.decode(chunk.value, { stream: true });
    output.push(text);
    process.stdout.write(text);
  }
}

function cleanEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => ![
      "QF_UI_PROOF_RESOURCE_ROOT",
      "QF_DEV_HERMES_PACK_SCRIPT",
      "QF_DEV_CLAUDE_CODE_PACK_SCRIPT",
      "QF_DEV_DOCK_READINESS_MARKER",
      "QF_DOCK_QA_MODE",
      "QF_UI_PROOF_FAIL_DEFINITION",
      "QF_UI_PROOF_DELAY_SPAWN_MS",
    ].includes(key)),
  );
}

function baseEnvironment(root: string): NodeJS.ProcessEnv {
  const appRoot = join(root, "app-root");
  mkdirSync(join(appRoot, "artifacts"), { recursive: true });
  return {
    ...cleanEnvironment(),
    QF_UI_PROOF: "1",
    QF_UI_PROOF_RESOURCE_ROOT: REPO,
    QF_APP_ROOT: appRoot,
    QF_APP_DIR: join(appRoot, "app"),
    QF_KERNEL_DB: join(appRoot, "kernel.db"),
    QF_PEER_BUS_DB: join(appRoot, "peer-bus.db"),
    QF_ARTIFACT_ROOT: join(appRoot, "artifacts"),
  };
}

function runPublicDev(env: NodeJS.ProcessEnv, root: string): DevRun {
  const pidFile = join(root, "electron.pid");
  rmSync(pidFile, { force: true });
  const output: string[] = [];
  const child = Bun.spawn(["bun", "run", "dev"], {
    cwd: COLLAB,
    env: { ...env, QF_DEV_ELECTRON_PID_FILE: pidFile },
    stdout: "pipe",
    stderr: "pipe",
  });
  const done = Promise.all([
    consume(child.stdout, output),
    consume(child.stderr, output),
    child.exited,
  ]).then(() => child.exitCode ?? 1);
  return { child, done, output, pidFile };
}

function copyProductionAssets(root: string): void {
  for (const relativePath of PRODUCTION_ASSETS) {
    const source = join(REPO, relativePath);
    const destination = join(root, relativePath);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
  }
}

function assertNativeProductionProfiles(root: string): DockProfileManifest[] {
  const manifests = discoverDockProfileManifests(root);
  const hermes = manifests.find((manifest) => manifest.manifestRef === "species/hermes/dock-profiles.json");
  assert(hermes, "Hermes production manifest was not discovered");
  const resolved = resolveRuntimeAdapterMetadata(hermes.packageRef, root);
  assert(
    resolved.metadata.route === "native_tui",
    `native-TUI production profile rejected route=${resolved.metadata.route}`,
  );
  return manifests;
}

function assertRegularNonEmpty(path: string): void {
  assert(existsSync(path) && lstatSync(path).isFile(), `missing tracked adapter asset: ${path}`);
  assert(statSync(path).size > 0, `empty tracked adapter asset: ${path}`);
}

function repoStatus(): string {
  return execFileSync("git", ["status", "--porcelain=v1"], {
    cwd: REPO,
    encoding: "utf8",
  });
}

async function proveHermesPackReproduction(root: string): Promise<void> {
  const proofRoot = mkdtempSync(join(root, "hermes-pack-"));
  try {
    for (const relativePath of HERMES_PACK_INPUTS) {
      const destination = join(proofRoot, relativePath);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(join(REPO, relativePath), destination);
    }
    const script = join(proofRoot, "species/hermes/scripts/pack-agent.mjs");
    const source = readFileSync(script, "utf8");
    assert(
      !/child_process|Bun\.spawn|\bnpm\b|agentos/i.test(source),
      "Hermes pack script contains a forbidden process or package seam",
    );
    const imports = [
      ...source.matchAll(/\bimport\s+(?:(?:[\s\S]*?)\sfrom\s+)?["']([^"']+)["']/g),
      ...source.matchAll(/\bexport\s+[\s\S]*?\sfrom\s+["']([^"']+)["']/g),
    ].map((match) => match[1]).filter((specifier): specifier is string => Boolean(specifier));
    assert(
      imports.every((specifier) => specifier.startsWith("node:")),
      `Hermes pack script imports a non-node package: ${imports.join(", ")}`,
    );
    for (const relativePath of ["species/hermes/package.json", "species/hermes/bun.lock"]) {
      const packageSource = readFileSync(join(REPO, relativePath), "utf8");
      assert(
        !packageSource.includes("@rivet-dev/agentos-core") &&
          !packageSource.includes("@rivet-dev/agentos-toolchain"),
        `removed Hermes AgentOS dependency remains in ${relativePath}`,
      );
    }
    for (const relativePath of ["collab-electron/scripts/dev.mjs", "collab-electron/scripts/dev.ps1"]) {
      const startupSource = readFileSync(join(REPO, relativePath), "utf8");
      assert(
        !/npm|agentos|pack-agent|\.package-staging/i.test(startupSource),
        `ordinary development startup contains a forbidden packaging seam: ${relativePath}`,
      );
    }
    const markerBytes = readFileSync(join(REPO, HERMES_PACKAGE_REF));
    assert(
      markerBytes.equals(Buffer.from("QuantFlow Hermes native-TUI adapter\n", "utf8")),
      "tracked Hermes marker bytes are not the native-TUI identity marker",
    );
    const child = Bun.spawn(["node", script], { cwd: proofRoot, stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exitCode] = await Promise.all([
      child.stdout ? new Response(child.stdout).text() : Promise.resolve(""),
      child.stderr ? new Response(child.stderr).text() : Promise.resolve(""),
      child.exited,
    ]);
    assert(exitCode === 0, `copied Hermes pack script failed: ${stdout}${stderr}`);
    const generatedMarker = readFileSync(join(proofRoot, HERMES_PACKAGE_REF));
    const generatedMeta = readFileSync(join(proofRoot, "species/hermes/packed/hermes.meta.json"));
    assert(Buffer.from(generatedMarker).equals(Buffer.from(readFileSync(join(REPO, HERMES_PACKAGE_REF)))), "Hermes marker bytes differ from tracked asset");
    assert(Buffer.from(generatedMeta).equals(Buffer.from(readFileSync(HERMES_META))), "Hermes metadata bytes differ from tracked asset");
    console.log("hermes_pack_reproduction=byte_exact");
  } finally {
    rmSync(proofRoot, { recursive: true, force: true });
  }
}

async function proveRedCases(root: string): Promise<void> {
  const resourceRoot = mkdtempSync(join(root, "resource-red-"));
  try {
    copyProductionAssets(resourceRoot);
    const marker = join(resourceRoot, HERMES_PACKAGE_REF);
    rmSync(marker, { force: true });
    let missingReason = "";
    try {
      discoverDockProfileManifests(resourceRoot);
    } catch (error) {
      missingReason = error instanceof Error ? error.message : String(error);
    }
    assert(missingReason.includes("Dock profile runtime package missing"), `missing-marker falsifier reason changed: ${missingReason}`);
    assert(missingReason.includes(marker), `missing-marker falsifier path missing: ${missingReason}`);
    console.log(`falsifier=missing-hermes-marker discovery=red hermes_definitions=0 reason=${missingReason}`);

    copyFileSync(join(REPO, HERMES_PACKAGE_REF), marker);
    const metadataPath = join(resourceRoot, "species/hermes/packed/hermes.meta.json");
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as Record<string, unknown>;
    metadata.route = "agentos";
    writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
    let routeReason = "";
    try {
      assertNativeProductionProfiles(resourceRoot);
    } catch (error) {
      routeReason = error instanceof Error ? error.message : String(error);
    }
    assert(
      routeReason.includes("peer_delivery requires route=native_tui") ||
        routeReason.includes("native-TUI production profile rejected route=agentos"),
      `route falsifier reason changed: ${routeReason}`,
    );
    console.log(`falsifier=hermes-agentos-route discovery=red hermes_definitions=0 reason=${routeReason}`);

    copyFileSync(HERMES_META, metadataPath);
    assertNativeProductionProfiles(resourceRoot);
  } finally {
    rmSync(resourceRoot, { recursive: true, force: true });
  }
}

async function waitForProductionDock(root: string, pidFile: string): Promise<number> {
  const socketPathFile = join(root, "app-root", "socket-path");
  let electronPid = 0;
  await waitFor("real Electron process and production Dock", async () => {
    if (!existsSync(pidFile)) return false;
    electronPid = Number(readFileSync(pidFile, "utf8").trim());
    assert(Number.isInteger(electronPid) && electronPid > 0 && processAlive(electronPid), `Electron process ${electronPid} is not alive`);
    if (!existsSync(socketPathFile)) return false;
    const app = new AppRpc(readFileSync(socketPathFile, "utf8").trim());
    const readiness = await app.send("app.readiness") as { canvas?: boolean; dockProfileIds?: string[] };
    if (readiness.canvas !== true) return false;
    const ids = readiness.dockProfileIds ?? [];
    assert(ids.filter((id) => id === "hermes-orchestrator").length === 1, "Hermes Orchestrator definition count is not exactly one");
    assert(ids.filter((id) => id === "hermes-worker").length === 1, "Hermes Market Researcher definition count is not exactly one");
    const ui = await app.evaluate<{ ok: boolean; definitions: Array<{ id?: string; availability?: { available?: boolean } }> }>("window.shellApi.qf.listDefinitions()");
    const orchestrators = ui.definitions.filter((row) => row.id === "hermes-orchestrator");
    const workers = ui.definitions.filter((row) => row.id === "hermes-worker");
    assert(ui.ok && orchestrators.length === 1 && workers.length === 1, "Hermes Dock definitions are not exact");
    assert(orchestrators[0]!.availability?.available === true, "Hermes Orchestrator is unavailable");
    assert(workers[0]!.availability?.available === true, "Hermes Market Researcher is unavailable");
    const cards = await app.evaluate<{ orchestrator: number; worker: number }>(`(() => {
      const ready = (definitionId) => [...document.querySelectorAll(
        '#dock-species-list .lrow[role="button"][data-definition-id="' + definitionId + '"]',
      )].filter((row) => !row.classList.contains('lrow-unavailable') && row.querySelector('.dock-adapter')?.textContent?.startsWith('Hermes'));
      return {
        orchestrator: ready('hermes-orchestrator').length,
        worker: ready('hermes-worker').length,
      };
    })()`);
    assert(cards.orchestrator === 1 && cards.worker === 1, "Hermes Dock launch cards are not exact and launchable");
    return true;
  });
  return electronPid;
}

async function proveGreen(root: string): Promise<void> {
  for (const relativePath of PRODUCTION_ASSETS) assertRegularNonEmpty(join(REPO, relativePath));
  const hermesProfiles = assertNativeProductionProfiles(REPO);
  assert(hermesProfiles.some((manifest) => manifest.profiles.some((profile) => profile.name === "hermes-orchestrator")), "Hermes Orchestrator profile missing");
  assert(hermesProfiles.some((manifest) => manifest.profiles.some((profile) => profile.name === "hermes-worker")), "Hermes worker profile missing");

  const run = runPublicDev(baseEnvironment(root), root);
  activeDevRun = run;
  try {
    const electronPid = await waitForProductionDock(root, run.pidFile);
    assert(processAlive(electronPid), `Electron process ${electronPid} is not alive after Dock proof`);
    const socketPath = readFileSync(join(root, "app-root", "socket-path"), "utf8").trim();
    await new AppRpc(socketPath).send("app.shutdown");
    const exitCode = await run.done;
    assert(exitCode === 0, `public bun run dev exited with ${exitCode}`);
    console.log("development_root=repository");
    console.log("hermes_adapter=tracked_native_tui");
    console.log("claude_code_adapter=tracked_native_tui");
    console.log("agentos_packaging_used=false");
    console.log("electron_process_started=true");
    console.log("hermes_orchestrator_launchable=true");
    console.log("hermes_worker_definition_launchable=true");
  } finally {
    activeDevRun = null;
    try {
      stopProcess(run.child.pid);
    } catch {
      // The public dev process may already have exited after the proof.
    }
  }
}

export async function runDevDockReadinessGate(): Promise<{ ok: boolean }> {
  const startedAt = performance.now();
  let timedOut = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      stopActiveDevRun();
      reject(new Error(`dev-dock-readiness exceeded ${HARD_TIMEOUT_MS}ms`));
    }, HARD_TIMEOUT_MS);
  });
  const baseline = repoStatus();
  const root = mkdtempSync(join(tmpdir(), "qf-dev-dock-readiness-"));
  const work = (async () => {
    await proveHermesPackReproduction(root);
    await proveRedCases(root);
    await proveGreen(root);
    assert(repoStatus() === baseline, "repository artifacts mutated during dev-dock-readiness");
  })();
  try {
    await Promise.race([work, timeout]);
    console.log("repository_artifacts_mutated=false");
    console.log(`elapsed_ms=${Math.round(performance.now() - startedAt)}`);
    console.log("PASS dev-dock-readiness");
    return { ok: true };
  } catch (error) {
    console.error(
      `dev-dock-readiness: FAIL ${error instanceof Error ? error.message : String(error)}`,
    );
    if (timedOut) console.error(`elapsed_ms=${HARD_TIMEOUT_MS}`);
    return { ok: false };
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    stopActiveDevRun();
    rmSync(root, { recursive: true, force: true });
  }
}

if (import.meta.main) process.exit((await runDevDockReadinessGate()).ok ? 0 : 1);
