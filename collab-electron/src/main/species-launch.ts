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
import { loadHostMountsFile } from "./host-mounts";
import { kernelGetObject } from "./kernel";
import {
  committedLaunchPathForPackageRef,
  packedMetaPathForPackageRef,
  sourceManifestPathForPackageRef,
} from "./package-resource-paths";

export {
  committedLaunchPathForPackageRef,
  packedMetaPathForPackageRef,
  sourceManifestPathForPackageRef,
} from "./package-resource-paths";

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

/**
 * Resolve launch mode for a registered species name.
 * Prefer packed/committed launch docs over source agent-package.
 */
export function resolveSpeciesLaunch(
  species: string,
  appRoot: string,
): SpeciesLaunch {
  const row = kernelGetObject("agent_definition", species);
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
