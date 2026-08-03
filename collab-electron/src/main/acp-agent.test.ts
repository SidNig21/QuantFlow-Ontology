import { describe, expect, mock, test } from "bun:test";
import type { RequestPermissionRequest } from "@agentclientprotocol/sdk";

const sent: unknown[][] = [];
const handlers = new Map<string, (...args: unknown[]) => unknown>();

mock.module("electron", () => ({
  app: {
    isPackaged: false,
    getAppPath: () => ".",
  },
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler);
    },
  },
}));

mock.module("./host-acp-bridge", () => ({
  denyPermissionResponse: (params: RequestPermissionRequest) => ({
    outcome: {
      outcome: "cancelled",
    },
  }),
}));

const { createClient, registerAgentIpc } = await import("./acp-agent");

function fakeRequest(
  options: RequestPermissionRequest["options"],
): RequestPermissionRequest {
  return {
    sessionId: "legacy-session",
    toolCall: {
      toolCallId: "tool-call",
      title: "run command",
      kind: "execute",
    },
    options,
  };
}

describe("legacy ACP permission handling", () => {
  test("falsify: a permission request cannot silently select an allow option", async () => {
    sent.length = 0;
    handlers.clear();

    const win = {
      isDestroyed: () => false,
      webContents: {
        send: (...args: unknown[]) => {
          sent.push(args);
        },
      },
      on: () => {},
    } as never;
    registerAgentIpc(win, {
      workspaces: [],
      expanded_workspaces: [],
      window_state: null,
      ui: {},
    });

    const response = await createClient().requestPermission(
      fakeRequest([
        { optionId: "allow", kind: "allow_once", name: "Allow once" },
      ]),
    );

    expect(response).toEqual({ outcome: { outcome: "cancelled" } });
    expect(sent).toContainEqual([
      "agent:prompt-error",
      {
        sessionId: "legacy-session",
        error:
          "Legacy ACP permission denied: no founder decision UI is available.",
      },
    ]);
  });
});
