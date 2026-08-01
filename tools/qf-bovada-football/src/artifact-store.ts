import { randomUUID } from "node:crypto";
import {
  closeSync,
  constants as fsConstants,
  fsyncSync,
  lstatSync,
  linkSync,
  openSync,
  readFileSync,
  realpathSync,
  statSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { isAbsolute, join } from "node:path";
import { contentHash } from "qf-kernel/portable";
import { ArtifactOwnershipError } from "./errors.ts";

export type DurableArtifactFile = {
  path: string;
  createdFinal: boolean;
};

function removeFile(path: string): void {
  try {
    unlinkSync(path);
  } catch (error) {
    if (!hasCode(error, "ENOENT")) throw error;
  }
}

function hasCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function writeAll(fd: number, bytes: Uint8Array): void {
  let offset = 0;
  while (offset < bytes.byteLength) {
    const written = writeSync(fd, bytes, offset, bytes.byteLength - offset);
    if (written <= 0) {
      throw new ArtifactOwnershipError("artifact staging made no write progress");
    }
    offset += written;
  }
}

function writeExactFile(
  path: string,
  bytes: Uint8Array,
  exclusive: boolean,
  onOpened?: () => void,
): void {
  const flags =
    fsConstants.O_WRONLY |
    fsConstants.O_CREAT |
    (exclusive ? fsConstants.O_EXCL : 0);
  let fd: number | undefined;
  try {
    fd = openSync(path, flags, 0o600);
    onOpened?.();
    writeAll(fd, bytes);
    fsyncSync(fd);
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

function fsyncDirectory(path: string): void {
  let fd: number | undefined;
  try {
    fd = openSync(path, fsConstants.O_RDONLY);
    fsyncSync(fd);
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function assertArtifactRoot(root: string): string {
  if (typeof root !== "string" || !isAbsolute(root)) {
    throw new ArtifactOwnershipError("artifact root must be an existing absolute directory");
  }
  let realRoot: string;
  try {
    realRoot = realpathSync(root);
    if (!statSync(realRoot).isDirectory()) {
      throw new Error("not a directory");
    }
  } catch {
    throw new ArtifactOwnershipError("artifact root must be an existing absolute directory");
  }
  return realRoot;
}

/** The final source path is content-addressed and has no caller-selected filename. */
export function artifactPathForHash(root: string, hash: string): string {
  if (!/^[0-9a-f]{64}$/.test(hash)) {
    throw new ArtifactOwnershipError("artifact path requires a lowercase SHA-256 hash");
  }
  return join(assertArtifactRoot(root), hash + ".json");
}

function verifyExisting(path: string, expectedHash: string, expectedBytes: Uint8Array): void {
  let stat;
  try {
    stat = lstatSync(path);
  } catch {
    throw new ArtifactOwnershipError("existing artifact path could not be inspected");
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new ArtifactOwnershipError("existing artifact path is not a regular file");
  }
  let existing: Uint8Array;
  try {
    existing = new Uint8Array(readFileSync(path));
  } catch {
    throw new ArtifactOwnershipError("existing artifact path could not be read");
  }
  if (contentHash(existing) !== expectedHash || !sameBytes(existing, expectedBytes)) {
    throw new ArtifactOwnershipError("existing content-addressed artifact bytes differ");
  }
}

/**
 * Stage exact response bytes inside the resolved root, fsync them, and create the final path
 * exclusively. Existing same-hash bytes are verified and never overwritten.
 */
export function ensureArtifactFile(
  root: string,
  hash: string,
  bytes: Uint8Array,
): DurableArtifactFile {
  const finalPath = artifactPathForHash(root, hash);
  const realRoot = assertArtifactRoot(root);
  const stagingPath = join(realRoot, "." + hash + "." + randomUUID() + ".stage");
  let stageCreated = false;
  try {
    writeExactFile(stagingPath, bytes, true, () => {
      stageCreated = true;
    });
    try {
      // linkSync is the no-replace publication boundary: the final pathname is never
      // opened for writing, so readers cannot observe a partial final body.
      linkSync(stagingPath, finalPath);
      fsyncDirectory(realRoot);
      return { path: finalPath, createdFinal: true };
    } catch (error) {
      if (hasCode(error, "EEXIST")) {
        // The final path may have been created by another invocation between any
        // read and this link. Verify it, never remove or overwrite it.
        verifyExisting(finalPath, hash, bytes);
        return { path: finalPath, createdFinal: false };
      }
      throw error;
    }
  } finally {
    if (stageCreated) {
      removeFile(stagingPath);
    }
  }
}

/** Remove only a final file known to have been created by this invocation. */
export function removeOwnedArtifactFile(path: string): void {
  removeFile(path);
}
