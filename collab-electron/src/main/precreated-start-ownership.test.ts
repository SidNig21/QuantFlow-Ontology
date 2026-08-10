import { expect, test } from "bun:test";
import { invokePrecreatedStart } from "./precreated-start-ownership";

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
