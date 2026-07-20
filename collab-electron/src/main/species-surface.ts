/**
 * Species desk surface (WO-008d) — data next to launch.json, no schema column.
 *
 *   surface: "native_tui" → Dock Spawn opens a term tile running argv
 *   surface: "acp_session" (default) → ACP/AgentOS session tile
 *
 * Resolution order mirrors species-launch:
 *   1. packed <name>.meta.json
 *   2. committed species|tools/<name>/launch.json
 *   3. default acp_session
 */
import { existsSync, readFileSync } from "node:fs";
import {
  committedLaunchPathForPackageRef,
  packedMetaPathForPackageRef,
} from "./species-launch";
import { getAgentDefinition } from "./kernel";

export type SpeciesSurface = "acp_session" | "native_tui";

export type SpeciesSurfaceSpec = {
  surface: SpeciesSurface;
  /** Args after the host binary (e.g. ["--tui"]). */
  argv: string[];
};

type SurfaceDoc = {
  surface?: string;
  /** Alias of `surface` (packed meta / WIP launch.json may emit `route`). */
  route?: string;
  argv?: unknown;
};

function asSurface(value: unknown): SpeciesSurface | null {
  if (value === "native_tui") return "native_tui";
  if (value === "acp_session") return "acp_session";
  return null;
}

function parseArgv(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const out = raw.filter(
    (a): a is string => typeof a === "string" && a.length > 0,
  );
  return out;
}

function readSurfaceDoc(path: string): SpeciesSurfaceSpec | null {
  if (!existsSync(path)) return null;
  try {
    const doc = JSON.parse(readFileSync(path, "utf8")) as SurfaceDoc;
    // Prefer `surface`; accept `route` as alias (A4 / peer-bus canvas PASS).
    const surface = asSurface(doc.surface) ?? asSurface(doc.route);
    if (!surface) return null;
    const argv = parseArgv(doc.argv);
    if (surface === "native_tui") {
      return { surface, argv: argv && argv.length > 0 ? argv : ["--tui"] };
    }
    return { surface, argv: argv ?? [] };
  } catch {
    return null;
  }
}

/** Resolve desk surface for a registered species. Default: acp_session. */
export function resolveSpeciesSurface(
  species: string,
  appRoot: string,
): SpeciesSurfaceSpec {
  const row = getAgentDefinition(species);
  if (!row) return { surface: "acp_session", argv: [] };
  const packageRef = String(row.package_ref ?? "");
  if (!packageRef) return { surface: "acp_session", argv: [] };

  const packedMeta = packedMetaPathForPackageRef(packageRef, appRoot);
  if (packedMeta) {
    const fromPacked = readSurfaceDoc(packedMeta);
    if (fromPacked) {
      console.log(
        `agent-host: species surface species=${species} surface=${fromPacked.surface} argv=${JSON.stringify(fromPacked.argv)} source=${packedMeta}`,
      );
      return fromPacked;
    }
  }

  const committed = committedLaunchPathForPackageRef(packageRef, appRoot);
  if (committed) {
    const fromCommitted = readSurfaceDoc(committed);
    if (fromCommitted) {
      console.log(
        `agent-host: species surface species=${species} surface=${fromCommitted.surface} argv=${JSON.stringify(fromCommitted.argv)} source=${committed}`,
      );
      return fromCommitted;
    }
  }

  console.log(
    `agent-host: species surface species=${species} surface=acp_session (default)`,
  );
  return { surface: "acp_session", argv: [] };
}
