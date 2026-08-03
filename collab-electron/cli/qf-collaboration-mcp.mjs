#!/usr/bin/env node
import { createConnection } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const socketFile = join(homedir(), ".quantflow", "app", "socket-path");
const role = process.env.QF_PEER_ROLE;
const sessionId = process.env.QF_AGENT_SESSION_ID;
const busDb = process.env.QF_PEER_BUS_DB;

function rpcCall(method, params) {
  return new Promise((resolve, reject) => {
    const socketPath = process.env.QF_APP_RPC_ENDPOINT
      || readFileSync(socketFile, "utf8").trim();
    const socket = createConnection(socketPath);
    let buffer = "";
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("QuantFlow RPC timed out"));
    }, 10_000);
    socket.on("connect", () => socket.write(
      JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) + "\n",
    ));
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      clearTimeout(timer);
      socket.destroy();
      const response = JSON.parse(buffer.slice(0, newline));
      if (response.error) reject(new Error(response.error.message));
      else resolve(response.result);
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

const tools = [
  {
    name: "send_task",
    description: "Send a concrete task to another live QuantFlow Dock role. The task is durably recorded and shown on the canvas.",
    inputSchema: {
      type: "object",
      properties: {
        to_role: { type: "string", description: "Recipient Dock role, for example worker." },
        task: { type: "string", description: "Specific task and expected output." },
      },
      required: ["to_role", "task"],
      additionalProperties: false,
    },
  },
  {
    name: "send_result",
    description: "Return the concrete result for a QuantFlow task. Use the task artifact id from the incoming task.",
    inputSchema: {
      type: "object",
      properties: {
        to_role: { type: "string", description: "Original sender's Dock role." },
        task_artifact_id: { type: "string", description: "Artifact id printed in the incoming QuantFlow TASK." },
        result: { type: "string", description: "Concrete completed result." },
      },
      required: ["to_role", "task_artifact_id", "result"],
      additionalProperties: false,
    },
  },
];

async function callTool(name, args) {
  if (!role || !sessionId || !busDb) {
    throw new Error("QuantFlow did not provide this seat's collaboration identity");
  }
  if (name === "send_task") {
    return rpcCall("qf.peer-bus.send_to_peer", {
      session_id: sessionId,
      from_role: role,
      to_role: args.to_role,
      message: args.task,
      kind: "task",
      bus_db: busDb,
    });
  }
  if (name === "send_result") {
    return rpcCall("qf.peer-bus.send_to_peer", {
      session_id: sessionId,
      from_role: role,
      to_role: args.to_role,
      message: args.result,
      kind: "result",
      reply_to_artifact_id: args.task_artifact_id,
      bus_db: busDb,
    });
  }
  throw new Error(`Unknown QuantFlow collaboration tool: ${name}`);
}

function reply(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

async function handle(message) {
  if (message.method === "notifications/initialized") return;
  if (message.method === "initialize") {
    reply(message.id, {
      protocolVersion: message.params?.protocolVersion ?? "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: { name: "quantflow-collaboration", version: "1.0.0" },
    });
    return;
  }
  if (message.method === "ping") {
    reply(message.id, {});
    return;
  }
  if (message.method === "tools/list") {
    reply(message.id, { tools });
    return;
  }
  if (message.method === "tools/call") {
    try {
      const result = await callTool(message.params?.name, message.params?.arguments ?? {});
      reply(message.id, {
        content: [{ type: "text", text: JSON.stringify(result) }],
      });
    } catch (error) {
      reply(message.id, {
        isError: true,
        content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
      });
    }
    return;
  }
  if (message.id !== undefined) {
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      id: message.id,
      error: { code: -32601, message: `Method not found: ${message.method}` },
    }) + "\n");
  }
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
  let newline = input.indexOf("\n");
  while (newline >= 0) {
    const line = input.slice(0, newline).trim();
    input = input.slice(newline + 1);
    if (line) {
      try {
        void handle(JSON.parse(line));
      } catch (error) {
        process.stderr.write(`quantflow-collaboration: ${error instanceof Error ? error.message : error}\n`);
      }
    }
    newline = input.indexOf("\n");
  }
});
