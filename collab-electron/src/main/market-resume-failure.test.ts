import { expect, test } from "bun:test";
import { handleMarketResumeFailure } from "./market-resume-failure";

test("resume setup failure preserves ambient participants before handoff and stops exact replacement after handoff", async () => {
  const calls: string[] = [];
  const deps = {
    resultCommitted: () => false,
    coordinatorHasOtherOpenWork: () => false,
    workerRunning: () => true,
    failWorker: (id: string, reason: string) => { calls.push(`fail:${id}:${reason}`); },
    stopParticipant: async (id: string, close: boolean) => { calls.push(`stop:${id}:${close}`); },
  };
  await handleMarketResumeFailure({ committed: false, dispatchAttempted: false, worker: { sessionId: "ambient-worker", requestOwned: false }, coordinator: { sessionId: "new-coordinator", requestOwned: true } }, deps);
  expect(calls).toEqual(["stop:new-coordinator:true"]);
  calls.length = 0;
  await handleMarketResumeFailure({ committed: true, dispatchAttempted: false, worker: { sessionId: "ambient-worker", requestOwned: false }, coordinator: { sessionId: "new-coordinator", requestOwned: true } }, deps);
  expect(calls).toEqual(["fail:ambient-worker:market_resume_setup_failed", "stop:ambient-worker:false", "stop:new-coordinator:true"]);
});

test("resume dispatch failure preserves a raced result and exposes unconfirmed teardown", async () => {
  const calls: string[] = [];
  let result = true;
  const preserved = await handleMarketResumeFailure({ committed: true, dispatchAttempted: true, worker: { sessionId: "worker", requestOwned: true }, coordinator: { sessionId: "coordinator", requestOwned: true } }, {
    resultCommitted: () => result,
    coordinatorHasOtherOpenWork: () => false,
    workerRunning: () => true,
    failWorker: () => calls.push("failed"),
    stopParticipant: async () => { calls.push("stopped"); },
  });
  expect(preserved).toEqual([]);
  expect(calls).toEqual([]);

  result = false;
  const teardownError = new Error("termination not confirmed");
  const failures = await handleMarketResumeFailure({ committed: true, dispatchAttempted: true, worker: { sessionId: "worker", requestOwned: true }, coordinator: { sessionId: "coordinator", requestOwned: false } }, {
    resultCommitted: () => result,
    coordinatorHasOtherOpenWork: () => false,
    workerRunning: () => true,
    failWorker: (_id, reason) => calls.push(reason),
    stopParticipant: async () => { throw teardownError; },
  });
  expect(calls).toContain("market_resume_dispatch_failed");
  expect(failures).toEqual([teardownError]);
});

test("resume failure preserves a request-owned coordinator that now owns another open Task", async () => {
  const calls: string[] = [];
  await handleMarketResumeFailure({ committed: true, dispatchAttempted: false, worker: { sessionId: "worker", requestOwned: false }, coordinator: { sessionId: "coordinator", requestOwned: true } }, {
    resultCommitted: () => false,
    coordinatorHasOtherOpenWork: (sessionId) => sessionId === "coordinator",
    workerRunning: () => true,
    failWorker: (_id, reason) => calls.push(reason),
    stopParticipant: async (id) => { calls.push(`stop:${id}`); },
  });
  expect(calls).toEqual(["market_resume_setup_failed", "stop:worker"]);
});
