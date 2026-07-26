import { z } from "zod";
import { defineObject } from "qf-kernel-schema/define";
import { schema as baseSchema } from "qf-kernel-schema";

/** G2 fixture object — not in production schema; loaded only via QF_READ_SCHEMA_MODULE. */
export const experimental = defineObject({
  name: "experimental",
  description:
    "A probe object for WO-104 phase-exit gate testing. It exists only in harness fixtures to prove new types surface three read tools without server code changes.",
  lifecycle: "experimental",
  properties: z.object({
    label: z
      .string()
      .describe(
        "Human-readable probe label. Used only in gate fixtures to verify schema-driven tool registration.",
      ),
  }),
});

export const schema = {
  ...baseSchema,
  objects: [...baseSchema.objects, experimental],
};
