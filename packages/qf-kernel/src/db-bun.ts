import { existsSync } from "node:fs";
import { Database } from "bun:sqlite";
import { attachKernel, type AttachKernelOptions, type KernelDb } from "./db.ts";

export type OpenKernelOptions = {
  /** Open an existing file for reads only. Mutually exclusive with create. */
  readonly?: boolean;
  /**
   * Create a missing file-backed Kernel (migrate empty world). Required when
   * the path does not exist; without it openKernel throws. Irrelevant for
   * `:memory:`. Mutually exclusive with readonly.
   */
  create?: boolean;
  /** Why this path was chosen — for the D4 boot line. Default "explicit". */
  provenance?: AttachKernelOptions["provenance"];
};

/** File-backed open refused: path missing and create was not requested. */
export class KernelMissingFileError extends Error {
  readonly path: string;

  constructor(path: string) {
    super(
      `openKernel: Kernel file does not exist: ${path}. Pass { create: true } to create, or fix the path.`,
    );
    this.name = "KernelMissingFileError";
    this.path = path;
  }
}

/** openKernel options rejected (e.g. create + readonly together). */
export class OpenKernelOptionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenKernelOptionsError";
  }
}

/**
 * Open a Kernel database under Bun and apply the generated migration.
 * File paths that do not exist throw unless `{ create: true }`. `:memory:`
 * always opens. `{ create: true, readonly: true }` is rejected.
 */
export function openKernel(
  path: string | ":memory:" = ":memory:",
  opts: OpenKernelOptions = {},
): KernelDb {
  if (opts.create === true && opts.readonly === true) {
    throw new OpenKernelOptionsError(
      "openKernel: create and readonly are mutually exclusive",
    );
  }

  if (path !== ":memory:" && opts.create !== true) {
    if (!existsSync(path)) {
      throw new KernelMissingFileError(path);
    }
  }

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
