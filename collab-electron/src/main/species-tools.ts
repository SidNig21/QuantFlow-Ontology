/**
 * Per-species tool allowlist (WO-008a) — data next to launch.json, no schema column.
 *
 * Resolution order:
 *   1. species|tools/<name>/tools-allowlist.json (committed)
 *   2. packed sibling <name>.meta.json `tools` array (optional)
 * Empty / missing → deny all tools that request permission.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { getAgentDefinition } from "./kernel";

type AllowlistDoc = {
  tools?: unknown;
};

function parseTools(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim().toLowerCase());
}

function readAllowlistFile(path: string): string[] | null {
  if (!existsSync(path)) return null;
  try {
    const doc = JSON.parse(readFileSync(path, "utf8")) as AllowlistDoc;
    return parseTools(doc.tools);
  } catch {
    return null;
  }
}

function committedAllowlistPath(
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

function packedMetaPath(packageRef: string, appRoot: string): string | null {
  if (!packageRef.endsWith(".aospkg")) return null;
  const abs = join(appRoot, packageRef);
  const base = basename(packageRef, ".aospkg");
  return join(dirname(abs), `${base}.meta.json`);
}

/** Resolve tool allowlist for a registered species. Missing → []. */
export function resolveSpeciesToolAllowlist(
  species: string,
  appRoot: string,
): string[] {
  const row = getAgentDefinition(species);
  if (!row) return [];
  const packageRef = String(row.package_ref ?? "");
  if (!packageRef) return [];

  const committed = committedAllowlistPath(packageRef, appRoot);
  if (committed) {
    const tools = readAllowlistFile(committed);
    if (tools) {
      console.log(
        `agent-host: tool allowlist species=${species} count=${tools.length} source=${committed}`,
      );
      return tools;
    }
  }

  const meta = packedMetaPath(packageRef, appRoot);
  if (meta) {
    const tools = readAllowlistFile(meta);
    if (tools && tools.length > 0) {
      console.log(
        `agent-host: tool allowlist species=${species} count=${tools.length} source=${meta}`,
      );
      return tools;
    }
  }

  console.log(
    `agent-host: tool allowlist species=${species} count=0 (deny-all default)`,
  );
  return [];
}
