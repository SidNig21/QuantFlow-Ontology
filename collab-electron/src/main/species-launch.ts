/**
 * Species launch routing (WO-008c) — data-driven, no schema column.
 *
 * Reads `launch` from the species agent-package manifest next to package_ref:
 *   species/<name>/packed/*.aospkg  →  species/<name>/agent-package/agentos-package.json
 *   tools/<name>/packed/*.aospkg    →  tools/<name>/agent-package/agentos-package.json
 *
 * Values: "agentos" (default) | "host_acp"
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDefinition } from "./kernel";

export type SpeciesLaunch = "agentos" | "host_acp";

type PackageManifest = {
  launch?: string;
  agent?: { launch?: string };
};

/** Map package_ref → sibling agent-package/agentos-package.json under appRoot. */
export function manifestPathForPackageRef(
  packageRef: string,
  appRoot: string,
): string | null {
  const parts = packageRef.split("/");
  // species/hermes/packed/hermes.aospkg → species/hermes/agent-package/...
  // tools/runtime-proof/packed/qf-toolloop.aospkg → tools/runtime-proof/agent-package/...
  if (parts.length < 3) return null;
  const root = parts[0];
  const name = parts[1];
  if (root !== "species" && root !== "tools") return null;
  return join(appRoot, root, name, "agent-package", "agentos-package.json");
}

export function readLaunchFromManifest(
  manifestPath: string,
): SpeciesLaunch {
  if (!existsSync(manifestPath)) return "agentos";
  try {
    const raw = JSON.parse(readFileSync(manifestPath, "utf8")) as PackageManifest;
    const value = raw.launch ?? raw.agent?.launch;
    if (value === "host_acp") return "host_acp";
    return "agentos";
  } catch {
    return "agentos";
  }
}

/** Resolve launch mode for a registered species name. */
export function resolveSpeciesLaunch(
  species: string,
  appRoot: string,
): SpeciesLaunch {
  const row = getAgentDefinition(species);
  if (!row) return "agentos";
  const packageRef = String(row.package_ref ?? "");
  if (!packageRef) return "agentos";
  const path = manifestPathForPackageRef(packageRef, appRoot);
  if (!path) return "agentos";
  const launch = readLaunchFromManifest(path);
  console.log(
    `agent-host: species launch species=${species} launch=${launch} manifest=${path}`,
  );
  return launch;
}
