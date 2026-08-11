export type PeerNotificationKind = "task" | "result";

export function formatPeerNotification(
  fromRole: string,
  kind: PeerNotificationKind,
  rawBody: string,
): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const envelope = parsed as Record<string, unknown>;
  if (Object.keys(envelope).sort().join(",") !== "body,contract,task_id") return null;
  if (
    envelope.contract !== "qf.peer-notification.v1" ||
    typeof envelope.task_id !== "string" ||
    envelope.task_id.trim().length === 0 ||
    typeof envelope.body !== "string" ||
    envelope.body.trim().length === 0
  ) return null;
  const taskId = envelope.task_id.trim();
  const oneLine = envelope.body.replace(/\s*\n\s*/g, " ").trim();
  if (kind === "task") {
    return `[QuantFlow TASK ${taskId} from ${fromRole}] ${oneLine} `
      + `Complete it, then call the QuantFlow collaboration send_result tool `
      + `with task_id=${taskId}, cited_market_ids, and `
      + `read_trajectory_artifact_ids from your ontology reads.`;
  }
  return `[QuantFlow RESULT for ${taskId} from ${fromRole}] ${oneLine}`;
}
