import { expect, test } from "bun:test";
import {
  assertPrecreatedStartOwnership,
  invokePrecreatedStart,
} from "./precreated-start-ownership";

test("precreated start callback receives the authenticated caller identity", async () => {
  const seen: unknown[] = [];
  await invokePrecreatedStart(
    { sessionId: "orchestrator-session", role: "orchestrator" },
    "worker-session",
    async (caller, sessionId) => seen.push(caller, sessionId),
  );
  expect(seen).toEqual([
    { sessionId: "orchestrator-session", role: "orchestrator" },
    "worker-session",
  ]);
});

test("precreated start accepts only the authenticated hiring orchestrator", () => {
  const link = [{ from_id: "orchestrator-a", to_id: "worker-session" }];
  expect(() =>
    assertPrecreatedStartOwnership("orchestrator-a", "worker-session", link)
  ).not.toThrow();
  expect(() =>
    assertPrecreatedStartOwnership("orchestrator-b", "worker-session", link)
  ).toThrow(/authenticated caller/);
  expect(() =>
    assertPrecreatedStartOwnership("orchestrator-a", "worker-session", [])
  ).toThrow(/exactly one/);
  expect(() =>
    assertPrecreatedStartOwnership("orchestrator-a", "worker-session", [...link, ...link])
  ).toThrow(/exactly one/);
});
