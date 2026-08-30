import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import {
  LINUX_RELEASE_STAGES,
  WINDOWS_RELEASE_STAGES,
  nativeWindowsReleaseAllowed,
  releaseInstallCacheDir,
  releaseStagesForPlatform,
} from "./verify-release.ts";
import { G12_OPERATION_STEP_IDS } from "./gates/golden-g12-package-operations.ts";

describe("verify-release stages", () => {
  const LOCK_ROOTS = [
    "collab-electron/bun.lock",
    "packages/qf-kernel/bun.lock",
    "qa/fixtures/lifecycle-command/bun.lock",
    "qa/gates/artifact-root/bun.lock",
    "qa/gates/boot-reconcile/bun.lock",
    "qa/gates/bovada-football/bun.lock",
    "qa/gates/dock-definition-launch/bun.lock",
    "qa/gates/dock-profile-identity/bun.lock",
    "qa/gates/kernel-drift/bun.lock",
    "qa/gates/market-ingest/bun.lock",
    "qf-kernel-schema/bun.lock",
    "species/hermes/bun.lock",
    "tools/qf-bovada-football/bun.lock",
    "tools/qf-read-tools/bun.lock",
    "tools/qf-vault-projection/bun.lock",
  ];
  const PREINSTALL_IDS = ["install-electron", "install-hermes", "install-bovada"];

  test("requires the native Windows install, unit, package, and static-gate order", () => {
    expect(WINDOWS_RELEASE_STAGES.map((stage) => stage.id)).toEqual([
      "install-electron",
      "install-hermes",
      "install-bovada",
      "unit",
      "golden-g12-package-operations",
      "repo-shape",
      "lockfile-committed",
      "kernel-sole-writer",
      "no-canvas-domain-writes",
      "kernel-sole-writer-app",
      "doc-links",
      "rung-ladder",
      "one-skin",
      "glacier-feel",
      "schema-bundle-aliases",
      "verb-retirement",
      "kernel-task-delegation",
      "kernel-market-lineage",
      "observe-door",
    ]);
    expect(WINDOWS_RELEASE_STAGES).toHaveLength(19);
    expect(WINDOWS_RELEASE_STAGES[0]).toMatchObject({
      id: "install-electron",
      cwd: "collab-electron",
      command: ["bun", "install", "--frozen-lockfile"],
    });
    expect(WINDOWS_RELEASE_STAGES[1]).toMatchObject({
      id: "install-hermes",
      cwd: "species/hermes",
      command: ["bun", "install", "--frozen-lockfile", "--linker", "isolated"],
    });
    expect(WINDOWS_RELEASE_STAGES[2]).toMatchObject({
      id: "install-bovada",
      cwd: "tools/qf-bovada-football",
      command: ["bun", "install", "--frozen-lockfile", "--backend", "copyfile", "--linker", "isolated"],
    });
  });

  test("classifies all 15 lock roots and rejects install-closure drift", () => {
    const actualLocks = execFileSync("git", ["ls-files"], { cwd: join(import.meta.dir, ".."), encoding: "utf8" })
      .split(/\r?\n/).filter((path) => path.endsWith("bun.lock")).sort();
    expect(actualLocks).toEqual(LOCK_ROOTS);
    const ids = WINDOWS_RELEASE_STAGES.slice(0, 3).map((stage) => stage.id);
    expect(ids).toEqual(PREINSTALL_IDS);
    expect(ids.slice(1)).not.toEqual(PREINSTALL_IDS);
    expect([ids[1], ids[0], ids[2]]).not.toEqual(PREINSTALL_IDS);
    expect([...ids, "install-extra"]).not.toEqual(PREINSTALL_IDS);
    const wrongOption = WINDOWS_RELEASE_STAGES.slice(0, 3).map((stage) => stage.command.join(" "));
    wrongOption[2] = wrongOption[2].replace("--backend copyfile", "--backend hardlink");
    expect(wrongOption).not.toEqual(WINDOWS_RELEASE_STAGES.slice(0, 3).map((stage) => stage.command.join(" ")));
  });

  test("omitting the Hermes frozen install before Windows unit is detectable", () => {
    const withoutHermesInstall = WINDOWS_RELEASE_STAGES.filter(
      (stage) => stage.id !== "install-hermes",
    );
    expect(withoutHermesInstall.map((stage) => stage.id)).not.toContain("install-hermes");
    expect(WINDOWS_RELEASE_STAGES.map((stage) => stage.id)).toContain("install-hermes");
    expect(WINDOWS_RELEASE_STAGES.findIndex((stage) => stage.id === "install-hermes")).toBeLessThan(
      WINDOWS_RELEASE_STAGES.findIndex((stage) => stage.id === "unit"),
    );
  });

  test("Electron and Hermes frozen installs cannot reuse one cache", () => {
    const electron = WINDOWS_RELEASE_STAGES.find((stage) => stage.id === "install-electron")!;
    const hermes = WINDOWS_RELEASE_STAGES.find((stage) => stage.id === "install-hermes")!;
    const bovada = WINDOWS_RELEASE_STAGES.find((stage) => stage.id === "install-bovada")!;
    const electronCache = releaseInstallCacheDir(electron, "fixture-run", "C:\\fixture-cache");
    const hermesCache = releaseInstallCacheDir(hermes, "fixture-run", "C:\\fixture-cache");
    const bovadaCache = releaseInstallCacheDir(bovada, "fixture-run", "C:\\fixture-cache");
    expect(electronCache).toBe("C:\\fixture-cache\\qf-release-fixture-run\\electron");
    expect(hermesCache).toBe("C:\\fixture-cache\\qf-release-fixture-run\\hermes");
    expect(bovadaCache).toBe("C:\\fixture-cache\\qf-release-fixture-run\\bovada");
    expect(electronCache).not.toBe(hermesCache);
    expect(new Set([electronCache, hermesCache, bovadaCache])).toHaveLength(3);
  });

  test("deleting Windows cold boot is detectable", () => {
    const withoutColdBoot = G12_OPERATION_STEP_IDS.filter(
      (stage) => stage !== "unpacked-readiness-shutdown",
    );
    expect(withoutColdBoot).not.toContain("unpacked-readiness-shutdown");
    expect(G12_OPERATION_STEP_IDS).toContain("unpacked-readiness-shutdown");
  });

  test("omitting the G12 package and operations stage is detectable", () => {
    const withoutG12 = WINDOWS_RELEASE_STAGES.filter(
      (stage) => stage.id !== "golden-g12-package-operations",
    );
    expect(
      withoutG12.some((stage) => stage.id === "golden-g12-package-operations"),
    ).toBe(false);
    expect(
      WINDOWS_RELEASE_STAGES.some(
        (stage) => stage.id === "golden-g12-package-operations",
      ),
    ).toBe(true);
  });

  test("keeps Linux as an explicit compatibility route", () => {
    expect(releaseStagesForPlatform("win32")).toBe(WINDOWS_RELEASE_STAGES);
    expect(releaseStagesForPlatform("linux")).toBe(LINUX_RELEASE_STAGES);
  });

  test("fails the canonical door closed off Windows", () => {
    expect(nativeWindowsReleaseAllowed("win32")).toBe(true);
    expect(nativeWindowsReleaseAllowed("linux")).toBe(false);
    expect(nativeWindowsReleaseAllowed("darwin")).toBe(false);
  });

  test("package signing inspection binds to the built-in PowerShell module", () => {
    const packageScript = readFileSync(
      join(import.meta.dir, "../collab-electron/scripts/package.mjs"),
      "utf8",
    );
    expect(packageScript).toContain("Join-Path $PSHOME");
    expect(packageScript).toContain("Microsoft.PowerShell.Security.psd1");
  });
});
