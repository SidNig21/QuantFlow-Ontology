import { createHash } from "node:crypto";

/** SHA-256 hex digest of artifact bytes — Kernel-computed, never trusted from the caller. */
export function contentHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
