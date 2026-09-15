import type { registerMethod } from "./json-rpc-server";

export type CollaborationIdentity = { sessionId: string; role: string };

export type CollaborationChange =
  | { kind: "task"; taskId: string }
  | {
    kind: "result";
    taskId: string;
    artifactId: string;
    workerSessionId: string;
    coordinatorSessionId: string;
  };

type Link = { from_id: string; to_id: string; kind?: string };

export type CollaborationDependencies = {
  authenticate: (
    capability: unknown,
    sessionId: unknown,
    role: unknown,
  ) => CollaborationIdentity;
  capabilityGroups: (sessionId: string) => string[];
  liveRecipientForRole: (role: string) => CollaborationIdentity;
  identityForSession: (sessionId: string) => CollaborationIdentity;
  currentCoordinatorForTask: (taskId: string) => string;
  isLiveSession: (sessionId: string) => boolean;
  getObject: (type: string, id: string) => Record<string, unknown> | null;
  getLinks: (
    id: string,
    options: { kind: string },
  ) => Link[];
  execute: (
    command: string,
    input: Record<string, unknown>,
    context: { trace_id: string; span_id: string; actor_session_id: string; mission_id?: string },
  ) => unknown;
  missionForSession?: (sessionId: string) => string | undefined;
  marketObjectExists: (id: string) => boolean;
  resolveReadTrajectoryArtifactIds: (
    taskId: string,
    workerSessionId: string,
    suppliedArtifactIds: string[],
  ) => string[];
  readMarketTrajectoryResult: (artifactId: string, workerSessionId: string) => unknown;
  commitResult: (input: {
    taskId: string;
    workerSessionId: string;
    workerRole: string;
    delegatorSessionId: string;
    delegatorRole: string;
    result: string;
    citedMarketIds: string[];
    readTrajectoryArtifactIds: string[];
  }) => { artifactId: string; completion: unknown };
  notify: (input: {
    fromSessionId: string;
    fromRole: string;
    toSessionId: string;
    toRole: string;
    body: string;
    kind: "task" | "result";
    taskId: string;
    artifactId?: string;
  }) => { messageId: string; delivered: boolean };
  recordResultRefusal?: (input: {
    taskId: string | null;
    workerSessionId: string | null;
    message: string;
  }) => void;
  mintTaskId?: () => string;
};

type NotificationResult = {
  delivered: boolean;
  messageId?: string;
  error?: string;
};

const TASK_MAX_BYTES = 8 * 1024;
const RESULT_MAX_BYTES = 64 * 1024;
const ID_MAX_BYTES = 512;
const ID_ARRAY_MAX_ITEMS = 64;

function boundedString(value: string, field: string, maxBytes: number): string {
  if (new TextEncoder().encode(value).byteLength > maxBytes) {
    throw new Error(`${field} exceeds ${maxBytes} UTF-8 bytes`);
  }
  return value;
}

function taskTitle(task: string): string {
  const firstLine = task.split(/\r?\n/, 1)[0]!.trim();
  return (firstLine || "Delegated task").slice(0, 160);
}

function exactRecord(
  value: unknown,
  label: string,
  allowed: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} requires an object`);
  }
  const input = value as Record<string, unknown>;
  const extras = Object.keys(input).filter((key) => !allowed.includes(key));
  if (extras.length > 0) {
    throw new Error(`${label} rejects extra field: ${extras.sort()[0]}`);
  }
  return input;
}

function nonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function stringIdArray(value: unknown, field: string, allowEmpty = false): string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(
      allowEmpty ? `${field} must be a string array` : `${field} must be a non-empty string array`,
    );
  }
  if (value.length > ID_ARRAY_MAX_ITEMS) {
    throw new Error(`${field} exceeds ${ID_ARRAY_MAX_ITEMS} items`);
  }
  const ids = value.map((entry) =>
    boundedString(nonEmptyString(entry, field), field, ID_MAX_BYTES)
  );
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${field} must not contain duplicates`);
  }
  return ids;
}

function boundedIdList(ids: string[], field: string, allowEmpty = false): string[] {
  if ((!allowEmpty && ids.length === 0) || ids.length > ID_ARRAY_MAX_ITEMS) {
    throw new Error(
      `${field} must contain ${allowEmpty ? "0" : "1"}-${ID_ARRAY_MAX_ITEMS} items`,
    );
  }
  const bounded = ids.map((id) =>
    boundedString(nonEmptyString(id, field), field, ID_MAX_BYTES)
  );
  if (new Set(bounded).size !== bounded.length) {
    throw new Error(`${field} must not contain duplicates`);
  }
  return bounded;
}

function requireCapability(
  deps: CollaborationDependencies,
  identity: CollaborationIdentity,
  group: "desk.orchestrate" | "market.read",
): void {
  if (!deps.capabilityGroups(identity.sessionId).includes(group)) {
    throw new Error(`collaboration capability grant denied: ${group}`);
  }
}

function exactOutgoingLink(
  deps: CollaborationDependencies,
  objectId: string,
  kind: "assigned_to" | "delegated_by",
): string {
  const links = deps.getLinks(objectId, { kind })
    .filter((link) => link.from_id === objectId);
  if (links.length !== 1 || !links[0]!.to_id) {
    throw new Error(`task must have exactly one ${kind} link`);
  }
  return links[0]!.to_id;
}

function collectStrings(value: unknown, output: Set<string>): void {
  if (typeof value === "string") {
    output.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectStrings(entry, output);
    return;
  }
  if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      collectStrings(entry, output);
    }
  }
}

function bestEffortNotification(
  notify: () => { messageId: string; delivered: boolean },
): NotificationResult {
  try {
    const result = notify();
    return { delivered: result.delivered, messageId: result.messageId };
  } catch (error) {
    return {
      delivered: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function sanitizeResultRefusal(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\b(?:api[_-]?key|authorization|bearer|token|secret|password)\b\s*[:=]?\s*\S*/gi, "[redacted]")
    .slice(0, 512);
}

export function createCollaborationService(deps: CollaborationDependencies) {
  const resultAttempts = new Map<string, number>();
  return {
    sendTask(
      identity: CollaborationIdentity,
      input: { toRole: string; task: string },
    ) {
      requireCapability(deps, identity, "desk.orchestrate");
      const task = boundedString(input.task, "task", TASK_MAX_BYTES);
      const toRole = boundedString(input.toRole, "to_role", ID_MAX_BYTES);
      const recipient = deps.liveRecipientForRole(toRole);
      const missionId = deps.missionForSession?.(identity.sessionId);
      if (deps.missionForSession && !missionId) {
        throw new Error("Reopen the Mission and ask the Research Director to delegate this work again.");
      }
      const taskId = deps.mintTaskId?.() ?? `task-${crypto.randomUUID()}`;
      deps.execute(
        "create_task",
        {
          task_id: taskId,
          title: taskTitle(task),
          description: task,
          assignee_session_id: recipient.sessionId,
        },
        {
          trace_id: crypto.randomUUID(),
          span_id: crypto.randomUUID(),
          actor_session_id: identity.sessionId,
          ...(missionId ? { mission_id: missionId } : {}),
        },
      );
      const notification = bestEffortNotification(() => deps.notify({
        fromSessionId: identity.sessionId,
        fromRole: identity.role,
        toSessionId: recipient.sessionId,
        toRole: recipient.role,
        body: task,
        kind: "task",
        taskId,
      }));
      return { taskId, notification };
    },

    sendResult(
      identity: CollaborationIdentity,
      input: {
        taskId: string;
        result: string;
        citedMarketIds: string[];
        readTrajectoryArtifactIds: string[];
      },
    ) {
      requireCapability(deps, identity, "market.read");
      const resultText = boundedString(input.result, "result", RESULT_MAX_BYTES);
      const taskId = boundedString(input.taskId, "task_id", ID_MAX_BYTES);
      const attemptKey = `${identity.sessionId}:${taskId}`;
      const attempt = (resultAttempts.get(attemptKey) ?? 0) + 1;
      resultAttempts.set(attemptKey, attempt);
      if (attempt > 2) throw new Error("send_result correction limit reached; stop this worker and surface the failure");
      const citedMarketIds = boundedIdList(
        input.citedMarketIds,
        "cited_market_ids",
        true,
      );
      const suppliedReadTrajectoryArtifactIds = boundedIdList(
        input.readTrajectoryArtifactIds,
        "read_trajectory_artifact_ids",
        true,
      );
      const task = deps.getObject("task", taskId);
      if (!task || task.status !== "open") {
        throw new Error("send_result requires an open Kernel task");
      }
      const assignedWorker = exactOutgoingLink(deps, taskId, "assigned_to");
      if (assignedWorker !== identity.sessionId) {
        throw new Error("send_result caller is not the assigned worker");
      }
      const coordinatorSessionId = deps.currentCoordinatorForTask(taskId);
      const coordinatorRow = deps.getObject("agent_session", coordinatorSessionId);
      if (coordinatorRow?.status !== "running" || !deps.isLiveSession(coordinatorSessionId)) {
        throw new Error("send_result requires the live current Task coordinator");
      }
      const coordinator = deps.identityForSession(coordinatorSessionId);
      const readTrajectoryArtifactIds = deps.resolveReadTrajectoryArtifactIds(
        taskId,
        identity.sessionId,
        suppliedReadTrajectoryArtifactIds,
      );

      const observedIds = new Set<string>();
      for (const trajectoryId of readTrajectoryArtifactIds) {
        collectStrings(
          deps.readMarketTrajectoryResult(trajectoryId, identity.sessionId),
          observedIds,
        );
      }
      if (
        citedMarketIds.length === 0 &&
        [...observedIds].some((id) => deps.marketObjectExists(id))
      ) {
        throw new Error("send_result requires citations for observed market evidence");
      }
      for (const citedId of citedMarketIds) {
        if (!deps.marketObjectExists(citedId)) {
          throw new Error(`cited market id does not exist: ${citedId}`);
        }
        if (!observedIds.has(citedId)) {
          throw new Error(`cited market id is absent from named read results: ${citedId}`);
        }
      }

      const committed = deps.commitResult({
        taskId,
        workerSessionId: identity.sessionId,
        workerRole: identity.role,
        delegatorSessionId: coordinatorSessionId,
        delegatorRole: coordinator.role,
        result: resultText,
        citedMarketIds,
        readTrajectoryArtifactIds,
      });
      const notification = bestEffortNotification(() => deps.notify({
        fromSessionId: identity.sessionId,
        fromRole: identity.role,
        toSessionId: coordinator.sessionId,
        toRole: coordinator.role,
        body: resultText,
        kind: "result",
        taskId,
        artifactId: committed.artifactId,
      }));
      resultAttempts.delete(attemptKey);
      return {
        taskId,
        artifactId: committed.artifactId,
        completion: committed.completion,
        notification,
      };
    },
  };
}

export function registerCollaborationGatewayRpc(
  register: typeof registerMethod,
  deps: CollaborationDependencies,
  onChanged: (change: CollaborationChange) => void,
): void {
  const service = createCollaborationService(deps);
  register(
    "qf.collaboration.send_task",
    (params) => {
      const input = exactRecord(params, "send_task", [
        "seat_capability",
        "session_id",
        "from_role",
        "to_role",
        "task",
      ]);
      const identity = deps.authenticate(
        input.seat_capability,
        input.session_id,
        input.from_role,
      );
      const result = service.sendTask(identity, {
        toRole: nonEmptyString(input.to_role, "to_role"),
        task: nonEmptyString(input.task, "task"),
      });
      onChanged({ kind: "task", taskId: result.taskId });
      return result;
    },
    { description: "Create a Kernel task, then notify its live assigned recipient." },
  );
  register(
    "qf.collaboration.send_result",
    (params) => {
      let taskId: string | null = null;
      let workerSessionId: string | null = null;
      try {
        const input = exactRecord(params, "send_result", [
          "seat_capability",
          "session_id",
          "from_role",
          "task_id",
          "result",
          "cited_market_ids",
          "read_trajectory_artifact_ids",
        ]);
        taskId = typeof input.task_id === "string" ? input.task_id : null;
        workerSessionId = typeof input.session_id === "string" ? input.session_id : null;
        const identity = deps.authenticate(
          input.seat_capability,
          input.session_id,
          input.from_role,
        );
        const result = service.sendResult(identity, {
          taskId: nonEmptyString(input.task_id, "task_id"),
          result: nonEmptyString(input.result, "result"),
          citedMarketIds: stringIdArray(
            input.cited_market_ids,
            "cited_market_ids",
            true,
          ),
          readTrajectoryArtifactIds: stringIdArray(
            input.read_trajectory_artifact_ids,
            "read_trajectory_artifact_ids",
            true,
          ),
        });
        onChanged({
          kind: "result",
          taskId: result.taskId,
          artifactId: result.artifactId,
          workerSessionId: identity.sessionId,
          coordinatorSessionId: deps.currentCoordinatorForTask(result.taskId),
        });
        return result;
      } catch (error) {
        deps.recordResultRefusal?.({
          taskId,
          workerSessionId,
          message: sanitizeResultRefusal(error),
        });
        throw error;
      }
    },
    { description: "Publish cited result lineage, complete its Kernel task, then notify." },
  );
}
