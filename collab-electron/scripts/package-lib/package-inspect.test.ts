import { describe, expect, test } from "bun:test";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { finished } from "node:stream/promises";
import { createPackage } from "@electron/asar";
import {
  HERMES_REF,
  HERMES_DOCK_PROFILES,
  inspectPackagedResources,
  QF_KERNEL_SCHEMA_MIGRATION,
  QF_KERNEL_SCHEMA_PRE_D1_AUTHORITY,
  QF_KERNEL_SCHEMA_UPGRADE,
  QF_TOOLLOOP_REF,
  RUNTIME_CONTROL_FILES,
  removeD1UpgradeFromAsar,
  removeDockProfilesManifest,
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
  for (const rel of RUNTIME_CONTROL_FILES) {
    const destination = join(resources, rel);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(repoRoot, rel), destination);
  }
  writeFileSync(
    join(resources, "species/hermes/tools-allowlist.json"),
    "[]",
  );
}

async function seedSqlAsar(
  root: string,
  overrides: { migration?: Buffer; upgrade?: Buffer } = {},
): Promise<void> {
  const source = join(root, "asar-source");
  rmSync(source, { recursive: true, force: true });
  mkdirSync(join(source, "node_modules/qf-kernel-schema/golden/upgrades"), {
    recursive: true,
  });
  mkdirSync(join(source, "node_modules/qf-kernel-schema/compat"), {
    recursive: true,
  });
  writeFileSync(
    join(source, QF_KERNEL_SCHEMA_PRE_D1_AUTHORITY),
    readFileSync(
      join(repoRoot, "qf-kernel-schema/compat/pre-d1-profile-identity.sql"),
    ),
  );
  writeFileSync(
    join(source, QF_KERNEL_SCHEMA_MIGRATION),
    overrides.migration ??
      readFileSync(join(repoRoot, "qf-kernel-schema/golden/migration.sql")),
  );
  writeFileSync(
    join(source, QF_KERNEL_SCHEMA_UPGRADE),
    overrides.upgrade ??
      readFileSync(
        join(
          repoRoot,
          "qf-kernel-schema/golden/upgrades/0001-agent-profile-identity.sql",
        ),
      ),
  );

  const stream = await createPackage(
    source,
    join(root, "resources", "app.asar"),
  );
  await finished(stream);
  rmSync(source, { recursive: true, force: true });
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

describe("inspectPackagedResources runtime controls", () => {
  test("copied-package control removes exactly one manifest and names it missing", async () => {
    const root = testTmpPath("manifest-remove");
    rmSync(root, { recursive: true, force: true });
    seedMinimalPackage(root);
    await seedSqlAsar(root);

    try {
      expect(removeDockProfilesManifest(root)).toEqual({
        removed: [HERMES_DOCK_PROFILES],
        added: [],
      });
      const result = inspectPackagedResources(
        join(root, "resources"),
        collabRoot,
        [],
        { expectedResourcesRoot: join(root, "resources") },
      );
      expect(result).toEqual({
        ok: false,
        reason: `runtime control file missing: ${HERMES_DOCK_PROFILES}`,
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("rejects a runtime control byte mismatch with both hashes", async () => {
    const root = testTmpPath("manifest-mismatch");
    rmSync(root, { recursive: true, force: true });
    seedMinimalPackage(root);
    await seedSqlAsar(root);
    writeFileSync(
      join(root, "resources", HERMES_DOCK_PROFILES),
      "{\"mismatch\":true}\n",
    );

    try {
      const result = inspectPackagedResources(
        join(root, "resources"),
        collabRoot,
        [],
        { expectedResourcesRoot: join(root, "resources") },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain(
          `runtime control byte mismatch: ${HERMES_DOCK_PROFILES}`,
        );
        expect(result.reason).toContain("packaged=");
        expect(result.reason).toContain("source=");
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("inspectPackagedResources ASAR SQL closure", () => {
  test("byte-compares both shipped SQL artifacts at their node_modules paths", async () => {
    const root = testTmpPath("sql-pass");
    rmSync(root, { recursive: true, force: true });
    seedMinimalPackage(root);
    await seedSqlAsar(root);

    try {
      const result = inspectPackagedResources(
        join(root, "resources"),
        collabRoot,
        [],
        { expectedResourcesRoot: join(root, "resources") },
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        const paths = result.checkedPaths.map((entry) => entry.path);
        expect(paths).toContain(QF_KERNEL_SCHEMA_MIGRATION);
        expect(paths).toContain(QF_KERNEL_SCHEMA_PRE_D1_AUTHORITY);
        expect(paths).toContain(QF_KERNEL_SCHEMA_UPGRADE);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("rejects a packaged SQL byte mismatch with both hashes", async () => {
    const root = testTmpPath("sql-mismatch");
    rmSync(root, { recursive: true, force: true });
    seedMinimalPackage(root);
    const golden = readFileSync(
      join(repoRoot, "qf-kernel-schema/golden/migration.sql"),
    );
    await seedSqlAsar(root, {
      migration: Buffer.concat([golden, Buffer.from("\n-- mismatch bait\n")]),
    });

    try {
      const result = inspectPackagedResources(
        join(root, "resources"),
        collabRoot,
        [],
        { expectedResourcesRoot: join(root, "resources") },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain(
          `SQL artifact byte mismatch: ${QF_KERNEL_SCHEMA_MIGRATION}`,
        );
        expect(result.reason).toContain("packaged=");
        expect(result.reason).toContain("golden=");
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("copied-ASAR control removes exactly the upgrade and then names it missing", async () => {
    const root = testTmpPath("sql-remove");
    rmSync(root, { recursive: true, force: true });
    seedMinimalPackage(root);
    await seedSqlAsar(root);

    try {
      const inventory = await removeD1UpgradeFromAsar(root);
      expect(inventory).toEqual({
        removed: [QF_KERNEL_SCHEMA_UPGRADE],
        added: [],
      });

      const result = inspectPackagedResources(
        join(root, "resources"),
        collabRoot,
        [],
        { expectedResourcesRoot: join(root, "resources") },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe(
          `missing packaged SQL artifact: ${QF_KERNEL_SCHEMA_UPGRADE}`,
        );
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
