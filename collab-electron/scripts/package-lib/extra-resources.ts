/**
 * Parse Electron Builder extraResources FileSets from collab-electron/package.json.
 * Fails closed on unsupported shapes (RW4).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type FileSet = {
  from: string;
  to: string;
};

const MACRO_RE = /\$\{[^}]+\}/;

function assertStringField(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`extraResources ${label} must be a non-empty string`);
  }
  if (MACRO_RE.test(value)) {
    throw new Error(`extraResources ${label} must not contain Builder macros`);
  }
  return value;
}

function parseFileSetEntry(entry: unknown, index: number): FileSet {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    throw new Error(`extraResources[${index}] must be an object with from and to`);
  }
  const keys = Object.keys(entry);
  if (keys.length !== 2 || !keys.includes("from") || !keys.includes("to")) {
    throw new Error(
      `extraResources[${index}] must have exactly two own keys: from and to`,
    );
  }
  const record = entry as Record<string, unknown>;
  return {
    from: assertStringField(record.from, `[${index}].from`),
    to: assertStringField(record.to, `[${index}].to`),
  };
}

function parseExtraResourcesSection(
  value: unknown,
  label: string,
): FileSet[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array when present`);
  }
  return value.map((entry, index) => parseFileSetEntry(entry, index));
}

export function parseExtraResourcesFromBuildConfig(build: unknown): FileSet[] {
  if (typeof build !== "object" || build === null) {
    throw new Error("build config must be an object");
  }
  const config = build as Record<string, unknown>;
  const top = parseExtraResourcesSection(
    config.extraResources,
    "build.extraResources",
  );
  const linux =
    typeof config.linux === "object" && config.linux !== null
      ? parseExtraResourcesSection(
          (config.linux as Record<string, unknown>).extraResources,
          "build.linux.extraResources",
        )
      : [];
  return [...top, ...linux];
}

export function loadLinuxFileSets(collabRoot: string): FileSet[] {
  const pkgPath = join(collabRoot, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { build?: unknown };
  return parseExtraResourcesFromBuildConfig(pkg.build ?? {});
}

export function mergeFileSetsForPlatform(
  build: unknown,
  platform: "linux" | "mac",
): FileSet[] {
  if (typeof build !== "object" || build === null) {
    throw new Error("build config must be an object");
  }
  const config = build as Record<string, unknown>;
  const top = parseExtraResourcesSection(
    config.extraResources,
    "build.extraResources",
  );
  const platformSection = config[platform];
  const platformSets =
    typeof platformSection === "object" && platformSection !== null
      ? parseExtraResourcesSection(
          (platformSection as Record<string, unknown>).extraResources,
          `build.${platform}.extraResources`,
        )
      : [];
  return [...top, ...platformSets];
}
