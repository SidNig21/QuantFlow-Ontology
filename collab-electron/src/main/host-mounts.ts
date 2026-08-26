/**
 * Founder-controlled adapter session environment (WO-008b shared configuration).
 *
 * Specs come from a JSON file the founder owns — never from the renderer.
 * Default path: ~/.quantflow/app/agentos-host-mounts.json (legacy filename retained for config identity)
 * Override: QF_AGENTOS_HOST_MOUNTS=<absolute path to json>
 *
 * Shape:
 * {
 *   "speciesEnv": {
 *     "hermes": { "HERMES_BIN": "/abs/...", "HOME": "/abs/..." }
 *   }
 * }
 *
 * This module is data-only; native and host-ACP adapters consume only the session environment map.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { QF_APP_ROOT } from "./paths";


export type HostMountsFile = {
  /** Optional per-species createSession env (paths only — never secrets). */
  speciesEnv?: Record<string, Record<string, string>>;
};

function configPath(): string {
  const override = process.env.QF_AGENTOS_HOST_MOUNTS;
  if (override && override.length > 0) return override;
  return join(QF_APP_ROOT, "agentos-host-mounts.json");
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

/** Adapter session env from founder config (paths only). */
export function resolveAdapterSessionEnv(
  adapterId: string,
  file: HostMountsFile | null = loadHostMountsFile(),
): Record<string, string> | undefined {
  const env = file?.speciesEnv?.[adapterId];
  if (!env || typeof env !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Compatibility alias for untouched historical callers. */
export const resolveSpeciesSessionEnv = resolveAdapterSessionEnv;
