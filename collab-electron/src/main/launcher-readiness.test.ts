import { expect, test } from "bun:test";
import { createLauncherReadinessWaiter } from "./launcher-readiness";

test("readiness accepts one READY followed by COMMIT across split chunks", async () => {
  const waiter = createLauncherReadinessWaiter("session-a", "nonce", 1_000);
  expect(waiter.sessionId).toBe("session-a");
  waiter.push(Buffer.from("vendor output\r\nQF_LAUNCH_REA"));
  waiter.push(Buffer.from("DY nonce\r\nQF_LAUNCH_COM"));
  waiter.push(Buffer.from("MIT nonce\r\n"));
  await expect(waiter.wait()).resolves.toBeUndefined();
});

test("readiness rejects duplicate READY across separate chunks before COMMIT", async () => {
  const waiter = createLauncherReadinessWaiter("session-a", "nonce", 1_000);
  waiter.push(Buffer.from("QF_LAUNCH_READY nonce\n"));
  waiter.push(Buffer.from("QF_LAUNCH_READY nonce\n"));
  waiter.push(Buffer.from("QF_LAUNCH_COMMIT nonce\n"));
  await expect(waiter.wait()).rejects.toThrow(/duplicated/);
});

test("readiness rejects mismatch and COMMIT-before-READY", async () => {
  const mismatch = createLauncherReadinessWaiter("session-a", "right", 1_000);
  mismatch.push(Buffer.from("QF_LAUNCH_READY wrong\n"));
  await expect(mismatch.wait()).rejects.toThrow(/mismatched/);

  const unordered = createLauncherReadinessWaiter("session-a", "nonce", 1_000);
  unordered.push(Buffer.from("QF_LAUNCH_COMMIT nonce\n"));
  await expect(unordered.wait()).rejects.toThrow(/without exactly one READY/);
});
