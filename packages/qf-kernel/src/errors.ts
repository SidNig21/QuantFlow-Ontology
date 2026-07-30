/** Typed rejection: illegal state transition — nothing was written. */
export class IllegalTransitionError extends Error {
  readonly type: string;
  readonly from: string;
  readonly to: string;

  constructor(type: string, from: string, to: string) {
    super(`Illegal transition for ${type}: ${from} → ${to}`);
    this.name = "IllegalTransitionError";
    this.type = type;
    this.from = from;
    this.to = to;
  }
}

/** Command rejected because trace context is missing. */
export class MissingTraceError extends Error {
  constructor(missing: "trace_id" | "span_id") {
    super(`Command rejected: ctx.${missing} is required`);
    this.name = "MissingTraceError";
  }
}

/** Unknown command / object / row. */
export class KernelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KernelError";
  }
}

/** Market batch input cannot be represented as deterministic Kernel state — nothing written. */
export class MarketIngestValidationError extends KernelError {
  readonly reason: string;

  constructor(reason: string) {
    super(`Market ingest rejected: ${reason}`);
    this.name = "MarketIngestValidationError";
    this.reason = reason;
  }
}

/** Existing market identity disagrees with the requested row, provenance, or derived edge. */
export class MarketIngestConflictError extends KernelError {
  readonly object_type: "instrument" | "quote";
  readonly object_id: string;
  readonly reason: string;

  constructor(
    object_type: "instrument" | "quote",
    object_id: string,
    reason: string,
  ) {
    super(`Market ingest conflict for ${object_type} "${object_id}": ${reason}`);
    this.name = "MarketIngestConflictError";
    this.object_type = object_type;
    this.object_id = object_id;
    this.reason = reason;
  }
}

/** Caller-supplied content_hash disagrees with Kernel-computed hash — nothing written. */
export class ContentHashMismatchError extends Error {
  readonly supplied: string;
  readonly computed: string;

  constructor(supplied: string, computed: string) {
    super(
      `Content hash mismatch: supplied=${supplied} computed=${computed}`,
    );
    this.name = "ContentHashMismatchError";
    this.supplied = supplied;
    this.computed = computed;
  }
}

/**
 * Same content bytes already published under different kind/storage_ref —
 * nothing written. Content-addressing is idempotent; metadata conflict is not.
 */
export class ArtifactMetadataConflictError extends Error {
  readonly field: "kind" | "storage_ref";
  readonly existing: string;
  readonly attempted: string;

  constructor(field: "kind" | "storage_ref", existing: string, attempted: string) {
    super(
      `Artifact metadata conflict on ${field}: existing=${existing} attempted=${attempted}`,
    );
    this.name = "ArtifactMetadataConflictError";
    this.field = field;
    this.existing = existing;
    this.attempted = attempted;
  }
}

/** Registry name already taken (id = name) — nothing written. */
export class AgentDefinitionExistsError extends Error {
  readonly species: string;

  constructor(species: string) {
    super(`agent_definition already registered: name=${species}`);
    this.name = "AgentDefinitionExistsError";
    this.species = species;
  }
}

/** Link kind unknown or endpoints violate schema declarations — nothing written. */
export class IllegalLinkError extends Error {
  readonly layer: "kind" | "endpoint";
  readonly detail: string;
  readonly expected: string;

  constructor(layer: "kind" | "endpoint", detail: string, expected: string) {
    super(`Illegal link (${layer}): ${detail} — expected ${expected}`);
    this.name = "IllegalLinkError";
    this.layer = layer;
    this.detail = detail;
    this.expected = expected;
  }
}

/** System-produced object cannot arrive in a fabricated terminal state — nothing written. */
export class FabricatedStateError extends Error {
  readonly object_type: string;
  readonly origin: string;
  readonly grade: string;

  constructor(object_type: string, origin: string, grade: string) {
    super(
      `${object_type} with origin=${origin} cannot be created in terminal grade=${grade}`,
    );
    this.name = "FabricatedStateError";
    this.object_type = object_type;
    this.origin = origin;
    this.grade = grade;
  }
}

/** Species package_ref does not resolve on disk — spawn must fail loudly. */
export class PackageRefUnresolvedError extends Error {
  readonly species: string;
  readonly packageRef: string;
  readonly resolved: string;

  constructor(species: string, packageRef: string, resolved: string) {
    super(
      `package_ref unresolved for species=${species} ref=${packageRef} resolved=${resolved}`,
    );
    this.name = "PackageRefUnresolvedError";
    this.species = species;
    this.packageRef = packageRef;
    this.resolved = resolved;
  }
}

/** No agent_definition row for the requested species name. */
export class UnknownSpeciesError extends Error {
  readonly species: string;

  constructor(species: string) {
    super(`unknown species: ${species}`);
    this.name = "UnknownSpeciesError";
    this.species = species;
  }
}

/**
 * Object-type registry disagrees with the shipping schema (WO-K3).
 * Writable opens throw this before any domain write.
 */
export class KernelRegistryDriftError extends Error {
  readonly missing: string[];
  readonly retired: string[];
  readonly inconsistent: string[];

  constructor(drift: {
    missing: string[];
    retired: string[];
    inconsistent: string[];
  }) {
    super(
      `Kernel object-type registry drift: missing=[${drift.missing.join(",")}] retired=[${drift.retired.join(",")}] inconsistent=[${drift.inconsistent.join(",")}]`,
    );
    this.name = "KernelRegistryDriftError";
    this.missing = drift.missing;
    this.retired = drift.retired;
    this.inconsistent = drift.inconsistent;
  }
}

/**
 * Database shape is not an exact supported upgrade predecessor or current authority —
 * upgrade refuses before mutation.
 */
export class KernelUpgradeShapeError extends Error {
  readonly upgrade: string;

  constructor(upgrade: string, detail: string) {
    super(`Kernel upgrade shape error (${upgrade}): ${detail}`);
    this.name = "KernelUpgradeShapeError";
    this.upgrade = upgrade;
  }
}

/** create_agent_session rejected unknown agent_definition_id — nothing written. */
export class UnknownAgentDefinitionError extends Error {
  readonly definitionId: string;

  constructor(definitionId: string) {
    super(`unknown agent_definition_id: ${definitionId}`);
    this.name = "UnknownAgentDefinitionError";
    this.definitionId = definitionId;
  }
}

/** Caller supplied a system-owned spawned_from link — nothing written. */
export class SpawnedFromLinkRejectedError extends Error {
  constructor() {
    super("create_agent_session rejects caller-supplied spawned_from link");
    this.name = "SpawnedFromLinkRejectedError";
  }
}

/**
 * Database has a schema_meta table but is not a completed Kernel initialization
 * (WO-K3 RULING 3). Bare migration CREATE TABLE cannot repair it in place.
 */
export class KernelIncompleteInitializationError extends Error {
  constructor(detail: string) {
    super(
      `Kernel incomplete initialization: ${detail}. Wipe-and-recreate (SCOPES.md); do not repair in place.`,
    );
    this.name = "KernelIncompleteInitializationError";
  }
}
