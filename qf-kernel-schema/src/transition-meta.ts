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
  for (const key of Object.keys(action.input.shape)) {
    if (key.endsWith("_id")) return key;
  }
  throw new Error(`transition-meta: action "${actionName}" has no *_id input field`);
}

function buildTransitionIdFields(): Record<StatefulType, string> {
  const map = {} as Record<StatefulType, string>;
  for (const type of Object.keys(transitions) as StatefulType[]) {
    const cmd = commands.find((c) => c.type === type);
    if (!cmd) {
      throw new Error(`transition-meta: no transition command for type "${type}"`);
    }
    const idField = objectIdFieldFromAction(cmd.action);
    if (type in map && map[type] !== idField) {
      throw new Error(
        `transition-meta: conflicting id fields for "${type}": ${map[type]} vs ${idField}`,
      );
    }
    map[type] = idField;
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
