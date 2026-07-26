import { Database } from "bun:sqlite";
import { attachKernel, type KernelDb } from "./db.ts";

export type OpenKernelOptions = {
  readonly?: boolean;
};

/** Open (or create) a Kernel database under Bun and apply the generated migration. */
export function openKernel(
  path: string | ":memory:" = ":memory:",
  opts: OpenKernelOptions = {},
): KernelDb {
  const db = new Database(path, opts.readonly ? { readonly: true } : undefined);
  return attachKernel(db as unknown as KernelDb);
}

export function closeKernel(db: KernelDb): void {
  (db as unknown as { close(): void }).close();
}
