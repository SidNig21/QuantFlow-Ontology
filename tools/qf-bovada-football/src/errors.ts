export type BovadaErrorCode =
  | "transport"
  | "timeout"
  | "cancelled"
  | "redirect"
  | "response"
  | "body"
  | "json"
  | "schema"
  | "selection"
  | "artifact"
  | "kernel";

/** Base error for failures that must not expose response headers or body bytes. */
export class BovadaFootballError extends Error {
  readonly code: BovadaErrorCode;

  constructor(code: BovadaErrorCode, message: string) {
    super(message);
    this.name = "BovadaFootballError";
    this.code = code;
  }
}

export class BovadaTransportError extends BovadaFootballError {
  constructor(message = "Bovada public request failed") {
    super("transport", message);
    this.name = "BovadaTransportError";
  }
}

export class BovadaTimeoutError extends BovadaFootballError {
  constructor() {
    super("timeout", "Bovada public request exceeded its fixed deadline");
    this.name = "BovadaTimeoutError";
  }
}

export class BovadaCancelledError extends BovadaFootballError {
  constructor() {
    super("cancelled", "Bovada public request was cancelled");
    this.name = "BovadaCancelledError";
  }
}

export class BovadaRedirectError extends BovadaFootballError {
  readonly origin: string;

  constructor(origin: string) {
    super("redirect", "Bovada response ended on an unapproved origin");
    this.name = "BovadaRedirectError";
    this.origin = origin;
  }
}

export class BovadaResponseError extends BovadaFootballError {
  readonly status: number;

  constructor(status: number) {
    super("response", "Bovada public response status was " + status);
    this.name = "BovadaResponseError";
    this.status = status;
  }
}

export class BovadaBodyTooLargeError extends BovadaFootballError {
  readonly limit: number;

  constructor(limit: number) {
    super("body", "Bovada public response exceeded " + limit + " bytes");
    this.name = "BovadaBodyTooLargeError";
    this.limit = limit;
  }
}

export class BovadaBodyError extends BovadaFootballError {
  constructor(message: string) {
    super("body", message);
    this.name = "BovadaBodyError";
  }
}

export class BovadaJsonError extends BovadaFootballError {
  constructor() {
    super("json", "Bovada public response was not valid UTF-8 JSON");
    this.name = "BovadaJsonError";
  }
}

export class BovadaSchemaError extends BovadaFootballError {
  constructor(message: string) {
    super("schema", "Bovada response shape rejected: " + message);
    this.name = "BovadaSchemaError";
  }
}

export class BovadaSelectionError extends BovadaFootballError {
  constructor(message: string) {
    super("selection", "Bovada football selection rejected: " + message);
    this.name = "BovadaSelectionError";
  }
}

export class ArtifactOwnershipError extends BovadaFootballError {
  constructor(message: string) {
    super("artifact", message);
    this.name = "ArtifactOwnershipError";
  }
}

export class KernelClassificationError extends BovadaFootballError {
  constructor(message: string) {
    super("kernel", message);
    this.name = "KernelClassificationError";
  }
}
