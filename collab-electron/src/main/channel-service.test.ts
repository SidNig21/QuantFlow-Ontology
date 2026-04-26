import { beforeEach, describe, expect, test } from "bun:test";
import {
  channelAcknowledge,
  channelReply,
  channelSend,
  channelThreadList,
  channelWait,
  eventTail,
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
