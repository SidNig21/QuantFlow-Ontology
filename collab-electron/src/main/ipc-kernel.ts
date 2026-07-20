import {
  BrowserWindow,
  ipcMain,
  webContents,
  type IpcMainInvokeEvent,
} from "electron";
import {
  cancelAgentSession,
  closeAgentSessionRow,
  onSessionChunk,
  onSessionDone,
  spawnAgentSession,
} from "./agent-host";
import {
  kernelExecute,
  kernelListAgentDefinitions,
  kernelListAgentSessions,
  kernelListArtifacts,
} from "./kernel";
import { QF_EXECUTE_ALLOWLIST } from "./qf-execute-allowlist";
import { isTrustedSender } from "./trusted-sender";

export { QF_EXECUTE_ALLOWLIST };

function serializeError(err: unknown): { name: string; message: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message };
  }
  return { name: "Error", message: String(err) };
}

function knownWebContentsIds(): Set<number> {
  return new Set(webContents.getAllWebContents().map((wc) => wc.id));
}

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  if (!isTrustedSender(event.sender.id, knownWebContentsIds())) {
    throw new Error("qf: rejected — untrusted sender");
  }
}

function sendToShell(channel: string, ...args: unknown[]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  }
}

/** Push to every webContents (shell + tile webviews) — Law C ephemeral stream. */
function broadcast(channel: string, ...args: unknown[]): void {
  for (const wc of webContents.getAllWebContents()) {
    if (!wc.isDestroyed()) {
      wc.send(channel, ...args);
    }
  }
}

function invalidateDock(): void {
  broadcast("qf:dock:invalidate");
}

export function registerKernelHandlers(): void {
  onSessionChunk((sessionId, text) => {
    broadcast("qf:session:chunk", { sessionId, text });
  });
  onSessionDone((sessionId, info) => {
    broadcast("qf:session:done", { sessionId, ...info });
    invalidateDock();
    if (info.artifactId) {
      sendToShell(
        "shell:forward",
        "canvas",
        "create-artifact-tile",
        info.artifactId,
      );
    }
  });

  ipcMain.handle(
    "qf:execute",
    (event, args: {
      command: string;
      input: Record<string, unknown>;
      trace: { trace_id: string; span_id: string };
    }) => {
      try {
        assertTrustedSender(event);
        if (
          !(QF_EXECUTE_ALLOWLIST as readonly string[]).includes(args.command)
        ) {
          return {
            ok: false as const,
            error: {
              name: "CommandNotAllowlisted",
              message: `qf:execute rejects command "${args.command}"`,
            },
          };
        }
        return {
          ok: true as const,
          result: kernelExecute(args.command, args.input, args.trace),
        };
      } catch (err) {
        return { ok: false as const, error: serializeError(err) };
      }
    },
  );

  ipcMain.handle("qf:artifacts:list", (event) => {
    try {
      assertTrustedSender(event);
      return { ok: true as const, artifacts: kernelListArtifacts() };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:definitions:list", (event) => {
    try {
      assertTrustedSender(event);
      return { ok: true as const, definitions: kernelListAgentDefinitions() };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle(
    "qf:sessions:spawn",
    async (event, args?: { species?: string; prompt?: string }) => {
      try {
        assertTrustedSender(event);
        const species = args?.species;
        if (!species || typeof species !== "string") {
          return {
            ok: false as const,
            error: {
              name: "MissingSpecies",
              message: "qf:sessions:spawn requires args.species",
            },
          };
        }
        const prompt = args?.prompt ?? "uppercase quantflow";
        const result = await spawnAgentSession(species, prompt, {
          onStarted: (sessionId, sp) => {
            invalidateDock();
            sendToShell(
              "shell:forward",
              "canvas",
              "create-session-tile",
              sessionId,
              sp,
            );
          },
        });
        invalidateDock();
        return { ok: true as const, result };
      } catch (err) {
        return { ok: false as const, error: serializeError(err) };
      }
    },
  );

  ipcMain.handle(
    "qf:sessions:cancel",
    async (event, args: { sessionId: string }) => {
      try {
        assertTrustedSender(event);
        await cancelAgentSession(args.sessionId);
        invalidateDock();
        return { ok: true as const };
      } catch (err) {
        return { ok: false as const, error: serializeError(err) };
      }
    },
  );

  ipcMain.handle(
    "qf:sessions:close",
    (event, args: { sessionId: string }) => {
      try {
        assertTrustedSender(event);
        closeAgentSessionRow(args.sessionId);
        invalidateDock();
        return { ok: true as const };
      } catch (err) {
        return { ok: false as const, error: serializeError(err) };
      }
    },
  );

  ipcMain.handle("qf:sessions:list", (event) => {
    try {
      assertTrustedSender(event);
      return { ok: true as const, sessions: kernelListAgentSessions() };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });
}
