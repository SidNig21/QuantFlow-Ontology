import { describe, expect, test } from "bun:test";
import { selectAppRoot } from "./app-root";

describe("selectAppRoot", () => {
  test("development uses repository root", () => {
    expect(
      selectAppRoot({
        isPackaged: false,
        resourcesPath: null,
        repoRoot: "/repo",
      }),
    ).toBe("/repo");
  });

  test("packaged uses resourcesPath", () => {
    expect(
      selectAppRoot({
        isPackaged: true,
        resourcesPath: "/opt/app/resources",
        repoRoot: "/repo",
      }),
    ).toBe("/opt/app/resources");
  });

  test("packaged without resourcesPath fails closed", () => {
    expect(() =>
      selectAppRoot({
        isPackaged: true,
        resourcesPath: null,
        repoRoot: "/repo",
      }),
    ).toThrow(/resourcesPath/);
  });
});
