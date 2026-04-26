import { ipcMain, type BrowserWindow } from "electron";
import { randomUUID } from "node:crypto";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { registerMethod } from "./json-rpc-server";
import { listStringLinks, getStringActivity } from "./pty";
import { RpcError } from "./rpc-error";
import {
  buildConnectionRuntimeSnapshot,
  channelAcknowledge,
  channelCancel,
  channelInbox,
  channelReply,
  channelSend,
  channelThreadList,
  channelWait,
  eventTail,
  getTerminalHealth,
  reportAgentStatus,
} from "./channel-service";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const pending = new Map<string, PendingRequest>();
const REQUEST_TIMEOUT_MS = 10_000;

let shellWindow: BrowserWindow | null = null;

function sendToShell(
  method: string,
  params: unknown,
): Promise<unknown> {
  if (!shellWindow || shellWindow.isDestroyed()) {
    return Promise.reject(new Error("Shell window not available"));
  }

  const requestId = randomUUID();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`canvas RPC timed out: ${method}`));
    }, REQUEST_TIMEOUT_MS);

    pending.set(requestId, { resolve, reject, timer });

    shellWindow!.webContents.send("canvas:rpc-request", {
      requestId,
      method: method.replace(/^canvas\./, ""),
      params,
    });
  });
}

export function registerCanvasRpc(win: BrowserWindow): void {
  shellWindow = win;

  ipcMain.on(
    "canvas:rpc-response",
    (_event, response: {
      requestId: string;
      result?: unknown;
      error?: { code: number | string; message: string; data?: unknown };
    }) => {
      const entry = pending.get(response.requestId);
      if (!entry) return;

      pending.delete(response.requestId);
      clearTimeout(entry.timer);

      if (response.error) {
        entry.reject(
          new RpcError(
            String(response.error.code),
            response.error.message,
            response.error.data,
          ),
        );
      } else {
        entry.resolve(response.result);
      }
    },
  );

  registerMethod(
    "canvas.snapshot",
    async () => {
      const snapshot = await getShellSnapshot();
      const connectionRuntime = buildConnectionRuntimeSnapshot();
      const stringRuntime = new Map(
        listStringLinks().map((link) => [link.id, link] as const),
      );

      return {
        revision: snapshot.revision,
        tiles: snapshot.tiles.map((tile) => ({
          ...tile,
          terminalHealth:
            tile.type === "term"
              ? getTerminalHealth(tile.id, Boolean(tile.ptySessionId))
              : undefined,
        })),
        connections: snapshot.connections.map((connection) => {
          const channelRuntime = connectionRuntime.get(connection.id);
          const legacyRuntime = stringRuntime.get(connection.id);
          return {
            ...connection,
            pendingCount: channelRuntime?.pendingCount ?? 0,
            lastThreadPreview:
              channelRuntime?.lastThreadPreview
              ?? legacyRuntime?.lastPayload
              ?? null,
            lastThreadId: channelRuntime?.lastThreadId ?? null,
            lastError:
              channelRuntime?.lastError
              ?? legacyRuntime?.lastError
              ?? connection.lastError
              ?? null,
            lastErrorAt:
              channelRuntime?.lastErrorAt
              ?? connection.lastErrorAt
              ?? null,
          };
        }),
      };
    },
    {
      description:
        "Get the authoritative canvas snapshot, including revision, tiles, connections, and runtime status",
      params: {},
    },
  );

  registerMethod(
    "canvas.tileList",
    (params) => sendToShell("canvas.tileList", params),
    {
      description: "List all canvas tiles with positions",
      params: {},
    },
  );

  registerMethod(
    "canvas.tileCreate",
    (params) => sendToShell("canvas.tileCreate", params),
    {
      description: "Create a new tile on the canvas",
      params: {
        type: "Tile type (note, code, image, graph, terminal)",
        filePath: "(optional) Absolute path to file",
        folderPath: "(optional) Absolute path to folder",
        position: "(optional) {x, y} canvas coordinates",
        size: "(optional) {width, height} in pixels",
      },
    },
  );

  registerMethod(
    "canvas.tileRemove",
    (params) => sendToShell("canvas.tileRemove", params),
    {
      description: "Remove a tile from the canvas",
      params: { tileId: "ID of the tile to remove" },
    },
  );

  registerMethod(
    "canvas.tileMove",
    (params) => sendToShell("canvas.tileMove", params),
    {
      description: "Move a tile to a new position",
      params: {
        tileId: "ID of the tile to move",
        position: "{x, y} canvas coordinates",
      },
    },
  );

  registerMethod(
    "canvas.tileResize",
    (params) => sendToShell("canvas.tileResize", params),
    {
      description: "Resize a tile",
      params: {
        tileId: "ID of the tile to resize",
        size: "{width, height} in pixels",
      },
    },
  );

  registerMethod(
    "canvas.terminalWrite",
    (params) => sendToShell("canvas.terminalWrite", params),
    {
      description: "Write input to a terminal tile",
      params: {
        tileId: "ID of the terminal tile",
        input: "String to write to the terminal",
      },
    },
  );

  registerMethod(
    "canvas.terminalRead",
    (params) => sendToShell("canvas.terminalRead", params),
    {
      description: "Read recent output from a terminal tile",
      params: {
        tileId: "ID of the terminal tile",
        lines: "(optional) Number of lines to capture (default 50)",
      },
    },
  );

  registerMethod(
    "canvas.tileFocus",
    (params) => sendToShell("canvas.tileFocus", params),
    {
      description:
        "Pan and zoom viewport to show the specified tiles, " +
        "then flash their focus rings",
      params: {
        tileIds: "Array of tile IDs to bring into view",
      },
    },
  );

  registerMethod(
    "canvas.viewportGet",
    (params) => sendToShell("canvas.viewportGet", params),
    {
      description: "Get current canvas viewport (pan and zoom)",
      params: {},
    },
  );

  registerMethod(
    "canvas.viewportSet",
    (params) => sendToShell("canvas.viewportSet", params),
    {
      description: "Set canvas viewport pan and zoom",
      params: {
        x: "Viewport x offset",
        y: "Viewport y offset",
        zoom: "Zoom level (1 = 100%)",
      },
    },
  );

  registerMethod(
    "canvas.connectionCreate",
    async (params) => {
      return callCanvasShell("canvas.connectionCreate", params);
    },
    {
      description: "Create a semantic or legacy canvas connection between two tiles",
      params: {
        sourceTileId: "ID of the source tile",
        targetTileId: "ID of the target tile",
        transport:
          '(optional) "agent-channel", "pty-baton", or "pty-generic"',
        endpointKind: '(optional) "agent", "note", or "browser"',
        clientRequestId: "(optional) Idempotency key for safe retries",
        ifRevision: "(optional) Expected current canvas revision",
      },
    },
  );

  registerMethod(
    "canvas.connectionRemove",
    async (params) => {
      return callCanvasShell("canvas.connectionRemove", params);
    },
    {
      description: "Remove a canvas connection by stable id",
      params: {
        connectionId: "Stable connection id",
        ifRevision: "(optional) Expected current canvas revision",
      },
    },
  );

  registerMethod(
    "canvas.connectionToggle",
    async (params) => {
      return callCanvasShell("canvas.connectionToggle", params);
    },
    {
      description: "Pause or resume a connection",
      params: {
        connectionId: "Stable connection id",
        ifRevision: "(optional) Expected current canvas revision",
      },
    },
  );

  registerMethod(
    "canvas.connectionSetTransport",
    async (params) => {
      return callCanvasShell("canvas.connectionSetTransport", params);
    },
    {
      description: "Change a connection transport without changing connection identity",
      params: {
        connectionId: "Stable connection id",
        transport: '"agent-channel", "pty-baton", or "pty-generic"',
        ifRevision: "(optional) Expected current canvas revision",
      },
    },
  );

  // ── String link methods (terminal-to-terminal piping) ──

  registerMethod(
    "canvas.agentStatusReport",
    async (params) => {
      const p = params as { tileId: string; status: "idle" | "working" | "blocked" | "done" };
      const snapshot = await getShellSnapshot();
      findTile(snapshot, p.tileId);
      return reportAgentStatus(p.tileId, p.status);
    },
    {
      description: "Report explicit agent status for a terminal tile",
      params: {
        tileId: "Terminal tile id",
        status: '"idle", "working", "blocked", or "done"',
      },
    },
  );

  registerMethod(
    "canvas.terminalHealth",
    async (params) => {
      const p = params as { tileId: string };
      const snapshot = await getShellSnapshot();
      const tile = findTile(snapshot, p.tileId);
      return {
        tileId: tile.id,
        health: getTerminalHealth(tile.id, Boolean(tile.ptySessionId)),
      };
    },
    {
      description: "Get Hermes-grade terminal health for a tile",
      params: {
        tileId: "Terminal tile id",
      },
    },
  );

  registerMethod(
    "canvas.channelSend",
    async (params) => {
      const p = params as {
        connectionId: string;
        fromTileId?: string;
        toTileId?: string;
        body?: string;
        message?: string;
        clientRequestId?: string;
      };
      const snapshot = await getShellSnapshot();
      const connection = snapshot.connections.find(
        (entry) => entry.id === p.connectionId,
      );
      if (!connection) {
        throw new RpcError(
          "CONNECTION_NOT_FOUND",
          `Connection not found: ${p.connectionId}`,
          { connectionId: p.connectionId },
        );
      }
      const fromTileId = p.fromTileId ?? connection.sourceId;
      const toTileId = p.toTileId ?? connection.targetId;
      const fromTile = findTile(snapshot, fromTileId);
      findTile(snapshot, toTileId);
      return channelSend({
        connectionId: p.connectionId,
        fromTileId,
        toTileId,
        body: p.body ?? p.message ?? "",
        clientRequestId: p.clientRequestId,
        fromLabel: fromTile.label ?? fromTile.id,
        sendTerminalInput: writeTerminalTile,
        getTargetHealth: (tileId) => {
          const tile = findTile(snapshot, tileId);
          return getTerminalHealth(tile.id, Boolean(tile.ptySessionId));
        },
      });
    },
    {
      description: "Send a semantic request over an agent-channel connection",
      params: {
        connectionId: "Stable connection id",
        fromTileId: "(optional) Sender tile id; defaults to connection source",
        toTileId: "(optional) Target tile id; defaults to connection target",
        body: "Message body",
        clientRequestId: "(optional) Idempotency key for retry-safe sends",
      },
    },
  );

  registerMethod(
    "canvas.channelReply",
    async (params) => {
      const p = params as {
        threadId: string;
        fromTileId: string;
        body?: string;
        message?: string;
      };
      const snapshot = await getShellSnapshot();
      const fromTile = findTile(snapshot, p.fromTileId);
      return channelReply({
        threadId: p.threadId,
        fromTileId: p.fromTileId,
        body: p.body ?? p.message ?? "",
        fromLabel: fromTile.label ?? fromTile.id,
        sendTerminalInput: writeTerminalTile,
      });
    },
    {
      description: "Reply to a semantic request thread",
      params: {
        threadId: "Stable thread id",
        fromTileId: "Replying tile id",
        body: "Reply body",
      },
    },
  );

  registerMethod(
    "canvas.channelWait",
    async (params) => {
      const p = params as { threadId: string; timeoutMs?: number };
      return channelWait(p);
    },
    {
      description: "Wait for a thread to reach a terminal state",
      params: {
        threadId: "Stable thread id",
        timeoutMs: "(optional) Wait timeout in milliseconds",
      },
    },
  );

  registerMethod(
    "canvas.channelInbox",
    async (params) => {
      const p = params as { tileId: string };
      return { threads: channelInbox(p.tileId) };
    },
    {
      description: "List pending semantic requests for a tile",
      params: { tileId: "Target tile id" },
    },
  );

  registerMethod(
    "canvas.channelThreadList",
    async (params) => {
      const p = params as { connectionId?: string; tileId?: string };
      return { threads: channelThreadList(p) };
    },
    {
      description: "List semantic channel threads",
      params: {
        connectionId: "(optional) Filter by connection id",
        tileId: "(optional) Filter by tile id",
      },
    },
  );

  registerMethod(
    "canvas.channelAcknowledge",
    async (params) => {
      const p = params as { threadId: string; actorTileId?: string };
      return channelAcknowledge(p);
    },
    {
      description: "Acknowledge delivery of a semantic request",
      params: {
        threadId: "Stable thread id",
        actorTileId: "(optional) Acknowledging tile id",
      },
    },
  );

  registerMethod(
    "canvas.channelCancel",
    async (params) => {
      const p = params as { threadId: string; reason?: string };
      return channelCancel(p);
    },
    {
      description: "Cancel a semantic request thread",
      params: {
        threadId: "Stable thread id",
        reason: "(optional) Cancellation reason",
      },
    },
  );

  registerMethod(
    "canvas.eventTail",
    async (params) => {
      const p = params as { afterEventId?: number; limit?: number };
      return eventTail(p);
    },
    {
      description: "Get recent machine-readable canvas events",
      params: {
        afterEventId: "(optional) Event cursor to resume from",
        limit: "(optional) Maximum number of events to return",
      },
    },
  );

  registerMethod(
    "canvas.noteResourceRead",
    async (params) => {
      const p = params as {
        connectionId: string;
        actorTileId?: string;
      };
      const snapshot = await getShellSnapshot();
      const { resourceTile } = resolveConnectedResource(
        snapshot,
        p.connectionId,
        p.actorTileId,
        "note",
      );
      if (!resourceTile.filePath) {
        throw new RpcError(
          "INVALID_ENDPOINT_KIND",
          `Note resource ${resourceTile.id} does not have a backing file`,
          { tileId: resourceTile.id },
        );
      }
      const body = await readFile(resourceTile.filePath, "utf-8");
      return {
        tileId: resourceTile.id,
        filePath: resourceTile.filePath,
        body,
      };
    },
    {
      description: "Read a connected note or code resource",
      params: {
        connectionId: "Connection id for a terminal-note resource link",
        actorTileId: "(optional) Acting terminal tile id",
      },
    },
  );

  registerMethod(
    "canvas.noteResourceWrite",
    async (params) => {
      const p = params as {
        connectionId: string;
        actorTileId?: string;
        body: string;
      };
      const snapshot = await getShellSnapshot();
      const { resourceTile } = resolveConnectedResource(
        snapshot,
        p.connectionId,
        p.actorTileId,
        "note",
      );
      if (!resourceTile.filePath) {
        throw new RpcError(
          "INVALID_ENDPOINT_KIND",
          `Note resource ${resourceTile.id} does not have a backing file`,
          { tileId: resourceTile.id },
        );
      }
      await writeFile(resourceTile.filePath, p.body ?? "", "utf-8");
      return {
        tileId: resourceTile.id,
        filePath: resourceTile.filePath,
        bytes: Buffer.byteLength(p.body ?? "", "utf-8"),
      };
    },
    {
      description: "Write a connected note or code resource",
      params: {
        connectionId: "Connection id for a terminal-note resource link",
        actorTileId: "(optional) Acting terminal tile id",
        body: "New file contents",
      },
    },
  );

  registerMethod(
    "canvas.noteResourceAppend",
    async (params) => {
      const p = params as {
        connectionId: string;
        actorTileId?: string;
        body: string;
      };
      const snapshot = await getShellSnapshot();
      const { resourceTile } = resolveConnectedResource(
        snapshot,
        p.connectionId,
        p.actorTileId,
        "note",
      );
      if (!resourceTile.filePath) {
        throw new RpcError(
          "INVALID_ENDPOINT_KIND",
          `Note resource ${resourceTile.id} does not have a backing file`,
          { tileId: resourceTile.id },
        );
      }
      await appendFile(resourceTile.filePath, p.body ?? "", "utf-8");
      return {
        tileId: resourceTile.id,
        filePath: resourceTile.filePath,
        bytes: Buffer.byteLength(p.body ?? "", "utf-8"),
      };
    },
    {
      description: "Append to a connected note or code resource",
      params: {
        connectionId: "Connection id for a terminal-note resource link",
        actorTileId: "(optional) Acting terminal tile id",
        body: "Text to append",
      },
    },
  );

  registerMethod(
    "canvas.browserNavigate",
    async (params) => {
      const p = params as {
        connectionId: string;
        actorTileId?: string;
        url: string;
      };
      const snapshot = await getShellSnapshot();
      const { resourceTile } = resolveConnectedResource(
        snapshot,
        p.connectionId,
        p.actorTileId,
        "browser",
      );
      return callCanvasShell("canvas.browserNavigate", {
        tileId: resourceTile.id,
        url: p.url,
      });
    },
    {
      description: "Navigate a connected browser resource tile",
      params: {
        connectionId: "Connection id for a terminal-browser resource link",
        actorTileId: "(optional) Acting terminal tile id",
        url: "Target URL",
      },
    },
  );

  registerMethod(
    "canvas.browserInfo",
    async (params) => {
      const p = params as {
        connectionId: string;
        actorTileId?: string;
      };
      const snapshot = await getShellSnapshot();
      const { resourceTile } = resolveConnectedResource(
        snapshot,
        p.connectionId,
        p.actorTileId,
        "browser",
      );
      return callCanvasShell("canvas.browserInfo", {
        tileId: resourceTile.id,
      });
    },
    {
      description: "Get URL/title/loading info for a connected browser resource tile",
      params: {
        connectionId: "Connection id for a terminal-browser resource link",
        actorTileId: "(optional) Acting terminal tile id",
      },
    },
  );

  registerMethod(
    "canvas.browserSnapshot",
    async (params) => {
      const p = params as {
        connectionId: string;
        actorTileId?: string;
      };
      const snapshot = await getShellSnapshot();
      const { resourceTile } = resolveConnectedResource(
        snapshot,
        p.connectionId,
        p.actorTileId,
        "browser",
      );
      return callCanvasShell("canvas.browserSnapshot", {
        tileId: resourceTile.id,
      });
    },
    {
      description: "Capture a connected browser resource tile as a data URL snapshot",
      params: {
        connectionId: "Connection id for a terminal-browser resource link",
        actorTileId: "(optional) Acting terminal tile id",
      },
    },
  );

  registerMethod(
    "canvas.stringCreate",
    async (params) => {
      return sendToShell("canvas.stringCreate", params) as Promise<{
        stringId: string;
        sourceSessionId: string;
        targetSessionId: string;
      }>;
    },
    {
      description:
        "Create a string (pipe) between two terminal tiles. " +
        "Output from the source tile flows into the target tile.",
      params: {
        sourceTileId: "ID of the source terminal tile",
        targetTileId: "ID of the target terminal tile",
        mode:
          '(optional) String mode: "generic" (default) or "baton" for exact-once framed handoffs',
        filter:
          '(optional) Filter mode: "none", "ansi-strip", or "framed" (default for generic; baton is always framed)',
        triggerPattern:
          "(optional) Regex pattern — string only activates when source output matches",
      },
    },
  );

  registerMethod(
    "canvas.stringCreateBaton",
    async (params) => {
      return sendToShell("canvas.stringCreate", {
        ...params,
        mode: "baton",
        filter: "framed",
      }) as Promise<{
        stringId: string;
        sourceSessionId: string;
        targetSessionId: string;
      }>;
    },
    {
      description:
        "Create a baton string between two terminal tiles. Baton mode is a framed, PTY-only handoff path with bounded duplicate suppression and delivery telemetry.",
      params: {
        sourceTileId: "ID of the source terminal tile",
        targetTileId: "ID of the target terminal tile",
        triggerPattern:
          "(optional) Regex pattern - baton only activates when source output matches",
      },
    },
  );

  registerMethod(
    "canvas.stringRemove",
    async (params) => {
      return sendToShell("canvas.stringRemove", params);
    },
    {
      description: "Remove a string (pipe) between two terminal tiles",
      params: { stringId: "ID of the string to remove" },
    },
  );

  registerMethod(
    "canvas.stringList",
    async () => {
      const links = listStringLinks();
      return { strings: links };
    },
    {
      description: "List all active string links with their runtime state and baton telemetry",
      params: {},
    },
  );

  registerMethod(
    "canvas.stringToggle",
    async (params) => {
      const p = params as { stringId: string };
      await sendToShell("canvas.stringToggle", params);
      const link = listStringLinks().find((l) => l.id === p.stringId);
      return { stringId: p.stringId, active: link?.active ?? false };
    },
    {
      description: "Pause or resume a string (pipe)",
      params: { stringId: "ID of the string to toggle" },
    },
  );

  registerMethod(
    "canvas.stringActivity",
    async (params) => {
      const p = params as { stringId: string; sinceSec?: number };
      return getStringActivity(p.stringId, p.sinceSec ?? 30);
    },
    {
      description:
        "Get activity stats for a string (events, bytes, and baton delivery telemetry in the last N seconds)",
      params: {
        stringId: "ID of the string",
        sinceSec: "(optional) Seconds to look back (default 30)",
      },
    },
  );
}

export function callCanvasShell<T = unknown>(
  method: string,
  params: unknown = {},
): Promise<T> {
  return sendToShell(method, params) as Promise<T>;
}

type SnapshotTile = {
  id: string;
  type: string;
  label?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  ptySessionId?: string | null;
  cwd?: string | null;
  filePath?: string | null;
  url?: string | null;
};

type SnapshotConnection = {
  id: string;
  sourceId: string;
  targetId: string;
  transport: "agent-channel" | "pty-baton" | "pty-generic";
  endpointKind: "agent" | "note" | "browser";
  active: boolean;
  clientRequestId?: string;
  lastError?: string | null;
  lastErrorAt?: number | null;
};

type CanvasSnapshot = {
  revision: number;
  tiles: SnapshotTile[];
  connections: SnapshotConnection[];
};

async function getShellSnapshot(): Promise<CanvasSnapshot> {
  return callCanvasShell<CanvasSnapshot>("canvas.snapshot", {});
}

async function writeTerminalTile(tileId: string, input: string): Promise<void> {
  await callCanvasShell("canvas.terminalWrite", { tileId, input });
}

function findTile(snapshot: CanvasSnapshot, tileId: string): SnapshotTile {
  const tile = snapshot.tiles.find((entry) => entry.id === tileId);
  if (!tile) {
    throw new RpcError(
      "TILE_NOT_FOUND",
      `Tile not found: ${tileId}`,
      { tileId },
    );
  }
  return tile;
}

function findConnection(
  snapshot: CanvasSnapshot,
  connectionId: string,
): SnapshotConnection {
  const connection = snapshot.connections.find((entry) => entry.id === connectionId);
  if (!connection) {
    throw new RpcError(
      "CONNECTION_NOT_FOUND",
      `Connection not found: ${connectionId}`,
      { connectionId },
    );
  }
  return connection;
}

function resolveConnectedResource(
  snapshot: CanvasSnapshot,
  connectionId: string,
  actorTileId: string | undefined,
  endpointKind: "note" | "browser",
): {
  connection: SnapshotConnection;
  actorTile: SnapshotTile;
  resourceTile: SnapshotTile;
} {
  const connection = findConnection(snapshot, connectionId);
  if (!connection.active) {
    throw new RpcError(
      "TARGET_BUSY",
      `Connection ${connectionId} is inactive`,
      { connectionId },
    );
  }
  if (connection.endpointKind !== endpointKind) {
    throw new RpcError(
      "INVALID_ENDPOINT_KIND",
      `Connection ${connectionId} is not a ${endpointKind} resource link`,
      { connectionId, endpointKind: connection.endpointKind },
    );
  }
  const actingTileId = actorTileId ?? connection.sourceId;
  const actorTile = findTile(snapshot, actingTileId);
  const actorIsSource = connection.sourceId === actorTile.id;
  const actorIsTarget = connection.targetId === actorTile.id;
  if (!actorIsSource && !actorIsTarget) {
    throw new RpcError(
      "PERMISSION_DENIED",
      `Tile ${actorTile.id} is not part of connection ${connectionId}`,
      { connectionId, tileId: actorTile.id },
    );
  }
  const resourceTileId = actorIsSource ? connection.targetId : connection.sourceId;
  const resourceTile = findTile(snapshot, resourceTileId);
  if (
    (endpointKind === "browser" && resourceTile.type !== "browser")
    || (
      endpointKind === "note"
      && resourceTile.type !== "note"
      && resourceTile.type !== "code"
    )
  ) {
    throw new RpcError(
      "INVALID_ENDPOINT_KIND",
      `Connection ${connectionId} does not terminate in a ${endpointKind} tile`,
      { connectionId, tileId: resourceTile.id, tileType: resourceTile.type },
    );
  }
  return { connection, actorTile, resourceTile };
}
