/**
 * Inspect the finished Linux directory package through production resolution rules.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { resolvePackageRef } from "qf-kernel/portable";
import {
  committedAllowlistPathForPackageRef,
  committedLaunchPathForPackageRef,
  packedMetaPathForPackageRef,
} from "./package-resource-paths-reexport.ts";
import { expandFileSetOutputs } from "./fileset-expand.ts";
import type { FileSet } from "./extra-resources.ts";

export const QF_TOOLLOOP_REF = "tools/runtime-proof/packed/qf-toolloop.aospkg";
export const HERMES_REF = "species/hermes/packed/hermes.aospkg";

export type InspectFailure = {
  ok: false;
  reason: string;
};

export type InspectSuccess = {
  ok: true;
  checkedPaths: { path: string; bytes: number }[];
};

export type InspectResult = InspectFailure | InspectSuccess;

export type InspectOptions = {
  /** When set, proves the inspector rejects a development repo root. */
  probeDevRoot?: string;
};

function fileSize(path: string): number {
  return statSync(path).size;
}

function requireNonEmpty(path: string, label: string): InspectFailure | null {
  if (!existsSync(path)) {
    return { ok: false, reason: `${label} missing: ${path}` };
  }
  const bytes = fileSize(path);
  if (bytes === 0) {
    return { ok: false, reason: `${label} empty: ${path}` };
  }
  return null;
}

function inspectAuxiliaryPaths(
  packageRef: string,
  resourcesRoot: string,
  checked: { path: string; bytes: number }[],
): InspectFailure | null {
  const meta = packedMetaPathForPackageRef(packageRef, resourcesRoot);
  if (!meta) {
    return { ok: false, reason: `cannot derive packed meta for ${packageRef}` };
  }
  const metaFail = requireNonEmpty(meta, "packed metadata");
  if (metaFail) return metaFail;
  checked.push({ path: meta, bytes: fileSize(meta) });

  const launch = committedLaunchPathForPackageRef(packageRef, resourcesRoot);
  if (!launch) {
    return { ok: false, reason: `cannot derive launch path for ${packageRef}` };
  }
  const launchFail = requireNonEmpty(launch, "launch document");
  if (launchFail) return launchFail;
  checked.push({ path: launch, bytes: fileSize(launch) });

  const allowlist = committedAllowlistPathForPackageRef(packageRef, resourcesRoot);
  if (!allowlist) {
    return {
      ok: false,
      reason: `cannot derive tools-allowlist path for ${packageRef}`,
    };
  }
  const allowFail = requireNonEmpty(allowlist, "tools allowlist");
  if (allowFail) return allowFail;
  checked.push({ path: allowlist, bytes: fileSize(allowlist) });

  return null;
}

function assertPackagedResourcesRoot(resourcesRoot: string): InspectFailure | null {
  const normalized = resolve(resourcesRoot);
  if (!normalized.includes(`${join("dist", "linux-unpacked", "resources")}`)) {
    return {
      ok: false,
      reason: "root escape: inspection must target packaged resources root",
    };
  }
  return null;
}

export function inspectPackagedResources(
  resourcesRoot: string,
  collabRoot: string,
  fileSets: FileSet[],
  options: InspectOptions = {},
): InspectResult {
  if (options.probeDevRoot) {
    const probe = resolve(options.probeDevRoot);
    const escape = assertPackagedResourcesRoot(probe);
    if (!escape) {
      return {
        ok: false,
        reason: "root escape: dev-root probe unexpectedly matched packaged resources",
      };
    }
    try {
      resolvePackageRef(HERMES_REF, probe, "hermes");
    } catch {
      return {
        ok: false,
        reason: "root escape: inspection used development repo root instead of packaged resources",
      };
    }
    return {
      ok: false,
      reason: "root escape: inspection used development repo root instead of packaged resources",
    };
  }

  const root = resolve(resourcesRoot);
  const packagedCheck = assertPackagedResourcesRoot(root);
  if (packagedCheck) return packagedCheck;

  const checked: { path: string; bytes: number }[] = [];

  try {
    const toolloopPath = resolvePackageRef(QF_TOOLLOOP_REF, root, "qf-toolloop");
    checked.push({ path: toolloopPath, bytes: fileSize(toolloopPath) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `unresolved qf-toolloop reference: ${message}` };
  }

  try {
    const hermesPath = resolvePackageRef(HERMES_REF, root, "hermes");
    checked.push({ path: hermesPath, bytes: fileSize(hermesPath) });
    const auxFail = inspectAuxiliaryPaths(HERMES_REF, root, checked);
    if (auxFail) return auxFail;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `unresolved hermes reference: ${message}` };
  }

  for (const fileSet of fileSets) {
    const outputs = expandFileSetOutputs(collabRoot, fileSet);
    for (const output of outputs) {
      const packaged = join(root, output.destination);
      const fail = requireNonEmpty(packaged, "FileSet output");
      if (fail) {
        return {
          ok: false,
          reason: `${fail.reason} (from ${output.source})`,
        };
      }
      checked.push({ path: packaged, bytes: fileSize(packaged) });
    }
  }

  return { ok: true, checkedPaths: checked };
}

function copyDir(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}

export function copyPackageForBait(packageRoot: string): string {
  const baitRoot = join(
    tmpdir(),
    `qf-package-closure-bait-${process.pid}-${Date.now()}`,
  );
  rmSync(baitRoot, { recursive: true, force: true });
  mkdirSync(baitRoot, { recursive: true });
  copyDir(packageRoot, baitRoot);
  return baitRoot;
}

export function removeHermesPackage(baitPackageRoot: string): void {
  const target = join(baitPackageRoot, "resources", HERMES_REF);
  rmSync(target, { force: true });
}
