/**
 * Confirm QF_KERNEL_DB names an existing file before openKernel.
 * openKernel is documented "Open (or create)" — creating is forbidden here.
 */
import { existsSync, statSync } from "node:fs";

export function assertKernelDbFile(path: string): void {
  if (!existsSync(path)) {
    console.error(
      `qf-vault-projection: QF_KERNEL_DB does not exist: ${path}`,
    );
    process.exit(1);
  }
  let st;
  try {
    st = statSync(path);
  } catch {
    console.error(
      `qf-vault-projection: QF_KERNEL_DB is not readable: ${path}`,
    );
    process.exit(1);
  }
  if (!st.isFile()) {
    console.error(
      `qf-vault-projection: QF_KERNEL_DB is not a file: ${path}`,
    );
    process.exit(1);
  }
}
