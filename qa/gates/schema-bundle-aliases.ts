/**
 * WO-CI1: production bundle resolves qf-kernel packages through exports, not aliases.
 * Install-free static gate — reads live manifests and Electron config source text.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dir, "../..");
const CONFIG_PATH = join(REPO_ROOT, "collab-electron/electron.vite.config.ts");
const KERNEL_MANIFEST_PATH = join(REPO_ROOT, "packages/qf-kernel/package.json");
const SCHEMA_MANIFEST_PATH = join(REPO_ROOT, "qf-kernel-schema/package.json");

const PRIVATE_PACKAGE_RE = /qf-kernel(?:-schema)?/;

type PackageManifest = { exports?: unknown };

type CheckResult = { ok: boolean; reason?: string };

/** Extract a balanced `{...}` or `[...]` block opened immediately after `property:`. */
function extractPropertyBlock(
  source: string,
  property: string,
): string | null {
  const re = new RegExp(`\\b${property}\\s*:\\s*(\\{|\\[)`);
  const match = re.exec(source);
  if (!match) return null;

  const openChar = match[1]!;
  const closeChar = openChar === "{" ? "}" : "]";
  const start = match.index + match[0].length - 1;
  let depth = 0;

  for (let i = start; i < source.length; i++) {
    const ch = source[i]!;
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

function extractMainBlock(source: string): string | null {
  return extractPropertyBlock(source, "main");
}

function extractMainResolveAliasBlock(source: string): string | null {
  const mainBlock = extractMainBlock(source);
  if (!mainBlock) return null;
  const resolveBlock = extractPropertyBlock(mainBlock, "resolve");
  if (!resolveBlock) return null;
  return extractPropertyBlock(resolveBlock, "alias");
}

function extractMainExcludeBlock(source: string): string | null {
  const mainBlock = extractMainBlock(source);
  if (!mainBlock) return null;
  const buildBlock = extractPropertyBlock(mainBlock, "build");
  if (!buildBlock) return null;
  const externalizeBlock = extractPropertyBlock(buildBlock, "externalizeDeps");
  if (!externalizeBlock) return null;
  return extractPropertyBlock(externalizeBlock, "exclude");
}

/** Verify live package manifests declare the exports production bundling relies on. */
export function checkPackageManifests(
  kernelManifest: PackageManifest,
  schemaManifest: PackageManifest,
): CheckResult {
  const kernelExports = kernelManifest.exports;
  if (
    typeof kernelExports !== "object" ||
    kernelExports === null ||
    typeof (kernelExports as Record<string, unknown>)["./portable"] !==
      "string"
  ) {
    return {
      ok: false,
      reason: 'qf-kernel manifest must export "./portable" as a string path',
    };
  }

  const schemaExports = schemaManifest.exports;
  if (typeof schemaExports !== "object" || schemaExports === null) {
    return {
      ok: false,
      reason: "qf-kernel-schema manifest exports must be an object",
    };
  }

  const entries = Object.entries(schemaExports as Record<string, unknown>);
  const hasRoot =
    typeof (schemaExports as Record<string, unknown>)["."] === "string";
  const subpathCount = entries.filter(
    ([key, value]) => key.startsWith("./") && typeof value === "string",
  ).length;

  if (!hasRoot || subpathCount === 0) {
    return {
      ok: false,
      reason:
        'qf-kernel-schema manifest must export "." and at least one string subpath',
    };
  }

  return { ok: true };
}

/** Verify production config forbids private aliases and keeps both bundle excludes. */
export function checkProductionCoupling(configSource: string): CheckResult {
  const aliasBlock = extractMainResolveAliasBlock(configSource);
  if (!aliasBlock) {
    return {
      ok: false,
      reason: "main.resolve.alias block not found in electron.vite.config.ts",
    };
  }

  if (PRIVATE_PACKAGE_RE.test(aliasBlock)) {
    return {
      ok: false,
      reason:
        "forbidden private alias: main.resolve.alias must not reference qf-kernel or qf-kernel-schema",
    };
  }

  const excludeBlock = extractMainExcludeBlock(configSource);
  if (!excludeBlock) {
    return {
      ok: false,
      reason:
        "main.build.externalizeDeps.exclude block not found in electron.vite.config.ts",
    };
  }

  const excludesKernel = /["']qf-kernel["']/.test(excludeBlock);
  const excludesSchema = /["']qf-kernel-schema["']/.test(excludeBlock);

  if (!excludesKernel) {
    return {
      ok: false,
      reason:
        "missing bundle exclude: externalizeDeps.exclude must include qf-kernel",
    };
  }
  if (!excludesSchema) {
    return {
      ok: false,
      reason:
        "missing bundle exclude: externalizeDeps.exclude must include qf-kernel-schema",
    };
  }

  return { ok: true };
}

function applyAliasFalsify(configSource: string): string {
  const aliasBlock = extractMainResolveAliasBlock(configSource);
  if (!aliasBlock) return configSource;

  const injected =
    aliasBlock.slice(0, 1) +
    '\n        { find: "qf-kernel-schema", replacement: "/tmp/forbidden" },' +
    aliasBlock.slice(1);

  return configSource.replace(aliasBlock, injected);
}

function applyExcludeFalsify(configSource: string): string {
  const excludeBlock = extractMainExcludeBlock(configSource);
  if (!excludeBlock) return configSource;

  const broken = excludeBlock.replace(/,?\s*["']qf-kernel-schema["']/g, "");
  return configSource.replace(excludeBlock, broken);
}

function applyManifestFalsify(
  kernelManifest: PackageManifest,
): PackageManifest {
  if (
    typeof kernelManifest.exports !== "object" ||
    kernelManifest.exports === null
  ) {
    return kernelManifest;
  }

  const { ["./portable"]: _removed, ...rest } = kernelManifest.exports as Record<
    string,
    unknown
  >;
  return { ...kernelManifest, exports: rest };
}

export function runSchemaBundleAliasesGate(): { ok: boolean } {
  let configSource = readFileSync(CONFIG_PATH, "utf8");
  const kernelManifest = JSON.parse(
    readFileSync(KERNEL_MANIFEST_PATH, "utf8"),
  ) as PackageManifest;
  const schemaManifest = JSON.parse(
    readFileSync(SCHEMA_MANIFEST_PATH, "utf8"),
  ) as PackageManifest;

  const falsify = process.env.QF_SCHEMA_BUNDLE_ALIASES_FALSIFY;
  let kernelForCheck = kernelManifest;

  switch (falsify) {
    case "alias":
      configSource = applyAliasFalsify(configSource);
      break;
    case "exclude":
      configSource = applyExcludeFalsify(configSource);
      break;
    case "manifest":
      kernelForCheck = applyManifestFalsify(kernelManifest);
      break;
    case undefined:
      break;
    default:
      console.error(
        `schema-bundle-aliases: unknown QF_SCHEMA_BUNDLE_ALIASES_FALSIFY=${falsify}`,
      );
      return { ok: false };
  }

  const manifest = checkPackageManifests(kernelForCheck, schemaManifest);
  if (!manifest.ok) {
    console.error(`schema-bundle-aliases: ${manifest.reason}`);
    return { ok: false };
  }

  const coupling = checkProductionCoupling(configSource);
  if (!coupling.ok) {
    console.error(`schema-bundle-aliases: ${coupling.reason}`);
    return { ok: false };
  }

  return { ok: true };
}

if (import.meta.main) {
  const { ok } = runSchemaBundleAliasesGate();
  process.exit(ok ? 0 : 1);
}
