/**
 * WO-008e — spawn four Hermes native_tui seats onto an instance-scoped bus.
 * Proof choreography lives in species/hermes/a2a-proof-script.ts (harness only).
 */
import {
  toCoreSeat,
  type A2aBus,
  type A2aRole,
  type ElectronA2aSeat,
  type PublishAndDeliverResult,
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

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type A2aMovieSummary = {
  dispatchId: string;
  hops: Array<{ hop: string; from: A2aRole; to: A2aRole[]; artifactId: string }>;
};

/**
 * WO-008f (founder button): the four-hop movie, paced so it can be watched
 * landing on live TUI tiles. Bodies are host-choreographed (same scope the
 * WO-008e harness was accepted under); real Hermes-driven replies arrive with
 * Run Workflow v1.
 */
export async function runPacedFourTileMovie(
  bus: A2aBus,
  opts?: { stepMs?: number },
): Promise<A2aMovieSummary> {
  const stepMs = opts?.stepMs ?? 1500;
  const seats = bus.listSeats();
  if (seats.length !== 4) {
    throw new Error(`a2a movie needs 4 seats (have ${seats.length})`);
  }
  bus.setDeliveryEnabled(true);
  const task = "Demo task: each worker returns one short finding labeled A or B.";
  const hops: A2aMovieSummary["hops"] = [];
  const record = (
    hop: string,
    from: A2aRole,
    to: A2aRole[],
    r: PublishAndDeliverResult,
  ) => hops.push({ hop, from, to, artifactId: r.artifactId });

  const fanOut = bus.publishAndDeliver({
    hop: "fan_out",
    fromRole: "orchestrator",
    toRoles: ["worker_a", "worker_b"],
    task,
    body: `TASK from Orchestrator\n${task}`,
  });
  record("fan_out", "orchestrator", ["worker_a", "worker_b"], fanOut);
  await sleep(stepMs);

  const subA = bus.publishAndDeliver({
    hop: "submission",
    fromRole: "worker_a",
    toRoles: ["reviewer"],
    dispatchId: fanOut.dispatchId,
    attr: "A",
    body: "SUBMISSION A\nFINDING A: alpha-ready",
  });
  record("submission", "worker_a", ["reviewer"], subA);
  await sleep(stepMs);

  const subB = bus.publishAndDeliver({
    hop: "submission",
    fromRole: "worker_b",
    toRoles: ["reviewer"],
    dispatchId: fanOut.dispatchId,
    attr: "B",
    body: "SUBMISSION B\nFINDING B: beta-ready",
  });
  record("submission", "worker_b", ["reviewer"], subB);
  await sleep(stepMs);

  const talkBack = bus.publishAndDeliver({
    hop: "talk_back",
    fromRole: "reviewer",
    toRoles: ["orchestrator"],
    dispatchId: fanOut.dispatchId,
    body:
      `REVIEW talk-back to Orchestrator (dispatch=${fanOut.dispatchId})\n` +
      `- Worker A: alpha-ready [artifact ${subA.artifactId.slice(0, 12)}…]\n` +
      `- Worker B: beta-ready [artifact ${subB.artifactId.slice(0, 12)}…]`,
  });
  record("talk_back", "reviewer", ["orchestrator"], talkBack);

  return { dispatchId: fanOut.dispatchId, hops };
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
