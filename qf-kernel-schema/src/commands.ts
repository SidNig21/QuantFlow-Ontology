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
  // event
  { action: "start_event", type: "event", from: "scheduled", to: "live", event: "event.started" },
  { action: "settle_event", type: "event", from: "live", to: "settled", event: "event.settled" },
  { action: "void_event", type: "event", from: "scheduled", to: "void", event: "event.voided" },
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
