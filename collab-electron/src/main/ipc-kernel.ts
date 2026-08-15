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
import {
  createRegisteredElectronBus,
  getRegisteredBus,
  type PublishAndDeliverOpts,
} from "./a2a-bus";
import { spawnA2aFourSeats } from "./a2a-orchestra";
import { registerHostAcpPermissionHandlers } from "./host-acp-permission";
import {
  kernelExecute,
  kernelListAgentDefinitions,
  kernelListAgentSessions,
  kernelListArtifacts,
  kernelListEvents,
  kernelListResearchLedger,
  kernelListTaskSurface,
  kernelAssertSessionMayClose,
  kernelEnsureSampleResearchDataset,
  kernelOpenHypothesisForQuestion,
  kernelListTaskDelegations,
  onKernelEvents,
} from "./kernel";
import {
  getDockDefinitionAvailability,
  getHermesDockDiagnostic,
} from "./agent-host";
import { QF_EXECUTE_ALLOWLIST } from "./qf-execute-allowlist";
import { isTrustedSender } from "./trusted-sender";
import { parseDefinitionLaunchRequest } from "./definition-runtime";
import { buildMissionActivationInstruction } from "./mission-activation";
import { loadState as loadCanvasState } from "./canvas-persistence";

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

async function trustedActorForTile(tileId: unknown): Promise<string> {
  if (typeof tileId !== "string" || tileId.trim().length === 0) {
    throw new Error("Create Task requires the selected delegator tile");
  }
  const state = await loadCanvasState();
  const tile = state?.tiles.find((candidate) => candidate.id === tileId);
  const sessionId = tile?.sessionId;
  if (!sessionId) {
    throw new Error("Create Task requires a selected agent seat tile");
  }
  const session = kernelListAgentSessions().find((row) => row.id === sessionId);
  if (!session || session.status !== "running") {
    throw new Error("Create Task requires a running delegator seat");
  }
  const surfaceSession = kernelListTaskSurface().sessions.find((row) => row.id === sessionId);
  if (
    String(surfaceSession?.role ?? "").toLowerCase() !== "orchestrator" &&
    surfaceSession?.display_name !== "Orchestrator"
  ) {
    throw new Error("Create Task requires an Orchestrator seat");
  }
  return sessionId;
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

  ipcMain.handle(
    "qf:research:submitQuestion",
    async (event, args?: { question?: string; definitionId?: string; datasetId?: string }) => {
      try {
        assertTrustedSender(event);
        const question = args?.question;
        if (typeof question !== "string" || question.trim().length === 0) {
          throw new Error("submitQuestion requires non-empty question");
        }
        const text = question.trim();
        const missionId = `mission-${crypto.randomUUID()}`;
        const activationInstruction = buildMissionActivationInstruction(
          missionId,
          text,
        );
        kernelExecute(
          "create_mission",
          {
            mission_id: missionId,
            name: "Founder question",
            objective: text,
          },
          { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() },
        );
        const hypothesisId = kernelOpenHypothesisForQuestion(text, args?.datasetId);
        const definitionId =
          typeof args?.definitionId === "string" && args.definitionId.length > 0
            ? args.definitionId
            : process.env.QF_DOCK_QA_MODE === "1"
              ? "qf-proof-orchestrator"
              : "hermes-orchestrator";
        const result = await admitAndStartSession(definitionId, {
          missionActivation: activationInstruction,
          onStarted: (sessionId, sp, info) => {
            invalidateDock();
            sendToShell("shell:forward", "canvas", "sessions-changed");
            if (info?.surface === "native_tui" && info.ptySessionId) {
              sendToShell(
                "shell:forward",
                "canvas",
                "create-term-tile",
                info.ptySessionId,
                sessionId,
                sp,
                info.role,
              );
            }
          },
        });
        invalidateDock();
        return {
          ok: true as const,
          missionId,
          hypothesisId,
          sessionId: result.sessionId,
          objective: text,
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

  ipcMain.handle("qf:research:ledger", (event) => {
    try {
      assertTrustedSender(event);
      return { ok: true as const, entries: kernelListResearchLedger() };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:research:loadSampleDataset", (event) => {
    try {
      assertTrustedSender(event);
      return { ok: true as const, dataset: kernelEnsureSampleResearchDataset() };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:handoffs:list", (event) => {
    try {
      assertTrustedSender(event);
      return { ok: true as const, handoffs: kernelListTaskDelegations() };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:tasks:surface", (event) => {
    try {
      assertTrustedSender(event);
      return { ok: true as const, ...kernelListTaskSurface() };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:tasks:create", async (event, args?: unknown) => {
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) {
        throw new Error("Create Task requires title, description, and assignee");
      }
      const input = args as Record<string, unknown>;
      const actorSessionId = await trustedActorForTile(input.tileId);
      if (typeof input.title !== "string" || input.title.trim().length === 0) {
        throw new Error("Create Task requires a non-empty title");
      }
      if (typeof input.description !== "string" || input.description.trim().length === 0) {
        throw new Error("Create Task requires a non-empty completion description");
      }
      if (
        typeof input.assigneeSessionId !== "string" ||
        input.assigneeSessionId.trim().length === 0
      ) {
        throw new Error("Create Task requires a running assignee");
      }
      const result = kernelExecute(
        "create_task",
        {
          task_id: `task-${crypto.randomUUID()}`,
          title: input.title.trim(),
          description: input.description.trim(),
          assignee_session_id: input.assigneeSessionId.trim(),
        },
        {
          trace_id: crypto.randomUUID(),
          span_id: crypto.randomUUID(),
          actor_session_id: actorSessionId,
        },
      );
      invalidateDock();
      return { ok: true as const, result };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:tasks:reassign", (event, args?: unknown) => {
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) {
        throw new Error("Reassign requires task_id and assignee_session_id");
      }
      const input = args as Record<string, unknown>;
      const result = kernelExecute(
        "reassign_task",
        {
          task_id: input.taskId,
          assignee_session_id: input.assigneeSessionId,
        },
        { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() },
      );
      invalidateDock();
      return { ok: true as const, result };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:tasks:cancel", (event, args?: unknown) => {
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) {
        throw new Error("Cancel requires task_id");
      }
      const input = args as Record<string, unknown>;
      const result = kernelExecute(
        "cancel_task",
        { task_id: input.taskId },
        { trace_id: crypto.randomUUID(), span_id: crypto.randomUUID() },
      );
      invalidateDock();
      return { ok: true as const, result };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:definitions:list", (event) => {
    try {
      assertTrustedSender(event);
      const diagnostics = [];
      const hermesDiagnostic = getHermesDockDiagnostic();
      if (hermesDiagnostic) diagnostics.push(hermesDiagnostic);
      const definitions = kernelListAgentDefinitions().map((definition) => {
        const availability = getDockDefinitionAvailability(definition);
        let capabilityGroups: unknown = definition.capability_groups;
        if (typeof capabilityGroups === "string") {
          try {
            capabilityGroups = JSON.parse(capabilityGroups);
          } catch {
            capabilityGroups = [];
          }
        }
        const normalized = {
          ...definition,
          capability_groups: Array.isArray(capabilityGroups) ? capabilityGroups : [],
        };
        return availability ? { ...normalized, availability } : normalized;
      });
      return { ok: true as const, definitions, diagnostics };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  /** Dock / UI spawn: admit + start only — never prompts. */
  ipcMain.handle(
    "qf:sessions:spawn",
    async (event, args?: unknown) => {
      try {
        assertTrustedSender(event);
        const definitionId = parseDefinitionLaunchRequest(args);
        const result = await admitAndStartSession(definitionId, {
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
                info.role,
                sp.startsWith("qf-proof-")
                  ? "DETERMINISTIC PROOF AGENT"
                  : undefined,
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

  /** Cold/harness only — not product dock. Spawn 4 A2A seats without the paced movie. */
  ipcMain.handle("qf:a2a:spawnSeats", async (event) => {
    try {
      assertTrustedSender(event);
      const { busId, bus } = createRegisteredElectronBus();
      const seats = await spawnA2aFourSeats(bus, {
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
      invalidateDock();
      return { ok: true as const, busId, seats };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  /** WO-008e: one Kernel publish + host delivery to target seats. */
  ipcMain.handle(
    "qf:a2a:dispatch",
    (
      event,
      args?: PublishAndDeliverOpts & { busId?: string },
    ) => {
      try {
        assertTrustedSender(event);
        if (!args?.busId || typeof args.busId !== "string") {
          return {
            ok: false as const,
            error: {
              name: "InvalidArgs",
              message: "qf:a2a:dispatch requires busId:string",
            },
          };
        }
        if (!args.hop || !args.fromRole || !args.toRoles || !args.body) {
          return {
            ok: false as const,
            error: {
              name: "InvalidArgs",
              message:
                "qf:a2a:dispatch requires hop, fromRole, toRoles, body",
            },
          };
        }
        const bus = getRegisteredBus(args.busId);
        const { busId: _busId, ...opts } = args;
        const result = bus.publishAndDeliver(opts);
        return { ok: true as const, result };
      } catch (err) {
        return { ok: false as const, error: serializeError(err) };
      }
    },
  );

  ipcMain.handle(
    "qf:a2a:setDelivery",
    (event, args?: { busId?: string; enabled?: boolean }) => {
      try {
        assertTrustedSender(event);
        if (!args?.busId || typeof args.busId !== "string") {
          return {
            ok: false as const,
            error: {
              name: "InvalidArgs",
              message: "qf:a2a:setDelivery requires busId:string",
            },
          };
        }
        if (typeof args.enabled !== "boolean") {
          return {
            ok: false as const,
            error: {
              name: "InvalidArgs",
              message: "qf:a2a:setDelivery requires enabled:boolean",
            },
          };
        }
        getRegisteredBus(args.busId).setDeliveryEnabled(args.enabled);
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
        kernelAssertSessionMayClose(args.sessionId);
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

  ipcMain.handle(
    "qf:events:list",
    (event, args: { limit?: number } = {}) => {
      try {
        assertTrustedSender(event);
        return {
          ok: true as const,
          events: kernelListEvents(args?.limit ?? 40),
        };
      } catch (err) {
        return { ok: false as const, error: serializeError(err) };
      }
    },
  );

  onKernelEvents(() => {
    broadcast("qf:events:invalidate");
    sendToShell("shell:forward", "canvas", "handoffs-changed");
  });
}
