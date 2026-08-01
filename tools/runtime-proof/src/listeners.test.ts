import { afterEach, describe, expect, test } from "bun:test";
import {
  isOwnedListener,
  parseListenerLine,
  parseListenerOutput,
  snapshotListeners,
} from "./listeners.ts";

const listeners: Array<Bun.TCPSocketListener<undefined>> = [];

afterEach(() => {
  for (const listener of listeners.splice(0)) listener.stop();
});

function openListener(): Bun.TCPSocketListener<undefined> {
  const listener = Bun.listen({
    hostname: "127.0.0.1",
    port: 0,
    socket: { data() {}, open() {}, close() {} },
  });
  listeners.push(listener);
  return listener;
}

async function readFirstLine(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const result = await reader.read();
    if (result.done) throw new Error("managed listener exited before reporting its port");
    text += decoder.decode(result.value, { stream: true });
    const newline = text.indexOf("\n");
    if (newline >= 0) {
      reader.releaseLock();
      return text.slice(0, newline).trim();
    }
  }
}

async function startManagedForeignListener(): Promise<{ child: Bun.Subprocess; port: number }> {
  const child = Bun.spawn(
    [
      "bun",
      "-e",
      'const listener = Bun.listen({ hostname: "127.0.0.1", port: 0, socket: { data() {}, open() {}, close() {} } }); console.log(listener.port); setInterval(() => {}, 1000);',
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const port = Number(await readFirstLine(child.stdout));
  if (!Number.isInteger(port) || port <= 0) {
    child.kill();
    await child.exited;
    throw new Error(`managed listener reported invalid port ${port}`);
  }
  return { child, port };
}

describe("PID-scoped listener ownership", () => {
  test("parses IPv4, IPv6, multiple owners, malformed, ownerless, foreign 8180, and owned lines", () => {
    const lines = [
      'LISTEN 0 128 127.0.0.1:8180 0.0.0.0:* users:(("bun",pid=1234,fd=7))',
      'LISTEN 0 128 [::1]:4000 [::]:* users:(("bun",pid=1235,fd=8))',
      'LISTEN 0 128 0.0.0.0:9000 0.0.0.0:* users:(("a",pid=1236,fd=9),("b",pid=1237,fd=10))',
      'LISTEN 0 128 0.0.0.0:9001 0.0.0.0:* users:(("broken",pid=oops,fd=11))',
      "LISTEN 0 128 0.0.0.0:9002 0.0.0.0:*",
    ];
    const parsed = parseListenerOutput(lines.join("\n"));

    expect(parsed).toHaveLength(5);
    expect(parsed[0]?.pids).toEqual([1234]);
    expect(parsed[1]?.pids).toEqual([1235]);
    expect(parsed[2]?.pids).toEqual([1236, 1237]);
    expect(parsed[3]?.ownerMetadata).toBe("malformed");
    expect(parsed[3]?.pids).toEqual([]);
    expect(parsed[4]?.ownerMetadata).toBe("ownerless");
    expect(isOwnedListener(parsed[0]!, new Set([1234]))).toBe(true);
    expect(isOwnedListener(parsed[0]!, new Set([9999]))).toBe(false);
    expect(isOwnedListener(parsed[2]!, new Set([1237]))).toBe(true);
    expect(isOwnedListener(parsed[3]!, new Set([1234]))).toBe(false);
    expect(isOwnedListener(parsed[4]!, new Set([1234]))).toBe(false);
  });

  test("live same-user probe reports this test PID for an ephemeral listener", async () => {
    const listener = openListener();
    const snapshot = await snapshotListeners(new Set([process.pid]));
    expect(snapshot.lines.some((line) => line.includes(`:${listener.port} `))).toBe(true);
  });

  test("managed foreign listener stays outside this test's owned snapshot", async () => {
    const foreign = await startManagedForeignListener();
    try {
      const snapshot = await snapshotListeners(new Set([process.pid]));
      expect(snapshot.lines.some((line) => line.includes(`:${foreign.port} `))).toBe(false);
    } finally {
      foreign.child.kill();
      await foreign.child.exited;
    }
  });
});
