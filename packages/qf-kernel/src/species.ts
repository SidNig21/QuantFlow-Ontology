import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { KernelDb } from "./db.ts";
import { getAgentDefinition } from "./db.ts";
import {
  PackageRefUnresolvedError,
  UnknownSpeciesError,
} from "./errors.ts";

/**
 * Resolve a row's package_ref against an app root (absolute refs allowed).
 * Shared by Electron host and dock-registry gate — not a reimplementation.
 */
export function resolvePackageRef(
  packageRef: string,
  appRoot: string,
  species = "(unknown)",
): string {
  const resolved = isAbsolute(packageRef)
    ? packageRef
    : join(appRoot, packageRef);
  if (!existsSync(resolved)) {
    throw new PackageRefUnresolvedError(species, packageRef, resolved);
  }
  return resolved;
}

/** Load definition by name and resolve its package path. */
export function resolveSpeciesPackage(
  db: KernelDb,
  species: string,
  appRoot: string,
): { row: Record<string, unknown>; packagePath: string } {
  const row = getAgentDefinition(db, species);
  if (!row) throw new UnknownSpeciesError(species);
  const packageRef = String(row.package_ref ?? "");
  if (!packageRef) {
    throw new PackageRefUnresolvedError(species, packageRef, "(empty)");
  }
  return {
    row,
    packagePath: resolvePackageRef(packageRef, appRoot, species),
  };
}
