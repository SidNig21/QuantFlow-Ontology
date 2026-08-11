import { commands } from "./commands.ts";
import { stateFieldName } from "./define.ts";
import { schema } from "./schema.ts";
import { transitions, type StatefulType } from "./transitions.ts";

/** Resolve the object-id input field for a transition action (e.g. market_event → event_id). */
function objectIdFieldFromAction(actionName: string): string {
  const action = schema.actions.find((a) => a.name === actionName);
  if (!action) {
    throw new Error(`transition-meta: action "${actionName}" not in schema`);
  }
  const idKeys = Object.keys(action.input.shape).filter((key) => key.endsWith("_id"));
  if (idKeys.length === 0) {
    throw new Error(`transition-meta: action "${actionName}" has no *_id input field`);
  }
  // The transitioned row id is declared first. Later *_id fields are durable
  // lineage inputs (for example complete_task.result_artifact_id), not a
  // second transition target.
  return idKeys[0]!;
}

function buildTransitionIdFields(): Record<StatefulType, string> {
  const map = {} as Record<StatefulType, string>;
  for (const type of Object.keys(transitions) as StatefulType[]) {
    const cmds = commands.filter((c) => c.type === type);
    if (cmds.length === 0) {
      throw new Error(`transition-meta: no transition command for type "${type}"`);
    }
    const idFields = cmds.map((cmd) => objectIdFieldFromAction(cmd.action));
    const first = idFields[0]!;
    for (const field of idFields.slice(1)) {
      if (field !== first) {
        throw new Error(
          `transition-meta: conflicting id fields for "${type}": ${first} vs ${field}`,
        );
      }
    }
    map[type] = first;
  }
  return map;
}

function buildTransitionStateFields(): Record<StatefulType, "status" | "grade"> {
  const map = {} as Record<StatefulType, "status" | "grade">;
  const objectsByName = new Map(schema.objects.map((o) => [o.name, o]));
  for (const type of Object.keys(transitions) as StatefulType[]) {
    const object = objectsByName.get(type);
    if (!object) {
      throw new Error(`transition-meta: no schema object for stateful type "${type}"`);
    }
    const field = stateFieldName(object);
    if (!field) {
      throw new Error(`transition-meta: object "${type}" has no status/grade field`);
    }
    map[type] = field;
  }
  return map;
}

/**
 * Per stateful type, the command-input field holding the row id — derived from schema
 * action inputs so renames like event→market_event cannot drift from execute().
 */
export const transitionIdFields: Record<StatefulType, string> = buildTransitionIdFields();

/**
 * Per stateful type, whether transitions update status or grade — derived from schema.
 */
export const transitionStateFields: Record<StatefulType, "status" | "grade"> =
  buildTransitionStateFields();
