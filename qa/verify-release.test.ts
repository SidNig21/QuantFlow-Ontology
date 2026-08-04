import { describe, expect, test } from "bun:test";
import {
  LINUX_RELEASE_STAGES,
  WINDOWS_RELEASE_STAGES,
  nativeWindowsReleaseAllowed,
  releaseStagesForPlatform,
} from "./verify-release.ts";

describe("verify-release stages", () => {
  test("requires the native Windows install, unit, package, and static-gate order", () => {
    expect(WINDOWS_RELEASE_STAGES.map((stage) => stage.id)).toEqual([
      "install",
      "unit",
      "windows-cold-boot",
      "repo-shape",
      "lockfile-committed",
      "kernel-sole-writer",
      "no-canvas-domain-writes",
      "kernel-sole-writer-app",
      "doc-links",
      "rung-ladder",
      "one-skin",
    ]);
  });

  test("deleting Windows cold boot is detectable", () => {
    const withoutColdBoot = WINDOWS_RELEASE_STAGES.filter(
      (stage) => stage.id !== "windows-cold-boot",
    );
    expect(withoutColdBoot.some((stage) => stage.id === "windows-cold-boot")).toBe(false);
    expect(WINDOWS_RELEASE_STAGES.some((stage) => stage.id === "windows-cold-boot")).toBe(true);
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
});
