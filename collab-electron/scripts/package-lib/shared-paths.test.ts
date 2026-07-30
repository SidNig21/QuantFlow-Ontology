import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  committedAllowlistPathForPackageRef,
  packedMetaPathForPackageRef,
} from "../../src/main/package-resource-paths.ts";

const collabRoot = join(import.meta.dir, "../..");

describe("shared production path rules", () => {
  test("changing shared input moves both production and inspection consumers", () => {
    const ref = "species/hermes/packed/hermes.aospkg";
    const root = "/resources";
    const productionMeta = packedMetaPathForPackageRef(ref, root);
    const productionAllowlist = committedAllowlistPathForPackageRef(ref, root);

    const inspectSource = readFileSync(
      join(collabRoot, "scripts/package-lib/package-inspect.ts"),
      "utf8",
    );
    expect(inspectSource).toContain("packedMetaPathForPackageRef");
    expect(inspectSource).toContain("committedAllowlistPathForPackageRef");
    expect(productionMeta).toBe(join(root, "species/hermes/packed/hermes.meta.json"));
    expect(productionAllowlist).toBe(
      join(root, "species/hermes/tools-allowlist.json"),
    );
  });
});

describe("static shared-module dependency", () => {
  test("gate and production import package-resource-paths", () => {
    const inspectSource = readFileSync(
      join(collabRoot, "scripts/package-lib/package-inspect.ts"),
      "utf8",
    );
    const launchSource = readFileSync(
      join(collabRoot, "src/main/species-launch.ts"),
      "utf8",
    );
    const toolsSource = readFileSync(
      join(collabRoot, "src/main/species-tools.ts"),
      "utf8",
    );
    expect(inspectSource).toContain("package-resource-paths-reexport.ts");
    expect(launchSource).toContain("./package-resource-paths");
    expect(toolsSource).toContain("./package-resource-paths");
  });
});
