import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanPackageVerificationOutputs } from "./package-cleanup.ts";

const testRoots: string[] = [];

afterEach(() => {
  for (const root of testRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("package verification cleanup", () => {
  test("preserves sibling distribution artifacts", () => {
    const collabRoot = mkdtempSync(join(tmpdir(), "qf-package-cleanup-"));
    testRoots.push(collabRoot);

    const packageRoot = join(collabRoot, "dist/linux-unpacked");
    const siblingArtifact = join(collabRoot, "dist/sibling-artifact.txt");
    const stagingRoot = join(collabRoot, ".package-staging");
    const verifyDir = join(collabRoot, ".package-verify");

    mkdirSync(packageRoot, { recursive: true });
    mkdirSync(stagingRoot, { recursive: true });
    mkdirSync(verifyDir, { recursive: true });
    writeFileSync(siblingArtifact, "must survive\n");

    cleanPackageVerificationOutputs({ packageRoot, stagingRoot, verifyDir });

    expect(existsSync(packageRoot)).toBe(false);
    expect(existsSync(stagingRoot)).toBe(false);
    expect(existsSync(verifyDir)).toBe(false);
    expect(existsSync(siblingArtifact)).toBe(true);
  });
});
