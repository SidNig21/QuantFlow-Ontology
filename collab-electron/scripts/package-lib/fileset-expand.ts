/**
 * Expand active FileSet sources to concrete packaged destination paths.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { FileSet } from "./extra-resources.ts";

function listFilesRecursive(root: string): string[] {
  const out: string[] = [];
  if (!existsSync(root)) return out;
  const stat = statSync(root);
  if (stat.isFile()) {
    return [root];
  }
  if (!stat.isDirectory()) return out;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const abs = join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(abs));
    } else if (entry.isFile()) {
      out.push(abs);
    }
  }
  return out;
}

export function expandFileSetSources(
  collabRoot: string,
  fileSet: FileSet,
): string[] {
  const source = join(collabRoot, fileSet.from);
  if (!existsSync(source)) return [];
  return listFilesRecursive(source);
}

export function destinationForSource(
  fileSet: FileSet,
  sourcePath: string,
  collabRoot: string,
): string {
  const fromRoot = join(collabRoot, fileSet.from);
  const rel = relative(fromRoot, sourcePath);
  return join(fileSet.to, rel);
}

export function expandFileSetOutputs(
  collabRoot: string,
  fileSet: FileSet,
): { source: string; destination: string }[] {
  const sources = expandFileSetSources(collabRoot, fileSet);
  return sources.map((source) => ({
    source,
    destination: destinationForSource(fileSet, source, collabRoot),
  }));
}

export function packagedPathForDestination(
  resourcesRoot: string,
  destination: string,
): string {
  return join(resourcesRoot, destination);
}
