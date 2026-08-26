/**
 * Package-closure gate executors with injectable process boundaries (RW1/RW6).
 */
import { rmSync } from "node:fs";
import { join } from "node:path";
import type { PackageClosureMode } from "./modes.ts";
import {
  COLLAB_ELECTRON_ROOT,
  createInspectionModuleLoader,
  type InspectionModules,
  type InspectionModuleLoader,
} from "./lazy-loader.ts";

export type ProcessExecutors = {
  install: () => Promise<number>;
  build: () => Promise<number>;
  packageVerify: (runId: string) => Promise<number>;
};

export type ExecutorTrace = {
  install: number;
  build: number;
  packageVerify: number;
  inspect: number;
  preflight: number;
  loaderCalls: number;
};

export function createDefaultExecutors(): ProcessExecutors {
  const collabRoot = COLLAB_ELECTRON_ROOT;
  return {
    install: async () => {
      const child = Bun.spawn(["bun", "install", "--frozen-lockfile"], {
        cwd: collabRoot,
        stdout: "inherit",
        stderr: "inherit",
      });
      return child.exited;
    },
    build: async () => {
      const child = Bun.spawn(["bun", "run", "build"], {
        cwd: collabRoot,
        stdout: "inherit",
        stderr: "inherit",
      });
      return child.exited;
    },
    packageVerify: async (runId: string) => {
      const child = Bun.spawn(["bun", "run", "package:verify"], {
        cwd: collabRoot,
        stdout: "inherit",
        stderr: "inherit",
        env: {
          ...process.env,
          QF_RELEASE_RUN_ID: runId,
          QF_DOCK_QA_MODE: "1",
        },
      });
      return child.exited;
    },
  };
}

export type ExecuteOptions = {
  mode: PackageClosureMode;
  executors?: ProcessExecutors;
  loadInspectionModules?: InspectionModuleLoader;
  repoRoot?: string;
};

type MissingUpgradeControlResult =
  | { ok: true; observedReason: string }
  | { ok: false; reason: string };

type MissingBootstrapControlResult = MissingUpgradeControlResult;

function runMissingBootstrapControl(
  mods: InspectionModules,
  packageRoot: string,
  fileSets: Parameters<InspectionModules["inspectPackagedResources"]>[2],
): MissingBootstrapControlResult {
  const baitRoot = mods.copyPackageForBait(packageRoot);
  try {
    let inventory;
    try {
      inventory = mods.removeDockProfilesManifest(baitRoot);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        reason: `missing-bootstrap bait mutation failed: ${message}`,
      };
    }
    const exactRemoval =
      inventory.removed.length === 1 &&
      inventory.removed[0] === mods.hermesDockProfilesPath &&
      inventory.added.length === 0;
    if (!exactRemoval) {
      return {
        ok: false,
        reason:
          "missing-bootstrap bait expected exactly one removed manifest path and no additions" +
          `; removed=[${inventory.removed.join(",")}] added=[${inventory.added.join(",")}]`,
      };
    }
    const baitResourcesRoot = join(baitRoot, "resources");
    const inspect = mods.inspectPackagedResources(
      baitResourcesRoot,
      COLLAB_ELECTRON_ROOT,
      fileSets,
      { expectedResourcesRoot: baitResourcesRoot, qaMode: true },
    );
    if (inspect.ok) {
      return { ok: false, reason: "missing-bootstrap bait expected manifest failure" };
    }
    const expectedReason =
      `runtime control file missing: ${mods.hermesDockProfilesPath}`;
    if (inspect.reason !== expectedReason) {
      return {
        ok: false,
        reason:
          `missing-bootstrap bait expected ${expectedReason}, got: ${inspect.reason}`,
      };
    }
    return { ok: true, observedReason: inspect.reason };
  } finally {
    rmSync(baitRoot, { recursive: true, force: true });
  }
}

async function runMissingUpgradeControl(
  mods: InspectionModules,
  packageRoot: string,
  fileSets: Parameters<InspectionModules["inspectPackagedResources"]>[2],
  options: {
    remove: (baitRoot: string) => Promise<{ removed: string[]; added: string[] }>;
    path: string;
    label: string;
  } = {
    remove: (baitRoot) => mods.removeD1UpgradeFromAsar(baitRoot),
    path: mods.qfKernelSchemaUpgradePath,
    label: "missing-upgrade",
  },
): Promise<MissingUpgradeControlResult> {
  const baitRoot = mods.copyPackageForBait(packageRoot);
  try {
    let inventory;
    try {
      inventory = await options.remove(baitRoot);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        reason: `${options.label} bait mutation failed: ${message}`,
      };
    }

    const exactRemoval =
      inventory.removed.length === 1 &&
      inventory.removed[0] === options.path &&
      inventory.added.length === 0;
    if (!exactRemoval) {
      return {
        ok: false,
        reason:
          `${options.label} bait expected exactly one removed upgrade path and no additions` +
          `; removed=[${inventory.removed.join(",")}] added=[${inventory.added.join(",")}]`,
      };
    }

    const baitResourcesRoot = join(baitRoot, "resources");
    const inspect = mods.inspectPackagedResources(
      baitResourcesRoot,
      COLLAB_ELECTRON_ROOT,
      fileSets,
      { expectedResourcesRoot: baitResourcesRoot, qaMode: true },
    );
    if (inspect.ok) {
      return {
        ok: false,
        reason: `${options.label} bait expected missing upgrade SQL failure`,
      };
    }

    const expectedReason =
      `missing packaged SQL artifact: ${options.path}`;
    if (inspect.reason !== expectedReason) {
      return {
        ok: false,
        reason:
          `${options.label} bait expected ${expectedReason}, got: ${inspect.reason}`,
      };
    }
    return { ok: true, observedReason: inspect.reason };
  } finally {
    rmSync(baitRoot, { recursive: true, force: true });
  }
}

export async function executePackageClosureMode(
  options: ExecuteOptions,
): Promise<{ code: number; trace: ExecutorTrace; reason?: string }> {
  const executors = options.executors ?? createDefaultExecutors();
  const loadInspectionModules =
    options.loadInspectionModules ?? createInspectionModuleLoader();
  const repoRoot = options.repoRoot ?? join(COLLAB_ELECTRON_ROOT, "..");
  const trace: ExecutorTrace = {
    install: 0,
    build: 0,
    packageVerify: 0,
    inspect: 0,
    preflight: 0,
    loaderCalls: 0,
  };

  const loadModules = async () => {
    trace.loaderCalls += 1;
    return loadInspectionModules();
  };

  const fail = (reason: string, code = 1) => ({ code, trace, reason });

  switch (options.mode.kind) {
    case "bait": {
      const mods = await loadModules();
      if (options.mode.bait === "preflight-missing") {
        const fileSets = [
          {
            from: ".package-staging/__missing-bait__/nowhere",
            to: "__missing-bait__",
          },
        ];
        trace.preflight += 1;
        const result = mods.preflightLinuxExtraResources(
          COLLAB_ELECTRON_ROOT,
          fileSets,
        );
        if (result.ok) {
          return fail("preflight-missing bait expected preflight failure");
        }
        console.error(`package-closure: ${result.reason}`);
        return { code: 1, trace, reason: result.reason };
      }

      const packageRoot = join(COLLAB_ELECTRON_ROOT, "dist/linux-unpacked");
      const fileSets = mods.loadLinuxFileSets(COLLAB_ELECTRON_ROOT);

      if (options.mode.bait === "missing-hermes") {
        const baitRoot = mods.copyPackageForBait(packageRoot);
        mods.removeHermesPackage(baitRoot);
        const baitResourcesRoot = join(baitRoot, "resources");
        trace.inspect += 1;
        const inspect = mods.inspectPackagedResources(
          baitResourcesRoot,
          COLLAB_ELECTRON_ROOT,
          fileSets,
          { expectedResourcesRoot: baitResourcesRoot, qaMode: true },
        );
        if (inspect.ok) {
          return fail("missing-hermes bait expected unresolved hermes reference");
        }
        if (!inspect.reason.startsWith("runtime control validation failed: Dock profile runtime package missing:")) {
          return fail(
            `missing-hermes bait expected staged Hermes package failure, got: ${inspect.reason}`,
          );
        }
        console.error(`package-closure: ${inspect.reason}`);
        return { code: 1, trace, reason: inspect.reason };
      }

      if (options.mode.bait === "missing-upgrade") {
        trace.inspect += 1;
        const control = await runMissingUpgradeControl(mods, packageRoot, fileSets);
        if (!control.ok) return fail(control.reason);
        console.error(`package-closure: ${control.observedReason}`);
        return { code: 1, trace, reason: control.observedReason };
      }

      if (options.mode.bait === "missing-market-context-upgrade") {
        trace.inspect += 1;
        const control = await runMissingUpgradeControl(mods, packageRoot, fileSets, {
          remove: mods.removeMarketContextUpgradeFromAsar,
          path: mods.qfKernelSchemaMarketContextUpgradePath,
          label: "missing-market-context-upgrade",
        });
        if (!control.ok) return fail(control.reason);
        console.error(`package-closure: ${control.observedReason}`);
        return { code: 1, trace, reason: control.observedReason };
      }

      trace.inspect += 1;
      const inspect = mods.inspectPackagedResources(
        join(packageRoot, "resources"),
        COLLAB_ELECTRON_ROOT,
        fileSets,
        { probeDevRoot: repoRoot, qaMode: true },
      );
      if (inspect.ok) {
        return fail("dev-root bait expected root escape failure");
      }
      console.error(`package-closure: ${inspect.reason}`);
      return { code: 1, trace, reason: inspect.reason };
    }

    case "canonical": {
      const mods = await loadModules();
      const validation = mods.validatePackageReceipt(
        options.mode.runId,
        COLLAB_ELECTRON_ROOT,
      );
      if (!validation.ok) {
        return fail(validation.reason);
      }
      trace.inspect += 1;
      const fileSets = mods.loadLinuxFileSets(COLLAB_ELECTRON_ROOT);
      const inspect = mods.inspectPackagedResources(
        validation.resourcesRoot,
        COLLAB_ELECTRON_ROOT,
        fileSets,
        { qaMode: true },
      );
      if (!inspect.ok) {
        return fail(inspect.reason);
      }
      for (const entry of inspect.checkedPaths) {
        console.log(
          `package-closure: checked ${entry.path} (${entry.bytes} bytes)`,
        );
      }

      trace.inspect += 1;
      const control = await runMissingUpgradeControl(
        mods,
        validation.receipt.packageRoot,
        fileSets,
      );
      if (!control.ok) return fail(control.reason);
      console.log(
        `package-closure: missing-upgrade control observed ${control.observedReason}`,
      );
      trace.inspect += 1;
      const marketContextControl = await runMissingUpgradeControl(
        mods,
        validation.receipt.packageRoot,
        fileSets,
        {
          remove: mods.removeMarketContextUpgradeFromAsar,
          path: mods.qfKernelSchemaMarketContextUpgradePath,
          label: "missing-market-context-upgrade",
        },
      );
      if (!marketContextControl.ok) return fail(marketContextControl.reason);
      console.log(
        `package-closure: missing-market-context-upgrade control observed ${marketContextControl.observedReason}`,
      );
      trace.inspect += 1;
      const bootstrapControl = runMissingBootstrapControl(
        mods,
        validation.receipt.packageRoot,
        fileSets,
      );
      if (!bootstrapControl.ok) return fail(bootstrapControl.reason);
      console.log(
        `package-closure: missing-bootstrap control observed ${bootstrapControl.observedReason}`,
      );
      return { code: 0, trace };
    }

    case "standalone": {
      trace.install += 1;
      const installCode = await executors.install();
      if (installCode !== 0) {
        return fail(`install exited ${installCode}`, installCode);
      }

      const mods = await loadModules();

      trace.build += 1;
      const buildCode = await executors.build();
      if (buildCode !== 0) {
        return fail(`build exited ${buildCode}`, buildCode);
      }

      const runId = mods.createPackageRunId();
      trace.packageVerify += 1;
      const packageCode = await executors.packageVerify(runId);
      if (packageCode !== 0) {
        return fail(`package:verify exited ${packageCode}`, packageCode);
      }

      const validation = mods.validatePackageReceipt(runId, COLLAB_ELECTRON_ROOT);
      if (!validation.ok) {
        return fail(validation.reason);
      }

      trace.inspect += 1;
      const fileSets = mods.loadLinuxFileSets(COLLAB_ELECTRON_ROOT);
      const inspect = mods.inspectPackagedResources(
        validation.resourcesRoot,
        COLLAB_ELECTRON_ROOT,
        fileSets,
        { qaMode: true },
      );
      if (!inspect.ok) {
        return fail(inspect.reason);
      }

      for (const entry of inspect.checkedPaths) {
        console.log(
          `package-closure: checked ${entry.path} (${entry.bytes} bytes)`,
        );
      }

      trace.inspect += 1;
      const control = await runMissingUpgradeControl(
        mods,
        validation.receipt.packageRoot,
        fileSets,
      );
      if (!control.ok) return fail(control.reason);
      console.log(
        `package-closure: missing-upgrade control observed ${control.observedReason}`,
      );
      trace.inspect += 1;
      const marketContextControl = await runMissingUpgradeControl(
        mods,
        validation.receipt.packageRoot,
        fileSets,
        {
          remove: mods.removeMarketContextUpgradeFromAsar,
          path: mods.qfKernelSchemaMarketContextUpgradePath,
          label: "missing-market-context-upgrade",
        },
      );
      if (!marketContextControl.ok) return fail(marketContextControl.reason);
      console.log(
        `package-closure: missing-market-context-upgrade control observed ${marketContextControl.observedReason}`,
      );
      trace.inspect += 1;
      const bootstrapControl = runMissingBootstrapControl(
        mods,
        validation.receipt.packageRoot,
        fileSets,
      );
      if (!bootstrapControl.ok) return fail(bootstrapControl.reason);
      console.log(
        `package-closure: missing-bootstrap control observed ${bootstrapControl.observedReason}`,
      );
      return { code: 0, trace };
    }
  }
}
