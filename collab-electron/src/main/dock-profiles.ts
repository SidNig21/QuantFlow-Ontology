/**
 * Package-owned Dock profile bootstrap inputs.
 *
 * Manifests are validated completely before the injected Kernel front door is
 * called. They initialize missing rows only; runtime listing and launch must
 * read the Kernel, never this module.
 */
import {
  existsSync,
  lstatSync,
  readFileSync,
} from "node:fs";
import { dirname, join, posix } from "node:path";
import { resolveRuntimeAdapterMetadata } from "./runtime-adapter";

export const HERMES_DOCK_MANIFEST_REF = "species/hermes/dock-profiles.json";
export const HERMES_DOCK_PACKAGE_REF = "species/hermes/packed/hermes.aospkg";

export type DockAdapterDiagnostic = {
  id: string;
  name: string;
  message: string;
};

/** Product inventory: only real, launchable species are bootstrapped by default. */
export const PRODUCTION_DOCK_PROFILE_MANIFESTS = [
  HERMES_DOCK_MANIFEST_REF,
  "species/claude-code/dock-profiles.json",
] as const;

/** QA-only inventory used by deterministic collaboration/runtime gates. */
export const QA_DOCK_PROFILE_MANIFESTS = [
  ...PRODUCTION_DOCK_PROFILE_MANIFESTS,
  "species/claude-code/qa-dock-profiles.json",
  "tools/qf-proof-agent/dock-profiles.json",
  "tools/runtime-proof/dock-profiles.json",
] as const;

/** Backward-compatible name for the normal product contract. */
export const REQUIRED_DOCK_PROFILE_MANIFESTS = PRODUCTION_DOCK_PROFILE_MANIFESTS;

export const DOCK_DISPLAY_NAMES = [
  "Market Researcher",
  "Orchestrator",
  "Research Director",
  "Critic",
] as const;
export type DockDisplayName = (typeof DOCK_DISPLAY_NAMES)[number];

const HERMES_RESEARCH_DIRECTOR_PROFILE = {
  id: "hermes-research-director",
  role: "orchestrator",
  display_name: "Research Director",
  runtime_profile: "default",
  system_prompt_ref: "prompts/research-director.md",
  capability_groups: ["desk.orchestrate"] as const,
};

export type DockProfileDiscoveryOptions = {
  qaMode?: boolean;
};

export type DockProfileRegistration = {
  name: string;
  role: string;
  display_name: DockDisplayName;
  package_ref: string;
  runtime_profile: string | null;
  system_prompt_ref: string | null;
  capability_groups: Array<"market.read" | "desk.orchestrate" | "research.evaluate">;
};

export type DockProfileManifest = {
  manifestPath: string;
  manifestRef: string;
  adapterId: string;
  packageRef: string;
  profiles: DockProfileRegistration[];
};

export type BootstrapConflict = {
  definitionId: string;
  expected: DockProfileRegistration;
  existing: Record<string, unknown>;
};

export type BootstrapDockProfilesResult = {
  manifests: string[];
  registered: string[];
  skipped: string[];
  conflicts: BootstrapConflict[];
};

export type BootstrapDockProfilesDependencies = {
  getAgentDefinition: (definitionId: string) => Record<string, unknown> | null;
  executeRegisterAgentDefinition: (input: DockProfileRegistration) => unknown;
  reportConflict?: (conflict: BootstrapConflict) => void;
};

export class DockProfilesContractError extends Error {
  override readonly name = "DockProfilesContractError";

  constructor(message: string) {
    super(message);
  }
}

/** Missing-only check for the optional Hermes adapter surface. */
export function getMissingHermesDockDiagnostic(
  appRoot: string,
  exists: (path: string) => boolean = existsSync,
): DockAdapterDiagnostic | null {
  const manifestPath = join(appRoot, HERMES_DOCK_MANIFEST_REF);
  if (!exists(manifestPath)) {
    return {
      id: "hermes-dock-manifest-missing",
      name: "Hermes",
      message:
        "Hermes unavailable: the packaged Hermes Dock manifest is missing. " +
        "Reinstall QuantFlow or run the development app.",
    };
  }
  const packagePath = join(appRoot, HERMES_DOCK_PACKAGE_REF);
  if (!exists(packagePath)) {
    return {
      id: "hermes-dock-package-missing",
      name: "Hermes",
      message:
        "Hermes unavailable: the packaged Hermes adapter package is missing. " +
        "Reinstall QuantFlow or run the development app.",
    };
  }
  return null;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DockProfilesContractError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, i) => key !== wanted[i])) {
    throw new DockProfilesContractError(
      `${label} keys must be exactly [${wanted.join(", ")}], got [${actual.join(", ")}]`,
    );
  }
}

function trimmedString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new DockProfilesContractError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function nullableTrimmedString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return trimmedString(value, label);
}

function displayName(value: unknown, label: string): DockDisplayName {
  const name = trimmedString(value, label);
  if (!(DOCK_DISPLAY_NAMES as readonly string[]).includes(name)) {
    throw new DockProfilesContractError(
      `${label} must be Market Researcher, Orchestrator, Research Director, or Critic`,
    );
  }
  return name as DockDisplayName;
}

function validateProductionHermesDirector(manifest: DockProfileManifest): void {
  if (manifest.manifestRef !== HERMES_DOCK_MANIFEST_REF) return;
  const directorProfiles = manifest.profiles.filter(
    (profile) => profile.name === HERMES_RESEARCH_DIRECTOR_PROFILE.id,
  );
  if (directorProfiles.length !== 1) {
    throw new DockProfilesContractError(
      `${manifest.manifestPath} must contain exactly one ${HERMES_RESEARCH_DIRECTOR_PROFILE.id} profile`,
    );
  }
  if (manifest.profiles.some((profile) => profile.name === "hermes-orchestrator")) {
    throw new DockProfilesContractError(
      `${manifest.manifestPath} must not contain the retired hermes-orchestrator profile`,
    );
  }
  const director = directorProfiles[0]!;
  const expected = HERMES_RESEARCH_DIRECTOR_PROFILE;
  if (
    director.role !== expected.role ||
    director.display_name !== expected.display_name ||
    director.runtime_profile !== expected.runtime_profile ||
    director.system_prompt_ref !== expected.system_prompt_ref ||
    JSON.stringify(director.capability_groups) !== JSON.stringify(expected.capability_groups)
  ) {
    throw new DockProfilesContractError(
      `${manifest.manifestPath} ${expected.id} must use the exact Research Director profile contract`,
    );
  }
  requireRegularFile(
    join(dirname(manifest.manifestPath), expected.system_prompt_ref),
    "Research Director prompt",
  );
}

function normalizedPackagePath(value: unknown, label: string): string {
  const path = trimmedString(value, label);
  const segments = path.split("/");
  if (
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes(":") ||
    /[*?[\]{}]/.test(path) ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..") ||
    posix.normalize(path) !== path
  ) {
    throw new DockProfilesContractError(
      `${label} must be a normalized relative POSIX path without traversal, glob, URI, or backslash`,
    );
  }
  return path;
}

function requireRegularFile(path: string, label: string): void {
  if (!existsSync(path) || !lstatSync(path).isFile()) {
    throw new DockProfilesContractError(`${label} missing or not a regular file: ${path}`);
  }
}

function readManifest(
  appRoot: string,
  manifestRef: string,
): DockProfileManifest {
  const manifestPath = join(appRoot, manifestRef);
  requireRegularFile(manifestPath, "Dock profile manifest");

  const [rootName, adapterDirectory, fileName] = manifestRef.split("/");
  if (
    (rootName !== "species" && rootName !== "tools") ||
    !adapterDirectory ||
    (fileName !== "dock-profiles.json" && fileName !== "qa-dock-profiles.json")
  ) {
    throw new DockProfilesContractError(`invalid Dock profile manifest ref: ${manifestRef}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new DockProfilesContractError(
      `Dock profile manifest is not valid JSON: ${manifestPath}: ${String(error)}`,
    );
  }
  const doc = record(raw, manifestPath);
  exactKeys(doc, ["schema_version", "adapter", "profiles"], manifestPath);
  if (doc.schema_version !== 1) {
    throw new DockProfilesContractError(`${manifestPath}.schema_version must equal 1`);
  }

  const adapter = record(doc.adapter, `${manifestPath}.adapter`);
  exactKeys(adapter, ["id", "package"], `${manifestPath}.adapter`);
  const adapterId = trimmedString(adapter.id, `${manifestPath}.adapter.id`);
  const adapterPackage = normalizedPackagePath(
    adapter.package,
    `${manifestPath}.adapter.package`,
  );
  const packageRef = `${rootName}/${adapterDirectory}/${adapterPackage}`;
  requireRegularFile(join(appRoot, packageRef), "Dock profile runtime package");
  const resolved = resolveRuntimeAdapterMetadata(packageRef, appRoot);
  if (resolved.metadata.adapterId !== adapterId) {
    throw new DockProfilesContractError(
      `${manifestPath} adapter id mismatch: manifest=${adapterId} metadata=${resolved.metadata.adapterId}`,
    );
  }

  if (!Array.isArray(doc.profiles) || doc.profiles.length === 0) {
    throw new DockProfilesContractError(`${manifestPath}.profiles must be non-empty`);
  }
  const ids = new Set<string>();
  const profiles = doc.profiles.map((value, index): DockProfileRegistration => {
    const label = `${manifestPath}.profiles[${index}]`;
    const profile = record(value, label);
    exactKeys(
      profile,
      [
        "id",
        "role",
        "display_name",
        "runtime_profile",
        "system_prompt_ref",
        "capability_groups",
      ],
      label,
    );
    const name = trimmedString(profile.id, `${label}.id`);
    if (ids.has(name)) {
      throw new DockProfilesContractError(`${manifestPath} has duplicate profile id: ${name}`);
    }
    ids.add(name);
    const rawGroups = profile.capability_groups;
    if (!Array.isArray(rawGroups)) {
      throw new DockProfilesContractError(`${label}.capability_groups must be an array`);
    }
    const capability_groups: Array<"market.read" | "desk.orchestrate" | "research.evaluate"> = [];
    for (const group of rawGroups) {
      if (
        group !== "market.read" &&
        group !== "desk.orchestrate" &&
        group !== "research.evaluate"
      ) {
        throw new DockProfilesContractError(
          `${label}.capability_groups entries must be market.read, desk.orchestrate, or research.evaluate`,
        );
      }
      capability_groups.push(group);
    }
    return {
      name,
      role: trimmedString(profile.role, `${label}.role`),
      display_name: displayName(profile.display_name, `${label}.display_name`),
      package_ref: packageRef,
      runtime_profile: nullableTrimmedString(
        profile.runtime_profile,
        `${label}.runtime_profile`,
      ),
      system_prompt_ref: nullableTrimmedString(
        profile.system_prompt_ref,
        `${label}.system_prompt_ref`,
      ),
      capability_groups,
    };
  });

  return { manifestPath, manifestRef, adapterId, packageRef, profiles };
}

export function discoverDockProfileManifests(
  appRoot: string,
  options: DockProfileDiscoveryOptions = {},
): DockProfileManifest[] {
  const required = options.qaMode === true
    ? QA_DOCK_PROFILE_MANIFESTS
    : PRODUCTION_DOCK_PROFILE_MANIFESTS;
  const manifests = required.map((manifestRef) => {
    return readManifest(appRoot, manifestRef);
  });
  const definitionIds = new Set<string>();
  for (const manifest of manifests) {
    validateProductionHermesDirector(manifest);
    for (const profile of manifest.profiles) {
      if (definitionIds.has(profile.name)) {
        throw new DockProfilesContractError(
          `duplicate Dock profile id across manifests: ${profile.name}`,
        );
      }
      definitionIds.add(profile.name);
    }
  }
  return manifests;
}

function sameDefinition(
  existing: Record<string, unknown>,
  expected: DockProfileRegistration,
): boolean {
  return String(existing.id ?? "") === expected.name &&
    String(existing.name ?? "") === expected.name &&
    String(existing.role ?? "") === expected.role &&
    String(existing.display_name ?? "") === expected.display_name &&
    String(existing.package_ref ?? "") === expected.package_ref &&
    (existing.runtime_profile ?? null) === expected.runtime_profile &&
    (existing.system_prompt_ref ?? null) === expected.system_prompt_ref &&
    normalizeCapabilityGroupsJson(existing.capability_groups) ===
      JSON.stringify(expected.capability_groups);
}

function normalizeCapabilityGroupsJson(value: unknown): string {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return JSON.stringify(parsed);
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return JSON.stringify(value);
  return "[]";
}

export function bootstrapDockProfiles(
  appRoot: string,
  dependencies: BootstrapDockProfilesDependencies,
  options: DockProfileDiscoveryOptions = {},
): BootstrapDockProfilesResult {
  // Load and validate the complete package-owned input set before any Kernel call.
  const manifests = discoverDockProfileManifests(appRoot, options);
  const registered: string[] = [];
  const skipped: string[] = [];
  const conflicts: BootstrapConflict[] = [];

  for (const manifest of manifests) {
    for (const profile of manifest.profiles) {
      const existing = dependencies.getAgentDefinition(profile.name);
      if (!existing) {
        dependencies.executeRegisterAgentDefinition({ ...profile });
        registered.push(profile.name);
        continue;
      }
      if (sameDefinition(existing, profile)) {
        skipped.push(profile.name);
        continue;
      }
      const conflict = {
        definitionId: profile.name,
        expected: profile,
        existing,
      };
      conflicts.push(conflict);
      dependencies.reportConflict?.(conflict);
    }
  }

  return {
    manifests: manifests.map((manifest) => manifest.manifestRef),
    registered,
    skipped,
    conflicts,
  };
}
