import { z } from "zod";
import { defineAction, defineLink } from "../define.ts";
import { mission } from "./research.ts";
import { quote } from "./market.ts";

export const investigates = defineLink({
  name: "investigates", lifecycle: "experimental", from: mission, to: quote,
  description: "The exact immutable market observation that started an investigation. Only create_market_investigation may establish this edge, so refreshed prices never rewrite the original question's evidence.",
});
export const register_tool = defineAction({
  name: "register_tool", lifecycle: "experimental", capabilityGroup: "desk.orchestrate", operatorOnly: true,
  description: "Register an explicit capability identity for the Dock. Identical registration is idempotent; conflicting identity, category or revision is refused.",
  input: z.object({
    tool_id: z.string().min(1).describe("Stable capability identity. Reuse only for exactly the same implementation and presentation contract."),
    name: z.string().min(1).describe("Human-readable capability name. It names the callable resource rather than its venue or implementation package."),
    summary: z.string().min(1).describe("The research operation this capability supplies. Describe its useful outcome and limits."),
    capability_class: z.enum(["data", "tool"]).describe("Catalog category of this capability. It never grants participant permissions."),
    implementation_version: z.string().min(1).describe("Exact admitted implementation version. Conflicting re-registration is rejected."),
  }),
});
export const create_market_investigation = defineAction({
  name: "create_market_investigation", lifecycle: "experimental", capabilityGroup: "desk.orchestrate",
  description: "Open a Technique-free investigation anchored to one current quote. The Kernel checks observation age, latest observation and event cutoff before atomically creating the Mission and investigates edge; it never creates a Task or Strategy.",
  input: z.object({
    quote_id: z.string().min(1).describe("Exact current quote being researched. A stale or superseded observation must be refreshed before entry."),
    name: z.string().min(1).max(180).describe("Short question label visible on the desk. Keep the exact evidence identity in the investigates link."),
    objective: z.string().min(1).max(2000).describe("Bounded investigation question. This is research intent and carries no probability, recommendation or execution authority."),
  }),
});
