/**
 * Founder-visible ACP permission bridge (WO-008a).
 * Broadcasts to session tiles; default deny on timeout / missing decision.
 * No direct ACP SDK import — types flow through host-acp-bridge.
 */
import { ipcMain, webContents, type IpcMainInvokeEvent } from "electron";
import {
  denyPermissionResponse,
  permissionResponseForDecision,
  type PermissionDecision,
} from "./host-acp-bridge";
import { isTrustedSender } from "./trusted-sender";

type PermissionParams = Parameters<typeof denyPermissionResponse>[0];
type PermissionResponse = ReturnType<typeof denyPermissionResponse>;

type Pending = {
  params: PermissionParams;
  resolve: (response: PermissionResponse) => void;
  timer: ReturnType<typeof setTimeout>;
};

const pending = new Map<string, Pending>();
let handlersRegistered = false;

function knownWebContentsIds(): Set<number> {
  return new Set(webContents.getAllWebContents().map((wc) => wc.id));
}

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  if (!isTrustedSender(event.sender.id, knownWebContentsIds())) {
    throw new Error("qf: rejected — untrusted sender");
  }
}

function broadcast(channel: string, ...args: unknown[]): void {
  for (const wc of webContents.getAllWebContents()) {
    if (!wc.isDestroyed()) {
      wc.send(channel, ...args);
    }
  }
}

function isDecision(value: unknown): value is PermissionDecision {
  return (
    value === "allow_once" || value === "allow_always" || value === "deny"
  );
}

export function registerHostAcpPermissionHandlers(): void {
  if (handlersRegistered) return;
  handlersRegistered = true;

  ipcMain.handle(
    "qf:sessions:permissionDecision",
    (event, args?: { requestId?: string; decision?: unknown }) => {
      try {
        assertTrustedSender(event);
        const requestId = args?.requestId;
        if (!requestId || typeof requestId !== "string") {
          return {
            ok: false as const,
            error: {
              name: "MissingRequestId",
              message: "qf:sessions:permissionDecision requires requestId",
            },
          };
        }
        if (!isDecision(args?.decision)) {
          return {
            ok: false as const,
            error: {
              name: "InvalidDecision",
              message: "decision must be allow_once | allow_always | deny",
            },
          };
        }
        const entry = pending.get(requestId);
        if (!entry) {
          return {
            ok: false as const,
            error: {
              name: "UnknownRequest",
              message: `no pending permission request ${requestId}`,
            },
          };
        }
        clearTimeout(entry.timer);
        pending.delete(requestId);
        const response =
          args.decision === "deny"
            ? denyPermissionResponse(entry.params)
            : permissionResponseForDecision(entry.params, args.decision);
        entry.resolve(response);
        return { ok: true as const };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          ok: false as const,
          error: { name: "Error", message },
        };
      }
    },
  );
}

/**
 * Pause for founder decision via session tile. Timeout → deny.
 * Safe when no tile is listening (timeout path).
 */
export function requestFounderPermission(
  sessionId: string,
  params: PermissionParams,
  timeoutMs = 30_000,
): Promise<PermissionResponse> {
  const requestId = crypto.randomUUID();
  const toolTitle =
    typeof params.toolCall.title === "string"
      ? params.toolCall.title
      : params.toolCall.toolCallId;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      console.log(
        `host-acp-permission: timeout → deny session=${sessionId} tool=${toolTitle}`,
      );
      resolve(denyPermissionResponse(params));
    }, timeoutMs);

    pending.set(requestId, { params, resolve, timer });

    broadcast("qf:session:permission", {
      requestId,
      sessionId,
      toolCall: {
        toolCallId: params.toolCall.toolCallId,
        title: params.toolCall.title ?? null,
        kind: params.toolCall.kind ?? null,
      },
      options: params.options.map((o) => ({
        optionId: o.optionId,
        kind: o.kind,
        name: o.name,
      })),
    });
    console.log(
      `host-acp-permission: waiting founder session=${sessionId} request=${requestId} tool=${toolTitle}`,
    );
  });
}

/** Cancel outstanding permission waits (session teardown). */
export function cancelPendingPermissions(sessionId: string): void {
  for (const [id, entry] of pending) {
    if (entry.params.sessionId !== sessionId) continue;
    clearTimeout(entry.timer);
    pending.delete(id);
    entry.resolve(denyPermissionResponse(entry.params));
  }
}
