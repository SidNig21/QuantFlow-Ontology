import { randomUUID } from "node:crypto";

/** Unpredictable run id for package verification receipts. */
export function createPackageRunId(): string {
  return randomUUID();
}
