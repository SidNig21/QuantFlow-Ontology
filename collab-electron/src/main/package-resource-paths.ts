/**
 * Shared species/tools resource path rules for packaged and development roots.
 * Production host and package-closure inspection must derive paths from here only.
 */
import { basename, dirname, isAbsolute, join } from "node:path";

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
