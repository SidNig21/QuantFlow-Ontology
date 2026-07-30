import { describe, expect, test } from "bun:test";
import {
  mergeFileSetsForPlatform,
  parseExtraResourcesFromBuildConfig,
} from "./extra-resources.ts";

describe("extra-resources parsing", () => {
  test("rejects non-array extraResources", () => {
    expect(() =>
      parseExtraResourcesFromBuildConfig({ extraResources: "bad" }),
    ).toThrow(/must be an array/);
  });

  test("rejects linux extraResources non-array", () => {
    expect(() =>
      parseExtraResourcesFromBuildConfig({
        extraResources: [],
        linux: { extraResources: {} },
      }),
    ).toThrow(/build.linux.extraResources must be an array/);
  });

  test("rejects empty from/to and extra keys", () => {
    expect(() =>
      parseExtraResourcesFromBuildConfig({
        extraResources: [{ from: "", to: "x" }],
      }),
    ).toThrow(/non-empty string/);
    expect(() =>
      parseExtraResourcesFromBuildConfig({
        extraResources: [{ from: "a", to: "" }],
      }),
    ).toThrow(/non-empty string/);
    expect(() =>
      parseExtraResourcesFromBuildConfig({
        extraResources: [{ from: "a", to: "b", filter: "*" }],
      }),
    ).toThrow(/exactly two own keys/);
  });

  test("rejects macros in from and to", () => {
    expect(() =>
      parseExtraResourcesFromBuildConfig({
        extraResources: [{ from: "${arch}/x", to: "y" }],
      }),
    ).toThrow(/macros/);
    expect(() =>
      parseExtraResourcesFromBuildConfig({
        extraResources: [{ from: "x", to: "${arch}" }],
      }),
    ).toThrow(/macros/);
  });

  test("merges top-level and linux file sets", () => {
    const sets = mergeFileSetsForPlatform(
      {
        extraResources: [{ from: "a", to: "A" }],
        linux: { extraResources: [{ from: "b", to: "B" }] },
      },
      "linux",
    );
    expect(sets).toEqual([
      { from: "a", to: "A" },
      { from: "b", to: "B" },
    ]);
  });
});
