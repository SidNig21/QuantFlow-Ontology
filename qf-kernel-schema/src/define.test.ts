import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { defineAction, defineLink, defineObject } from "./define.ts";

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
});
