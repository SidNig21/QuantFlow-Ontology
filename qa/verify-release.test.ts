import { describe, expect, test } from "bun:test";
import { RELEASE_STAGES } from "./verify-release.ts";

describe("verify-release stages", () => {
  test("requires install unit build package qa order", () => {
    expect(RELEASE_STAGES.map((stage) => stage.id)).toEqual([
      "install",
      "unit",
      "build",
      "package",
      "qa",
    ]);
  });

  test("deleting package stage is detectable", () => {
    const withoutPackage = RELEASE_STAGES.filter((stage) => stage.id !== "package");
    expect(withoutPackage.some((stage) => stage.id === "package")).toBe(false);
    expect(RELEASE_STAGES.some((stage) => stage.id === "package")).toBe(true);
  });
});
