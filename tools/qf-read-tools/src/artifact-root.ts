import { existsSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve as resolvePath } from "node:path";
import { KernelError } from "qf-kernel";

/**
 * Resolved artifact staging root for MCP callers, or null when absent.
 * Absent means unset, whitespace-only, non-existent on disk, or unresolvable.
 */
export type ArtifactRoot = string | null;

/** Read QF_ARTIFACT_ROOT once at startup and resolve symlinks. */
export function loadArtifactRoot(): ArtifactRoot {
  const raw = process.env.QF_ARTIFACT_ROOT;
  if (raw === undefined || raw.trim().length === 0) {
    console.error(
      "qf-read-tools server: QF_ARTIFACT_ROOT absent — publish_artifact will not be served",
    );
    return null;
  }

  const configured = resolvePath(raw.trim());
  if (!existsSync(configured)) {
    console.error(
      `qf-read-tools server: QF_ARTIFACT_ROOT path does not exist (${configured}) — publish_artifact will not be served`,
    );
    return null;
  }

  try {
    return realpathSync.native(configured);
  } catch {
    console.error(
      `qf-read-tools server: QF_ARTIFACT_ROOT could not be resolved (${configured}) — publish_artifact will not be served`,
    );
    return null;
  }
}

/** Whether publish_artifact may be registered and advertised on the served plane. */
export function shouldServePublishArtifact(artifactRoot: ArtifactRoot): boolean {
  return artifactRoot !== null;
}

/**
 * Reject a publish_artifact path unless it resolves inside the artifact root.
 * Uses boundary-safe relative compare — never a bare startsWith on path strings.
 */
export function assertPathWithinArtifactRoot(artifactRoot: string, candidatePath: string): void {
  let resolved: string;
  try {
    resolved = realpathSync.native(resolvePath(candidatePath));
  } catch {
    throw new KernelError(
      `publish_artifact path rejected: "${candidatePath}" does not exist or is not accessible`,
    );
  }

  const rel = relative(artifactRoot, resolved);
  if (rel !== "" && !rel.startsWith("..") && !isAbsolute(rel)) {
    return;
  }

  throw new KernelError(
    `publish_artifact path rejected: "${candidatePath}" is outside QF_ARTIFACT_ROOT`,
  );
}
