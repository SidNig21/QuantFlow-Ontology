import { randomUUID } from "node:crypto";
import { createConnection } from "node:net";

/**
 * Claude Code adapter seat — same app-owned ontology gateway contract as Hermes.
 * Deterministic host process for Dock admission; live Anthropic CLI auth is not required
 * for the R4 contract (same gateway, grants, spawned_from).
 */
const role = process.env.QF_PEER_ROLE;
const sessionId = process.env.QF_AGENT_SESSION_ID;
const endpoint = process.env.QF_APP_RPC_ENDPOINT;
const kernelDb = process.env.QF_KERNEL_DB;

if (!role || !sessionId || !endpoint || !kernelDb) {
  throw new Error(
    "claude-code requires QF_PEER_ROLE, QF_AGENT_SESSION_ID, "
      + "QF_APP_RPC_ENDPOINT, and QF_KERNEL_DB",
  );
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const socket = createConnection(endpoint);
    let buffer = "";
    let settled = false;
    const id = `${method}-${Date.now()}-${randomUUID()}`;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(new Error(`RPC timeout: ${method}`));
    }, 10_000);
    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      fn();
    };
    socket.once("connect", () => {
      socket.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      const line = buffer.slice(0, newline);
      finish(() => {
        try {
          const response = JSON.parse(line);
          if (response.error) reject(new Error(response.error.message));
          else resolve(response.result);
        } catch (error) {
          reject(error);
        }
      });
    });
    socket.once("error", (error) => finish(() => reject(error)));
    socket.once("close", () => {
      finish(() => reject(new Error(`RPC closed: ${method}`)));
    });
  });
}

log(`claude-code: ready session=${sessionId} role=${role}`);

const heartbeat = setInterval(() => {
  log(`claude-code: heartbeat ${new Date().toISOString()}`);
}, 30_000);

process.on("SIGINT", () => {
  clearInterval(heartbeat);
  process.exit(0);
});
process.on("SIGTERM", () => {
  clearInterval(heartbeat);
  process.exit(0);
});

// Keep the seat alive for Dock / gate admission.
await new Promise(() => {});
