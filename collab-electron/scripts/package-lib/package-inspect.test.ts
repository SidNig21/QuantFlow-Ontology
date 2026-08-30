import { describe, expect, test } from "bun:test";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { createPackage } from "@electron/asar";
import {
  HERMES_REF,
  HERMES_DOCK_PROFILES,
  inspectPackagedResources,
  QF_KERNEL_SCHEMA_MIGRATION,
  QF_KERNEL_SCHEMA_MARKET_CONTEXT_UPGRADE,
  QF_KERNEL_SCHEMA_MARKET_INGEST_UPGRADE,
  QF_KERNEL_SCHEMA_PRE_D1_AUTHORITY,
  QF_KERNEL_SCHEMA_UPGRADE,
  QF_LINUX_EXECUTABLE,
  QF_PACKAGE_NAME,
  QF_UPDATE_OWNER,
  QF_UPDATE_REPOSITORY,
  RUNTIME_CONTROL_FILES,
  removeD1UpgradeFromAsar,
  removeMarketContextUpgradeFromAsar,
  removeMarketIngestUpgradeFromAsar,
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
  mkdirSync(join(resources, "species/hermes/packed"), { recursive: true });
  writeFileSync(join(resources, HERMES_REF), "hermes");
  mkdirSync(join(resources, "species/hermes/prompts"), { recursive: true });
  copyFileSync(join(repoRoot, "species/hermes/prompts/research-director.md"), join(resources, "species/hermes/prompts/research-director.md"));
  for (const rel of RUNTIME_CONTROL_FILES) {
    const destination = join(resources, rel);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(repoRoot, rel), destination);
  }
  writeFileSync(join(root, QF_LINUX_EXECUTABLE), "#!/bin/sh\nexit 0\n");
  chmodSync(join(root, QF_LINUX_EXECUTABLE), 0o755);
  writeFileSync(
    join(resources, "app-update.yml"),
    `provider: github\nowner: ${QF_UPDATE_OWNER}\nrepo: ${QF_UPDATE_REPOSITORY}\n`,
  );
}

async function seedSqlAsar(
  root: string,
  overrides: {
    migration?: Buffer;
    upgrade?: Buffer;
    marketUpgrade?: Buffer;
    contextUpgrade?: Buffer;
  } = {},
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
    join(source, "package.json"),
    JSON.stringify({ name: QF_PACKAGE_NAME, version: "0.0.0-test" }),
  );
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
  writeFileSync(
    join(source, QF_KERNEL_SCHEMA_MARKET_INGEST_UPGRADE),
    overrides.marketUpgrade ??
      readFileSync(
        join(
          repoRoot,
          "qf-kernel-schema/golden/upgrades/0002-market-ingest.sql",
        ),
      ),
  );
  writeFileSync(
    join(source, QF_KERNEL_SCHEMA_MARKET_CONTEXT_UPGRADE),
    overrides.contextUpgrade ??
      readFileSync(
        join(
          repoRoot,
          "qf-kernel-schema/golden/upgrades/0003-market-context.sql",
        ),
      ),
  );

  await createPackage(
    source,
    join(root, "resources", "app.asar"),
  );
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
      expect(result.reason).toContain("runtime control validation failed: Dock profile runtime package missing");
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
  test("byte-compares every shipped SQL artifact at its node_modules path", async () => {
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
        expect(paths).toContain(QF_KERNEL_SCHEMA_MARKET_INGEST_UPGRADE);
        expect(paths).toContain(QF_KERNEL_SCHEMA_MARKET_CONTEXT_UPGRADE);
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

  test("copied-ASAR control removes exactly the market-ingest upgrade and names it missing", async () => {
    const root = testTmpPath("sql-remove-market-ingest");
    rmSync(root, { recursive: true, force: true });
    seedMinimalPackage(root);
    await seedSqlAsar(root);

    try {
      const inventory = await removeMarketIngestUpgradeFromAsar(root);
      expect(inventory).toEqual({
        removed: [QF_KERNEL_SCHEMA_MARKET_INGEST_UPGRADE],
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
          `missing packaged SQL artifact: ${QF_KERNEL_SCHEMA_MARKET_INGEST_UPGRADE}`,
        );
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("copied-ASAR control removes exactly the market-context upgrade and names it missing", async () => {
    const root = testTmpPath("sql-remove-market-context");
    rmSync(root, { recursive: true, force: true });
    seedMinimalPackage(root);
    await seedSqlAsar(root);

    try {
      const inventory = await removeMarketContextUpgradeFromAsar(root);
      expect(inventory).toEqual({
        removed: [QF_KERNEL_SCHEMA_MARKET_CONTEXT_UPGRADE],
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
          `missing packaged SQL artifact: ${QF_KERNEL_SCHEMA_MARKET_CONTEXT_UPGRADE}`,
        );
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("inspectPackagedResources product identity", () => {
  test("accepts exact Linux executable, ASAR package name, and update target", async () => {
    const root = testTmpPath("product-pass");
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
        expect(result.checkedPaths.map((entry) => entry.path)).toContain(
          join(root, QF_LINUX_EXECUTABLE),
        );
        expect(result.checkedPaths.map((entry) => entry.path)).toContain(
          "app.asar:package.json",
        );
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("rejects a non-executable QuantFlow binary", async () => {
    const root = testTmpPath("product-non-executable");
    rmSync(root, { recursive: true, force: true });
    seedMinimalPackage(root);
    await seedSqlAsar(root);
    chmodSync(join(root, QF_LINUX_EXECUTABLE), 0o644);

    try {
      const result = inspectPackagedResources(
        join(root, "resources"),
        collabRoot,
        [],
        {
          expectedResourcesRoot: join(root, "resources"),
          platform: "linux",
          statMode: () => 0o100644,
        },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toContain("is not executable");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("rejects the old packaged update target", async () => {
    const root = testTmpPath("product-old-update");
    rmSync(root, { recursive: true, force: true });
    seedMinimalPackage(root);
    await seedSqlAsar(root);
    writeFileSync(
      join(root, "resources/app-update.yml"),
      "provider: github\nowner: collabs-inc\nrepo: collab-public\n",
    );

    try {
      const result = inspectPackagedResources(
        join(root, "resources"),
        collabRoot,
        [],
        { expectedResourcesRoot: join(root, "resources") },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toContain("update target mismatch");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
