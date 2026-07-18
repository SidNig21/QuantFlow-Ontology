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
  from: string;
  to: string;
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

export function defineLink(opts: {
  name: string;
  description: string;
  lifecycle: Lifecycle;
  from: DefinedObject;
  to: DefinedObject;
}): DefinedLink {
  assertSnakeCase(opts.name, "Link name");
  assertNonEmptyDescription(opts.description, `Link "${opts.name}"`);
  assertLifecycle(opts.lifecycle, `Link "${opts.name}"`);
  return {
    kind: "link",
    name: opts.name,
    description: opts.description,
    lifecycle: opts.lifecycle,
    from: opts.from.name,
    to: opts.to.name,
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
