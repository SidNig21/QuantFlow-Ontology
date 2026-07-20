/**
 * Host ACP tool allowlist + permission outcome mapping (WO-008a).
 * Shared by Electron and smokes — no UI, no auto-approve.
 */
import type {
  PermissionOption,
  RequestPermissionRequest,
  RequestPermissionResponse,
  ToolCallUpdate,
} from "@agentclientprotocol/sdk";

export type PermissionDecision = "allow_once" | "allow_always" | "deny";

/** Extract a stable tool key from an ACP toolCall update. */
export function extractToolKey(toolCall: ToolCallUpdate): string {
  const raw = toolCall.rawInput;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    for (const field of ["name", "tool", "toolName", "function"] as const) {
      const v = o[field];
      if (typeof v === "string" && v.trim()) return v.trim().toLowerCase();
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const nested = (v as Record<string, unknown>).name;
        if (typeof nested === "string" && nested.trim()) {
          return nested.trim().toLowerCase();
        }
      }
    }
  }
  if (typeof toolCall.title === "string" && toolCall.title.trim()) {
    const token = toolCall.title.trim().split(/[\s:|/]+/)[0];
    if (token) return token.toLowerCase();
  }
  if (typeof toolCall.kind === "string" && toolCall.kind.length > 0) {
    return `kind:${toolCall.kind}`;
  }
  return String(toolCall.toolCallId).toLowerCase();
}

/** Empty allowlist denies every tool. Exact key or `kind:<kind>` match. */
export function isToolAllowed(
  toolKey: string,
  allowlist: ReadonlySet<string> | readonly string[],
): boolean {
  const set =
    allowlist instanceof Set
      ? allowlist
      : new Set([...allowlist].map((t) => t.toLowerCase()));
  if (set.size === 0) return false;
  const key = toolKey.toLowerCase();
  if (set.has(key)) return true;
  if (key.startsWith("kind:") && set.has(key)) return true;
  return false;
}

export function denyPermissionResponse(
  params: RequestPermissionRequest,
): RequestPermissionResponse {
  const reject = params.options.find(
    (o) => o.kind === "reject_once" || o.kind === "reject_always",
  );
  if (reject) {
    return {
      outcome: { outcome: "selected", optionId: reject.optionId },
    };
  }
  return { outcome: { outcome: "cancelled" } };
}

function findOption(
  options: PermissionOption[],
  kind: PermissionOption["kind"],
): PermissionOption | undefined {
  return options.find((o) => o.kind === kind);
}

/** Map founder decision → ACP option. Unknown/missing → deny. */
export function permissionResponseForDecision(
  params: RequestPermissionRequest,
  decision: PermissionDecision,
): RequestPermissionResponse {
  if (decision === "allow_once") {
    const opt = findOption(params.options, "allow_once");
    if (opt) {
      return { outcome: { outcome: "selected", optionId: opt.optionId } };
    }
  }
  if (decision === "allow_always") {
    const opt =
      findOption(params.options, "allow_always") ??
      findOption(params.options, "allow_once");
    if (opt) {
      return { outcome: { outcome: "selected", optionId: opt.optionId } };
    }
  }
  return denyPermissionResponse(params);
}

/**
 * Enforce allowlist first; then optional founder callback.
 * Missing callback / timeout path is the caller's job — this only checks allowlist.
 */
export function gateToolPermission(
  params: RequestPermissionRequest,
  allowlist: ReadonlySet<string> | readonly string[],
): { allowed: true; toolKey: string } | { allowed: false; toolKey: string; response: RequestPermissionResponse } {
  const toolKey = extractToolKey(params.toolCall);
  if (!isToolAllowed(toolKey, allowlist)) {
    return {
      allowed: false,
      toolKey,
      response: denyPermissionResponse(params),
    };
  }
  return { allowed: true, toolKey };
}
