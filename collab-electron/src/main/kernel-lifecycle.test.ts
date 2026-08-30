import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = mkdtempSync(join(tmpdir(), "qf-kernel-lifecycle-"));
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
});

afterAll(() => {
  kernel.closeAppKernel();
  restoreEnvironment();
  rmSync(root, { recursive: true, force: true });
});
