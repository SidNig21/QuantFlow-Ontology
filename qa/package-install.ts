/**
 * Shared cold package-install seam for gates that own a frozen Bun install.
 *
 * Native Windows can fail Bun's default cache-linking backend while copying
 * the local qf-kernel-schema package. The copyfile backend plus isolated
 * linker keeps the install frozen while avoiding that cache-copy EPERM. There
 * is intentionally no retry: a permanent install failure must remain a red
 * gate.
 */

import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

export const FROZEN_PACKAGE_INSTALL_ARGS = [
  "bun",
  "install",
  "--frozen-lockfile",
  "--backend",
  "copyfile",
  "--linker",
  "isolated",
] as const;

export const TYPECHECK_ELECTRON_PACKAGE = "collab-electron" as const;

export const TYPECHECK_ELECTRON_INSTALL_ARGS = [
  "bun",
  "install",
  "--frozen-lockfile",
  "--backend",
  "hardlink",
  "--linker",
  "isolated",
] as const;

type InstallChild = { exited: Promise<number> };
type InstallSpawn = (
  args: readonly string[],
  options: {
    cwd: string;
    stdout: "inherit";
    stderr: "inherit";
  },
) => InstallChild;

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export function packageInstallArgsForTypecheck(
  repoRoot: string,
  cwd: string,
): readonly string[] {
  const repoRelative = relative(resolve(repoRoot), resolve(cwd)).replaceAll("\\", "/");
  return repoRelative === TYPECHECK_ELECTRON_PACKAGE
    ? TYPECHECK_ELECTRON_INSTALL_ARGS
    : FROZEN_PACKAGE_INSTALL_ARGS;
}

/**
 * Bun can leave an empty local file-dependency directory after a Windows
 * CopyFileW/EPERM failure. Remove only those exact generated destinations;
 * never touch Bun's cache or any path outside cwd/node_modules.
 */
function clearStaleLocalFileDependencyDestinations(
  gateName: string,
  cwd: string,
): boolean {
  const packagePath = join(cwd, "package.json");
  if (!existsSync(packagePath)) return true;
  let manifest: PackageManifest;
  try {
    manifest = JSON.parse(readFileSync(packagePath, "utf8")) as PackageManifest;
  } catch (error) {
    console.error(`${gateName}: cannot read package manifest: ${String(error)}`);
    return false;
  }

  const nodeModulesRoot = resolve(cwd, "node_modules");
  const directFileDependencies = new Set<string>();
  for (const section of [
    manifest.dependencies,
    manifest.devDependencies,
    manifest.optionalDependencies,
    manifest.peerDependencies,
  ]) {
    for (const [name, value] of Object.entries(section ?? {})) {
      if (value.startsWith("file:")) directFileDependencies.add(name);
    }
  }

  for (const name of directFileDependencies) {
    const destination = resolve(nodeModulesRoot, ...name.split("/"));
    const destinationParent = dirname(destination);
    const relativeDestination = relative(nodeModulesRoot, destination);
    if (
      relativeDestination.startsWith("..") ||
      resolve(destinationParent) !== nodeModulesRoot &&
        !resolve(destinationParent).startsWith(`${nodeModulesRoot}${"\\"}`)
    ) {
      console.error(`${gateName}: refusing unsafe local dependency destination ${destination}`);
      return false;
    }
    if (!existsSync(destination)) continue;
    try {
      rmSync(destination, { recursive: true, force: true });
      console.log(`${gateName}: cleared stale local file dependency ${destination}`);
    } catch (error) {
      console.error(`${gateName}: could not clear stale local file dependency ${destination}: ${String(error)}`);
      return false;
    }
  }
  return true;
}

/** Run one frozen install and fail closed on any exit code. */
export async function runFrozenPackageInstall(
  gateName: string,
  cwd: string,
  spawn: InstallSpawn = Bun.spawn as unknown as InstallSpawn,
): Promise<boolean> {
  if (!clearStaleLocalFileDependencyDestinations(gateName, cwd)) return false;
  const args =
    gateName === "typecheck"
      ? packageInstallArgsForTypecheck(resolve(import.meta.dir, ".."), cwd)
      : FROZEN_PACKAGE_INSTALL_ARGS;
  const child = spawn(args, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await child.exited;
  if (code !== 0) {
    console.error(
      `${gateName}: ${args.join(" ")} exited ${code}; ` +
        "the original Bun install error above is authoritative (no retry was attempted)",
    );
    return false;
  }
  return true;
}
