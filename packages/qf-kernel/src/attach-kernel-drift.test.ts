/**
 * WO-K3 — attachKernel drift and incomplete-init enforcement (RULING 2+3).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getKernelDrift,
  type KernelDb,
} from "./db.ts";
import { closeKernel, openKernel } from "./db-bun.ts";
import { execute } from "./execute.ts";
import {
  KernelIncompleteInitializationError,
  KernelRegistryDriftError,
} from "./errors.ts";

const REPO_ROOT = join(import.meta.dir, "../../..");
const PRIOR_MIGRATION = join(
  REPO_ROOT,
  "qa/fixtures/kernel-drift/prior-schema/migration.sql",
);
const CANARY_SQL = join(REPO_ROOT, "qa/fixtures/kernel-drift/canary-only.sql");
const FIXTURE_ENV = "QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY";

const dirs: string[] = [];

afterEach(() => {
  delete process.env[FIXTURE_ENV];
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), "qf-k3-attach-"));
  dirs.push(d);
  return d;
}

function seedPriorSnapshot(path: string): void {
  const db = new Database(path);
  const tx = db.transaction(() => {
    db.exec(readFileSync(PRIOR_MIGRATION, "utf8"));
  });
  tx();
  db.close();
}

function seedCanaryOnly(path: string): void {
  const db = new Database(path);
  const tx = db.transaction(() => {
    db.exec(readFileSync(CANARY_SQL, "utf8"));
  });
  tx();
  db.close();
}

function captureStderr(fn: () => void): string {
  const chunks: string[] = [];
  const orig = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: string | Uint8Array) => {
    chunks.push(typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk));
    return true;
  }) as typeof process.stderr.write;
  try {
    fn();
  } finally {
    process.stderr.write = orig;
  }
  return chunks.join("");
}

const ctx = { trace_id: "k3-trace", span_id: "k3-span" };

describe("attachKernel WO-K3 drift / incomplete init", () => {
  test("canary-only schema_meta writable → KernelIncompleteInitializationError", () => {
    const path = join(tempDir(), "canary.db");
    seedCanaryOnly(path);
    expect(() => openKernel(path)).toThrow(KernelIncompleteInitializationError);
  });

  test("canary-only schema_meta readonly → warn + getKernelDrift, no artifact table", () => {
    const path = join(tempDir(), "canary-ro.db");
    seedCanaryOnly(path);

    let db: KernelDb | undefined;
    const err = captureStderr(() => {
      db = openKernel(path, { readonly: true });
    });
    expect(db).toBeDefined();
    expect(err).toMatch(/incomplete initialization/i);

    const drift = getKernelDrift(db!);
    expect(drift).not.toBeNull();
    expect(drift!.ok).toBe(false);
    expect("incomplete" in drift!).toBe(true);

    const names = (db!
      .query(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all() as Array<{ name: string }>).map((r) => r.name);
    expect(names).not.toContain("artifact");

    closeKernel(db!);
  });

  test("clean :memory: writable publish succeeds", () => {
    process.env[FIXTURE_ENV] = "1";
    const db = openKernel(":memory:");
    const bytes = new TextEncoder().encode("k3-clean-memory-publish");
    const result = execute(
      db,
      "publish_artifact",
      {
        kind: "report",
        bytes,
        storage_ref: "mem://k3-clean",
      },
      ctx,
    );
    expect(result.object_type).toBe("artifact");
    closeKernel(db);
  });

  test("prior-schema fixture writable → KernelRegistryDriftError", () => {
    const path = join(tempDir(), "prior.db");
    seedPriorSnapshot(path);
    expect(() => openKernel(path)).toThrow(KernelRegistryDriftError);
  });

  test("prior-schema fixture readonly → warn + getKernelDrift", () => {
    const path = join(tempDir(), "prior-ro.db");
    seedPriorSnapshot(path);

    let db: KernelDb | undefined;
    const err = captureStderr(() => {
      db = openKernel(path, { readonly: true });
    });
    expect(db).toBeDefined();
    expect(err).toMatch(/object-type registry drift/i);

    const drift = getKernelDrift(db!);
    if (drift === null) {
      throw new Error("readonly drift fixture must expose getKernelDrift");
    }
    expect(drift.ok).toBe(false);
    if ("missing" in drift) {
      expect(drift.missing.length).toBeGreaterThan(0);
    }

    closeKernel(db!);
  });
});
