import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Database } from "bun:sqlite";

const root = mkdtempSync(join(tmpdir(), "qf-app-lifecycle-"));
const appRoot = join(root, "app-root");
const appDir = join(appRoot, "app");
const artifactRoot = join(root, "artifacts");
const kernelPath = join(root, "kernel.sqlite");
const alternateKernelPath = join(root, "alternate.sqlite");
mkdirSync(artifactRoot, { recursive: true });

const previousEnvironment = {
  QF_APP_ROOT: process.env.QF_APP_ROOT,
  QF_APP_DIR: process.env.QF_APP_DIR,
  QF_ARTIFACT_ROOT: process.env.QF_ARTIFACT_ROOT,
  QF_KERNEL_DB: process.env.QF_KERNEL_DB,
  QF_PEER_BUS_DB: process.env.QF_PEER_BUS_DB,
};
process.env.QF_APP_ROOT = appRoot;
process.env.QF_APP_DIR = appDir;
process.env.QF_ARTIFACT_ROOT = artifactRoot;
process.env.QF_KERNEL_DB = kernelPath;
delete process.env.QF_PEER_BUS_DB;

const kernel = await import("./kernel");

function replaceWithAcceptedLegacyPublicationShape(path: string): void {
  const legacy = new Database(path);
  try {
    legacy.exec("DROP TABLE IF EXISTS qf_review_publication");
    legacy.exec("CREATE TABLE qf_review_publication (source_work_key TEXT PRIMARY KEY NOT NULL, report_artifact_id TEXT NOT NULL, publication_evaluation_id TEXT NOT NULL, created_at TEXT NOT NULL)");
  } finally {
    legacy.close();
  }
}

function restoreEnvironment(): void {
  for (const [key, value] of Object.entries(previousEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("app Kernel handle lifecycle", () => {
  test("refreshes the exact path, refreshes projection reads, and closes idempotently", () => {
    const first = kernel.openAppKernel();
    expect(kernel.getKernelPath()).toBe(kernelPath);

    kernel.kernelExecute("create_mission", {
      mission_id: "mission-kernel-lifecycle",
      name: "Kernel lifecycle",
      objective: "Verify app-owned refresh reads the durable Kernel.",
    }, { trace_id: "kernel-lifecycle-trace", span_id: "kernel-lifecycle-span" });
    const projection = kernel.kernelGetResearchWorldProjection({
      root_type: "mission",
      root_id: "mission-kernel-lifecycle",
    });
    expect(projection.ok).toBe(true);
    if (projection.ok) {
      expect(projection.world.root).toEqual({ type: "mission", id: "mission-kernel-lifecycle" });
      expect(projection.world.current_report_id).toBeNull();
    }

    process.env.QF_KERNEL_DB = alternateKernelPath;
    const second = kernel.refreshAppKernel();
    expect(second).not.toBe(first);
    expect(kernel.getKernelPath()).toBe(kernelPath);
    expect(existsSync(alternateKernelPath)).toBe(false);
    expect(second.query("SELECT 1 AS one").get()).toEqual({ one: 1 });

    const third = kernel.refreshAppKernel();
    expect(third.query("SELECT 1 AS one").get()).toEqual({ one: 1 });
    kernel.closeAppKernel();
    kernel.closeAppKernel();
    expect(() => kernel.getKernelDb()).toThrow("kernel not opened");

    rmSync(kernelPath, { force: true });
    mkdirSync(kernelPath);
    expect(() => kernel.refreshAppKernel()).toThrow();
    rmSync(kernelPath, { recursive: true, force: true });
    const reopened = kernel.openAppKernel();
    expect(kernel.getKernelPath()).toBe(kernelPath);
    expect(reopened.query("SELECT 1 AS one").get()).toEqual({ one: 1 });
    kernel.closeAppKernel();
    kernel.closeAppKernel();
  });

  test("closes the app Kernel after RPC and agent shutdown work", () => {
    const source = readFileSync(join(import.meta.dir, "index.ts"), "utf8");
    const start = source.indexOf("async function shutdownBackgroundServices");
    const end = source.indexOf("\n}\n", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const shutdown = source.slice(start, end + 3);
    expect(shutdown.indexOf("await disposeAgentHost()" )).toBeGreaterThan(-1);
    expect(shutdown.indexOf("stopJsonRpcServer()" )).toBeGreaterThan(shutdown.indexOf("await disposeAgentHost()"));
    expect(shutdown.indexOf("closeAppKernel()" )).toBeGreaterThan(shutdown.indexOf("stopJsonRpcServer()"));
  });

  test("migrates the accepted legacy publication shape before a projection can read it", () => {
    kernel.openAppKernel();
    kernel.kernelExecute("create_mission", {
      mission_id: "mission-legacy-review-shape",
      name: "Legacy review compatibility",
      objective: "Project founder state only after its accepted review schema is current.",
    }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
    kernel.closeAppKernel();

    replaceWithAcceptedLegacyPublicationShape(kernelPath);

    const reopened = kernel.openAppKernel();
    expect(reopened.query("SELECT name FROM pragma_table_info('qf_review_publication') WHERE name = 'authority_key'").get()).toEqual({ name: "authority_key" });
    const projection = kernel.kernelGetResearchWorldProjection({
      root_type: "mission",
      root_id: "mission-legacy-review-shape",
    });
    expect(projection.ok).toBe(true);
    kernel.closeAppKernel();
  });

  test("task surface carries the exact configured runtime profile for a closed seat", () => {
    kernel.openAppKernel();
    kernel.kernelExecute("register_agent_definition", {
      name: "kernel-lifecycle-director",
      role: "orchestrator",
      display_name: "Research Director",
      package_ref: "species/hermes/packed/hermes.aospkg",
      runtime_profile: "default",
      capability_groups: ["desk.orchestrate"],
    }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
    kernel.kernelExecute("create_agent_session", {
      session_id: "kernel-lifecycle-session",
      agent_definition_id: "kernel-lifecycle-director",
    }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
    kernel.kernelExecute("start_agent_session", {
      session_id: "kernel-lifecycle-session",
    }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
    kernel.kernelExecute("close_agent_session", {
      session_id: "kernel-lifecycle-session",
    }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });

    expect(kernel.kernelListTaskSurface().sessions.find((session) =>
      session.id === "kernel-lifecycle-session"
    )).toMatchObject({
      status: "closed",
      definition_id: "kernel-lifecycle-director",
      runtime_profile: "default",
    });
    kernel.closeAppKernel();
  });
});

afterAll(() => {
  kernel.closeAppKernel();
  restoreEnvironment();
  rmSync(root, { recursive: true, force: true });
});
