#!/usr/bin/env node
/**
 * Thin stdio MCP bridge for generated ontology read tools.
 * Resolves every call through the app JSON-RPC socket — never opens SQLite.
 */
import { createConnection } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const socketFile = join(homedir(), ".quantflow", "app", "socket-path");
const role = process.env.QF_PEER_ROLE;
const sessionId = process.env.QF_AGENT_SESSION_ID;
const kernelDb = process.env.QF_KERNEL_DB;

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

function requireIdentity() {
  if (!role || !sessionId || !kernelDb) {
    throw new Error("QuantFlow did not provide this seat's ontology identity");
  }
}

async function listTools() {
  requireIdentity();
  const result = await rpcCall("qf.ontology.list_tools", {
    session_id: sessionId,
    role,
    kernel_db: kernelDb,
  });
  return result.tools ?? [];
}

async function callTool(name, args) {
  requireIdentity();
  const result = await rpcCall("qf.ontology.call_tool", {
    session_id: sessionId,
    role,
    kernel_db: kernelDb,
    name,
    arguments: args ?? {},
  });
  return result;
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
      serverInfo: { name: "quantflow-ontology", version: "1.0.0" },
    });
    return;
  }
  if (message.method === "ping") {
    reply(message.id, {});
    return;
  }
  if (message.method === "tools/list") {
    try {
      const tools = await listTools();
      reply(message.id, { tools });
    } catch (error) {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: message.id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : String(error),
        },
      }) + "\n");
    }
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
        process.stderr.write(`quantflow-ontology: ${error instanceof Error ? error.message : error}\n`);
      }
    }
    newline = input.indexOf("\n");
  }
});
