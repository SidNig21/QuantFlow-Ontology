type ReadinessWaiter = {
  required: Set<string>;
  resolve: () => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const receipts = new Map<string, Set<string>>();
const waiters = new Map<string, ReadinessWaiter>();

function completeIfReady(sessionId: string): void {
  const waiter = waiters.get(sessionId);
  if (!waiter) return;
  const seen = receipts.get(sessionId) ?? new Set<string>();
  if (![...waiter.required].every((server) => seen.has(server))) return;
  clearTimeout(waiter.timer);
  waiters.delete(sessionId);
  waiter.resolve();
}

/** Record one required MCP server after its protocol initialize handshake. */
export function recordRuntimeMcpReady(sessionId: string, serverId: string): void {
  if (!sessionId || !serverId) throw new Error("runtime MCP readiness requires session and server identity");
  const seen = receipts.get(sessionId) ?? new Set<string>();
  seen.add(serverId);
  receipts.set(sessionId, seen);
  completeIfReady(sessionId);
}

/** Wait until every adapter-declared MCP server has completed initialization. */
export function waitForRuntimeMcpReadiness(
  sessionId: string,
  requiredServers: readonly string[],
  timeoutMs = 30_000,
): Promise<void> {
  if (requiredServers.length === 0) return Promise.resolve();
  if (waiters.has(sessionId)) throw new Error(`runtime MCP readiness already has a waiter for ${sessionId}`);
  const required = new Set(requiredServers);
  const seen = receipts.get(sessionId) ?? new Set<string>();
  receipts.set(sessionId, seen);
  if ([...required].every((server) => seen.has(server))) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      waiters.delete(sessionId);
      const latest = receipts.get(sessionId) ?? seen;
      const missing = [...required].filter((server) => !latest.has(server));
      reject(new Error(`required runtime MCP initialization timed out: ${missing.join(", ")}`));
    }, timeoutMs);
    waiters.set(sessionId, { required, resolve, reject, timer });
    completeIfReady(sessionId);
  });
}

export function clearRuntimeMcpReadiness(sessionId: string): void {
  receipts.delete(sessionId);
  const waiter = waiters.get(sessionId);
  if (!waiter) return;
  clearTimeout(waiter.timer);
  waiters.delete(sessionId);
  waiter.reject(new Error("runtime MCP readiness cancelled"));
}
