/**
 * WO-K2 — create is opt-in; readonly cannot write (G3 / G4).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  closeKernel,
  KernelMissingFileError,
  openKernel,
  OpenKernelOptionsError,
} from "./db-bun.ts";
import { execute } from "./execute.ts";

const FIXTURE_ENV = "QF_KERNEL_SYNC_UNSAFE_FIXTURES_ONLY";
const dirs: string[] = [];

afterEach(() => {
  delete process.env[FIXTURE_ENV];
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), "qf-k2-open-"));
  dirs.push(d);
  return d;
}

describe("WO-K2 openKernel create / readonly", () => {
  test("G3: missing file without create throws and creates nothing", () => {
    const path = join(tempDir(), "missing.db");
    expect(() => openKernel(path)).toThrow(KernelMissingFileError);
    expect(existsSync(path)).toBe(false);
  });

  test("G3: { create: true } creates the file", () => {
    process.env[FIXTURE_ENV] = "1";
    const path = join(tempDir(), "created.db");
    const db = openKernel(path, { create: true });
    closeKernel(db);
    expect(existsSync(path)).toBe(true);
  });

  test("G3: :memory: opens without create", () => {
    const db = openKernel(":memory:");
    closeKernel(db);
  });

  test("G3: create + readonly together throws", () => {
    const path = join(tempDir(), "conflict.db");
    expect(() => openKernel(path, { create: true, readonly: true })).toThrow(
      OpenKernelOptionsError,
    );
    expect(existsSync(path)).toBe(false);
  });

  test("G3: missing file with readonly throws (cannot create)", () => {
    const path = join(tempDir(), "ro-missing.db");
    expect(() => openKernel(path, { readonly: true })).toThrow(
      KernelMissingFileError,
    );
    expect(existsSync(path)).toBe(false);
  });

  test("G4: readonly handle cannot write; writable control succeeds", () => {
    process.env[FIXTURE_ENV] = "1";
    const path = join(tempDir(), "ro-write.db");
    const setup = openKernel(path, { create: true });
    closeKernel(setup);

    const ro = openKernel(path, { readonly: true });
    expect(() =>
      ro.exec(
        "INSERT INTO events (id, type, object_type, object_id, payload, trace_id, created_at) VALUES ('e1', 't', 'o', 'i', '{}', 'tr', datetime('now'))",
      ),
    ).toThrow(/readonly|READONLY|read-only/i);
    expect(() =>
      execute(
        ro,
        "create_hypothesis",
        { claim: "no", success_criteria: "no", sources: ["s"] },
        { trace_id: "t", span_id: "s" },
      ),
    ).toThrow();
    closeKernel(ro);

    const rw = openKernel(path);
    const result = execute(
      rw,
      "create_hypothesis",
      { claim: "yes", success_criteria: "ok", sources: ["s"] },
      { trace_id: "t", span_id: "s" },
    );
    expect(result.object_id.length).toBeGreaterThan(0);
    closeKernel(rw);
  });
});
