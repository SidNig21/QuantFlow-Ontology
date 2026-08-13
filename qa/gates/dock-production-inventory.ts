/**
 * R13 production Dock inventory gate.
 *
 * Production must contain launchable product seats only. QA may retain the
 * negative claude-code-ungranted fixture, but it must live in the QA closure.
 */
import {
  discoverDockProfileManifests,
  type DockProfileManifest,
} from "../../collab-electron/src/main/dock-profiles.ts";
import { join, resolve } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { prepareRuntimeStaging } from "../../collab-electron/scripts/package-lib/runtime-staging.ts";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const FORBIDDEN = /fixture|proof|test|ungranted/i;

function profileRows(manifests: readonly DockProfileManifest[]) {
  return manifests.flatMap((manifest) =>
    manifest.profiles.map((profile) => ({
      manifest: manifest.manifestRef,
      id: profile.name,
      role: profile.role,
    })),
  );
}

export function runDockProductionInventoryGate(): { ok: boolean } {
  try {
    const stagingRoot = mkdtempSync(join(tmpdir(), "qf-dock-production-inventory-"));
    try {
      prepareRuntimeStaging({ stagingRoot, repoRoot: REPO_ROOT }, { qaMode: true });
      const production = discoverDockProfileManifests(stagingRoot);
      const productionRows = profileRows(production);
      const forbidden = productionRows.filter(
        (row) => FORBIDDEN.test(row.id) || FORBIDDEN.test(row.role),
      );
      if (forbidden.length > 0) {
        console.error(
          "dock-production-inventory: production Dock contains QA-only profile(s):",
        );
        for (const row of forbidden) {
          console.error(`  ${row.manifest}: id=${row.id} role=${row.role}`);
        }
        return { ok: false };
      }

      const qa = discoverDockProfileManifests(stagingRoot, { qaMode: true });
      const qaRows = profileRows(qa);
      if (!qaRows.some((row) => row.id === "claude-code-ungranted")) {
        console.error(
          "dock-production-inventory: QA closure lost claude-code-ungranted",
        );
        return { ok: false };
      }

      console.log(
        `dock-production-inventory: production=${JSON.stringify(productionRows)} ` +
          `qaContainsClaudeCodeUngranted=${qaRows.some((row) => row.id === "claude-code-ungranted")}`,
      );
      return { ok: true };
    } finally {
      rmSync(stagingRoot, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(
      `dock-production-inventory: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  }
}

if (import.meta.main) {
  process.exit(runDockProductionInventoryGate().ok ? 0 : 1);
}
