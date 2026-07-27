import { Database } from "bun:sqlite";
import { attachKernel, type AttachKernelOptions, type KernelDb } from "./db.ts";

export type OpenKernelOptions = {
  readonly?: boolean;
  /** Why this path was chosen — for the D4 boot line. Default "explicit". */
  provenance?: AttachKernelOptions["provenance"];
};

/** Open (or create) a Kernel database under Bun and apply the generated migration. */
export function openKernel(
  path: string | ":memory:" = ":memory:",
  opts: OpenKernelOptions = {},
): KernelDb {
  const db = new Database(path, opts.readonly ? { readonly: true } : undefined);
  return attachKernel(db as unknown as KernelDb, {
    readonly: opts.readonly,
    path,
    provenance: opts.provenance ?? "explicit",
  });
}

export function closeKernel(db: KernelDb): void {
  (db as unknown as { close(): void }).close();
}
