/**
 * D1 vault-root precondition only.
 *
 * This is the sole module allowed to call exists/stat against QF_VAULT_ROOT.
 * It checks the vault is a directory with a README.md at its root, then returns.
 * It never reads README content and never inspects projected folders.
 */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

export function assertVaultRoot(vaultRoot: string): void {
  if (!existsSync(vaultRoot)) {
    console.error(
      `qf-vault-projection: QF_VAULT_ROOT does not exist: ${vaultRoot}`,
    );
    process.exit(1);
  }
  let st;
  try {
    st = statSync(vaultRoot);
  } catch {
    console.error(
      `qf-vault-projection: QF_VAULT_ROOT is not readable: ${vaultRoot}`,
    );
    process.exit(1);
  }
  if (!st.isDirectory()) {
    console.error(
      `qf-vault-projection: QF_VAULT_ROOT is not a directory: ${vaultRoot}`,
    );
    process.exit(1);
  }

  const readme = join(vaultRoot, "README.md");
  if (!existsSync(readme)) {
    console.error(
      `qf-vault-projection: QF_VAULT_ROOT is missing README.md: ${vaultRoot}`,
    );
    process.exit(1);
  }
  let readmeSt;
  try {
    readmeSt = statSync(readme);
  } catch {
    console.error(
      `qf-vault-projection: QF_VAULT_ROOT README.md is not readable: ${vaultRoot}`,
    );
    process.exit(1);
  }
  if (!readmeSt.isFile()) {
    console.error(
      `qf-vault-projection: QF_VAULT_ROOT README.md is not a file: ${vaultRoot}`,
    );
    process.exit(1);
  }
}
