import { Database } from "bun:sqlite";
import { attachKernel, type KernelDb } from "./db.ts";

/** Open (or create) a Kernel database under Bun and apply the generated migration. */
export function openKernel(path: string | ":memory:" = ":memory:"): KernelDb {
  const db = new Database(path);
  return attachKernel(db as unknown as KernelDb);
}

export function closeKernel(db: KernelDb): void {
  (db as unknown as { close(): void }).close();
}
