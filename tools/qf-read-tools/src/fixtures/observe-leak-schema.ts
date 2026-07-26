import { schema as baseSchema } from "qf-kernel-schema";

/** G3 bait (a): observe_ticket served when operatorOnly is stripped in fixture schema. */
export const schema = {
  ...baseSchema,
  actions: baseSchema.actions.map((action) => {
    if (action.name !== "observe_ticket") return action;
    const { operatorOnly: _removed, ...rest } = action;
    return rest;
  }),
};
