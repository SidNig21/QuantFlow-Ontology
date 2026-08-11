import { expect, test } from "bun:test";
import {
  bindLiveSeatCapability,
  mintLiveSeatCapability,
  requireLiveSeatCapability,
  revokeLiveSeatCapability,
} from "./live-seat-capability";

test("live seat capability is exact-seat scoped and revoked without persistence", () => {
  const capability = mintLiveSeatCapability("session-a", "worker");
  expect(() => requireLiveSeatCapability(capability, "session-a", "worker")).toThrow(
    /invalid/,
  );
  bindLiveSeatCapability(capability, "session-a", "worker", "pty-a");
  expect(requireLiveSeatCapability(capability, "session-a", "worker")).toEqual({
    sessionId: "session-a",
    role: "worker",
    ptySessionId: "pty-a",
  });
  expect(() => requireLiveSeatCapability(capability, "session-b", "worker")).toThrow(
    /invalid/,
  );
  expect(() => requireLiveSeatCapability("wrong", "session-a", "worker")).toThrow(
    /invalid/,
  );
  revokeLiveSeatCapability(capability);
  expect(() => requireLiveSeatCapability(capability, "session-a", "worker")).toThrow(
    /invalid/,
  );
});
