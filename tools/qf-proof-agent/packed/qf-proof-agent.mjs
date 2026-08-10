import { randomUUID } from "node:crypto";
import { createConnection } from "node:net";

const role = process.env.QF_PEER_ROLE;
const sessionId = process.env.QF_AGENT_SESSION_ID;
const busDb = process.env.QF_PEER_BUS_DB;
const endpoint = process.env.QF_APP_RPC_ENDPOINT;
const nonce = process.env.QF_PROOF_NONCE || randomUUID();

if (!role || !sessionId || !busDb || !endpoint) {
  throw new Error(
    "qf-proof-agent requires QF_PEER_ROLE, QF_AGENT_SESSION_ID, "
      + "QF_PEER_BUS_DB, and QF_APP_RPC_ENDPOINT",
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
    }, 5000);
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

async function inbox() {
  return await rpc("qf.peer-bus.read_inbox", {
    session_id: sessionId,
    role,
    bus_db: busDb,
  });
}

async function send(toRole, message) {
  return await rpc("qf.peer-bus.send_to_peer", {
    session_id: sessionId,
    from_role: role,
    to_role: toRole,
    message,
    kind: "task",
    bus_db: busDb,
  });
}

log(`DETERMINISTIC PROOF AGENT role=${role} session=${sessionId}`);
log(`QF_PEER_BUS_DB ${busDb}`);

let complete = false;
async function tick() {
  if (complete) return;
  try {
    const messages = await inbox();
    if (!Array.isArray(messages)) return;
    if (role === "orchestrator") {
      if (!globalThis.__qfTaskSent) {
        await send("worker", `TASK ${nonce}`);
        globalThis.__qfTaskSent = true;
        log(`TASK SENT ${nonce}`);
      }
      const result = messages.find(
        (message) => message.from_role === "worker" && message.body === `ACK ${nonce}`,
      );
      if (result) {
        log(`COLLAB PASS ${nonce}`);
        complete = true;
      }
    } else if (role === "worker") {
      const task = messages.find(
        (message) => message.from_role === "orchestrator" && message.body.startsWith("TASK "),
      );
      if (task) {
        const taskNonce = task.body.slice("TASK ".length);
        log(`TASK RECEIPT ${taskNonce}`);
        await send("orchestrator", `ACK ${taskNonce}`);
      }
    }
  } catch (error) {
    log(`PROOF WAIT ${error instanceof Error ? error.message : String(error)}`);
  }
}

await tick();
setInterval(() => void tick(), 250);
