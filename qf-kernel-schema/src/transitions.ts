/**
 * Legal state-transition tables for stateful ontology types (§State machines).
 * Terminal states map to []. Every status/grade enum value must appear as a key.
 */
export const transitions = {
  run: {
    queued: ["running"],
    running: ["succeeded", "failed", "cancelled"],
    succeeded: [],
    failed: [],
    cancelled: [],
  },
  hypothesis: {
    open: ["supported", "rejected", "inconclusive"],
    supported: [],
    rejected: [],
    inconclusive: [],
  },
  ticket: {
    pending: ["win", "loss", "push", "void"],
    win: [],
    loss: [],
    push: [],
    void: [],
  },
  event: {
    scheduled: ["live", "void"],
    live: ["settled"],
    settled: [],
    void: [],
  },
  agent_session: {
    starting: ["running", "failed"],
    running: ["blocked", "cancelled", "failed", "closed"],
    blocked: ["running", "cancelled", "failed"],
    cancelled: ["closed"],
    failed: ["closed"],
    closed: [],
  },
} as const;

export type StatefulType = keyof typeof transitions;
export type Transitions = typeof transitions;
