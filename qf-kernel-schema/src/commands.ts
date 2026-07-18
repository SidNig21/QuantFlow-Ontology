/**
 * Command/event split for stateful types.
 * Commands are rejectable intents; events are replayable facts.
 * There is no Receipt type — the event log is the receipt log.
 *
 * Note: `retry_run` / `close_run` exist as schema actions but do not mutate the
 * same run's status under the v0.2 tables (terminals are closed; retry is a new run).
 */
export type CommandDef = {
  name: string;
  type: "run" | "hypothesis" | "ticket" | "event" | "agent_session";
  /** States from which this command may be accepted. */
  from: readonly string[];
  /** State written on success. */
  to: string;
  /** Domain event emitted on success (dotted type.verb). */
  event: string;
  description: string;
};

export const commands: readonly CommandDef[] = [
  // run
  {
    name: "start_run",
    type: "run",
    from: ["queued"],
    to: "running",
    event: "run.started",
    description: "Accept a queued run into the running state.",
  },
  {
    name: "complete_run",
    type: "run",
    from: ["running"],
    to: "succeeded",
    event: "run.succeeded",
    description: "Mark a running run as succeeded.",
  },
  {
    name: "fail_run",
    type: "run",
    from: ["running"],
    to: "failed",
    event: "run.failed",
    description: "Mark a running run as failed.",
  },
  {
    name: "cancel_run",
    type: "run",
    from: ["running"],
    to: "cancelled",
    event: "run.cancelled",
    description: "Cancel a running run.",
  },
  // hypothesis (resolve_hypothesis action chooses among these by input)
  {
    name: "resolve_hypothesis_supported",
    type: "hypothesis",
    from: ["open"],
    to: "supported",
    event: "hypothesis.supported",
    description: "Resolve an open hypothesis as supported (evaluation-gated).",
  },
  {
    name: "resolve_hypothesis_rejected",
    type: "hypothesis",
    from: ["open"],
    to: "rejected",
    event: "hypothesis.rejected",
    description: "Resolve an open hypothesis as rejected (evaluation-gated).",
  },
  {
    name: "resolve_hypothesis_inconclusive",
    type: "hypothesis",
    from: ["open"],
    to: "inconclusive",
    event: "hypothesis.inconclusive",
    description: "Resolve an open hypothesis as inconclusive (evaluation-gated).",
  },
  // ticket (grade field; settlement-backed)
  {
    name: "grade_ticket_win",
    type: "ticket",
    from: ["pending"],
    to: "win",
    event: "ticket.graded",
    description: "Grade a pending ticket as win after result settlement.",
  },
  {
    name: "grade_ticket_loss",
    type: "ticket",
    from: ["pending"],
    to: "loss",
    event: "ticket.graded",
    description: "Grade a pending ticket as loss after result settlement.",
  },
  {
    name: "grade_ticket_push",
    type: "ticket",
    from: ["pending"],
    to: "push",
    event: "ticket.graded",
    description: "Grade a pending ticket as push after result settlement.",
  },
  {
    name: "grade_ticket_void",
    type: "ticket",
    from: ["pending"],
    to: "void",
    event: "ticket.graded",
    description: "Grade a pending ticket as void after result settlement.",
  },
  // event
  {
    name: "start_event",
    type: "event",
    from: ["scheduled"],
    to: "live",
    event: "event.started",
    description: "Move a scheduled event to live.",
  },
  {
    name: "settle_event",
    type: "event",
    from: ["live"],
    to: "settled",
    event: "event.settled",
    description: "Settle a live event.",
  },
  {
    name: "void_event",
    type: "event",
    from: ["scheduled"],
    to: "void",
    event: "event.voided",
    description: "Void a scheduled event that will not be contested.",
  },
  // agent_session
  {
    name: "start_agent_session",
    type: "agent_session",
    from: ["starting"],
    to: "running",
    event: "agent_session.started",
    description: "Bring a starting agent session into running.",
  },
  {
    name: "block_agent_session",
    type: "agent_session",
    from: ["running"],
    to: "blocked",
    event: "agent_session.blocked",
    description: "Block a running agent session (awaiting approval or input).",
  },
  {
    name: "unblock_agent_session",
    type: "agent_session",
    from: ["blocked"],
    to: "running",
    event: "agent_session.unblocked",
    description: "Return a blocked agent session to running.",
  },
  {
    name: "cancel_agent_session",
    type: "agent_session",
    from: ["running", "blocked"],
    to: "cancelled",
    event: "agent_session.cancelled",
    description: "Cancel a running or blocked agent session.",
  },
  {
    name: "fail_agent_session",
    type: "agent_session",
    from: ["running", "blocked"],
    to: "failed",
    event: "agent_session.failed",
    description: "Fail a running or blocked agent session.",
  },
  {
    name: "close_agent_session",
    type: "agent_session",
    from: ["running", "cancelled", "failed"],
    to: "closed",
    event: "agent_session.closed",
    description: "Close a running, cancelled, or failed agent session.",
  },
] as const;
