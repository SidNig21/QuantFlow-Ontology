/**
 * Kernel IPC for canvas connections (WO-g5).
 * Writes only through kernelExecute → execute(); never canvas-persistence.
 */
import { randomUUID } from "node:crypto";
import { ipcMain, type IpcMainInvokeEvent } from "electron";
import {
  kernelExecute,
  kernelGetObject,
  kernelQueryObjects,
  type TraceContext,
} from "./kernel";
import { isTrustedSender } from "./trusted-sender";
import { webContents } from "electron";

const VIEW_KIND = "view";
const PORT_REF_RE = /^[^:]+:[nesw]$/;

function newTrace(): TraceContext {
  return { trace_id: randomUUID(), span_id: randomUUID() };
}

function knownWebContentsIds(): Set<number> {
  return new Set(webContents.getAllWebContents().map((wc) => wc.id));
}

function assertTrusted(event: IpcMainInvokeEvent): void {
  if (!isTrustedSender(event.sender.id, knownWebContentsIds())) {
    throw new Error("qf:connections rejected — untrusted sender");
  }
}

function parseTileId(portRef: string): string {
  const colon = portRef.lastIndexOf(":");
  return colon === -1 ? portRef : portRef.slice(0, colon);
}

export type ConnectionRow = {
  id: string;
  created_at: string;
  kind: string;
  from_ref: string;
  to_ref: string;
};

/** List connections that touch any of the given tile ids (or all when empty). */
export function listConnectionsForTiles(tileIds: string[]): ConnectionRow[] {
  const rows = kernelQueryObjects("connection", undefined, null) as ConnectionRow[];
  if (!tileIds.length) return rows;
  const set = new Set(tileIds);
  return rows.filter((row) => {
    return set.has(parseTileId(row.from_ref)) || set.has(parseTileId(row.to_ref));
  });
}

/** Pure filter used by orphan cascade (unit-tested in cable-orphan.test.ts). */
export function connectionsTouchingTile(
  rows: ConnectionRow[],
  tileId: string,
): ConnectionRow[] {
  return rows.filter(
    (row) =>
      parseTileId(row.from_ref) === tileId || parseTileId(row.to_ref) === tileId,
  );
}

export function createViewConnection(input: {
  from: string;
  to: string;
  kind?: string;
  connectionId?: string;
  canvasTileIds: string[];
}): ConnectionRow {
  const kind = input.kind ?? VIEW_KIND;
  if (kind !== VIEW_KIND) {
    throw new Error("qf:connections:create allows kind=view only in WO-g5");
  }
  if (!PORT_REF_RE.test(input.from) || !PORT_REF_RE.test(input.to)) {
    throw new Error("qf:connections:create requires from/to as tileId:n|e|s|w");
  }
  const fromTile = parseTileId(input.from);
  const toTile = parseTileId(input.to);
  if (fromTile === toTile) {
    throw new Error("qf:connections:create rejects self-loops");
  }
  const onCanvas = new Set(input.canvasTileIds);
  if (!onCanvas.has(fromTile) || !onCanvas.has(toTile)) {
    throw new Error(
      "qf:connections:create rejects edges whose tiles are not both on this canvas (cross-workspace / orphan forbid)",
    );
  }

  const connection_id = input.connectionId ?? randomUUID();
  kernelExecute(
    "create_connection",
    {
      connection_id,
      kind: VIEW_KIND,
      from_ref: input.from,
      to_ref: input.to,
    },
    newTrace(),
  );

  // getObject by primary key — NOT queryObjects({ id }). connection's declared
  // filter surface is kind/from_ref/to_ref only; filtering on id throws
  // "Unknown filter key for connection: id" AFTER the row is already written.
  // That abort meant the renderer never refreshed, so Kernel had the edge and
  // the overlay showed nothing (or a leftover drag preview).
  const row = kernelGetObject("connection", connection_id) as
    | ConnectionRow
    | null;
  if (!row) {
    throw new Error("qf:connections:create failed to read back row");
  }
  return row;
}

export function deleteConnectionById(id: string): { ok: true } {
  kernelExecute("delete_connection", { connection_id: id }, newTrace());
  return { ok: true };
}

/** Orphan cascade: delete every connection touching a tile. */
export function deleteConnectionsForTile(tileId: string): { deleted: string[] } {
  const rows = connectionsTouchingTile(
    kernelQueryObjects("connection", undefined, null) as ConnectionRow[],
    tileId,
  );
  const deleted: string[] = [];
  for (const row of rows) {
    kernelExecute(
      "delete_connection",
      { connection_id: row.id },
      newTrace(),
    );
    deleted.push(row.id);
  }
  return { deleted };
}

export function registerConnectionsHandlers(): void {
  ipcMain.handle(
    "qf:connections:list",
    (event, args: { tileIds?: string[] } = {}) => {
      assertTrusted(event);
      return listConnectionsForTiles(args.tileIds ?? []);
    },
  );

  ipcMain.handle(
    "qf:connections:create",
    (
      event,
      args: {
        from: string;
        to: string;
        kind?: string;
        connectionId?: string;
        canvasTileIds: string[];
      },
    ) => {
      assertTrusted(event);
      return createViewConnection(args);
    },
  );

  ipcMain.handle(
    "qf:connections:delete",
    (event, args: { id: string }) => {
      assertTrusted(event);
      if (!args?.id) throw new Error("qf:connections:delete requires id");
      return deleteConnectionById(args.id);
    },
  );

  ipcMain.handle(
    "qf:connections:deleteForTile",
    (event, args: { tileId: string }) => {
      assertTrusted(event);
      if (!args?.tileId) {
        throw new Error("qf:connections:deleteForTile requires tileId");
      }
      return deleteConnectionsForTile(args.tileId);
    },
  );
}
