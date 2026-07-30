import { describe, expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executePackageClosureMode } from "./executors.ts";
import type { InspectionModules } from "./lazy-loader.ts";
import { resolvePackageClosureMode } from "./modes.ts";

const UPGRADE_PATH =
  "node_modules/qf-kernel-schema/golden/upgrades/0001-agent-profile-identity.sql";
const FAKE_BAIT_ROOT = join(
  tmpdir(),
  `qf-package-closure-bait-test-${process.pid}`,
);

function fakeModules(): InspectionModules {
  return {
    loadLinuxFileSets: () => [],
    validatePackageReceipt: () => ({
      ok: true,
      receipt: {
        runId: "run",
        packageRoot: "/pkg",
        logPath: "/log",
        logSha256: "abc",
      },
      resourcesRoot: "/pkg/resources",
    }),
    inspectPackagedResources: (resourcesRoot) =>
      resourcesRoot === join(FAKE_BAIT_ROOT, "resources")
        ? {
            ok: false,
            reason: `missing packaged SQL artifact: ${UPGRADE_PATH}`,
          }
        : { ok: true, checkedPaths: [] },
    preflightLinuxExtraResources: () => ({ ok: true, fileSets: [] }),
    copyPackageForBait: () => FAKE_BAIT_ROOT,
    removeHermesPackage: () => {},
    removeD1UpgradeFromAsar: async () => ({
      removed: [UPGRADE_PATH],
      added: [],
    }),
    qfKernelSchemaUpgradePath: UPGRADE_PATH,
    createPackageRunId: () => "fresh-run",
  };
}

describe("resolvePackageClosureMode", () => {
  test("recognizes the missing-upgrade copied-package bait", () => {
    expect(
      resolvePackageClosureMode({
        releaseRunId: undefined,
        bait: "missing-upgrade",
      }),
    ).toEqual({ kind: "bait", bait: "missing-upgrade" });
  });

  test("rejects unknown bait", () => {
    expect(() =>
      resolvePackageClosureMode({ releaseRunId: undefined, bait: "nope" }),
    ).toThrow(/unknown package-closure bait/);
  });
});

describe("executePackageClosureMode standalone ordering", () => {
  test("install precedes loader; install failure returns without loader", async () => {
    let loaderCalled = false;
    const result = await executePackageClosureMode({
      mode: { kind: "standalone" },
      executors: {
        install: async () => 73,
        build: async () => 0,
        packageVerify: async () => 0,
      },
      loadInspectionModules: () => {
        loaderCalled = true;
        return Promise.resolve(fakeModules());
      },
    });

    expect(result.code).toBe(73);
    expect(result.trace.install).toBe(1);
    expect(result.trace.build).toBe(0);
    expect(result.trace.packageVerify).toBe(0);
    expect(result.trace.inspect).toBe(0);
    expect(result.trace.loaderCalls).toBe(0);
    expect(loaderCalled).toBe(false);
  });

  test("standalone success runs install, build, package, and copied-ASAR control", async () => {
    const result = await executePackageClosureMode({
      mode: { kind: "standalone" },
      executors: {
        install: async () => 0,
        build: async () => 0,
        packageVerify: async () => 0,
      },
      loadInspectionModules: () => Promise.resolve(fakeModules()),
    });

    expect(result.code).toBe(0);
    expect(result.trace).toEqual({
      install: 1,
      build: 1,
      packageVerify: 1,
      inspect: 2,
      preflight: 0,
      loaderCalls: 1,
    });
  });

  test("canonical success requires the copied-package missing-upgrade control", async () => {
    let mutationCalls = 0;
    const result = await executePackageClosureMode({
      mode: { kind: "canonical", runId: "run" },
      loadInspectionModules: () =>
        Promise.resolve({
          ...fakeModules(),
          removeD1UpgradeFromAsar: async () => {
            mutationCalls += 1;
            return { removed: [UPGRADE_PATH], added: [] };
          },
        }),
    });

    expect(result.code).toBe(0);
    expect(result.trace.inspect).toBe(2);
    expect(mutationCalls).toBe(1);
  });

  test("canonical invalid receipt never installs or inspects", async () => {
    const result = await executePackageClosureMode({
      mode: { kind: "canonical", runId: "expected" },
      loadInspectionModules: () =>
        Promise.resolve({
          ...fakeModules(),
          validatePackageReceipt: () => ({
            ok: false,
            reason: "stale package receipt run id",
          }),
        }),
    });

    expect(result.code).toBe(1);
    expect(result.trace.install).toBe(0);
    expect(result.trace.inspect).toBe(0);
  });

  test("missing-hermes bait rejects generic root escape", async () => {
    const result = await executePackageClosureMode({
      mode: { kind: "bait", bait: "missing-hermes" },
      loadInspectionModules: () =>
        Promise.resolve({
          ...fakeModules(),
          inspectPackagedResources: () => ({
            ok: false,
            reason:
              "root escape: inspection must target packaged resources root",
          }),
        }),
    });

    expect(result.code).toBe(1);
    expect(result.reason).toBe(
      "missing-hermes bait expected unresolved hermes reference, got: root escape: inspection must target packaged resources root",
    );
    expect(result.trace.inspect).toBe(1);
    expect(result.trace.install).toBe(0);
    expect(result.trace.build).toBe(0);
    expect(result.trace.packageVerify).toBe(0);
  });

  test("missing-hermes bait accepts unresolved hermes reference", async () => {
    const result = await executePackageClosureMode({
      mode: { kind: "bait", bait: "missing-hermes" },
      loadInspectionModules: () =>
        Promise.resolve({
          ...fakeModules(),
          inspectPackagedResources: () => ({
            ok: false,
            reason: "unresolved hermes reference: missing file",
          }),
        }),
    });

    expect(result.code).toBe(1);
    expect(result.reason).toBe("unresolved hermes reference: missing file");
    expect(result.trace.inspect).toBe(1);
  });

  test("missing-upgrade bait observes the exact missing artifact", async () => {
    const result = await executePackageClosureMode({
      mode: { kind: "bait", bait: "missing-upgrade" },
      loadInspectionModules: () => Promise.resolve(fakeModules()),
    });

    expect(result.code).toBe(1);
    expect(result.reason).toBe(
      `missing packaged SQL artifact: ${UPGRADE_PATH}`,
    );
    expect(result.trace.inspect).toBe(1);
  });

  test("missing-upgrade control rejects any added ASAR inventory path", async () => {
    const result = await executePackageClosureMode({
      mode: { kind: "bait", bait: "missing-upgrade" },
      loadInspectionModules: () =>
        Promise.resolve({
          ...fakeModules(),
          removeD1UpgradeFromAsar: async () => ({
            removed: [UPGRADE_PATH],
            added: ["unexpected.txt"],
          }),
        }),
    });

    expect(result.code).toBe(1);
    expect(result.reason).toContain("added=[unexpected.txt]");
  });
});
