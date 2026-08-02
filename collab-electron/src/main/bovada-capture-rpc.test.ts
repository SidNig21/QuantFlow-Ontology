import { describe, expect, test } from "bun:test";
import {
  BOVADA_CAPTURE_RPC_METHOD,
  MAX_BOVADA_SCHEDULE_AHEAD_MS,
  boundBovadaCaptureReceipt,
  createBovadaCaptureRpc,
  parseBovadaCaptureSchedule,
  registerBovadaCaptureRpc,
  validateBovadaAtTimestamp,
  type BovadaCaptureReceipt,
  type BovadaCaptureService,
  type BovadaCaptureTimer,
} from "./bovada-capture-rpc";

const NOW = Date.parse("2026-08-01T12:00:00.000Z");
const CONTENT_HASH =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const RECEIPT: BovadaCaptureReceipt = {
  status: "captured",
  artifactId: CONTENT_HASH,
  contentHash: CONTENT_HASH,
  bytes: 128,
  eventId: "event-1",
  marketId: "market-1",
};

class FakeTimers implements BovadaCaptureTimer {
  private nextHandle = 1;
  private readonly callbacks = new Map<number, () => void>();
  readonly delays: number[] = [];
  clearCount = 0;

  setTimeout(callback: () => void, delayMs: number): number {
    const handle = this.nextHandle++;
    this.delays.push(delayMs);
    this.callbacks.set(handle, callback);
    return handle;
  }

  clearTimeout(handle: unknown): void {
    this.clearCount += 1;
    this.callbacks.delete(handle as number);
  }

  fireNext(): void {
    const entry = this.callbacks.entries().next().value as
      | [number, () => void]
      | undefined;
    if (!entry) throw new Error("no fake timer is pending");
    this.callbacks.delete(entry[0]);
    entry[1]();
  }

  get pending(): number {
    return this.callbacks.size;
  }
}

function service(
  capture: BovadaCaptureService["capture"],
): BovadaCaptureService {
  return { capture };
}

describe("WO-107 fixed Bovada capture RPC boundary", () => {
  test("registers exactly one fixed method with no generic request envelope", () => {
    const calls: unknown[][] = [];
    const binding = registerBovadaCaptureRpc(
      (...args) => calls.push(args),
      { service: service(async () => RECEIPT) },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toBe(BOVADA_CAPTURE_RPC_METHOD);
    expect(binding.method).toBe("market.bovadaFootballCapture");
    expect(binding.metadata.description).toContain("Bovada football capture");
    expect(binding.metadata.params).toEqual({
      mode: 'Required: "once" or "at"',
      at: "UTC ISO-8601 timestamp; required only with mode at",
    });
    expect(binding.metadata.params).not.toHaveProperty("url");
    expect(binding.metadata.params).not.toHaveProperty("headers");
  });

  test("runs --once through the injected service and returns only the bounded receipt", async () => {
    let receivedSignal: AbortSignal | undefined;
    const binding = createBovadaCaptureRpc({
      service: service(async ({ signal }) => {
        receivedSignal = signal;
        return RECEIPT;
      }),
      now: () => NOW,
    });

    await expect(binding.handler({ mode: "once" })).resolves.toEqual(RECEIPT);
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(binding.hasActiveRequest()).toBe(false);
  });

  test("rejects caller-controlled fields and malformed receipt data", async () => {
    const capture = async () => RECEIPT;
    const binding = createBovadaCaptureRpc({ service: service(capture) });

    expect(parseBovadaCaptureSchedule({ mode: "once" })).toEqual({
      mode: "once",
    });
    expect(parseBovadaCaptureSchedule({
      mode: "at",
      at: "2026-08-01T12:00:00Z",
    })).toEqual({ mode: "at", at: "2026-08-01T12:00:00Z" });
    expect(() => parseBovadaCaptureSchedule({
      mode: "once",
      url: "https://example.invalid",
    })).toThrow();
    expect(() => parseBovadaCaptureSchedule({
      mode: "at",
      at: "2026-08-01T12:00:00Z",
      headers: {},
    })).toThrow();

    const unbounded = { ...RECEIPT, rawBody: "must not cross RPC" };
    expect(() => boundBovadaCaptureReceipt(unbounded)).toThrow(
      "unbounded receipt",
    );
    expect(() =>
      boundBovadaCaptureReceipt({
        ...RECEIPT,
        artifactId:
          "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      })
    ).toThrow("artifact ID must equal its content hash");
    await expect(binding.handler({ mode: "once", headers: {} })).rejects.toThrow();
  });

  test("validates strict UTC timestamps and the 24-hour horizon", () => {
    const exactLimit = new Date(
      NOW + MAX_BOVADA_SCHEDULE_AHEAD_MS,
    ).toISOString();
    // The exact limit is allowed; only a target beyond it is rejected.
    expect(validateBovadaAtTimestamp(exactLimit, NOW)).toBe(
      NOW + MAX_BOVADA_SCHEDULE_AHEAD_MS,
    );
    expect(() => validateBovadaAtTimestamp(
      new Date(NOW + MAX_BOVADA_SCHEDULE_AHEAD_MS + 1).toISOString(),
      NOW,
    )).toThrow("24 hours");
    expect(() => validateBovadaAtTimestamp(
      "2026-08-01T12:00:00+00:00",
      NOW,
    )).toThrow("ending in Z");
    expect(() => validateBovadaAtTimestamp(
      "2026-02-30T12:00:00Z",
      NOW,
    )).toThrow("valid UTC timestamp");
  });

  test("owns one timer for --at and starts only when it fires", async () => {
    const timers = new FakeTimers();
    let calls = 0;
    const binding = createBovadaCaptureRpc({
      service: service(async () => {
        calls += 1;
        return RECEIPT;
      }),
      now: () => NOW,
      timers,
    });

    const promise = binding.handler({
      mode: "at",
      at: new Date(NOW + 5_000).toISOString(),
    });
    expect(timers.delays).toEqual([5_000]);
    expect(timers.pending).toBe(1);
    expect(calls).toBe(0);
    timers.fireNext();

    await expect(promise).resolves.toEqual(RECEIPT);
    expect(calls).toBe(1);
    expect(timers.pending).toBe(0);
    expect(binding.hasActiveRequest()).toBe(false);
  });

  test("aborts a running service when the CLI request disconnects", async () => {
    const client = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    let resolveService!: (receipt: BovadaCaptureReceipt) => void;
    const binding = createBovadaCaptureRpc({
      service: service(({ signal }) => {
        receivedSignal = signal;
        return new Promise((resolve) => {
          resolveService = resolve;
        });
      }),
      now: () => NOW,
    });

    const promise = binding.handler(
      { mode: "once" },
      { signal: client.signal },
    );
    await Promise.resolve();
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    client.abort();

    await expect(promise).rejects.toThrow("client disconnected");
    expect(receivedSignal?.aborted).toBe(true);
    expect(binding.hasActiveRequest()).toBe(false);
    resolveService(RECEIPT);
    await Promise.resolve();
  });

  test("rejects immediately for an already-aborted CLI signal", async () => {
    const client = new AbortController();
    client.abort();
    const binding = createBovadaCaptureRpc({
      service: service(async () => RECEIPT),
      now: () => NOW,
    });

    await expect(binding.handler(
      { mode: "once" },
      { signal: client.signal },
    )).rejects.toThrow("client disconnected");
    expect(binding.hasActiveRequest()).toBe(false);
  });

  test("cancels the owned timer and rejects on app shutdown", async () => {
    const timers = new FakeTimers();
    const binding = createBovadaCaptureRpc({
      service: service(async () => RECEIPT),
      now: () => NOW,
      timers,
    });
    const promise = binding.handler({
      mode: "at",
      at: new Date(NOW + 10_000).toISOString(),
    });

    binding.cancelOnAppShutdown();
    await expect(promise).rejects.toThrow("app shutdown");
    expect(timers.clearCount).toBe(1);
    expect(timers.pending).toBe(0);
    expect(binding.hasActiveRequest()).toBe(false);
    await expect(binding.handler({ mode: "once" })).rejects.toThrow(
      "after app shutdown",
    );
  });

  test("rejects a second request while one is active and cleans up service failure", async () => {
    let rejectService!: (error: Error) => void;
    const binding = createBovadaCaptureRpc({
      service: service(() => new Promise((_resolve, reject) => {
        rejectService = reject;
      })),
    });

    const first = binding.handler({ mode: "once" });
    await Promise.resolve();
    await expect(binding.handler({ mode: "once" })).rejects.toThrow(
      "already has an active request",
    );
    rejectService(new Error("capture failed"));
    await expect(first).rejects.toThrow("capture failed");
    expect(binding.hasActiveRequest()).toBe(false);
  });
});
