/**
 * Sole reader of QF_KERNEL_DB and sole constructor of the default Kernel path.
 * Every process that needs "where is the Kernel?" calls this — nowhere else.
 */
import { existsSync, mkdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

export type KernelPathProvenance = "env" | "default";

export type ResolvedKernelPath = {
  /** Absolute real path, or the literal ":memory:". */
  path: string;
  provenance: KernelPathProvenance;
};

const MEMORY = ":memory:";
const DEFAULT_BASENAME = "kernel.db";

/**
 * Resolve the Kernel path from QF_KERNEL_DB or the platform default.
 *
 * - Env set and non-empty → absolute + symlink-resolved; parent must already
 *   exist (fail closed — never mint a world from a typo).
 * - Env unset/empty → ~/.quantflow/kernel.db; parent directory is created.
 * - ":memory:" is the sole relative-looking value that stays verbatim.
 */
export function resolveKernelPath(): ResolvedKernelPath {
  const raw = process.env.QF_KERNEL_DB;
  if (raw !== undefined && raw !== "") {
    if (raw === MEMORY) {
      return { path: MEMORY, provenance: "env" };
    }
    const absolute = isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
    const parent = dirname(absolute);
    if (!existsSync(parent)) {
      throw new Error(
        `resolveKernelPath: QF_KERNEL_DB parent directory does not exist: ${parent}`,
      );
    }
    const realParent = realpathSync(parent);
    const candidate = join(realParent, basename(absolute));
    const path = existsSync(candidate) ? realpathSync(candidate) : candidate;
    return { path, provenance: "env" };
  }

  const home = process.env.HOME ?? homedir();
  const dir = join(home, ".quantflow");
  mkdirSync(dir, { recursive: true });
  const realDir = realpathSync(dir);
  const candidate = join(realDir, DEFAULT_BASENAME);
  const path = existsSync(candidate) ? realpathSync(candidate) : candidate;
  return { path, provenance: "default" };
}
