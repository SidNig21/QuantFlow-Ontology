import { beforeEach, describe, expect, test } from "bun:test";
import {
  channelAcknowledge,
  channelReply,
  channelSend,
  channelThreadList,
  channelWait,
  eventTail,
  getTerminalHealth,
  reportAgentStatus,
  resetChannelServiceForTests,
  upsertCanvasConnection,
} from "./channel-service";

describe("channel-service", () => {
  beforeEach(() => {
    resetChannelServiceForTests();
    upsertCanvasConnection(
      {
        id: "connection-1",
        sourceId: "tile-a",
        targetId: "tile-b",
        transport: "agent-channel",
        endpointKind: "agent",
        active: true,
      },
      { emitEvent: false },
    );
  });

  test("channelSend dedupes by clientRequestId + connection + payload hash", async () => {
    const writes: Array<{ tileId: string; input: string }> = [];
    const first = await channelSend({
      connectionId: "connection-1",
      fromTileId: "tile-a",
      toTileId: "tile-b",
      body: "review this folder",
      clientRequestId: "req-1",
      sendTerminalInput: async (tileId, input) => {
        writes.push({ tileId, input });
      },
      getTargetHealth: () => "idle",
    });
    const second = await channelSend({
      connectionId: "connection-1",
      fromTileId: "tile-a",
      toTileId: "tile-b",
      body: "review this folder",
      clientRequestId: "req-1",
      sendTerminalInput: async (tileId, input) => {
        writes.push({ tileId, input });
      },
      getTargetHealth: () => "idle",
    });

    expect(second.threadId).toBe(first.threadId);
    expect(writes).toHaveLength(1);
  });

  test("payload hash canonicalizes CRLF and trailing whitespace only", async () => {
    const writes: Array<{ tileId: string; input: string }> = [];
    const first = await channelSend({
      connectionId: "connection-1",
      fromTileId: "tile-a",
      toTileId: "tile-b",
      body: "review this folder\r\n",
      clientRequestId: "req-canon",
      sendTerminalInput: async (tileId, input) => {
        writes.push({ tileId, input });
      },
      getTargetHealth: () => "idle",
    });
    const second = await channelSend({
      connectionId: "connection-1",
      fromTileId: "tile-a",
      toTileId: "tile-b",
      body: "review this folder\n   ",
      clientRequestId: "req-canon",
      sendTerminalInput: async (tileId, input) => {
        writes.push({ tileId, input });
      },
      getTargetHealth: () => "idle",
    });

    expect(second.threadId).toBe(first.threadId);
    expect(writes).toHaveLength(1);
  });

  test("same clientRequestId with a different payload is rejected", async () => {
    await channelSend({
      connectionId: "connection-1",
      fromTileId: "tile-a",
      toTileId: "tile-b",
      body: "first task",
      clientRequestId: "req-conflict",
      sendTerminalInput: async () => undefined,
      getTargetHealth: () => "idle",
    });

    try {
      await channelSend({
        connectionId: "connection-1",
        fromTileId: "tile-a",
        toTileId: "tile-b",
        body: "second task",
        clientRequestId: "req-conflict",
        sendTerminalInput: async () => undefined,
        getTargetHealth: () => "idle",
      });
      expect.unreachable("conflicting clientRequestId should reject");
    } catch (error) {
      expect(error.code).toBe("INVALID_ARGUMENT");
    }
  });

  test("failed pre-delivery sends retry the same thread", async () => {
    let fail = true;
    const writes: string[] = [];
    let firstThreadId = "";
    try {
      await channelSend({
        connectionId: "connection-1",
        fromTileId: "tile-a",
        toTileId: "tile-b",
        body: "retry me",
        clientRequestId: "req-retry",
        sendTerminalInput: async (_tileId, input) => {
          if (fail) throw new Error("terminal unavailable");
          writes.push(input);
        },
        getTargetHealth: () => "idle",
      });
      expect.unreachable("first send should fail");
    } catch (error) {
      const err = error as { code: string; data: { threadId: string } };
      firstThreadId = err.data.threadId;
      expect(err.code).toBe("INTERNAL_ERROR");
    }

    fail = false;
    const retry = await channelSend({
      connectionId: "connection-1",
      fromTileId: "tile-a",
      toTileId: "tile-b",
      body: "retry me",
      clientRequestId: "req-retry",
      sendTerminalInput: async (_tileId, input) => {
        writes.push(input);
      },
      getTargetHealth: () => "idle",
    });

    expect(retry.threadId).toBe(firstThreadId);
    expect(retry.state).toBe("delivered");
    expect(writes).toHaveLength(1);
  });

  test("agent-channel sends are one-way from source to target", async () => {
    try {
      await channelSend({
        connectionId: "connection-1",
        fromTileId: "tile-b",
        toTileId: "tile-a",
        body: "reverse",
        sendTerminalInput: async () => undefined,
        getTargetHealth: () => "idle",
      });
      expect.unreachable("reverse sends should reject");
    } catch (error) {
      expect(error.code).toBe("PERMISSION_DENIED");
    }
  });

  test("missing terminal session overrides stale explicit status", () => {
    reportAgentStatus("tile-b", "working");
    expect(getTerminalHealth("tile-b", false)).toBe("offline");
    expect(getTerminalHealth("tile-b", true)).toBe("working");
  });

  test("channelAcknowledge moves delivered requests to waiting", async () => {
    const sent = await channelSend({
      connectionId: "connection-1",
      fromTileId: "tile-a",
      toTileId: "tile-b",
      body: "start work",
      sendTerminalInput: async () => undefined,
      getTargetHealth: () => "idle",
    });

    const acknowledged = channelAcknowledge({
      threadId: sent.threadId,
      actorTileId: "tile-b",
    });

    expect(acknowledged.state).toBe("waiting");
  });

  test("channelReply resolves channelWait and injects a semantic reply", async () => {
    const writes: Array<{ tileId: string; input: string }> = [];
    const sent = await channelSend({
      connectionId: "connection-1",
      fromTileId: "tile-a",
      toTileId: "tile-b",
      body: "ship the patch",
      sendTerminalInput: async (tileId, input) => {
        writes.push({ tileId, input });
      },
      getTargetHealth: () => "idle",
    });

    const waiter = channelWait({ threadId: sent.threadId, timeoutMs: 5000 });
    const reply = await channelReply({
      threadId: sent.threadId,
      fromTileId: "tile-b",
      body: "done",
      sendTerminalInput: async (tileId, input) => {
        writes.push({ tileId, input });
      },
    });

    const resolved = await waiter;

    expect(reply.state).toBe("replied");
    expect(resolved.reply?.body).toBe("done");
    expect(writes.at(-1)?.tileId).toBe("tile-a");
  });

  test("channelWait marks delivered silent work blocked_review on timeout", async () => {
    const sent = await channelSend({
      connectionId: "connection-1",
      fromTileId: "tile-a",
      toTileId: "tile-b",
      body: "wait for review",
      sendTerminalInput: async () => undefined,
      getTargetHealth: () => "idle",
    });

    const resolved = await channelWait({
      threadId: sent.threadId,
      timeoutMs: 1,
    });

    expect(resolved.state).toBe("blocked_review");
    expect(channelThreadList({ connectionId: "connection-1" })[0]?.state)
      .toBe("blocked_review");
  });

  test("blocked targets fail with TARGET_BUSY", async () => {
    reportAgentStatus("tile-b", "blocked");

    try {
      await channelSend({
        connectionId: "connection-1",
        fromTileId: "tile-a",
        toTileId: "tile-b",
        body: "start work",
        sendTerminalInput: async () => undefined,
        getTargetHealth: () => "blocked",
      });
      expect.unreachable("channelSend should reject for blocked targets");
    } catch (error) {
      expect(error.code).toBe("TARGET_BUSY");
    }
  });

  test("eventTail paginates monotonically within a session", async () => {
    const sent = await channelSend({
      connectionId: "connection-1",
      fromTileId: "tile-a",
      toTileId: "tile-b",
      body: "collect docs",
      sendTerminalInput: async () => undefined,
      getTargetHealth: () => "idle",
    });
    await channelReply({
      threadId: sent.threadId,
      fromTileId: "tile-b",
      body: "ready",
      sendTerminalInput: async () => undefined,
    });

    const first = eventTail({ limit: 2 });
    const second = eventTail({
      afterEventId: first.nextAfterEventId ?? 0,
      limit: 10,
    });

    expect(first.events.length).toBe(2);
    expect(second.events.every((event) => event.id > (first.nextAfterEventId ?? 0))).toBe(true);
    expect(channelThreadList({ connectionId: "connection-1" })).toHaveLength(1);
  });
});
