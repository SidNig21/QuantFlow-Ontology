import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseTrustedHermesRuntimeReceipt,
  trustedHermesRuntimeReceiptForSession,
} from "./market-runtime-receipt";

test("isolated Hermes log supplies the latest exact credential-free provider receipt", () => {
  const root = mkdtempSync(join(tmpdir(), "qf-runtime-receipt-"));
  const sessionId = "worker-123";
  const logs = join(root, "hermes-profiles", "profiles", `quantflow-runtime-${sessionId}`, "logs");
  mkdirSync(logs, { recursive: true });
  writeFileSync(join(logs, "agent.log"), [
    "unrelated line containing token=secret is never parsed",
    "2026-09-08 02:48:51,118 INFO [turn_one] run_agent: API call #1: model=kimi-k3 provider=opencode-go in=1949 out=1498 total=3447 latency=17.2s",
    "2026-09-08 02:51:10,474 INFO [turn_one] run_agent: API call #2: model=kimi-k3 provider=opencode-go in=8751 out=4545 total=13296 latency=131.2s cache=3072/8751 (35%)",
  ].join("\n"));
  try {
    expect(trustedHermesRuntimeReceiptForSession(sessionId, root)).toEqual({
      provider: "opencode-go",
      model: "kimi-k3",
      runtime: "hermes-native-tui",
      input_tokens: 8751,
      output_tokens: 4545,
      total_tokens: 13296,
      latency_seconds: 131.2,
    });
    expect(trustedHermesRuntimeReceiptForSession("../foreign", root)).toBeNull();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("malformed, unbalanced, or foreign log prose cannot become a runtime receipt", () => {
  expect(parseTrustedHermesRuntimeReceipt("model=kimi-k3 provider=opencode-go in=10 out=5 total=15 latency=1s")).toBeNull();
  expect(parseTrustedHermesRuntimeReceipt("2026-09-08 02:48:51,118 INFO [turn] run_agent: API call #1: model=kimi-k3 provider=opencode-go in=10 out=5 total=99 latency=1.0s")).toBeNull();
  expect(parseTrustedHermesRuntimeReceipt("2026-09-08 02:48:51,118 INFO [turn] other: API call #1: model=kimi-k3 provider=opencode-go in=10 out=5 total=15 latency=1.0s")).toBeNull();
});
