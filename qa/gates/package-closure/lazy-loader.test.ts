import { describe, expect, test } from "bun:test";
import { executePackageClosureMode } from "./executors.ts";
import type { InspectionModules } from "./lazy-loader.ts";
import { resolvePackageClosureMode } from "./modes.ts";

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
    inspectPackagedResources: () => ({ ok: true, checkedPaths: [] }),
    preflightLinuxExtraResources: () => ({ ok: true, fileSets: [] }),
    copyPackageForBait: () => "/bait",
    removeHermesPackage: () => {},
    createPackageRunId: () => "fresh-run",
  };
}

describe("resolvePackageClosureMode", () => {
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

  test("standalone success runs install build package inspect once", async () => {
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
      inspect: 1,
      preflight: 0,
      loaderCalls: 1,
    });
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
});
