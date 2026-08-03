import { resolve } from "node:path";
import {
  expandRuntimeAdapterArgv,
  resolveRuntimeAdapterMetadata,
  type ResolvedRuntimeAdapter,
} from "./runtime-adapter";

export type DefinitionRuntime = ResolvedRuntimeAdapter & {
  definitionId: string;
  role: string;
  runtimeProfile: string | null;
  systemPromptRef: string | null;
  argv: string[];
  entrypointPath: string | null;
};

export type DefinitionReader = (
  definitionId: string,
) => Record<string, unknown> | null;

/** Renderer launch contract: one closed definitionId field and no host overrides. */
export function parseDefinitionLaunchRequest(args: unknown): string {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new Error("launch requires { definitionId:string }");
  }
  const record = args as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 1 || keys[0] !== "definitionId") {
    const rejected = keys.filter((key) => key !== "definitionId").sort();
    throw new Error(
      rejected.length > 0
        ? `launch rejects renderer fields: ${rejected.join(", ")}`
        : "launch requires exactly one definitionId field",
    );
  }
  if (
    typeof record.definitionId !== "string" ||
    record.definitionId.trim().length === 0
  ) {
    throw new Error("launch requires a non-empty definitionId");
  }
  return record.definitionId.trim();
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`agent definition ${field} must be null or a non-empty string`);
  }
  return value.trim();
}

/** Resolve one Kernel definition into its immutable package-owned runtime contract. */
export function resolveDefinitionRuntime(
  definitionId: string,
  appRoot: string,
  getDefinition: DefinitionReader,
): DefinitionRuntime {
  if (typeof definitionId !== "string" || definitionId.trim().length === 0) {
    throw new Error("definition runtime requires a non-empty definitionId");
  }
  const exactId = definitionId.trim();
  const row = getDefinition(exactId);
  if (!row) throw new Error(`unknown agent definition: ${exactId}`);
  if (String(row.id ?? "") !== exactId) {
    throw new Error(`agent definition identity mismatch: requested=${exactId}`);
  }
  const packageRef = nullableString(row.package_ref, "package_ref");
  if (!packageRef) {
    throw new Error(`agent definition ${exactId} has no package_ref`);
  }
  const role = nullableString(row.role, "role");
  if (!role) throw new Error(`agent definition ${exactId} has no role`);
  const runtimeProfile = nullableString(row.runtime_profile, "runtime_profile");
  const systemPromptRef = nullableString(
    row.system_prompt_ref,
    "system_prompt_ref",
  );
  const resolved = resolveRuntimeAdapterMetadata(packageRef, appRoot);
  return {
    ...resolved,
    definitionId: exactId,
    role,
    runtimeProfile,
    systemPromptRef,
    argv: expandRuntimeAdapterArgv(resolved.metadata, runtimeProfile),
    entrypointPath: resolved.metadata.entrypoint
      ? resolve(resolved.metadataPath, "..", resolved.metadata.entrypoint)
      : null,
  };
}

export type RuntimeSoftware = {
  adapterId: string;
  packagePath: string;
};

export function runtimeSoftwareIdentity(
  adapterId: string,
  packagePath: string,
): RuntimeSoftware & { key: string } {
  const normalizedPath = resolve(packagePath);
  return {
    adapterId,
    packagePath: normalizedPath,
    key: `${adapterId}\0${normalizedPath}`,
  };
}

/** Collapse many profile definitions onto one admitted adapter package. */
export function collectUniqueRuntimeSoftware(
  rows: readonly Record<string, unknown>[],
  appRoot: string,
  getDefinition: DefinitionReader,
): RuntimeSoftware[] {
  const unique = new Map<string, RuntimeSoftware>();
  for (const row of rows) {
    const definitionId = String(row.id ?? "");
    if (!definitionId) continue;
    const runtime = resolveDefinitionRuntime(definitionId, appRoot, getDefinition);
    const identity = runtimeSoftwareIdentity(
      runtime.metadata.adapterId,
      runtime.packagePath,
    );
    if (!unique.has(identity.key)) {
      unique.set(identity.key, {
        adapterId: identity.adapterId,
        packagePath: identity.packagePath,
      });
    }
  }
  return [...unique.values()];
}
