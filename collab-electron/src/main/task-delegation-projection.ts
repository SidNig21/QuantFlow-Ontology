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
  status: "open" | "done";
  fromSessionId: string;
  toSessionId: string;
  fromRole: string;
  toRole: string;
};

export type TaskDelegationProjectionReader = {
  listTasks: () => Array<Record<string, unknown>>;
  linksFrom: (id: string, kind: string) => DelegationLink[];
  getObject: (type: "agent_definition", id: string) => Record<string, unknown> | null;
};

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
    const taskId = task.id;
    const title = task.title;
    const status = task.status;
    if (
      typeof taskId !== "string" ||
      typeof title !== "string" ||
      (status !== "open" && status !== "done")
    ) {
      continue;
    }
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
