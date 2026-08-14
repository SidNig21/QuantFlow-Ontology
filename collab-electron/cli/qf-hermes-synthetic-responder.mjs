#!/usr/bin/env node
/**
 * Deterministic provider replacement for the WO-V2-2 packaged Hermes gates.
 *
 * This process is intentionally small: it exercises the production Hermes
 * profile, launcher, PTY, app-owned MCP bridges, Kernel, and peer delivery,
 * while making no network/model call. It is reachable only when the app has
 * explicitly set QF_HERMES_SYNTHETIC_TEST=1.
 */
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const MAX_LINE_BYTES = 8 * 1024;
const MCP_TIMEOUT_MS = 30_000;
const ROLE = process.env.QF_PEER_ROLE;
const SESSION_ID = process.env.QF_AGENT_SESSION_ID;
const SEAT_CAPABILITY = process.env.QF_LIVE_SEAT_CAPABILITY;
const KERNEL_DB = process.env.QF_KERNEL_DB;
const COLLABORATION_BRIDGE = process.env.QF_COLLABORATION_MCP_PATH || process.argv[3];
const ONTOLOGY_BRIDGE = process.env.QF_ONTOLOGY_MCP_PATH || process.argv[4];
const MISSION_PREFIX = "QUANTFLOW_MISSION ";
const SUPPRESS_BOUNDARY = process.env.QF_HERMES_SYNTHETIC_SUPPRESS_BOUNDARY || "";

function byteLength(value) {
  return Buffer.byteLength(value, "utf8");
}

function emit(fields) {
  process.stdout.write(`QF_SYNTHETIC ${Object.entries(fields)
    .map(([key, value]) => `${key}=${typeof value === "string" ? value.replace(/[\r\n ]/g, "_") : JSON.stringify(value)}`)
    .join(" ")}\n`);
}

function emitBoundary(boundary, fields = {}) {
  if (SUPPRESS_BOUNDARY === boundary) return;
  emit({ boundary, ...fields });
}

function requireConfig() {
  const missing = [
    ["QF_PEER_ROLE", ROLE],
    ["QF_AGENT_SESSION_ID", SESSION_ID],
    ["QF_LIVE_SEAT_CAPABILITY", SEAT_CAPABILITY],
    ["QF_KERNEL_DB", KERNEL_DB],
    ["QF_COLLABORATION_MCP_PATH", COLLABORATION_BRIDGE],
    ["QF_ONTOLOGY_MCP_PATH", ONTOLOGY_BRIDGE],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) throw new Error(`synthetic Hermes config missing ${missing.join(",")}`);
  if (!["orchestrator", "worker", "critic"].includes(ROLE)) {
    throw new Error(`unsupported synthetic Hermes role: ${ROLE}`);
  }
}

class PtyLineReader {
  constructor(input) {
    this.input = input;
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
    if (byteLength(this.buffer) > MAX_LINE_BYTES) {
      this.close(new Error("synthetic PTY input exceeds bound"));
      return;
    }
    let newline;
    while ((newline = /\r\n|\r|\n/.exec(this.buffer))) {
      const line = this.buffer.slice(0, newline.index);
      this.buffer = this.buffer.slice(newline.index + newline[0].length);
      if (byteLength(line) > MAX_LINE_BYTES) {
        this.close(new Error("synthetic PTY line exceeds bound"));
        return;
      }
      const waiter = this.waiters.shift();
      if (waiter) waiter.resolve(line);
      else this.lines.push(line);
    }
  }

  close(error) {
    if (this.closed) return;
    this.closed = true;
    while (this.waiters.length > 0) this.waiters.shift().reject(error);
  }

  next(timeoutMs = MCP_TIMEOUT_MS) {
    if (this.lines.length > 0) return Promise.resolve(this.lines.shift());
    if (this.closed) return Promise.reject(new Error("synthetic PTY input closed"));
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve: (line) => { clearTimeout(timer); resolve(line); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      };
      const timer = setTimeout(() => {
        const index = this.waiters.indexOf(waiter);
        if (index >= 0) this.waiters.splice(index, 1);
        reject(new Error("synthetic PTY wait timed out"));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }
}

function jsonContent(response, label) {
  if (!response || !Array.isArray(response.content)) throw new Error(`${label} MCP call failed`);
  const text = response.content.find((item) => item?.type === "text")?.text;
  if (response.isError) throw new Error(`${label} MCP call failed: ${typeof text === "string" ? text : "unknown error"}`);
  if (typeof text !== "string") throw new Error(`${label} response was not text`);
  try { return JSON.parse(text); } catch { throw new Error(`${label} response was not JSON`); }
}

class StdioMcpClient {
  constructor(bridgePath, label) {
    this.bridgePath = bridgePath;
    this.label = label;
    this.child = null;
    this.buffer = "";
    this.nextId = 1;
    this.pending = new Map();
  }

  async start() {
    this.child = spawn(process.execPath, [this.bridgePath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
      windowsHide: true,
    });
    let stderr = "";
    this.child.stderr?.setEncoding?.("utf8");
    this.child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
    this.stderr = () => stderr;
    this.child.stdout.setEncoding?.("utf8");
    this.child.stdout.on("data", (chunk) => this.onData(String(chunk)));
    this.child.once("error", (error) => this.fail(error));
    this.child.once("exit", (code, signal) => this.fail(new Error(`${this.label} bridge exited code=${String(code)} signal=${String(signal)} stderr=${stderr.trim()}`)));
    await this.request("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "qf-hermes-synthetic-responder", version: "2.2.0" },
    });
    this.child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })}\n`);
  }

  onData(chunk) {
    this.buffer += chunk;
    let newline;
    while ((newline = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;
      let message;
      try { message = JSON.parse(line); } catch { this.fail(new Error(`${this.label} returned invalid JSON`)); return; }
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(`${this.label}: ${message.error.message ?? "unknown error"}`));
      else pending.resolve(message.result);
    }
  }

  request(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${this.label} ${method} timed out`));
      }, MCP_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    });
  }

  async listTools() {
    const result = await this.request("tools/list", {});
    if (!result || !Array.isArray(result.tools)) throw new Error(`${this.label} tool list is invalid`);
    return result.tools;
  }

  async callTool(name, args) {
    return jsonContent(await this.request("tools/call", { name, arguments: args }), name);
  }

  fail(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }

  async stop() {
    if (!this.child) return;
    const child = this.child;
    this.child = null;
    this.fail(new Error(`${this.label} bridge stopped`));
    try { child.stdin.end(); } catch {}
    await new Promise((resolve) => {
      const timer = setTimeout(() => { try { child.kill(); } catch {} resolve(); }, 1_000);
      child.once("exit", () => { clearTimeout(timer); resolve(); });
    });
  }
}

function toolNames(tools) { return new Set(tools.map((tool) => tool?.name).filter(Boolean)); }
function requireTools(tools, names, label) {
  const actual = toolNames(tools);
  for (const name of names) if (!actual.has(name)) throw new Error(`${label} missing generated tool ${name}`);
  emitBoundary("tool_discovery", { role: ROLE, tools: names.join(",") });
}

function ontologyArgs(args) {
  return args;
}

function collaborationArgs(args) {
  return args;
}

function parseMission(line) {
  if (!line.startsWith(MISSION_PREFIX)) return null;
  const mission = JSON.parse(line.slice(MISSION_PREFIX.length));
  if (!mission || typeof mission.question !== "string") throw new Error("synthetic mission activation is invalid");
  return mission;
}

function parseTask(line) {
  const match = /^\[QuantFlow TASK ([A-Za-z0-9_-]{1,128}) from orchestrator\] (.+)$/.exec(line);
  return match ? { taskId: match[1], task: match[2] } : null;
}

async function nextReview(reader) {
  const values = {};
  let carry = "";
  const deadline = Date.now() + MCP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const line = cleanPtyLine(await reader.next(Math.max(1, deadline - Date.now())));
    carry = `${carry}\n${line}`.slice(-8_192);
    for (const field of ["hypothesis_id", "run_id", "artifact_id"]) {
      const match = new RegExp(`${field}=([A-Za-z0-9_-]{1,128})`).exec(carry);
      if (match) values[field] = match[1];
    }
    const metricsMatch = /metrics=(\{.*\})/.exec(carry);
    if (metricsMatch) {
      try { values.metrics = JSON.parse(metricsMatch[1]); } catch { /* keep reading */ }
    }
    if (values.hypothesis_id && values.run_id && values.artifact_id) return values;
  }
  throw new Error("synthetic critic activation is missing research ids");
}

async function orchestrator(reader, ontology, collaboration) {
  const activation = await nextMatching(reader, (line) => parseMission(line));
  emitBoundary("activation_delivery", { role: ROLE, mission_id: activation.mission_id ?? "unknown" });
  const ontologyTools = await ontology.listTools();
  const collaborationTools = await collaboration.listTools();
  requireTools(ontologyTools, ["qf_agent_definition_query", "qf_create_agent_session", "qf_start_agent_session"], "orchestrator ontology");
  requireTools(collaborationTools, ["send_task"], "orchestrator collaboration");
  const definitions = await ontology.callTool("qf_agent_definition_query", ontologyArgs({}));
  emitBoundary("tool_output", { role: ROLE, tool: "qf_agent_definition_query" });
  const rows = Array.isArray(definitions?.result) ? definitions.result : [];
  if (!rows.some((row) => row?.id === "hermes-worker")) throw new Error("production hermes-worker definition was not discovered");
  const workerSessionId = `synthetic-worker-${randomUUID()}`;
  emitBoundary("tool_input", { role: ROLE, tool: "qf_create_agent_session" });
  await ontology.callTool("qf_create_agent_session", ontologyArgs({ session_id: workerSessionId, agent_definition_id: "hermes-worker", label: "Synthetic research worker" }));
  emitBoundary("tool_output", { role: ROLE, tool: "qf_create_agent_session" });
  emitBoundary("tool_input", { role: ROLE, tool: "qf_start_agent_session" });
  await ontology.callTool("qf_start_agent_session", ontologyArgs({ session_id: workerSessionId }));
  emitBoundary("tool_output", { role: ROLE, tool: "qf_start_agent_session" });
  const task = await collaboration.callTool("send_task", collaborationArgs({ to_role: "worker", task: activation.question }));
  if (!task?.taskId) throw new Error("synthetic send_task returned no task id");
  emitBoundary("tool_input", { role: ROLE, tool: "send_task", task_id: task.taskId });
  const result = await nextMatching(reader, (line) => {
    const match = /^\[QuantFlow RESULT for ([A-Za-z0-9_-]{1,128}) from worker\] (.+)$/.exec(line);
    return match && match[1] === task.taskId ? match : null;
  });
  emitBoundary("tool_output", { role: ROLE, tool: "send_task", task_id: task.taskId });
  emitBoundary("first_turn", { role: ROLE, task_id: task.taskId });
  emitBoundary("run_control", { role: ROLE, task_id: task.taskId, result_returned: true });
  emitBoundary("result_return", { role: ROLE, task_id: task.taskId });
  emit({ turn: "complete", role: ROLE, task_id: task.taskId });
}

async function worker(reader, ontology, collaboration) {
  emit({ boundary: "activation_wait", role: ROLE });
  const task = await nextMatching(reader, parseTask);
  emitBoundary("activation_delivery", { role: ROLE, task_id: task.taskId });
  const ontologyTools = await ontology.listTools();
  const collaborationTools = await collaboration.listTools();
  requireTools(ontologyTools, ["qf_market_event_get", "qf_market_event_query"], "worker ontology");
  requireTools(collaborationTools, ["send_result"], "worker collaboration");
  let falsifierReceipt = "";
  if (SUPPRESS_BOUNDARY === "tool_input") {
    try {
      await ontology.callTool("qf_market_event_get", ontologyArgs({}));
      throw new Error("qf_market_event_get accepted missing id");
    } catch (error) {
      if (!String(error).includes("requires id")) throw error;
      emit({ falsifier: "gateway_tool_input_rejected", reason: String(error) });
      falsifierReceipt = ` Gateway falsifier gateway_tool_input_rejected=${String(error).replace(/[\r\n ]/g, "_")}.`;
    }
  }
  emitBoundary("tool_input", { role: ROLE, tool: "qf_market_event_query" });
  const marketRead = await ontology.callTool("qf_market_event_query", ontologyArgs({}));
  const rows = Array.isArray(marketRead?.result) ? marketRead.result : [];
  emitBoundary("tool_output", {
    role: ROLE,
    tool: "qf_market_event_query",
    artifact_id: marketRead?.artifactId ?? "missing",
    row_count: rows.length,
  });
  if (!marketRead?.artifactId || rows.length === 0 || !rows.every((row) => typeof row?.id === "string")) {
    throw new Error("synthetic market read did not return fixture rows and a trajectory artifact");
  }
  const ids = [...new Set(rows.map((row) => row.id))];
  let result = `Deterministic packaged fixture read completed for ${ids.join(", ")}.`;
  if (SUPPRESS_BOUNDARY === "tool_output") {
    try {
      await collaboration.callTool("send_result", collaborationArgs({
        task_id: task.taskId,
        result,
        cited_market_ids: ["market:missing-boundary-falsifier"],
        read_trajectory_artifact_ids: [marketRead.artifactId],
      }));
      throw new Error("send_result accepted an uncited market id");
    } catch (error) {
      if (!String(error).includes("cited market id does not exist")) throw error;
      emit({ falsifier: "gateway_tool_output_rejected", reason: String(error) });
      falsifierReceipt = ` Gateway falsifier gateway_tool_output_rejected=${String(error).replace(/[\r\n ]/g, "_")}.`;
    }
  }
  result += falsifierReceipt;
  emitBoundary("tool_input", { role: ROLE, tool: "send_result", task_id: task.taskId });
  const sent = await collaboration.callTool("send_result", collaborationArgs({
    task_id: task.taskId,
    result,
    cited_market_ids: ids,
    read_trajectory_artifact_ids: [marketRead.artifactId],
  }));
  if (!sent?.artifactId) throw new Error("synthetic send_result returned no artifact id");
  emitBoundary("tool_output", { role: ROLE, tool: "send_result", artifact_id: sent.artifactId });
  emitBoundary("first_turn", { role: ROLE, task_id: task.taskId });
  emit({ turn: "complete", role: ROLE, task_id: task.taskId });
}

async function critic(reader, ontology) {
  const ids = await nextReview(reader);
  emitBoundary("activation_delivery", { role: ROLE, run_id: ids.run_id });
  const tools = await ontology.listTools();
  requireTools(tools, ["qf_hypothesis_get", "qf_run_get", "qf_artifact_get", "qf_record_evaluation"], "critic ontology");
  for (const [tool, id] of [["qf_hypothesis_get", ids.hypothesis_id], ["qf_run_get", ids.run_id], ["qf_artifact_get", ids.artifact_id]]) {
    emitBoundary("tool_input", { role: ROLE, tool });
    const read = await ontology.callTool(tool, ontologyArgs({ id }));
    if (!read?.artifactId) throw new Error(`${tool} returned no read trajectory artifact`);
    if (read.result?.id !== id) throw new Error(`${tool} returned the wrong object for ${id}`);
    emitBoundary("tool_output", { role: ROLE, tool, artifact_id: read.artifactId, object_id: id });
  }
  emitBoundary("tool_input", { role: ROLE, tool: "qf_record_evaluation" });
  const evaluation = await ontology.callTool("qf_record_evaluation", ontologyArgs({
    hypothesis_id: ids.hypothesis_id,
    run_id: ids.run_id,
    artifact_id: ids.artifact_id,
    verdict: "supports",
    confidence: 0.9,
    rationale: "The deterministic fixture run matches the declared hypothesis and bounded evidence.",
    findings: "The independent critic observed the exact Hypothesis, Run, and result Artifact named by the app.",
  }));
  if (!evaluation?.result?.object_id) throw new Error("qf_record_evaluation returned no Evaluation id");
  emitBoundary("tool_output", { role: ROLE, tool: "qf_record_evaluation", evaluation_id: evaluation.result.object_id });
  emitBoundary("lineage_publication", {
    evaluation_id: evaluation.result.object_id,
    hypothesis_id: ids.hypothesis_id,
    run_id: ids.run_id,
    artifact_id: ids.artifact_id,
    metrics: ids.metrics,
  });
  emit({ turn: "complete", role: ROLE, evaluation_id: evaluation.result.object_id });
}

async function nextMatching(reader, parser) {
  const deadline = Date.now() + MCP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const line = cleanPtyLine(await reader.next(Math.max(1, deadline - Date.now())));
    const parsed = parser(line);
    if (parsed) return parsed;
  }
  throw new Error("synthetic Hermes activation timed out");
}

function cleanPtyLine(line) {
  return line
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();
}

async function run() {
  requireConfig();
  emit({ responder: "started", role: ROLE, endpoint: process.env.QF_APP_RPC_ENDPOINT ?? "missing", ontology_bridge: ONTOLOGY_BRIDGE });
  // Preserve the native Hermes TUI readiness seam. The host waits for the
  // alternate-screen transition in addition to the launcher's two receipts.
  process.stdout.write("\u001b[?1049h");
  const reader = new PtyLineReader(process.stdin);
  const ontology = new StdioMcpClient(ONTOLOGY_BRIDGE, "ontology");
  const collaboration = new StdioMcpClient(COLLABORATION_BRIDGE, "collaboration");
  try {
    await ontology.start();
    await collaboration.start();
    if (ROLE === "critic") await critic(reader, ontology);
    else if (ROLE === "worker") await worker(reader, ontology, collaboration);
    else await orchestrator(reader, ontology, collaboration);
  } finally {
    await Promise.allSettled([ontology.stop(), collaboration.stop()]);
    process.stdout.write("\u001b[?1049l");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    emit({ responder: "error", role: ROLE, message: error instanceof Error ? error.message : String(error) });
    process.stderr.write(`qf-hermes-synthetic-responder: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
