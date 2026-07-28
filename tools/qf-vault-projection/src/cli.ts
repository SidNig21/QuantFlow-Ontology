#!/usr/bin/env bun
/**
 * qf-vault-projection CLI — Kernel → Obsidian vault, one direction.
 *
 * Env:
 *   QF_KERNEL_DB   — path to an existing Kernel database (opened readonly)
 *   QF_VAULT_ROOT  — path to an existing vault directory with README.md
 *   QF_VAULT_SCHEMA_MODULE — optional schema module override (G5 fixture)
 */
import { closeKernel, openKernel } from "qf-kernel";
import { assertKernelDbFile } from "./assert-kernel-db.ts";
import { assertVaultRoot } from "./assert-vault-root.ts";
import { readRequiredEnv } from "./env.ts";
import { loadSchema } from "./load-schema.ts";
import { projectVault } from "./project.ts";

const kernelDbPath = readRequiredEnv("QF_KERNEL_DB");
const vaultRoot = readRequiredEnv("QF_VAULT_ROOT");

assertKernelDbFile(kernelDbPath);
assertVaultRoot(vaultRoot);

const schema = await loadSchema();
const db = openKernel(kernelDbPath, { readonly: true });

try {
  const result = projectVault(db, vaultRoot, schema);
  // Plain-text run summary — skipped types must be named, never silent.
  console.log(
    `Projection complete: ${result.notesWritten} notes across ${result.typesProjected.length} types.`,
  );
  if (result.typesSkipped.length === 0) {
    console.log("Skipped declared types: none.");
  } else {
    console.log(
      `Skipped declared types (${result.typesSkipped.length}) — no table in this database:`,
    );
    for (const skipped of result.typesSkipped) {
      console.log(`  - ${skipped.name}: ${skipped.reason}`);
    }
  }
  console.log(
    JSON.stringify({
      ok: true,
      notesWritten: result.notesWritten,
      typesProjected: result.typesProjected,
      typesSkipped: result.typesSkipped,
    }),
  );
} finally {
  closeKernel(db);
}
