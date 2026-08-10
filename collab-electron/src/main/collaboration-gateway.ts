import type { registerMethod } from "./json-rpc-server";

export type CollaborationIdentity = { sessionId: string; role: string };

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
  getObject: (type: string, id: string) => Record<string, unknown> | null;
  getLinks: (
    id: string,
    options: { kind: string },
  ) => Link[];
  execute: (
    command: string,
    input: Record<string, unknown>,
    context: { trace_id: string; span_id: string; actor_session_id: string },
  ) => unknown;
  marketObjectExists: (id: string) => boolean;
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

function stringIdArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} must be a non-empty string array`);
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

function boundedIdList(ids: string[], field: string): string[] {
  if (ids.length === 0 || ids.length > ID_ARRAY_MAX_ITEMS) {
    throw new Error(`${field} must contain 1-${ID_ARRAY_MAX_ITEMS} items`);
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

export function createCollaborationService(deps: CollaborationDependencies) {
  return {
    sendTask(
      identity: CollaborationIdentity,
      input: { toRole: string; task: string },
    ) {
      requireCapability(deps, identity, "desk.orchestrate");
      const task = boundedString(input.task, "task", TASK_MAX_BYTES);
      const toRole = boundedString(input.toRole, "to_role", ID_MAX_BYTES);
      const recipient = deps.liveRecipientForRole(toRole);
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
      const citedMarketIds = boundedIdList(input.citedMarketIds, "cited_market_ids");
      const readTrajectoryArtifactIds = boundedIdList(
        input.readTrajectoryArtifactIds,
        "read_trajectory_artifact_ids",
      );
      const task = deps.getObject("task", taskId);
      if (!task || task.status !== "open") {
        throw new Error("send_result requires an open Kernel task");
      }
      const assignedWorker = exactOutgoingLink(deps, taskId, "assigned_to");
      if (assignedWorker !== identity.sessionId) {
        throw new Error("send_result caller is not the assigned worker");
      }
      const delegatorSessionId = exactOutgoingLink(deps, taskId, "delegated_by");
      const delegator = deps.identityForSession(delegatorSessionId);

      const observedIds = new Set<string>();
      for (const trajectoryId of readTrajectoryArtifactIds) {
        collectStrings(
          deps.readMarketTrajectoryResult(trajectoryId, identity.sessionId),
          observedIds,
        );
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
        delegatorSessionId,
        delegatorRole: delegator.role,
        result: resultText,
        citedMarketIds,
        readTrajectoryArtifactIds,
      });
      const notification = bestEffortNotification(() => deps.notify({
        fromSessionId: identity.sessionId,
        fromRole: identity.role,
        toSessionId: delegator.sessionId,
        toRole: delegator.role,
        body: resultText,
        kind: "result",
        taskId,
        artifactId: committed.artifactId,
      }));
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
  onChanged: () => void,
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
      onChanged();
      return result;
    },
    { description: "Create a Kernel task, then notify its live assigned recipient." },
  );
  register(
    "qf.collaboration.send_result",
    (params) => {
      const input = exactRecord(params, "send_result", [
        "seat_capability",
        "session_id",
        "from_role",
        "task_id",
        "result",
        "cited_market_ids",
        "read_trajectory_artifact_ids",
      ]);
      const identity = deps.authenticate(
        input.seat_capability,
        input.session_id,
        input.from_role,
      );
      const result = service.sendResult(identity, {
        taskId: nonEmptyString(input.task_id, "task_id"),
        result: nonEmptyString(input.result, "result"),
        citedMarketIds: stringIdArray(input.cited_market_ids, "cited_market_ids"),
        readTrajectoryArtifactIds: stringIdArray(
          input.read_trajectory_artifact_ids,
          "read_trajectory_artifact_ids",
        ),
      });
      onChanged();
      return result;
    },
    { description: "Publish cited result lineage, complete its Kernel task, then notify." },
  );
}
