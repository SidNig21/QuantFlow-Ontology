/**
 * Preflight active Linux extraResources before Electron Builder runs.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  expandFileSetOutputs,
} from "./fileset-expand.ts";
import { loadLinuxFileSets, type FileSet } from "./extra-resources.ts";

export type PreflightResult =
  | { ok: true; fileSets: FileSet[] }
  | { ok: false; reason: string };

export function preflightLinuxExtraResources(
  collabRoot: string,
  fileSets: FileSet[] = loadLinuxFileSets(collabRoot),
): PreflightResult {
  for (const fileSet of fileSets) {
    const outputs = expandFileSetOutputs(collabRoot, fileSet);
    if (outputs.length === 0) {
      const missing = join(collabRoot, fileSet.from);
      return {
        ok: false,
        reason: `preflight missing active Linux extraResources source: ${missing}`,
      };
    }
    for (const output of outputs) {
      if (!existsSync(output.source)) {
        return {
          ok: false,
          reason: `preflight missing active Linux extraResources source: ${output.source}`,
        };
      }
    }
  }
  return { ok: true, fileSets };
}
