/**
 * Read-only task delegation projection for the canvas.
 *
 * The task row and its exactly-one delegated_by / assigned_to links are the
 * entire assignment truth. Transport can notify a seat, but never supplies
 * data to this projection.
 */

export type DelegationLink = {
  from_id: string;
  to_id: string;
};

export type TaskDelegationProjection = {
  taskId: string;
  title: string;
  status: "open" | "done" | "cancelled";
  fromSessionId: string;
  toSessionId: string;
  fromRole: string;
  toRole: string;
};

export type TaskAssignmentProjection = {
  taskId: string;
  title: string;
  status: "open" | "done" | "cancelled";
  delegatorDisplayName: string | null;
  description: string;
  delegatedBySessionId: string | null;
  assignedToSessionId: string | null;
  assignmentState: "assigned" | "unavailable";
  /** Sessions named by malformed links; never used as an owner. */
  unavailableSessionIds: string[];
  history?: TaskHistoryFact[];
};

export type TaskHistoryFact = {
  sequence: number;
  event_id: string;
  kind: string;
  task_id: string;
  mode: string | null;
  text: string | null;
  outcome: string | null;
  target_session_id: string | null;
};

export type TaskDelegationProjectionReader = {
  listTasks: () => Array<Record<string, unknown>>;
  linksFrom: (id: string, kind: string) => DelegationLink[];
  getObject: (type: "agent_definition", id: string) => Record<string, unknown> | null;
};

function validTask(
  task: Record<string, unknown>,
): { taskId: string; title: string; status: "open" | "done" | "cancelled"; description: string } | null {
  const taskId = task.id;
  const title = task.title;
  const status = task.status;
  const description = task.description;
  if (
    typeof taskId !== "string" ||
    typeof title !== "string" ||
    typeof description !== "string" ||
    (status !== "open" && status !== "done" && status !== "cancelled")
  ) {
    return null;
  }
  return { taskId, title, status, description };
}

/**
 * Project every task's exact assignment cardinality from Kernel rows. A task
 * with one delegated_by and one assigned_to is assigned; any partial or
 * duplicate identity is deliberately surfaced as unavailable so the UI can
 * clear a previously rendered title instead of guessing.
 */
export function projectTaskAssignments(
  reader: TaskDelegationProjectionReader,
): TaskAssignmentProjection[] {
  const projections: TaskAssignmentProjection[] = [];
  for (const rawTask of reader.listTasks()) {
    const task = validTask(rawTask);
    if (!task) continue;
    const delegated = reader.linksFrom(task.taskId, "delegated_by");
    const assigned = reader.linksFrom(task.taskId, "assigned_to");
    const delegatedIds = delegated
      .map((link) => link.to_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    const assignedIds = assigned
      .map((link) => link.to_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    const assignmentLinksExact = delegated.length === 1 && assigned.length === 1 &&
      delegatedIds.length === 1 && assignedIds.length === 1;
    const delegatorSessionId = assignmentLinksExact ? delegatedIds[0]! : null;
    const delegatorLineage = delegatorSessionId
      ? onlyLink(reader, delegatorSessionId, "spawned_from")
      : null;
    const delegatorDefinition = delegatorLineage
      ? reader.getObject("agent_definition", delegatorLineage.to_id)
      : null;
    const delegatorDisplayName = typeof delegatorDefinition?.display_name === "string" &&
      delegatorDefinition.display_name.trim().length > 0
      ? delegatorDefinition.display_name
      : null;
    const exact = assignmentLinksExact && delegatorDisplayName !== null;
    projections.push({
      taskId: task.taskId,
      title: task.title,
      status: task.status,
      delegatorDisplayName: exact ? delegatorDisplayName : null,
      description: task.description,
      delegatedBySessionId: exact ? delegatedIds[0]! : null,
      assignedToSessionId: exact ? assignedIds[0]! : null,
      assignmentState: exact ? "assigned" : "unavailable",
      unavailableSessionIds: exact
        ? []
        : [...new Set([...delegatedIds, ...assignedIds])],
    });
  }
  return projections;
}

function onlyLink(
  reader: TaskDelegationProjectionReader,
  id: string,
  kind: string,
): DelegationLink | null {
  const links = reader.linksFrom(id, kind);
  return links.length === 1 ? links[0]! : null;
}

function roleForSession(
  reader: TaskDelegationProjectionReader,
  sessionId: string,
): string | null {
  const definitionLink = onlyLink(reader, sessionId, "spawned_from");
  if (!definitionLink) return null;
  const definition = reader.getObject("agent_definition", definitionLink.to_id);
  const role = definition?.role;
  return typeof role === "string" && role.length > 0 ? role : null;
}

/**
 * Derive canvas cables directly from Kernel task and identity rows.
 * Invalid or incomplete link cardinality intentionally yields no cable.
 */
export function projectTaskDelegations(
  reader: TaskDelegationProjectionReader,
): TaskDelegationProjection[] {
  const projections: TaskDelegationProjection[] = [];
  for (const task of reader.listTasks()) {
    const current = validTask(task);
    if (!current) continue;
    const { taskId, title, status } = current;
    const delegatedBy = onlyLink(reader, taskId, "delegated_by");
    const assignedTo = onlyLink(reader, taskId, "assigned_to");
    if (!delegatedBy || !assignedTo) continue;
    const fromRole = roleForSession(reader, delegatedBy.to_id);
    const toRole = roleForSession(reader, assignedTo.to_id);
    if (!fromRole || !toRole) continue;
    projections.push({
      taskId,
      title,
      status,
      fromSessionId: delegatedBy.to_id,
      toSessionId: assignedTo.to_id,
      fromRole,
      toRole,
    });
  }
  return projections;
}
