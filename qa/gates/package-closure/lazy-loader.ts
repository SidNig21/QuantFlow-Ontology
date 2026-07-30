/**
 * Lazy loader for collab package inspection modules (RW6).
 * Creating the loader must not resolve heavy module paths.
 */
import { join } from "node:path";

const COLLAB_ROOT = join(import.meta.dir, "../../../collab-electron");

export type InspectionModules = {
  loadLinuxFileSets: typeof import("../../../collab-electron/scripts/package-lib/extra-resources.ts").loadLinuxFileSets;
  validatePackageReceipt: typeof import("../../../collab-electron/scripts/package-lib/package-receipt.ts").validatePackageReceipt;
  inspectPackagedResources: typeof import("../../../collab-electron/scripts/package-lib/package-inspect.ts").inspectPackagedResources;
  preflightLinuxExtraResources: typeof import("../../../collab-electron/scripts/package-lib/preflight.ts").preflightLinuxExtraResources;
  copyPackageForBait: typeof import("../../../collab-electron/scripts/package-lib/package-inspect.ts").copyPackageForBait;
  removeHermesPackage: typeof import("../../../collab-electron/scripts/package-lib/package-inspect.ts").removeHermesPackage;
  removeD1UpgradeFromAsar: typeof import("../../../collab-electron/scripts/package-lib/package-inspect.ts").removeD1UpgradeFromAsar;
  qfKernelSchemaUpgradePath: typeof import("../../../collab-electron/scripts/package-lib/package-inspect.ts").QF_KERNEL_SCHEMA_UPGRADE;
  createPackageRunId: typeof import("../../../collab-electron/scripts/package-lib/run-id.ts").createPackageRunId;
};

export type InspectionModuleLoader = () => Promise<InspectionModules>;

export function createInspectionModuleLoader(): InspectionModuleLoader {
  let memo: Promise<InspectionModules> | null = null;
  return async () => {
    if (!memo) {
      memo = (async () => {
        const [
          extraResources,
          packageReceipt,
          packageInspect,
          preflight,
          runId,
        ] = await Promise.all([
          import("../../../collab-electron/scripts/package-lib/extra-resources.ts"),
          import("../../../collab-electron/scripts/package-lib/package-receipt.ts"),
          import("../../../collab-electron/scripts/package-lib/package-inspect.ts"),
          import("../../../collab-electron/scripts/package-lib/preflight.ts"),
          import("../../../collab-electron/scripts/package-lib/run-id.ts"),
        ]);
        return {
          loadLinuxFileSets: extraResources.loadLinuxFileSets,
          validatePackageReceipt: packageReceipt.validatePackageReceipt,
          inspectPackagedResources: packageInspect.inspectPackagedResources,
          preflightLinuxExtraResources: preflight.preflightLinuxExtraResources,
          copyPackageForBait: packageInspect.copyPackageForBait,
          removeHermesPackage: packageInspect.removeHermesPackage,
          removeD1UpgradeFromAsar: packageInspect.removeD1UpgradeFromAsar,
          qfKernelSchemaUpgradePath: packageInspect.QF_KERNEL_SCHEMA_UPGRADE,
          createPackageRunId: runId.createPackageRunId,
        };
      })();
    }
    return memo;
  };
}

export const COLLAB_ELECTRON_ROOT = COLLAB_ROOT;
