import { expect, test } from "bun:test";
import { resolveLivePeerRecipient } from "./live-peer-recipient";

function deps(overrides: Partial<Parameters<typeof resolveLivePeerRecipient>[1]> = {}) {
  return {
    ptyIdsForRole: () => ["pty-worker"],
    kernelSessionForPty: () => "session-worker",
    getSession: () => ({ id: "session-worker", status: "running" }),
    identityForSession: () => ({ sessionId: "session-worker", role: "worker" }),
    ...overrides,
  };
}

test("live recipient requires one role PTY mapped to the exact running Kernel session", () => {
  expect(resolveLivePeerRecipient("worker", deps())).toEqual({
    sessionId: "session-worker",
    role: "worker",
  });
  expect(() => resolveLivePeerRecipient("worker", deps({ ptyIdsForRole: () => [] })))
    .toThrow(/exactly one live native PTY/);
  expect(() => resolveLivePeerRecipient("worker", deps({
    ptyIdsForRole: () => ["pty-a", "pty-b"],
  }))).toThrow(/exactly one live native PTY/);
  expect(() => resolveLivePeerRecipient("worker", deps({
    kernelSessionForPty: () => undefined,
  }))).toThrow(/not owned by a Kernel native session/);
  expect(() => resolveLivePeerRecipient("worker", deps({
    getSession: () => ({ id: "session-worker", status: "closed" }),
  }))).toThrow(/not running/);
  expect(() => resolveLivePeerRecipient("worker", deps({
    identityForSession: () => ({ sessionId: "session-worker", role: "orchestrator" }),
  }))).toThrow(/role mismatch/);
});
