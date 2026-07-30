/**
 * Injectable packaged-vs-development root selection for species resource resolution.
 * Never infer packaged state from a directory name.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type AppRootInputs = {
  isPackaged: boolean;
  resourcesPath: string | null;
  repoRoot: string;
};

export function defaultRepoRoot(fromModuleUrl: string): string {
  const here = dirname(fileURLToPath(fromModuleUrl));
  return join(here, "../../..");
}

/** Return packaged resources root or the development repository root. */
export function selectAppRoot(inputs: AppRootInputs): string {
  if (inputs.isPackaged) {
    if (!inputs.resourcesPath) {
      throw new Error("selectAppRoot: packaged app requires resourcesPath");
    }
    return inputs.resourcesPath;
  }
  return inputs.repoRoot;
}
