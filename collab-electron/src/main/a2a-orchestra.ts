/**
 * WO-008e — spawn four Hermes native_tui seats and run fan-out → fan-in → talk-back.
 */
import {
  clearA2aSeats,
  getA2aSeat,
  listA2aSeats,
  publishAndDeliver,
  registerA2aSeat,
  setA2aDeliveryEnabled,
  type A2aRole,
  type A2aSeat,
} from "./a2a-bus";
import { admitAndStartSession, cancelAgentSession } from "./agent-host";

const ROLES: A2aRole[] = [
  "orchestrator",
  "worker_a",
  "worker_b",
  "reviewer",
];

const TASK =
  "WO-008e demo task: each worker returns one short finding labeled A or B.";

export type A2aProofResult = {
  seats: A2aSeat[];
  fanOut: {
    artifactId: string;
    dispatchId: string;
    deliveredAt: Record<string, string>;
  };
  submissions: {
    worker_a: { artifactId: string };
    worker_b: { artifactId: string };
  };
  talkBack: { artifactId: string; dispatchId: string };
  falsify: {
    redSkipped: string[];
    greenDelivered: Record<string, string>;
  };
  cancelCheck?: {
    cancelledRole: A2aRole;
    remaining: A2aRole[];
  };
};

/** Admit four Hermes native_tui sessions and register A2A seats. */
export async function spawnA2aFourSeats(opts?: {
  onTile?: (
    sessionId: string,
    species: string,
    ptySessionId: string,
    role: A2aRole,
  ) => void;
}): Promise<A2aSeat[]> {
  clearA2aSeats();
  const out: A2aSeat[] = [];
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
    const seat: A2aSeat = {
      role,
      sessionId: result.sessionId,
      ptySessionId: result.ptySessionId,
    };
    registerA2aSeat(seat);
    out.push(seat);
  }
  return out;
}

/**
 * Full proof: fan-out (one dispatch → A+B), submissions → reviewer, talk-back,
 * then falsify delivery off/on. Optional cancel of worker_b for orphan check.
 */
export async function runA2aFourTileProof(opts?: {
  cancelOne?: boolean;
}): Promise<A2aProofResult> {
  const seats = listA2aSeats();
  if (seats.length !== 4) {
    throw new Error(
      `a2a-orchestra: need 4 seats registered (have ${seats.length}) — spawn first`,
    );
  }

  setA2aDeliveryEnabled(true);

  const fanOut = publishAndDeliver({
    hop: "fan_out",
    fromRole: "orchestrator",
    toRoles: ["worker_a", "worker_b"],
    task: TASK,
    body: `TASK from Orchestrator\n${TASK}\nRespond with one line: FINDING <A|B>: …`,
  });

  const sessionA = getA2aSeat("worker_a")!.sessionId;
  const sessionB = getA2aSeat("worker_b")!.sessionId;

  const subA = publishAndDeliver({
    hop: "submission",
    fromRole: "worker_a",
    toRoles: ["reviewer"],
    dispatchId: fanOut.dispatchId,
    attr: "A",
    body: `SUBMISSION A (session=${sessionA})\nFINDING A: alpha-ready`,
  });

  const subB = publishAndDeliver({
    hop: "submission",
    fromRole: "worker_b",
    toRoles: ["reviewer"],
    dispatchId: fanOut.dispatchId,
    attr: "B",
    body: `SUBMISSION B (session=${sessionB})\nFINDING B: beta-ready`,
  });

  const talkBack = publishAndDeliver({
    hop: "talk_back",
    fromRole: "reviewer",
    toRoles: ["orchestrator"],
    dispatchId: fanOut.dispatchId,
    body:
      `REVIEW talk-back to Orchestrator (dispatch=${fanOut.dispatchId})\n` +
      `- Worker A (${sessionA}): alpha-ready [artifact ${subA.artifactId.slice(0, 12)}…]\n` +
      `- Worker B (${sessionB}): beta-ready [artifact ${subB.artifactId.slice(0, 12)}…]\n` +
      `Both attributed; no guest side-channel.`,
  });

  setA2aDeliveryEnabled(false);
  const red = publishAndDeliver({
    hop: "fan_out",
    fromRole: "orchestrator",
    toRoles: ["worker_a", "worker_b"],
    task: "falsify-should-be-silent",
    body: "FALSIFY MARKER — must not appear if delivery off",
  });
  setA2aDeliveryEnabled(true);
  const green = publishAndDeliver({
    hop: "fan_out",
    fromRole: "orchestrator",
    toRoles: ["worker_a", "worker_b"],
    task: "falsify-restore",
    body: "RESTORE MARKER — delivery back on",
  });

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

  return {
    seats,
    fanOut: {
      artifactId: fanOut.artifactId,
      dispatchId: fanOut.dispatchId,
      deliveredAt: fanOut.deliveredAt,
    },
    submissions: {
      worker_a: { artifactId: subA.artifactId },
      worker_b: { artifactId: subB.artifactId },
    },
    talkBack: {
      artifactId: talkBack.artifactId,
      dispatchId: talkBack.dispatchId,
    },
    falsify: {
      redSkipped: red.skipped,
      greenDelivered: green.deliveredAt,
    },
    cancelCheck,
  };
}
