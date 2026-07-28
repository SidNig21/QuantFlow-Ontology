/**
 * Sole reader of QF_ARTIFACT_ROOT and sole constructor of the default artifact
 * store path. Production publish paths call this — nowhere else invents the root.
 */
import { existsSync, mkdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

export type ArtifactRootProvenance = "env" | "default";

export type ResolvedArtifactRoot = {
  /** Absolute real path to the artifact store directory. */
  path: string;
  provenance: ArtifactRootProvenance;
};

/**
 * Resolve the artifact byte store from QF_ARTIFACT_ROOT or the platform default.
 *
 * - Env set and non-empty → absolute + symlink-resolved; directory must already
 *   exist (fail closed — never mkdir a typo into a new truth store).
 * - Env unset/empty → ~/.quantflow/artifacts/; parent ~/.quantflow/ may be created
 *   (same ritual as the Kernel default parent), then artifacts/ is created.
 */
export function resolveArtifactRoot(): ResolvedArtifactRoot {
  const raw = process.env.QF_ARTIFACT_ROOT;
  if (raw !== undefined && raw !== "") {
    const absolute = isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
    if (!existsSync(absolute)) {
      throw new Error(
        `resolveArtifactRoot: QF_ARTIFACT_ROOT does not exist: ${absolute}`,
      );
    }
    const path = realpathSync(absolute);
    return { path, provenance: "env" };
  }

  const home = process.env.HOME ?? homedir();
  const quantflow = join(home, ".quantflow");
  mkdirSync(quantflow, { recursive: true });
  const artifacts = join(realpathSync(quantflow), "artifacts");
  mkdirSync(artifacts, { recursive: true });
  const path = realpathSync(artifacts);
  return { path, provenance: "default" };
}
