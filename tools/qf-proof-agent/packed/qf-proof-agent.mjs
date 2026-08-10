#!/usr/bin/env node
/**
 * QA-only deterministic proof seat.
 *
 * This process deliberately has no app socket, peer database, or capability
 * protocol of its own.  Every product action crosses one of the app-owned
 * stdio MCP bridge children.
 */
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_MISSION_ACTIVATION_BYTES = 6_144;
export const MAX_PTY_LINE_BYTES = 8 * 1024;
export const MCP_RESPONSE_MAX_BYTES = 64 * 1024;
export const MCP_TIMEOUT_MS = 5_000;
export const PROOF_TIMEOUT_MS = 15_000;
export const CHILD_STOP_GRACE_MS = 1_000;

const MISSION_PREFIX = "QUANTFLOW_MISSION ";
const MISSION_INSTRUCTION =
  "Use only QuantFlow MCP tools. Hire the named worker, delegate this mission, and return a receipt.";
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;

function byteLength(value) {
  return Buffer.byteLength(value, "utf8");
}

function exactRecord(value, label, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const input = value;
  const actual = Object.keys(input).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, i) => key !== expected[i])) {
    throw new Error(`${label} has an unexpected field`);
  }
  return input;
}

/** Parse the one app-authored PTY activation accepted by this package. */
export function parseMissionActivation(line) {
  if (typeof line !== "string" || byteLength(line) > MAX_MISSION_ACTIVATION_BYTES) {
    throw new Error("mission activation exceeds its bounded PTY envelope");
  }
  if (!line.startsWith(MISSION_PREFIX)) {
    throw new Error("expected one QUANTFLOW_MISSION activation");
  }
  const raw = line.slice(MISSION_PREFIX.length);
  if (!raw || CONTROL_CHARS.test(raw)) {
    throw new Error("mission activation contains control characters");
  }
  let decoded;
  try {
    decoded = JSON.parse(raw);
  } catch {
    throw new Error("mission activation is not JSON");
  }
  const mission = exactRecord(decoded, "mission activation", [
    "contract",
    "instruction",
    "mission_id",
    "question",
  ]);
  if (mission.contract !== "qf.mission.activation.v1") {
    throw new Error("mission activation contract is invalid");
  }
  if (typeof mission.mission_id !== "string" || !SAFE_ID.test(mission.mission_id)) {
    throw new Error("mission activation id is invalid");
  }
  if (
    typeof mission.question !== "string" ||
    mission.question.length === 0 ||
    byteLength(mission.question) > 4_096
  ) {
    throw new Error("mission question is invalid");
  }
  if (mission.instruction !== MISSION_INSTRUCTION) {
    throw new Error("mission activation instruction is invalid");
  }
  return {
    missionId: mission.mission_id,
    question: mission.question,
  };
}

export function proofLaunchConfig(env = process.env) {
  const role = env.QF_PEER_ROLE;
  const sessionId = env.QF_AGENT_SESSION_ID;
  const readinessNonce = env.QF_LAUNCH_READY_NONCE;
  const collaborationBridgePath = env.QF_COLLABORATION_MCP_PATH;
  const ontologyBridgePath = env.QF_ONTOLOGY_MCP_PATH;
  if (role !== "orchestrator" && role !== "worker") {
    throw new Error("qf-proof-agent requires a proof role");
  }
  if (typeof sessionId !== "string" || !SAFE_ID.test(sessionId)) {
    throw new Error("qf-proof-agent requires a bounded agent session id");
  }
  if (typeof readinessNonce !== "string" || !SAFE_ID.test(readinessNonce)) {
    throw new Error("qf-proof-agent requires a bounded launch readiness nonce");
  }
  for (const [name, path] of [
    ["QF_COLLABORATION_MCP_PATH", collaborationBridgePath],
    ["QF_ONTOLOGY_MCP_PATH", ontologyBridgePath],
  ]) {
    if (typeof path !== "string" || !isAbsolute(path) || !path.endsWith(".mjs") || CONTROL_CHARS.test(path)) {
      throw new Error(`qf-proof-agent requires app-owned ${name}`);
    }
  }
  return { role, sessionId, readinessNonce, collaborationBridgePath, ontologyBridgePath };
}

export class PtyLineReader {
  constructor(input, { maxBytes = MAX_PTY_LINE_BYTES } = {}) {
    this.input = input;
    this.maxBytes = maxBytes;
    this.buffer = "";
    this.lines = [];
    this.waiters = [];
    this.closed = false;
    input.setEncoding?.("utf8");
    input.on("data", (chunk) => this.push(String(chunk)));
    input.once("end", () => this.close(new Error("PTY input closed")));
    input.once("error", (error) => this.close(error));
  }

  push(chunk) {
    this.buffer += chunk;
    if (byteLength(this.buffer) > this.maxBytes) {
      this.close(new Error("PTY line exceeds bounded input"));
      return;
    }
    let match;
    while ((match = /\r\n|\r|\n/.exec(this.buffer))) {
      const line = this.buffer.slice(0, match.index);
      this.buffer = this.buffer.slice(match.index + match[0].length);
      if (byteLength(line) > this.maxBytes) {
        this.close(new Error("PTY line exceeds bounded input"));
        return;
      }
      this.deliver(line);
    }
  }

  deliver(line) {
    const waiter = this.waiters.shift();
    if (waiter) waiter.resolve(line);
    else this.lines.push(line);
  }

  close(error) {
    if (this.closed) return;
    this.closed = true;
    while (this.waiters.length > 0) this.waiters.shift().reject(error);
  }

  next(timeoutMs = PROOF_TIMEOUT_MS) {
    if (this.lines.length > 0) return Promise.resolve(this.lines.shift());
    if (this.closed) return Promise.reject(new Error("PTY input closed"));
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve: (line) => { clearTimeout(timer); resolve(line); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      };
      const timer = setTimeout(() => {
        const index = this.waiters.indexOf(waiter);
        if (index >= 0) this.waiters.splice(index, 1);
        reject(new Error("bounded PTY wait timed out"));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }
}

function jsonContent(response, label) {
  if (!response || response.isError || !Array.isArray(response.content)) {
    throw new Error(`${label} MCP call failed`);
  }
  const text = response.content.find((item) => item?.type === "text")?.text;
  if (typeof text !== "string" || byteLength(text) > MCP_RESPONSE_MAX_BYTES) {
    throw new Error(`${label} MCP response is malformed`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} MCP response is not JSON`);
  }
}

/** A deliberately small JSON-lines MCP client for package-owned bridge children. */
export class StdioMcpClient {
  constructor({ bridgePath, label, env = process.env, spawnChild = spawn, timeoutMs = MCP_TIMEOUT_MS }) {
    this.bridgePath = bridgePath;
    this.label = label;
    this.env = env;
    this.spawnChild = spawnChild;
    this.timeoutMs = timeoutMs;
    this.child = null;
    this.buffer = "";
    this.nextId = 1;
    this.pending = new Map();
  }

  async start() {
    if (this.child) return;
    const child = this.spawnChild(process.execPath, [this.bridgePath], {
      stdio: ["pipe", "pipe", "ignore"],
      env: this.env,
      windowsHide: true,
    });
    if (!child?.stdin || !child?.stdout) throw new Error(`${this.label} bridge did not start`);
    this.child = child;
    child.stdout.setEncoding?.("utf8");
    child.stdout.on("data", (chunk) => this.onData(String(chunk)));
    child.once("error", (error) => this.failPending(error));
    child.once("exit", () => this.failPending(new Error(`${this.label} bridge exited`)));
    await this.request("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "qf-proof-agent", version: "0.1.0" },
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })}\n`);
  }

  onData(chunk) {
    this.buffer += chunk;
    if (byteLength(this.buffer) > MCP_RESPONSE_MAX_BYTES) {
      this.failPending(new Error(`${this.label} bridge response exceeds bound`));
      return;
    }
    let newline;
    while ((newline = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, newline);
      this.buffer = this.buffer.slice(newline + 1);
      if (byteLength(line) > MCP_RESPONSE_MAX_BYTES) {
        this.failPending(new Error(`${this.label} bridge response exceeds bound`));
        return;
      }
      let message;
      try { message = JSON.parse(line); } catch { this.failPending(new Error(`${this.label} bridge returned invalid JSON`)); return; }
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(`${this.label} bridge error: ${message.error.message ?? "unknown"}`));
      else pending.resolve(message.result);
    }
  }

  request(method, params) {
    if (!this.child?.stdin || this.child.stdin.destroyed) return Promise.reject(new Error(`${this.label} bridge is unavailable`));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${this.label} MCP ${method} timed out`));
      }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    });
  }

  async listTools() {
    const result = await this.request("tools/list", {});
    if (!result || !Array.isArray(result.tools)) throw new Error(`${this.label} bridge returned invalid tools`);
    return result.tools;
  }

  async callTool(name, args) {
    return jsonContent(await this.request("tools/call", { name, arguments: args }), name);
  }

  failPending(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }

  async stop() {
    const child = this.child;
    this.child = null;
    this.failPending(new Error(`${this.label} bridge stopped`));
    if (!child) return;
    try { child.stdin?.end(); } catch {}
    await new Promise((resolve, reject) => {
      let settled = false;
      let exited = false;
      let forceTimer = null;
      let finalTimer = null;
      const finish = () => {
        if (settled) return;
        exited = true;
        settled = true;
        if (forceTimer) clearTimeout(forceTimer);
        if (finalTimer) clearTimeout(finalTimer);
        resolve();
      };
      child.once("exit", finish);
      child.kill("SIGTERM");
      if (settled) return;
      forceTimer = setTimeout(() => {
        try { if (!exited) child.kill("SIGKILL"); } catch {}
      }, CHILD_STOP_GRACE_MS);
      finalTimer = setTimeout(() => {
        if (exited) finish();
        else {
          settled = true;
          reject(new Error(`${this.label} bridge did not exit after SIGKILL`));
        }
      }, CHILD_STOP_GRACE_MS * 2);
    });
  }
}

function requiredTool(tools, name) {
  if (!tools.some((tool) => tool && tool.name === name)) {
    throw new Error(`required generated tool is absent: ${name}`);
  }
}

function taskIdFrom(result) {
  if (!result || typeof result.taskId !== "string" || !SAFE_ID.test(result.taskId)) {
    throw new Error("send_task did not return a bounded task id");
  }
  return result.taskId;
}

function extractFixtureIds(result) {
  const rows = result?.result;
  if (!Array.isArray(rows)) throw new Error("generated market.read returned no fixture rows");
  const ids = rows.map((row) => row?.id).filter((id) => typeof id === "string" && SAFE_ID.test(id));
  if (ids.length === 0 || typeof result.artifactId !== "string" || !SAFE_ID.test(result.artifactId)) {
    throw new Error("generated market.read did not return real fixture ids and trajectory artifactId");
  }
  return { citedMarketIds: [...new Set(ids)].slice(0, 64), artifactId: result.artifactId };
}

function safeDelegatedQuestion(question) {
  return question.replace(/[\u0000-\u001f\u007f-\u009f]/g, (character) =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
}

function parsePeerInstruction(line, kind, expectedTaskId) {
  if (
    typeof line !== "string" ||
    line.length === 0 ||
    byteLength(line) > MAX_PTY_LINE_BYTES ||
    CONTROL_CHARS.test(line)
  ) return null;
  const expression = kind === "task"
    ? /^\[QuantFlow TASK ([A-Za-z0-9_-]{1,128}) from orchestrator\] (.+)$/
    : /^\[QuantFlow RESULT for ([A-Za-z0-9_-]{1,128}) from worker\] (.+)$/;
  const match = expression.exec(line);
  if (!match || (expectedTaskId && match[1] !== expectedTaskId)) return null;
  return match;
}

async function nextNotification(reader, kind, expectedTaskId) {
  const deadline = Date.now() + PROOF_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const line = await reader.next(Math.max(1, deadline - Date.now()));
    if (line.startsWith(MISSION_PREFIX)) throw new Error("proof accepts exactly one mission activation");
    const match = parsePeerInstruction(line, kind, expectedTaskId);
    if (match) return match;
  }
  throw new Error("bounded notification wait timed out");
}

export async function runProof({ env = process.env, input = process.stdin, output = process.stdout, spawnChild } = {}) {
  const config = proofLaunchConfig(env);
  const reader = new PtyLineReader(input);
  output.write(`QF_LAUNCH_READY ${config.readinessNonce}\n`);
  output.write(`QF_LAUNCH_COMMIT ${config.readinessNonce}\n`);
  // The one founder Submit activation belongs to the orchestrator. A worker is
  // started only after that activation and its one instruction is the bounded
  // app-delivered task notification from collaboration.
  const mission = config.role === "orchestrator"
    ? parseMissionActivation(await reader.next())
    : null;
  const workerTask = config.role === "worker"
    ? await nextNotification(reader, "task")
    : null;
  const ontology = new StdioMcpClient({ bridgePath: config.ontologyBridgePath, label: "ontology", env, spawnChild });
  const collaboration = new StdioMcpClient({ bridgePath: config.collaborationBridgePath, label: "collaboration", env, spawnChild });
  try {
    await ontology.start();
    await collaboration.start();
    const ontologyTools = await ontology.listTools();
    const collaborationTools = await collaboration.listTools();
    if (config.role === "orchestrator") {
      requiredTool(ontologyTools, "qf_create_agent_session");
      requiredTool(ontologyTools, "qf_start_agent_session");
      requiredTool(collaborationTools, "send_task");
      const workerSessionId = `proof-worker-${randomUUID()}`;
      await ontology.callTool("qf_create_agent_session", {
        session_id: workerSessionId,
        agent_definition_id: "qf-proof-worker",
        label: "Deterministic proof worker",
      });
      await ontology.callTool("qf_start_agent_session", { session_id: workerSessionId });
      const taskId = taskIdFrom(await collaboration.callTool("send_task", {
        to_role: "worker",
        task: safeDelegatedQuestion(mission.question),
      }));
      await nextNotification(reader, "result", taskId);
      output.write(`DETERMINISTIC PROOF mission=${mission.missionId} task=${taskId}\n`);
      return { missionId: mission.missionId, taskId };
    }
    requiredTool(ontologyTools, "qf_market_event_query");
    requiredTool(collaborationTools, "send_result");
    const taskId = workerTask[1];
    const marketRead = await ontology.callTool("qf_market_event_query", {});
    const { citedMarketIds, artifactId } = extractFixtureIds(marketRead);
    await collaboration.callTool("send_result", {
      task_id: taskId,
      result: `Fixture market read completed for ${citedMarketIds.join(", ")}.`,
      cited_market_ids: citedMarketIds,
      read_trajectory_artifact_ids: [artifactId],
    });
    output.write(`DETERMINISTIC PROOF worker task=${taskId}\n`);
    return { taskId, citedMarketIds, artifactId };
  } finally {
    const stops = await Promise.allSettled([ontology.stop(), collaboration.stop()]);
    const failedStop = stops.find((result) => result.status === "rejected");
    if (failedStop?.status === "rejected") throw failedStop.reason;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runProof().catch((error) => {
    process.stderr.write(`qf-proof-agent: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
