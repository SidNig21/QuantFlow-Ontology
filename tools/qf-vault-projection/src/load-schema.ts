/**
 * Schema loader — production schema by default; optional module override for G5.
 * Mirrors tools/qf-read-tools QF_READ_SCHEMA_MODULE pattern.
 */
import { schema as defaultSchema } from "qf-kernel-schema";
import type { Schema } from "qf-kernel-schema/define";

export async function loadSchema(): Promise<Schema> {
  const modPath = process.env.QF_VAULT_SCHEMA_MODULE;
  if (modPath && modPath.trim().length > 0) {
    const mod = (await import(modPath.trim())) as { schema: Schema };
    return mod.schema;
  }
  return defaultSchema;
}
