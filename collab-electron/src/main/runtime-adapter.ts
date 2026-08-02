/**
 * Package-owned runtime adapter metadata.
 *
 * A Kernel definition selects a package and an optional runtime profile. This
 * module resolves the package's immutable adapter contract and expands argv;
 * it never reads or writes Kernel state.
 */
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { basename, isAbsolute, join } from "node:path";
import { packedMetaPathForPackageRef } from "./package-resource-paths";

export const RUNTIME_PROFILE_TOKEN = "{runtime_profile}" as const;

export type RuntimeAdapterRoute = "native_tui" | "host_acp" | "agentos";

export type PeerDeliveryContract = {
  mode: "pty_role";
  runtimeProfiles: string[];
};

export type RuntimeAdapterMetadata = {
  adapterId: string;
  route: RuntimeAdapterRoute;
  packageName: string;
  command: string | null;
  entrypoint: string | null;
  argv: string[];
  profileArgv: string[] | null;
  tools: string[];
  peerDelivery: PeerDeliveryContract | null;
};

export type ResolvedRuntimeAdapter = {
  packageRef: string;
  packagePath: string;
  metadataPath: string;
  metadata: RuntimeAdapterMetadata;
};

export class RuntimeAdapterContractError extends Error {
  override readonly name = "RuntimeAdapterContractError";

  constructor(message: string) {
    super(message);
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RuntimeAdapterContractError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !allowedSet.has(key));
  if (unknown.length > 0) {
    throw new RuntimeAdapterContractError(
      `${label} has unknown key(s): ${unknown.sort().join(", ")}`,
    );
  }
}

function trimmedString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RuntimeAdapterContractError(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function stringArray(
  value: unknown,
  label: string,
  options: { nonEmpty: boolean },
): string[] {
  if (!Array.isArray(value) || (options.nonEmpty && value.length === 0)) {
    throw new RuntimeAdapterContractError(
      `${label} must be ${options.nonEmpty ? "a non-empty" : "an"} array`,
    );
  }
  return value.map((entry, index) => trimmedString(entry, `${label}[${index}]`));
}

function parseRoute(value: unknown, label: string): RuntimeAdapterRoute {
  if (value === "native_tui" || value === "host_acp" || value === "agentos") {
    return value;
  }
  throw new RuntimeAdapterContractError(
    `${label} must be native_tui, host_acp, or agentos`,
  );
}

function validateBaseArgv(argv: string[], label: string): void {
  for (const token of argv) {
    if (token.includes("{") || token.includes("}")) {
      throw new RuntimeAdapterContractError(
        `${label} may not contain placeholder tokens`,
      );
    }
  }
}

function validateProfileArgv(argv: string[], label: string): void {
  let selectors = 0;
  for (const token of argv) {
    if (token === RUNTIME_PROFILE_TOKEN) {
      selectors += 1;
      continue;
    }
    if (token.includes("{") || token.includes("}")) {
      throw new RuntimeAdapterContractError(
        `${label} contains an unknown or partial placeholder: ${token}`,
      );
    }
  }
  if (selectors !== 1) {
    throw new RuntimeAdapterContractError(
      `${label} must contain exactly one ${RUNTIME_PROFILE_TOKEN} token`,
    );
  }
}

function parsePeerDelivery(value: unknown): PeerDeliveryContract | null {
  if (value === undefined) return null;
  const doc = record(value, "adapter metadata peer_delivery");
  exactKeys(doc, ["mode", "runtime_profiles"], "adapter metadata peer_delivery");
  if (doc.mode !== "pty_role") {
    throw new RuntimeAdapterContractError(
      "adapter metadata peer_delivery.mode must be pty_role",
    );
  }
  const runtimeProfiles = stringArray(
    doc.runtime_profiles,
    "adapter metadata peer_delivery.runtime_profiles",
    { nonEmpty: true },
  );
  if (new Set(runtimeProfiles).size !== runtimeProfiles.length) {
    throw new RuntimeAdapterContractError(
      "adapter metadata peer_delivery.runtime_profiles must be unique",
    );
  }
  return { mode: "pty_role", runtimeProfiles };
}

export function parseRuntimeAdapterMetadata(
  value: unknown,
  source = "adapter metadata",
): RuntimeAdapterMetadata {
  const doc = record(value, source);
  exactKeys(
    doc,
    [
      "name",
      "route",
      "package",
      "command",
      "entrypoint",
      "argv",
      "profile_argv",
      "tools",
      "peer_delivery",
    ],
    source,
  );

  const adapterId = trimmedString(doc.name, `${source}.name`);
  const route = parseRoute(doc.route, `${source}.route`);
  const packageName = trimmedString(doc.package, `${source}.package`);
  const command = doc.command === undefined || doc.command === null
    ? null
    : trimmedString(doc.command, `${source}.command`);
  const entrypoint = doc.entrypoint === undefined || doc.entrypoint === null
    ? null
    : trimmedString(doc.entrypoint, `${source}.entrypoint`);
  if (basename(packageName) !== packageName || packageName.includes("\\")) {
    throw new RuntimeAdapterContractError(
      `${source}.package must name the sibling package file`,
    );
  }

  const argv =
    doc.argv === undefined
      ? []
      : stringArray(doc.argv, `${source}.argv`, { nonEmpty: route === "native_tui" });
  const profileArgv =
    doc.profile_argv === undefined
      ? null
      : stringArray(doc.profile_argv, `${source}.profile_argv`, { nonEmpty: true });
  if (route === "native_tui" && argv.length === 0 && !profileArgv) {
    throw new RuntimeAdapterContractError(
      `${source}.argv must be non-empty for native_tui`,
    );
  }
  validateBaseArgv(argv, `${source}.argv`);

  if (profileArgv) validateProfileArgv(profileArgv, `${source}.profile_argv`);

  const tools =
    doc.tools === undefined
      ? []
      : stringArray(doc.tools, `${source}.tools`, { nonEmpty: false });
  if (new Set(tools).size !== tools.length) {
    throw new RuntimeAdapterContractError(`${source}.tools must be unique`);
  }

  const peerDelivery = parsePeerDelivery(doc.peer_delivery);
  if (peerDelivery && route !== "native_tui") {
    throw new RuntimeAdapterContractError(
      `${source}.peer_delivery requires route=native_tui`,
    );
  }

  return {
    adapterId,
    route,
    packageName,
    command,
    entrypoint,
    argv,
    profileArgv,
    tools,
    peerDelivery,
  };
}

function requireRegularFile(path: string, label: string): void {
  if (!existsSync(path) || !lstatSync(path).isFile()) {
    throw new RuntimeAdapterContractError(`${label} missing: ${path}`);
  }
}

export function resolveRuntimeAdapterMetadata(
  packageRef: string,
  appRoot: string,
): ResolvedRuntimeAdapter {
  const packagePath = isAbsolute(packageRef) ? packageRef : join(appRoot, packageRef);
  requireRegularFile(packagePath, "runtime package");
  const metadataPath = packedMetaPathForPackageRef(packageRef, appRoot);
  if (!metadataPath) {
    throw new RuntimeAdapterContractError(
      `runtime package has no sibling metadata path: ${packageRef}`,
    );
  }
  requireRegularFile(metadataPath, "runtime adapter metadata");

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(metadataPath, "utf8"));
  } catch (error) {
    throw new RuntimeAdapterContractError(
      `runtime adapter metadata is not valid JSON: ${metadataPath}: ${String(error)}`,
    );
  }
  const metadata = parseRuntimeAdapterMetadata(raw, metadataPath);
  const expectedPackage = basename(packageRef);
  if (metadata.packageName !== expectedPackage) {
    throw new RuntimeAdapterContractError(
      `runtime adapter metadata package mismatch: expected ${expectedPackage}, got ${metadata.packageName}`,
    );
  }
  return { packageRef, packagePath, metadataPath, metadata };
}

export function expandRuntimeAdapterArgv(
  metadata: RuntimeAdapterMetadata,
  runtimeProfile: string | null,
): string[] {
  if (runtimeProfile === null) return [...metadata.argv];
  const selector = runtimeProfile.trim();
  if (selector.length === 0) {
    throw new RuntimeAdapterContractError(
      "runtime profile must be non-empty when supplied",
    );
  }
  if (!metadata.profileArgv) {
    throw new RuntimeAdapterContractError(
      `adapter ${metadata.adapterId} does not declare profile_argv`,
    );
  }
  return metadata.profileArgv.map((token) =>
    token === RUNTIME_PROFILE_TOKEN ? selector : token
  );
}

export function allowsPtyRoleDelivery(
  metadata: RuntimeAdapterMetadata,
  runtimeProfile: string | null,
): boolean {
  return runtimeProfile !== null &&
    metadata.peerDelivery?.runtimeProfiles.includes(runtimeProfile) === true;
}
