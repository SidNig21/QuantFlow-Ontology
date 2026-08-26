import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  committedAllowlistPathForPackageRef,
  packedMetaPathForPackageRef,
} from "../../src/main/package-resource-paths.ts";

const collabRoot = join(import.meta.dir, "../..");

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function namedImportsAndCalls(source: string): {
  names: string[];
  body: string;
} | null {
  const stripped = stripComments(source);
  const match = stripped.match(
    /import\s*\{([\s\S]*?)\}\s*from\s*["']\.\/package-resource-paths["']/,
  );
  if (!match || match.index === undefined) return null;
  const names = match[1]
    .split(",")
    .map((part) => part.trim().split(/\s+as\s+/)[0]?.trim() ?? "")
    .filter(Boolean);
  return { names, body: stripped.slice(match.index + match[0].length) };
}

function expectProductionConsumer(relativePath: string): void {
  const source = readFileSync(join(collabRoot, relativePath), "utf8");
  const imported = namedImportsAndCalls(source);
  expect(imported).not.toBeNull();
  expect(imported?.names.length ?? 0).toBeGreaterThan(0);
  expect(
    imported?.names.some((name) =>
      new RegExp("\\b" + name + "\\s*\\(").test(imported.body),
    ),
  ).toBe(true);
}

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
  test("gate and production import and call package-resource-paths", () => {
    const inspectSource = readFileSync(
      join(collabRoot, "scripts/package-lib/package-inspect.ts"),
      "utf8",
    );
    expect(inspectSource).toContain("package-resource-paths-reexport.ts");
    expectProductionConsumer("src/main/host-native-tui.ts");
    expectProductionConsumer("src/main/runtime-adapter.ts");
  });
});
