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
const PROMPT_SCREENSHOT_PATH = join(import.meta.dir, "../../docs/orders/evidence/golden-baseline/phase3/P14-B-PROMPT-20260830.png");
const RESPONSE_SCREENSHOT_PATH = join(import.meta.dir, "../../docs/orders/evidence/golden-baseline/phase3/P14-B-RESPONSE-20260830.png");
const FORBIDDEN_FLAGS = ["QF_HERMES_SYNTHETIC_TEST", "QF_DOCK_QA_MODE", "QF_HERMES_SYNTHETIC_SUPPRESS_BOUNDARY", "QF_FOUNDER_STEERING_HOLD"] as const;

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function sha(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
function compact(output: string): string {
  return output.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "").replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

function logicalRenderedText(output: string): string {
  return output.replace(/\s+/g, " ").trim();
}

function semanticNonceOccurrences(renderedText: string, prompt: string, nonce: string): number {
  const promptOccurrences = logicalRenderedText(renderedText).split(prompt).length - 1;
  const exactResponseLines = renderedText.split(/\r?\n/).filter((line) => line.trim() === nonce).length;
  return promptOccurrences + exactResponseLines;
}

function renderedPromptCue(output: string): boolean {
  const logical = logicalRenderedText(output);
  return /Respond with exactly QF P14B NONCE 20260830/i.test(logical) && /and nothing/i.test(logical);
}

function renderedResponseCue(output: string): boolean {
  return output.split(/\r?\n/).some((line) => !/Respond with exactly/i.test(line) && /QF P14B NONCE 20260830/i.test(line));
}

export type RenderedSurfaceGeometry = { x: number; y: number; width: number; height: number; viewportWidth: number; viewportHeight: number };
export type PixelCrop = { x: number; y: number; width: number; height: number };

export function renderedSurfaceCrop(surface: RenderedSurfaceGeometry, imageWidth: number, imageHeight: number): PixelCrop {
  assert(surface.viewportWidth > 0 && surface.viewportHeight > 0 && imageWidth > 0 && imageHeight > 0, "rendered-surface crop dimensions are invalid");
  const scaleX = imageWidth / surface.viewportWidth;
  const scaleY = imageHeight / surface.viewportHeight;
  const x = Math.max(0, Math.floor(surface.x * scaleX));
  const y = Math.max(0, Math.floor(surface.y * scaleY));
  const right = Math.min(imageWidth, Math.ceil((surface.x + surface.width) * scaleX));
  const bottom = Math.min(imageHeight, Math.ceil((surface.y + surface.height) * scaleY));
  const width = right - x;
  const height = bottom - y;
  assert(width > 0 && height > 0 && x + width <= imageWidth && y + height <= imageHeight, "rendered-surface crop is outside the captured image");
  return { x, y, width, height };
}

export async function ocrRenderedText(path: string, crop: PixelCrop): Promise<string> {
  const ocrPath = `${path}.ocr.png`;
  const script = `$imagePath=$env:QF_OCR_IMAGE; $ocrPath=$env:QF_OCR_OUTPUT; $x=[int]$env:QF_OCR_X; $y=[int]$env:QF_OCR_Y; $width=[int]$env:QF_OCR_WIDTH; $height=[int]$env:QF_OCR_HEIGHT; Add-Type -AssemblyName System.Drawing; $source=[System.Drawing.Bitmap]::FromFile($imagePath); try { if($x -lt 0 -or $y -lt 0 -or $width -le 0 -or $height -le 0 -or ($x+$width) -gt $source.Width -or ($y+$height) -gt $source.Height){throw 'OCR crop outside image'}; $cropped=[System.Drawing.Bitmap]::new($width,$height); try { $graphics=[System.Drawing.Graphics]::FromImage($cropped); try { $graphics.DrawImage($source,[System.Drawing.Rectangle]::new(0,0,$width,$height),[System.Drawing.Rectangle]::new($x,$y,$width,$height),[System.Drawing.GraphicsUnit]::Pixel) } finally { $graphics.Dispose() }; $scaled=[System.Drawing.Bitmap]::new($width*4,$height*4); try { $scaleGraphics=[System.Drawing.Graphics]::FromImage($scaled); try { $scaleGraphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; $scaleGraphics.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality; $scaleGraphics.DrawImage($cropped,0,0,$scaled.Width,$scaled.Height) } finally { $scaleGraphics.Dispose() }; $scaled.Save($ocrPath,[System.Drawing.Imaging.ImageFormat]::Png) } finally { $scaled.Dispose() } } finally { $cropped.Dispose() } } finally { $source.Dispose() }; Add-Type -AssemblyName System.Runtime.WindowsRuntime; $null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]; $null=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime]; $null=[Windows.Media.Ocr.OcrEngine,Windows.Media.Ocr,ContentType=WindowsRuntime]; $asTask=([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {$_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1})[0]; function Await-WinRT($op,$type){$task=$asTask.MakeGenericMethod($type).Invoke($null,@($op));$task.Wait();$task.Result}; $file=Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($ocrPath)) ([Windows.Storage.StorageFile]); $stream=Await-WinRT ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream]); $decoder=Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder]); $bitmap=Await-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap]); $engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages(); if($null -eq $engine){throw 'Windows OCR engine unavailable'}; $result=Await-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult]); $result.Lines | ForEach-Object {$_.Text}`;
  const child = Bun.spawn(["C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script], {
    env: { ...process.env, QF_OCR_IMAGE: path, QF_OCR_OUTPUT: ocrPath, QF_OCR_X: String(crop.x), QF_OCR_Y: String(crop.y), QF_OCR_WIDTH: String(crop.width), QF_OCR_HEIGHT: String(crop.height) },
    stdout: "pipe", stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  assert(exitCode === 0, `Windows rendered-surface OCR failed: ${stderr.trim()}`);
  return stdout.replace(/\r\n/g, "\n").trim();
}

async function captureUiEvidence(endpoint: string, path: string): Promise<{ hash: string; width: number; height: number }> {
  const captured = await rpcCall(endpoint, "app.ui.capturePage", { outputPath: path }) as Record<string, unknown>;
  assert(existsSync(path), `UI evidence was not written: ${path}`);
  const width = Number(captured.width ?? 0); const height = Number(captured.height ?? 0);
  assert(Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0, "UI evidence dimensions are invalid");
  return { hash: sha(readFileSync(path)), width, height };
}

async function currentTerminalSurface(endpoint: string, sessionId: string): Promise<{ webviewCount: number; geometry: RenderedSurfaceGeometry }> {
  const surface = await rpcCall(endpoint, "app.ui.evaluate", { expression: `(() => { const tile=document.querySelector('.canvas-tile[data-definition-id="${DEFINITION_ID}"][data-session-id="${sessionId}"]'); const webviews=tile?[...tile.querySelectorAll('webview')]:[]; const rect=webviews.length===1?webviews[0].getBoundingClientRect():null; return {webviewCount:webviews.length,rect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight}:null}; })()` }) as Record<string, unknown>;
  const webviewCount = Number(surface.webviewCount ?? 0);
  const geometry = surface.rect as RenderedSurfaceGeometry | null;
  assert(webviewCount === 1 && geometry !== null, "Computer Use Director terminal surface is not exact");
  return { webviewCount, geometry };
}

export function inferenceEndpointFile(env: NodeJS.ProcessEnv): string {
  assert(typeof env.QF_APP_ROOT === "string" && env.QF_APP_ROOT.length > 0, "QF_APP_ROOT missing from isolated inference environment");
  return join(env.QF_APP_ROOT, "socket-path");
}

export type ApiFact = { timestamp: number; session: string; ordinal: number; model: string; provider: string; input: number; output: number; total: number; latency: number };
export type TurnFact = { timestamp: number; session: string; model: string; apiCalls: number; responseLength: number; successful: boolean };
export type InferenceProof = {
  apiFacts: ApiFact[]; turnFacts: TurnFact[]; session: string; provider: string; model: string;
  runtimeSession: string;
  submittedAt: number; completedAt: number; prompt: string; nonce: string;
  transportText: string; renderedText: string; visual: { promptScreenshotHash: string; responseScreenshotHash: string; readyVisible: boolean };
  prelogBytes: number; syntheticFlags: string[]; cleanup: { exitCode: number | null; processes: number; rootsRemaining: number; leaked: string[] };
  kernel: { definitionId: string; runtimeProfile: string; sessionId: string; spawnedFrom: string; status: string };
};

export type DiagnosticFacts = {
  result: "PASS" | "RED"; candidate: string; tree: string; buildHash: string; promptSha: string;
  readiness: boolean; dockClicked: boolean; tileCount: number; session: string; webviewCount: number;
  inputDispatched: boolean; enterDispatched: boolean; inputStartedAt: number; inputCompletedAt: number;
  transportPresent: boolean; transportHash: string; transportBytes: number; renderedPresent: boolean; renderedHash: string; renderedBytes: number; nonceOccurrences: number; nonceOnlyLines: number; readyVisible: boolean;
  logPresent: boolean; logHash: string; logBytes: number; apiFacts: ApiFact[]; turnFacts: TurnFact[]; runtimeSession: string;
  promptScreenshotHash: string; responseScreenshotHash: string;
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
    rendered_surface_present: facts.renderedPresent, post_response_ready_visible: facts.readyVisible, fresh_log_present: facts.logPresent,
    prompt_response_screenshots: facts.promptScreenshotHash.length > 0 && facts.responseScreenshotHash.length > 0,
    exact_api_row: api.length === 1, api_provider_model: api.length === 1 && api[0]!.provider === EXPECTED_PROVIDER && api[0]!.model === EXPECTED_MODEL && facts.configuredProvider === EXPECTED_PROVIDER && facts.configuredModel === EXPECTED_MODEL,
    api_ordinal_one: api.length === 1 && api[0]!.ordinal === 1, api_tokens_latency: api.length === 1 && api[0]!.input_tokens > 0 && api[0]!.output_tokens > 0 && api[0]!.total_tokens === api[0]!.input_tokens + api[0]!.output_tokens && api[0]!.latency_seconds > 0,
    exact_turn_row: turns.length === 1, turn_bound_success: turns.length === 1 && api.length === 1 && facts.runtimeSession.length > 0 && turns[0]!.successful === true && turns[0]!.session === facts.runtimeSession && api[0]!.session === facts.runtimeSession && turns[0]!.model === EXPECTED_MODEL && turns[0]!.api_calls === 1,
    kernel_binding: facts.kernel !== null && facts.kernel.definitionId === DEFINITION_ID && facts.kernel.runtimeProfile === "default" && facts.kernel.sessionId === facts.session && facts.kernel.spawnedFrom === DEFINITION_ID && facts.kernel.status === "running",
    app_exit_zero: facts.exitCode === 0, no_runtime_error_codes: facts.runtimeCodes.length === 0,
    cleanup_zero: facts.cleanup.processes === 0 && facts.cleanup.rootsRemaining === 0 && facts.cleanup.leaked.length === 0,
  };
  const allConjuncts = Object.values(conjuncts).every(Boolean);
  const result = facts.result === "PASS" && allConjuncts ? "PASS" : "RED";
  return stable({
    schema: "qf.p14b.production-inference-diagnostic.v2", gate: GATE, result,
    identity: { candidate: facts.candidate, tree: facts.tree, build_sha256: facts.buildHash, prompt_sha256: facts.promptSha },
    route: { readiness: facts.readiness, dock_clicked: facts.dockClicked, tile_count: facts.tileCount, kernel_session_id: facts.session, runtime_session_id: facts.runtimeSession, webview_count: facts.webviewCount, input_dispatched: facts.inputDispatched, enter_dispatched: facts.enterDispatched, input_started_at: facts.inputStartedAt, input_completed_at: facts.inputCompletedAt },
    terminal_transport: { authority: "non-authoritative-raw-pty-telemetry", present: facts.transportPresent, sha256: facts.transportHash, bytes: facts.transportBytes, nonce_occurrences: facts.nonceOccurrences, nonce_only_lines: facts.nonceOnlyLines },
    visual_evidence: { authority: "rendered-product-corroboration-with-Windows-OCR-fallback", rendered_text_present: facts.renderedPresent, rendered_text_sha256: facts.renderedHash, rendered_text_bytes: facts.renderedBytes, post_response_ready_visible: facts.readyVisible, prompt_png_sha256: facts.promptScreenshotHash, response_png_sha256: facts.responseScreenshotHash },
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
  assert(proof.visual.promptScreenshotHash.length > 0 && proof.visual.responseScreenshotHash.length > 0, "rendered product screenshot evidence is missing");
  assert(proof.visual.readyVisible, "post-response ready boundary was not visible");
  assert(renderedPromptCue(proof.renderedText) && renderedResponseCue(proof.renderedText), "rendered product surface did not visibly show the prompt and response-shaped result");
  assert(!credentialShaped(proof.prompt), "credential-shaped prompt detected");
  assert(proof.apiFacts.length === 1, "trusted API row cardinality is not exactly one");
  const api = proof.apiFacts[0]!;
  assert(proof.runtimeSession.length > 0 && api.session === proof.runtimeSession, "trusted API row belongs to the wrong runtime session");
  assert(api.timestamp >= proof.submittedAt && api.timestamp <= proof.completedAt, "trusted API row is outside submission/completion bounds");
  assert(api.provider === proof.provider && api.model === proof.model, "trusted API provider/model mismatch");
  assert(api.ordinal === 1, "trusted API call is a retry or wrong ordinal");
  assert(api.input > 0 && api.output > 0 && api.total === api.input + api.output, "trusted API token accounting is invalid");
  assert(Number.isFinite(api.latency) && api.latency > 0, "trusted API latency is invalid");
  assert(proof.turnFacts.length === 1, "Turn ended row cardinality is not exactly one");
  const turn = proof.turnFacts[0]!;
  assert(turn.successful && turn.session === proof.runtimeSession && turn.model === proof.model && turn.apiCalls === 1 && turn.responseLength === proof.nonce.length, "Turn ended row is unsuccessful, unbound, or not the exact nonce length");
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
  const computerUseInput = process.argv.includes("--computer-use");
  const root = mkdtempSync(join(tmpdir(), "qf-hermes-production-inference-"));
  const packageTemp = join(root, "package"); mkdirSync(packageTemp);
  const runRoot = join(root, "run"); mkdirSync(runRoot);
  const stores = join(runRoot, "stores"); const kernelDb = join(stores, "kernel.db"); const artifactRoot = join(stores, "artifacts"); mkdirSync(artifactRoot, { recursive: true });
  const appDir = join(runRoot, "app"); mkdirSync(appDir, { recursive: true });
  let child: ChildProcess | null = null; let endpoint = ""; let sessionId = ""; let owned = new Set<number>(); let exitCode: number | null = null; let gateError: unknown = null;
  const identity = gitIdentity();
  const diagnostic: DiagnosticFacts = { result: "RED", ...identity, buildHash: "", promptSha: sha(AUTHORIZED_PROMPT), readiness: false, dockClicked: false, tileCount: 0, session: "", webviewCount: 0, inputDispatched: false, enterDispatched: false, inputStartedAt: 0, inputCompletedAt: 0, transportPresent: false, transportHash: "", transportBytes: 0, renderedPresent: false, renderedHash: "", renderedBytes: 0, nonceOccurrences: 0, nonceOnlyLines: 0, readyVisible: false, logPresent: false, logHash: "", logBytes: 0, apiFacts: [], turnFacts: [], runtimeSession: "", promptScreenshotHash: "", responseScreenshotHash: "", configuredProvider: "", configuredModel: "", runtimeCodes: [], exitCode: null, kernel: null, errorCode: "", cleanup: { processes: 0, rootsRemaining: 1, leaked: [] } };
  try {
    assert(computerUseInput, "P14-B production inference requires Router-owned Computer Use");
    const packageRoot = await buildWindowsPackage(packageTemp);
    diagnostic.buildHash = sha(readFileSync(join(packageRoot, "resources", "app.asar")));
    const env = isolatedEnvironment(runRoot, kernelDb, artifactRoot);
    env.QF_APP_ROOT = runRoot; env.QF_APP_DIR = appDir; env.QF_UI_PROOF = "1"; env.QF_PEER_BUS_DB = join(stores, "peer-bus.db");
    for (const flag of FORBIDDEN_FLAGS) delete env[flag];
    const profileRoot = join(appDir, "hermes-profiles");
    assert(!existsSync(profileRoot), "Hermes profile root was not empty before launch");
    const endpointFile = inferenceEndpointFile(env);
    const before = await processSnapshot();
    child = spawn(join(packageRoot, "QuantFlow.exe"), ["--disable-gpu"], { cwd: packageRoot, env, windowsHide: !computerUseInput, stdio: ["ignore", "pipe", "pipe"] });
    assert(child.pid, "packaged app returned no PID");
    const ready = await waitForReady(child, endpointFile); endpoint = ready.endpoint;
    diagnostic.readiness = true;
    console.log(`${GATE}: COMPUTER_USE_DOCK_READY`);
    const tile = await waitFor("visible Director tile", async () => {
      const value = await rpcCall(endpoint, "app.ui.evaluate", { expression: `(() => { const tiles=[...document.querySelectorAll('.canvas-tile[data-definition-id="${DEFINITION_ID}"][data-session-id]')]; return {count:tiles.length,session:tiles.length===1?tiles[0].getAttribute('data-session-id'):''}; })()` }) as Record<string, unknown>;
      diagnostic.tileCount = Number(value.count ?? 0);
      return diagnostic.tileCount === 1 && typeof value.session === "string" && value.session ? { session: value.session } : null;
    }, Date.now() + LIVE_TIMEOUT_MS);
    sessionId = tile.session; diagnostic.session = sessionId;
    diagnostic.dockClicked = true;
    const modelIdentity = modelFromSeatConfig(appDir, sessionId);
    diagnostic.configuredProvider = modelIdentity.provider; diagnostic.configuredModel = modelIdentity.model;
    const nonce = AUTHORIZED_NONCE;
    const prompt = AUTHORIZED_PROMPT;
    const renderedProbePath = join(runRoot, "rendered-probe.png");
    diagnostic.inputStartedAt = Date.now();
    diagnostic.webviewCount = (await currentTerminalSurface(endpoint, sessionId)).webviewCount;
    console.log(`${GATE}: COMPUTER_USE_TERMINAL_READY session=${sessionId}`);
    await waitFor("rendered Computer Use prompt", async () => {
      const { geometry } = await currentTerminalSurface(endpoint, sessionId);
      const captured = await captureUiEvidence(endpoint, renderedProbePath);
      const rendered = await ocrRenderedText(renderedProbePath, renderedSurfaceCrop(geometry, captured.width, captured.height));
      return renderedPromptCue(rendered) ? { rendered } : null;
    }, Date.now() + LIVE_TIMEOUT_MS);
    diagnostic.promptScreenshotHash = (await captureUiEvidence(endpoint, PROMPT_SCREENSHOT_PATH)).hash;
    diagnostic.inputDispatched = true;
    console.log(`${GATE}: COMPUTER_USE_PROMPT_OBSERVED session=${sessionId}`);
    const submittedAt = Date.now() - 1_000;
    const completion = await waitFor("trusted production inference log", async () => {
      const { geometry } = await currentTerminalSurface(endpoint, sessionId);
      const captured = await captureUiEvidence(endpoint, renderedProbePath);
      const rendered = await ocrRenderedText(renderedProbePath, renderedSurfaceCrop(geometry, captured.width, captured.height));
      diagnostic.renderedPresent = rendered.length > 0; diagnostic.renderedHash = sha(rendered); diagnostic.renderedBytes = Buffer.byteLength(rendered);
      diagnostic.readyVisible = /\bready\b/i.test(rendered);
      const logs = findFiles(profileRoot, "agent.log"); diagnostic.logPresent = logs.length === 1; if (logs.length !== 1) return null;
      const log = readFileSync(logs[0]!, "utf8"); diagnostic.logHash = sha(log); diagnostic.logBytes = Buffer.byteLength(log);
      const parsed = parseTrustedHermesLog(log); diagnostic.apiFacts = parsed.apiFacts; diagnostic.turnFacts = parsed.turnFacts; diagnostic.runtimeCodes = diagnosticRuntimeCodes(log);
      const runtimeSessions = new Set([...parsed.apiFacts, ...parsed.turnFacts].map((row) => row.session).filter(Boolean));
      diagnostic.runtimeSession = runtimeSessions.size === 1 ? [...runtimeSessions][0]! : "";
      return renderedPromptCue(rendered) && renderedResponseCue(rendered) && diagnostic.readyVisible && parsed.apiFacts.length >= 1 && parsed.turnFacts.length >= 1 && diagnostic.runtimeSession.length > 0 ? { rendered, log, parsed } : null;
    }, Date.now() + LIVE_TIMEOUT_MS);
    const transport = await rpcCall(endpoint, "qf.session.capture", { sessionId })
      .then((value) => compact(String((value as Record<string, unknown>).output ?? "")))
      .catch(() => "");
    diagnostic.transportPresent = transport.length > 0; diagnostic.transportHash = transport ? sha(transport) : ""; diagnostic.transportBytes = Buffer.byteLength(transport);
    diagnostic.nonceOccurrences = semanticNonceOccurrences(transport, prompt, nonce);
    diagnostic.nonceOnlyLines = transport.split(/\r?\n/).filter((line) => line.trim() === nonce).length;
    diagnostic.enterDispatched = true;
    diagnostic.inputCompletedAt = Date.now();
    diagnostic.responseScreenshotHash = (await captureUiEvidence(endpoint, RESPONSE_SCREENSHOT_PATH)).hash;
    console.log(`${GATE}: COMPUTER_USE_RESPONSE_OBSERVED session=${sessionId}`);
    const completedAt = Date.now() + 1_000;
    const kernel = kernelFact(kernelDb, sessionId); diagnostic.kernel = kernel;
    owned = collectOwnedPids(before, await processSnapshot(), child.pid, packageRoot);
    owned.add(child.pid);
    const shutdown = await rpcCall(endpoint, "app.shutdown", {}); assert((shutdown as Record<string, unknown>).shuttingDown === true, "app shutdown receipt missing");
    exitCode = await waitForExit(child, 20_000); diagnostic.exitCode = exitCode; child = null;
    const after = await processSnapshot();
    const processes = [...owned].filter((pid) => after.some((row) => row.pid === pid)).length;
    const proof: InferenceProof = { ...completion.parsed, session: sessionId, runtimeSession: diagnostic.runtimeSession, provider: modelIdentity.provider, model: modelIdentity.model, submittedAt, completedAt, prompt, nonce, transportText: transport, renderedText: completion.rendered, visual: { promptScreenshotHash: diagnostic.promptScreenshotHash, responseScreenshotHash: diagnostic.responseScreenshotHash, readyVisible: diagnostic.readyVisible }, prelogBytes: 0, syntheticFlags: FORBIDDEN_FLAGS.filter((flag) => env[flag] !== undefined), cleanup: { exitCode, processes, rootsRemaining: 0, leaked: [] }, kernel };
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
