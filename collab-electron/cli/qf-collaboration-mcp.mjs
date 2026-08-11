#!/usr/bin/env node
import { createConnection } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

const socketFile = join(homedir(), ".quantflow", "app", "socket-path");
const role = process.env.QF_PEER_ROLE;
const sessionId = process.env.QF_AGENT_SESSION_ID;
const seatCapability = process.env.QF_LIVE_SEAT_CAPABILITY;

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
    description: "Return a cited result for an assigned Kernel task using actual ontology-read trajectory ids.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "Kernel task id printed in the incoming QuantFlow TASK." },
        result: { type: "string", description: "Concrete completed result." },
        cited_market_ids: {
          type: "array",
          items: { type: "string" },
          description: "Market object ids cited by the result. May be empty only when the named reads returned no market evidence.",
        },
        read_trajectory_artifact_ids: {
          type: "array",
          minItems: 1,
          items: { type: "string" },
          description: "Artifact ids returned by the ontology reads used for this result.",
        },
      },
      required: ["task_id", "result", "cited_market_ids", "read_trajectory_artifact_ids"],
      additionalProperties: false,
    },
  },
];

const TOOL_KEYS = {
  send_task: ["to_role", "task"],
  send_result: ["task_id", "result", "cited_market_ids", "read_trajectory_artifact_ids"],
};

export function validateToolArguments(name, args) {
  const keys = TOOL_KEYS[name];
  if (!keys) throw new Error(`Unknown QuantFlow collaboration tool: ${name}`);
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new Error(`${name} arguments must be an object`);
  }
  const extras = Object.keys(args).filter((key) => !keys.includes(key));
  if (extras.length > 0) throw new Error(`${name} rejects extra field: ${extras.sort()[0]}`);
  for (const key of keys) {
    if (!(key in args)) throw new Error(`${name} requires ${key}`);
  }
  if (name === "send_task") {
    if (typeof args.to_role !== "string" || !args.to_role.trim()) throw new Error("send_task requires to_role");
    if (typeof args.task !== "string" || !args.task.trim()) throw new Error("send_task requires task");
  } else {
    if (typeof args.task_id !== "string" || !args.task_id.trim()) throw new Error("send_result requires task_id");
    if (typeof args.result !== "string" || !args.result.trim()) throw new Error("send_result requires result");
    if (!Array.isArray(args.cited_market_ids) || args.cited_market_ids.some((id) => typeof id !== "string" || !id.trim())) {
      throw new Error("send_result requires cited_market_ids to be a string array");
    }
    if (!Array.isArray(args.read_trajectory_artifact_ids) || args.read_trajectory_artifact_ids.length === 0 || args.read_trajectory_artifact_ids.some((id) => typeof id !== "string" || !id.trim())) {
      throw new Error("send_result requires non-empty read_trajectory_artifact_ids");
    }
  }
  return args;
}

async function callTool(name, rawArgs) {
  if (!role || !sessionId || !seatCapability) {
    throw new Error("QuantFlow did not provide this seat's collaboration identity");
  }
  const args = validateToolArguments(name, rawArgs);
  if (name === "send_task") {
    return rpcCall("qf.collaboration.send_task", {
      session_id: sessionId,
      from_role: role,
      seat_capability: seatCapability,
      to_role: args.to_role,
      task: args.task,
    });
  }
  if (name === "send_result") {
    return rpcCall("qf.collaboration.send_result", {
      session_id: sessionId,
      from_role: role,
      seat_capability: seatCapability,
      task_id: args.task_id,
      result: args.result,
      cited_market_ids: args.cited_market_ids,
      read_trajectory_artifact_ids: args.read_trajectory_artifact_ids,
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

function startStdioServer() {
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
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startStdioServer();
}
