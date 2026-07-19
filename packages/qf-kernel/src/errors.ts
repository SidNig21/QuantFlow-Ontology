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

/** agent_session insert rejected: guest must supply the id (never mint). */
export class MissingSessionIdError extends Error {
  constructor() {
    super("agent_session insert rejected: id must be supplied (adopted, never minted)");
    this.name = "MissingSessionIdError";
  }
}

/** Unknown command / object / row. */
export class KernelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KernelError";
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
