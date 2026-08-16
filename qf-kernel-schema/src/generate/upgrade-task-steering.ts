import {
  clarify_task,
  redirect_task,
  record_task_steering_delivery,
  record_task_steering_refusal,
  record_task_cancel_outcome,
  request_second_opinion,
} from "../ontology/agent.ts";
import { sqlString } from "./sql.ts";

/** R14 data-preserving upgrade: add founder steering and host receipt actions. */
export function generateUpgradeTaskSteering(): string {
  return [
    "-- qf-kernel-schema generated upgrade: task-steering",
    "-- DO NOT EDIT — regenerate with `bun run generate`.",
    "",
    "DELETE FROM schema_meta WHERE type_name IN ('clarify_task', 'redirect_task', 'record_task_steering_delivery', 'record_task_steering_refusal', 'record_task_cancel_outcome', 'request_second_opinion');",
    ...[
      clarify_task,
      redirect_task,
      record_task_steering_delivery,
      record_task_steering_refusal,
      record_task_cancel_outcome,
      request_second_opinion,
    ].map((action) =>
      `INSERT INTO schema_meta (type_name, kind, lifecycle, description) VALUES (${sqlString(action.name)}, 'action', ${sqlString(action.lifecycle)}, ${sqlString(action.description)});`,
    ),
    "",
  ].join("\n");
}
