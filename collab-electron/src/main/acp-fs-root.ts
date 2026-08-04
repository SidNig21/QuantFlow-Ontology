/**
 * Confine legacy ACP client fs reads/writes to a declared root.
 * Pattern matches tools/qf-read-tools artifact-root (relative + realpathSync.native).
 */
import { existsSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve as resolvePath } from "node:path";

export type AcpFsRoot = string | null;

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

/** Reject paths that escape the declared root (six escape classes fail closed). */
export function assertPathWithinAcpFsRoot(root: string, candidatePath: string): void {
  let resolved: string;
  try {
    resolved = realpathSync.native(resolvePath(candidatePath));
  } catch {
    throw new Error(
      `ACP fs path rejected: "${candidatePath}" does not exist or is not accessible`,
    );
  }
  const rel = relative(root, resolved);
  if (rel !== "" && !rel.startsWith("..") && !isAbsolute(rel)) {
    return;
  }
  throw new Error(
    `ACP fs path rejected: "${candidatePath}" is outside QF_ACP_FS_ROOT`,
  );
}
