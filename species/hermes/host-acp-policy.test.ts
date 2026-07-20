/**
 * WO-008a — tool allowlist + permission mapping falsifications.
 * No Hermes binary required.
 */
import { describe, expect, test } from "bun:test";
import type { RequestPermissionRequest } from "@agentclientprotocol/sdk";
import {
  denyPermissionResponse,
  extractToolKey,
  gateToolPermission,
  isToolAllowed,
  permissionResponseForDecision,
} from "./host-acp-policy.ts";

function fakeRequest(
  tool: Partial<RequestPermissionRequest["toolCall"]> & { toolCallId: string },
): RequestPermissionRequest {
  return {
    sessionId: "sess-test",
    toolCall: {
      title: tool.title ?? null,
      kind: tool.kind ?? null,
      rawInput: tool.rawInput,
      toolCallId: tool.toolCallId,
    },
    options: [
      { optionId: "allow-once", kind: "allow_once", name: "Allow once" },
      { optionId: "allow-always", kind: "allow_always", name: "Allow always" },
      { optionId: "reject-once", kind: "reject_once", name: "Deny" },
    ],
  };
}

describe("host-acp-policy", () => {
  test("extractToolKey prefers rawInput.name then title then kind", () => {
    expect(
      extractToolKey({
        toolCallId: "1",
        rawInput: { name: "Web_Search" },
        title: "ignored",
        kind: "fetch",
      }),
    ).toBe("web_search");
    expect(
      extractToolKey({
        toolCallId: "2",
        title: "read_file: /tmp/x",
        kind: "read",
      }),
    ).toBe("read_file");
    expect(
      extractToolKey({ toolCallId: "3", kind: "think" }),
    ).toBe("kind:think");
  });

  test("falsify: unlisted tool → denied", () => {
    const params = fakeRequest({
      toolCallId: "u1",
      rawInput: { name: "rm_rf_root" },
    });
    const gated = gateToolPermission(params, ["web_search", "kind:think"]);
    expect(gated.allowed).toBe(false);
    if (gated.allowed) throw new Error("unreachable");
    expect(gated.toolKey).toBe("rm_rf_root");
    expect(gated.response).toEqual({
      outcome: { outcome: "selected", optionId: "reject-once" },
    });
  });

  test("listed tool may proceed (gate admits; grant maps allow_once)", () => {
    const params = fakeRequest({
      toolCallId: "g1",
      rawInput: { name: "web_search" },
    });
    const gated = gateToolPermission(params, ["web_search"]);
    expect(gated.allowed).toBe(true);
    const granted = permissionResponseForDecision(params, "allow_once");
    expect(granted).toEqual({
      outcome: { outcome: "selected", optionId: "allow-once" },
    });
  });

  test("empty allowlist denies everything", () => {
    expect(isToolAllowed("web_search", [])).toBe(false);
    expect(isToolAllowed("kind:think", new Set())).toBe(false);
  });

  test("deny path without reject option → cancelled", () => {
    const params: RequestPermissionRequest = {
      sessionId: "s",
      toolCall: { toolCallId: "x", title: "t" },
      options: [
        { optionId: "a", kind: "allow_once", name: "Allow" },
      ],
    };
    expect(denyPermissionResponse(params)).toEqual({
      outcome: { outcome: "cancelled" },
    });
  });
});
