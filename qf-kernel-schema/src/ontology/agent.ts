import { z } from "zod";
import { defineAction, defineLink, defineObject } from "../define.ts";

// ── Agent plane ─────────────────────────────────────────────────────────────

export const workspace = defineObject({
  name: "workspace",
  description:
    "A workspace is the operator-visible canvas container for one research effort. It governs spatial context and should not be overloaded with mission semantics.",
  lifecycle: "experimental",
  capabilityGroup: "desk.orchestrate",
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
  capabilityGroup: "desk.orchestrate",
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
    capability_groups: z
      .array(z.enum(["market.read", "desk.orchestrate", "research.evaluate"]))
      .describe(
        "Capability groups this Dock profile may invoke through the app-owned ontology gateway. Grant groups only — never tool names — so new schema objects join their group without a hand-edited roster.",
      ),
    display_name: z
      .string()
      .describe(
        "Founder-facing Dock role label. Production profiles use exactly Market Researcher, Orchestrator, or Critic; never expose a machine id as the primary label.",
      ),
  }),
});

export const agent_session = defineObject({
  name: "agent_session",
  description:
    "An agent_session is one durable live seat identity on the canvas. It governs operational lifecycle only and must never store model-internal reasoning states.",
  lifecycle: "experimental",
  capabilityGroup: "desk.orchestrate",
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
  capabilityGroup: "desk.orchestrate",
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
    status: z
      .enum(["open", "done", "cancelled"])
      .describe(
        "Lifecycle state of this task on the canvas. Transitions must go through the Kernel write path — never ad-hoc SQL — so reopen always sees Kernel truth.",
      ),
  }),
});

export const tool = defineObject({
  name: "tool",
  description:
    "A tool is an MCP-exposed capability agents can invoke. It governs action surface by keeping work on declared tools instead of ad-hoc side channels.",
  lifecycle: "experimental",
  capabilityGroup: "desk.orchestrate",
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
  capabilityGroup: "desk.orchestrate",
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
  capabilityGroup: "desk.orchestrate",
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

export const delegated_by = defineLink({
  name: "delegated_by",
  description:
    "Task provenance: which admitted agent session delegated a task. It is written only from trusted execution context so callers cannot forge responsibility.",
  lifecycle: "experimental",
  from: task,
  to: agent_session,
});

export const delegates_to = defineLink({
  name: "delegates_to",
  description:
    "Hire provenance: which admitted orchestrator created an agent session. It authorizes worker ownership only; task cables must use task delegated_by and assigned_to links.",
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
    capability_groups: z
      .array(z.enum(["market.read", "desk.orchestrate", "research.evaluate"]))
      .describe(
        "Capability groups this profile may invoke through the ontology gateway. Grant groups only — never individual tool names.",
      )
      .optional(),
    display_name: z
      .string()
      .describe(
        "Founder-facing Dock role label. Production profiles use exactly Market Researcher, Orchestrator, or Critic.",
      )
      .optional(),
  }),
});

export const create_agent_session = defineAction({
  name: "create_agent_session",
  description:
    "Create an agent_session by adopting a guest-minted session_id (Kernel never mints). Requires agent_definition_id and atomically links spawned_from; label is presentation-only.",
  lifecycle: "experimental",
  capabilityGroup: "desk.orchestrate",
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
  capabilityGroup: "desk.orchestrate",
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

export const create_task = defineAction({
  name: "create_task",
  description:
    "Create an open task with one trusted delegator and one assignee. The Kernel writes delegated_by and assigned_to atomically; callers cannot supply either identity link.",
  lifecycle: "experimental",
  capabilityGroup: "desk.orchestrate",
  input: z.object({
    task_id: z
      .string()
      .describe("Guest-minted task id — adopted as the Kernel row id, never re-minted."),
    title: z.string().describe("Short outcome-oriented title for the task."),
    description: z
      .string()
      .describe("Completion contract a verifier can judge from observable evidence."),
    assignee_session_id: z
      .string()
      .describe("Existing agent_session id that owns execution; written as assigned_to."),
  }),
});

export const complete_task = defineAction({
  name: "complete_task",
  description:
    "Complete an open task with its durable result artifact. The Kernel accepts it only when trusted worker context owns the assignment and the result derives from that worker's Kernel-receipted generated ontology read.",
  lifecycle: "experimental",
  capabilityGroup: "desk.orchestrate",
  input: z.object({
    task_id: z.string().describe("Task id to complete."),
    result_artifact_id: z
      .string()
      .describe("Canonical result trajectory artifact that proves this task's completion lineage."),
  }),
});

export const reassign_task = defineAction({
  name: "reassign_task",
  description:
    "Move an open task to a different running agent_session while preserving its trusted delegator and receipt provenance.",
  lifecycle: "experimental",
  capabilityGroup: "desk.orchestrate",
  input: z.object({
    task_id: z.string().describe("Open task id to move."),
    assignee_session_id: z
      .string()
      .describe("Different running agent_session that will own the task."),
  }),
});

export const cancel_task = defineAction({
  name: "cancel_task",
  description:
    "Cancel an open task without deleting its trusted delegator or assignee provenance links.",
  lifecycle: "experimental",
  capabilityGroup: "desk.orchestrate",
  input: z.object({
    task_id: z.string().describe("Open task id to cancel."),
  }),
});

const steeringInput = {
  task_id: z.string().describe("Original open Task id whose current work is being steered."),
  instruction: z.string().describe("Founder instruction, normalized to LF and bounded to 4,096 UTF-8 bytes."),
};

export const clarify_task = defineAction({
  name: "clarify_task",
  description: "Append bounded founder context to an open Director-delegated Task without changing its durable description.",
  lifecycle: "experimental",
  internalOnly: true,
  input: z.object(steeringInput),
});

export const redirect_task = defineAction({
  name: "redirect_task",
  description: "Replace an open Director-delegated Task description while retaining the previous description in the receipt log.",
  lifecycle: "experimental",
  internalOnly: true,
  input: z.object(steeringInput),
});

export const record_task_steering_delivery = defineAction({
  name: "record_task_steering_delivery",
  description: "Record the host delivery outcome for one accepted Task steering event, deriving all identity fields from that event.",
  lifecycle: "experimental",
  internalOnly: true,
  input: z.object({
    accepted_event_id: z.string().describe("Kernel event id of the accepted steering, reassignment, or second-opinion event."),
    outcome: z.enum(["delivered", "delivery_failed"]).describe("Whether the captured runtime boundary accepted the one delivery attempt."),
  }),
});

export const record_task_steering_refusal = defineAction({
  name: "record_task_steering_refusal",
  description: "Record one refused founder Task action with its canonical reason and derived founder-visible message.",
  lifecycle: "experimental",
  internalOnly: true,
  input: z.object({
    attempt_id: z.string().describe("Electron-generated UUID for this visible submit attempt."),
    attempted_action: z.enum(["clarify", "redirect", "reassign", "cancel", "second_opinion"]).describe("Visible action the founder attempted."),
    task_id: z.string().nullable().optional().describe("Optional original Task id, when the submit named one."),
    reason_code: z.enum([
      "TASK_NOT_FOUND", "TASK_NOT_OPEN", "ACTOR_NOT_DELEGATOR", "ASSIGNMENT_CARDINALITY",
      "ASSIGNEE_NOT_RUNNING", "INSTRUCTION_EMPTY", "INSTRUCTION_TOO_LARGE",
      "INSTRUCTION_CONTROL_BYTES", "REASSIGN_NOOP", "REASSIGN_TARGET_NOT_RUNNING",
      "CRITIC_DEFINITION_UNAVAILABLE", "CRITIC_SESSION_AMBIGUOUS",
      "SECOND_OPINION_ALREADY_OPEN", "CANCEL_ALREADY_FINAL",
    ]).describe("Canonical Kernel refusal code."),
  }),
});

export const record_task_cancel_outcome = defineAction({
  name: "record_task_cancel_outcome",
  description: "Record the one host outcome after an accepted Task cancellation, deriving the target from the cancellation event.",
  lifecycle: "experimental",
  internalOnly: true,
  input: z.object({
    accepted_event_id: z.string().describe("Kernel event id of the accepted task.cancelled event."),
    outcome: z.enum(["runtime_stopped", "already_stopped", "stop_failed"]).describe("Governed host cancellation outcome."),
    error_class: z.string().nullable().optional().describe("Non-secret error class when stop_failed; omitted for successful outcomes."),
  }),
});

export const request_second_opinion = defineAction({
  name: "request_second_opinion",
  description: "Create exactly one open review Task assigned to a captured production Critic session for the original open Task.",
  lifecycle: "experimental",
  internalOnly: true,
  input: z.object({
    task_id: z.string().describe("Original open Task id to review."),
    critic_session_id: z.string().describe("Running production hermes-critic session captured by the host."),
  }),
});

export const governed_review_task = defineAction({
  name: "governed_review_task",
  description: "Own the governed review Task lifecycle mutation for Kernel-internal admission and delivery.",
  lifecycle: "experimental",
  internalOnly: true,
  input: z.object({
    operation: z.enum(["admit", "deliver", "fail_completion", "bind_source_work", "record_tool_receipt"]).describe("Internal governed review Task operation; every support write is dispatched through this action."),
    action_kind: z.enum(["request_review", "request_revision", "second_critic"]).optional().describe("Governed admission mode; required for admission."),
    source_task_id: z.string().optional().describe("Immutable source Task id for governed admission."),
    source_work: z.unknown().optional().describe("Kernel-frozen source-work tuple supplied by the public adapter."),
    attempt_id: z.string().optional().describe("Idempotency key for one governed admission attempt."),
    critic_session_id: z.string().nullable().optional().describe("Captured production critic session for review admission."),
    triggering_evaluation_id: z.string().nullable().optional().describe("Exact non-supporting Evaluation that authorizes a follow-up."),
    review_task_id: z.string().optional().describe("Governed review Task id for delivery."),
    outcome: z.enum(["delivered", "failed"]).optional().describe("Host delivery outcome for the governed review Task."),
    reason_code: z.string().optional().describe("Stable failure code when a running critic cannot complete its Evaluation."),
    message: z.string().optional().describe("Non-secret operator-readable completion failure message."),
    invocation_id: z.string().optional().describe("Stable broker invocation id for one governed critic tool receipt."),
    session_id: z.string().optional().describe("Admitted critic session that produced the tool receipt."),
    task_id: z.string().optional().describe("Governed review Task id that owns the tool receipt."),
    tool_name: z.string().optional().describe("Exact governed critic tool name recorded by the Kernel."),
    arguments: z.record(z.string(), z.unknown()).optional().describe("JSON object of tool arguments; never a second receipt store."),
    result: z.unknown().optional().describe("Tool result payload recorded in the governed invocation receipt."),
    success: z.boolean().optional().describe("Whether the governed tool call succeeded; omitted means success."),
    broker_sequence: z.number().int().positive().optional().describe("Positive broker sequence that orders this receipt within the critic session."),
  }),
});

export const create_connection = defineAction({
  name: "create_connection",
  description:
    "Create a typed canvas connection edge (kind data|control|view) between two port refs. It persists projection wiring only through the Kernel command path — never a second truth store or a self-loop.",
  lifecycle: "experimental",
  capabilityGroup: "desk.orchestrate",
  input: z.object({
    connection_id: z
      .string()
      .describe("Guest-minted connection id — adopted as the Kernel row id, never re-minted."),
    kind: z
      .enum(["data", "control", "view"])
      .describe(
        "Connection kind. view is inert UI wiring; data and control grant runtime obligations and must not be implied by the renderer alone.",
      ),
    from_ref: z
      .string()
      .describe(
        "Source port id as tileId:side (n|e|s|w). Must name a different tile than to_ref.",
      ),
    to_ref: z
      .string()
      .describe(
        "Target port id as tileId:side (n|e|s|w). Duplicate from/to/kind triples are rejected.",
      ),
  }),
});

export const delete_connection = defineAction({
  name: "delete_connection",
  description:
    "Delete a connection row by id and append connection.deleted. Hard delete only — the ontology has no tombstone field, and canvas persistence must never keep the edge.",
  lifecycle: "experimental",
  capabilityGroup: "desk.orchestrate",
  input: z.object({
    connection_id: z.string().describe("Existing connection id to remove."),
  }),
});
