import { z } from "zod";

export type Lifecycle = "experimental" | "active";

const SNAKE_CASE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export type DefinedObject<T extends z.ZodRawShape = z.ZodRawShape> = {
  kind: "object";
  name: string;
  description: string;
  lifecycle: Lifecycle;
  pipelineFed?: boolean;
  properties: z.ZodObject<T>;
};

export type DefinedLink = {
  kind: "link";
  name: string;
  description: string;
  lifecycle: Lifecycle;
  /** Endpoint object names in declaration order. */
  from: string[];
  /** Endpoint object names in declaration order. */
  to: string[];
};

export type DefinedAction<T extends z.ZodRawShape = z.ZodRawShape> = {
  kind: "action";
  name: string;
  description: string;
  lifecycle: Lifecycle;
  operatorOnly?: boolean;
  input: z.ZodObject<T>;
};

export type Schema = {
  objects: DefinedObject[];
  links: DefinedLink[];
  actions: DefinedAction[];
};

export type ActiveSchemaBaseline = {
  version: 1;
  active_objects: Record<
    string,
    {
      properties: Record<string, string>;
    }
  >;
};

/** Transition table: every enum state → legal next states (terminal → []). */
export type TransitionTable = Record<string, readonly string[]>;
export type TransitionTables = Record<string, TransitionTable>;

function assertSnakeCase(name: string, role: string): void {
  if (!SNAKE_CASE.test(name)) {
    throw new Error(`${role} "${name}" must be snake_case`);
  }
}

function assertNonEmptyDescription(description: unknown, offender: string): asserts description is string {
  if (typeof description !== "string" || description.trim().length === 0) {
    throw new Error(`${offender} is missing a required non-empty description`);
  }
}

function assertLifecycle(lifecycle: unknown, offender: string): asserts lifecycle is Lifecycle {
  if (lifecycle !== "experimental" && lifecycle !== "active") {
    throw new Error(
      `${offender} is missing a required lifecycle ("experimental" | "active")`,
    );
  }
}

/** Walk optional/nullable/default wrappers to reach the described inner schema. */
export function unwrapZodType(schema: z.ZodType): z.ZodType {
  let current: z.ZodType = schema;
  for (;;) {
    const def = (current as { _zod?: { def?: { type?: string; innerType?: z.ZodType } } })._zod?.def;
    if (!def) break;
    if (def.type === "optional" || def.type === "nullable" || def.type === "default") {
      if (!def.innerType) break;
      current = def.innerType;
      continue;
    }
    break;
  }
  return current;
}

/** Prefer the wrapper description, then the unwrapped inner schema. */
export function propertyDescription(field: z.ZodType): string | undefined {
  if (typeof field.description === "string" && field.description.trim().length > 0) {
    return field.description;
  }
  return unwrapZodType(field).description;
}

function assertPropertyDescriptions(properties: z.ZodObject, owner: string): void {
  for (const [key, field] of Object.entries(properties.shape)) {
    assertNonEmptyDescription(propertyDescription(field as z.ZodType), `${owner}.${key}`);
  }
}

export function enumValues(schema: z.ZodType): string[] | null {
  const inner = unwrapZodType(schema);
  const def = (inner as { _zod?: { def?: { type?: string; entries?: Record<string, string> } } })._zod
    ?.def;
  if (def?.type !== "enum" || !def.entries) return null;
  return Object.values(def.entries);
}

function stripSchemaMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stripSchemaMetadata(entry));
  }
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(record)) {
    if (key === "description" || key === "title" || key === "$schema" || key === "examples") {
      continue;
    }
    next[key] = stripSchemaMetadata(record[key]);
  }
  return next;
}

function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonKeys(entry));
  }
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const sortedEntries = Object.keys(record)
    .sort()
    .map((key) => [key, sortJsonKeys(record[key])] as const);
  return Object.fromEntries(sortedEntries);
}

function propertyTypeFingerprint(field: z.ZodType): string {
  const asJsonSchema = z.toJSONSchema(unwrapZodType(field));
  const normalized = sortJsonKeys(stripSchemaMetadata(asJsonSchema));
  return JSON.stringify(normalized);
}

/**
 * Stateful field for transition lint: `status` when present, else `grade` (ticket).
 */
export function stateFieldName(object: DefinedObject): "status" | "grade" | null {
  if ("status" in object.properties.shape) return "status";
  if ("grade" in object.properties.shape) return "grade";
  return null;
}

export function defineObject<T extends z.ZodRawShape>(opts: {
  name: string;
  description: string;
  lifecycle: Lifecycle;
  pipelineFed?: boolean;
  properties: z.ZodObject<T>;
}): DefinedObject<T> {
  assertSnakeCase(opts.name, "Object name");
  assertNonEmptyDescription(opts.description, `Object "${opts.name}"`);
  assertLifecycle(opts.lifecycle, `Object "${opts.name}"`);
  assertPropertyDescriptions(opts.properties, `Object "${opts.name}"`);
  return {
    kind: "object",
    name: opts.name,
    description: opts.description,
    lifecycle: opts.lifecycle,
    pipelineFed: opts.pipelineFed,
    properties: opts.properties,
  };
}

function normalizeEndpoints(
  value: DefinedObject | DefinedObject[],
  role: "from" | "to",
  linkName: string,
): string[] {
  const list = Array.isArray(value) ? value : [value];
  if (list.length === 0) {
    throw new Error(`Link "${linkName}" ${role} must be a non-empty object or array`);
  }
  return list.map((obj) => obj.name);
}

export function defineLink(opts: {
  name: string;
  description: string;
  lifecycle: Lifecycle;
  from: DefinedObject | DefinedObject[];
  to: DefinedObject | DefinedObject[];
}): DefinedLink {
  assertSnakeCase(opts.name, "Link name");
  assertNonEmptyDescription(opts.description, `Link "${opts.name}"`);
  assertLifecycle(opts.lifecycle, `Link "${opts.name}"`);
  return {
    kind: "link",
    name: opts.name,
    description: opts.description,
    lifecycle: opts.lifecycle,
    from: normalizeEndpoints(opts.from, "from", opts.name),
    to: normalizeEndpoints(opts.to, "to", opts.name),
  };
}

export function defineAction<T extends z.ZodRawShape>(opts: {
  name: string;
  description: string;
  lifecycle: Lifecycle;
  operatorOnly?: boolean;
  input: z.ZodObject<T>;
}): DefinedAction<T> {
  assertSnakeCase(opts.name, "Action name");
  assertNonEmptyDescription(opts.description, `Action "${opts.name}"`);
  assertLifecycle(opts.lifecycle, `Action "${opts.name}"`);
  assertPropertyDescriptions(opts.input, `Action "${opts.name}"`);
  return {
    kind: "action",
    name: opts.name,
    description: opts.description,
    lifecycle: opts.lifecycle,
    operatorOnly: opts.operatorOnly,
    input: opts.input,
  };
}

function assertNoDuplicateNames(schema: Schema): void {
  const seen = new Map<string, string>();
  const check = (name: string, kind: string) => {
    const prior = seen.get(name);
    if (prior) {
      throw new Error(`Duplicate ${kind} name "${name}" (also used as ${prior})`);
    }
    seen.set(name, kind);
  };
  for (const object of schema.objects) check(object.name, "object");
  for (const link of schema.links) check(link.name, "link");
  for (const action of schema.actions) check(action.name, "action");
}

function assertLinkEndpointsExist(schema: Schema): void {
  const objectNames = new Set(schema.objects.map((o) => o.name));
  for (const link of schema.links) {
    for (const endpoint of link.from) {
      if (!objectNames.has(endpoint)) {
        throw new Error(
          `Link "${link.name}" from endpoint "${endpoint}" does not reference an object in the schema`,
        );
      }
    }
    for (const endpoint of link.to) {
      if (!objectNames.has(endpoint)) {
        throw new Error(
          `Link "${link.name}" to endpoint "${endpoint}" does not reference an object in the schema`,
        );
      }
    }
  }
}

function assertTransitionCoverage(schema: Schema, tables: TransitionTables): void {
  const objectsByName = new Map(schema.objects.map((o) => [o.name, o]));

  for (const [typeName, table] of Object.entries(tables)) {
    const object = objectsByName.get(typeName);
    if (!object) {
      throw new Error(
        `Transition table "${typeName}" has no matching object in the schema`,
      );
    }
    const field = stateFieldName(object);
    if (!field) {
      throw new Error(
        `Object "${typeName}" has a transition table but no status/grade enum property`,
      );
    }
    const values = enumValues(object.properties.shape[field] as z.ZodType);
    if (!values) {
      throw new Error(`Object "${typeName}".${field} is not an enum`);
    }
    const tableKeys = Object.keys(table);
    for (const state of values) {
      if (!(state in table)) {
        throw new Error(
          `Object "${typeName}" state "${state}" is missing from the transition table`,
        );
      }
    }
    for (const key of tableKeys) {
      if (!values.includes(key)) {
        throw new Error(
          `Transition table "${typeName}" has orphan key "${key}" not in ${field} enum`,
        );
      }
    }
    for (const [from, targets] of Object.entries(table)) {
      for (const to of targets) {
        if (!values.includes(to)) {
          throw new Error(
            `Transition table "${typeName}" allows "${from}" → "${to}" but "${to}" is not in ${field} enum`,
          );
        }
      }
    }
  }

  for (const object of schema.objects) {
    const field = stateFieldName(object);
    if (!field) continue;
    // Only require tables for objects that are listed in transitions OR have status/grade
    // that the ontology marks as stateful. Ops/task may have no machine — skip if no table
    // and the object is not one of the documented stateful types. Documented stateful types
    // must have tables; presence of a table is required when object name is in the fixed set
    // enforced by transitions.ts export. Here: if object has status/grade AND is expected
    // stateful, tables must include it. Heuristic: require a table whenever status/grade
    // exists AND the object name is a key in tables OR we require all status-bearing
    // research/domain machines. Ticket/hypothesis/event/run/agent_session must be in tables.
    // task might get a status later — if it has status without a table, fail.
    if (!(object.name in tables)) {
      throw new Error(
        `Object "${object.name}" has ${field} enum but no transition table`,
      );
    }
  }
}

function containsKindValueTokenSequence(objectName: string, kindValue: string): boolean {
  const objectTokens = objectName.split("_");
  const kindTokens = kindValue.split("_");
  if (kindTokens.length === 0 || kindTokens.length > objectTokens.length) {
    return false;
  }
  const maxStart = objectTokens.length - kindTokens.length;
  for (let start = 0; start <= maxStart; start++) {
    let allMatch = true;
    for (let offset = 0; offset < kindTokens.length; offset++) {
      if (objectTokens[start + offset] !== kindTokens[offset]) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  return false;
}

function assertNoKindSilos(schema: Schema): void {
  const kindValuesByObject = new Map<string, string[]>();
  for (const object of schema.objects) {
    const kindField = object.properties.shape.kind as z.ZodType | undefined;
    if (!kindField) continue;
    const values = enumValues(kindField);
    if (!values) continue;
    kindValuesByObject.set(object.name, values);
  }

  for (const candidate of schema.objects) {
    for (const [owner, kindValues] of kindValuesByObject.entries()) {
      if (owner === candidate.name) continue;
      for (const value of kindValues) {
        if (!containsKindValueTokenSequence(candidate.name, value)) continue;
        throw new Error(
          `Object "${candidate.name}" embeds kind value "${value}" from "${owner}.kind"; keep "${owner}" as the type and encode "${value}" in kind`,
        );
      }
    }
  }
}

export function buildActiveSchemaBaseline(schema: Schema): ActiveSchemaBaseline {
  const active_objects: ActiveSchemaBaseline["active_objects"] = {};
  for (const object of schema.objects) {
    if (object.lifecycle !== "active") continue;
    const properties: Record<string, string> = {};
    for (const [propertyName, field] of Object.entries(object.properties.shape)) {
      properties[propertyName] = propertyTypeFingerprint(field as z.ZodType);
    }
    active_objects[object.name] = { properties };
  }
  return { version: 1, active_objects };
}

function assertActiveFreeze(schema: Schema, baseline: ActiveSchemaBaseline): void {
  if (baseline.version !== 1) {
    throw new Error(
      `Unsupported schema baseline version "${String(baseline.version)}"; run update-schema-baseline`,
    );
  }

  const objectsByName = new Map(schema.objects.map((object) => [object.name, object]));

  for (const [objectName, baselineObject] of Object.entries(baseline.active_objects)) {
    const currentObject = objectsByName.get(objectName);
    if (!currentObject) {
      throw new Error(`Active baseline object "${objectName}" no longer exists in the schema`);
    }
    if (currentObject.lifecycle !== "active") {
      throw new Error(
        `Active baseline object "${objectName}" changed lifecycle to "${currentObject.lifecycle}"`,
      );
    }

    for (const [propertyName, baselineFingerprint] of Object.entries(baselineObject.properties)) {
      const field = currentObject.properties.shape[propertyName];
      if (!field) {
        throw new Error(
          `Active object "${objectName}" removed baseline property "${propertyName}"`,
        );
      }
      const currentFingerprint = propertyTypeFingerprint(field as z.ZodType);
      if (currentFingerprint !== baselineFingerprint) {
        throw new Error(
          `Active object "${objectName}" retyped baseline property "${propertyName}"`,
        );
      }
    }
  }

  for (const object of schema.objects) {
    if (object.lifecycle !== "active") continue;
    if (!(object.name in baseline.active_objects)) {
      throw new Error(
        `Active object "${object.name}" is missing from schema-baseline.json; regenerate baseline with the explicit update script`,
      );
    }
  }
}

/** Schema-level lint: duplicates, link endpoints, transition↔enum coverage. */
export function lintSchema(
  schema: Schema,
  tables: TransitionTables,
  baseline?: ActiveSchemaBaseline,
  options?: { skipActiveFreeze?: boolean },
): void {
  assertNoDuplicateNames(schema);
  assertLinkEndpointsExist(schema);
  assertNoKindSilos(schema);
  assertTransitionCoverage(schema, tables);
  if (!options?.skipActiveFreeze && baseline) {
    assertActiveFreeze(schema, baseline);
  }
}

/** One legal edge covered by a transition command. */
export type CommandEdge = {
  action: string;
  type: string;
  from: string;
  to: string;
  /** Domain event emitted on success (dotted type.verb). */
  event: string;
};

/** Creation command: names a schema action and an object type (no transition edge). */
export type CreationCommandEdge = {
  action: string;
  object_type: string;
  event: string;
};

/**
 * Join lint: every transition command names a real schema action and a legal
 * transition; every legal transition has a command; every creation command
 * names a real schema action and object. Prevents a fourth parallel catalog.
 * Creation coverage does not relax either transition direction.
 */
export function lintCommands(
  schema: Schema,
  tables: TransitionTables,
  commandList: readonly CommandEdge[],
  creationList: readonly CreationCommandEdge[] = [],
): void {
  const actionNames = new Set(schema.actions.map((a) => a.name));
  const objectNames = new Set(schema.objects.map((o) => o.name));
  const pipelineFedTypes = new Set(
    schema.objects.filter((object) => object.pipelineFed).map((object) => object.name),
  );
  const covered = new Set<string>();

  for (const cmd of commandList) {
    if (!actionNames.has(cmd.action)) {
      throw new Error(
        `Command action "${cmd.action}" is not a schema action (type=${cmd.type} ${cmd.from}→${cmd.to})`,
      );
    }
    const table = tables[cmd.type];
    if (!table) {
      throw new Error(`Command "${cmd.action}" references unknown type "${cmd.type}"`);
    }
    const allowed = table[cmd.from];
    if (!allowed || !allowed.includes(cmd.to)) {
      throw new Error(
        `Command "${cmd.action}" is not a legal transition for ${cmd.type}: ${cmd.from} → ${cmd.to}`,
      );
    }
    if (pipelineFedTypes.has(cmd.type)) {
      throw new Error(
        `Pipeline-fed type "${cmd.type}" must not have transition command edges (${cmd.action}: ${cmd.from}→${cmd.to})`,
      );
    }
    const key = `${cmd.type}:${cmd.from}->${cmd.to}`;
    if (covered.has(key)) {
      throw new Error(`Duplicate command coverage for ${key}`);
    }
    covered.add(key);
  }

  for (const [typeName, table] of Object.entries(tables)) {
    for (const [from, targets] of Object.entries(table)) {
      for (const to of targets) {
        const key = `${typeName}:${from}->${to}`;
        if (!covered.has(key)) {
          throw new Error(`Legal transition has no command: ${key}`);
        }
      }
    }
  }

  for (const cmd of creationList) {
    if (!actionNames.has(cmd.action)) {
      throw new Error(
        `Creation command action "${cmd.action}" is not a schema action (object_type=${cmd.object_type})`,
      );
    }
    if (!objectNames.has(cmd.object_type)) {
      throw new Error(
        `Creation command "${cmd.action}" object_type "${cmd.object_type}" is not a schema object`,
      );
    }
    if (typeof cmd.event !== "string" || cmd.event.trim().length === 0) {
      throw new Error(`Creation command "${cmd.action}" is missing event type`);
    }
    if (pipelineFedTypes.has(cmd.object_type)) {
      throw new Error(
        `Pipeline-fed type "${cmd.object_type}" must not have creation commands (${cmd.action})`,
      );
    }
  }

  assertOperatorOnlyCoupling(schema, commandList, creationList);
}

function isObservationEvent(event: string): boolean {
  return event.endsWith(".observed");
}

/**
 * Observation-coupled actions must be operatorOnly. When an action is both
 * operatorOnly and observation-coupled, every command event must end ".observed".
 * Non-observation operatorOnly governance actions (for example profile registration) are allowed.
 */
function assertOperatorOnlyCoupling(
  schema: Schema,
  commandList: readonly CommandEdge[],
  creationList: readonly CreationCommandEdge[],
): void {
  const eventsByAction = new Map<string, string[]>();

  for (const cmd of commandList) {
    const events = eventsByAction.get(cmd.action) ?? [];
    events.push(cmd.event);
    eventsByAction.set(cmd.action, events);
  }
  for (const cmd of creationList) {
    const events = eventsByAction.get(cmd.action) ?? [];
    events.push(cmd.event);
    eventsByAction.set(cmd.action, events);
  }

  for (const action of schema.actions) {
    const events = eventsByAction.get(action.name) ?? [];
    const observationCoupled = events.some((event) => isObservationEvent(event));
    const operatorOnly = action.operatorOnly === true;

    if (observationCoupled && !operatorOnly) {
      throw new Error(
        `Action "${action.name}" is observation-coupled (command event ends ".observed") but operatorOnly is not true`,
      );
    }

    if (operatorOnly && observationCoupled) {
      for (const event of events) {
        if (!isObservationEvent(event)) {
          throw new Error(
            `Action "${action.name}" is operatorOnly but command event "${event}" does not end ".observed"`,
          );
        }
      }
    }
  }
}

/**
 * Action-surface lint: every schema action must be wired through a transition or
 * creation command, and every command must name a schema action — set equality,
 * not cardinality. Prevents declared-but-unexecutable actions from shipping.
 */
export function lintActionSurface(
  schema: Schema,
  commandList: readonly CommandEdge[],
  creationList: readonly CreationCommandEdge[] = [],
): void {
  const actionNames = new Set(schema.actions.map((a) => a.name));
  const wired = new Set<string>();
  for (const cmd of commandList) wired.add(cmd.action);
  for (const cmd of creationList) wired.add(cmd.action);

  const unwired = [...actionNames].filter((n) => !wired.has(n)).sort();
  if (unwired.length > 0) {
    throw new Error(
      `Schema actions have no command wiring: ${unwired.join(", ")}`,
    );
  }

  const orphanCommands = [...wired].filter((n) => !actionNames.has(n)).sort();
  if (orphanCommands.length > 0) {
    throw new Error(
      `Commands reference actions not in schema: ${orphanCommands.join(", ")}`,
    );
  }
}
