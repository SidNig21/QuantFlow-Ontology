import { describe, expect, test } from "bun:test";

// The packaged CLI is intentionally plain JavaScript; Bun can execute the
// module for its exported parser without starting the command dispatcher.
// @ts-expect-error no declaration file is needed for the packaged CLI resource.
import {
  BOVADA_CAPTURE_RPC_METHOD,
  parseMarketBovadaFootballArgs,
} from "./collab-cli.mjs";

describe("qf-canvas Bovada market command", () => {
  test("parses --once into the fixed RPC method shape", () => {
    expect(parseMarketBovadaFootballArgs(["--once"])).toEqual({
      params: { mode: "once" },
      timeoutMs: 30_000,
    });
    expect(BOVADA_CAPTURE_RPC_METHOD).toBe("market.bovadaFootballCapture");
  });

  test("parses UTC --at and gives the schedule-aware RPC call a long bound", () => {
    const at = new Date(Date.now() + 60_000).toISOString();
    const parsed = parseMarketBovadaFootballArgs(["--at", at]);
    expect(parsed.params).toEqual({ mode: "at", at });
    expect(parsed.timeoutMs).toBeGreaterThanOrEqual(30_000);
    expect(parsed.timeoutMs).toBeLessThanOrEqual(90_000);
  });

  test("rejects non-UTC, extra, and generic envelope fields", () => {
    expect(() => parseMarketBovadaFootballArgs([
      "--at", "2026-08-01T12:00:00+00:00",
    ])).toThrow("ending in Z");
    expect(() => parseMarketBovadaFootballArgs([
      "--once", "--url", "https://example.invalid",
    ])).toThrow("takes no options");
    expect(() => parseMarketBovadaFootballArgs([
      "--at", "2026-08-01T12:00:00Z", "--headers", "{}",
    ])).toThrow("requires one UTC timestamp");
    expect(() => parseMarketBovadaFootballArgs([
      "--at", new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    ])).toThrow("no more than 24 hours ahead");
  });
});
