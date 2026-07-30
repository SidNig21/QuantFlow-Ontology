import { describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  HERMES_REF,
  inspectPackagedResources,
  QF_TOOLLOOP_REF,
  removeHermesPackage,
} from "./package-inspect.ts";

const collabRoot = join(import.meta.dir, "../..");
const packageRoot = join(collabRoot, "dist/linux-unpacked");
const resourcesRoot = join(packageRoot, "resources");
const repoRoot = join(collabRoot, "..");
const testTmpRoot = join(collabRoot, ".package-inspect-test-tmp");

function testTmpPath(label: string): string {
  return join(testTmpRoot, `${label}-${process.pid}-${Date.now()}`);
}

function seedMinimalPackage(root: string): void {
  const resources = join(root, "resources");
  mkdirSync(join(resources, "tools/runtime-proof/packed"), { recursive: true });
  mkdirSync(join(resources, "species/hermes/packed"), { recursive: true });
  writeFileSync(join(resources, QF_TOOLLOOP_REF), "toolloop");
  writeFileSync(join(resources, HERMES_REF), "hermes");
  writeFileSync(
    join(resources, "species/hermes/packed/hermes.meta.json"),
    "{}",
  );
  writeFileSync(join(resources, "species/hermes/launch.json"), "{}");
  writeFileSync(
    join(resources, "species/hermes/tools-allowlist.json"),
    "[]",
  );
}

describe("inspectPackagedResources root rules", () => {
  test("rejects inspection outside packaged resources root", () => {
    const result = inspectPackagedResources(
      join(testTmpRoot, "escape", "resources"),
      collabRoot,
      [],
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe(
        "root escape: inspection must target packaged resources root",
      );
    }
  });

  test("rejects bait copy without its exact expected resources root before Hermes", () => {
    const baitRoot = testTmpPath("bait");
    rmSync(baitRoot, { recursive: true, force: true });
    seedMinimalPackage(baitRoot);

    const result = inspectPackagedResources(
      join(baitRoot, "resources"),
      collabRoot,
      [],
    );
    rmSync(baitRoot, { recursive: true, force: true });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe(
        "root escape: inspection must target packaged resources root",
      );
    }
  });

  test("accepts the exact bait resources root and reaches missing Hermes", () => {
    const baitRoot = testTmpPath("trusted");
    rmSync(baitRoot, { recursive: true, force: true });
    seedMinimalPackage(baitRoot);
    removeHermesPackage(baitRoot);

    const result = inspectPackagedResources(
      join(baitRoot, "resources"),
      collabRoot,
      [],
      { expectedResourcesRoot: join(baitRoot, "resources") },
    );
    rmSync(baitRoot, { recursive: true, force: true });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason.startsWith("unresolved hermes reference:")).toBe(
        true,
      );
    }
  });

  test("rejects a bait root that differs from the expected resources root", () => {
    const baitRoot = testTmpPath("bad-trusted");
    rmSync(baitRoot, { recursive: true, force: true });
    seedMinimalPackage(baitRoot);

    const result = inspectPackagedResources(
      join(baitRoot, "resources"),
      collabRoot,
      [],
      { expectedResourcesRoot: join(testTmpRoot, "not-packaged", "resources") },
    );
    rmSync(baitRoot, { recursive: true, force: true });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe(
        "root escape: inspection must target packaged resources root",
      );
    }
  });

  test("dev-root probe still fails root escape", () => {
    const result = inspectPackagedResources(
      resourcesRoot,
      collabRoot,
      [],
      { probeDevRoot: repoRoot },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("root escape:");
    }
  });
});
