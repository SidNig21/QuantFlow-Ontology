import { z } from "zod";

export type Lifecycle = "experimental" | "active";

const SNAKE_CASE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export type DefinedObject<T extends z.ZodRawShape = z.ZodRawShape> = {
  kind: "object";
  name: string;
  description: string;
  lifecycle: Lifecycle;
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
  input: z.ZodObject<T>;
};

export type Schema = {
  objects: DefinedObject[];
  links: DefinedLink[];
  actions: DefinedAction[];
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

/** Schema-level lint: duplicates, link endpoints, transition↔enum coverage. */
export function lintSchema(schema: Schema, tables: TransitionTables): void {
  assertNoDuplicateNames(schema);
  assertLinkEndpointsExist(schema);
  assertTransitionCoverage(schema, tables);
}

/** One legal edge covered by a transition command. */
export type CommandEdge = {
  action: string;
  type: string;
  from: string;
  to: string;
};

/**
 * Join lint: every command names a real schema action and a legal transition;
 * every legal transition has a command. Prevents a fourth parallel catalog.
 */
export function lintCommands(
  schema: Schema,
  tables: TransitionTables,
  commandList: readonly CommandEdge[],
): void {
  const actionNames = new Set(schema.actions.map((a) => a.name));
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
}
