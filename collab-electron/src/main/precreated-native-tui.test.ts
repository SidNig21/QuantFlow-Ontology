import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, mock, test } from "bun:test";
import type { NativeTuiLive } from "./native-tui-orchestration";
import { UnsupportedRuntimeRouteError } from "./runtime-route-dispatch";

const kernelObjects = new Map<string, Record<string, unknown>>();
const kernelLinks = new Map<string, Array<{ from_id: string; to_id: string }>>();
let kernelMutations = 0;
let runtimeCallbacks = 0;

mock.module("./kernel", () => ({
  getArtifactRoot: () => "",
  kernelExecute: () => {
    kernelMutations += 1;
    return {};
  },
  kernelGetLinks: (id: string, options?: { kind?: string }) =>
    kernelLinks.get(id + ":" + (options?.kind ?? "")) ?? [],
  kernelGetObject: (type: string, id: string) =>
    kernelObjects.get(type + ":" + id) ?? null,
  kernelListAgentSessions: () => [],
  kernelListTaskAssignments: () => [],
}));

mock.module("./host-native-tui", () => ({
  admitNativeTuiDefinition: async () => {
    runtimeCallbacks += 1;
    throw new Error("native_tui callback must not run for an unsupported route");
  },
  cancelNativeTuiSession: async () => {},
  installNativeTuiPtyExitHook: () => {},
  tearDownNativeTui: async () => {},
}));

mock.module("./host-acp-bridge", () => ({
  admitHostAcp: async () => {
    runtimeCallbacks += 1;
    throw new Error("host_acp callback must not run for an unsupported route");
  },
  cancelHostAcp: async () => {},
  resolveHostAcpCommand: () => "unreachable",
  tearDownHostAcp: async () => {},
}));

mock.module("electron", () => ({
  app: { getPath: () => "", isPackaged: false },
  BrowserWindow: { getAllWindows: () => [] },
  webContents: { fromId: () => null },
  ipcMain: { handle: () => {}, on: () => {}, removeHandler: () => {} },
  utilityProcess: {},
  powerMonitor: {},
  shell: {},
  dialog: {},
  Menu: {},
  nativeTheme: {},
  net: {},
  protocol: {},
  screen: {},
  session: {},
}));

function writeRouteFixture(root: string, route: string): string {
  const packageRef = "tools/golden-g4-precreated/packed/" + route + ".aospkg";
  const packageDir = join(root, "tools/golden-g4-precreated/packed");
  mkdirSync(packageDir, { recursive: true });
  writeFileSync(join(root, packageRef), "fixture-" + route + "\n");
  writeFileSync(
    join(root, "tools/golden-g4-precreated/packed/" + route + ".meta.json"),
    JSON.stringify({
      name: "golden-g4-" + route,
      route,
      package: route + ".aospkg",
      command: null,
      entrypoint: null,
      terminal_target: null,
      argv: [],
      tools: [],
    }),
  );
  return packageRef;
}

async function assertProductionPathRefuses(route: string): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), "qf-g4-precreated-route-"));
  const definitionId = "g4-precreated-" + route;
  const sessionId = "g4-precreated-session-" + route;
  const callerSessionId = "g4-precreated-caller";
  const packageRef = writeRouteFixture(root, route);
  kernelMutations = 0;
  runtimeCallbacks = 0;
  kernelObjects.clear();
  kernelLinks.clear();
  kernelObjects.set("agent_session:" + sessionId, {
    id: sessionId,
    status: "starting",
  });
  kernelObjects.set("agent_definition:" + definitionId, {
    id: definitionId,
    package_ref: packageRef,
    role: "worker",
    runtime_profile: null,
    system_prompt_ref: null,
  });
  kernelLinks.set(sessionId + ":spawned_from", [
    { from_id: sessionId, to_id: definitionId },
  ]);
  kernelLinks.set(sessionId + ":delegates_to", [
    { from_id: callerSessionId, to_id: sessionId },
  ]);

  const previousProof = process.env.QF_UI_PROOF;
  const previousRoot = process.env.QF_UI_PROOF_RESOURCE_ROOT;
  process.env.QF_UI_PROOF = "1";
  process.env.QF_UI_PROOF_RESOURCE_ROOT = root;
  try {
    const { startPrecreatedNativeTuiSession } = await import("./agent-host");
    let thrown: unknown;
    try {
      await startPrecreatedNativeTuiSession(
        { sessionId: callerSessionId, role: "orchestrator" },
        sessionId,
      );
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(UnsupportedRuntimeRouteError);
    expect(thrown).toMatchObject({
      name: "UnsupportedRuntimeRouteError",
      code: "QF_UNSUPPORTED_RUNTIME_ROUTE",
      route,
      packageRef,
      message: "unsupported runtime route \"" + route + "\" for package_ref \"" + packageRef + "\"",
    });
    expect(kernelMutations).toBe(0);
    expect(runtimeCallbacks).toBe(0);
  } finally {
    if (previousProof === undefined) delete process.env.QF_UI_PROOF;
    else process.env.QF_UI_PROOF = previousProof;
    if (previousRoot === undefined) delete process.env.QF_UI_PROOF_RESOURCE_ROOT;
    else process.env.QF_UI_PROOF_RESOURCE_ROOT = previousRoot;
    rmSync(root, { recursive: true, force: true });
  }
}

test("production precreated path rejects agentos and arbitrary routes at the dispatcher", async () => {
  await assertProductionPathRefuses("agentos");
  await assertProductionPathRefuses("golden-g4-unknown");
});

test("repeated native-TUI close starts teardown at most once", async () => {
  const { createNativeTuiTeardownRegistry } = await import("./agent-host");
  let calls = 0;
  const teardown = async (): Promise<void> => {
    calls += 1;
  };
  const registry = createNativeTuiTeardownRegistry(teardown);
  const entry = { kind: "native_tui", ptySessionId: "pty-once" } as NativeTuiLive;

  const first = registry.begin("session-once", entry);
  const second = registry.begin("session-once", entry);
  expect(second).toBe(first);
  await registry.awaitAll();
  expect(calls).toBe(1);
});
