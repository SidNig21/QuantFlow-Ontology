import { transitions, type StatefulType } from "./transitions.ts";

/**
 * Transition commands — derived from `transitions` (one row per legal edge).
 * `action` MUST name a schema action. The Kernel executes these; MCP invents nothing else.
 * There is no Receipt type — success appends the listed event to the Kernel event log.
 */
export type TransitionCommand = {
  /** Schema action name (must exist in schema.actions). */
  action: string;
  type: StatefulType;
  from: string;
  to: string;
  /** Domain event emitted on success (dotted type.verb). */
  event: string;
};

/**
 * Exhaustive edge catalog. Maintained as the join of transitions ↔ schema.actions;
 * `lintCommands` fails the build if an edge lacks a command or a command invents an action.
 */
export const commands: readonly TransitionCommand[] = [
  // run
  { action: "start_run", type: "run", from: "queued", to: "running", event: "run.started" },
  { action: "complete_run", type: "run", from: "running", to: "succeeded", event: "run.succeeded" },
  { action: "fail_run", type: "run", from: "running", to: "failed", event: "run.failed" },
  { action: "cancel_run", type: "run", from: "running", to: "cancelled", event: "run.cancelled" },
  // hypothesis (status chosen by input; same action covers three edges)
  {
    action: "resolve_hypothesis",
    type: "hypothesis",
    from: "open",
    to: "supported",
    event: "hypothesis.supported",
  },
  {
    action: "resolve_hypothesis",
    type: "hypothesis",
    from: "open",
    to: "rejected",
    event: "hypothesis.rejected",
  },
  {
    action: "resolve_hypothesis",
    type: "hypothesis",
    from: "open",
    to: "inconclusive",
    event: "hypothesis.inconclusive",
  },
  // ticket (grade chosen by input)
  { action: "grade_ticket", type: "ticket", from: "pending", to: "win", event: "ticket.graded" },
  { action: "grade_ticket", type: "ticket", from: "pending", to: "loss", event: "ticket.graded" },
  { action: "grade_ticket", type: "ticket", from: "pending", to: "push", event: "ticket.graded" },
  { action: "grade_ticket", type: "ticket", from: "pending", to: "void", event: "ticket.graded" },
  // market_event
  {
    action: "start_event",
    type: "market_event",
    from: "scheduled",
    to: "live",
    event: "market_event.started",
  },
  {
    action: "settle_event",
    type: "market_event",
    from: "live",
    to: "settled",
    event: "market_event.settled",
  },
  {
    action: "void_event",
    type: "market_event",
    from: "scheduled",
    to: "void",
    event: "market_event.voided",
  },
  // agent_session
  {
    action: "start_agent_session",
    type: "agent_session",
    from: "starting",
    to: "running",
    event: "agent_session.started",
  },
  {
    action: "block_agent_session",
    type: "agent_session",
    from: "running",
    to: "blocked",
    event: "agent_session.blocked",
  },
  {
    action: "unblock_agent_session",
    type: "agent_session",
    from: "blocked",
    to: "running",
    event: "agent_session.unblocked",
  },
  {
    action: "cancel_agent_session",
    type: "agent_session",
    from: "running",
    to: "cancelled",
    event: "agent_session.cancelled",
  },
  {
    action: "cancel_agent_session",
    type: "agent_session",
    from: "blocked",
    to: "cancelled",
    event: "agent_session.cancelled",
  },
  {
    action: "fail_agent_session",
    type: "agent_session",
    from: "starting",
    to: "failed",
    event: "agent_session.failed",
  },
  {
    action: "fail_agent_session",
    type: "agent_session",
    from: "running",
    to: "failed",
    event: "agent_session.failed",
  },
  {
    action: "fail_agent_session",
    type: "agent_session",
    from: "blocked",
    to: "failed",
    event: "agent_session.failed",
  },
  {
    action: "close_agent_session",
    type: "agent_session",
    from: "running",
    to: "closed",
    event: "agent_session.closed",
  },
  {
    action: "close_agent_session",
    type: "agent_session",
    from: "cancelled",
    to: "closed",
    event: "agent_session.closed",
  },
  {
    action: "close_agent_session",
    type: "agent_session",
    from: "failed",
    to: "closed",
    event: "agent_session.closed",
  },
  // task
  {
    action: "complete_task",
    type: "task",
    from: "open",
    to: "done",
    event: "task.completed",
  },
  {
    action: "reassign_task",
    type: "task",
    from: "open",
    to: "open",
    event: "task.reassigned",
  },
  {
    action: "cancel_task",
    type: "task",
    from: "open",
    to: "cancelled",
    event: "task.cancelled",
  },
] as const;

/**
 * Creation commands — bring an object into existence (no from→to edge).
 * `action` MUST name a schema action. Lint joins these to schema.actions without
 * relaxing the transition-edge coverage rules.
 */
export type CreationCommand = {
  action: string;
  /** Ontology object table the command inserts into. */
  object_type: string;
  /** Domain event emitted on success (dotted type.verb). */
  event: string;
};

export const creationCommands: readonly CreationCommand[] = [
  {
    action: "register_venue",
    object_type: "venue",
    event: "venue.registered",
  },
  {
    action: "schedule_market_event",
    object_type: "market_event",
    event: "market_event.scheduled",
  },
  {
    action: "publish_artifact",
    object_type: "artifact",
    event: "artifact.published",
  },
  {
    action: "create_agent_session",
    object_type: "agent_session",
    event: "agent_session.created",
  },
  {
    action: "create_task",
    object_type: "task",
    event: "task.created",
  },
  {
    action: "register_agent_definition",
    object_type: "agent_definition",
    event: "agent_definition.registered",
  },
  {
    action: "create_hypothesis",
    object_type: "hypothesis",
    event: "hypothesis.created",
  },
  {
    action: "register_dataset_version",
    object_type: "dataset",
    event: "dataset.registered",
  },
  {
    action: "create_run",
    object_type: "run",
    event: "run.created",
  },
  {
    action: "execute_deterministic_run",
    object_type: "run",
    event: "run.succeeded",
  },
  {
    action: "record_evaluation",
    object_type: "evaluation",
    event: "evaluation.recorded",
  },
  {
    action: "create_mission",
    object_type: "mission",
    event: "mission.created",
  },
  {
    action: "create_ticket",
    object_type: "ticket",
    event: "ticket.created",
  },
  {
    action: "observe_ticket",
    object_type: "ticket",
    event: "ticket.observed",
  },
  {
    action: "create_connection",
    object_type: "connection",
    event: "connection.created",
  },
  {
    action: "delete_connection",
    object_type: "connection",
    event: "connection.deleted",
  },
] as const;

/**
 * Pipeline commands — atomically ingest one batch spanning declared pipeline-fed types.
 * `rows` is the schema-owned object/event map; the Kernel dispatches by `action` and
 * derives row events from this catalog rather than inventing a parallel runtime map.
 */
export type PipelineCommand = {
  action: string;
  rows: readonly {
    /** Pipeline-fed ontology object table populated by this command. */
    object_type: string;
    /** Domain event emitted once for each newly ingested row. */
    event: string;
  }[];
};

export const pipelineCommands: readonly PipelineCommand[] = [
  {
    action: "ingest_market_batch",
    rows: [
      { object_type: "instrument", event: "instrument.ingested" },
      { object_type: "quote", event: "quote.ingested" },
    ],
  },
] as const;

/** App-owned commands. These are Kernel actions, but never agent/model tools. */
export const internalCommands: readonly { action: string }[] = [
  { action: "clarify_task" },
  { action: "redirect_task" },
  { action: "record_task_steering_delivery" },
  { action: "record_task_steering_refusal" },
  { action: "record_task_cancel_outcome" },
  { action: "request_second_opinion" },
  { action: "governed_review_task" },
  { action: "record_strategy_outcome" },
] as const;

/** All legal (type, from, to) edges from the transition tables. */
export function allTransitionEdges(): Array<{ type: StatefulType; from: string; to: string }> {
  const edges: Array<{ type: StatefulType; from: string; to: string }> = [];
  for (const type of Object.keys(transitions) as StatefulType[]) {
    const table = transitions[type] as Record<string, readonly string[]>;
    for (const [from, tos] of Object.entries(table)) {
      for (const to of tos) {
        edges.push({ type, from, to });
      }
    }
  }
  return edges;
}
