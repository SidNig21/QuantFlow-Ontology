/**
 * Shared species/tools resource path rules for packaged and development roots.
 * Production host and package-closure inspection must derive paths from here only.
 */
import { existsSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

export type CollaborationResourcePathInputs = {
  /** Electron's resources root when running from an installed package. */
  resourcesPath?: string | null;
  /** Bundled main-module directory, injected by tests and defaulted by the host. */
  moduleDir: string;
  exists?: (path: string) => boolean;
};

/**
 * Resolve a package-owned collaboration resource without consulting founder
 * state. Packaged resources live under process.resourcesPath; development
 * resources live beside the repository's main bundle under collab-electron/cli.
 */
export function resolveCollaborationResourcePath(
  fileName: string,
  inputs: CollaborationResourcePathInputs,
): string | null {
  if (!fileName || fileName.includes("/") || fileName.includes("\\")) {
    throw new Error("collaboration resource name must be a single file name");
  }
  const exists = inputs.exists ?? existsSync;
  const candidates = [
    inputs.resourcesPath ? join(inputs.resourcesPath, fileName) : null,
    resolve(inputs.moduleDir, "../../cli", fileName),
  ].filter((path): path is string => path !== null);
  return candidates.find(exists) ?? null;
}

/** QuantFlow-owned Hermes state root; callers must supply the authoritative QF_APP_DIR. */
export function resolveHermesProfileRoot(appDir: string): string {
  return join(appDir, "hermes-profiles");
}

/** package_ref → packed sibling meta: species/hermes/packed/hermes.aospkg → …/hermes.meta.json */
export function packedMetaPathForPackageRef(
  packageRef: string,
  appRoot: string,
): string | null {
  if (!packageRef.endsWith(".aospkg")) return null;
  const abs = isAbsolute(packageRef) ? packageRef : join(appRoot, packageRef);
  const base = basename(packageRef, ".aospkg");
  return join(dirname(abs), `${base}.meta.json`);
}

/** package_ref → committed launch.json under species|tools/<name>/ */
export function committedLaunchPathForPackageRef(
  packageRef: string,
  appRoot: string,
): string | null {
  const parts = packageRef.split("/");
  if (parts.length < 3) return null;
  const root = parts[0];
  const name = parts[1];
  if (root !== "species" && root !== "tools") return null;
  return join(appRoot, root, name, "launch.json");
}

/** package_ref → committed tools-allowlist.json under species|tools/<name>/ */
export function committedAllowlistPathForPackageRef(
  packageRef: string,
  appRoot: string,
): string | null {
  const parts = packageRef.split("/");
  if (parts.length < 3) return null;
  const root = parts[0];
  const name = parts[1];
  if (root !== "species" && root !== "tools") return null;
  return join(appRoot, root, name, "tools-allowlist.json");
}

/** Dev-only fallback — must not be required for packed deploys. */
export function sourceManifestPathForPackageRef(
  packageRef: string,
  appRoot: string,
): string | null {
  const parts = packageRef.split("/");
  if (parts.length < 3) return null;
  const root = parts[0];
  const name = parts[1];
  if (root !== "species" && root !== "tools") return null;
  return join(appRoot, root, name, "agent-package", "agentos-package.json");
}
