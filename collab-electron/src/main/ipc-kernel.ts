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
  deliverToAgentSession,
  hasLiveAgentSession,
  onSessionChunk,
  onSessionDone,
  runTurn,
} from "./agent-host";
import { registerHostAcpPermissionHandlers } from "./host-acp-permission";
import {
  kernelExecute,
  kernelListAgentDefinitions,
  kernelListAgentSessions,
  kernelListArtifacts,
  kernelListEvents,
  kernelListResearchLedger,
  kernelFindOpenSecondOpinion,
  kernelListTaskSurface,
  kernelAssertSessionMayClose,
  kernelGetObject,
  kernelGetLinks,
  kernelEnsureSampleResearchDataset,
  kernelOpenHypothesisForQuestion,
  kernelListTaskDelegations,
  onKernelEvents,
  kernelFreezeSourceWork,
  kernelRequestGovernedReview,
  kernelMarkGovernedDelivery,
  kernelRequestRevision,
  kernelRequestSecondCritic,
  kernelGovernedReviewProjection,
  kernelGovernedAttemptExists,
  kernelGetResearchWorldProjection,
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
import { resolveSecondOpinionAdmission } from "./second-opinion-admission";
import { bindMissionToDirectorSession } from "./mission-context";
import { bindResearchHypothesis } from "./research-context";

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

const governedReviewInFlight = new Map<string, Promise<unknown>>();

type TaskActionName = "clarify" | "redirect" | "reassign" | "cancel" | "second_opinion";
type TaskRefusalCode =
  | "TASK_NOT_FOUND" | "TASK_NOT_OPEN" | "ACTOR_NOT_DELEGATOR" | "ASSIGNMENT_CARDINALITY"
  | "ASSIGNEE_NOT_RUNNING" | "INSTRUCTION_EMPTY" | "INSTRUCTION_TOO_LARGE"
  | "INSTRUCTION_CONTROL_BYTES" | "REASSIGN_NOOP" | "REASSIGN_TARGET_NOT_RUNNING"
  | "CRITIC_DEFINITION_UNAVAILABLE" | "CRITIC_SESSION_AMBIGUOUS"
  | "SECOND_OPINION_ALREADY_OPEN" | "CANCEL_ALREADY_FINAL";

function trace(actorSessionId?: string): { trace_id: string; span_id: string; actor_session_id?: string } {
  return {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
    ...(actorSessionId ? { actor_session_id: actorSessionId } : {}),
  };
}

function directorForTask(taskId: string): string | null {
  const links = kernelGetLinks(taskId, { kind: "delegated_by" }).filter((link) => link.from_id === taskId);
  return links.length === 1 && links[0]?.to_id ? links[0].to_id : null;
}

function refusalCode(error: unknown, action: TaskActionName): TaskRefusalCode {
  const code = (error as { code?: unknown })?.code;
  if (typeof code === "string") return code as TaskRefusalCode;
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("More than one idle production Critic")) return "CRITIC_SESSION_AMBIGUOUS";
  if (message.includes("second-opinion Task is already open")) return "SECOND_OPINION_ALREADY_OPEN";
  if (message.includes("not found")) return "TASK_NOT_FOUND";
  if (message.includes("cancelled")) return action === "cancel" ? "CANCEL_ALREADY_FINAL" : "TASK_NOT_OPEN";
  if (message.includes("not open") || message.includes("Illegal transition")) return "TASK_NOT_OPEN";
  if (message.includes("assignment") || message.includes("assigned")) return "ASSIGNMENT_CARDINALITY";
  if (message.includes("different")) return "REASSIGN_NOOP";
  if (message.includes("running")) return action === "reassign" ? "REASSIGN_TARGET_NOT_RUNNING" : "ASSIGNEE_NOT_RUNNING";
  if (message.includes("critic")) return "CRITIC_DEFINITION_UNAVAILABLE";
  return action === "reassign" ? "REASSIGN_TARGET_NOT_RUNNING" : "TASK_NOT_FOUND";
}

function recordRefusal(
  action: TaskActionName,
  taskId: string | null,
  error: unknown,
  actorSessionId?: string,
  attemptId = crypto.randomUUID(),
): { attempt_id: string; code: TaskRefusalCode; message: string } {
  const code = refusalCode(error, action);
  if (process.env.QF_FOUNDER_STEERING_FALSIFY === "refusal_not_kernel_backed") {
    return { attempt_id: attemptId, code, message: error instanceof Error ? error.message : String(error) };
  }
  const result = kernelExecute(
    "record_task_steering_refusal",
    { attempt_id: attemptId, attempted_action: action, task_id: taskId, reason_code: code },
    trace(actorSessionId),
  ) as { message?: string };
  return { attempt_id: attemptId, code, message: result.message ?? (error instanceof Error ? error.message : String(error)) };
}

function deliveryEnvelope(taskId: string, mode: "clarify" | "redirect", instruction: string): string {
  return `${JSON.stringify({ contract: "qf.task.steering.v1", task_id: taskId, mode, instruction })}\r`;
}

function assignmentEnvelope(taskId: string, title: string, instruction: string): string {
  return `${JSON.stringify({ contract: "qf.task.assignment.v1", task_id: taskId, title, instruction })}\r`;
}

async function deliverAccepted(
  acceptedEventId: string,
  targetSessionId: string,
  envelope: string,
  actorSessionId?: string,
): Promise<boolean> {
  const delivered = deliverToAgentSession(targetSessionId, envelope);
  kernelExecute(
    "record_task_steering_delivery",
    { accepted_event_id: acceptedEventId, outcome: delivered ? "delivered" : "delivery_failed" },
    trace(actorSessionId),
  );
  return delivered;
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
        if (process.env.QF_UI_PROOF === "1") {
          console.info("qf-ui-proof main_ipc=qf:research:submitQuestion");
        }
        const question = args?.question;
        if (typeof question !== "string" || question.trim().length === 0) {
          throw new Error("submitQuestion requires non-empty question");
        }
        const text = question.trim();
        const missionId = `mission-${crypto.randomUUID()}`;
        const definitionId =
          typeof args?.definitionId === "string" && args.definitionId.length > 0
            ? args.definitionId
            : process.env.QF_DOCK_QA_MODE === "1"
              ? "qf-proof-orchestrator"
              : "hermes-research-director";
        const activationInstruction = buildMissionActivationInstruction(
          missionId,
          text,
          definitionId === "hermes-research-director" ? "research-director" : "orchestrator",
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
        if (process.env.QF_UI_PROOF === "1") {
          console.info("qf-ui-proof kernel_command=create_mission");
        }
        const hypothesisId = kernelOpenHypothesisForQuestion(text, args?.datasetId);
        const result = await admitAndStartSession(definitionId, {
          missionActivation: activationInstruction,
          beforeActivation: (sessionId) => bindMissionToDirectorSession(missionId, sessionId),
          onStarted: (sessionId, sp, info) => {
            invalidateDock();
            sendToShell("shell:forward", "canvas", "sessions-changed");
            if (info?.surface === "native_tui" && info.ptySessionId) {
              if (process.env.QF_UI_PROOF === "1" && sp === "hermes-research-director") {
                console.info("qf-ui-proof tile_event_sent=create-term-tile");
              }
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
                  : String(kernelGetObject("agent_definition", sp)?.display_name ?? sp),
              );
            }
          },
        });
        bindResearchHypothesis(result.sessionId, hypothesisId);
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

  ipcMain.handle("qf:research-world:projection", (event, args?: unknown) => {
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) {
        return { ok: false as const, code: "WORLD_ROOT_INELIGIBLE" as const, message: "Research world root must be an object." };
      }
      const input = args as Record<string, unknown>;
      const unexpected = Object.keys(input).filter((key) => key !== "root_type" && key !== "root_id");
      if (unexpected.length > 0 || (input.root_type !== "mission" && input.root_type !== "task") || typeof input.root_id !== "string") {
        return { ok: false as const, code: "WORLD_ROOT_INELIGIBLE" as const, message: "Research world root must contain exactly root_type and root_id." };
      }
      return kernelGetResearchWorldProjection({
        root_type: input.root_type,
        root_id: input.root_id,
      });
    } catch (err) {
      return { ok: false as const, code: "WORLD_ROOT_INELIGIBLE" as const, message: serializeError(err).message };
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

  ipcMain.handle("qf:review:projection", (event, args?: unknown) => {
    try {
      assertTrustedSender(event);
      const sourceTaskId = args && typeof args === "object" && !Array.isArray(args)
        ? String((args as Record<string, unknown>).sourceTaskId ?? "") : "";
      if (!sourceTaskId) throw new Error("Review projection requires sourceTaskId");
      return { ok: true as const, projection: kernelGovernedReviewProjection(sourceTaskId) };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:review:request", async (event, args?: unknown) => {
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Request review requires sourceTaskId and attemptId");
      const input = args as Record<string, unknown>;
      const sourceTaskId = typeof input.sourceTaskId === "string" ? input.sourceTaskId : "";
      const attemptId = typeof input.attemptId === "string" ? input.attemptId : "";
      if (!sourceTaskId || !attemptId) throw new Error("Request review requires sourceTaskId and attemptId");
      const key = `request_review\0${sourceTaskId}\0${attemptId}`;
      if (kernelGovernedAttemptExists("request_review", sourceTaskId, attemptId)) {
        return { ok: true as const, result: kernelRequestGovernedReview(sourceTaskId, attemptId, null) };
      }
      const inFlight = governedReviewInFlight.get(key);
      if (inFlight) return await inFlight as { ok: true; result: unknown };
      const operation = (async () => {
      // Freeze/validate before any critic admission. Invalid source work therefore
      // produces only the Kernel refusal receipt and no runtime child.
      let valid = true;
      try { kernelFreezeSourceWork(sourceTaskId); } catch { valid = false; }
      let criticSessionId: string | null = null;
      if (valid) {
        const admitted = await admitAndStartSession("hermes-critic");
        criticSessionId = admitted.sessionId;
      }
      const result = kernelRequestGovernedReview(sourceTaskId, attemptId, criticSessionId);
      if (result.kind === "admitted" && result.review_task_id && result.critic_session_id) {
        const delivered = deliverToAgentSession(result.critic_session_id, `${JSON.stringify({ contract: "qf.governed_review.v1", review_task_id: result.review_task_id, source_work: result.source_work })}\r`);
        kernelMarkGovernedDelivery(result.review_task_id, delivered ? "delivered" : "failed");
      }
      invalidateDock();
      return { ok: true as const, result };
      })();
      governedReviewInFlight.set(key, operation);
      try { return await operation; } finally { governedReviewInFlight.delete(key); }
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:review:revision", (event, args?: unknown) => {
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Request revision requires sourceTaskId, evaluationId, and attemptId");
      const input = args as Record<string, unknown>;
      const sourceTaskId = String(input.sourceTaskId ?? "");
      const evaluationId = String(input.evaluationId ?? "");
      const attemptId = String(input.attemptId ?? "");
      const work = kernelFreezeSourceWork(sourceTaskId);
      const result = kernelRequestRevision(work, evaluationId, attemptId);
      invalidateDock();
      return { ok: true as const, result };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:review:secondCritic", async (event, args?: unknown) => {
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Second critic requires sourceTaskId, evaluationId, and attemptId");
      const input = args as Record<string, unknown>;
      const sourceTaskId = String(input.sourceTaskId ?? "");
      const evaluationId = String(input.evaluationId ?? "");
      const attemptId = String(input.attemptId ?? "");
      const work = kernelFreezeSourceWork(sourceTaskId);
      if (kernelGovernedAttemptExists("second_critic", sourceTaskId, attemptId)) {
        return { ok: true as const, result: kernelRequestSecondCritic(work, evaluationId, attemptId, null) };
      }
      const admitted = await admitAndStartSession("hermes-critic");
      const result = kernelRequestSecondCritic(work, evaluationId, attemptId, admitted.sessionId);
      if (result.kind === "admitted" && result.review_task_id && result.critic_session_id) {
        const delivered = deliverToAgentSession(result.critic_session_id, `${JSON.stringify({ contract: "qf.governed_review.v1", review_task_id: result.review_task_id, source_work: result.source_work })}\r`);
        kernelMarkGovernedDelivery(result.review_task_id, delivered ? "delivered" : "failed");
      }
      invalidateDock();
      return { ok: true as const, result };
    } catch (err) {
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:tasks:create", async (event, args?: unknown) => {
    try {
      if (process.env.QF_UI_PROOF === "1") {
        console.log("qf-ui-proof main_ipc=qf:tasks:create");
      }
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

  ipcMain.handle("qf:tasks:reassign", async (event, args?: unknown) => {
    const attemptId = crypto.randomUUID();
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) {
        throw new Error("Reassign requires task_id and assignee_session_id");
      }
      const input = args as Record<string, unknown>;
      const actorSessionId = directorForTask(String(input.taskId ?? ""));
      const result = kernelExecute(
        "reassign_task",
        {
          task_id: input.taskId,
          assignee_session_id: input.assigneeSessionId,
        },
        trace(actorSessionId ?? undefined),
      );
      const accepted = result as unknown as { accepted_event_id?: string; assignee_session_id?: string; previous_assignee_session_id?: string; state?: Record<string, unknown> };
      if (!accepted.accepted_event_id || !accepted.assignee_session_id) throw new Error("reassign did not return captured assignee");
      await deliverAccepted(
        accepted.accepted_event_id,
        process.env.QF_FOUNDER_STEERING_FALSIFY === "reassign_delivered_to_old_session" && accepted.previous_assignee_session_id
          ? accepted.previous_assignee_session_id
          : accepted.assignee_session_id,
        assignmentEnvelope(String(input.taskId), String(accepted.state?.title ?? ""), String(accepted.state?.description ?? "")),
        actorSessionId ?? undefined,
      );
      invalidateDock();
      return { ok: true as const, result };
    } catch (err) {
      const input = args && typeof args === "object" && !Array.isArray(args) ? args as Record<string, unknown> : {};
      const taskId = typeof input.taskId === "string" ? input.taskId : null;
      recordRefusal("reassign", taskId, err, taskId ? directorForTask(taskId) ?? undefined : undefined, attemptId);
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:tasks:cancel", async (event, args?: unknown) => {
    const attemptId = crypto.randomUUID();
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) {
        throw new Error("Cancel requires task_id");
      }
      const input = args as Record<string, unknown>;
      const taskId = String(input.taskId ?? "");
      const actorSessionId = directorForTask(taskId);
      const result = kernelExecute(
        "cancel_task",
        { task_id: taskId },
        trace(actorSessionId ?? undefined),
      );
      const accepted = result as unknown as { accepted_event_id?: string; assignee_session_id?: string };
      if (!accepted.accepted_event_id || !accepted.assignee_session_id) throw new Error("cancel did not return captured assignee");
      const wasLive = hasLiveAgentSession(accepted.assignee_session_id);
      if (wasLive && process.env.QF_FOUNDER_STEERING_FALSIFY !== "cancel_left_runtime_working") await cancelAgentSession(accepted.assignee_session_id);
      const session = kernelGetObject("agent_session", accepted.assignee_session_id);
      const outcome = wasLive
        ? "runtime_stopped"
        : session && ["closed", "cancelled", "failed"].includes(String(session.status))
          ? "already_stopped"
          : "stop_failed";
      kernelExecute(
        "record_task_cancel_outcome",
        { accepted_event_id: accepted.accepted_event_id, outcome, error_class: outcome === "stop_failed" ? "runtime_state_mismatch" : null },
        trace(actorSessionId ?? undefined),
      );
      invalidateDock();
      return { ok: true as const, result };
    } catch (err) {
      const input = args && typeof args === "object" && !Array.isArray(args) ? args as Record<string, unknown> : {};
      const taskId = typeof input.taskId === "string" ? input.taskId : null;
      recordRefusal("cancel", taskId, err, taskId ? directorForTask(taskId) ?? undefined : undefined, attemptId);
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:tasks:steer", async (event, args?: unknown) => {
    const attemptId = crypto.randomUUID();
    let action: TaskActionName = "clarify";
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Steering requires task_id, mode, and instruction");
      const input = args as Record<string, unknown>;
      const taskId = input.taskId;
      const mode = input.mode;
      action = mode === "redirect" ? "redirect" : "clarify";
      if (typeof taskId !== "string" || (mode !== "clarify" && mode !== "redirect") || typeof input.instruction !== "string") throw new Error("Steering requires task_id, mode, and instruction");
      const actorSessionId = directorForTask(taskId);
      const command = mode === "clarify" ? "clarify_task" : "redirect_task";
      const result = kernelExecute(command, { task_id: taskId, instruction: input.instruction }, trace(actorSessionId ?? undefined));
      const accepted = result as unknown as { accepted_event_id?: string; assignee_session_id?: string; instruction?: string };
      if (!accepted.accepted_event_id || !accepted.assignee_session_id || typeof accepted.instruction !== "string") throw new Error("steering did not return captured delivery fields");
      await deliverAccepted(accepted.accepted_event_id, accepted.assignee_session_id, deliveryEnvelope(taskId, mode, accepted.instruction), actorSessionId ?? undefined);
      invalidateDock();
      return { ok: true as const, result };
    } catch (err) {
      const input = args && typeof args === "object" && !Array.isArray(args) ? args as Record<string, unknown> : {};
      const taskId = typeof input.taskId === "string" ? input.taskId : null;
      recordRefusal(action, taskId, err, taskId ? directorForTask(taskId) ?? undefined : undefined, attemptId);
      return { ok: false as const, error: serializeError(err) };
    }
  });

  ipcMain.handle("qf:tasks:secondOpinion", async (event, args?: unknown) => {
    const attemptId = crypto.randomUUID();
    try {
      assertTrustedSender(event);
      if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Second opinion requires task_id");
      const input = args as Record<string, unknown>;
      const taskId = input.taskId;
      if (typeof taskId !== "string") throw new Error("Second opinion requires task_id");
      const actorSessionId = directorForTask(taskId);
      const admission = await resolveSecondOpinionAdmission(
        () => kernelFindOpenSecondOpinion(taskId),
        async () => {
          const defs = kernelListAgentDefinitions().filter((definition) => String(definition.id ?? "") === "hermes-critic");
          if (process.env.QF_DOCK_QA_MODE === "1" || defs.length !== 1) throw new Error("The production Critic is unavailable.");
          const availability = getDockDefinitionAvailability(defs[0]!);
          if (!availability.available) throw new Error("The production Critic is unavailable.");
          const idle = kernelListAgentSessions().filter((session) => {
            if (session.status !== "running" || !session.id) return false;
            const spawned = kernelGetLinks(String(session.id), { kind: "spawned_from" }).filter((link) => link.from_id === session.id);
            const openTasks = kernelGetLinks(String(session.id), { kind: "assigned_to" }).filter((link) => link.to_id === session.id);
            return spawned.length === 1 && spawned[0]!.to_id === "hermes-critic" && openTasks.every((link) => kernelGetObject("task", link.from_id)?.status !== "open");
          });
          if (idle.length > 1) throw new Error("More than one idle production Critic is available.");
          return process.env.QF_FOUNDER_STEERING_FALSIFY === "second_opinion_wrong_definition"
            ? String(kernelListAgentSessions().find((session) => session.status === "running" && session.id && kernelGetLinks(String(session.id), { kind: "spawned_from" }).some((link) => link.to_id === "hermes-worker"))?.id ?? "wrong-critic")
            : idle.length === 1 ? String(idle[0]!.id) : (await admitAndStartSession("hermes-critic")).sessionId;
        },
      );
      if (admission.kind === "already_open") throw new Error("A second-opinion Task is already open.");
      const criticSessionId = admission.criticSessionId;
      const source = kernelGetObject("task", taskId);
      const result = kernelExecute("request_second_opinion", { task_id: taskId, critic_session_id: criticSessionId }, trace(actorSessionId ?? undefined));
      const accepted = result as unknown as { accepted_event_id?: string; review_task_id?: string; critic_session_id?: string };
      if (!accepted.accepted_event_id || !accepted.review_task_id || !accepted.critic_session_id) throw new Error("second opinion did not return captured delivery fields");
      await deliverAccepted(accepted.accepted_event_id, accepted.critic_session_id, `${JSON.stringify({ contract: "qf.task.second_opinion.v1", source_task_id: taskId, review_task_id: accepted.review_task_id, title: source?.title ?? "", instruction: source?.description ?? "" })}\r`, actorSessionId ?? undefined);
      invalidateDock();
      return { ok: true as const, result };
    } catch (err) {
      const input = args && typeof args === "object" && !Array.isArray(args) ? args as Record<string, unknown> : {};
      const taskId = typeof input.taskId === "string" ? input.taskId : null;
      recordRefusal("second_opinion", taskId, err, taskId ? directorForTask(taskId) ?? undefined : undefined, attemptId);
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
      let pendingRequestId: string | null = null;
      try {
        assertTrustedSender(event);
        const definitionId = parseDefinitionLaunchRequest(args);
        pendingRequestId = crypto.randomUUID();
        const definition = kernelListAgentDefinitions().find(
          (row) => row.id === definitionId,
        );
        sendToShell(
          "shell:forward",
          "canvas",
          "spawn-pending",
          pendingRequestId,
          definitionId,
          String(definition?.display_name ?? definitionId),
        );
        const proofDelayMs = Number(process.env.QF_UI_PROOF_DELAY_SPAWN_MS ?? 0);
        if (Number.isFinite(proofDelayMs) && proofDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, proofDelayMs));
        }
        if (process.env.QF_UI_PROOF_FAIL_DEFINITION === definitionId) {
          throw new Error("external adapter proof failure");
        }
        const result = await admitAndStartSession(definitionId, {
          onStarted: (sessionId, sp, info) => {
            invalidateDock();
            sendToShell(
              "shell:forward",
              "canvas",
              "spawn-reconciled",
              pendingRequestId,
              {
                status: "running",
                sessionId,
                definitionId: sp,
                surface: info?.surface,
                ptySessionId: info?.ptySessionId,
                role: info?.role,
              },
            );
          },
        });
        invalidateDock();
        return { ok: true as const, result };
      } catch (err) {
        if (pendingRequestId) {
          const error = serializeError(err);
          sendToShell(
            "shell:forward",
            "canvas",
            "spawn-failed",
            pendingRequestId,
            error.message,
          );
          invalidateDock();
        }
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
