/**
 * Confine legacy ACP client fs reads/writes to a declared root.
 * Pattern matches tools/qf-read-tools artifact-root (relative + realpathSync.native).
 */
import { existsSync, realpathSync } from "node:fs";
import {
  dirname,
  isAbsolute,
  relative,
  resolve as resolvePath,
} from "node:path";

export type AcpFsRoot = string | null;

export type AssertAcpFsPathOptions = {
  /** When true, the leaf may not exist yet (write/create). Parent must exist inside root. */
  allowCreate?: boolean;
};

/** Read QF_ACP_FS_ROOT once; absent/unresolvable ⇒ null (fs not advertised). */
export function loadAcpFsRoot(
  env: NodeJS.ProcessEnv = process.env,
): AcpFsRoot {
  const raw = env.QF_ACP_FS_ROOT;
  if (raw === undefined || raw.trim().length === 0) return null;
  const configured = resolvePath(raw.trim());
  if (!existsSync(configured)) return null;
  try {
    return realpathSync.native(configured);
  } catch {
    return null;
  }
}

export function shouldAdvertiseAcpFs(root: AcpFsRoot): boolean {
  return root !== null;
}

function assertResolvedInsideRoot(
  root: string,
  resolved: string,
  candidatePath: string,
  options: { allowExactRoot?: boolean } = {},
): void {
  const rel = relative(root, resolved);
  // Parent-of-create may be the root itself (relative === "").
  if (rel === "" && options.allowExactRoot) return;
  if (rel !== "" && !rel.startsWith("..") && !isAbsolute(rel)) return;
  throw new Error(
    `ACP fs path rejected: "${candidatePath}" is outside QF_ACP_FS_ROOT`,
  );
}

/** Reject paths that escape the declared root (six escape classes fail closed). */
export function assertPathWithinAcpFsRoot(
  root: string,
  candidatePath: string,
  options: AssertAcpFsPathOptions = {},
): void {
  const absolute = resolvePath(candidatePath);

  if (options.allowCreate && !existsSync(absolute)) {
    let parentReal: string;
    try {
      parentReal = realpathSync.native(dirname(absolute));
    } catch {
      throw new Error(
        `ACP fs path rejected: "${candidatePath}" parent does not exist or is not accessible`,
      );
    }
    assertResolvedInsideRoot(root, parentReal, candidatePath, {
      allowExactRoot: true,
    });
    return;
  }

  let resolved: string;
  try {
    resolved = realpathSync.native(absolute);
  } catch {
    throw new Error(
      `ACP fs path rejected: "${candidatePath}" does not exist or is not accessible`,
    );
  }
  assertResolvedInsideRoot(root, resolved, candidatePath);
}
