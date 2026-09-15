import { kernelDecisionReadScope, kernelExecute, kernelGetObject, kernelGetLinks, kernelSessionFailureReason } from "./kernel";
import { stripTerminalControls } from "./launcher-readiness";

export const MARKET_STREAM_FAILURE = "provider_stream_interrupted";
export const MARKET_PROVIDER_UNAVAILABLE = "provider_unavailable";
export const MARKET_RESUME_SETUP_FAILED = "market_resume_setup_failed";
export const MARKET_RESUME_DISPATCH_FAILED = "market_resume_dispatch_failed";
export const MARKET_RESUME_FAILURE_REASONS = [MARKET_STREAM_FAILURE, MARKET_PROVIDER_UNAVAILABLE, "app_terminated", MARKET_RESUME_SETUP_FAILED, MARKET_RESUME_DISPATCH_FAILED] as const;

/** One app-bound runtime frame, not terminal prose, ends an unfinished attempt. */
export function createMarketFailureReceiver(nonce: string, onFailure: () => void): (data: Buffer) => void {
  const frame = `QF_STREAM_FAILURE ${nonce}`;
  let tail = "";
  let received = false;
  return (data) => {
    if (received) return;
    tail += data.toString("utf8");
    // ConPTY may paint wrapping and line breaks as cursor controls. The nonce
    // binds this receipt to the app-owned runtime; ordinary error prose cannot.
    if (stripTerminalControls(tail).replace(/\n/g, "").includes(frame)) { received = true; onFailure(); }
    tail = tail.slice(-4096);
  };
}

export function createMarketRuntimeReceiver(nonce: string, onFailure: (reason: typeof MARKET_STREAM_FAILURE | typeof MARKET_PROVIDER_UNAVAILABLE) => void, onReceipt: (receipt: unknown) => void): (data: Buffer) => void {
  let tail = ""; let failed = false; const seen = new Set<string>();
  return (data) => {
    tail += data.toString("utf8");
    const clean = stripTerminalControls(tail).replace(/\r/g, "");
    if (!failed && (tail.includes(`\x1b]777;QF;STREAM_FAILURE;${nonce};\x07`) || clean.replace(/\n/g, "").includes(`QF_STREAM_FAILURE ${nonce}`))) { failed = true; onFailure(MARKET_STREAM_FAILURE); }
    if (!failed && (tail.includes(`\x1b]777;QF;PROVIDER_UNAVAILABLE;${nonce};\x07`) || clean.replace(/\n/g, "").includes(`QF_PROVIDER_UNAVAILABLE ${nonce}`))) { failed = true; onFailure(MARKET_PROVIDER_UNAVAILABLE); }
    for (const match of tail.matchAll(new RegExp(`\\x1b\\]777;QF;RUNTIME_RECEIPT;${nonce};([A-Za-z0-9_=-]+)\\x07`, "g"))) {
      if (seen.has(match[1]!)) continue; seen.add(match[1]!);
      try { onReceipt(JSON.parse(Buffer.from(match[1]!, "base64url").toString("utf8"))); } catch { /* malformed receipt is never authority */ }
    }
    tail = tail.slice(-8192);
  };
}

export function recordMarketRuntimeFailure(sessionId: string, reason: typeof MARKET_STREAM_FAILURE | typeof MARKET_PROVIDER_UNAVAILABLE = MARKET_STREAM_FAILURE): boolean {
  if (kernelGetObject("agent_session", sessionId)?.status !== "running") return false;
  const scope = kernelDecisionReadScope(sessionId);
  if (!scope) return false; // Completed results and other workflows are untouched.
  kernelExecute("fail_agent_session", { session_id: sessionId, reason }, { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() });
  return true;
}

export function assertMarketRetryTask(taskId: string, isLive: (id: string) => boolean): string {
  const owners = kernelGetLinks(taskId, { kind: "assigned_to" }).filter((link) => link.from_id === taskId);
  const failureReason = owners.length === 1 ? kernelSessionFailureReason(owners[0]!.to_id) : null;
  if (kernelGetObject("task", taskId)?.status !== "open" || owners.length !== 1 || !MARKET_RESUME_FAILURE_REASONS.includes(String(failureReason) as (typeof MARKET_RESUME_FAILURE_REASONS)[number]) || isLive(owners[0]!.to_id) || kernelGetLinks(taskId, { kind: "produces" }).some((link) => link.from_id === taskId)) throw new Error("Resume refused: the prior attempt must be stopped with no recorded result.");
  return owners[0]!.to_id;
}
