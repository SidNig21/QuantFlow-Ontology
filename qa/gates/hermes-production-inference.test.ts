import { expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AUTHORIZED_NONCE, AUTHORIZED_PROMPT, buildDiagnosticReceipt, diagnosticErrorCode, diagnosticReceiptText, diagnosticRuntimeCodes, inferenceEndpointFile, parseTrustedHermesLog, persistDiagnosticReceipt, renderedSurfaceCrop, validateInferenceProof, type DiagnosticFacts, type InferenceProof } from "./hermes-production-inference.ts";

const submittedAt = new Date("2026-08-30T12:00:00").getTime();
const completedAt = new Date("2026-08-30T12:00:10").getTime();
const log = [
  "2026-08-30 12:00:05,000 INFO [session-1] run_agent: API call #1: model=kimi-k3 provider=opencode-go in=10 out=2 total=12 latency=1.5s cache=0/10 (0%)",
  `2026-08-30 12:00:06,000 INFO [session-1] run_agent: Turn ended: reason=text_response(finish_reason=stop) model=kimi-k3 api_calls=1/90 budget=1/90 tool_turns=0 last_msg_role=assistant response_len=${AUTHORIZED_NONCE.length} session=session-1`,
].join("\n");
const parsed = parseTrustedHermesLog(log);

function green(): InferenceProof {
  return { ...parsed, session: "kernel-session-1", runtimeSession: "session-1", provider: "opencode-go", model: "kimi-k3", submittedAt, completedAt, prompt: AUTHORIZED_PROMPT, nonce: AUTHORIZED_NONCE, transportText: `${AUTHORIZED_PROMPT}\n${AUTHORIZED_NONCE}\nready`, renderedText: "Respond with exactly QF P14B NONCE 20260830 AIB2C3D4 and nothing else.\nQF P14B NONCE 20260830 AIB2C3D4\nready", visual: { promptScreenshotHash: "prompt-png", responseScreenshotHash: "response-png", readyVisible: true }, prelogBytes: 0, syntheticFlags: [], cleanup: { exitCode: 0, processes: 0, rootsRemaining: 0, leaked: [] }, kernel: { definitionId: "hermes-research-director", runtimeProfile: "default", sessionId: "kernel-session-1", spawnedFrom: "hermes-research-director", status: "running" } };
}
function red(mutator: (proof: InferenceProof) => void) { const proof = green(); mutator(proof); expect(() => validateInferenceProof(proof)).toThrow(); }

function diagnosticGreen(): DiagnosticFacts {
  return { result: "PASS", candidate: "candidate", tree: "tree", buildHash: "build", promptSha: "prompt", readiness: true, dockClicked: true, tileCount: 1, session: "kernel-session-1", webviewCount: 1, inputDispatched: true, enterDispatched: true, inputStartedAt: submittedAt, inputCompletedAt: submittedAt + 1, transportPresent: true, transportHash: "transport", transportBytes: 100, renderedPresent: true, renderedHash: "rendered", renderedBytes: 100, nonceOccurrences: 2, nonceOnlyLines: 1, readyVisible: true, logPresent: true, logHash: "log", logBytes: 200, apiFacts: parsed.apiFacts.map((row) => ({ ...row })), turnFacts: parsed.turnFacts.map((row) => ({ ...row })), runtimeSession: "session-1", promptScreenshotHash: "prompt-png", responseScreenshotHash: "response-png", configuredProvider: "opencode-go", configuredModel: "kimi-k3", runtimeCodes: [], exitCode: 0, kernel: { definitionId: "hermes-research-director", runtimeProfile: "default", sessionId: "kernel-session-1", spawnedFrom: "hermes-research-director", status: "running" }, errorCode: "", cleanup: { processes: 0, rootsRemaining: 0, leaked: [] } };
}

test("production inference parser binds one exact successful API and Turn row", () => {
  expect(parsed.apiFacts).toHaveLength(1); expect(parsed.turnFacts).toHaveLength(1);
  expect(validateInferenceProof(green()).api.provider).toBe("opencode-go");
});

test("raw PTY transport is optional telemetry and cannot create or veto PASS", () => {
  const absent = green();
  absent.transportText = "";
  expect(validateInferenceProof(absent).turn.responseLength).toBe(AUTHORIZED_NONCE.length);

  const stale = green();
  stale.transportText = "stale unrelated terminal bytes";
  expect(validateInferenceProof(stale).api.ordinal).toBe(1);

  const facts = diagnosticGreen();
  facts.transportPresent = false;
  facts.transportHash = "";
  facts.transportBytes = 0;
  facts.nonceOccurrences = 0;
  facts.nonceOnlyLines = 0;
  const receipt = buildDiagnosticReceipt(facts);
  expect(receipt.result).toBe("PASS");
  expect((receipt.terminal_transport as Record<string, unknown>).present).toBe(false);
});

test("production inference readiness follows explicit QF_APP_ROOT, not the isolated home default", () => {
  const env = { QF_APP_ROOT: "C:\\run-owned\\quantflow", USERPROFILE: "C:\\wrong-home" };
  expect(inferenceEndpointFile(env)).toBe("C:\\run-owned\\quantflow\\socket-path");
  expect(inferenceEndpointFile(env)).not.toContain("wrong-home");
  expect(() => inferenceEndpointFile({ USERPROFILE: "C:\\wrong-home" })).toThrow();
});

test("production inference consumer route is packaged Dock to tile webview, never direct provider invocation", () => {
  const source = readFileSync(new URL("./hermes-production-inference.ts", import.meta.url), "utf8");
  expect(source).toContain(".canvas-tile[data-definition-id=");
  expect(source).toContain("tile.querySelectorAll('webview')");
  expect(source).toContain('process.argv.includes("--computer-use")');
  expect(source).toContain("COMPUTER_USE_DOCK_READY");
  expect(source).toContain("COMPUTER_USE_TERMINAL_READY");
  expect(source).toContain("COMPUTER_USE_PROMPT_OBSERVED");
  expect(source).toContain("COMPUTER_USE_PROMPT_OBSERVED");
  expect(source).toContain("COMPUTER_USE_RESPONSE_OBSERVED");
  expect(source).toContain("ocrRenderedText(renderedProbePath,");
  expect(source).toContain("QF_OCR_IMAGE: path");
  expect(source).not.toContain("$imagePath=$args[0]");
  expect(source).not.toContain("New-Object System.Drawing.Bitmap");
  expect(source.match(/currentTerminalSurface\(endpoint, sessionId\)/g)).toHaveLength(3);
  expect(source).toContain("rendered-product-corroboration-with-Windows-OCR-fallback");
  expect(source).toContain("non-authoritative-raw-pty-telemetry");
  expect(source.match(/qf\.session\.capture/g)).toHaveLength(1);
  expect(source).toContain('.catch(() => "")');
  expect(source).not.toContain("webview.sendInputEvent");
  expect(source).not.toContain("card.click()");
  expect(source).not.toMatch(/fetch\(|openai\.chat|opencode.*(?:fetch|request)/i);
});

test("rendered terminal crop maps CSS geometry into captured pixels and fails outside the image", () => {
  expect(renderedSurfaceCrop({ x: 100, y: 50, width: 400, height: 300, viewportWidth: 800, viewportHeight: 500 }, 1600, 1000)).toEqual({ x: 200, y: 100, width: 800, height: 600 });
  expect(() => renderedSurfaceCrop({ x: 900, y: 50, width: 10, height: 10, viewportWidth: 800, viewportHeight: 500 }, 1600, 1000)).toThrow();
});

test("production inference rejects launch/auth-only, stale/duplicate, provider/model/token/call defects", () => {
  red((p) => { p.apiFacts = []; p.turnFacts = []; });
  red((p) => { p.prelogBytes = 1; });
  red((p) => { p.apiFacts.push({ ...p.apiFacts[0]! }); });
  red((p) => { p.apiFacts[0]!.provider = "fallback"; });
  red((p) => { p.apiFacts[0]!.model = "Kimi-K3"; });
  red((p) => { p.model = "kimi-k3-alias"; });
  red((p) => { p.apiFacts[0]!.input = 0; });
  red((p) => { p.apiFacts[0]!.latency = 0; });
  red((p) => { p.apiFacts[0]!.ordinal = 2; });
});

test("production inference rejects missing/failed/unbound turns and prompt-response substitution", () => {
  red((p) => { p.turnFacts = []; });
  red((p) => { p.turnFacts[0]!.successful = false; });
  red((p) => { p.turnFacts[0]!.apiCalls = 2; });
  red((p) => { p.renderedText = "ready"; });
  red((p) => { p.prompt = `Please ${AUTHORIZED_PROMPT}`; });
  red((p) => { p.nonce = `${AUTHORIZED_NONCE}X`; });
  red((p) => { p.apiFacts[0]!.session = "wrong"; });
  red((p) => { p.apiFacts[0]!.timestamp = p.submittedAt - 1; });
});

test("fuzzy rendered cues cannot rescue missing visual/input authority or wrong exact identity", () => {
  red((p) => { p.visual.promptScreenshotHash = ""; });
  red((p) => { p.visual.responseScreenshotHash = ""; });
  red((p) => { p.prompt = `Please ${AUTHORIZED_PROMPT}`; });
  red((p) => { p.nonce = `${AUTHORIZED_NONCE}-wrong`; });
  red((p) => { p.runtimeSession = "wrong-runtime-session"; });

  for (const mutate of [
    (facts: DiagnosticFacts) => { facts.inputDispatched = false; },
    (facts: DiagnosticFacts) => { facts.enterDispatched = false; },
    (facts: DiagnosticFacts) => { facts.renderedPresent = false; },
    (facts: DiagnosticFacts) => { facts.promptScreenshotHash = ""; },
    (facts: DiagnosticFacts) => { facts.responseScreenshotHash = ""; },
  ]) {
    const facts = diagnosticGreen();
    mutate(facts);
    expect(buildDiagnosticReceipt(facts).result).toBe("RED");
  }
});

test("production inference rejects synthetic, credentials, wrong Kernel identity, and cleanup residue", () => {
  red((p) => { p.syntheticFlags = ["QF_HERMES_SYNTHETIC_TEST"]; });
  red((p) => { p.prompt = "api_key=secret-value-123456789"; });
  red((p) => { p.kernel.spawnedFrom = "hermes-worker"; });
  red((p) => { p.cleanup.processes = 1; });
  red((p) => { p.cleanup.exitCode = 1; });
});

test("diagnostic RED receipt survives disposable-root deletion and is deterministic", () => {
  const outer = mkdtempSync(join(tmpdir(), "qf-p14b-diagnostic-test-"));
  const runRoot = join(outer, "disposable-run"); const receipt = join(outer, "receipt.json"); mkdirSync(runRoot);
  const facts = diagnosticGreen(); facts.result = "RED"; facts.errorCode = "timeout"; facts.readyVisible = false;
  const first = persistDiagnosticReceipt(receipt, facts); const body = readFileSync(receipt, "utf8");
  rmSync(runRoot, { recursive: true, force: true });
  expect(existsSync(receipt)).toBe(true); expect(existsSync(runRoot)).toBe(false);
  expect(persistDiagnosticReceipt(receipt, facts)).toBe(first); expect(readFileSync(receipt, "utf8")).toBe(body);
  rmSync(outer, { recursive: true, force: true });
});

test("diagnostic receipt distinguishes every missing conjunct and never promotes partial evidence", () => {
  const mutations: Array<(facts: DiagnosticFacts) => void> = [
    (f) => { f.readiness = false; }, (f) => { f.dockClicked = false; }, (f) => { f.tileCount = 0; },
    (f) => { f.webviewCount = 0; }, (f) => { f.inputDispatched = false; }, (f) => { f.enterDispatched = false; },
    (f) => { f.renderedPresent = false; }, (f) => { f.readyVisible = false; }, (f) => { f.promptScreenshotHash = ""; }, (f) => { f.responseScreenshotHash = ""; },
    (f) => { f.logPresent = false; }, (f) => { f.apiFacts = []; }, (f) => { f.turnFacts = []; },
    (f) => { f.configuredProvider = "fallback"; }, (f) => { f.apiFacts[0]!.ordinal = 2; }, (f) => { f.apiFacts[0]!.input = 0; },
    (f) => { f.turnFacts[0]!.session = "wrong"; }, (f) => { f.kernel = null; }, (f) => { f.exitCode = 1; }, (f) => { f.runtimeCodes = ["auth"]; },
    (f) => { f.cleanup.processes = 1; }, (f) => { f.cleanup.rootsRemaining = 1; }, (f) => { f.cleanup.leaked = ["owned-root"]; },
  ];
  for (const mutate of mutations) { const facts = diagnosticGreen(); mutate(facts); const receipt = buildDiagnosticReceipt(facts); expect(receipt.result).toBe("RED"); expect(Object.values(receipt.conjuncts as Record<string, boolean>)).toContain(false); }
});

test("diagnostic categorization redacts credential-shaped bait and persists no raw secret", () => {
  const bait = "Authorization: Bearer SECRET_TOKEN_123456789 api_key=SECRET_VALUE";
  expect(diagnosticErrorCode(new Error(bait))).toBe("credential-redacted");
  expect(diagnosticRuntimeCodes(bait)).toContain("credential-redacted");
  const facts = diagnosticGreen(); facts.result = "RED"; facts.errorCode = diagnosticErrorCode(new Error(bait));
  const text = diagnosticReceiptText(facts);
  expect(text).not.toContain("SECRET_TOKEN"); expect(text).not.toContain("SECRET_VALUE"); expect(text).not.toContain("Authorization:");
  expect(text).toContain("credential-redacted");
});
