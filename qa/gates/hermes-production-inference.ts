/** Phase 3 P14-B — one real packaged Hermes production inference. */
import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import {
  buildWindowsPackage,
  collectOwnedPids,
  isolatedEnvironment,
  processSnapshot,
  rpcCall,
  terminateOwnedProcessTree,
  wait,
  waitForExit,
  waitForReady,
} from "./windows-cold-boot.ts";

const GATE = "hermes-production-inference";
const DEFINITION_ID = "hermes-research-director";
const EXPECTED_PROVIDER = "opencode-go";
const EXPECTED_MODEL = "kimi-k3";
export const AUTHORIZED_NONCE = "QF_P14B_NONCE_20260830_A1B2C3D4";
export const AUTHORIZED_PROMPT = `Respond with exactly ${AUTHORIZED_NONCE} and nothing else.`;
const LIVE_TIMEOUT_MS = 180_000;
const EVIDENCE_PATH = join(import.meta.dir, "../../docs/orders/evidence/golden-baseline/phase3/P14-B-PRODUCTION-INFERENCE-20260830.json");
const FORBIDDEN_FLAGS = ["QF_HERMES_SYNTHETIC_TEST", "QF_DOCK_QA_MODE", "QF_HERMES_SYNTHETIC_SUPPRESS_BOUNDARY", "QF_FOUNDER_STEERING_HOLD"] as const;

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function sha(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
function compact(output: string): string {
  return output.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "").replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

export function inferenceEndpointFile(env: NodeJS.ProcessEnv): string {
  assert(typeof env.QF_APP_ROOT === "string" && env.QF_APP_ROOT.length > 0, "QF_APP_ROOT missing from isolated inference environment");
  return join(env.QF_APP_ROOT, "socket-path");
}

export type ApiFact = { timestamp: number; session: string; ordinal: number; model: string; provider: string; input: number; output: number; total: number; latency: number };
export type TurnFact = { timestamp: number; session: string; model: string; apiCalls: number; responseLength: number; successful: boolean };
export type InferenceProof = {
  apiFacts: ApiFact[]; turnFacts: TurnFact[]; session: string; provider: string; model: string;
  submittedAt: number; completedAt: number; prompt: string; response: string; nonce: string;
  transcript: string; prelogBytes: number; syntheticFlags: string[]; cleanup: { exitCode: number | null; processes: number; rootsRemaining: number; leaked: string[] };
  kernel: { definitionId: string; runtimeProfile: string; sessionId: string; spawnedFrom: string; status: string };
};

export type DiagnosticFacts = {
  result: "PASS" | "RED"; candidate: string; tree: string; buildHash: string; promptSha: string;
  readiness: boolean; dockClicked: boolean; tileCount: number; session: string; webviewCount: number;
  inputDispatched: boolean; enterDispatched: boolean; inputStartedAt: number; inputCompletedAt: number;
  transcriptPresent: boolean; transcriptHash: string; transcriptBytes: number; nonceOccurrences: number; nonceOnlyLines: number;
  logPresent: boolean; logHash: string; logBytes: number; apiFacts: ApiFact[]; turnFacts: TurnFact[];
  configuredProvider: string; configuredModel: string; runtimeCodes: string[]; exitCode: number | null;
  kernel: InferenceProof["kernel"] | null; errorCode: string; cleanup: { processes: number; rootsRemaining: number; leaked: string[] };
};

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)]));
  return value;
}

export function diagnosticErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/credential|authorization|bearer|api[_-]?key/i.test(message)) return "credential-redacted";
  if (/auth|unauthorized|forbidden/i.test(message)) return "auth";
  if (/provider|model/i.test(message)) return "provider-model";
  if (/fallback/i.test(message)) return "fallback";
  if (/parse|row cardinality|Turn ended|API row/i.test(message)) return "parser-evidence";
  if (/timed out|timeout/i.test(message)) return "timeout";
  if (/cleanup|process|root remained|leaked/i.test(message)) return "cleanup";
  return "gate-contract";
}

export function diagnosticRuntimeCodes(log: string): string[] {
  const codes = new Set<string>();
  if (/unauthorized|forbidden|authentication|auth(?:entication)? failed/i.test(log)) codes.add("auth");
  if (/fallback/i.test(log)) codes.add("fallback");
  if (/provider|model/i.test(log) && /error|invalid|unavailable|unknown/i.test(log)) codes.add("provider-model");
  if (/parse|malformed|invalid json/i.test(log)) codes.add("parser");
  if (/timed out|timeout/i.test(log)) codes.add("timeout");
  if (/credential|authorization|bearer|api[_-]?key/i.test(log)) codes.add("credential-redacted");
  return [...codes].sort();
}

export function buildDiagnosticReceipt(facts: DiagnosticFacts): Record<string, unknown> {
  const api = facts.apiFacts.map((row) => ({ timestamp: row.timestamp, session: row.session, ordinal: row.ordinal, provider: row.provider, model: row.model, input_tokens: row.input, output_tokens: row.output, total_tokens: row.total, latency_seconds: row.latency }));
  const turns = facts.turnFacts.map((row) => ({ timestamp: row.timestamp, session: row.session, model: row.model, api_calls: row.apiCalls, response_length: row.responseLength, successful: row.successful }));
  const conjuncts = {
    app_readiness: facts.readiness, dock_click: facts.dockClicked, exact_tile: facts.tileCount === 1,
    exact_webview: facts.webviewCount === 1, input_and_enter: facts.inputDispatched && facts.enterDispatched,
    transcript_present: facts.transcriptPresent, exact_nonce_occurrences: facts.nonceOccurrences === 2,
    exact_nonce_only_line: facts.nonceOnlyLines === 1, fresh_log_present: facts.logPresent,
    exact_api_row: api.length === 1, api_provider_model: api.length === 1 && api[0]!.provider === EXPECTED_PROVIDER && api[0]!.model === EXPECTED_MODEL && facts.configuredProvider === EXPECTED_PROVIDER && facts.configuredModel === EXPECTED_MODEL,
    api_ordinal_one: api.length === 1 && api[0]!.ordinal === 1, api_tokens_latency: api.length === 1 && api[0]!.input_tokens > 0 && api[0]!.output_tokens > 0 && api[0]!.total_tokens === api[0]!.input_tokens + api[0]!.output_tokens && api[0]!.latency_seconds > 0,
    exact_turn_row: turns.length === 1, turn_bound_success: turns.length === 1 && turns[0]!.successful === true && turns[0]!.session === facts.session && turns[0]!.model === EXPECTED_MODEL && turns[0]!.api_calls === 1,
    kernel_binding: facts.kernel !== null && facts.kernel.definitionId === DEFINITION_ID && facts.kernel.runtimeProfile === "default" && facts.kernel.sessionId === facts.session && facts.kernel.spawnedFrom === DEFINITION_ID && facts.kernel.status === "running",
    app_exit_zero: facts.exitCode === 0, no_runtime_error_codes: facts.runtimeCodes.length === 0,
    cleanup_zero: facts.cleanup.processes === 0 && facts.cleanup.rootsRemaining === 0 && facts.cleanup.leaked.length === 0,
  };
  const allConjuncts = Object.values(conjuncts).every(Boolean);
  const result = facts.result === "PASS" && allConjuncts ? "PASS" : "RED";
  return stable({
    schema: "qf.p14b.production-inference-diagnostic.v1", gate: GATE, result,
    identity: { candidate: facts.candidate, tree: facts.tree, build_sha256: facts.buildHash, prompt_sha256: facts.promptSha },
    route: { readiness: facts.readiness, dock_clicked: facts.dockClicked, tile_count: facts.tileCount, session_id: facts.session, webview_count: facts.webviewCount, input_dispatched: facts.inputDispatched, enter_dispatched: facts.enterDispatched, input_started_at: facts.inputStartedAt, input_completed_at: facts.inputCompletedAt },
    transcript: { present: facts.transcriptPresent, sha256: facts.transcriptHash, bytes: facts.transcriptBytes, nonce_occurrences: facts.nonceOccurrences, nonce_only_lines: facts.nonceOnlyLines },
    trusted_log: { present: facts.logPresent, sha256: facts.logHash, bytes: facts.logBytes, configured_provider: facts.configuredProvider, configured_model: facts.configuredModel, api_rows: api, turn_rows: turns, runtime_error_codes: facts.runtimeCodes },
    kernel: facts.kernel, app_exit_code: facts.exitCode,
    conjuncts, error_code: facts.errorCode || (result === "PASS" ? "none" : "partial-evidence"),
    provider_contact: api.length > 0 ? "proven" : facts.inputDispatched ? "possible" : "not_observed",
    cleanup: facts.cleanup,
  });
}

export function diagnosticReceiptText(facts: DiagnosticFacts): string {
  return `${JSON.stringify(buildDiagnosticReceipt(facts), null, 2)}\n`;
}

export function persistDiagnosticReceipt(path: string, facts: DiagnosticFacts): string {
  const body = diagnosticReceiptText(facts);
  writeFileSync(path, body);
  return sha(body);
}

function gitIdentity(): { candidate: string; tree: string } {
  const read = (args: string[]) => Bun.spawnSync(["git", ...args], { cwd: join(import.meta.dir, "../.."), stdout: "pipe", stderr: "ignore" }).stdout.toString().trim();
  return { candidate: read(["rev-parse", "HEAD"]), tree: read(["rev-parse", "HEAD^{tree}"]) };
}

function timestampMs(line: string): number {
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}),\d{3}/.exec(line);
  return match ? new Date(`${match[1]}T${match[2]}`).getTime() : Number.NaN;
}

export function parseTrustedHermesLog(log: string): { apiFacts: ApiFact[]; turnFacts: TurnFact[] } {
  const apiFacts: ApiFact[] = [];
  const turnFacts: TurnFact[] = [];
  for (const line of log.split(/\r?\n/)) {
    const session = /\[([^\]]+)\]/.exec(line)?.[1] ?? "";
    const api = /API call #(\d+): model=([^ ]+) provider=([^ ]+) in=(\d+) out=(\d+) total=(\d+) latency=([0-9.]+)s/.exec(line);
    if (api) apiFacts.push({ timestamp: timestampMs(line), session, ordinal: Number(api[1]), model: api[2]!, provider: api[3]!, input: Number(api[4]), output: Number(api[5]), total: Number(api[6]), latency: Number(api[7]) });
    const turn = /Turn ended: reason=([^ ]+(?:\([^)]*\))?) model=([^ ]+) api_calls=(\d+)\/\d+ .* response_len=(\d+) session=([^ ]+)/.exec(line);
    if (turn) turnFacts.push({ timestamp: timestampMs(line), session: turn[5]!, model: turn[2]!, apiCalls: Number(turn[3]), responseLength: Number(turn[4]), successful: /finish_reason=stop|text_response/.test(turn[1]!) });
  }
  return { apiFacts, turnFacts };
}

function credentialShaped(value: string): boolean {
  return /(?:sk-[A-Za-z0-9_-]{16,}|api[_-]?key\s*[:=]\s*\S+|bearer\s+[A-Za-z0-9._-]{16,}|authorization\s*[:=])/i.test(value);
}

export function validateInferenceProof(proof: InferenceProof): { api: ApiFact; turn: TurnFact } {
  assert(proof.prelogBytes === 0, "isolated Hermes log was nonempty before launch");
  assert(proof.syntheticFlags.length === 0, "synthetic/proof flag reached production inference");
  assert(proof.provider === EXPECTED_PROVIDER && proof.model === EXPECTED_MODEL, "founder production provider/model identity mismatch");
  assert(proof.nonce === AUTHORIZED_NONCE && proof.prompt === AUTHORIZED_PROMPT, "submitted prompt was not the exact founder-authorized payload");
  assert(proof.response === proof.nonce, "assistant completion was not exactly the authorized nonce");
  assert(!credentialShaped(proof.prompt + proof.response + proof.transcript), "credential-shaped output detected");
  assert(proof.apiFacts.length === 1, "trusted API row cardinality is not exactly one");
  const api = proof.apiFacts[0]!;
  assert(api.session === proof.session, "trusted API row belongs to the wrong session");
  assert(api.timestamp >= proof.submittedAt && api.timestamp <= proof.completedAt, "trusted API row is outside submission/completion bounds");
  assert(api.provider === proof.provider && api.model === proof.model, "trusted API provider/model mismatch");
  assert(api.ordinal === 1, "trusted API call is a retry or wrong ordinal");
  assert(api.input > 0 && api.output > 0 && api.total === api.input + api.output, "trusted API token accounting is invalid");
  assert(Number.isFinite(api.latency) && api.latency > 0, "trusted API latency is invalid");
  assert(proof.turnFacts.length === 1, "Turn ended row cardinality is not exactly one");
  const turn = proof.turnFacts[0]!;
  assert(turn.successful && turn.session === proof.session && turn.model === proof.model && turn.apiCalls === 1 && turn.responseLength === proof.response.length, "Turn ended row is unsuccessful, unbound, or not the exact nonce length");
  assert(turn.timestamp >= api.timestamp && turn.timestamp <= proof.completedAt, "Turn ended row is outside API/completion bounds");
  assert(proof.kernel.definitionId === DEFINITION_ID && proof.kernel.runtimeProfile === "default" && proof.kernel.sessionId === proof.session && proof.kernel.spawnedFrom === DEFINITION_ID && proof.kernel.status === "running", "Kernel definition/session/spawn/lifecycle binding mismatch");
  assert(proof.cleanup.exitCode === 0 && proof.cleanup.processes === 0 && proof.cleanup.rootsRemaining === 0 && proof.cleanup.leaked.length === 0, "exit or cleanup receipt is nonzero");
  return { api, turn };
}

function findFiles(root: string, name: string): string[] {
  if (!existsSync(root)) return [];
  const found: string[] = [];
  const visit = (dir: string) => { for (const entry of readdirSync(dir, { withFileTypes: true })) { const path = join(dir, entry.name); if (entry.isDirectory()) visit(path); else if (entry.name === name) found.push(path); } };
  visit(root); return found.sort();
}

async function waitFor<T>(label: string, action: () => Promise<T | null>, deadline: number): Promise<T> {
  let last = "";
  while (Date.now() < deadline) { try { const value = await action(); if (value !== null) return value; } catch (error) { last = error instanceof Error ? error.message : String(error); } await wait(250); }
  throw new Error(`${label} timed out${last ? `: ${last}` : ""}`);
}

function kernelFact(kernelDb: string, sessionId: string): InferenceProof["kernel"] {
  const db = new Database(kernelDb, { readonly: true });
  try {
    const row = db.query("SELECT s.id AS session_id,s.status,d.id AS definition_id,d.runtime_profile,l.to_id AS spawned_from FROM agent_session s JOIN links l ON l.from_id=s.id AND l.kind='spawned_from' JOIN agent_definition d ON d.id=l.to_id WHERE s.id=?").get(sessionId) as Record<string, unknown> | null;
    assert(row, "Kernel session binding missing");
    return { definitionId: String(row.definition_id), runtimeProfile: String(row.runtime_profile), sessionId: String(row.session_id), spawnedFrom: String(row.spawned_from), status: String(row.status) };
  } finally { db.close(); }
}

function modelFromSeatConfig(appDir: string, sessionId: string): { provider: string; model: string } {
  const path = join(appDir, "hermes-profiles", "profiles", `quantflow-runtime-${sessionId.replace(/[^A-Za-z0-9_-]/g, "_")}`, "config.yaml");
  const raw = readFileSync(path, "utf8");
  const provider = /^\s{2}provider:\s*([^\s#]+)\s*$/m.exec(raw)?.[1] ?? "";
  const model = /^\s{2}default:\s*([^\s#]+)\s*$/m.exec(raw)?.[1] ?? "";
  return { provider, model };
}

async function removeRoot(root: string): Promise<void> {
  for (let i = 0; i < 20; i += 1) { try { rmSync(root, { recursive: true, force: true }); return; } catch { await wait(250); } }
  throw new Error(`run-owned root remained: ${root}`);
}

export async function runHermesProductionInferenceGate(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") return { ok: false };
  const root = mkdtempSync(join(tmpdir(), "qf-hermes-production-inference-"));
  const packageTemp = join(root, "package"); mkdirSync(packageTemp);
  const runRoot = join(root, "run"); mkdirSync(runRoot);
  const stores = join(runRoot, "stores"); const kernelDb = join(stores, "kernel.db"); const artifactRoot = join(stores, "artifacts"); mkdirSync(artifactRoot, { recursive: true });
  const appDir = join(runRoot, "app"); mkdirSync(appDir, { recursive: true });
  let child: ChildProcess | null = null; let endpoint = ""; let sessionId = ""; let owned = new Set<number>(); let exitCode: number | null = null; let gateError: unknown = null;
  const identity = gitIdentity();
  const diagnostic: DiagnosticFacts = { result: "RED", ...identity, buildHash: "", promptSha: sha(AUTHORIZED_PROMPT), readiness: false, dockClicked: false, tileCount: 0, session: "", webviewCount: 0, inputDispatched: false, enterDispatched: false, inputStartedAt: 0, inputCompletedAt: 0, transcriptPresent: false, transcriptHash: "", transcriptBytes: 0, nonceOccurrences: 0, nonceOnlyLines: 0, logPresent: false, logHash: "", logBytes: 0, apiFacts: [], turnFacts: [], configuredProvider: "", configuredModel: "", runtimeCodes: [], exitCode: null, kernel: null, errorCode: "", cleanup: { processes: 0, rootsRemaining: 1, leaked: [] } };
  try {
    const packageRoot = await buildWindowsPackage(packageTemp);
    diagnostic.buildHash = sha(readFileSync(join(packageRoot, "resources", "app.asar")));
    const env = isolatedEnvironment(runRoot, kernelDb, artifactRoot);
    env.QF_APP_ROOT = runRoot; env.QF_APP_DIR = appDir; env.QF_UI_PROOF = "1"; env.QF_PEER_BUS_DB = join(stores, "peer-bus.db");
    for (const flag of FORBIDDEN_FLAGS) delete env[flag];
    const profileRoot = join(appDir, "hermes-profiles");
    assert(!existsSync(profileRoot), "Hermes profile root was not empty before launch");
    const endpointFile = inferenceEndpointFile(env);
    const before = await processSnapshot();
    child = spawn(join(packageRoot, "QuantFlow.exe"), ["--disable-gpu"], { cwd: packageRoot, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    assert(child.pid, "packaged app returned no PID");
    const ready = await waitForReady(child, endpointFile); endpoint = ready.endpoint;
    diagnostic.readiness = true;
    diagnostic.dockClicked = (await rpcCall(endpoint, "app.ui.evaluate", { expression: `(() => { const card=document.querySelector('.lrow[data-definition-id="${DEFINITION_ID}"]'); if(!(card instanceof HTMLElement)) throw new Error('Director Dock card missing'); card.click(); return true; })()` })) === true;
    const tile = await waitFor("visible Director tile", async () => {
      const value = await rpcCall(endpoint, "app.ui.evaluate", { expression: `(() => { const tiles=[...document.querySelectorAll('.canvas-tile[data-definition-id="${DEFINITION_ID}"][data-session-id]')]; return {count:tiles.length,session:tiles.length===1?tiles[0].getAttribute('data-session-id'):''}; })()` }) as Record<string, unknown>;
      diagnostic.tileCount = Number(value.count ?? 0);
      return diagnostic.tileCount === 1 && typeof value.session === "string" && value.session ? { session: value.session } : null;
    }, Date.now() + 60_000);
    sessionId = tile.session; diagnostic.session = sessionId;
    await waitFor("Director readiness", async () => compact(String(((await rpcCall(endpoint, "qf.session.capture", { sessionId })) as Record<string, unknown>).output ?? "")).includes("❯") ? true : null, Date.now() + 60_000);
    const modelIdentity = modelFromSeatConfig(appDir, sessionId);
    diagnostic.configuredProvider = modelIdentity.provider; diagnostic.configuredModel = modelIdentity.model;
    const nonce = AUTHORIZED_NONCE;
    const prompt = AUTHORIZED_PROMPT;
    const submittedAt = Date.now() - 1_000;
    diagnostic.inputStartedAt = Date.now();
    const dispatch = await rpcCall(endpoint, "app.ui.evaluate", { expression: `(async()=>{ const tile=document.querySelector('.canvas-tile[data-definition-id="${DEFINITION_ID}"][data-session-id="${sessionId}"]'); const webviews=tile?[...tile.querySelectorAll('webview')]:[]; if(webviews.length!==1) return {webviewCount:webviews.length,input:false,enter:false}; const webview=webviews[0]; webview.focus(); for(const char of ${JSON.stringify(prompt)}) webview.sendInputEvent({type:'char',keyCode:char}); webview.sendInputEvent({type:'keyDown',keyCode:'ENTER'}); webview.sendInputEvent({type:'keyUp',keyCode:'ENTER'}); return {webviewCount:1,input:true,enter:true}; })()` }) as Record<string, unknown>;
    diagnostic.inputCompletedAt = Date.now(); diagnostic.webviewCount = Number(dispatch.webviewCount ?? 0); diagnostic.inputDispatched = dispatch.input === true; diagnostic.enterDispatched = dispatch.enter === true;
    assert(diagnostic.webviewCount === 1 && diagnostic.inputDispatched && diagnostic.enterDispatched, "Director terminal webview input dispatch failed");
    const completion = await waitFor("nonce completion plus trusted log", async () => {
      const transcript = compact(String(((await rpcCall(endpoint, "qf.session.capture", { sessionId })) as Record<string, unknown>).output ?? ""));
      diagnostic.transcriptPresent = transcript.length > 0; diagnostic.transcriptHash = sha(transcript); diagnostic.transcriptBytes = Buffer.byteLength(transcript);
      const logs = findFiles(profileRoot, "agent.log"); diagnostic.logPresent = logs.length === 1; if (logs.length !== 1) return null;
      const log = readFileSync(logs[0]!, "utf8"); diagnostic.logHash = sha(log); diagnostic.logBytes = Buffer.byteLength(log);
      const parsed = parseTrustedHermesLog(log); diagnostic.apiFacts = parsed.apiFacts; diagnostic.turnFacts = parsed.turnFacts; diagnostic.runtimeCodes = diagnosticRuntimeCodes(log);
      const exactNonceLines = transcript.split(/\r?\n/).filter((line) => line.trim() === nonce);
      const occurrences = transcript.split(nonce).length - 1;
      diagnostic.nonceOccurrences = occurrences; diagnostic.nonceOnlyLines = exactNonceLines.length;
      return occurrences === 2 && exactNonceLines.length === 1 && parsed.apiFacts.length >= 1 && parsed.turnFacts.length >= 1 ? { transcript, log, parsed } : null;
    }, Date.now() + LIVE_TIMEOUT_MS);
    const completedAt = Date.now() + 1_000;
    const response = nonce;
    const kernel = kernelFact(kernelDb, sessionId); diagnostic.kernel = kernel;
    owned = collectOwnedPids(before, await processSnapshot(), child.pid, packageRoot);
    owned.add(child.pid);
    const shutdown = await rpcCall(endpoint, "app.shutdown", {}); assert((shutdown as Record<string, unknown>).shuttingDown === true, "app shutdown receipt missing");
    exitCode = await waitForExit(child, 20_000); diagnostic.exitCode = exitCode; child = null;
    const after = await processSnapshot();
    const processes = [...owned].filter((pid) => after.some((row) => row.pid === pid)).length;
    const proof: InferenceProof = { ...completion.parsed, session: sessionId, provider: modelIdentity.provider, model: modelIdentity.model, submittedAt, completedAt, prompt, response, nonce, transcript: completion.transcript, prelogBytes: 0, syntheticFlags: FORBIDDEN_FLAGS.filter((flag) => env[flag] !== undefined), cleanup: { exitCode, processes, rootsRemaining: 0, leaked: [] }, kernel };
    const { api, turn } = validateInferenceProof(proof);
    void api; void turn; diagnostic.result = "PASS";
  } catch (error) { gateError = error; diagnostic.errorCode = diagnosticErrorCode(error); }
  finally {
    if (child?.pid) { await terminateOwnedProcessTree(child.pid); await waitForExit(child, 5_000).catch(() => null); }
    try { persistDiagnosticReceipt(EVIDENCE_PATH, diagnostic); } catch (error) { gateError ??= error; diagnostic.result = "RED"; diagnostic.errorCode = "receipt-write"; }
    await removeRoot(root).catch((error) => { gateError ??= error; diagnostic.result = "RED"; diagnostic.errorCode = "cleanup"; diagnostic.cleanup.leaked = ["run-root"]; });
    diagnostic.cleanup.rootsRemaining = existsSync(root) ? 1 : 0;
    const afterCleanup = await processSnapshot().catch(() => []);
    diagnostic.cleanup.processes = [...owned].filter((pid) => afterCleanup.some((row) => row.pid === pid)).length;
    try { persistDiagnosticReceipt(EVIDENCE_PATH, diagnostic); } catch (error) { gateError ??= error; }
  }
  if (gateError) { console.error(`${GATE}: FAIL ${gateError instanceof Error ? gateError.message : String(gateError)}`); return { ok: false }; }
  console.log(`${GATE}: processes=0 roots_remaining=0 leaked=[]`);
  return { ok: true };
}

export async function runHermesProductionInferenceBuildPreflight(): Promise<{ ok: boolean }> {
  if (process.platform !== "win32") return { ok: false };
  const root = mkdtempSync(join(tmpdir(), "qf-hermes-production-build-only-"));
  let child: ChildProcess | null = null;
  let owned = new Set<number>();
  let preflightError: unknown = null;
  try {
    const packageRoot = await buildWindowsPackage(root);
    assert(existsSync(join(packageRoot, "QuantFlow.exe")), "build-only preflight missing final packaged app");
    assert(existsSync(join(packageRoot, "resources", "app.asar")), "build-only preflight missing final packaged app.asar");
    const runRoot = join(root, "readiness");
    const stores = join(runRoot, "stores");
    const kernelDb = join(stores, "kernel.db");
    const artifactRoot = join(stores, "artifacts");
    const appDir = join(runRoot, "app");
    mkdirSync(artifactRoot, { recursive: true });
    mkdirSync(appDir, { recursive: true });
    const env = isolatedEnvironment(runRoot, kernelDb, artifactRoot);
    env.QF_APP_ROOT = runRoot;
    env.QF_APP_DIR = appDir;
    env.QF_UI_PROOF = "1";
    env.QF_PEER_BUS_DB = join(stores, "peer-bus.db");
    for (const flag of FORBIDDEN_FLAGS) delete env[flag];
    const before = await processSnapshot();
    child = spawn(join(packageRoot, "QuantFlow.exe"), ["--disable-gpu"], { cwd: packageRoot, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    assert(child.pid, "readiness-only packaged app returned no PID");
    const ready = await waitForReady(child, inferenceEndpointFile(env));
    owned = collectOwnedPids(before, await processSnapshot(), child.pid, packageRoot);
    owned.add(child.pid);
    const shutdown = await rpcCall(ready.endpoint, "app.shutdown", {});
    assert((shutdown as Record<string, unknown>).shuttingDown === true, "readiness-only app shutdown receipt missing");
    const exitCode = await waitForExit(child, 20_000);
    child = null;
    assert(exitCode === 0, `readiness-only app exit was ${String(exitCode)}`);
    const after = await processSnapshot();
    const processes = [...owned].filter((pid) => after.some((row) => row.pid === pid)).length;
    assert(processes === 0, `readiness-only app left ${processes} owned processes`);
    assert(!existsSync(join(appDir, "hermes-profiles")), "readiness-only preflight spawned Hermes before authorization boundary");
    console.log(`${GATE}: readiness-only PASS endpoint=${inferenceEndpointFile(env)} exit=0 processes=0 hermes_spawned=0`);
  } catch (error) {
    preflightError = error;
  } finally {
    if (child?.pid) { await terminateOwnedProcessTree(child.pid); await waitForExit(child, 5_000).catch(() => null); }
    await removeRoot(root).catch((error) => { preflightError ??= error; });
  }
  if (preflightError) { console.error(`${GATE}: readiness-only FAIL ${preflightError instanceof Error ? preflightError.message : String(preflightError)}`); return { ok: false }; }
  console.log(`${GATE}: readiness-only processes=0 roots_remaining=0 leaked=[]`);
  return { ok: true };
}

if (import.meta.main) {
  const result = process.argv.includes("--build-only")
    ? await runHermesProductionInferenceBuildPreflight()
    : await runHermesProductionInferenceGate();
  process.exit(result.ok ? 0 : 1);
}
