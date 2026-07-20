/**
 * WO-008e — spawn four Hermes native_tui seats onto an instance-scoped bus.
 * Proof choreography lives in species/hermes/a2a-proof-script.ts (harness only).
 */
import {
  toCoreSeat,
  type A2aBus,
  type A2aRole,
  type ElectronA2aSeat,
} from "./a2a-bus";
import { admitAndStartSession, cancelAgentSession } from "./agent-host";
import {
  runScriptedFourTileProof,
  type A2aProofScriptResult,
} from "../../../species/hermes/a2a-proof-script.ts";

const ROLES: A2aRole[] = [
  "orchestrator",
  "worker_a",
  "worker_b",
  "reviewer",
];

export type A2aProofResult = A2aProofScriptResult & {
  seats: ElectronA2aSeat[];
  cancelCheck?: {
    cancelledRole: A2aRole;
    remaining: A2aRole[];
  };
};

/** Admit four Hermes native_tui sessions and register them on `bus`. */
export async function spawnA2aFourSeats(
  bus: A2aBus,
  opts?: {
    onTile?: (
      sessionId: string,
      species: string,
      ptySessionId: string,
      role: A2aRole,
    ) => void;
  },
): Promise<ElectronA2aSeat[]> {
  bus.clearSeats();
  const out: ElectronA2aSeat[] = [];
  for (const role of ROLES) {
    const result = await admitAndStartSession("hermes", {
      sessionLabel: `hermes:${role}`,
      onStarted: (sessionId, species, info) => {
        if (info?.surface === "native_tui" && info.ptySessionId) {
          opts?.onTile?.(sessionId, species, info.ptySessionId, role);
        }
      },
    });
    if (result.surface !== "native_tui" || !result.ptySessionId) {
      throw new Error(
        `a2a-orchestra: expected native_tui for ${role}, got ${result.surface}`,
      );
    }
    const seat: ElectronA2aSeat = {
      role,
      sessionId: result.sessionId,
      ptySessionId: result.ptySessionId,
    };
    bus.registerSeat(toCoreSeat(seat));
    out.push(seat);
  }
  return out;
}

/**
 * Harness-only: run the scripted 4-tile movie on an already-spawned bus.
 * Not exposed as product IPC — use spawnSeats + dispatch from the shell.
 */
export async function runA2aFourTileProof(
  bus: A2aBus,
  seats: ElectronA2aSeat[],
  opts?: { cancelOne?: boolean },
): Promise<A2aProofResult> {
  const script = runScriptedFourTileProof(bus);

  let cancelCheck: A2aProofResult["cancelCheck"];
  if (opts?.cancelOne) {
    const victim = seats.find((s) => s.role === "worker_b");
    if (victim) {
      await cancelAgentSession(victim.sessionId);
      cancelCheck = {
        cancelledRole: "worker_b",
        remaining: seats
          .filter((s) => s.role !== "worker_b")
          .map((s) => s.role),
      };
    }
  }

  return { ...script, seats, cancelCheck };
}
