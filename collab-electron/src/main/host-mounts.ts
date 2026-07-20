/**
 * Founder-controlled AgentOS host mounts (WO-008b).
 *
 * Specs come from a JSON file the founder owns — never from the renderer.
 * Default path: ~/.collaborator/agentos-host-mounts.json
 * Override: QF_AGENTOS_HOST_MOUNTS=<absolute path to json>
 *
 * Shape:
 * {
 *   "mounts": [
 *     { "hostPath": "/abs/host/dir", "guestPath": "/abs/guest/dir", "readOnly": true }
 *   ],
 *   "speciesEnv": {
 *     "hermes": { "HERMES_BIN": "/abs/...", "HOME": "/abs/..." }
 *   }
 * }
 *
 * This module is data-only — agent-host builds typed mounts via createHostDirBackend.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type HostMountSpec = {
  hostPath: string;
  /** Guest path to mount at; defaults to hostPath (same-path projection). */
  guestPath?: string;
  readOnly?: boolean;
};

export type HostMountsFile = {
  mounts?: HostMountSpec[];
  /** Optional per-species createSession env (paths only — never secrets). */
  speciesEnv?: Record<string, Record<string, string>>;
};

function configPath(): string {
  const override = process.env.QF_AGENTOS_HOST_MOUNTS;
  if (override && override.length > 0) return override;
  return join(homedir(), ".collaborator", "agentos-host-mounts.json");
}

export function hostMountsConfigPath(): string {
  return configPath();
}

export function loadHostMountsFile(): HostMountsFile | null {
  const path = configPath();
  if (!existsSync(path)) {
    console.log(`agent-host: host-mounts skip (no file at ${path})`);
    return null;
  }
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as HostMountsFile;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (err) {
    console.error(`agent-host: host-mounts failed to parse ${path}`, err);
    return null;
  }
}

/** Validated mount specs (absolute existing host paths only). */
export function resolveHostMountSpecs(
  file: HostMountsFile | null = loadHostMountsFile(),
): Array<{ hostPath: string; guestPath: string; readOnly: boolean }> {
  if (!file?.mounts?.length) return [];
  const out: Array<{
    hostPath: string;
    guestPath: string;
    readOnly: boolean;
  }> = [];
  for (const spec of file.mounts) {
    if (!spec?.hostPath || typeof spec.hostPath !== "string") continue;
    if (!spec.hostPath.startsWith("/")) {
      console.error(
        `agent-host: host-mounts skip non-absolute hostPath=${spec.hostPath}`,
      );
      continue;
    }
    if (!existsSync(spec.hostPath)) {
      console.error(
        `agent-host: host-mounts skip missing hostPath=${spec.hostPath}`,
      );
      continue;
    }
    const guestPath =
      typeof spec.guestPath === "string" && spec.guestPath.startsWith("/")
        ? spec.guestPath
        : spec.hostPath;
    const readOnly = spec.readOnly !== false;
    out.push({ hostPath: spec.hostPath, guestPath, readOnly });
  }
  console.log(
    `agent-host: host-mounts loaded n=${out.length} from ${configPath()}`,
  );
  return out;
}

/** Species session env from founder config (paths only). */
export function resolveSpeciesSessionEnv(
  species: string,
  file: HostMountsFile | null = loadHostMountsFile(),
): Record<string, string> | undefined {
  const env = file?.speciesEnv?.[species];
  if (!env || typeof env !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
