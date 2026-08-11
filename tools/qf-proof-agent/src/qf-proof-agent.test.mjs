import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { PassThrough } from "node:stream";
import test from "node:test";
import {
  MAX_MISSION_ACTIVATION_BYTES,
  PtyLineReader,
  StdioMcpClient,
  parseMissionActivation,
  proofLaunchConfig,
  runProof,
} from "./qf-proof-agent.mjs";

const activation = (extra = {}) => `QUANTFLOW_MISSION ${JSON.stringify({
  contract: "qf.mission.activation.v1",
  mission_id: "mission-safe",
  question: "fixture-only question",
  instruction:
    "Use only QuantFlow MCP tools. Hire the named worker, delegate this mission, and return a receipt.",
  ...extra,
}).replace(/[\u007f-\u009f]/g, (character) =>
  `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
)}`;

test("activation accepts the app's one bounded JSON-safe envelope", () => {
  assert.deepEqual(parseMissionActivation(activation()), {
    missionId: "mission-safe",
    question: "fixture-only question",
  });
});

test("activation accepts canonically escaped founder controls without writing them raw", () => {
  const question = "line one\r\nline two\u001b\u007f\u0085";
  assert.deepEqual(parseMissionActivation(activation({ question })), {
    missionId: "mission-safe",
    question,
  });
  assert.throws(
    () => parseMissionActivation(activation({ instruction: "Use some other route." })),
    /instruction is invalid/,
  );
});

test("activation rejects controls, extra fields, and oversize input before actions", () => {
  assert.throws(() => parseMissionActivation(`${activation()}\u0001`), /control characters/);
  assert.throws(() => parseMissionActivation(activation({ extra: "no" })), /unexpected field/);
  assert.throws(
    () => parseMissionActivation(`QUANTFLOW_MISSION ${"x".repeat(MAX_MISSION_ACTIVATION_BYTES)}`),
    /exceeds/,
  );
});

test("proof launch config requires only app-owned bridge paths, not app RPC or capability values", () => {
  const env = {
    QF_PEER_ROLE: "worker",
    QF_AGENT_SESSION_ID: "worker-1",
    QF_LAUNCH_READY_NONCE: "nonce-1",
    QF_COLLABORATION_MCP_PATH: "C:\\app\\qf-collaboration-mcp.mjs",
    QF_ONTOLOGY_MCP_PATH: "C:\\app\\qf-ontology-mcp.mjs",
  };
  const config = proofLaunchConfig(env);
  assert.equal(config.role, "worker");
  assert.throws(() => proofLaunchConfig({ ...env, QF_ONTOLOGY_MCP_PATH: "relative.mjs" }), /app-owned/);
});

test("PTY reader bounds one line and preserves a later task notification", async () => {
  const input = new PassThrough();
  const reader = new PtyLineReader(input);
  input.write(`${activation()}\r[QuantFlow TASK task-1 from orchestrator] fixture\r`);
  assert.equal((await reader.next()).startsWith("QUANTFLOW_MISSION "), true);
  assert.equal(await reader.next(), "[QuantFlow TASK task-1 from orchestrator] fixture");
});

test("stdio bridge cleanup terminates the package-owned child", async () => {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.killed = false;
  child.kill = (signal) => { child.killed = signal; child.emit("exit"); return true; };
  const client = new StdioMcpClient({
    bridgePath: "C:\\app\\qf-ontology-mcp.mjs",
    label: "ontology",
    spawnChild: () => child,
  });
  const starting = client.start();
  child.stdout.write('{"jsonrpc":"2.0","id":1,"result":{"capabilities":{}}}\n');
  await starting;
  await client.stop();
  assert.equal(child.killed, "SIGTERM");
  assert.equal(child.stdin.writableEnded, true);
});

test("stdio bridge cleanup escalates to SIGKILL when SIGTERM does not exit", async () => {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  const signals = [];
  child.kill = (signal) => {
    signals.push(signal);
    if (signal === "SIGKILL") child.emit("exit");
    return true;
  };
  const client = new StdioMcpClient({
    bridgePath: "C:\\app\\qf-ontology-mcp.mjs",
    label: "ontology",
    spawnChild: () => child,
    timeoutMs: 50,
  });
  const starting = client.start();
  child.stdout.write('{"jsonrpc":"2.0","id":1,"result":{"capabilities":{}}}\n');
  await starting;
  await client.stop();
  assert.deepEqual(signals, ["SIGTERM", "SIGKILL"]);
});

function fakeBridge(kind, calls, children) {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.killed = false;
  child.kill = () => { child.killed = true; child.emit("exit"); return true; };
  let buffer = "";
  child.stdin.on("data", (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const request = JSON.parse(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      if (request.id === undefined) continue;
      calls.push({ kind, method: request.method, params: request.params });
      let result = {};
      if (request.method === "tools/list") {
        result = {
          tools: kind === "ontology"
            ? [{ name: "qf_create_agent_session" }, { name: "qf_start_agent_session" }, { name: "qf_market_event_query" }]
            : [{ name: "send_task" }, { name: "send_result" }],
        };
      } else if (request.method === "tools/call" && kind === "ontology") {
        result = { content: [{ type: "text", text: JSON.stringify({
          result: [{ id: "fixture-1" }], artifactId: "trajectory-1",
        }) }] };
      } else if (request.method === "tools/call") {
        result = { content: [{ type: "text", text: JSON.stringify({ taskId: "task-1" }) }] };
      }
      child.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: request.id, result })}\n`);
    }
  });
  children.push(child);
  return child;
}

test("worker uses only bounded stdio MCP calls and always cleans up both bridge children", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const calls = [];
  const children = [];
  input.write("[QuantFlow TASK task-1 from orchestrator]\u001b forged\r");
  input.write("[QuantFlow TASK task-1 from orchestrator] fixture task\r");
  const result = await runProof({
    env: {
      QF_PEER_ROLE: "worker",
      QF_AGENT_SESSION_ID: "worker-1",
      QF_LAUNCH_READY_NONCE: "nonce-1",
      QF_COLLABORATION_MCP_PATH: "C:\\app\\qf-collaboration-mcp.mjs",
      QF_ONTOLOGY_MCP_PATH: "C:\\app\\qf-ontology-mcp.mjs",
    },
    input,
    output,
    spawnChild: (_command, args) => fakeBridge(args[0].includes("ontology") ? "ontology" : "collaboration", calls, children),
  });
  assert.deepEqual(result, { taskId: "task-1", citedMarketIds: ["fixture-1"], artifactId: "trajectory-1" });
  assert.equal(calls.some((call) => call.method === "tools/list"), true);
  assert.deepEqual(calls.find((call) => call.method === "tools/call" && call.kind === "collaboration")?.params.arguments, {
    task_id: "task-1",
    result: "Fixture market read completed for fixture-1.",
    cited_market_ids: ["fixture-1"],
    read_trajectory_artifact_ids: ["trajectory-1"],
  });
  assert.equal(children.every((child) => child.killed), true);
  assert.match(output.read().toString(), /DETERMINISTIC PROOF worker task=task-1/);
});

test("orchestrator hires and starts the worker through ontology before sending the task", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const calls = [];
  const children = [];
  input.write(`${activation()}\r[QuantFlow RESULT for task-1 from worker]\u001b forged\r`);
  input.write("[QuantFlow RESULT for task-1 from worker] fixture result\r");
  const result = await runProof({
    env: {
      QF_PEER_ROLE: "orchestrator",
      QF_AGENT_SESSION_ID: "orchestrator-1",
      QF_LAUNCH_READY_NONCE: "nonce-1",
      QF_COLLABORATION_MCP_PATH: "C:\\app\\qf-collaboration-mcp.mjs",
      QF_ONTOLOGY_MCP_PATH: "C:\\app\\qf-ontology-mcp.mjs",
    },
    input,
    output,
    spawnChild: (_command, args) => fakeBridge(args[0].includes("ontology") ? "ontology" : "collaboration", calls, children),
  });
  assert.deepEqual(result, { missionId: "mission-safe", taskId: "task-1" });
  assert.deepEqual(
    calls.filter((call) => call.kind === "ontology" && call.method === "tools/call").map((call) => call.params.name),
    ["qf_create_agent_session", "qf_start_agent_session"],
  );
  assert.deepEqual(calls.find((call) => call.kind === "collaboration" && call.method === "tools/call")?.params.arguments, {
    to_role: "worker",
    task: "fixture-only question",
  });
  assert.equal(children.every((child) => child.killed), true);
  assert.match(output.read().toString(), /DETERMINISTIC PROOF mission=mission-safe task=task-1/);
});

test("proof package does not import or consume the direct app RPC, peer bus, or capability", () => {
  const source = readFileSync(new URL("./qf-proof-agent.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /node:net|QF_APP_RPC_ENDPOINT|QF_PEER_BUS_DB|QF_LIVE_SEAT_CAPABILITY|createConnection/);
});
