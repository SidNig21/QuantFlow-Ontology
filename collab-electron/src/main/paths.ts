import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { posix, win32 } from "node:path";

export interface QuantFlowPathOptions {
  home: string;
  platform: NodeJS.Platform;
  isDev: boolean;
  worktreeRoot: string;
  appRootOverride?: string;
  appDirOverride?: string;
}

function normalizeWindowsPath(
  path: string,
  platform: NodeJS.Platform,
): string {
  if (platform !== "win32") return path;
  if (path.startsWith("\\\\?\\UNC\\")) {
    return `\\\\${path.slice("\\\\?\\UNC\\".length)}`;
  }
  if (path.startsWith("\\\\?\\")) {
    return path.slice("\\\\?\\".length);
  }
  return path;
}

function getDevWorktreeId(root: string): string {
  return createHash("sha256")
    .update(root)
    .digest("hex")
    .slice(0, 12);
}

/** Resolve app paths without consulting ambient platform or home state. */
export function resolveQuantFlowPaths(
  options: QuantFlowPathOptions,
): {
  appRoot: string;
  appDir: string;
  devWorktreeId: string | null;
} {
  const pathApi = options.platform === "win32" ? win32 : posix;
  const appRootOverride = options.appRootOverride?.trim();
  const appDirOverride = options.appDirOverride?.trim();
  if (Boolean(appRootOverride) !== Boolean(appDirOverride)) {
    throw new Error("QF_APP_ROOT and QF_APP_DIR must be configured together");
  }
  if (appRootOverride && appDirOverride) {
    if (
      !pathApi.isAbsolute(
        normalizeWindowsPath(appRootOverride, options.platform),
      ) ||
      !pathApi.isAbsolute(
        normalizeWindowsPath(appDirOverride, options.platform),
      )
    ) {
      throw new Error("QF_APP_ROOT and QF_APP_DIR must be absolute paths");
    }
    const appRoot = pathApi.resolve(
      normalizeWindowsPath(appRootOverride, options.platform),
    );
    const appDir = pathApi.resolve(
      normalizeWindowsPath(appDirOverride, options.platform),
    );
    const relativeDir = pathApi.relative(appRoot, appDir);
    if (
      relativeDir === ".." ||
      relativeDir.startsWith(`..${pathApi.sep}`) ||
      pathApi.isAbsolute(relativeDir)
    ) {
      throw new Error("QF_APP_DIR must be contained beneath QF_APP_ROOT");
    }
    return { appRoot, appDir, devWorktreeId: null };
  }
  const appRoot = pathApi.join(options.home, ".quantflow", "app");
  if (!options.isDev) {
    return { appRoot, appDir: appRoot, devWorktreeId: null };
  }

  const worktreeRoot = pathApi.resolve(
    normalizeWindowsPath(options.worktreeRoot, options.platform),
  );
  const devWorktreeId = `worktree-${getDevWorktreeId(worktreeRoot)}`;
  return {
    appRoot,
    appDir: pathApi.join(appRoot, "dev", devWorktreeId),
    devWorktreeId,
  };
}

export function shouldRunLegacyAppMigration(options: {
  appRootOverride?: string;
  appDirOverride?: string;
}): boolean {
  const appRootOverride = options.appRootOverride?.trim();
  const appDirOverride = options.appDirOverride?.trim();
  if (Boolean(appRootOverride) !== Boolean(appDirOverride)) {
    throw new Error("QF_APP_ROOT and QF_APP_DIR must be configured together");
  }
  return !appRootOverride;
}

const appRootOverride = process.env["QF_APP_ROOT"];
const appDirOverride = process.env["QF_APP_DIR"];

const resolvedPaths = resolveQuantFlowPaths({
  home: homedir(),
  platform: process.platform,
  isDev: Boolean(import.meta.env?.DEV),
  worktreeRoot:
    process.env["QF_DEV_WORKTREE_ROOT"] || process.cwd(),
  appRootOverride,
  appDirOverride,
});

/** Explicit app-owned isolation disables compatibility import from founder state. */
export const QF_APP_PATHS_EXPLICIT = !shouldRunLegacyAppMigration({
  appRootOverride,
  appDirOverride,
});

/** Global app state shared by packaged and worktree-isolated launches. */
export const QF_APP_ROOT = resolvedPaths.appRoot;

/** Launch-local app state; development builds are isolated per worktree. */
export const QF_APP_DIR = resolvedPaths.appDir;

export const DEV_WORKTREE_ID = resolvedPaths.devWorktreeId;
