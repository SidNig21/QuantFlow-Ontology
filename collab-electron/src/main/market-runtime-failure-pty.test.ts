import { expect, mock, test } from "bun:test";
import * as pty from "node-pty";
mock.module("electron", () => ({ BrowserWindow: { getAllWindows: () => [] } }));
const { createMarketFailureReceiver, createMarketRuntimeReceiver } = await import("./market-runtime-failure");

test.each([35, 80])("runtime failure receipt survives the real Windows PTY at %i columns", async (cols) => {
  if (process.platform !== "win32") return;
  const nonce = "12345678-1234-1234-1234-123456789abc";
  const frame = `\nQF_STREAM_FAILURE foreign\nUpstream idle timeout exceeded\nQF_STREAM_FAILURE ${nonce}\n`;
  let count = 0;
  const receive = createMarketFailureReceiver(nonce, () => { count++; });
  const child = pty.spawn(Bun.which("node")!, ["-e", `setTimeout(()=>process.stdout.write(${JSON.stringify(frame)}),100);setTimeout(()=>process.exit(),1000)`], { cols, rows: 24, cwd: process.cwd(), env: { SystemRoot: process.env.SystemRoot! }, encoding: null });
  let output = "";
  child.onData((data) => { output += data.toString(); receive(Buffer.isBuffer(data) ? data : Buffer.from(data)); });
  try {
    await new Promise<void>((resolve) => child.onExit(() => resolve()));
    if (count !== 1) throw new Error(`Runtime receipt missing: ${JSON.stringify(output)}`);
    expect(count).toBe(1);
  } finally { try { child.kill(); } catch { /* already exited */ } }
}, 10_000);

test("pre-delivery provider-unavailable frame is nonce-bound and emits one exact failure", () => {
  const reasons: string[] = []; const receipts: unknown[] = [];
  const receive = createMarketRuntimeReceiver("rate-nonce", (reason) => reasons.push(reason), (receipt) => receipts.push(receipt));
  receive(Buffer.from("\x1b]777;QF;PROVIDER_UNAVAILABLE;foreign;\x07"));
  const frame = "\x1b]777;QF;PROVIDER_UNAVAILABLE;rate-nonce;\x07";
  receive(Buffer.from(frame + frame));
  expect(reasons).toEqual(["provider_unavailable"]);
  expect(receipts).toEqual([]);
});

test("runtime receipt uses an invisible OSC frame while the observer receives exact safe facts", () => {
  const receipts: unknown[] = [];
  const payload = Buffer.from(JSON.stringify({ provider: "opencode-go", model: "current-model", runtime: "hermes-native-tui", input_tokens: 10, output_tokens: 4, total_tokens: 14, latency_seconds: 1.2 })).toString("base64url");
  const frame = `\x1b]777;QF;RUNTIME_RECEIPT;receipt-nonce;${payload}\x07`;
  createMarketRuntimeReceiver("receipt-nonce", () => {}, (receipt) => receipts.push(receipt))(Buffer.from(frame));
  expect(receipts).toHaveLength(1);
  const visible = frame.replace(/\x1b\][^\x07]*\x07/g, "");
  expect(visible).not.toContain("QF_RUNTIME_RECEIPT");
  expect(visible).not.toContain("receipt-nonce");
  expect(visible).not.toContain(payload);
});
