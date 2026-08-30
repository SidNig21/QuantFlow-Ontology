import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LINUX_RELEASE_STAGES,
  WINDOWS_RELEASE_STAGES,
  nativeWindowsReleaseAllowed,
  releaseStagesForPlatform,
} from "./verify-release.ts";
import { G12_OPERATION_STEP_IDS } from "./gates/golden-g12-package-operations.ts";

describe("verify-release stages", () => {
  test("requires the native Windows install, unit, package, and static-gate order", () => {
    expect(WINDOWS_RELEASE_STAGES.map((stage) => stage.id)).toEqual([
      "install-electron",
      "install-hermes",
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
    expect(WINDOWS_RELEASE_STAGES).toHaveLength(18);
    expect(
      WINDOWS_RELEASE_STAGES.filter((stage) =>
        stage.command.join(" ") === "bun install --frozen-lockfile"
      ).map((stage) => stage.cwd),
    ).toEqual(["collab-electron", "species/hermes"]);
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
