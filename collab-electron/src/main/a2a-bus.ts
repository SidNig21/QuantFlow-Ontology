/**
 * WO-008e — Electron adapter over shared A2A bus core.
 * Instance-scoped; default delivery channel is display-only.
 */
import { join } from "node:path";
import {
  createA2aBus,
  type A2aBus,
  type A2aRole,
  type A2aSeat,
  type DeliveryChannel,
  type PublishAndDeliverOpts,
  type PublishAndDeliverResult,
} from "../../../species/hermes/a2a-core.ts";
import { createA2aArtifactStore } from "./a2a-artifact-store";
import { getArtifactRoot, kernelExecute, type TraceContext } from "./kernel";
import { displayOnSession } from "./pty-display";
import { writeToSession } from "./pty";

export type {
  A2aBus,
  A2aRole,
  A2aSeat,
  DeliveryChannel,
  PublishAndDeliverOpts,
  PublishAndDeliverResult,
};

/** Electron seat with PTY id mirrored into core `deliveryId`. */
export type ElectronA2aSeat = {
  role: A2aRole;
  sessionId: string;
  ptySessionId: string;
};

function newTrace(): TraceContext {
  return {
    trace_id: crypto.randomUUID(),
    span_id: crypto.randomUUID(),
  };
}

export function toCoreSeat(seat: ElectronA2aSeat): A2aSeat {
  return {
    role: seat.role,
    sessionId: seat.sessionId,
    deliveryId: seat.ptySessionId,
  };
}

export function createElectronA2aBus(opts?: {
  defaultChannel?: DeliveryChannel;
  artifactDir?: string;
}): A2aBus {
  const artifactStore = createA2aArtifactStore({
    ...(opts?.artifactDir !== undefined
      ? { artifactDir: opts.artifactDir }
      : {}),
    artifactRoot: getArtifactRoot,
    publish: (input) => kernelExecute("publish_artifact", input, newTrace()),
  });

  return createA2aBus({
    artifactDir: artifactStore.artifactDir,
    defaultChannel: opts?.defaultChannel ?? "display",
    writeFile: artifactStore.writeFile,
    joinPath: join,
    publishArtifact: artifactStore.publishArtifact,
    deliver: ({ seat, text, channel }) => {
      if (channel === "display" || channel === "both") {
        displayOnSession(seat.deliveryId, text);
      }
      if (channel === "stdin" || channel === "both") {
        writeToSession(seat.deliveryId, text);
      }
    },
  });
}

/** IPC-facing registry — each spawnSeats gets its own bus. */
const buses = new Map<string, A2aBus>();

export function createRegisteredElectronBus(opts?: {
  defaultChannel?: DeliveryChannel;
}): { busId: string; bus: A2aBus } {
  const busId = crypto.randomUUID();
  const bus = createElectronA2aBus(opts);
  buses.set(busId, bus);
  return { busId, bus };
}

export function getRegisteredBus(busId: string): A2aBus {
  const bus = buses.get(busId);
  if (!bus) {
    throw new Error(`a2a-bus: unknown busId ${busId}`);
  }
  return bus;
}

export function dropRegisteredBus(busId: string): void {
  buses.delete(busId);
}
