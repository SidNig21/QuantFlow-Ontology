import { describe, expect, test } from "bun:test";
import { z } from "zod";
import {
  defineAction,
  defineLink,
  defineObject,
  lintCommands,
  lintSchema,
  type Schema,
} from "./define.ts";

describe("schema lint", () => {
  test("object missing description fails naming the offender", () => {
    expect(() =>
      defineObject({
        name: "orphan_claim",
        description: "   ",
        lifecycle: "experimental",
        properties: z.object({
          claim: z.string().describe("A claim."),
        }),
      }),
    ).toThrow('Object "orphan_claim" is missing a required non-empty description');
  });

  test("object missing lifecycle fails naming the offender", () => {
    expect(() =>
      defineObject({
        name: "orphan_claim",
        description: "A claim object.",
        // @ts-expect-error intentional invalid lifecycle for lint coverage
        lifecycle: undefined,
        properties: z.object({
          claim: z.string().describe("A claim."),
        }),
      }),
    ).toThrow('Object "orphan_claim" is missing a required lifecycle');
  });

  test("property missing description fails naming the offender", () => {
    expect(() =>
      defineObject({
        name: "orphan_claim",
        description: "A claim object.",
        lifecycle: "experimental",
        properties: z.object({
          claim: z.string(),
        }),
      }),
    ).toThrow('Object "orphan_claim".claim is missing a required non-empty description');
  });

  test("link missing description fails naming the offender", () => {
    const a = defineObject({
      name: "alpha",
      description: "Alpha object for link lint.",
      lifecycle: "experimental",
      properties: z.object({
        label: z.string().describe("Label."),
      }),
    });
    const b = defineObject({
      name: "beta",
      description: "Beta object for link lint.",
      lifecycle: "experimental",
      properties: z.object({
        label: z.string().describe("Label."),
      }),
    });
    expect(() =>
      defineLink({
        name: "points_to",
        description: "",
        lifecycle: "experimental",
        from: a,
        to: b,
      }),
    ).toThrow('Link "points_to" is missing a required non-empty description');
  });

  test("action missing description fails naming the offender", () => {
    expect(() =>
      defineAction({
        name: "do_thing",
        description: "",
        lifecycle: "experimental",
        input: z.object({
          value: z.string().describe("A value."),
        }),
      }),
    ).toThrow('Action "do_thing" is missing a required non-empty description');
  });

  test("multi-endpoint link preserves declaration order", () => {
    const a = defineObject({
      name: "alpha",
      description: "Alpha object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const b = defineObject({
      name: "beta",
      description: "Beta object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const c = defineObject({
      name: "gamma",
      description: "Gamma object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const link = defineLink({
      name: "joins",
      description: "Multi endpoint link.",
      lifecycle: "experimental",
      from: [a, b],
      to: c,
    });
    expect(link.from).toEqual(["alpha", "beta"]);
    expect(link.to).toEqual(["gamma"]);
  });

  test("lintSchema rejects duplicate names", () => {
    const obj = defineObject({
      name: "dup_name",
      description: "An object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const action = defineAction({
      name: "dup_name",
      description: "An action.",
      lifecycle: "experimental",
      input: z.object({ value: z.string().describe("Value.") }),
    });
    const schema: Schema = { objects: [obj], links: [], actions: [action] };
    expect(() => lintSchema(schema, {})).toThrow('Duplicate action name "dup_name"');
  });

  test("lintSchema rejects unknown link endpoints", () => {
    const a = defineObject({
      name: "alpha",
      description: "Alpha object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const b = defineObject({
      name: "beta",
      description: "Beta object.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const link = defineLink({
      name: "points_to",
      description: "A link.",
      lifecycle: "experimental",
      from: a,
      to: b,
    });
    const schema: Schema = { objects: [a], links: [link], actions: [] };
    expect(() => lintSchema(schema, {})).toThrow(
      'Link "points_to" to endpoint "beta" does not reference an object in the schema',
    );
  });

  test("lintSchema rejects status enum missing from transition table", () => {
    const widget = defineObject({
      name: "widget",
      description: "A stateful widget.",
      lifecycle: "experimental",
      properties: z.object({
        status: z.enum(["a", "b"]).describe("Status."),
      }),
    });
    const schema: Schema = { objects: [widget], links: [], actions: [] };
    expect(() =>
      lintSchema(schema, {
        widget: { a: ["b"] },
      }),
    ).toThrow('Object "widget" state "b" is missing from the transition table');
  });

  test("lintCommands rejects a command that is not a schema action", () => {
    const widget = defineObject({
      name: "widget",
      description: "A stateful widget.",
      lifecycle: "experimental",
      properties: z.object({
        status: z.enum(["a", "b"]).describe("Status."),
      }),
    });
    const go = defineAction({
      name: "go",
      description: "Advance.",
      lifecycle: "experimental",
      input: z.object({ id: z.string().describe("Id.") }),
    });
    const schema: Schema = { objects: [widget], links: [], actions: [go] };
    const tables = { widget: { a: ["b"], b: [] } };
    expect(() =>
      lintCommands(schema, tables, [
        { action: "invented", type: "widget", from: "a", to: "b" },
      ]),
    ).toThrow('Command action "invented" is not a schema action');
  });

  test("lintCommands rejects a legal transition with no command", () => {
    const widget = defineObject({
      name: "widget",
      description: "A stateful widget.",
      lifecycle: "experimental",
      properties: z.object({
        status: z.enum(["a", "b"]).describe("Status."),
      }),
    });
    const go = defineAction({
      name: "go",
      description: "Advance.",
      lifecycle: "experimental",
      input: z.object({ id: z.string().describe("Id.") }),
    });
    const schema: Schema = { objects: [widget], links: [], actions: [go] };
    const tables = { widget: { a: ["b"], b: [] } };
    expect(() => lintCommands(schema, tables, [])).toThrow(
      "Legal transition has no command: widget:a->b",
    );
  });

  test("lintCommands rejects a creation command that is not a schema action", () => {
    const blob = defineObject({
      name: "blob",
      description: "A blob.",
      lifecycle: "experimental",
      properties: z.object({ label: z.string().describe("Label.") }),
    });
    const schema: Schema = { objects: [blob], links: [], actions: [] };
    expect(() =>
      lintCommands(schema, {}, [], [
        { action: "publish_blob", object_type: "blob", event: "blob.published" },
      ]),
    ).toThrow('Creation command action "publish_blob" is not a schema action');
  });
});
