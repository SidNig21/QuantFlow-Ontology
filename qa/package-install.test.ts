import { execFileSync } from "node:child_process";
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  FROZEN_PACKAGE_INSTALL_ARGS,
  runFrozenPackageInstall,
} from "./package-install.ts";

const REPO_ROOT = resolve(import.meta.dir, "..");

function isGitIgnored(path: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "--no-index", "--quiet", "--", path], {
      cwd: REPO_ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

describe("shared frozen package install", () => {
  test("keeps the Windows copyfile backend explicit", () => {
    expect(FROZEN_PACKAGE_INSTALL_ARGS).toEqual([
      "bun",
      "install",
      "--frozen-lockfile",
      "--backend",
      "copyfile",
    ]);
  });

  test("permanent copy failures remain red", async () => {
    let calls = 0;
    const ok = await runFrozenPackageInstall(
      "permanent-copy-failure",
      "fixture-cwd",
      () => {
        calls += 1;
        return { exited: Promise.resolve(1) };
      },
    );
    expect(ok).toBe(false);
    expect(calls).toBe(1);
  });

  test("preserves qf-kernel-schema ignore rules at the repository root", () => {
    const ignoredPaths = [
      "qf-kernel-schema/node_modules/pkg/index.js",
      "qf-kernel-schema/nested/out/index.js",
      "qf-kernel-schema/nested/dist/index.js",
      "qf-kernel-schema/nested/archive.tgz",
      "qf-kernel-schema/nested/coverage/lcov.info",
      "qf-kernel-schema/nested/result.lcov",
      "qf-kernel-schema/nested/logs/app.log",
      "qf-kernel-schema/nested/_.log",
      "qf-kernel-schema/nested/report.1_.2_.3_.4_.json",
      "qf-kernel-schema/nested/.env.local",
      "qf-kernel-schema/nested/.eslintcache",
      "qf-kernel-schema/nested/.cache/value",
      "qf-kernel-schema/nested/build.tsbuildinfo",
      "qf-kernel-schema/nested/.idea/workspace.xml",
      "qf-kernel-schema/nested/.DS_Store",
    ];
    for (const path of ignoredPaths) expect(isGitIgnored(path)).toBe(true);
    expect(isGitIgnored("other-package/node_modules/pkg/index.js")).toBe(false);
    expect(isGitIgnored("other-package/archive.tgz")).toBe(false);
  });
});
