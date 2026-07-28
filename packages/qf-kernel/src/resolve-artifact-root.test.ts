import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveArtifactRoot } from "./resolve-artifact-root.ts";

const saved = {
  QF_ARTIFACT_ROOT: process.env.QF_ARTIFACT_ROOT,
  HOME: process.env.HOME,
};

afterEach(() => {
  if (saved.QF_ARTIFACT_ROOT === undefined) delete process.env.QF_ARTIFACT_ROOT;
  else process.env.QF_ARTIFACT_ROOT = saved.QF_ARTIFACT_ROOT;
  if (saved.HOME === undefined) delete process.env.HOME;
  else process.env.HOME = saved.HOME;
});

describe("resolveArtifactRoot", () => {
  test("default creates ~/.quantflow/artifacts and returns provenance=default", () => {
    const home = mkdtempSync(join(tmpdir(), "qf-art-home-"));
    process.env.HOME = home;
    delete process.env.QF_ARTIFACT_ROOT;

    const r = resolveArtifactRoot();
    expect(r.provenance).toBe("default");
    expect(r.path).toBe(join(home, ".quantflow", "artifacts"));
    expect(existsSync(join(home, ".quantflow", "artifacts"))).toBe(true);

    rmSync(home, { recursive: true, force: true });
  });

  test("env absolute path resolves with provenance=env", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-art-env-"));
    process.env.QF_ARTIFACT_ROOT = dir;

    const r = resolveArtifactRoot();
    expect(r.provenance).toBe("env");
    expect(r.path).toBe(dir);

    rmSync(dir, { recursive: true, force: true });
  });

  test("relative env path becomes absolute", () => {
    const dir = mkdtempSync(join(tmpdir(), "qf-art-rel-"));
    const prev = process.cwd();
    process.chdir(dir);
    try {
      mkdirSync(join(dir, "store"), { recursive: true });
      process.env.QF_ARTIFACT_ROOT = "./store";

      const r = resolveArtifactRoot();
      expect(r.provenance).toBe("env");
      expect(r.path).toBe(join(dir, "store"));
      expect(r.path.startsWith("/")).toBe(true);
    } finally {
      process.chdir(prev);
    }
    rmSync(dir, { recursive: true, force: true });
  });

  test("env path missing throws and creates nothing", () => {
    const home = mkdtempSync(join(tmpdir(), "qf-art-miss-"));
    process.env.HOME = home;
    const missing = join(home, "no-such-artifacts");
    process.env.QF_ARTIFACT_ROOT = missing;

    expect(() => resolveArtifactRoot()).toThrow(/does not exist/);
    expect(existsSync(missing)).toBe(false);

    rmSync(home, { recursive: true, force: true });
  });

  test("default creates parent ~/.quantflow when missing", () => {
    const home = mkdtempSync(join(tmpdir(), "qf-art-parent-"));
    process.env.HOME = home;
    delete process.env.QF_ARTIFACT_ROOT;
    expect(existsSync(join(home, ".quantflow"))).toBe(false);

    const r = resolveArtifactRoot();
    expect(r.provenance).toBe("default");
    expect(existsSync(join(home, ".quantflow", "artifacts"))).toBe(true);

    rmSync(home, { recursive: true, force: true });
  });
});
