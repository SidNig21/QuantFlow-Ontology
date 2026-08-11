import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import { resolveKernelPath } from "./resolve-path.ts";

const saved = {
  QF_KERNEL_DB: process.env.QF_KERNEL_DB,
  HOME: process.env.HOME,
};

afterEach(() => {
  if (saved.QF_KERNEL_DB === undefined) delete process.env.QF_KERNEL_DB;
  else process.env.QF_KERNEL_DB = saved.QF_KERNEL_DB;
  if (saved.HOME === undefined) delete process.env.HOME;
  else process.env.HOME = saved.HOME;
});

describe("resolveKernelPath", () => {
  test("default creates ~/.quantflow and returns absolute path with provenance=default", () => {
    const home = mkdtempSync(join(tmpdir(), "qf-resolve-home-"));
    process.env.HOME = home;
    delete process.env.QF_KERNEL_DB;

    const r = resolveKernelPath();
    expect(r.provenance).toBe("default");
    expect(r.path).toBe(join(home, ".quantflow", "kernel.db"));
    expect(existsSync(join(home, ".quantflow"))).toBe(true);

    rmSync(home, { recursive: true, force: true });
  });

  test("env absolute path resolves real path with provenance=env", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-resolve-env-"));
    const file = join(dir, "kernel.db");
    writeFileSync(file, "");
    process.env.QF_KERNEL_DB = file;

    const r = resolveKernelPath();
    expect(r.provenance).toBe("env");
    expect(r.path).toBe(file);

    rmSync(dir, { recursive: true, force: true });
  });

  test("relative env path becomes absolute (no cwd fork)", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-resolve-rel-"));
    const prev = process.cwd();
    process.chdir(dir);
    try {
      writeFileSync(join(dir, "kernel.db"), "");
      process.env.QF_KERNEL_DB = "./kernel.db";

      const r = resolveKernelPath();
      expect(r.provenance).toBe("env");
      expect(r.path).toBe(join(dir, "kernel.db"));
      expect(isAbsolute(r.path)).toBe(true);
    } finally {
      process.chdir(prev);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test(":memory: stays verbatim", () => {
    process.env.QF_KERNEL_DB = ":memory:";
    const r = resolveKernelPath();
    expect(r.path).toBe(":memory:");
    expect(r.provenance).toBe("env");
  });

  test("G3: env parent missing throws and creates nothing", () => {
    const home = mkdtempSync(join(tmpdir(), "qf-resolve-g3-"));
    process.env.HOME = home;
    const missingParent = join(home, "no-such-dir", "kernel.db");
    process.env.QF_KERNEL_DB = missingParent;

    expect(() => resolveKernelPath()).toThrow(/parent directory does not exist/);
    expect(existsSync(join(home, "no-such-dir"))).toBe(false);

    rmSync(home, { recursive: true, force: true });
  });

  test("G3 control: default creates parent when missing", () => {
    const home = mkdtempSync(join(tmpdir(), "qf-resolve-g3c-"));
    process.env.HOME = home;
    delete process.env.QF_KERNEL_DB;
    // ~/.quantflow does not exist yet
    expect(existsSync(join(home, ".quantflow"))).toBe(false);

    const r = resolveKernelPath();
    expect(r.provenance).toBe("default");
    expect(existsSync(join(home, ".quantflow"))).toBe(true);
    mkdirSync(join(home, ".quantflow"), { recursive: true }); // idempotent

    rmSync(home, { recursive: true, force: true });
  });
});
