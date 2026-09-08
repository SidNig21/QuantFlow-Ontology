import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveHermesProfileRoot } from "./package-resource-paths";
import { QF_APP_DIR } from "./paths";

export type MarketRuntimeReceipt = {
  provider: string; model: string; runtime: string;
  input_tokens: number; output_tokens: number; total_tokens: number; latency_seconds: number;
};

const receipts = new Map<string, MarketRuntimeReceipt>();

const SESSION_ID = /^[a-zA-Z0-9_-]+$/;
const SAFE_API_CALL = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3} INFO \[[a-zA-Z0-9_-]+\] run_agent: API call #(\d+): model=([a-zA-Z0-9._/-]+) provider=([a-zA-Z0-9._/-]+) in=(\d+) out=(\d+) total=(\d+) latency=(\d+(?:\.\d+)?)s(?: cache=\d+\/\d+ \(\d+%\))?$/;

/** Parse only the credential-free usage line written by the isolated Hermes runtime. */
export function parseTrustedHermesRuntimeReceipt(logText: string): MarketRuntimeReceipt | null {
  let latest: MarketRuntimeReceipt | null = null;
  for (const line of logText.split(/\r?\n/)) {
    const match = SAFE_API_CALL.exec(line);
    if (!match) continue;
    const input = Number(match[4]);
    const output = Number(match[5]);
    const total = Number(match[6]);
    const latency = Number(match[7]);
    if (![input, output, total, latency].every((value) => Number.isFinite(value) && value > 0)) continue;
    if (total !== input + output) continue;
    latest = {
      provider: match[3]!,
      model: match[2]!,
      runtime: "hermes-native-tui",
      input_tokens: input,
      output_tokens: output,
      total_tokens: total,
      latency_seconds: latency,
    };
  }
  return latest;
}

/** The app-owned Hermes log is trusted execution evidence when ConPTY drops its OSC receipt. */
export function trustedHermesRuntimeReceiptForSession(
  sessionId: string,
  appDir = QF_APP_DIR,
): MarketRuntimeReceipt | null {
  if (!SESSION_ID.test(sessionId)) return null;
  const logPath = join(
    resolveHermesProfileRoot(appDir),
    "profiles",
    `quantflow-runtime-${sessionId}`,
    "logs",
    "agent.log",
  );
  try {
    return parseTrustedHermesRuntimeReceipt(readFileSync(logPath, "utf8"));
  } catch {
    return null;
  }
}

export function recordMarketRuntimeReceipt(sessionId: string, value: unknown): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("runtime receipt must be an object");
  const row = value as Record<string, unknown>;
  const keys = ["provider", "model", "runtime", "input_tokens", "output_tokens", "total_tokens", "latency_seconds"];
  if (Object.keys(row).length !== keys.length || keys.some((key) => !(key in row))) throw new Error("runtime receipt fields disagree");
  for (const key of ["provider", "model", "runtime"]) if (typeof row[key] !== "string" || !String(row[key]).trim()) throw new Error("runtime receipt identity missing");
  const input = Number(row.input_tokens), output = Number(row.output_tokens), total = Number(row.total_tokens), latency = Number(row.latency_seconds);
  if (![input, output, total, latency].every((number) => Number.isFinite(number) && number > 0) || total !== input + output) throw new Error("runtime receipt usage invalid");
  receipts.set(sessionId, { provider: String(row.provider), model: String(row.model), runtime: String(row.runtime), input_tokens: input, output_tokens: output, total_tokens: total, latency_seconds: latency });
}

export function marketRuntimeReceiptForSession(sessionId: string): MarketRuntimeReceipt | null {
  return receipts.get(sessionId) ?? trustedHermesRuntimeReceiptForSession(sessionId);
}

export function clearMarketRuntimeReceipt(sessionId: string): void { receipts.delete(sessionId); }
