import { z } from "zod";
import { defineAction, defineLink, defineObject } from "../define.ts";

// ── Agent plane ─────────────────────────────────────────────────────────────

export const workspace = defineObject({
  name: "workspace",
  description:
    "One canvas of work — the spatial container for tiles, sessions, and connections in a research project.",
  lifecycle: "experimental",
  properties: z.object({
    name: z.string().describe("Short workspace name shown on the canvas."),
    title: z.string().describe("Human-readable title for the research workspace."),
  }),
});

export const agent_definition = defineObject({
  name: "agent_definition",
  description:
    "A spawnable agent species (Researcher, Ingestion-Collector, Backtester, Critic) — the template, not a live instance.",
  lifecycle: "experimental",
  properties: z.object({
    name: z.string().describe("Species name agents and operators use to request a spawn."),
    role: z
      .string()
      .describe("Role summary (researcher, critic, backtester, ingestion) for routing and prompts."),
    package_ref: z
      .string()
      .describe("AgentOS package this species launches — the plug half of the row."),
    system_prompt_ref: z
      .string()
      .describe("Artifact or prompt id that defines this species' instructions.")
      .nullable(),
  }),
});

export const agent_session = defineObject({
  name: "agent_session",
  description:
    "One durable live agent instance (L1 ledger identity). Operational states only — never actor-internal THINKING/TOOL_CALLING.",
  lifecycle: "experimental",
  properties: z.object({
    status: z
      .enum(["starting", "running", "blocked", "cancelled", "failed", "closed"])
      .describe("Operational session state enforced by the transition table."),
    label: z
      .string()
      .describe("Optional operator-facing label for the live session.")
      .nullable(),
  }),
});

export const task = defineObject({
  name: "task",
  description:
    "A unit of assigned work on the canvas, routed to agent sessions via assigned_to / delegates_to links.",
  lifecycle: "experimental",
  properties: z.object({
    title: z.string().describe("Short task title for the operator and agents."),
    description: z.string().describe("What done looks like for this unit of work."),
  }),
});

export const tool = defineObject({
  name: "tool",
  description:
    "A capability exposed via MCP and generated from this schema — agents call tools; they do not invent ad-hoc side channels.",
  lifecycle: "experimental",
  properties: z.object({
    name: z.string().describe("Tool name as exposed to agents (typically qf_*)."),
    summary: z.string().describe("One-line summary of what the tool does for an agent reader."),
  }),
});

export const execution_environment = defineObject({
  name: "execution_environment",
  description:
    "Where a run executes: local process, local Python sidecar, or disposable Cloudflare sandbox.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["local_process", "local_python", "cloudflare_sandbox"])
      .describe("Execution substrate for runs linked via executes_in."),
    label: z.string().describe("Operator-facing label for this environment instance."),
  }),
});

export const connection = defineObject({
  name: "connection",
  description:
    "A typed cable between tiles on the canvas — projection wiring, never a second truth store.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z.string().describe("Cable/connection kind (data, control, or view projection)."),
    from_ref: z.string().describe("Source tile or object id for this cable."),
    to_ref: z.string().describe("Target tile or object id for this cable."),
  }),
});

export const assigned_to = defineLink({
  name: "assigned_to",
  description: "Work routing: which agent session owns a task.",
  lifecycle: "experimental",
  from: task,
  to: agent_session,
});

export const delegates_to = defineLink({
  name: "delegates_to",
  description: "Session-to-session delegation on the canvas.",
  lifecycle: "experimental",
  from: agent_session,
  to: agent_session,
});

export const register_agent_definition = defineAction({
  name: "register_agent_definition",
  description:
    "Register a spawnable agent species in the Kernel registry (id = name). Duplicate names are rejected.",
  lifecycle: "experimental",
  input: z.object({
    name: z.string().describe("Unique species name; becomes the row id."),
    role: z
      .string()
      .describe("Role summary (researcher, critic, backtester, ingestion) for routing and prompts."),
    package_ref: z
      .string()
      .describe("AgentOS package this species launches — the plug half of the row."),
    system_prompt_ref: z
      .string()
      .describe("Artifact or prompt id that defines this species' instructions.")
      .nullable()
      .optional(),
  }),
});

export const create_agent_session = defineAction({
  name: "create_agent_session",
  description:
    "Create an agent_session by adopting a guest-minted session_id (Kernel never mints). Sets status=starting; put the species name in label until agent_definition arrives.",
  lifecycle: "experimental",
  input: z.object({
    session_id: z
      .string()
      .describe("Guest-minted ACP session id — adopted as the Kernel row id, never re-minted."),
    label: z
      .string()
      .describe("Operator-facing label; v0.1 stores the species name here.")
      .nullable()
      .optional(),
  }),
});

export const start_agent_session = defineAction({
  name: "start_agent_session",
  description: "Bring a starting agent session into running (starting → running).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session id (guest-minted; adopted, never minted)."),
  }),
});

export const block_agent_session = defineAction({
  name: "block_agent_session",
  description: "Block a running agent session (running → blocked).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session to block."),
  }),
});

export const unblock_agent_session = defineAction({
  name: "unblock_agent_session",
  description: "Return a blocked agent session to running (blocked → running).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session to unblock."),
  }),
});

export const cancel_agent_session = defineAction({
  name: "cancel_agent_session",
  description: "Cancel a running or blocked agent session (→ cancelled).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session to cancel."),
  }),
});

export const fail_agent_session = defineAction({
  name: "fail_agent_session",
  description:
    "Fail a starting, running, or blocked agent session (→ failed). Used for guest crash and boot reconciliation.",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session to fail."),
  }),
});

export const close_agent_session = defineAction({
  name: "close_agent_session",
  description: "Close a running, cancelled, or failed agent session (→ closed).",
  lifecycle: "experimental",
  input: z.object({
    session_id: z.string().describe("Agent session to close."),
  }),
});

export const request_approval = defineAction({
  name: "request_approval",
  description: "Request operator approval for a pending context item (L2 gate).",
  lifecycle: "experimental",
  input: z.object({
    subject_ref: z.string().describe("Id of the subject awaiting approval."),
    reason: z.string().describe("Why approval is required."),
  }),
});

export const approve = defineAction({
  name: "approve",
  description: "Approve a pending approval request.",
  lifecycle: "experimental",
  input: z.object({
    request_id: z.string().describe("Approval request id to approve."),
  }),
});

export const deny = defineAction({
  name: "deny",
  description: "Deny a pending approval request.",
  lifecycle: "experimental",
  input: z.object({
    request_id: z.string().describe("Approval request id to deny."),
    reason: z.string().describe("Optional denial reason.").optional(),
  }),
});

export const promote_type = defineAction({
  name: "promote_type",
  description: "Promote a schema type from experimental to active (schema governance action).",
  lifecycle: "experimental",
  input: z.object({
    type_name: z.string().describe("Object, link, or action name to promote."),
  }),
});
