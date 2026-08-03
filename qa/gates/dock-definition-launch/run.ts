/**
 * WO-D2 D5 acceptance: one packaged Dock catalogue and one definition-driven
 * native-TUI admission boundary. No model, network, credentials, or founder
 * transport/database is consulted.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import {
  closeKernel,
  eventCount,
  execute,
  getLinks,
  getObject,
  openKernel,
  queryObjects,
  type KernelDb,
  type TraceContext,
} from "qf-kernel";
import {
  bootstrapDockProfiles,
  discoverDockProfileManifests,
  type DockProfileRegistration,
} from "../../../collab-electron/src/main/dock-profiles.ts";
import {
  allowsPtyRoleDelivery,
  expandRuntimeAdapterArgv,
  parseRuntimeAdapterMetadata,
  resolveRuntimeAdapterMetadata,
  type RuntimeAdapterMetadata,
} from "../../../collab-electron/src/main/runtime-adapter.ts";
import {
  collectUniqueRuntimeSoftware,
  parseDefinitionLaunchRequest,
  resolveDefinitionRuntime,
  runtimeSoftwareIdentity,
} from "../../../collab-electron/src/main/definition-runtime.ts";
import {
  orchestrateNativeTuiAdmission,
  type NativeTuiLive,
  type NativeTuiOrchestrationDependencies,
} from "../../../collab-electron/src/main/native-tui-orchestration.ts";
import { PeerRoleRegistry } from "../../../collab-electron/src/main/peer-role-registry.ts";
import { completeRuntimeKernelAdmission } from "../../../collab-electron/src/main/runtime-kernel-admission.ts";

const GATE = import.meta.dir;
const REPO = join(GATE, "../../..");
const FAKE_CLI = join(GATE, "fake-cli.ts");

const DEFAULTS = [
  {
    id: "qf-toolloop",
    role: "toolloop-proof",
    packageRef: "tools/runtime-proof/packed/qf-toolloop.aospkg",
    runtimeProfile: null,
  },
  {
    id: "qf-proof-orchestrator",
    role: "orchestrator",
    packageRef: "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
    runtimeProfile: "qf-proof-orchestrator",
  },
  {
    id: "qf-proof-worker",
    role: "worker",
    packageRef: "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
    runtimeProfile: "qf-proof-worker",
  },
  {
    id: "hermes-orchestrator",
    role: "orchestrator",
    packageRef: "species/hermes/packed/hermes.aospkg",
    runtimeProfile: "default",
  },
  {
    id: "hermes-worker",
    role: "worker",
    packageRef: "species/hermes/packed/hermes.aospkg",
    runtimeProfile: "default",
  },
  {
    id: "hermes-worker-2",
    role: "worker2",
    packageRef: "species/hermes/packed/hermes.aospkg",
    runtimeProfile: "default",
  },
] as const;

type FakeReceipt = { argv: string[]; home: string | null; pid: number };
type Spawned = {
  child: ReturnType<typeof Bun.spawn>;
  reader: ReadableStreamDefaultReader<Uint8Array>;
  receipt: FakeReceipt;
};

function fail(message: string, detail?: unknown): never {
  if (detail === undefined) throw new Error(`dock-definition-launch FAIL: ${message}`);
  throw new Error(`dock-definition-launch FAIL: ${message}: ${JSON.stringify(detail)}`);
}

function assert(condition: unknown, message: string, detail?: unknown): asserts condition {
  if (!condition) fail(message, detail);
}

function trace(): TraceContext {
  return { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() };
}

function copyFixtureRoot(target: string): void {
  const files = [
    "species/hermes/dock-profiles.json",
    "species/hermes/launch.json",
    "species/hermes/packed/hermes.meta.json",
    "tools/runtime-proof/dock-profiles.json",
    "tools/runtime-proof/launch.json",
    "tools/runtime-proof/packed/qf-toolloop.meta.json",
    "tools/qf-proof-agent/dock-profiles.json",
    "tools/qf-proof-agent/launch.json",
    "tools/qf-proof-agent/packed/qf-proof-agent.meta.json",
  ];
  for (const ref of files) {
    const destination = join(target, ref);
    mkdirSync(join(destination, ".."), { recursive: true });
    copyFileSync(join(REPO, ref), destination);
  }
  for (const ref of [
    "species/hermes/packed/hermes.aospkg",
    "tools/runtime-proof/packed/qf-toolloop.aospkg",
    "tools/qf-proof-agent/packed/qf-proof-agent.aospkg",
  ]) {
    const destination = join(target, ref);
    mkdirSync(join(destination, ".."), { recursive: true });
    writeFileSync(destination, "credential-free WO-D2 package fixture\n");
  }
}

function definition(db: KernelDb, definitionId: string): Record<string, unknown> | null {
  return getObject(db, "agent_definition", definitionId);
}

function bootstrap(db: KernelDb, appRoot: string) {
  return bootstrapDockProfiles(appRoot, {
    getAgentDefinition: (id) => definition(db, id),
    executeRegisterAgentDefinition: (input: DockProfileRegistration) =>
      execute(db, "register_agent_definition", input, trace()),
  }, { qaMode: true });
}

function assertExactDefaults(db: KernelDb): Record<string, unknown>[] {
  const rows = queryObjects(db, "agent_definition", undefined, null, 0, undefined, "asc");
  assert(rows.length === 6, "bootstrap row count must be exactly six", rows);
  for (const expected of DEFAULTS) {
    const row = rows.find((candidate) => candidate.id === expected.id);
    assert(row, `missing default ${expected.id}`);
    assert(row.name === expected.id, `${expected.id} name mismatch`, row);
    assert(row.role === expected.role, `${expected.id} role mismatch`, row);
    assert(row.package_ref === expected.packageRef, `${expected.id} package_ref mismatch`, row);
    assert(
      (row.runtime_profile ?? null) === expected.runtimeProfile,
      `${expected.id} runtime_profile mismatch`,
      row,
    );
    assert((row.system_prompt_ref ?? null) === null, `${expected.id} prompt ref must be null`, row);
  }
  return rows;
}

function assertSourceMetadataAgreement(): void {
  for (const adapter of [
    { root: "species/hermes", packageName: "hermes.aospkg" },
    { root: "tools/runtime-proof", packageName: "qf-toolloop.aospkg" },
    { root: "tools/qf-proof-agent", packageName: "qf-proof-agent.aospkg" },
  ]) {
    const launch = JSON.parse(readFileSync(join(REPO, adapter.root, "launch.json"), "utf8")) as Record<string, unknown>;
    const packed = JSON.parse(
      readFileSync(
        join(REPO, adapter.root, "packed", adapter.packageName.replace(/\.aospkg$/, ".meta.json")),
        "utf8",
      ),
    ) as Record<string, unknown>;
    for (const [key, value] of Object.entries(launch)) {
      assert(
        JSON.stringify(packed[key]) === JSON.stringify(value),
        `${adapter.root} packed metadata disagrees with launch.json at ${key}`,
      );
    }
    assert(packed.package === adapter.packageName, `${adapter.root} package name mismatch`);
    parseRuntimeAdapterMetadata(packed, `${adapter.root}/packed metadata`);
  }
}

function expectContractRejection(fn: () => unknown, pattern: RegExp, label: string): void {
  try {
    fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert(pattern.test(message), `${label} rejected with wrong message`, message);
    return;
  }
  fail(`${label} was accepted`);
}

function assertStrictManifests(work: string): void {
  const unknownRoot = join(work, "unknown-key");
  copyFixtureRoot(unknownRoot);
  const unknownPath = join(unknownRoot, "species/hermes/dock-profiles.json");
  const unknown = JSON.parse(readFileSync(unknownPath, "utf8")) as Record<string, unknown>;
  unknown.extra = true;
  writeFileSync(unknownPath, `${JSON.stringify(unknown, null, 2)}\n`);
  expectContractRejection(
    () => discoverDockProfileManifests(unknownRoot, { qaMode: true }),
    /keys must be exactly/,
    "manifest unknown key",
  );

  const traversalRoot = join(work, "traversal");
  copyFixtureRoot(traversalRoot);
  const traversalPath = join(traversalRoot, "species/hermes/dock-profiles.json");
  const traversal = JSON.parse(readFileSync(traversalPath, "utf8")) as {
    adapter: { package: string };
  };
  traversal.adapter.package = "../packed/hermes.aospkg";
  writeFileSync(traversalPath, `${JSON.stringify(traversal, null, 2)}\n`);
  expectContractRejection(
    () => discoverDockProfileManifests(traversalRoot, { qaMode: true }),
    /normalized relative POSIX path/,
    "manifest traversal",
  );

  const absoluteRoot = join(work, "absolute");
  copyFixtureRoot(absoluteRoot);
  const absolutePath = join(absoluteRoot, "tools/runtime-proof/dock-profiles.json");
  const absolute = JSON.parse(readFileSync(absolutePath, "utf8")) as {
    adapter: { package: string };
  };
  absolute.adapter.package = "/tmp/qf-toolloop.aospkg";
  writeFileSync(absolutePath, `${JSON.stringify(absolute, null, 2)}\n`);
  expectContractRejection(
    () => discoverDockProfileManifests(absoluteRoot, { qaMode: true }),
    /normalized relative POSIX path/,
    "manifest absolute path",
  );
}

async function spawnFake(argv: string[], home: string): Promise<Spawned> {
  const child = Bun.spawn([process.execPath, FAKE_CLI, ...argv], {
    cwd: home,
    env: { HOME: home },
    stdout: "pipe",
    stderr: "pipe",
  });
  const reader = child.stdout.getReader();
  const first = await reader.read();
  assert(!first.done && first.value, "fake CLI exited before reporting argv/PID");
  const line = new TextDecoder().decode(first.value).trim().split("\n")[0];
  const receipt = JSON.parse(line!) as FakeReceipt;
  assert(receipt.pid === child.pid, "fake CLI PID receipt mismatch", receipt);
  assert(receipt.home === home, "fake CLI did not receive temporary HOME", receipt);
  return { child, reader, receipt };
}

async function stopSpawned(spawned: Spawned): Promise<void> {
  spawned.child.kill("SIGTERM");
  await spawned.child.exited;
  try {
    await spawned.reader.cancel();
  } catch {
    // Process exit may already close the pipe.
  }
}

type Harness = {
  deps: NativeTuiOrchestrationDependencies;
  live: Map<string, NativeTuiLive>;
  ptyMap: Map<string, string>;
  peer: PeerRoleRegistry;
  spawned: Map<string, Spawned>;
  starts: string[];
  spawnCount: () => number;
};

function makeHarness(input: {
  db: KernelDb;
  argv: string[];
  home: string;
  peer: PeerRoleRegistry;
  sessionPrefix: string;
  fault?: "create" | "start";
}): Harness {
  const live = new Map<string, NativeTuiLive>();
  const ptyMap = new Map<string, string>();
  const spawned = new Map<string, Spawned>();
  const starts: string[] = [];
  let sessionCounter = 0;
  let spawnCounter = 0;
  const deps: NativeTuiOrchestrationDependencies = {
    createPty: async () => {
      spawnCounter += 1;
      const process = await spawnFake(input.argv, input.home);
      const id = `pty-${process.receipt.pid}`;
      spawned.set(id, process);
      return { sessionId: id };
    },
    terminatePty: async (ptyId) => {
      const process = spawned.get(ptyId);
      if (process) {
        await stopSpawned(process);
        spawned.delete(ptyId);
      }
    },
    execute: (command, body, ctx) => {
      if (input.fault === "create" && command === "create_agent_session") {
        throw new Error("injected create failure");
      }
      if (input.fault === "start" && command === "start_agent_session") {
        throw new Error("injected start failure");
      }
      return execute(input.db, command, body, ctx);
    },
    newTrace: trace,
    newSessionId: () => `${input.sessionPrefix}-${++sessionCounter}`,
    liveSet: (id, entry) => live.set(id, entry),
    liveDelete: (id) => void live.delete(id),
    ptyMapSet: (pty, session) => ptyMap.set(pty, session),
    ptyMapDelete: (pty) => void ptyMap.delete(pty),
    peerAssertAvailable: (role) => input.peer.assertAvailable(role),
    peerRegister: (role, pty) => input.peer.register(role, pty),
    peerUnregister: (role, pty) => void input.peer.unregister(role, pty),
    peerStart: (dbPath) => starts.push(dbPath),
  };
  return { deps, live, ptyMap, peer: input.peer, spawned, starts, spawnCount: () => spawnCounter };
}

async function cleanupSuccess(
  harness: Harness,
  result: { sessionId: string; ptySessionId: string },
  role?: string,
): Promise<void> {
  if (role) harness.peer.unregister(role, result.ptySessionId);
  harness.live.delete(result.sessionId);
  harness.ptyMap.delete(result.ptySessionId);
  await harness.deps.terminatePty(result.ptySessionId);
}

function resolvedRow(db: KernelDb, appRoot: string, definitionId: string) {
  const resolved = resolveDefinitionRuntime(
    definitionId,
    appRoot,
    (id) => definition(db, id),
  );
  const row = definition(db, definitionId);
  assert(row, `definition resolution returned for missing row ${definitionId}`);
  const adapter = resolveRuntimeAdapterMetadata(String(row.package_ref), appRoot);
  assert(adapter.metadata.adapterId === resolved.metadata.adapterId, `${definitionId} adapter mismatch`);
  assert(adapter.packagePath === resolved.packagePath, `${definitionId} package path mismatch`);
  assert((row.runtime_profile ?? null) === resolved.runtimeProfile, `${definitionId} profile mismatch`);
  assert(JSON.stringify(adapter.metadata) === JSON.stringify(resolved.metadata), `${definitionId} metadata mismatch`);
  return { row, resolved, adapter };
}

async function launch(
  db: KernelDb,
  appRoot: string,
  home: string,
  definitionId: string,
  peer: PeerRoleRegistry,
  sessionPrefix: string,
  fault?: "create" | "start",
) {
  const { row, resolved, adapter } = resolvedRow(db, appRoot, definitionId);
  const runtimeProfile = (row.runtime_profile ?? null) as string | null;
  const argv = resolved.argv;
  assert(
    JSON.stringify(argv) === JSON.stringify(expandRuntimeAdapterArgv(adapter.metadata, runtimeProfile)),
    `${definitionId} production argv disagrees with adapter expansion`,
  );
  const harness = makeHarness({ db, argv, home, peer, sessionPrefix, fault });
  const peerDb = join(home, "fake-peer-transport.db");
  const eligible = allowsPtyRoleDelivery(adapter.metadata, runtimeProfile);
  const result = await orchestrateNativeTuiAdmission(
    {
      definitionId,
      label: definitionId,
      ...(eligible ? { peerDelivery: { role: String(row.role), dbPath: peerDb } } : {}),
    },
    harness.deps,
  );
  const process = harness.spawned.get(result.ptySessionId);
  assert(process, `${definitionId} child missing after successful launch`);
  assert(JSON.stringify(process.receipt.argv) === JSON.stringify(argv), `${definitionId} argv mismatch`, process.receipt);
  return { row, resolved, adapter, argv, harness, result, eligible, peerDb };
}

function assertSpawnedFrom(db: KernelDb, sessionId: string, definitionId: string): void {
  const links = getLinks(db, sessionId, { kind: "spawned_from" });
  assert(links.length === 1, `${sessionId} must have exactly one spawned_from link`, links);
  assert(links[0]!.from_id === sessionId && links[0]!.to_id === definitionId, `${sessionId} linked to wrong definition`, links);
}

type AcpSurface = "host_acp" | "agentos";

type AcpLive = {
  definitionId: string;
  guestId: string;
  surface: AcpSurface;
};

function sessionEventTypes(db: KernelDb, sessionId: string): string[] {
  return (
    db.query(
      `SELECT type FROM events
       WHERE object_type = 'agent_session' AND object_id = ?
       ORDER BY rowid ASC`,
    ).all(sessionId) as Array<{ type: string }>
  ).map((row) => row.type);
}

function errorMessages(error: unknown): string[] {
  assert(error instanceof AggregateError, "cleanup faults must return AggregateError", error);
  return error.errors.map((cause) => cause instanceof Error ? cause.message : String(cause));
}

async function exerciseAcpFailure(input: {
  db: KernelDb;
  surface: AcpSurface;
  definitionId: string;
  fault: "create" | "start";
  cleanupFaults?: boolean;
}): Promise<{ surface: AcpSurface; fault: "create" | "start" }> {
  const kernelSessionId = `${input.surface}-kernel-${input.fault}${input.cleanupFaults ? "-cleanup" : ""}`;
  const runtimeId = `${input.surface}-runtime-${input.fault}${input.cleanupFaults ? "-cleanup" : ""}`;
  assert(kernelSessionId !== runtimeId, `${input.surface} fixture collapsed Kernel and runtime ids`);
  const hostHandle = { sessionId: runtimeId, owner: "host-handle" };
  const live = new Map<string, AcpLive>();
  const commands: string[] = [];
  const teardownOwners: unknown[] = [];
  const liveDeletes: string[] = [];
  const beforeEvents = eventCount(input.db);
  let thrown: unknown;

  const tearDownRuntime = async (): Promise<void> => {
    teardownOwners.push(input.surface === "host_acp" ? hostHandle : runtimeId);
    if (input.cleanupFaults) throw new Error(`${input.surface} teardown fault`);
  };

  try {
    await completeRuntimeKernelAdmission(
      {
        definitionId: input.definitionId,
        sessionId: kernelSessionId,
        liveEntry: { definitionId: input.definitionId, guestId: runtimeId, surface: input.surface },
      },
      {
        execute: (command, body, ctx) => {
          commands.push(command);
          if (command === `${input.fault}_agent_session`) {
            throw new Error(`${input.surface} injected ${input.fault} failure`);
          }
          return execute(input.db, command, body, ctx);
        },
        newTrace: trace,
        liveSet: (id, entry) => live.set(id, entry),
        liveDelete: (id) => {
          liveDeletes.push(id);
          live.delete(id);
          if (input.cleanupFaults) throw new Error(`${input.surface} live-delete fault`);
        },
        tearDownRuntime,
      },
    );
    fail(`${input.surface} ${input.fault} failure was accepted`);
  } catch (error) {
    thrown = error;
  }

  const expectedOwner = input.surface === "host_acp" ? hostHandle : runtimeId;
  assert(
    teardownOwners.length === 1 && teardownOwners[0] === expectedOwner,
    `${input.surface} ${input.fault} tore down the wrong runtime owner`,
    teardownOwners,
  );
  assert(
    liveDeletes.length === 1 && liveDeletes[0] === kernelSessionId && live.size === 0,
    `${input.surface} ${input.fault} did not remove its exact live entry`,
    { liveDeletes, live: [...live.keys()] },
  );

  if (input.fault === "create") {
    assert(getObject(input.db, "agent_session", kernelSessionId) === null, `${input.surface} create failure left a session`);
    assert(getLinks(input.db, kernelSessionId).length === 0, `${input.surface} create failure left a link`);
    assert(eventCount(input.db) === beforeEvents, `${input.surface} create failure left an event`);
  } else {
    const session = getObject(input.db, "agent_session", kernelSessionId);
    assert(session?.status === "closed", `${input.surface} start failure did not end closed`, session);
    assertSpawnedFrom(input.db, kernelSessionId, input.definitionId);
    const events = sessionEventTypes(input.db, kernelSessionId);
    assert(
      JSON.stringify(events) === JSON.stringify([
        "agent_session.created",
        "agent_session.failed",
        "agent_session.closed",
      ]),
      `${input.surface} start failure receipt order is wrong`,
      events,
    );
    assert(
      JSON.stringify(commands) === JSON.stringify([
        "create_agent_session",
        "start_agent_session",
        "fail_agent_session",
        "close_agent_session",
      ]),
      `${input.surface} start failure skipped durable cleanup`,
      commands,
    );
  }

  const messages = errorMessages(thrown);
  assert(
    messages.includes(`${input.surface} injected ${input.fault} failure`),
    `${input.surface} AggregateError lost the original failure`,
    messages,
  );
  if (input.cleanupFaults) {
    for (const expected of [
      `${input.surface} teardown fault`,
      `${input.surface} live-delete fault`,
    ]) {
      assert(messages.includes(expected), `${input.surface} AggregateError lost ${expected}`, messages);
    }
  }

  const relaunchSessionId = `${kernelSessionId}-relaunch`;
  const relaunchRuntimeId = `${runtimeId}-relaunch`;
  await completeRuntimeKernelAdmission(
    {
      definitionId: input.definitionId,
      sessionId: relaunchSessionId,
      liveEntry: {
        definitionId: input.definitionId,
        guestId: relaunchRuntimeId,
        surface: input.surface,
      },
    },
    {
      execute: (command, body, ctx) => execute(input.db, command, body, ctx),
      newTrace: trace,
      liveSet: (id, entry) => live.set(id, entry),
      liveDelete: (id) => void live.delete(id),
      tearDownRuntime: async () => {},
    },
  );
  assert(
    getObject(input.db, "agent_session", relaunchSessionId)?.status === "running",
    `${input.surface} ${input.fault} blocked immediate same-definition relaunch`,
  );
  live.delete(relaunchSessionId);
  execute(input.db, "close_agent_session", { session_id: relaunchSessionId }, trace());

  return { surface: input.surface, fault: input.fault };
}

function functionSource(source: string, name: string, nextName: string): string {
  const start = source.indexOf(`async function ${name}(`);
  const end = source.indexOf(`async function ${nextName}(`, start + 1);
  assert(start >= 0 && end > start, `cannot isolate production caller ${name}`);
  return source.slice(start, end);
}

function assertAcpProductionDelegation(host: string): void {
  const hostAcp = functionSource(host, "admitHostAcpDefinition", "admitAgentOsDefinition");
  const agentOs = functionSource(host, "admitAgentOsDefinition", "runTurn");
  for (const [label, body] of [["host ACP", hostAcp], ["AgentOS", agentOs]] as const) {
    assert(
      /await\s+completeRuntimeKernelAdmission(?:<[^>]+>)?\s*\(/.test(body),
      `${label} production caller does not delegate to completeRuntimeKernelAdmission`,
    );
  }
  assert(
    /tearDownRuntime:\s*(?:async\s*)?\(\)\s*=>\s*(?:await\s+)?tearDownHostAcp\(handle\)/.test(hostAcp),
    "host ACP compensation does not own its exact handle",
  );
  assert(
    /tearDownRuntime:\s*(?:async\s*)?\(\)\s*=>\s*(?:await\s+)?host\.destroySession\(guestId\)/.test(agentOs),
    "AgentOS compensation does not destroy its exact guest id",
  );
  assert(
    !/tearDownRuntime:[\s\S]{0,120}host\.destroySession\(sessionId\)/.test(agentOs),
    "AgentOS compensation incorrectly destroys the Kernel session id",
  );
}

function assertStaticLaunchSurface(): void {
  const dockPath = join(REPO, "collab-electron/src/windows/shell/src/dock.js");
  const dock = readFileSync(dockPath, "utf8");
  const idMatch = /const\s+definitionId\s*=\s*String\(row\.id\s*\?\?\s*""\)/.exec(dock);
  assert(idMatch, `${relative(REPO, dockPath)} must derive definitionId from row.id`);
  assert(
    /spawnSession\(\{\s*definitionId\s*\}\)/.test(dock),
    `${relative(REPO, dockPath)} must send only definitionId`,
  );
  assert(
    !/definitionId\s*=\s*String\(row\.name/.test(dock),
    `${relative(REPO, dockPath)} launches row.name instead of row.id`,
  );

  const surfaces = [
    "collab-electron/src/main/ipc-kernel.ts",
    "collab-electron/src/preload/shell.ts",
    "collab-electron/src/preload/universal.ts",
    "collab-electron/packages/shared/src/window-api.d.ts",
    "collab-electron/src/windows/shell/index.html",
    "collab-electron/src/windows/shell/src/dock.js",
  ];
  const forbidden = [/qf:seats:/, /hermes-seats/, /dock-seats/, /\blistSeats\b/, /\bspawnSeat\b/];
  for (const ref of surfaces) {
    const text = readFileSync(join(REPO, ref), "utf8");
    for (const token of forbidden) {
      assert(!token.test(text), `legacy Dock surface ${token} survives in ${ref}`);
    }
  }
  assert(!existsSync(join(REPO, "collab-electron/src/main/hermes-seats.ts")), "hermes-seats.ts survives");

  const ipc = readFileSync(join(REPO, "collab-electron/src/main/ipc-kernel.ts"), "utf8");
  assert(/parseDefinitionLaunchRequest\(args\)/.test(ipc), "IPC must call the pure closed launch parser");
  assert(/admitAndStartSession\(definitionId/.test(ipc), "IPC must admit the parsed definitionId");

  const hostPath = join(REPO, "collab-electron/src/main/agent-host.ts");
  const host = readFileSync(hostPath, "utf8");
  assertAcpProductionDelegation(host);
  assert(
    /resolveDefinitionRuntime\(definitionId,\s*appRoot\(\),\s*getDefinition\)/.test(host),
    "production admission must resolve the exact Kernel definition through the shared helper",
  );
  assert(
    /collectUniqueRuntimeSoftware\(/.test(host),
    "production AgentOS startup must use shared adapter/package deduplication",
  );
  assert(
    /allowsPtyRoleDelivery\([\s\S]*runtime\.runtimeProfile/.test(host),
    "production native-TUI admission must consult package-owned peer authorization",
  );
  assert(
    /liveDelete:\s*\(sessionId\)[\s\S]*live\.delete\(sessionId\)/.test(host),
    "production native-TUI admission must wire compensating live-map deletion",
  );
  assert(
    /host\.createSession\(\s*adapterId/.test(host),
    "AgentOS must create the packaged adapter id, not a profile definition id",
  );
  assert(
    /runtimeSoftwareIdentity\([\s\S]*runtime\.metadata\.adapterId[\s\S]*runtime\.packagePath/.test(host),
    "linkSoftware must use the shared normalized adapter/package identity",
  );
  assert(
    /adapterId === "hermes"[\s\S]*\.hermes\/hermes-agent/.test(host),
    "Hermes binary fallbacks must be guarded by exact adapter identity",
  );

  const nativeHost = readFileSync(
    join(REPO, "collab-electron/src/main/host-native-tui.ts"),
    "utf8",
  );
  assert(
    /if \(entry\.peerRole\)[\s\S]*unregisterSeatPty\(entry\.peerRole, entry\.ptySessionId\)/.test(nativeHost),
    "native-TUI cancel/teardown must owner-unregister peer roles directly",
  );
}

async function main(): Promise<number> {
  const work = mkdtempSync(join(process.env.HOME ?? "/tmp", "qf-d2-gate-"));
  const appRoot = join(work, "app");
  const home = join(work, "home");
  mkdirSync(home, { recursive: true });
  copyFixtureRoot(appRoot);
  assert(statSync(FAKE_CLI).isFile(), "fake CLI fixture missing");

  let db: KernelDb | null = null;
  let conflictDb: KernelDb | null = null;
  try {
    assertSourceMetadataAgreement();
    assertStrictManifests(work);
    assertStaticLaunchSurface();

    db = openKernel(":memory:");
    const first = bootstrap(db, appRoot);
    assert(first.registered.length === 6 && first.skipped.length === 0 && first.conflicts.length === 0, "first bootstrap counts wrong", first);
    const rows = assertExactDefaults(db);
    const eventsAfterFirst = eventCount(db);
    const second = bootstrap(db, appRoot);
    assert(second.registered.length === 0 && second.skipped.length === 6 && second.conflicts.length === 0, "second bootstrap counts wrong", second);
    assert(queryObjects(db, "agent_definition", undefined, null).length === 6, "second bootstrap changed row count");
    assert(eventCount(db) === eventsAfterFirst, "second bootstrap changed event count");

    conflictDb = openKernel(":memory:");
    execute(
      conflictDb,
      "register_agent_definition",
      {
        name: "qf-toolloop",
        role: "operator-preserved-conflict",
        package_ref: "operator/custom.aospkg",
        runtime_profile: "operator-profile",
      },
      trace(),
    );
    const conflictBeforeEvents = eventCount(conflictDb);
    const conflict = bootstrap(conflictDb, appRoot);
    assert(conflict.registered.length === 5 && conflict.skipped.length === 0 && conflict.conflicts.length === 1, "conflict bootstrap counts wrong", conflict);
    const preserved = definition(conflictDb, "qf-toolloop");
    assert(preserved?.role === "operator-preserved-conflict" && preserved?.package_ref === "operator/custom.aospkg", "bootstrap overwrote conflicting operator row", preserved);
    assert(eventCount(conflictDb) === conflictBeforeEvents + 5, "conflict bootstrap event count wrong");

    const orchestrator = resolvedRow(db, appRoot, "hermes-orchestrator");
    const worker = resolvedRow(db, appRoot, "hermes-worker");
    assert(orchestrator.resolved.metadata.adapterId === "hermes" && worker.resolved.metadata.adapterId === "hermes", "shared Hermes adapter id mismatch");
    assert(orchestrator.resolved.packagePath === worker.resolved.packagePath, "Hermes profiles do not share package path");
    const orchestratorArgv = expandRuntimeAdapterArgv(orchestrator.adapter.metadata, "default");
    const workerArgv = expandRuntimeAdapterArgv(worker.adapter.metadata, "default");
    assert(JSON.stringify(orchestratorArgv) === JSON.stringify(["--tui"]), "orchestrator argv wrong", orchestratorArgv);
    assert(JSON.stringify(workerArgv) === JSON.stringify(["--tui"]), "worker argv wrong", workerArgv);

    const uniqueSoftware = collectUniqueRuntimeSoftware(
      rows,
      appRoot,
      (id) => definition(db!, id),
    );
    assert(uniqueSoftware.length === 2, "four defaults must dedupe to two runtime software entries", uniqueSoftware);
    const uniqueKeys = new Set(uniqueSoftware.map((entry) => `${entry.adapterId}\0${entry.packagePath}`));
    assert(uniqueKeys.size === 2, "runtime software entries are not unique by adapter/path", uniqueSoftware);
    const canonical = runtimeSoftwareIdentity(
      "hermes",
      `${orchestrator.resolved.packagePath.replace(/\/hermes\.aospkg$/, "")}`
      + "/ignored/../hermes.aospkg",
    );
    assert(
      canonical.key === `hermes\0${orchestrator.resolved.packagePath}`,
      "equivalent package paths do not share one admission identity",
      canonical,
    );

    const eventBeforeUnknown = eventCount(db);
    let spawnAttempts = 0;
    expectContractRejection(
      () => {
        resolveDefinitionRuntime("missing-definition", appRoot, (id) => definition(db!, id));
        spawnAttempts += 1;
      },
      /missing-definition|unknown|not found/i,
      "unknown definition",
    );
    const invalidRequests: unknown[] = [
      null,
      {},
      { definitionId: "" },
      { definitionId: "hermes-worker", argv: ["--unsafe"] },
      { definitionId: "hermes-worker", env: { HOME: "/tmp" } },
      { definitionId: "hermes-worker", packageRef: "other.aospkg" },
      { definitionId: "hermes-worker", adapterId: "other" },
      { definitionId: "hermes-worker", runtimeProfile: "other" },
      { definitionId: "hermes-worker", role: "other" },
      { definitionId: "hermes-worker", label: "other" },
    ];
    for (const request of invalidRequests) {
      expectContractRejection(
        () => {
          parseDefinitionLaunchRequest(request);
          spawnAttempts += 1;
        },
        /definitionId|field|key|object|requires|reject/i,
        `renderer override ${JSON.stringify(request)}`,
      );
    }
    assert(spawnAttempts === 0, "unknown/override input crossed process boundary");
    assert(eventCount(db) === eventBeforeUnknown, "unknown/override input created an event");
    assert(queryObjects(db, "agent_session", undefined, null).length === 0, "unknown/override input created a session");

    const peer = new PeerRoleRegistry();
    const launchedOrchestrator = await launch(db, appRoot, home, "hermes-orchestrator", peer, "orch");
    assert(launchedOrchestrator.eligible, "orchestrator metadata must opt into peer delivery");
    assert(peer.get("orchestrator") === launchedOrchestrator.result.ptySessionId, "orchestrator role not registered to its PTY");
    assert(launchedOrchestrator.harness.starts.length === 1 && launchedOrchestrator.harness.starts[0] === launchedOrchestrator.peerDb, "peer watcher start receipt wrong");
    assert(!existsSync(launchedOrchestrator.peerDb), "gate opened its fake peer transport database");
    assertSpawnedFrom(db, launchedOrchestrator.result.sessionId, "hermes-orchestrator");
    await cleanupSuccess(launchedOrchestrator.harness, launchedOrchestrator.result, "orchestrator");

    const launchedWorker = await launch(db, appRoot, home, "hermes-worker", peer, "worker");
    assertSpawnedFrom(db, launchedWorker.result.sessionId, "hermes-worker");
    await cleanupSuccess(launchedWorker.harness, launchedWorker.result, "worker");

    const hermesMetadata = orchestrator.adapter.metadata;
    const noPeerMetadata: RuntimeAdapterMetadata = { ...hermesMetadata, peerDelivery: null };
    assert(!allowsPtyRoleDelivery(noPeerMetadata, "default"), "unflagged adapter became peer eligible");
    assert(!allowsPtyRoleDelivery(hermesMetadata, null), "null selector became peer eligible");
    assert(!allowsPtyRoleDelivery(hermesMetadata, "unlisted"), "unlisted selector became peer eligible");
    const toolloop = resolvedRow(db, appRoot, "qf-toolloop");
    assert(!allowsPtyRoleDelivery(toolloop.adapter.metadata, null), "qf-toolloop became peer eligible");

    peer.register("orchestrator", "pty-owner-a");
    const duplicateHarness = makeHarness({
      db,
      argv: orchestratorArgv,
      home,
      peer,
      sessionPrefix: "duplicate",
    });
    try {
      await orchestrateNativeTuiAdmission(
        {
          definitionId: "hermes-orchestrator",
          label: "hermes-orchestrator",
          peerDelivery: { role: "orchestrator", dbPath: join(home, "duplicate-peer.db") },
        },
        duplicateHarness.deps,
      );
      fail("duplicate peer role launch was accepted");
    } catch (error) {
      assert(/already bound/.test(error instanceof Error ? error.message : String(error)), "duplicate role threw wrong error");
    }
    assert(duplicateHarness.spawnCount() === 0, "duplicate role started a child before rejection");
    assert(peer.get("orchestrator") === "pty-owner-a", "duplicate role rerouted existing owner");
    assert(!peer.unregister("orchestrator", "pty-owner-b"), "non-owner unregistered a peer role");
    assert(peer.get("orchestrator") === "pty-owner-a", "non-owner unregister changed destination");
    peer.unregister("orchestrator", "pty-owner-a");

    const sessionsBeforeCreateFault = queryObjects(db, "agent_session", undefined, null).length;
    const eventsBeforeCreateFault = eventCount(db);
    const createFaultHarness = makeHarness({
      db,
      argv: orchestratorArgv,
      home,
      peer,
      sessionPrefix: "create-fault",
      fault: "create",
    });
    try {
      await orchestrateNativeTuiAdmission(
        {
          definitionId: "hermes-orchestrator",
          label: "hermes-orchestrator",
          peerDelivery: { role: "orchestrator", dbPath: join(home, "create-fault-peer.db") },
        },
        createFaultHarness.deps,
      );
      fail("injected create failure was accepted");
    } catch (error) {
      assert(/injected create failure/.test(error instanceof Error ? error.message : String(error)), "create fault threw wrong error");
    }
    assert(createFaultHarness.spawned.size === 0 && createFaultHarness.live.size === 0 && createFaultHarness.ptyMap.size === 0, "create failure leaked child/live/PTY state");
    assert(peer.get("orchestrator") === undefined, "create failure leaked peer role");
    assert(queryObjects(db, "agent_session", undefined, null).length === sessionsBeforeCreateFault, "create failure left a session");
    assert(eventCount(db) === eventsBeforeCreateFault, "create failure left an event");
    const createRelaunch = await launch(db, appRoot, home, "hermes-orchestrator", peer, "create-relaunch");
    await cleanupSuccess(createRelaunch.harness, createRelaunch.result, "orchestrator");

    const startFaultHarness = makeHarness({
      db,
      argv: workerArgv,
      home,
      peer,
      sessionPrefix: "start-fault",
      fault: "start",
    });
    try {
      await orchestrateNativeTuiAdmission(
        {
          definitionId: "hermes-worker",
          label: "hermes-worker",
          peerDelivery: { role: "worker", dbPath: join(home, "start-fault-peer.db") },
        },
        startFaultHarness.deps,
      );
      fail("injected start failure was accepted");
    } catch (error) {
      assert(/injected start failure/.test(error instanceof Error ? error.message : String(error)), "start fault threw wrong error");
    }
    assert(startFaultHarness.spawned.size === 0 && startFaultHarness.live.size === 0 && startFaultHarness.ptyMap.size === 0, "start failure leaked child/live/PTY state");
    assert(peer.get("worker") === undefined, "start failure leaked peer role");
    const failedSession = definition(db, "start-fault-1") ?? getObject(db, "agent_session", "start-fault-1");
    assert(failedSession && failedSession.status === "closed", "start failure session was not failed then closed", failedSession);
    assertSpawnedFrom(db, "start-fault-1", "hermes-worker");
    const startRelaunch = await launch(db, appRoot, home, "hermes-worker", peer, "start-relaunch");
    await cleanupSuccess(startRelaunch.harness, startRelaunch.result, "worker");

    const acpFailures = [];
    for (const surface of ["host_acp", "agentos"] as const) {
      for (const fault of ["create", "start"] as const) {
        acpFailures.push(await exerciseAcpFailure({
          db,
          surface,
          definitionId: surface === "host_acp" ? "hermes-worker" : "qf-toolloop",
          fault,
        }));
      }
      await exerciseAcpFailure({
        db,
        surface,
        definitionId: surface === "host_acp" ? "hermes-worker" : "qf-toolloop",
        fault: "start",
        cleanupFaults: true,
      });
    }

    console.log("dock-definition-launch OK");
    console.log(JSON.stringify({
      bootstrap: { registered: first.registered.length, secondBootSkipped: second.skipped.length, conflicts: conflict.conflicts.length },
      sharedHermes: {
        packagePath: relative(work, orchestrator.resolved.packagePath),
        orchestratorArgv,
        workerArgv,
      },
      links: {
        orchestrator: "hermes-orchestrator",
        worker: "hermes-worker",
      },
      uniqueSoftware: uniqueSoftware.map((entry) => ({ adapterId: entry.adapterId, packagePath: relative(work, entry.packagePath) })),
      peer: { role: "orchestrator", transportOpened: false },
      cleanup: { createFailure: "no residue", startFailure: "closed receipt", sameRoleRelaunch: "ok" },
      acpCleanup: {
        matrix: acpFailures.map(({ surface, fault }) => `${surface}:${fault}`),
        exactOwners: true,
        cleanupFaultAggregation: ["host_acp:start", "agentos:start"],
        sameDefinitionRelaunch: true,
      },
      legacyDockSurfaces: 0,
    }));
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    return 1;
  } finally {
    if (db) closeKernel(db);
    if (conflictDb) closeKernel(conflictDb);
    rmSync(work, { recursive: true, force: true });
  }
}

process.exit(await main());
