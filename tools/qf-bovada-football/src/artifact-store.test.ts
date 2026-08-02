import { afterEach, describe, expect, test } from "bun:test";
import {
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { contentHash } from "qf-kernel";
import {
  ArtifactOwnershipError,
  artifactPathForHash,
  ensureArtifactFile,
} from "./index.ts";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(): string {
  const root = mkdtempSync(join("/tmp", "qf-bovada-artifact-store-"));
  roots.push(root);
  return root;
}

describe("content-addressed artifact ownership", () => {
  test("publishes the fsynced staging inode by hard link and leaves no staging name", () => {
    const root = setup();
    const bytes = new TextEncoder().encode("exact-source-body");
    const hash = contentHash(bytes);
    const result = ensureArtifactFile(root, hash, bytes);
    expect(result.createdFinal).toBe(true);
    expect(new Uint8Array(readFileSync(result.path))).toEqual(bytes);
    expect(lstatSync(result.path).isFile()).toBe(true);
    expect(readdirSync(root).filter((name) => name.endsWith(".stage"))).toEqual([]);
    expect(ensureArtifactFile(root, hash, bytes).createdFinal).toBe(false);
  });

  test("never deletes a pre-existing same-hash path whose bytes fail verification", () => {
    const root = setup();
    const bytes = new TextEncoder().encode("expected-source-body");
    const hash = contentHash(bytes);
    const path = artifactPathForHash(root, hash);
    writeFileSync(path, "operator-existing-bytes");
    expect(() => ensureArtifactFile(root, hash, bytes)).toThrow(ArtifactOwnershipError);
    expect(readFileSync(path, "utf8")).toBe("operator-existing-bytes");
    expect(readdirSync(root).filter((name) => name.endsWith(".stage"))).toEqual([]);
  });

  test("rejects a final symlink without touching its target", () => {
    const root = setup();
    const bytes = new TextEncoder().encode("expected-source-body");
    const hash = contentHash(bytes);
    const target = join(root, "outside-target");
    const path = artifactPathForHash(root, hash);
    writeFileSync(target, "operator-target-bytes");
    symlinkSync(target, path);
    expect(() => ensureArtifactFile(root, hash, bytes)).toThrow(ArtifactOwnershipError);
    expect(readFileSync(target, "utf8")).toBe("operator-target-bytes");
    expect(lstatSync(path).isSymbolicLink()).toBe(true);
  });
});
