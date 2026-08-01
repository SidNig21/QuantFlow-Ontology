/**
 * Fixed operator boundary for the one-shot Bovada football capture.
 *
 * This module deliberately knows nothing about vendor parsing, the Kernel, or
 * Electron. The eventual main-process integration supplies the capture
 * service and connects the returned lifecycle hooks to the RPC server/app.
 */

export const BOVADA_CAPTURE_RPC_METHOD =
  "market.bovadaFootballCapture" as const;

export const MAX_BOVADA_SCHEDULE_AHEAD_MS = 24 * 60 * 60 * 1000;
export const MAX_BOVADA_CAPTURE_BYTES = 5 * 1024 * 1024;
const MAX_RECEIPT_ID_LENGTH = 256;

export type BovadaCaptureSchedule =
  | { readonly mode: "once" }
  | { readonly mode: "at"; readonly at: string };

/**
 * The only result shape that crosses the RPC boundary. Raw response bytes,
 * headers, and arbitrary service fields are intentionally not representable.
 */
export interface BovadaCaptureReceipt {
  readonly status: "captured" | "deduped";
  readonly artifactId: string;
  readonly contentHash: string;
  readonly bytes: number;
  readonly eventId: string;
  readonly marketId: string;
}

/**
 * Core-owned capture seam. The service owns the bounded network/Kernel work;
 * this boundary owns only one scheduled invocation and its cancellation.
 */
export interface BovadaCaptureService {
  capture(request: { readonly signal: AbortSignal }):
    Promise<BovadaCaptureReceipt>;
}

export interface BovadaCaptureTimer {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

/**
 * The future JSON-RPC server supplies the request's per-connection lifetime.
 * Closing the CLI socket aborts this signal; no second cancellation envelope
 * or callback registry is needed.
 */
export interface BovadaCaptureRpcRequestContext {
  readonly signal: AbortSignal;
}

export interface BovadaCaptureRpcMetadata {
  readonly description: string;
  readonly params: Record<string, string>;
}

export type BovadaCaptureRpcHandler = (
  params: unknown,
  context?: BovadaCaptureRpcRequestContext,
) => Promise<BovadaCaptureReceipt>;

export type RegisterMethod = (
  method: string,
  handler: (
    params: unknown,
    context?: BovadaCaptureRpcRequestContext,
  ) => unknown | Promise<unknown>,
  metadata?: {
    description?: string;
    params?: Record<string, string>;
  },
) => void;

export type BovadaCaptureCancellation =
  | "client disconnected"
  | "app shutdown";

export interface BovadaCaptureRpcBinding {
  readonly method: typeof BOVADA_CAPTURE_RPC_METHOD;
  readonly metadata: BovadaCaptureRpcMetadata;
  readonly handler: BovadaCaptureRpcHandler;
  readonly cancelOnAppShutdown: () => void;
  readonly hasActiveRequest: () => boolean;
}

export interface BovadaCaptureRpcOptions {
  readonly service: BovadaCaptureService;
  readonly now?: () => number;
  readonly timers?: BovadaCaptureTimer;
}

const RPC_METADATA: BovadaCaptureRpcMetadata = {
  description: "Run one bounded public Bovada football capture",
  params: {
    mode: 'Required: "once" or "at"',
    at: "UTC ISO-8601 timestamp; required only with mode at",
  },
};

const DEFAULT_TIMERS: BovadaCaptureTimer = {
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => {
    globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>);
  },
};

type ActiveRequest = {
  readonly controller: AbortController;
  readonly resolve: (receipt: BovadaCaptureReceipt) => void;
  readonly reject: (reason: Error) => void;
  timer: unknown | null;
  started: boolean;
  cancelled: boolean;
  settled: boolean;
  disconnectCleanup: (() => void) | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  record: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(record).sort();
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]);
}

/** Parse the intentionally tiny fixed RPC parameter shape. */
export function parseBovadaCaptureSchedule(
  params: unknown,
): BovadaCaptureSchedule {
  if (!isRecord(params)) {
    throw new Error("Bovada capture params must be an object");
  }

  if (params.mode === "once" && hasExactKeys(params, ["mode"])) {
    return { mode: "once" };
  }

  if (
    params.mode === "at" &&
    typeof params.at === "string" &&
    hasExactKeys(params, ["at", "mode"])
  ) {
    return { mode: "at", at: params.at };
  }

  throw new Error(
    'Bovada capture params must be exactly {mode:"once"} or ' +
      '{mode:"at",at:<UTC ISO-8601 timestamp>}',
  );
}

const UTC_TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?Z$/;

/** Validate UTC form and the maximum scheduling horizon. */
export function validateBovadaAtTimestamp(
  at: string,
  now: number,
): number {
  if (!Number.isFinite(now)) {
    throw new Error("Bovada capture clock returned an invalid time");
  }

  const match = UTC_TIMESTAMP.exec(at);
  if (!match) {
    throw new Error("Bovada capture --at must be an ISO-8601 UTC timestamp ending in Z");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  const millisecond = Number((match[7] ?? "").padEnd(3, "0") || "0");
  const target = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond,
  );

  const date = new Date(target);
  if (
    !Number.isFinite(target) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second ||
    date.getUTCMilliseconds() !== millisecond
  ) {
    throw new Error("Bovada capture --at is not a valid UTC timestamp");
  }

  if (target - now > MAX_BOVADA_SCHEDULE_AHEAD_MS) {
    throw new Error("Bovada capture --at may be no more than 24 hours ahead");
  }

  return target;
}

function isBoundedId(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_RECEIPT_ID_LENGTH &&
    value.trim() === value &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

/** Make the service result a fixed, raw-data-free RPC receipt. */
export function boundBovadaCaptureReceipt(
  value: unknown,
): BovadaCaptureReceipt {
  if (!isRecord(value)) {
    throw new Error("Bovada capture service returned an invalid receipt");
  }

  const expectedKeys = [
    "artifactId",
    "bytes",
    "contentHash",
    "eventId",
    "marketId",
    "status",
  ] as const;
  if (!hasExactKeys(value, expectedKeys)) {
    throw new Error("Bovada capture service returned an unbounded receipt");
  }

  if (value.status !== "captured" && value.status !== "deduped") {
    throw new Error("Bovada capture receipt has an invalid status");
  }
  if (
    !isBoundedId(value.artifactId) ||
    !isBoundedId(value.eventId) ||
    !isBoundedId(value.marketId)
  ) {
    throw new Error("Bovada capture receipt has an invalid identifier");
  }
  if (
    typeof value.contentHash !== "string" ||
    !/^[0-9a-f]{64}$/.test(value.contentHash)
  ) {
    throw new Error("Bovada capture receipt has an invalid content hash");
  }
  if (value.artifactId !== value.contentHash) {
    throw new Error("Bovada capture receipt artifact ID must equal its content hash");
  }
  if (
    typeof value.bytes !== "number" ||
    !Number.isSafeInteger(value.bytes) ||
    value.bytes < 0 ||
    value.bytes > MAX_BOVADA_CAPTURE_BYTES
  ) {
    throw new Error("Bovada capture receipt has an invalid byte count");
  }

  return {
    status: value.status,
    artifactId: value.artifactId,
    contentHash: value.contentHash,
    bytes: value.bytes,
    eventId: value.eventId,
    marketId: value.marketId,
  };
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function cancellationError(reason: BovadaCaptureCancellation): Error {
  return new Error(`Bovada football capture canceled: ${reason}`);
}

/** Build the one-method, one-timer, abortable RPC boundary. */
export function createBovadaCaptureRpc(
  options: BovadaCaptureRpcOptions,
): BovadaCaptureRpcBinding {
  const now = options.now ?? (() => Date.now());
  const timers = options.timers ?? DEFAULT_TIMERS;
  let active: ActiveRequest | null = null;
  let appShutdown = false;

  function cleanupDisconnect(run: ActiveRequest): void {
    if (!run.disconnectCleanup) return;
    const cleanup = run.disconnectCleanup;
    run.disconnectCleanup = null;
    try {
      cleanup();
    } catch {
      // Lifecycle cleanup is best-effort; the request result remains primary.
    }
  }

  function finish(run: ActiveRequest, result: BovadaCaptureReceipt): void {
    if (run.cancelled || run.settled) return;
    run.settled = true;
    cleanupDisconnect(run);
    if (active === run) active = null;
    // The receipt is already bounded before it reaches the caller.
    run.resolve(result);
  }

  function fail(run: ActiveRequest, error: Error): void {
    if (run.cancelled || run.settled) return;
    run.settled = true;
    cleanupDisconnect(run);
    if (active === run) active = null;
    run.reject(error);
  }

  function start(run: ActiveRequest): void {
    if (run.cancelled || run.settled) return;
    run.timer = null;
    run.started = true;

    let servicePromise: Promise<BovadaCaptureReceipt>;
    try {
      servicePromise = options.service.capture({
        signal: run.controller.signal,
      });
    } catch (error) {
      fail(run, toError(error));
      return;
    }

    void Promise.resolve(servicePromise).then(
      (receipt) => {
        try {
          finish(run, boundBovadaCaptureReceipt(receipt));
        } catch (error) {
          fail(run, toError(error));
        }
      },
      (error) => fail(run, toError(error)),
    );
  }

  function cancel(
    run: ActiveRequest | null,
    reason: BovadaCaptureCancellation,
  ): void {
    if (!run || run.cancelled || run.settled) return;
    run.cancelled = true;
    if (run.timer !== null) {
      timers.clearTimeout(run.timer);
      run.timer = null;
    }
    cleanupDisconnect(run);
    run.controller.abort(cancellationError(reason));
    if (active === run) active = null;
    run.settled = true;
    run.reject(cancellationError(reason));
  }

  const handler: BovadaCaptureRpcHandler = async (params, context) => {
    if (appShutdown) {
      throw new Error("Bovada football capture unavailable after app shutdown");
    }
    if (active) {
      throw new Error("Bovada football capture already has an active request");
    }

    const schedule = parseBovadaCaptureSchedule(params);
    const currentTime = now();
    if (!Number.isFinite(currentTime)) {
      throw new Error("Bovada capture clock returned an invalid time");
    }
    const target = schedule.mode === "at"
      ? validateBovadaAtTimestamp(schedule.at, currentTime)
      : currentTime;
    const delay = Math.max(0, target - currentTime);

    let resolveRequest!: (receipt: BovadaCaptureReceipt) => void;
    let rejectRequest!: (reason: Error) => void;
    const promise = new Promise<BovadaCaptureReceipt>((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
    const run: ActiveRequest = {
      controller: new AbortController(),
      resolve: resolveRequest,
      reject: rejectRequest,
      timer: null,
      started: false,
      cancelled: false,
      settled: false,
      disconnectCleanup: null,
    };
    active = run;

    if (context) {
      const onAbort = () => {
        cancel(run, "client disconnected");
      };
      if (context.signal.aborted) {
        onAbort();
      } else {
        context.signal.addEventListener("abort", onAbort, { once: true });
        run.disconnectCleanup = () => {
          context.signal.removeEventListener("abort", onAbort);
        };
      }
    }

    if (delay > 0) {
      run.timer = timers.setTimeout(() => start(run), delay);
    } else {
      queueMicrotask(() => start(run));
    }

    return promise;
  };

  const binding: BovadaCaptureRpcBinding = {
    method: BOVADA_CAPTURE_RPC_METHOD,
    metadata: RPC_METADATA,
    handler,
    cancelOnAppShutdown: () => {
      appShutdown = true;
      cancel(active, "app shutdown");
    },
    hasActiveRequest: () => active !== null,
  };

  return binding;
}

/** Register exactly the fixed Bovada method and return its lifecycle seam. */
export function registerBovadaCaptureRpc(
  registerMethod: RegisterMethod,
  options: BovadaCaptureRpcOptions,
): BovadaCaptureRpcBinding {
  const binding = createBovadaCaptureRpc(options);
  registerMethod(binding.method, binding.handler, binding.metadata);
  return binding;
}
