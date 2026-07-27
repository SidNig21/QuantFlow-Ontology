import { z } from "zod";
import { defineObject } from "qf-kernel-schema/define";
import { schema as baseSchema } from "qf-kernel-schema";

/** G5 fixture object — not in production schema; loaded via QF_VAULT_SCHEMA_MODULE. */
export const experimental = defineObject({
  name: "experimental",
  description:
    "A probe object for WO-V1 G5 schema-driven projection. It exists only in gate fixtures to prove a new type gets a folder without projector edits.",
  lifecycle: "experimental",
  properties: z.object({
    label: z
      .string()
      .describe(
        "Human-readable probe label. Used only in gate fixtures to verify schema-driven folder creation.",
      ),
  }),
});

export const schema = {
  ...baseSchema,
  objects: [...baseSchema.objects, experimental],
};
