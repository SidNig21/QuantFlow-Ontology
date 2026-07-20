/**
 * Species launch routing (WO-008c) — data-driven, no schema column.
 *
 * Deploy-true resolution (does NOT require unpackaged agent-package/):
 *   1. `<dirname(package_ref)>/<name>.meta.json` next to the .aospkg (written by pack)
 *   2. `species/<name>/launch.json` or `tools/<name>/launch.json` (committed)
 *   3. founder host config `speciesLaunch[species]`
 *   4. last resort: source agent-package/agentos-package.json (dev checkout only)
 *
 * Values: "agentos" (default) | "host_acp"
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { loadHostMountsFile } from "./host-mounts";
import { getAgentDefinition } from "./kernel";

export type SpeciesLaunch = "agentos" | "host_acp";

type LaunchDoc = {
  launch?: string;
  agent?: { launch?: string };
};

function asLaunch(value: unknown): SpeciesLaunch | null {
  if (value === "host_acp") return "host_acp";
  if (value === "agentos") return "agentos";
  return null;
}

function readLaunchDoc(path: string): SpeciesLaunch | null {
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as LaunchDoc;
    return asLaunch(raw.launch) ?? asLaunch(raw.agent?.launch);
  } catch {
    return null;
  }
}

/** package_ref → packed sibling meta: species/hermes/packed/hermes.aospkg → …/hermes.meta.json */
export function packedMetaPathForPackageRef(
  packageRef: string,
  appRoot: string,
): string | null {
  if (!packageRef.endsWith(".aospkg")) return null;
  const abs = join(appRoot, packageRef);
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

/**
 * Resolve launch mode for a registered species name.
 * Prefer packed/committed launch docs over source agent-package.
 */
export function resolveSpeciesLaunch(
  species: string,
  appRoot: string,
): SpeciesLaunch {
  const row = getAgentDefinition(species);
  if (!row) return "agentos";
  const packageRef = String(row.package_ref ?? "");
  if (!packageRef) return "agentos";

  const packedMeta = packedMetaPathForPackageRef(packageRef, appRoot);
  if (packedMeta) {
    const fromPacked = readLaunchDoc(packedMeta);
    if (fromPacked) {
      console.log(
        `agent-host: species launch species=${species} launch=${fromPacked} source=${packedMeta}`,
      );
      return fromPacked;
    }
  }

  const committed = committedLaunchPathForPackageRef(packageRef, appRoot);
  if (committed) {
    const fromCommitted = readLaunchDoc(committed);
    if (fromCommitted) {
      console.log(
        `agent-host: species launch species=${species} launch=${fromCommitted} source=${committed}`,
      );
      return fromCommitted;
    }
  }

  const hostFile = loadHostMountsFile();
  const fromHost = asLaunch(hostFile?.speciesLaunch?.[species]);
  if (fromHost) {
    console.log(
      `agent-host: species launch species=${species} launch=${fromHost} source=host-mounts.speciesLaunch`,
    );
    return fromHost;
  }

  const sourceManifest = sourceManifestPathForPackageRef(packageRef, appRoot);
  if (sourceManifest) {
    const fromSource = readLaunchDoc(sourceManifest);
    if (fromSource) {
      console.log(
        `agent-host: species launch species=${species} launch=${fromSource} source=${sourceManifest} (dev fallback)`,
      );
      return fromSource;
    }
  }

  console.log(
    `agent-host: species launch species=${species} launch=agentos (default)`,
  );
  return "agentos";
}
