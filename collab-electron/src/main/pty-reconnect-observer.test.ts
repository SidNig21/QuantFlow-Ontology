import { expect, mock, test } from "bun:test";
import { fileURLToPath } from "node:url";

// Exercise the production create/reconnect/kill paths with a transport double;
// no provider, credentials, application profile, or real sidecar is involved.
const readers: Array<(data: Buffer) => void> = [];
const destroyed: boolean[] = [];
const metadata = new Map<string, unknown>();
mock.module("electron", () => ({ webContents: { fromId: () => null }, BrowserWindow: { getAllWindows: () => [] } }));
mock.module("./sidecar/protocol", () => ({ SIDECAR_PID_PATH: fileURLToPath(import.meta.url), SIDECAR_SOCKET_PATH: "test-only" }));
mock.module("./sidecar/client", () => ({ SidecarClient: class {
  async connect() {} async ping() {} onNotification() {}
  async createSession() { return { sessionId: "owned-test", socketPath: "test-only" }; }
  async reconnectSession() { return { socketPath: "test-only" }; }
  async killSession() {}
  async attachDataSocket(_path: string, receive: (data: Buffer) => void) {
    const index = readers.push(receive) - 1;
    destroyed[index] = false;
    return { destroy: () => { destroyed[index] = true; } };
  }
} }));
mock.module("./tmux", () => ({
  getTmuxBin() {}, getTerminfoDir() {}, getSocketName() {}, tmuxExec() {}, tmuxHasSession() {}, tmuxSessionName() {}, SESSION_DIR: "test-only",
  writeSessionMeta: (id: string, value: unknown) => metadata.set(id, value),
  readSessionMeta: (id: string) => metadata.get(id), deleteSessionMeta: (id: string) => metadata.delete(id),
}));
const { createHostCommandSession, reconnectSession, killSession } = await import("./pty");
const { createMarketFailureReceiver } = await import("./market-runtime-failure");

test("app failure observer survives viewer reconnect and is removed on kill", async () => {
  let failures = 0;
  const nonce = "12345678-1234-1234-1234-123456789abc";
  const receive = createMarketFailureReceiver(nonce, () => { failures++; });
  let chunks = 0;
  const session = await createHostCommandSession({ command: process.execPath, onData: (data) => { chunks++; receive(data); } });
  readers[0]!(Buffer.from("Ready\n"));
  await reconnectSession(session.sessionId, 80, 24, 1);
  expect(destroyed[0]).toBe(true);
  readers[1]!(Buffer.from("Streaming failed after partial delivery, not retrying: The read operation timed out\nQF_STREAM_FAILURE foreign\n"));
  expect(failures).toBe(0);
  readers[1]!(Buffer.from("QF_STREAM_FAIL"));
  await reconnectSession(session.sessionId, 80, 24, 2);
  expect(destroyed[1]).toBe(true);
  readers[2]!(Buffer.from(`URE ${nonce}\n`));
  expect(failures).toBe(1);
  readers[2]!(Buffer.from(`QF_STREAM_FAILURE ${nonce}\n`));
  expect(failures).toBe(1);
  expect(chunks).toBe(5);
  await killSession(session.sessionId);
  readers[2]!(Buffer.from("late socket delivery"));
  expect(chunks).toBe(5);
  expect(destroyed[2]).toBe(true);
});
