import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { posix, win32 } from "node:path";

export interface QuantFlowPathOptions {
  home: string;
  platform: NodeJS.Platform;
  isDev: boolean;
  worktreeRoot: string;
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

const resolvedPaths = resolveQuantFlowPaths({
  home: homedir(),
  platform: process.platform,
  isDev: import.meta.env?.DEV === true,
  worktreeRoot:
    process.env["QF_DEV_WORKTREE_ROOT"] || process.cwd(),
});

/** Global app state shared by packaged and worktree-isolated launches. */
export const QF_APP_ROOT = resolvedPaths.appRoot;

/** Launch-local app state; development builds are isolated per worktree. */
export const QF_APP_DIR = resolvedPaths.appDir;

export const DEV_WORKTREE_ID = resolvedPaths.devWorktreeId;
