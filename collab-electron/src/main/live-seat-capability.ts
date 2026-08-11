/**
 * Process-local authentication for one admitted native-TUI seat.
 *
 * This registry deliberately has no persistence: a capability is valid only while
 * the app still owns the exact PTY that received it. It is an app-boundary
 * credential, not Kernel truth and not a sandbox against the seat itself.
 */
import { randomBytes } from "node:crypto";

type LiveSeat = {
  sessionId: string;
  role: string;
  ptySessionId: string | null;
};

const seats = new Map<string, LiveSeat>();

export function mintLiveSeatCapability(sessionId: string, role: string): string {
  const capability = randomBytes(32).toString("base64url");
  seats.set(capability, { sessionId, role, ptySessionId: null });
  return capability;
}

export function bindLiveSeatCapability(
  capability: string,
  sessionId: string,
  role: string,
  ptySessionId: string,
): void {
  const seat = seats.get(capability);
  if (!seat || seat.sessionId !== sessionId || seat.role !== role || seat.ptySessionId) {
    throw new Error("live seat capability cannot be bound");
  }
  seat.ptySessionId = ptySessionId;
}

export function requireLiveSeatCapability(
  capability: unknown,
  sessionId: unknown,
  role: unknown,
): { sessionId: string; role: string; ptySessionId: string } {
  if (typeof capability !== "string" || capability.length === 0) {
    throw new Error("live seat capability is required");
  }
  const seat = seats.get(capability);
  if (
    !seat
    || seat.ptySessionId === null
    || seat.sessionId !== sessionId
    || seat.role !== role
  ) {
    throw new Error("live seat capability is invalid");
  }
  return { sessionId: seat.sessionId, role: seat.role, ptySessionId: seat.ptySessionId };
}

export function revokeLiveSeatCapability(capability: string | undefined): void {
  if (capability) seats.delete(capability);
}
