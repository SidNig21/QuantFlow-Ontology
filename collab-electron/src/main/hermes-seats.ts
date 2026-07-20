/**
 * Host-fixed Hermes seat registry (peer-bus canvas PASS).
 * Renderer may send seatId only — never free-text argv/env.
 */

export type HermesSeatId = "orchestrator" | "worker";

export type HermesSeatSpec = {
  seatId: HermesSeatId;
  profile: string;
  /** Host-only argv after the Hermes binary. */
  argv: string[];
  /** Kernel agent_session.label */
  sessionLabel: string;
  /** PTY / term-tile chrome title */
  displayName: string;
};

const SEATS: Record<HermesSeatId, HermesSeatSpec> = {
  orchestrator: {
    seatId: "orchestrator",
    profile: "qf-orchestrator",
    argv: ["-p", "qf-orchestrator", "--tui"],
    sessionLabel: "Hermes Orchestrator",
    displayName: "Hermes Orchestrator",
  },
  worker: {
    seatId: "worker",
    profile: "qf-worker",
    argv: ["-p", "qf-worker", "--tui"],
    sessionLabel: "Hermes Worker",
    displayName: "Hermes Worker",
  },
};

export function isHermesSeatId(value: unknown): value is HermesSeatId {
  return value === "orchestrator" || value === "worker";
}

/** Allowlisted seat only — unknown ids throw. */
export function resolveHermesSeat(seatId: unknown): HermesSeatSpec {
  if (!isHermesSeatId(seatId)) {
    throw new Error(
      `hermes-seats: unknown seatId ${JSON.stringify(seatId)} (want orchestrator|worker)`,
    );
  }
  return SEATS[seatId];
}

export function listHermesSeats(): HermesSeatSpec[] {
  return Object.values(SEATS);
}
