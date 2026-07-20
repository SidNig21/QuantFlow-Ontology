/**
 * WO-008e scripted 4-tile hop movie — harness only, not product IPC.
 */
import {
  assertFanOutSimultaneous,
  type A2aBus,
  type A2aRole,
  type PublishAndDeliverResult,
} from "./a2a-core.ts";

const TASK =
  "WO-008e demo task: each worker returns one short finding labeled A or B.";

export type A2aProofScriptResult = {
  fanOut: PublishAndDeliverResult;
  submissions: {
    worker_a: PublishAndDeliverResult;
    worker_b: PublishAndDeliverResult;
  };
  talkBack: PublishAndDeliverResult;
  falsify: {
    red: PublishAndDeliverResult;
    green: PublishAndDeliverResult;
  };
};

/**
 * Fan-out → submissions → talk-back → delivery off/on falsify.
 * Host impersonates hop bodies (allowed for the order's harness).
 */
export function runScriptedFourTileProof(
  bus: A2aBus,
): A2aProofScriptResult {
  const seats = bus.listSeats();
  if (seats.length !== 4) {
    throw new Error(
      `a2a-proof-script: need 4 seats (have ${seats.length})`,
    );
  }

  bus.setDeliveryEnabled(true);

  const fanOut = bus.publishAndDeliver({
    hop: "fan_out",
    fromRole: "orchestrator",
    toRoles: ["worker_a", "worker_b"],
    task: TASK,
    body: `TASK from Orchestrator\n${TASK}\nRespond with one line: FINDING <A|B>: …`,
  });
  assertFanOutSimultaneous(fanOut, ["worker_a", "worker_b"]);

  const sessionA = bus.getSeat("worker_a")!.sessionId;
  const sessionB = bus.getSeat("worker_b")!.sessionId;

  const subA = bus.publishAndDeliver({
    hop: "submission",
    fromRole: "worker_a",
    toRoles: ["reviewer"],
    dispatchId: fanOut.dispatchId,
    attr: "A",
    body: `SUBMISSION A (session=${sessionA})\nFINDING A: alpha-ready`,
  });

  const subB = bus.publishAndDeliver({
    hop: "submission",
    fromRole: "worker_b",
    toRoles: ["reviewer"],
    dispatchId: fanOut.dispatchId,
    attr: "B",
    body: `SUBMISSION B (session=${sessionB})\nFINDING B: beta-ready`,
  });

  const talkBack = bus.publishAndDeliver({
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

  bus.setDeliveryEnabled(false);
  const red = bus.publishAndDeliver({
    hop: "fan_out",
    fromRole: "orchestrator",
    toRoles: ["worker_a", "worker_b"],
    task: "falsify-should-be-silent",
    body: "FALSIFY MARKER — must not appear if delivery off",
  });
  bus.setDeliveryEnabled(true);
  const green = bus.publishAndDeliver({
    hop: "fan_out",
    fromRole: "orchestrator",
    toRoles: ["worker_a", "worker_b"],
    task: "falsify-restore",
    body: "RESTORE MARKER — delivery back on",
  });

  return {
    fanOut,
    submissions: { worker_a: subA, worker_b: subB },
    talkBack,
    falsify: { red, green },
  };
}

export function expectedProofRoles(): A2aRole[] {
  return ["orchestrator", "worker_a", "worker_b", "reviewer"];
}
