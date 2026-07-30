import { z } from "zod";
import { defineAction, defineLink, defineObject } from "../define.ts";

// ── Agent plane ─────────────────────────────────────────────────────────────

export const workspace = defineObject({
  name: "workspace",
  description:
    "A workspace is the operator-visible canvas container for one research effort. It governs spatial context and should not be overloaded with mission semantics.",
  lifecycle: "experimental",
  properties: z.object({
    name: z
      .string()
      .describe(
        "Short workspace slug shown in compact UI surfaces. Keep it stable so linked session labels and automation references do not drift.",
      ),
    title: z
      .string()
      .describe(
        "Long human-readable heading for the workspace. Use this for operator readability while keeping machine references on name.",
      ),
  }),
});

export const agent_definition = defineObject({
  name: "agent_definition",
  description:
    "An agent_definition is one founder-visible Dock profile. It governs spawn admission through package_ref while runtime_profile selects the adapter profile without encoding per-session state.",
  lifecycle: "experimental",
  properties: z.object({
    name: z
      .string()
      .describe(
        "Canonical profile identifier used when requesting a spawn. Treat this as stable API surface for orchestration and routing rules.",
      ),
    role: z
      .string()
      .describe(
        "Role summary used for planner routing and prompt selection. Keep role labels aligned with actual task boundaries, not model branding.",
      ),
    package_ref: z
      .string()
      .describe(
        "Reusable runtime package reference that resolves to executable code. Several profiles may share one package_ref without sharing identity.",
      ),
    system_prompt_ref: z
      .string()
      .describe(
        "Artifact or prompt identifier containing this profile's operating instructions. Point to immutable prompt bytes so behavior drift can be audited.",
      )
      .nullable(),
    // Appended after the pre-D1 columns so ALTER TABLE and fresh migration
    // produce one canonical SQLite column order.
    runtime_profile: z
      .string()
      .describe(
        "Optional runtime adapter profile selector (for example a Hermes profile name). Never a path to profile home or credential-bearing configuration.",
      )
      .nullable(),
  }),
});

export const agent_session = defineObject({
  name: "agent_session",
  description:
    "An agent_session is one durable live seat identity on the canvas. It governs operational lifecycle only and must never store model-internal reasoning states.",
  lifecycle: "experimental",
  properties: z.object({
    status: z
      .enum(["starting", "running", "blocked", "cancelled", "failed", "closed"])
      .describe(
        "Operational lifecycle state enforced by transition policy. Status transitions must follow the transition table rather than ad-hoc writes.",
      ),
    label: z
      .string()
      .describe(
        "Optional operator-facing label for this live session. Use it for readability only; lifecycle and routing authority remain on stable ids.",
      )
      .nullable(),
  }),
});

export const task = defineObject({
  name: "task",
  description:
    "A task is a discrete unit of requested work tracked on the canvas. It governs delegation by linking intent to the session that owns execution.",
  lifecycle: "experimental",
  properties: z.object({
    title: z
      .string()
      .describe(
        "Short task title visible to operators and agents. Keep this outcome-oriented so routing can prioritize without opening full context.",
      ),
    description: z
      .string()
      .describe(
        "Completion contract for this task. Write it so a verifier can decide done versus not-done from observable evidence.",
      ),
  }),
});

export const tool = defineObject({
  name: "tool",
  description:
    "A tool is an MCP-exposed capability agents can invoke. It governs action surface by keeping work on declared tools instead of ad-hoc side channels.",
  lifecycle: "experimental",
  properties: z.object({
    name: z
      .string()
      .describe(
        "Tool identifier exposed to agents (typically qf_*). Keep naming stable because prompts and automations may reference it directly.",
      ),
    summary: z
      .string()
      .describe(
        "One-line capability summary for agent selection. Explain what decision this tool enables, not just its transport mechanism.",
      ),
  }),
});

export const execution_environment = defineObject({
  name: "execution_environment",
  description:
    "An execution_environment identifies where a run actually executes. It governs reproducibility by separating runtime substrate from run intent.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .enum(["local_process", "local_python", "cloudflare_sandbox"])
      .describe(
        "Execution substrate category used by runs linked through executes_in. Choose the narrowest accurate kind so failure domains stay interpretable.",
      ),
    label: z
      .string()
      .describe(
        "Operator-facing name for this environment instance. Keep labels specific enough to distinguish local and remote contexts at a glance.",
      ),
  }),
});

export const connection = defineObject({
  name: "connection",
  description:
    "A connection is a typed edge between canvas tiles. It governs projection wiring only and must never become an independent truth store.",
  lifecycle: "experimental",
  properties: z.object({
    kind: z
      .string()
      .describe(
        "Connection category such as data, control, or view. Use a constrained vocabulary in higher layers so traversal semantics stay predictable.",
      ),
    from_ref: z
      .string()
      .describe(
        "Source tile or object identifier for this connection. It should reference existing canvas entities rather than inferred placeholders.",
      ),
    to_ref: z
      .string()
      .describe(
        "Target tile or object identifier for this connection. Keep directional intent explicit so reverse traversals are computed, not guessed.",
      ),
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

export const spawned_from = defineLink({
  name: "spawned_from",
  description:
    "Session identity: which agent_definition profile created this agent_session.",
  lifecycle: "experimental",
  from: agent_session,
  to: agent_definition,
});

export const register_agent_definition = defineAction({
  name: "register_agent_definition",
  description:
    "Register a Dock profile in the Kernel registry (id = name). Duplicate names are rejected; operator-only because it controls package_ref and runtime_profile.",
  lifecycle: "experimental",
  operatorOnly: true,
  input: z.object({
    name: z.string().describe("Unique profile name; becomes the row id."),
    role: z
      .string()
      .describe("Role summary (researcher, critic, backtester, ingestion) for routing and prompts."),
    package_ref: z
      .string()
      .describe("Runtime package this profile launches — the reusable executable half of the row."),
    runtime_profile: z
      .string()
      .describe(
        "Optional runtime adapter profile selector. Omission stores null; empty or whitespace-only input is rejected.",
      )
      .nullable()
      .optional(),
    system_prompt_ref: z
      .string()
      .describe("Artifact or prompt id that defines this profile's instructions.")
      .nullable()
      .optional(),
  }),
});

export const create_agent_session = defineAction({
  name: "create_agent_session",
  description:
    "Create an agent_session by adopting a guest-minted session_id (Kernel never mints). Requires agent_definition_id and atomically links spawned_from; label is presentation-only.",
  lifecycle: "experimental",
  input: z.object({
    session_id: z
      .string()
      .describe("Guest-minted ACP session id — adopted as the Kernel row id, never re-minted."),
    agent_definition_id: z
      .string()
      .describe(
        "Existing agent_definition row id for the profile that admitted this session. Identity lives in spawned_from, not label.",
      ),
    label: z
      .string()
      .describe("Optional operator-facing label for readability only; never the profile identity.")
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
    reason: z
      .string()
      .optional()
      .describe(
        "Diagnostic label for why the session failed (crash code, stop reason, or boot reconciliation). Optional; recorded in the event payload when supplied and does not affect transition legality.",
      ),
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
