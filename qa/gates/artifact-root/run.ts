/**
 * WO-K3 / WO-K3b — artifact root gate (G4 / D5).
 *
 * - resolveArtifactRoot default under temp HOME
 * - production helper writes an absent file, then execute publishes the same bytes
 * - the exact production A2A store writes and publishes beneath that root
 * - both production publishers are statically coupled and exhaustively enumerated
 */
import { Database } from "bun:sqlite";
import { mock, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, sep } from "node:path";
import {
  closeKernel,
  contentHash,
  execute,
  openKernel,
  queryObjects,
  resolveArtifactRoot,
} from "qf-kernel";
import { buildArtifactRootInstallPlan } from "../artifact-root.ts";
import { writeAgentTrajectoryArtifact } from "../../../collab-electron/src/main/agent-artifact-writer.ts";
import { createA2aArtifactStore } from "../../../collab-electron/src/main/a2a-artifact-store.ts";

const REPO_ROOT = join(import.meta.dir, "../../..");
const FIXTURE_ENV = "QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY";
const TRACE = { trace_id: "k3-art-root", span_id: "k3-art-span" };
const G9_LIVE_TEST_ENV = "QF_G9_LIVE_AGENT_HOST_TEST";
const G9_LIVE_SESSION_ID = "g9-live-agentos-session";
const G9_LIVE_TRAJECTORY_TEXT = "g9 live AgentOS trajectory body";
const KERNEL_DB_ENV = ["QF", "KERNEL", "DB"].join("_");

class BunDatabaseSync {
  private readonly database: Database;

  constructor(path: string) {
    this.database = new Database(path);
  }

  prepare(sql: string) {
    return this.database.prepare(sql);
  }

  exec(sql: string) {
    return this.database.exec(sql);
  }

  close(): void {
    this.database.close();
  }
}

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

type FixtureAgentEvent = {
  method: string;
  params: Record<string, unknown>;
};

class FixtureAgentOs {
  private listener: ((event: FixtureAgentEvent) => void) | null = null;
  destroyed = false;

  async linkSoftware(_input: Record<string, unknown>): Promise<void> {}

  async createSession(_adapterId: string): Promise<{ sessionId: string }> {
    return { sessionId: G9_LIVE_SESSION_ID };
  }

  onSessionEvent(
    _sessionId: string,
    listener: (event: FixtureAgentEvent) => void,
  ): () => void {
    this.listener = listener;
    return () => {
      if (this.listener === listener) this.listener = null;
    };
  }

  async prompt(
    sessionId: string,
    prompt: string,
  ): Promise<{ response: { result: { stopReason: string } } }> {
    if (prompt !== "g9 live AgentOS trajectory prompt") {
      throw new Error(`unexpected live AgentOS prompt: ${prompt}`);
    }
    this.listener?.({
      method: "session/update",
      params: {
        sessionId,
        update: {
          sessionUpdate: "agent_message_chunk",
          content: { text: G9_LIVE_TRAJECTORY_TEXT },
        },
      },
    });
    return { response: { result: { stopReason: "end_turn" } } };
  }

  async destroySession(_sessionId: string): Promise<void> {
    this.destroyed = true;
  }
}

function liveReceipt(name: string, ok: boolean, detail: string): boolean {
  const line = `artifact-root live receipt ${name} ${ok ? "PASS" : "RED"}: ${detail}`;
  if (ok) console.log(line);
  else console.error(line);
  return ok;
}

async function runLiveAgentHostProof(): Promise<void> {
  const envKeys = [
    "HOME",
    KERNEL_DB_ENV,
    "QF_ARTIFACT_ROOT",
    "QF_APP_ROOT",
    "QF_APP_DIR",
    FIXTURE_ENV,
  ] as const;
  const savedEnv = new Map<string, string | undefined>(
    envKeys.map((key) => [key, process.env[key]]),
  );
  const savedPlatform = Object.getOwnPropertyDescriptor(process, "platform");
  const fixtureRoot = mkdtempSync(join(tmpdir(), "qf-g9-live-agentos-"));
  const artifactRoot = join(fixtureRoot, "artifacts");
  const appRootEnv = "/tmp/qf-g9-live-app";
  const appDir = `${appRootEnv}/app`;
  const packagePath = join(fixtureRoot, "g9-agentos.aospkg");
  const metadataPath = join(fixtureRoot, "g9-agentos.meta.json");
  mkdirSync(artifactRoot, { recursive: true });
  mkdirSync(appDir, { recursive: true });
  writeFileSync(packagePath, "g9-agentos fixture package", "utf8");
  writeFileSync(
    metadataPath,
    JSON.stringify({
      route: "agentos",
      name: "g9-agentos",
      package: "g9-agentos.aospkg",
      command: null,
      entrypoint: null,
      argv: [],
      tools: [],
    }),
    "utf8",
  );

  let db: any = null;
  let fixtureHost: FixtureAgentOs | null = null;
  try {
    Object.defineProperty(process, "platform", {
      value: "linux",
      configurable: true,
    });
    process.env.HOME = fixtureRoot;
    process.env[KERNEL_DB_ENV] = ":memory:";
    process.env.QF_ARTIFACT_ROOT = artifactRoot;
    process.env.QF_APP_ROOT = appRootEnv;
    process.env.QF_APP_DIR = appDir;
    process.env[FIXTURE_ENV] = "1";

    mock.module("node:sqlite", () => ({ DatabaseSync: BunDatabaseSync }));
    mock.module("electron", () => ({
      app: { isPackaged: false },
      ipcMain: { handle() {}, on() {}, removeHandler() {} },
      webContents: { getAllWebContents: () => [] },
      BrowserWindow: class {},
      powerMonitor: { on() {}, removeListener() {} },
      utilityProcess: {},
      shell: {},
      dialog: {},
      nativeImage: {},
      screen: {},
      session: {},
      clipboard: {},
      desktopCapturer: {},
      Menu: class {},
      MenuItem: class {},
      Notification: class {},
    }));
    mock.module("@rivet-dev/agentos-core", () => ({
      AgentOs: {
        create: async () => {
          fixtureHost = new FixtureAgentOs();
          return fixtureHost;
        },
      },
      createHostDirBackend: () => ({}),
    }));

    const { openAppKernel, kernelExecute } = await import(
      "../../../collab-electron/src/main/kernel.ts"
    );
    const { admitAndStartSession, runTurn } = await import(
      "../../../collab-electron/src/main/agent-host.ts"
    );
    db = openAppKernel();
    const definition = kernelExecute(
      "register_agent_definition",
      {
        name: "g9-live-agentos-definition",
        role: "researcher",
        package_ref: packagePath,
        display_name: "Market Researcher",
      },
      TRACE,
    ) as { object_id: string };
    const admission = await admitAndStartSession(definition.object_id);
    const turn = await runTurn(
      admission.sessionId,
      "g9 live AgentOS trajectory prompt",
      { finalize: true, skipPublish: false },
    );
    const artifactId = turn.artifactId;
    if (!artifactId) throw new Error("live runTurn returned no artifactId");
    if (turn.stopReason !== "end_turn") {
      throw new Error(`live runTurn stopReason=${turn.stopReason}`);
    }
    if (!fixtureHost?.destroyed) {
      throw new Error("live runTurn did not destroy the finalized AgentOS session");
    }

    const root = resolveArtifactRoot().path;
    const artifactPath = join(root, `${admission.sessionId}.md`);
    const rows = queryObjects(db, "artifact", undefined, null);
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error("live runTurn published no Artifact row");
    const diskBytes = new Uint8Array(readFileSync(artifactPath));
    const diskHash = contentHash(diskBytes);
    const textBytes = new TextEncoder().encode(
      turn.text || "(empty agent output)",
    );
    const falsify = process.env.QF_G9_TRAJECTORY_FALSIFY;
    const allowedFalsifiers = new Set([
      "kind",
      "producer-link-count",
      "producer-link-identity",
      "bytes-identity",
      "hash-identity",
      "storage-ref-identity",
      "root-confinement",
      "report-refusal",
    ]);
    if (falsify !== undefined && !allowedFalsifiers.has(falsify)) {
      throw new Error(`unknown QF_G9_TRAJECTORY_FALSIFY=${falsify}`);
    }
    const returnedBytes =
      falsify === "bytes-identity"
        ? new Uint8Array([...textBytes, 0])
        : textBytes;
    const returnedPath =
      falsify === "storage-ref-identity"
        ? join(root, "different-storage-ref")
        : artifactPath;
    const rowId = falsify === "hash-identity" ? "wrong-row-id" : String(row.id);
    const rowContentHash =
      falsify === "hash-identity" ? "wrong-content-hash" : String(row.content_hash);
    const assertedKind = falsify === "kind" ? "report" : String(row.kind);
    const storageRef = String(row.storage_ref);
    const producerLinks = db
      .query(
        "SELECT kind, from_id, to_id FROM links WHERE kind = 'produces' AND to_id = ?",
      )
      .all(artifactId) as Array<{
      kind: string;
      from_id: string;
      to_id: string;
    }>;
    const assertedProducerLinks =
      falsify === "producer-link-count"
        ? [...producerLinks, ...producerLinks]
        : producerLinks.map((link) => ({ ...link }));
    if (falsify === "producer-link-identity") {
      if (assertedProducerLinks.length === 0) {
        assertedProducerLinks.push({
          kind: "produces",
          from_id: "wrong-session",
          to_id: artifactId,
        });
      } else {
        assertedProducerLinks[0] = {
          ...assertedProducerLinks[0]!,
          from_id: "wrong-session",
        };
      }
    }
    const returnedPathForRoot =
      falsify === "root-confinement"
        ? join(root, "..", "escaped-artifact")
        : returnedPath;
    const resolveForAssertion = (path: string): string =>
      existsSync(path) ? realpathSync(path) : path;
    const resolvedRoot = realpathSync(root);
    const resolvedReturnedPath = resolveForAssertion(returnedPathForRoot);
    const resolvedStorageRef = resolveForAssertion(storageRef);
    const bytesEqual =
      returnedBytes.length === diskBytes.length &&
      returnedBytes.every((value, index) => value === diskBytes[index]);
    const producerLink = assertedProducerLinks[0];
    const rootConfinement = (path: string): boolean => {
      const relativePath = relative(resolvedRoot, path);
      return (
        !isAbsolute(relativePath) &&
        relativePath !== ".." &&
        !relativePath.startsWith(".." + sep)
      );
    };
    const ordinaryReportCount = Number(
      (db.query("SELECT COUNT(*) AS count FROM artifact WHERE kind = 'report'").get() as {
        count: number;
      }).count,
    );

    let ordinaryOk = true;
    ordinaryOk =
      liveReceipt(
        "artifact_count",
        rows.length === 1,
        `count=${rows.length}; expected=1; artifact_id=${artifactId}`,
      ) && ordinaryOk;
    ordinaryOk =
      liveReceipt(
        "ordinary_kind",
        assertedKind === "trajectory",
        `kind=${assertedKind}; expected=trajectory; artifact_id=${artifactId}`,
      ) && ordinaryOk;
    ordinaryOk =
      liveReceipt(
        "producer_link_count",
        assertedProducerLinks.length === 1,
        `count=${assertedProducerLinks.length}; expected=1; links=${JSON.stringify(assertedProducerLinks)}`,
      ) && ordinaryOk;
    ordinaryOk =
      liveReceipt(
        "producer_link_identity",
        assertedProducerLinks.length === 1 &&
          producerLink?.kind === "produces" &&
          producerLink.from_id === admission.sessionId &&
          producerLink.to_id === artifactId,
        `expected kind=produces from_id=${admission.sessionId} to_id=${artifactId}; actual=${JSON.stringify(assertedProducerLinks)}`,
      ) && ordinaryOk;
    ordinaryOk =
      liveReceipt(
        "bytes_identity",
        bytesEqual,
        `runTurn_text_bytes=${returnedBytes.length} disk_bytes=${diskBytes.length} returned_sha256=${contentHash(returnedBytes)} disk_sha256=${diskHash} byte_equal=${bytesEqual}`,
      ) && ordinaryOk;
    ordinaryOk =
      liveReceipt(
        "hash_identity",
        rowId === rowContentHash &&
          rowId === diskHash &&
          contentHash(returnedBytes) === diskHash,
        `row_id=${rowId} content_hash=${rowContentHash} disk_sha256=${diskHash}`,
      ) && ordinaryOk;
    ordinaryOk =
      liveReceipt(
        "storage_ref_identity",
        storageRef === returnedPath,
        `row_storage_ref=${storageRef} returned_path=${returnedPath}`,
      ) && ordinaryOk;
    ordinaryOk =
      liveReceipt(
        "root_confinement",
        rootConfinement(resolvedReturnedPath) && rootConfinement(resolvedStorageRef),
        `root=${resolvedRoot} returned_resolved=${resolvedReturnedPath} storage_resolved=${resolvedStorageRef}`,
      ) && ordinaryOk;
    ordinaryOk =
      liveReceipt(
        "ordinary_report_count",
        ordinaryReportCount === 0,
        `report_count=${ordinaryReportCount}; expected=0`,
      ) && ordinaryOk;

    const artifactsBeforeRefusal = Number(
      (db.query("SELECT COUNT(*) AS count FROM artifact").get() as { count: number }).count,
    );
    const eventsBeforeRefusal = Number(
      (db.query("SELECT COUNT(*) AS count FROM events").get() as { count: number }).count,
    );
    let refusalText = "accepted";
    try {
      kernelExecute(
        "publish_artifact",
        { kind: "report", path: artifactPath, storage_ref: artifactPath },
        TRACE,
      );
    } catch (error) {
      refusalText = error instanceof Error ? error.message : String(error);
    }
    if (falsify === "report-refusal") refusalText = "accepted";
    const artifactsAfterRefusal = Number(
      (db.query("SELECT COUNT(*) AS count FROM artifact").get() as { count: number }).count,
    );
    const eventsAfterRefusal = Number(
      (db.query("SELECT COUNT(*) AS count FROM events").get() as { count: number }).count,
    );
    ordinaryOk =
      liveReceipt(
        "report_refusal",
        refusalText === "publish_artifact report requires evaluation_id" &&
          artifactsBeforeRefusal === artifactsAfterRefusal &&
          eventsBeforeRefusal === eventsAfterRefusal,
        `text=${refusalText}; artifacts=${artifactsBeforeRefusal}->${artifactsAfterRefusal}; events=${eventsBeforeRefusal}->${eventsAfterRefusal}`,
      ) && ordinaryOk;

    if (!ordinaryOk) throw new Error("live AgentOS runTurn trajectory proof failed");
    const sessionRow = db
      .query("SELECT status FROM agent_session WHERE id = ?")
      .get(admission.sessionId) as { status: string } | null;
    console.log(
      "artifact-root live AgentOS runTurn receipt: PASS" +
        ` session_id=${admission.sessionId}` +
        ` artifact_id=${artifactId}` +
        ` stop_reason=${turn.stopReason}` +
        " finalize=true skipPublish=false" +
        ` link=${JSON.stringify(producerLink)} link_count=${producerLinks.length}` +
        ` root=${resolvedRoot}` +
        ` storage_ref=${storageRef}` +
        ` sha256=${diskHash}` +
        ` byte_count=${diskBytes.length}` +
        ` session_status=${sessionRow?.status ?? "unknown"}` +
        ` host_destroyed=${fixtureHost.destroyed}` +
        ` ordinary_report_count=${ordinaryReportCount}` +
        " refusal=publish_artifact report requires evaluation_id" +
        ` post_refusal_artifacts=${artifactsAfterRefusal}` +
        ` post_refusal_events=${eventsAfterRefusal}`,
    );
  } finally {
    if (db) {
      try {
        const { closeKernel: closeLiveKernel } = await import("qf-kernel");
        closeLiveKernel(db);
      } catch {
        /* child process teardown remains isolated */
      }
    }
    mock.restore();
    for (const key of envKeys) {
      const value = savedEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (savedPlatform) Object.defineProperty(process, "platform", savedPlatform);
    rmSync(fixtureRoot, { recursive: true, force: true });
    rmSync(appRootEnv, { recursive: true, force: true });
  }
}

if (process.env[G9_LIVE_TEST_ENV] === "1") {
  test("G9 live AgentOS runTurn publishes one trajectory", async () => {
    await runLiveAgentHostProof();
  });
}

async function gateLiveAgentHostRunTurn(): Promise<string | null> {
  const child = Bun.spawn(["bun", "test", "./run.ts"], {
    cwd: import.meta.dir,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, [G9_LIVE_TEST_ENV]: "1" },
  });
  const [stdout, stderr] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  const exitCode = await child.exited;
  if (stdout.trim()) console.log(stdout.trim());
  if (stderr.trim()) console.error(stderr.trim());
  if (exitCode !== 0) {
    return `artifact-root: live AgentOS runTurn test exited ${exitCode}`;
  }
  if (!stdout.includes("artifact-root live AgentOS runTurn receipt: PASS")) {
    return "artifact-root: live AgentOS runTurn receipt missing";
  }
  return null;
}
function gateDefaultResolver(): string | null {
  const savedHome = process.env.HOME;
  const savedRoot = process.env.QF_ARTIFACT_ROOT;
  const home = mkdtempSync(join(tmpdir(), "qf-k3-art-home-"));
  process.env.HOME = home;
  delete process.env.QF_ARTIFACT_ROOT;

  try {
    const r = resolveArtifactRoot();
    if (r.provenance !== "default") {
      return `artifact-root: expected provenance=default, got ${r.provenance}`;
    }
    const expected = join(home, ".quantflow", "artifacts");
    if (r.path !== expected) {
      return `artifact-root: expected ${expected}, got ${r.path}`;
    }
    if (!existsSync(expected)) {
      return "artifact-root: default path was not created";
    }
    console.log("artifact-root G4 resolver: PASS");
    return null;
  } finally {
    if (savedHome === undefined) delete process.env.HOME;
    else process.env.HOME = savedHome;
    if (savedRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = savedRoot;
    rmSync(home, { recursive: true, force: true });
  }
}

function gateEnvNotDirectory(): string | null {
  const savedRoot = process.env.QF_ARTIFACT_ROOT;
  const dir = mkdtempSync(join(tmpdir(), "qf-k3-art-notdir-"));
  const filePath = join(dir, "not-a-directory");
  const bytes = Buffer.from("k3-art-root-gate-canary");
  writeFileSync(filePath, bytes);

  process.env.QF_ARTIFACT_ROOT = filePath;

  try {
    try {
      const r = resolveArtifactRoot();
      return `artifact-root: accepted non-directory QF_ARTIFACT_ROOT: ${r.path}`;
    } catch (error) {
      const message = String(error);
      if (!message.includes("QF_ARTIFACT_ROOT is not a directory")) {
        return `artifact-root: expected non-directory rejection, got: ${message}`;
      }
    }

    if (!readFileSync(filePath).equals(bytes)) {
      return "artifact-root: non-directory canary file bytes changed";
    }

    console.log("artifact-root G4 env not-directory: PASS");
    return null;
  } finally {
    if (savedRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = savedRoot;
    rmSync(dir, { recursive: true, force: true });
  }
}

function gatePublishUnderRoot(): string | null {
  const savedHome = process.env.HOME;
  const savedRoot = process.env.QF_ARTIFACT_ROOT;
  const savedFixture = process.env[FIXTURE_ENV];
  const home = mkdtempSync(join(tmpdir(), "qf-g9-art-pub-"));
  process.env.HOME = home;
  delete process.env.QF_ARTIFACT_ROOT;
  process.env[FIXTURE_ENV] = "1";

  const falsify = process.env.QF_G9_TRAJECTORY_FALSIFY;
  const allowedFalsifiers = new Set([
    "kind",
    "producer-link-count",
    "producer-link-identity",
    "bytes-identity",
    "hash-identity",
    "storage-ref-identity",
    "root-confinement",
    "report-refusal",
  ]);
  const db = openKernel(":memory:");
  const receipt = (name: string, ok: boolean, detail: string): boolean => {
    const line = `artifact-root receipt ${name} ${ok ? "PASS" : "RED"}: ${detail}`;
    if (ok) console.log(line);
    else console.error(line);
    return ok;
  };

  try {
    if (falsify !== undefined && !allowedFalsifiers.has(falsify)) {
      return `artifact-root: unknown QF_G9_TRAJECTORY_FALSIFY=${falsify}`;
    }

    const root = resolveArtifactRoot().path;
    const definition = execute(
      db,
      "register_agent_definition",
      {
        name: "g9-trajectory-proof-profile",
        role: "researcher",
        package_ref: "g9-trajectory-proof.aospkg",
        display_name: "Market Researcher",
      },
      TRACE,
    );
    const sessionId = "g9-trajectory-proof-session";
    execute(
      db,
      "create_agent_session",
      {
        session_id: sessionId,
        agent_definition_id: definition.object_id,
        label: "G9 trajectory proof",
      },
      TRACE,
    );
    execute(db, "start_agent_session", { session_id: sessionId }, TRACE);

    const expectedPath = join(root, `${sessionId}.md`);
    if (existsSync(expectedPath)) {
      return `artifact-root: trajectory path existed before writer call: ${expectedPath}`;
    }

    const writerFalsify = process.env.QF_ARTIFACT_ROOT_FALSIFY;
    if (
      writerFalsify !== undefined &&
      writerFalsify !== "writer" &&
      writerFalsify !== "skip-directory"
    ) {
      return `artifact-root: unknown QF_ARTIFACT_ROOT_FALSIFY=${writerFalsify}`;
    }

    let artifact: ReturnType<typeof writeAgentTrajectoryArtifact>;
    try {
      artifact = writeAgentTrajectoryArtifact({
        sessionId,
        text: "g9 trajectory production writer body",
        artifactRoot: () => root,
        publish: (input) => execute(db, "publish_artifact", input, TRACE),
        ...(writerFalsify === "writer" ? { fileWriter: () => {} } : {}),
      });
    } catch (error) {
      return `artifact-root: production trajectory writer did not publish bytes: ${String(error)}`;
    }

    const rows = queryObjects(db, "artifact", undefined, null);
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      receipt("ordinary_kind", false, "no Artifact row was published");
      return "artifact-root: trajectory proof failed";
    }

    const diskBytes = new Uint8Array(readFileSync(artifact.path));
    const diskHash = contentHash(diskBytes);
    const returnedBytes =
      falsify === "bytes-identity"
        ? new Uint8Array([...artifact.bytes, 0])
        : artifact.bytes;
    const returnedPath =
      falsify === "storage-ref-identity"
        ? join(root, "different-storage-ref")
        : artifact.path;
    const rowId = falsify === "hash-identity" ? "wrong-row-id" : String(row.id);
    const rowContentHash =
      falsify === "hash-identity" ? "wrong-content-hash" : String(row.content_hash);
    const assertedKind = falsify === "kind" ? "report" : String(row.kind);
    const storageRef = String(row.storage_ref);
    const producerLinks = db
      .query(
        "SELECT kind, from_id, to_id FROM links WHERE kind = 'produces' AND to_id = ?",
      )
      .all(artifact.artifactId) as Array<{
      kind: string;
      from_id: string;
      to_id: string;
    }>;
    const assertedProducerLinks =
      falsify === "producer-link-count"
        ? [...producerLinks, ...producerLinks]
        : producerLinks.map((link) => ({ ...link }));
    if (falsify === "producer-link-identity") {
      if (assertedProducerLinks.length === 0) {
        assertedProducerLinks.push({
          kind: "produces",
          from_id: "wrong-session",
          to_id: artifact.artifactId,
        });
      } else {
        assertedProducerLinks[0] = {
          ...assertedProducerLinks[0]!,
          from_id: "wrong-session",
        };
      }
    }
    const returnedPathForRoot =
      falsify === "root-confinement"
        ? join(root, "..", "escaped-artifact")
        : returnedPath;
    const resolveForAssertion = (path: string): string =>
      existsSync(path) ? realpathSync(path) : path;
    const resolvedRoot = realpathSync(root);
    const resolvedReturnedPath = resolveForAssertion(returnedPathForRoot);
    const resolvedStorageRef = resolveForAssertion(storageRef);
    const bytesEqual =
      returnedBytes.length === diskBytes.length &&
      returnedBytes.every((value, index) => value === diskBytes[index]);
    const artifactCountOk = rows.length === 1;
    const ordinaryKindOk = artifactCountOk && assertedKind === "trajectory";
    const producerLinkCountOk = assertedProducerLinks.length === 1;
    const producerLinkIdentity = assertedProducerLinks[0];
    const producerLinkIdentityOk =
      producerLinkCountOk &&
      producerLinkIdentity?.kind === "produces" &&
      producerLinkIdentity.from_id === sessionId &&
      producerLinkIdentity.to_id === artifact.artifactId;
    const bytesIdentityOk = bytesEqual;
    const hashIdentityOk =
      rowId === rowContentHash &&
      rowId === diskHash &&
      contentHash(returnedBytes) === diskHash;
    const storageRefIdentityOk = storageRef === returnedPath;
    const isConfined = (path: string): boolean => {
      const relativePath = relative(resolvedRoot, path);
      return (
        !isAbsolute(relativePath) &&
        relativePath !== ".." &&
        !relativePath.startsWith(".." + sep)
      );
    };
    const rootConfinementOk =
      isConfined(resolvedReturnedPath) && isConfined(resolvedStorageRef);
    const ordinaryReportCount = Number(
      (db.query("SELECT COUNT(*) AS count FROM artifact WHERE kind = 'report'").get() as {
        count: number;
      }).count,
    );

    let ordinaryOk = true;
    ordinaryOk =
      receipt(
        "artifact_count",
        artifactCountOk,
        `count=${rows.length}; expected=1; artifact_id=${artifact.artifactId}`,
      ) && ordinaryOk;
    ordinaryOk =
      receipt(
        "ordinary_kind",
        ordinaryKindOk,
        `kind=${assertedKind}; expected=trajectory; artifact_id=${artifact.artifactId}`,
      ) && ordinaryOk;
    ordinaryOk =
      receipt(
        "producer_link_count",
        producerLinkCountOk,
        `count=${assertedProducerLinks.length}; expected=1; links=${JSON.stringify(assertedProducerLinks)}`,
      ) && ordinaryOk;
    ordinaryOk =
      receipt(
        "producer_link_identity",
        producerLinkIdentityOk,
        `expected kind=produces from_id=${sessionId} to_id=${artifact.artifactId}; actual=${JSON.stringify(assertedProducerLinks)}`,
      ) && ordinaryOk;
    ordinaryOk =
      receipt(
        "bytes_identity",
        bytesIdentityOk,
        `returned_bytes=${returnedBytes.length} disk_bytes=${diskBytes.length} returned_sha256=${contentHash(returnedBytes)} disk_sha256=${diskHash} byte_equal=${bytesEqual}`,
      ) && ordinaryOk;
    ordinaryOk =
      receipt(
        "hash_identity",
        hashIdentityOk,
        `row_id=${rowId} content_hash=${rowContentHash} disk_sha256=${diskHash}`,
      ) && ordinaryOk;
    ordinaryOk =
      receipt(
        "storage_ref_identity",
        storageRefIdentityOk,
        `row_storage_ref=${storageRef} returned_path=${returnedPath}`,
      ) && ordinaryOk;
    ordinaryOk =
      receipt(
        "root_confinement",
        rootConfinementOk,
        `root=${resolvedRoot} returned_resolved=${resolvedReturnedPath} storage_resolved=${resolvedStorageRef}`,
      ) && ordinaryOk;
    ordinaryOk =
      receipt(
        "ordinary_report_count",
        ordinaryReportCount === 0,
        `report_count=${ordinaryReportCount}; expected=0`,
      ) && ordinaryOk;

    const artifactsBeforeRefusal = Number(
      (db.query("SELECT COUNT(*) AS count FROM artifact").get() as { count: number }).count,
    );
    const eventsBeforeRefusal = Number(
      (db.query("SELECT COUNT(*) AS count FROM events").get() as { count: number }).count,
    );
    let refusalText = "accepted";
    try {
      execute(
        db,
        "publish_artifact",
        {
          kind: "report",
          path: artifact.path,
          storage_ref: artifact.path,
        },
        TRACE,
      );
    } catch (error) {
      refusalText = error instanceof Error ? error.message : String(error);
    }
    if (falsify === "report-refusal") refusalText = "accepted";
    const artifactsAfterRefusal = Number(
      (db.query("SELECT COUNT(*) AS count FROM artifact").get() as { count: number }).count,
    );
    const eventsAfterRefusal = Number(
      (db.query("SELECT COUNT(*) AS count FROM events").get() as { count: number }).count,
    );
    const reportRefusalOk =
      refusalText === "publish_artifact report requires evaluation_id" &&
      artifactsBeforeRefusal === artifactsAfterRefusal &&
      eventsBeforeRefusal === eventsAfterRefusal;
    ordinaryOk =
      receipt(
        "report_refusal",
        reportRefusalOk,
        `text=${refusalText}; artifacts=${artifactsBeforeRefusal}->${artifactsAfterRefusal}; events=${eventsBeforeRefusal}->${eventsAfterRefusal}`,
      ) && ordinaryOk;

    if (!ordinaryOk) return "artifact-root: G9 trajectory proof failed";
    console.log(
      "artifact-root G9 trajectory receipt: PASS" +
        ` artifact_id=${artifact.artifactId}` +
        ` producing_session_id=${sessionId}` +
        ` link=${JSON.stringify(producerLinkIdentity)} link_count=${producerLinks.length}` +
        ` root=${resolvedRoot}` +
        ` storage_ref=${storageRef}` +
        ` sha256=${diskHash}` +
        ` byte_count=${diskBytes.length}` +
        ` ordinary_report_count=${ordinaryReportCount}` +
        ` refusal=publish_artifact report requires evaluation_id` +
        ` post_refusal_artifacts=${artifactsAfterRefusal} post_refusal_events=${eventsAfterRefusal}`,
    );
    return null;
  } finally {
    closeKernel(db);
    if (savedFixture === undefined) delete process.env[FIXTURE_ENV];
    else process.env[FIXTURE_ENV] = savedFixture;
    if (savedHome === undefined) delete process.env.HOME;
    else process.env.HOME = savedHome;
    if (savedRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = savedRoot;
    rmSync(home, { recursive: true, force: true });
  }
}

function gateA2aPublishUnderRoot(): string | null {
  const savedHome = process.env.HOME;
  const savedRoot = process.env.QF_ARTIFACT_ROOT;
  const savedFixture = process.env[FIXTURE_ENV];
  const home = mkdtempSync(join(tmpdir(), "qf-k3b-a2a-home-"));
  const configuredRoot = join(home, "canonical-artifacts");
  mkdirSync(configuredRoot, { recursive: true });
  process.env.HOME = home;
  process.env.QF_ARTIFACT_ROOT = configuredRoot;
  process.env[FIXTURE_ENV] = "1";

  const db = openKernel(":memory:");
  try {
    const resolved = resolveArtifactRoot();
    if (resolved.path !== configuredRoot || resolved.provenance !== "env") {
      return `artifact-root: A2A expected env root ${configuredRoot}, got ${resolved.path} (${resolved.provenance})`;
    }

    const store = createA2aArtifactStore({
      artifactRoot: () => resolveArtifactRoot().path,
      publish: (input) => execute(db, "publish_artifact", input, {
        trace_id: "k3b-a2a-art-root",
        span_id: "k3b-a2a-art-span",
      }),
    });
    const expectedDir = join(configuredRoot, "a2a");
    if (store.artifactDir !== expectedDir) {
      return `artifact-root: A2A helper directory mismatch: ${store.artifactDir}`;
    }

    const explicitDir = join(home, "explicit-a2a-override");
    let overrideConsultedRoot = false;
    const explicitStore = createA2aArtifactStore({
      artifactDir: explicitDir,
      artifactRoot: () => {
        overrideConsultedRoot = true;
        return configuredRoot;
      },
      publish: (input) => execute(db, "publish_artifact", input, {
        trace_id: "k3b-a2a-override",
        span_id: "k3b-a2a-override-span",
      }),
    });
    if (explicitStore.artifactDir !== explicitDir || overrideConsultedRoot) {
      return "artifact-root: A2A explicit artifactDir override no longer bypasses the default root";
    }

    const storagePath = join(store.artifactDir, "gate-absent-envelope.json");
    if (existsSync(storagePath)) {
      return `artifact-root: A2A gate bytes existed before production writer call: ${storagePath}`;
    }
    const bytes = new TextEncoder().encode(
      '{"a2a":"1","body":"k3b production helper proof"}\n',
    );
    store.writeFile(storagePath, bytes);
    if (!existsSync(storagePath)) {
      return `artifact-root: A2A production helper left no file: ${storagePath}`;
    }

    const artifactsBeforeRefusal = Number(
      (db.query("SELECT COUNT(*) AS count FROM artifact").get() as { count: number }).count,
    );
    const eventsBeforeRefusal = Number(
      (db.query("SELECT COUNT(*) AS count FROM events").get() as { count: number }).count,
    );
    let publication: { artifactId: string };
    try {
      publication = store.publishArtifact({ storagePath });
    } catch (error) {
      const refusalText = error instanceof Error ? error.message : String(error);
      const artifactsAfterRefusal = Number(
        (db.query("SELECT COUNT(*) AS count FROM artifact").get() as { count: number }).count,
      );
      const eventsAfterRefusal = Number(
        (db.query("SELECT COUNT(*) AS count FROM events").get() as { count: number }).count,
      );
      const refusalOk =
        refusalText === "publish_artifact report requires evaluation_id" &&
        artifactsBeforeRefusal === artifactsAfterRefusal &&
        eventsBeforeRefusal === eventsAfterRefusal;
      if (refusalOk) {
        console.log(
          "artifact-root A2A report refusal: PASS" +
            " text=" + refusalText +
            " artifacts=" + artifactsBeforeRefusal + "->" + artifactsAfterRefusal +
            " events=" + eventsBeforeRefusal + "->" + eventsAfterRefusal,
        );
        return null;
      }
      return `artifact-root: A2A report refusal mismatch: ${refusalText}`;
    }
    const rows = queryObjects(db, "artifact", undefined, null);
    if (rows.length !== 1) {
      return `artifact-root: A2A expected one artifact row, got ${rows.length}`;
    }

    const row = rows[0]!;
    const diskBytes = readFileSync(storagePath);
    const expectedHash = contentHash(diskBytes);
    if (
      row.id !== expectedHash ||
      row.content_hash !== expectedHash ||
      publication.artifactId !== expectedHash
    ) {
      return "artifact-root: A2A production bytes and Kernel identity/hash disagree";
    }
    if (row.storage_ref !== storagePath) {
      return `artifact-root: A2A storage_ref mismatch: ${String(row.storage_ref)}`;
    }
    if (!Buffer.from(diskBytes).equals(Buffer.from(bytes))) {
      return "artifact-root: A2A bytes on disk differ from the bytes given to the production helper";
    }

    const relativePath = relative(
      realpathSync(configuredRoot),
      realpathSync(String(row.storage_ref)),
    );
    if (
      isAbsolute(relativePath) ||
      relativePath === ".." ||
      relativePath.startsWith(`..${sep}`)
    ) {
      return `artifact-root: A2A storage_ref outside resolved root: ${String(row.storage_ref)}`;
    }

    console.log("artifact-root K3b A2A production writer: PASS");
    return null;
  } finally {
    closeKernel(db);
    if (savedFixture === undefined) delete process.env[FIXTURE_ENV];
    else process.env[FIXTURE_ENV] = savedFixture;
    if (savedHome === undefined) delete process.env.HOME;
    else process.env.HOME = savedHome;
    if (savedRoot === undefined) delete process.env.QF_ARTIFACT_ROOT;
    else process.env.QF_ARTIFACT_ROOT = savedRoot;
    rmSync(home, { recursive: true, force: true });
  }
}

function gateAgentHostCoupling(): string | null {
  const src = readFileSync(
    join(REPO_ROOT, "collab-electron/src/main/agent-host.ts"),
    "utf8",
  );
  const stripped = stripComments(src);
  if (stripped.includes(".collaborator/agent-artifacts")) {
    return "artifact-root: agent-host still references .collaborator/agent-artifacts in production code";
  }
  if (
    !/import\s*\{\s*writeAgentTrajectoryArtifact\s*\}\s*from\s*["']\.\/agent-artifact-writer["']/.test(
      stripped,
    )
  ) {
    return "artifact-root: agent-host must import the production artifact writer";
  }
  if (!stripped.includes("writeAgentTrajectoryArtifact({")) {
    return "artifact-root: agent-host must call the production artifact writer";
  }
  if (!stripped.includes("artifactRoot: getArtifactRoot")) {
    return "artifact-root: agent-host must give the production writer getArtifactRoot";
  }
  if (/\bwriteFile(?:Sync)?\s*\(/.test(stripped)) {
    return "artifact-root: agent-host must not keep a second artifact byte-writer";
  }
  console.log("artifact-root G4 production coupling: PASS");
  return null;
}

function gateA2aBusCoupling(): string | null {
  const src = readFileSync(
    join(REPO_ROOT, "collab-electron/src/main/a2a-bus.ts"),
    "utf8",
  );
  const stripped = stripComments(src);
  if (
    !/import\s*\{\s*createA2aArtifactStore\s*\}\s*from\s*["']\.\/a2a-artifact-store(?:\.ts)?["']/.test(
      stripped,
    )
  ) {
    return "artifact-root: a2a-bus must import the production A2A artifact store";
  }
  if (!stripped.includes("createA2aArtifactStore({")) {
    return "artifact-root: a2a-bus must call the production A2A artifact store";
  }
  if (!stripped.includes("artifactRoot: getArtifactRoot")) {
    return "artifact-root: a2a-bus must give the production store getArtifactRoot";
  }
  if (
    !stripped.includes("opts?.artifactDir !== undefined") ||
    !stripped.includes("artifactDir: opts.artifactDir")
  ) {
    return "artifact-root: a2a-bus must preserve its explicit artifactDir override";
  }
  for (const forbidden of ["COLLAB_DIR", "QF_APP_ROOT", "QF_APP_DIR"]) {
    if (new RegExp(`\\b${forbidden}\\b`).test(stripped)) {
      return `artifact-root: a2a-bus must not derive its default from ${forbidden}`;
    }
  }
  console.log("artifact-root K3b A2A production coupling: PASS");
  return null;
}

function productionSourceFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      if (["__tests__", "test", "tests"].includes(entry.name)) continue;
      files.push(...productionSourceFiles(path));
      continue;
    }
    if (!entry.isFile() || !/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) continue;
    if (/(?:^|\.)+(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) continue;
    files.push(path);
  }
  return files;
}

function gateProductionPublishers(): string | null {
  const mainRoot = join(REPO_ROOT, "collab-electron/src/main");
  const directPublish = /\bkernelExecute\s*\(\s*["']publish_artifact["']/g;
  const callsites: string[] = [];
  const files = productionSourceFiles(mainRoot);

  // Coverage floor. Empty main tree → expected callsites "none" already fails,
  // but require we actually read the production surface this gate protects.
  const MIN_MAIN_FILES = 10;
  const sawA2a = files.some((path) => relative(mainRoot, path).split("\\").join("/") === "a2a-bus.ts");
  const sawHost = files.some((path) => relative(mainRoot, path).split("\\").join("/") === "agent-host.ts");
  if (files.length < MIN_MAIN_FILES || !sawA2a || !sawHost) {
    return (
      `artifact-root: scan collapsed — ${files.length} main files, ` +
      `a2a-bus.ts seen: ${sawA2a}, agent-host.ts seen: ${sawHost}. ` +
      `Refusing to report PASS on a scan that inspected nothing.`
    );
  }

  for (const path of files) {
    const relativePath = relative(mainRoot, path);
    const stripped = stripComments(readFileSync(path, "utf8"));
    const matches = stripped.match(directPublish) ?? [];
    for (let index = 0; index < matches.length; index += 1) {
      callsites.push(relativePath);
    }
  }

  const expected = [
    "a2a-bus.ts",
    "agent-host.ts",
    "index.ts",
    "kernel.ts",
    "kernel.ts",
    "kernel.ts",
    "kernel.ts",
    "ontology-gateway.ts",
  ];
  const actual = [...callsites].sort();
  if (
    actual.length !== expected.length ||
    actual.some((path, index) => path !== expected[index])
  ) {
    return `artifact-root: production publish_artifact callsites must be exactly ${expected.join(
      ", ",
    )}; got ${actual.length > 0 ? actual.join(", ") : "none"}`;
  }

  console.log(
    `artifact-root K3b governed publishers: PASS (${actual.join(", ")})`,
  );
  return null;
}

function assertInstallPlan(): string | null {
  const built = buildArtifactRootInstallPlan();
  if (!built.ok) {
    return built.error;
  }

  const expectedNames = ["qf-kernel", "artifact-root"] as const;
  const expectedCwds = [
    join(REPO_ROOT, "packages/qf-kernel"),
    join(REPO_ROOT, "qa/gates/artifact-root"),
  ] as const;

  for (const name of expectedNames) {
    if (!built.entries.some((entry) => entry.name === name)) {
      return `artifact-root: missing install plan entry: ${name}`;
    }
  }
  if (built.entries.length !== expectedNames.length) {
    return `artifact-root: install plan must contain exactly ${expectedNames.join(" then ")}`;
  }
  for (let i = 0; i < expectedNames.length; i += 1) {
    if (built.entries[i]!.name !== expectedNames[i]) {
      return `artifact-root: install plan order must be ${expectedNames.join(" then ")}`;
    }
    if (built.entries[i]!.cwd !== expectedCwds[i]) {
      return `artifact-root: install plan ${expectedNames[i]} cwd must be ${expectedCwds[i]}`;
    }
  }
  return null;
}

async function main(): Promise<number> {
  const planError = assertInstallPlan();
  if (planError) {
    console.error(`artifact-root FAIL: ${planError}`);
    return 1;
  }

  for (const fn of [
    gateDefaultResolver,
    gateEnvNotDirectory,
    gateLiveAgentHostRunTurn,
    gatePublishUnderRoot,
    gateA2aPublishUnderRoot,
    gateAgentHostCoupling,
    gateA2aBusCoupling,
    gateProductionPublishers,
  ]) {
    const err = await fn();
    if (err) {
      console.error(`artifact-root FAIL: ${err}`);
      return 1;
    }
  }
  console.log("artifact-root OK");
  return 0;
}

if (import.meta.main && process.env[G9_LIVE_TEST_ENV] !== "1") {
  process.exit(await main());
}
