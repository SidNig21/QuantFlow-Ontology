import {
  BrowserWindow,
  ipcMain,
  webContents,
  type IpcMainInvokeEvent,
} from "electron";
import {
  admitAndStartSession,
  cancelAgentSession,
  closeAgentSessionRow,
  onSessionChunk,
  onSessionDone,
  runTurn,
} from "./agent-host";
import { setA2aDeliveryEnabled } from "./a2a-bus";
import {
  runA2aFourTileProof,
  spawnA2aFourSeats,
} from "./a2a-orchestra";
import { registerHostAcpPermissionHandlers } from "./host-acp-permission";
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
  registerHostAcpPermissionHandlers();
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

  /** Dock / UI spawn: admit + start only — never prompts. */
  ipcMain.handle(
    "qf:sessions:spawn",
    async (event, args?: { species?: string; prompt?: string; env?: unknown }) => {
      try {
        assertTrustedSender(event);
        if (args && "env" in args && args.env !== undefined) {
          return {
            ok: false as const,
            error: {
              name: "RendererEnvRejected",
              message:
                "qf:sessions:spawn rejects renderer-supplied env (species data / host only)",
            },
          };
        }
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
        // prompt ignored — connecting and speaking are different acts (WO-007b)
        void args?.prompt;
        const result = await admitAndStartSession(species, {
          onStarted: (sessionId, sp, info) => {
            invalidateDock();
            if (info?.surface === "native_tui" && info.ptySessionId) {
              sendToShell(
                "shell:forward",
                "canvas",
                "create-term-tile",
                info.ptySessionId,
                sessionId,
                sp,
              );
              return;
            }
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

  /** WO-008e: spawn 4 Hermes TUI seats + run Kernel-mediated A2A proof. */
  ipcMain.handle(
    "qf:a2a:runProof",
    async (event, args?: { cancelOne?: boolean }) => {
      try {
        assertTrustedSender(event);
        const seats = await spawnA2aFourSeats({
          onTile: (sessionId, sp, ptySessionId) => {
            invalidateDock();
            sendToShell(
              "shell:forward",
              "canvas",
              "create-term-tile",
              ptySessionId,
              sessionId,
              sp,
            );
          },
        });
        const proof = await runA2aFourTileProof({
          cancelOne: args?.cancelOne !== false,
        });
        invalidateDock();
        return { ok: true as const, seats, proof };
      } catch (err) {
        return { ok: false as const, error: serializeError(err) };
      }
    },
  );

  ipcMain.handle(
    "qf:a2a:setDelivery",
    (event, args?: { enabled?: boolean }) => {
      try {
        assertTrustedSender(event);
        if (typeof args?.enabled !== "boolean") {
          return {
            ok: false as const,
            error: {
              name: "InvalidArgs",
              message: "qf:a2a:setDelivery requires enabled:boolean",
            },
          };
        }
        setA2aDeliveryEnabled(args.enabled);
        return { ok: true as const, enabled: args.enabled };
      } catch (err) {
        return { ok: false as const, error: serializeError(err) };
      }
    },
  );

  ipcMain.handle(
    "qf:sessions:runTurn",
    async (
      event,
      args?: { sessionId?: string; prompt?: string; env?: unknown },
    ) => {
      try {
        assertTrustedSender(event);
        if (args && "env" in args && args.env !== undefined) {
          return {
            ok: false as const,
            error: {
              name: "RendererEnvRejected",
              message:
                "qf:sessions:runTurn rejects renderer-supplied env (species data / host only)",
            },
          };
        }
        const sessionId = args?.sessionId;
        if (!sessionId || typeof sessionId !== "string") {
          return {
            ok: false as const,
            error: {
              name: "MissingSessionId",
              message: "qf:sessions:runTurn requires args.sessionId",
            },
          };
        }
        const prompt =
          typeof args?.prompt === "string" && args.prompt.length > 0
            ? args.prompt
            : "uppercase quantflow";
        const result = await runTurn(sessionId, prompt);
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
